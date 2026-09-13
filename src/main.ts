/**
 * main.ts — application entry point.
 *
 * Purpose:
 *   Boots the VispriscaAds SPA. Initializes the theme system, injects design
 *   tokens, sets up the route table with layout-wrapped pages, and starts the
 *   router.
 *
 * Part 7: The demo login mechanism from earlier parts has been fully replaced.
 *   /login and /register are public routes (requiredRole: null). All other
 *   routes genuinely require authentication via RouteGuard — unauthenticated
 *   users are redirected to /login. Role-based post-login redirect is handled
 *   by LoginPageElement, which reads the role from AuthService.login()'s
 *   returned User entity (populated from the backend response, not guessed).
 */
import { initThemeSystem } from './styles/theme';
import { TOKEN_CSS_TEXT } from './styles/tokens';
import { Route } from './platform/router/Route';
import { Router } from './platform/router/Router';
import { ClientLayoutElement } from './layouts/ClientLayoutElement';
import { AdminLayoutElement } from './layouts/AdminLayoutElement';
import { SuperAdminLayoutElement } from './layouts/SuperAdminLayoutElement';
import { DashboardPageElement } from './pages/client/dashboard/DashboardPageElement';
import { OverviewPageElement as AdminOverviewPageElement } from './pages/admin/overview/OverviewPageElement';
import { OverviewPageElement as SuperAdminOverviewPageElement } from './pages/super-admin/overview/OverviewPageElement';
import { NewRegistrationsPageElement } from './pages/super-admin/admin-panel/new-registrations/NewRegistrationsPageElement';
import { UserManagementPageElement } from './pages/super-admin/admin-panel/user-management/UserManagementPageElement';
import { RolePermissionBuilderPageElement } from './pages/super-admin/admin-panel/role-permission-builder/RolePermissionBuilderPageElement';
import { MarginManagementPageElement } from './pages/super-admin/admin-panel/margin-management/MarginManagementPageElement';
import { ExchangeManagementPageElement } from './pages/super-admin/admin-panel/exchange-management/ExchangeManagementPageElement';
import { FeatureGatingPageElement } from './pages/super-admin/admin-panel/feature-gating/FeatureGatingPageElement';
import { PendingApprovalsPageElement as SuperAdminPendingApprovalsPageElement } from './pages/super-admin/admin-panel/pending-approvals/PendingApprovalsPageElement';
import { ActivityLogPageElement as SuperAdminActivityLogPageElement } from './pages/super-admin/admin-panel/activity-log/ActivityLogPageElement';
import { PlatformSettingsPageElement } from './pages/super-admin/admin-panel/platform-settings/PlatformSettingsPageElement';
import { ConnectedExchangesPageElement } from './pages/super-admin/platform-connections/connected-exchanges/ConnectedExchangesPageElement';
import { ConnectedPublishersPageElement } from './pages/super-admin/platform-connections/connected-publishers/ConnectedPublishersPageElement';
import { ConnectedDspsPageElement } from './pages/super-admin/platform-connections/connected-dsps/ConnectedDspsPageElement';
import { PlatformApiManagementPageElement } from './pages/super-admin/integrations-apis/platform-api-management/PlatformApiManagementPageElement';
import { MasterIntegrationListsPageElement } from './pages/super-admin/integrations-apis/master-integration-lists/MasterIntegrationListsPageElement';
import { ThirdPartyServiceStatusPageElement } from './pages/super-admin/integrations-apis/third-party-service-status/ThirdPartyServiceStatusPageElement';
import { ModelManagementPageElement } from './pages/super-admin/taranga-governance/model-management/ModelManagementPageElement';
import { SuggestionBusActivityPageElement } from './pages/super-admin/taranga-governance/suggestion-bus-activity/SuggestionBusActivityPageElement';
import { InfrastructureHealthPageElement } from './pages/super-admin/system-health/infrastructure-health/InfrastructureHealthPageElement';
import { GeoEdgeStatusPageElement } from './pages/super-admin/system-health/geo-edge-status/GeoEdgeStatusPageElement';
import { FraudSecurityOverviewPageElement } from './pages/super-admin/trust-compliance/fraud-security-overview/FraudSecurityOverviewPageElement';
import { ComplianceCenterPageElement } from './pages/super-admin/trust-compliance/compliance-center/ComplianceCenterPageElement';
import { LoginPageElement } from './pages/client/login/LoginPageElement';
import { RegistrationWizardElement } from './pages/client/registration/RegistrationWizardElement';
import { RegistrationStatusPageElement } from './pages/client/registration/RegistrationStatusPageElement';
import { StepWelcomeLogin } from './pages/client/registration/steps/StepWelcomeLogin';
import { CampaignListPageElement } from './pages/client/campaign/CampaignListPageElement';
import { CampaignWizardElement } from './pages/client/campaign/wizard/CampaignWizardElement';
import { CreativeListPageElement } from './pages/client/creatives/CreativeListPageElement';
import { CreativeWizardElement } from './pages/client/creatives/wizard/CreativeWizardElement';
import { AppListPageElement } from './pages/client/app-list/AppListPageElement';
import { AudiencePageElement } from './pages/client/audience/AudiencePageElement';
import { AudienceDetailsPageElement } from './pages/client/audience/details/AudienceDetailsPageElement';
import { FundPageElement } from './pages/client/fund/FundPageElement';
import { InvoicesBillingPageElement } from './pages/client/invoices-billing/InvoicesBillingPageElement';
import { ReportsPageElement } from './pages/client/reports/ReportsPageElement';
import { AccDetailsPageElement } from './pages/client/acc-details/AccDetailsPageElement';
import { IntegrationsPageElement } from './pages/client/integrations-api-keys/IntegrationsPageElement';
import { SupportPageElement } from './pages/client/support/SupportPageElement';
import { SettingsPageElement } from './pages/client/settings/SettingsPageElement';
import { NotificationCenterPageElement } from './pages/client/notification-center/NotificationCenterPageElement';
import { BidMultiplierPageElement } from './pages/client/bid-multiplier/BidMultiplierPageElement';
import { permissionService } from './services';
import { RouteGuard } from './platform/router/RouteGuard';
import { applyCspMeta } from './security/ContentSecurityPolicy';

