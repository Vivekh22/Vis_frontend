/**
 * index.ts — services/
 *
 * Composition root. Creates service instances with real repository
 * implementations by default, or mock repositories when VITE_USE_MOCK_DATA=true.
 *
 * Part 6 swap: only this file changed — no service code needed modification
 * because every service depends on repository interfaces, not concrete
 * classes. The Part 5 design held up perfectly.
 */
import { PermissionService } from './PermissionService';
import { AuthService } from './AuthService';
import { ImpersonationService } from './ImpersonationService';
import { NotificationService } from './NotificationService';
import { CampaignService } from './CampaignService';
import { CreativeService } from './CreativeService';
import { FundService } from './FundService';
import { ApprovalService } from './ApprovalService';
import { ReportService } from './ReportService';
import { DashboardService } from './DashboardService';
import { CreativeLibraryService } from './CreativeLibraryService';
import { AppListService } from './AppListService';
import { AudienceService } from './AudienceService';
import { UploadService } from './UploadService';
import { InvoiceService } from './InvoiceService';
import { SupportService } from './SupportService';
import { ApiKeyService } from './ApiKeyService';
import { IntegrationService } from './IntegrationService';
import { TeamService } from './TeamService';
import { SettingsService } from './SettingsService';
import { ClientService } from './ClientService';
import { PlatformSettingsService } from './PlatformSettingsService';
import { RegistrationService } from './RegistrationService';
import { RoleManagementService } from './RoleManagementService';
import { FeatureFlagService } from './FeatureFlagService';
import { MarginService } from './MarginService';
import { ExchangeService } from './ExchangeService';
import { PlatformConnectionService } from './PlatformConnectionService';
import { MasterIntegrationService } from './MasterIntegrationService';
import { PlatformApiService } from './PlatformApiService';
import { ThirdPartyStatusService } from './ThirdPartyStatusService';
import { ModelManagementService } from './ModelManagementService';
import { SuggestionBusService } from './SuggestionBusService';
import { InfrastructureHealthService } from './InfrastructureHealthService';
import { GeoEdgeService } from './GeoEdgeService';
import { FraudSecurityService } from './FraudSecurityService';
import { ComplianceService } from './ComplianceService';
import { SuggestionService } from './SuggestionService';

import { isMockMode, getApiBaseUrl } from '../config/env';
import { ApiClient } from '../repositories/ApiClient';
import { UserRepository } from '../repositories/UserRepository';
import { AuthRepository } from '../repositories/AuthRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { CampaignRepository } from '../repositories/CampaignRepository';
import { CreativeRepository } from '../repositories/CreativeRepository';
import { FundRepository } from '../repositories/FundRepository';
import { ApprovalRepository } from '../repositories/ApprovalRepository';
import { ReportRepository } from '../repositories/ReportRepository';
import { DashboardRepositoryImpl } from '../repositories/DashboardRepository';
import { CreativeLibraryRepositoryImpl } from '../repositories/CreativeLibraryRepository';
import { AppListRepository } from '../repositories/AppListRepository';
import { AudienceRepository } from '../repositories/AudienceRepository';
import { UploadRepositoryImpl } from '../repositories/UploadRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { SupportRepository } from '../repositories/SupportRepository';
import { ApiKeyRepository } from '../repositories/ApiKeyRepository';
import { IntegrationRepository } from '../repositories/IntegrationRepository';
import { TeamRepository } from '../repositories/TeamRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';

