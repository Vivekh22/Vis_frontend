/**
 * SuggestionService.ts — services/
 *
 * Purpose:
 *   Orchestrates AI-powered suggestions at natural checkpoints throughout
 *   the platform. Interface-injected, mock-backed — there is no real AI
 *   backend yet. When a real backend exists, only the repository
 *   implementation changes; this service's contract stays the same.
 *
 * Key security requirement — chat context scoping:
 *   When an Admin or Super Admin triggers a suggestion while impersonating
 *   or acting on a specific client, the chat service call must ONLY include
 *   that client's data — never a broader context. This is enforced in
 *   buildChatContextClientId() which reads the impersonation session from
 *   SessionStore and strict-scopes the context to the impersonated client.
 *   An Admin viewing Client A's data can never receive chat responses that
 *   reference Client B's data.
 *
 * Approval-bypass prevention:
 *   acceptSuggestion() fully builds AND submits the suggested change (e.g.
 *   a fully-completed, submitted campaign), but it MUST land in
 *   pending_approval — never bypassing the approval workflow. This is
 *   enforced by delegating to CampaignService.createCampaign() followed by
 *   CampaignService.submitForApproval(), which uses
 *   Campaign.submitForApproval() → Campaign.transitionStatus('pending_approval').
 *   The Campaign entity's state machine makes it impossible to skip
 *   pending_approval — there is no direct draft → running transition:
 *     draft → pending_approval → running → paused → archived
 *   So an AI-accepted suggestion CANNOT land directly in 'running'.
 */
import { authStore } from '../platform/state/AuthStore';
import { sessionStore } from '../platform/state/SessionStore';
import { DomainError } from '../core/errors/DomainError';
import { PermissionDeniedError } from '../core/errors/PermissionDeniedError';
import type { CampaignService, CampaignCreateData } from './CampaignService';
import type { Campaign } from '../core/entities/Campaign';

export interface SuggestionContext {
  /** The page/feature where the checkpoint was triggered. */
  source: string;
  /** The entity type the suggestion concerns (e.g. 'campaign', 'fund'). */
  entityType: string;
  /** The client ID the suggestion is scoped to. */
  clientId: string;
  /** Additional context data for the suggestion engine. */
  metadata?: Record<string, unknown>;
}

export interface SuggestionActionData {
  type: 'create_campaign';
  campaignData: CampaignCreateData;
}

export interface Suggestion {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: 'optimization' | 'budget' | 'targeting' | 'creative' | 'general';
  readonly confidence: number;
  readonly actionable: boolean;
  /** If actionable, the data needed to build and submit the suggested change. */
  readonly actionData?: SuggestionActionData;
}

export interface ChatMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: Date;
}

export interface ChatThread {
  readonly suggestionId: string;
  readonly messages: ChatMessage[];
  /** The strictly-scoped client context — never broader than the impersonated client. */
  readonly contextClientId: string;
}

export interface SuggestionRepository {
  getCheckpointSuggestion(context: SuggestionContext): Promise<Suggestion | null>;
  getSuggestion(id: string): Promise<Suggestion | null>;
  getChatThread(suggestionId: string): Promise<ChatThread | null>;
  sendChatMessage(suggestionId: string, message: string, contextClientId: string): Promise<ChatMessage>;
  markAccepted(suggestionId: string): Promise<void>;
}

export class SuggestionService {
  constructor(
    private readonly suggestionRepo: SuggestionRepository,
    private readonly campaignService: CampaignService,
  ) {}

  async getCheckpointSuggestion(context: SuggestionContext): Promise<Suggestion | null> {
    return await this.suggestionRepo.getCheckpointSuggestion(context);
  }

  async getSuggestion(id: string): Promise<Suggestion | null> {
    return await this.suggestionRepo.getSuggestion(id);
  }

  async getChatThread(suggestionId: string): Promise<ChatThread | null> {
    return await this.suggestionRepo.getChatThread(suggestionId);
  }

  /**
   * Sends a chat message in the suggestion's chat thread.
   *
   * The chat context is strictly scoped to the client the user is acting
   * on — when impersonating, this is the impersonated client; otherwise
   * it's the user's own client. The AI backend must never receive data
   * outside this scope.
   */
  async sendChatMessage(suggestionId: string, message: string): Promise<ChatMessage> {
    const contextClientId = this.buildChatContextClientId();
    return await this.suggestionRepo.sendChatMessage(suggestionId, message, contextClientId);
  }

  /**
   * Accepts a suggestion — fully builds AND submits the suggested change.
   *
   * CRITICAL — APPROVAL-BYPASS PREVENTION:
   *   This method creates a campaign and submits it for approval. The
   *   campaign lands in 'pending_approval' — NEVER in 'running'. The
   *   Campaign entity's state machine (draft → pending_approval → running)
   *   makes it structurally impossible to skip approval: there is no
   *   direct draft → running transition.
   *
   *   An explicit test (AiSuggestionApprovalBypass.test.ts) proves this
   *   by verifying the campaign's status is 'pending_approval' after
   *   acceptance, not 'running'.
   */
  async acceptSuggestion(suggestionId: string): Promise<Campaign> {
    const suggestion = await this.suggestionRepo.getSuggestion(suggestionId);
    if (!suggestion) {
      throw new DomainError(`Suggestion not found: ${suggestionId}`);
    }
    if (!suggestion.actionable || !suggestion.actionData) {
      throw new DomainError(`Suggestion is not actionable: ${suggestionId}`);
    }

    const action = suggestion.actionData;
    if (action.type === 'create_campaign') {
      // Step 1: Create the campaign (starts in 'draft' status)
      const campaign = await this.campaignService.createCampaign(action.campaignData);
      // Step 2: Submit for approval — lands in 'pending_approval', NOT 'running'
      // The Campaign state machine forbids draft → running directly.
      const submitted = await this.campaignService.submitForApproval(campaign.id);
      // Mark the suggestion as accepted in the suggestion store
      await this.suggestionRepo.markAccepted(suggestionId);
      return submitted;
    }

    throw new DomainError(`Unknown suggestion action type: ${action.type as string}`);
  }

  /**
   * Builds the chat context's client ID — strictly scoped to the
   * impersonated client when an Admin/Super Admin is impersonating.
   *
   * SECURITY: When impersonating, the chat service call must ONLY include
   * the impersonated client's data — never a broader context. This prevents
   * an Admin viewing Client A's data from accidentally receiving chat
   * responses that reference Client B's data.
   *
   * An explicit test (AiSuggestionChatContextScoping.test.ts) proves this
   * by verifying the contextClientId passed to the repository matches the
   * impersonated client, not the Admin's own ID.
   */
  private buildChatContextClientId(): string {
    const session = sessionStore.getState();
    if (session.isImpersonating && session.impersonatedEntityName) {
      return session.impersonatedEntityName;
    }
    const user = authStore.getState().currentUser;
    if (!user) {
      throw new PermissionDeniedError(
        'Cannot send chat message: no authenticated user',
        'view',
        'none',
      );
    }
    return user.id;
  }
}