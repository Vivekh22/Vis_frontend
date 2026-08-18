import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Router } from '../../platform/router/Router';
import { Route } from '../../platform/router/Route';
import { RouteGuard } from '../../platform/router/RouteGuard';
import { authStore } from '../../platform/state/AuthStore';
import { permissionService } from '../../services';

import { ClientLayoutElement } from '../../layouts/ClientLayoutElement';
import { AdminLayoutElement } from '../../layouts/AdminLayoutElement';
import { SuperAdminLayoutElement } from '../../layouts/SuperAdminLayoutElement';
import { DashboardPageElement } from '../../pages/client/dashboard/DashboardPageElement';
import { OverviewPageElement as AdminOverviewPageElement } from '../../pages/admin/overview/OverviewPageElement';
import { OverviewPageElement as SuperAdminOverviewPageElement } from '../../pages/super-admin/overview/OverviewPageElement';
import { LoginPageElement } from '../../pages/client/login/LoginPageElement';
import { RegistrationWizardElement } from '../../pages/client/registration/RegistrationWizardElement';
import { RegistrationStatusPageElement } from '../../pages/client/registration/RegistrationStatusPageElement';
import { StepWelcomeLogin } from '../../pages/client/registration/steps/StepWelcomeLogin';
import { CampaignListPageElement } from '../../pages/client/campaign/CampaignListPageElement';
import { CampaignWizardElement } from '../../pages/client/campaign/wizard/CampaignWizardElement';
import { CreativeListPageElement } from '../../pages/client/creatives/CreativeListPageElement';
import { AppListPageElement } from '../../pages/client/app-list/AppListPageElement';
import { AudiencePageElement } from '../../pages/client/audience/AudiencePageElement';
import { FundPageElement } from '../../pages/client/fund/FundPageElement';
import { InvoicesBillingPageElement } from '../../pages/client/invoices-billing/InvoicesBillingPageElement';
import { ReportsPageElement } from '../../pages/client/reports/ReportsPageElement';
import { AccDetailsPageElement } from '../../pages/client/acc-details/AccDetailsPageElement';
import { IntegrationsPageElement } from '../../pages/client/integrations-api-keys/IntegrationsPageElement';
import { SupportPageElement } from '../../pages/client/support/SupportPageElement';
import { SettingsPageElement } from '../../pages/client/settings/SettingsPageElement';
import { NotificationCenterPageElement } from '../../pages/client/notification-center/NotificationCenterPageElement';

import { NewRegistrationsPageElement } from '../../pages/super-admin/admin-panel/new-registrations/NewRegistrationsPageElement';
import { UserManagementPageElement } from '../../pages/super-admin/admin-panel/user-management/UserManagementPageElement';
import { RolePermissionBuilderPageElement } from '../../pages/super-admin/admin-panel/role-permission-builder/RolePermissionBuilderPageElement';
import { MarginManagementPageElement } from '../../pages/super-admin/admin-panel/margin-management/MarginManagementPageElement';
import { ExchangeManagementPageElement } from '../../pages/super-admin/admin-panel/exchange-management/ExchangeManagementPageElement';
import { FeatureGatingPageElement } from '../../pages/super-admin/admin-panel/feature-gating/FeatureGatingPageElement';
import { PendingApprovalsPageElement } from '../../pages/super-admin/admin-panel/pending-approvals/PendingApprovalsPageElement';
import { ActivityLogPageElement } from '../../pages/super-admin/admin-panel/activity-log/ActivityLogPageElement';
import { PlatformSettingsPageElement } from '../../pages/super-admin/admin-panel/platform-settings/PlatformSettingsPageElement';
import { ConnectedExchangesPageElement } from '../../pages/super-admin/platform-connections/connected-exchanges/ConnectedExchangesPageElement';
import { ConnectedPublishersPageElement } from '../../pages/super-admin/platform-connections/connected-publishers/ConnectedPublishersPageElement';
import { ConnectedDspsPageElement } from '../../pages/super-admin/platform-connections/connected-dsps/ConnectedDspsPageElement';
import { PlatformApiManagementPageElement } from '../../pages/super-admin/integrations-apis/platform-api-management/PlatformApiManagementPageElement';
import { MasterIntegrationListsPageElement } from '../../pages/super-admin/integrations-apis/master-integration-lists/MasterIntegrationListsPageElement';
import { ThirdPartyServiceStatusPageElement } from '../../pages/super-admin/integrations-apis/third-party-service-status/ThirdPartyServiceStatusPageElement';
import { ModelManagementPageElement } from '../../pages/super-admin/taranga-governance/model-management/ModelManagementPageElement';
import { SuggestionBusActivityPageElement } from '../../pages/super-admin/taranga-governance/suggestion-bus-activity/SuggestionBusActivityPageElement';
import { InfrastructureHealthPageElement } from '../../pages/super-admin/system-health/infrastructure-health/InfrastructureHealthPageElement';
import { GeoEdgeStatusPageElement } from '../../pages/super-admin/system-health/geo-edge-status/GeoEdgeStatusPageElement';
import { FraudSecurityOverviewPageElement } from '../../pages/super-admin/trust-compliance/fraud-security-overview/FraudSecurityOverviewPageElement';
import { ComplianceCenterPageElement } from '../../pages/super-admin/trust-compliance/compliance-center/ComplianceCenterPageElement';