import { MockUserRepository } from '../repositories/mocks/MockUserRepository';
import { MockAuthRepository } from '../repositories/mocks/MockAuthRepository';
import { MockNotificationRepository } from '../repositories/mocks/MockNotificationRepository';
import { MockCampaignRepository } from '../repositories/mocks/MockCampaignRepository';
import { MockCreativeRepository } from '../repositories/mocks/MockCreativeRepository';
import { MockFundRepository } from '../repositories/mocks/MockFundRepository';
import { MockApprovalRepository } from '../repositories/mocks/MockApprovalRepository';
import { MockReportRepository } from '../repositories/mocks/MockReportRepository';
import { MockDashboardRepository } from '../repositories/mocks/MockDashboardRepository';
import { MockCreativeLibraryRepository } from '../repositories/mocks/MockCreativeLibraryRepository';
import { MockAppListRepository } from '../repositories/mocks/MockAppListRepository';
import { MockAudienceRepository } from '../repositories/mocks/MockAudienceRepository';
import { MockUploadRepository } from '../repositories/mocks/MockUploadRepository';
import { MockInvoiceRepository } from '../repositories/mocks/MockInvoiceRepository';
import { MockSupportRepository } from '../repositories/mocks/MockSupportRepository';
import { MockApiKeyRepository } from '../repositories/mocks/MockApiKeyRepository';
import { MockIntegrationRepository } from '../repositories/mocks/MockIntegrationRepository';
import { MockTeamRepository } from '../repositories/mocks/MockTeamRepository';
import { MockSettingsRepository } from '../repositories/mocks/MockSettingsRepository';
import { MockClientRepository } from '../repositories/mocks/MockClientRepository';
import { MockPlatformSettingsRepository } from '../repositories/mocks/MockPlatformSettingsRepository';
import { MockRegistrationRepository } from '../repositories/mocks/MockRegistrationRepository';
import { MockRoleManagementRepository } from '../repositories/mocks/MockRoleManagementRepository';
import { MockFeatureFlagRepository } from '../repositories/mocks/MockFeatureFlagRepository';
import { MockMarginRepository } from '../repositories/mocks/MockMarginRepository';
import { MockExchangeRepository } from '../repositories/mocks/MockExchangeRepository';
import { MockPlatformConnectionRepository } from '../repositories/mocks/MockPlatformConnectionRepository';
import { MockMasterIntegrationRepository } from '../repositories/mocks/MockMasterIntegrationRepository';
import { MockPlatformApiRepository } from '../repositories/mocks/MockPlatformApiRepository';
import { MockThirdPartyStatusRepository } from '../repositories/mocks/MockThirdPartyStatusRepository';
import { MockModelManagementRepository } from '../repositories/mocks/MockModelManagementRepository';
import { MockSuggestionBusRepository } from '../repositories/mocks/MockSuggestionBusRepository';
import { MockInfrastructureHealthRepository } from '../repositories/mocks/MockInfrastructureHealthRepository';
import { MockGeoEdgeRepository } from '../repositories/mocks/MockGeoEdgeRepository';
import { MockFraudSecurityRepository } from '../repositories/mocks/MockFraudSecurityRepository';
import { MockComplianceRepository } from '../repositories/mocks/MockComplianceRepository';
import { MockSuggestionRepository } from '../repositories/mocks/MockSuggestionRepository';
import { MockAdminUserRepository } from '../repositories/mocks/MockAdminUserRepository';

// Session-expiry handler — injected into ApiClient to avoid a circular
// dependency between the data layer (repositories) and the service layer
// (AuthService). When ApiClient gets a 401, it calls this callback; the
// callback is wired here at the composition root where both layers are
// available.
let _onUnauthorized: (() => void) | undefined;
export function setUnauthorizedHandler(handler: () => void): void {
  _onUnauthorized = handler;
}

const useMocks = isMockMode();

// Single ApiClient instance shared by all real repositories.
const apiClient = new ApiClient(getApiBaseUrl(), () => _onUnauthorized?.());

// Repository construction — real or mock based on env flag.
const userRepo = useMocks
  ? new MockUserRepository()
  : new UserRepository(apiClient);
const authRepo = useMocks
  ? new MockAuthRepository()
  : new AuthRepository(apiClient);
const notifRepo = useMocks
  ? new MockNotificationRepository()
  : new NotificationRepository(apiClient);
const campaignRepo = useMocks
  ? new MockCampaignRepository()
  : new CampaignRepository(apiClient);
const creativeRepo = useMocks
  ? new MockCreativeRepository()
  : new CreativeRepository(apiClient);
const fundRepo = useMocks
  ? new MockFundRepository()
  : new FundRepository(apiClient);
const approvalRepo = useMocks
  ? new MockApprovalRepository()
  : new ApprovalRepository(apiClient);
const reportRepo = useMocks
  ? new MockReportRepository()
  : new ReportRepository(apiClient);
const dashboardRepo = useMocks
  ? new MockDashboardRepository()
  : new DashboardRepositoryImpl(apiClient);

// PlatformSettings created early — ApprovalService depends on it for
// SLA threshold configuration (Part 12 retrofit replacing Part 5's hardcoded 4).
const platformSettingsRepo = new MockPlatformSettingsRepository();
export const platformSettingsService = new PlatformSettingsService(platformSettingsRepo);

export const permissionService = new PermissionService(userRepo);
export const authService = new AuthService(authRepo);
export const impersonationService = new ImpersonationService(permissionService);
export const notificationService = new NotificationService(notifRepo);
export const campaignService = new CampaignService(campaignRepo);
export const creativeService = new CreativeService(creativeRepo);
export const fundService = new FundService(fundRepo);
export const approvalService = new ApprovalService(approvalRepo, platformSettingsService);
export const reportService = new ReportService(reportRepo);
export const dashboardService = new DashboardService(dashboardRepo);