// Side-effect import to ensure page components are registered (not tree-shaken).
import './pages/client/registration/steps/StepWelcomeLogin';

const root = document.getElementById('app-root');

window.addEventListener('error', (e) => {
  alert('Global Error: ' + e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  alert('Unhandled Promise Rejection: ' + (e.reason && e.reason.message ? e.reason.message : e.reason));
});

if (root instanceof HTMLElement) {
  // Inject structural design tokens at document level for light-DOM consumers.
  const tokenStyle = document.createElement('style');
  tokenStyle.id = 'va-tokens';
  tokenStyle.textContent = TOKEN_CSS_TEXT;
  document.head.appendChild(tokenStyle);

  // Initialize theme system (sets colors on documentElement, attaches media listener).
  initThemeSystem();

  // Apply Content Security Policy (Part 14 — real CSP defined in TypeScript,
  // applied at runtime, covering script-src, style-src, connect-src, img-src,
  // frame-src, etc.)
  applyCspMeta();

  // Wire the real PermissionService into RouteGuard, replacing the temporary
  // GrantBasedPermissionChecker from Part 1. This is the permanent implementation.
  RouteGuard.setPermissionChecker(permissionService);

  const routes = [
    // Public routes — no authentication required
    new Route({
      path: '/',
      component: LoginPageElement,
      requiredRole: null,
      requiredPermission: null,
    }),
    new Route({
      path: '/login',
      component: LoginPageElement,
      requiredRole: null,
      requiredPermission: null,
    }),
    new Route({
      path: '/register',
      component: RegistrationWizardElement,
      requiredRole: null,
      requiredPermission: null,
    }),
    new Route({
      path: '/register/status',
      component: RegistrationStatusPageElement,
      requiredRole: null,
      requiredPermission: null,
    }),
    new Route({
      path: '/register/welcome',
      component: StepWelcomeLogin,
      requiredRole: null,
      requiredPermission: null,
    }),
    // Authenticated routes — RouteGuard blocks unauthenticated access,
    // redirecting to /login
    new Route({
      path: '/client/dashboard',
      component: DashboardPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/admin/overview',
      component: AdminOverviewPageElement,
      requiredRole: ['admin'],
      requiredPermission: null,
      layoutComponent: AdminLayoutElement,
    }),
    new Route({
      path: '/client/campaigns',
      component: CampaignListPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/campaigns/new',
      component: CampaignWizardElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/creatives',
      component: CreativeListPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/creatives/new',
      component: CreativeWizardElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/bid-multiplier',
      component: BidMultiplierPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/app-lists',
      component: AppListPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/audiences',
      component: AudiencePageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/audiences/:id',
      component: AudienceDetailsPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/fund',
      component: FundPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/invoices',
      component: InvoicesBillingPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/reports',
      component: ReportsPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/acc-details',
      component: AccDetailsPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/integrations',
      component: IntegrationsPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/support',
      component: SupportPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/settings',
      component: SettingsPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/client/notifications',
      component: NotificationCenterPageElement,
      requiredRole: ['client'],
      requiredPermission: null,
      layoutComponent: ClientLayoutElement,
    }),
    new Route({
      path: '/super-admin/overview',
      component: SuperAdminOverviewPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/new-registrations',
      component: NewRegistrationsPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/user-management',
      component: UserManagementPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/role-permission-builder',
      component: RolePermissionBuilderPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/margin-management',
      component: MarginManagementPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/exchange-management',
      component: ExchangeManagementPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/feature-gating',
      component: FeatureGatingPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/pending-approvals',
      component: SuperAdminPendingApprovalsPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/activity-log',
      component: SuperAdminActivityLogPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/platform-settings',
      component: PlatformSettingsPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    // Part 13 — Platform Connections
    new Route({
      path: '/super-admin/connected-exchanges',
      component: ConnectedExchangesPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/connected-publishers',
      component: ConnectedPublishersPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/connected-dsps',
      component: ConnectedDspsPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    // Part 13 — Integrations & APIs
    new Route({
      path: '/super-admin/platform-api-management',
      component: PlatformApiManagementPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/master-integration-lists',
      component: MasterIntegrationListsPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/third-party-service-status',
      component: ThirdPartyServiceStatusPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    // Part 13 — Taranga Governance
    new Route({
      path: '/super-admin/model-management',
      component: ModelManagementPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/suggestion-bus-activity',
      component: SuggestionBusActivityPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    // Part 13 — System Health
    new Route({
      path: '/super-admin/infrastructure-health',
      component: InfrastructureHealthPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/geo-edge-status',
      component: GeoEdgeStatusPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    // Part 13 — Trust & Compliance
    new Route({
      path: '/super-admin/fraud-security-overview',
      component: FraudSecurityOverviewPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
    new Route({
      path: '/super-admin/compliance-center',
      component: ComplianceCenterPageElement,
      requiredRole: ['super-admin'],
      requiredPermission: null,
      layoutComponent: SuperAdminLayoutElement,
    }),
  ];

  const router = new Router(routes, root);
  router.start();
}