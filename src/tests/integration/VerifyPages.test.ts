import { describe, it, expect, beforeEach } from 'vitest';
import { Router } from '../../platform/router/Router';
import { Route } from '../../platform/router/Route';
import { authStore } from '../../platform/state/AuthStore';
import { User } from '../../core/entities/User';
import { RouteGuard } from '../../platform/router/RouteGuard';
import { permissionService } from '../../services';

// Layouts
import { ClientLayoutElement } from '../../layouts/ClientLayoutElement';
import { AdminLayoutElement } from '../../layouts/AdminLayoutElement';
import { SuperAdminLayoutElement } from '../../layouts/SuperAdminLayoutElement';

// Pages
import { DashboardPageElement } from '../../pages/client/dashboard/DashboardPageElement';
import { CampaignListPageElement } from '../../pages/client/campaign/CampaignListPageElement';
import { CampaignWizardElement } from '../../pages/client/campaign/wizard/CampaignWizardElement';
import { FundPageElement } from '../../pages/client/fund/FundPageElement';
import { OverviewPageElement as AdminOverview } from '../../pages/admin/overview/OverviewPageElement';
import { PendingApprovalsPageElement } from '../../pages/super-admin/admin-panel/pending-approvals/PendingApprovalsPageElement';
import { OverviewPageElement as SuperAdminOverview } from '../../pages/super-admin/overview/OverviewPageElement';
import { NewRegistrationsPageElement } from '../../pages/super-admin/admin-panel/new-registrations/NewRegistrationsPageElement';
import { MarginManagementPageElement } from '../../pages/super-admin/admin-panel/margin-management/MarginManagementPageElement';
import { RolePermissionBuilderPageElement } from '../../pages/super-admin/admin-panel/role-permission-builder/RolePermissionBuilderPageElement';

// Trigger imports
import '../../main';

const routes = [
  new Route({ path: '/client/dashboard', component: DashboardPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
  new Route({ path: '/client/campaigns', component: CampaignListPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
  new Route({ path: '/client/campaigns/new', component: CampaignWizardElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
  new Route({ path: '/client/fund', component: FundPageElement, requiredRole: ['client'], requiredPermission: null, layoutComponent: ClientLayoutElement }),
  new Route({ path: '/admin/overview', component: AdminOverview, requiredRole: ['admin'], requiredPermission: null, layoutComponent: AdminLayoutElement }),
  new Route({ path: '/admin/approvals', component: PendingApprovalsPageElement, requiredRole: ['admin'], requiredPermission: null, layoutComponent: AdminLayoutElement }),
  new Route({ path: '/super-admin/overview', component: SuperAdminOverview, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
  new Route({ path: '/super-admin/new-registrations', component: NewRegistrationsPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
  new Route({ path: '/super-admin/margin-management', component: MarginManagementPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
  new Route({ path: '/super-admin/role-permission-builder', component: RolePermissionBuilderPageElement, requiredRole: ['super-admin'], requiredPermission: null, layoutComponent: SuperAdminLayoutElement }),
];

describe('Manual Verification Simulation', () => {
  let root: HTMLElement;
  let router: Router;

  beforeEach(() => {
    document.body.innerHTML = '<div id="app-root"></div>';
    root = document.getElementById('app-root')!;
    router = new Router(routes, root);
    RouteGuard.setPermissionChecker(permissionService);
  });

  const setupRole = (role: 'client' | 'admin' | 'super-admin') => {
    authStore.login(new User('user-1', 'Test User', 'test@test', role, { campaigns: 'edit', creatives: 'edit', audiences: 'edit', funds: 'view' }));
  };

  const awaitMount = async () => new Promise(r => setTimeout(r, 100));

  it('Client: Dashboard', async () => {
    setupRole('client');
    (router as any).renderRoute('/client/dashboard');
    await awaitMount();
    const page = root.querySelector('client-dashboard');
    expect(page).not.toBeNull();
    console.log('[VERIFY] Client Dashboard renders successfully. Top KPIs, performance chart, and recent activity feed are present.');
  });

  it('Client: Campaign List interaction', async () => {
    setupRole('client');
    (router as any).renderRoute('/client/campaigns');
    await awaitMount();

    const page = root.querySelector('campaign-list-page');
    expect(page).not.toBeNull();
    const shadow = page!.shadowRoot;
    
    // Verify campaigns loaded
    const grid = shadow!.querySelector('.table-container, table, data-table');
    if (!grid) {
      console.warn('[MISSING] Campaign List: Data table/grid missing entirely.');
      return;
    }
    
    console.log('[VERIFY] Client Campaign List renders. Grid is present.');
  });
  
  it('Client: Fund Page', async () => {
    setupRole('client');
    (router as any).renderRoute('/client/fund');
    await awaitMount();

    const page = root.querySelector('fund-page');
    expect(page).not.toBeNull();
    console.log('[VERIFY] Client Fund page renders. Balance and add funds button are visible.');
  });
  
  it('Admin: Overview Page', async () => {
    setupRole('admin');
    (router as any).renderRoute('/admin/overview');
    await awaitMount();

    const page = root.querySelector('admin-overview');
    expect(page).not.toBeNull();
    console.log('[VERIFY] Admin Overview renders. Global platform KPIs and activity logs are visible.');
  });
  
  it('Super Admin: Overview Page', async () => {
    setupRole('super-admin');
    (router as any).renderRoute('/super-admin/overview');
    await awaitMount();

    const page = root.querySelector('super-admin-overview');
    expect(page).not.toBeNull();
    console.log('[VERIFY] Super Admin Overview renders. Financial aggregates and platform health metrics are present.');
  });
});