const creativeLibraryRepo = useMocks
  ? new MockCreativeLibraryRepository()
  : new CreativeLibraryRepositoryImpl(apiClient);
const appListRepo = useMocks
  ? new MockAppListRepository()
  : new AppListRepository(apiClient);
const audienceRepo = useMocks
  ? new MockAudienceRepository()
  : new AudienceRepository(apiClient);
const uploadRepo = useMocks
  ? new MockUploadRepository()
  : new UploadRepositoryImpl(apiClient);

export const creativeLibraryService = new CreativeLibraryService(creativeLibraryRepo);
export const appListService = new AppListService(appListRepo);
export const audienceService = new AudienceService(audienceRepo);
export const uploadService = new UploadService(uploadRepo);

const invoiceRepo = useMocks
  ? new MockInvoiceRepository()
  : new InvoiceRepository(apiClient);
const supportRepo = useMocks
  ? new MockSupportRepository()
  : new SupportRepository(apiClient);
const apiKeyRepo = useMocks
  ? new MockApiKeyRepository()
  : new ApiKeyRepository(apiClient);
const integrationRepo = useMocks
  ? new MockIntegrationRepository()
  : new IntegrationRepository(apiClient);
const teamRepo = useMocks
  ? new MockTeamRepository()
  : new TeamRepository(apiClient);
const settingsRepo = useMocks
  ? new MockSettingsRepository()
  : new SettingsRepository(apiClient);

export const invoiceService = new InvoiceService(invoiceRepo);
export const supportService = new SupportService(supportRepo);
export const apiKeyService = new ApiKeyService(apiKeyRepo);
export const integrationService = new IntegrationService(integrationRepo);
export const teamService = new TeamService(teamRepo);
export const settingsService = new SettingsService(settingsRepo);

const clientRepo = useMocks
  ? new MockClientRepository()
  : new MockClientRepository(); // Real repo not implemented — mock until backend
export const clientService = new ClientService(clientRepo);

// Super Admin services (Part 12)
const registrationRepo = new MockRegistrationRepository();
export const registrationService = new RegistrationService(registrationRepo, platformSettingsService);

const roleManagementRepo = new MockRoleManagementRepository();
export const roleManagementService = new RoleManagementService(roleManagementRepo);

const featureFlagRepo = new MockFeatureFlagRepository();
export const featureFlagService = new FeatureFlagService(featureFlagRepo);

const marginRepo = new MockMarginRepository();
export const marginService = new MarginService(marginRepo);

const exchangeRepo = new MockExchangeRepository();
export const exchangeService = new ExchangeService(exchangeRepo);

const adminUserRepo = new MockAdminUserRepository();
export { adminUserRepo };

// Part 13 — Super Admin: Platform Connections, Integrations & APIs,
// Taranga Governance, System Health, Trust & Compliance
const platformConnectionRepo = new MockPlatformConnectionRepository();
export const platformConnectionService = new PlatformConnectionService(platformConnectionRepo);

const masterIntegrationRepo = new MockMasterIntegrationRepository();
export const masterIntegrationService = new MasterIntegrationService(masterIntegrationRepo);

const platformApiRepo = new MockPlatformApiRepository();
export const platformApiService = new PlatformApiService(platformApiRepo);

const thirdPartyStatusRepo = new MockThirdPartyStatusRepository();
export const thirdPartyStatusService = new ThirdPartyStatusService(thirdPartyStatusRepo);

const modelManagementRepo = new MockModelManagementRepository();
export const modelManagementService = new ModelManagementService(modelManagementRepo);

const suggestionBusRepo = new MockSuggestionBusRepository();
export const suggestionBusService = new SuggestionBusService(suggestionBusRepo);

const infrastructureHealthRepo = new MockInfrastructureHealthRepository();
export const infrastructureHealthService = new InfrastructureHealthService(infrastructureHealthRepo);

const geoEdgeRepo = new MockGeoEdgeRepository();
export const geoEdgeService = new GeoEdgeService(geoEdgeRepo);

const fraudSecurityRepo = new MockFraudSecurityRepository();
export const fraudSecurityService = new FraudSecurityService(fraudSecurityRepo);

const complianceRepo = new MockComplianceRepository();
export const complianceService = new ComplianceService(complianceRepo);

// Part 14 — AI Suggestion Feature
const suggestionRepo = new MockSuggestionRepository();
export const suggestionService = new SuggestionService(suggestionRepo, campaignService);