import { ComponentRegistry } from '../../platform/component/ComponentRegistry';
import { User } from '../../core/entities/User';

// Force registrations
import '../../main';

describe('Route Mount Integration Tests', () => {
  let root: HTMLElement;
  let router: Router;

  const routes = [
    new Route({ path: '/', component: LoginPageElement, requiredRole: null, requiredPermission: null }),
    new Route({ path: '/login', component: LoginPageElement, requiredRole: null, requiredPermission: null }),
    new Route({ path: '/register', component: RegistrationWizardElement, requiredRole: null, requiredPermission: null }),
    new Route({ path: '/register/status', component: RegistrationStatusPageElement, requiredRole: null, requiredPermission: null }),
    new Route({ path: '/register/welcome', component: StepWelcomeLogin, requiredRole: null, requiredPermission: null }),
    
    // Client
    new Route({ path: '/client/dashboard', component: DashboardPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/campaigns', component: CampaignListPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/campaigns/new', component: CampaignWizardElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/creatives', component: CreativeListPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/creatives/new', component: CreativeListPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/app-lists', component: AppListPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/audiences', component: AudiencePageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/fund', component: FundPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/invoices', component: InvoicesBillingPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/reports', component: ReportsPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/acc-details', component: AccDetailsPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/integrations', component: IntegrationsPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/support', component: SupportPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/settings', component: SettingsPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    new Route({ path: '/client/notifications', component: NotificationCenterPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
    
    // Admin
    new Route({ path: '/admin/overview', component: AdminOverviewPageElement, requiredRole: ['admin'], requiredPermission: null, layoutComponent: AdminLayoutElement }),
    
    // Super Admin
    new Route({ path: '/super-admin/overview', component: SuperAdminOverviewPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/new-registrations', component: NewRegistrationsPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/user-management', component: UserManagementPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/role-permission-builder', component: RolePermissionBuilderPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/margin-management', component: MarginManagementPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/exchange-management', component: ExchangeManagementPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/feature-gating', component: FeatureGatingPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/pending-approvals', component: PendingApprovalsPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/activity-log', component: ActivityLogPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/platform-settings', component: PlatformSettingsPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/connected-exchanges', component: ConnectedExchangesPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/connected-publishers', component: ConnectedPublishersPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/connected-dsps', component: ConnectedDspsPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/platform-api-management', component: PlatformApiManagementPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/master-integration-lists', component: MasterIntegrationListsPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/third-party-service-status', component: ThirdPartyServiceStatusPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/model-management', component: ModelManagementPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/suggestion-bus-activity', component: SuggestionBusActivityPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/infrastructure-health', component: InfrastructureHealthPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/geo-edge-status', component: GeoEdgeStatusPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/fraud-security-overview', component: FraudSecurityOverviewPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
    new Route({ path: '/super-admin/compliance-center', component: ComplianceCenterPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
  ];

  beforeEach(() => {
    document.body.innerHTML = '<div id="app-root"></div>';
    root = document.getElementById('app-root')!;
    router = new Router(routes, root);
    RouteGuard.setPermissionChecker(permissionService);
  });

  const checkMounted = (container: Element | DocumentFragment | null, ComponentClass: any): boolean => {
    if (!container) return false;
    if (container instanceof ComponentClass) return true;
    for (const child of container.querySelectorAll('*')) {
      if (child instanceof ComponentClass) return true;
      if (child.shadowRoot && checkMounted(child.shadowRoot, ComponentClass)) return true;
    }
    return false;
  };

  it('mounts all routes successfully with correct permissions', async () => {
    let failures: string[] = [];

    const setRole = (role: string) => {
      authStore.login(new User('test', 'Test', 'test@test', role as any));
    };

    for (const route of routes) {
      if (route.requiredRole) {
        authStore.logout();
        router.navigate(route.path);
        await new Promise(r => setTimeout(r, 0));
        
        if (!checkMounted(root, LoginPageElement)) {
          failures.push(`RouteGuard failed to block unauthorized access to ${route.path}`);
        }
      }

      const roleToUse = (route.requiredRole && route.requiredRole.length > 0) ? route.requiredRole[0] : 'client';
      setRole(roleToUse as string);

      (router as any).renderRoute(route.path);
      await new Promise(r => setTimeout(r, 50));

      const foundLayout = route.layoutComponent ? checkMounted(root, route.layoutComponent) : true;
      const foundTarget = checkMounted(root, route.component);

      if (!foundTarget || !foundLayout) {
        console.error(`Root HTML at failure for ${route.path}:`, root.innerHTML);
        failures.push(`Failed to mount ${route.component.name} (layout: ${route.layoutComponent ? route.layoutComponent.name : 'None'}) for path ${route.path}.`);
      }
    }

    if (failures.length > 0) {
      console.error(failures);
    }
    expect(failures).toHaveLength(0);
  });
});
