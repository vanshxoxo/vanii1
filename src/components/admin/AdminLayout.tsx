import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  X,
  ExternalLink,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ADMIN_NAV_GROUPS, type AdminSectionId } from './adminNav';

interface AdminLayoutProps {
  currentSection: AdminSectionId;
  onSelectSection: (section: AdminSectionId) => void;
  adminRoles: string[];
  dashboardData: any;
  onRefresh: () => Promise<void> | void;
  isRefreshing?: boolean;
  userEmail?: string;
  onSignOut: () => void;
  notice?: string;
  error?: string;
  onClearNotice?: () => void;
  onClearError?: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  currentSection,
  onSelectSection,
  adminRoles,
  dashboardData,
  onRefresh,
  isRefreshing = false,
  userEmail = '',
  onSignOut,
  notice = '',
  error = '',
  onClearNotice,
  onClearError,
  children,
}: AdminLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const roleDisplay = adminRoles[0]
    ? adminRoles[0].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Admin';

  // Find active item info for breadcrumb
  let activeItemLabel = 'Overview';
  let activeGroupTitle = 'WORKSPACE';
  for (const group of ADMIN_NAV_GROUPS) {
    const found = group.items.find((item) => item.id === currentSection);
    if (found) {
      activeItemLabel = found.label;
      activeGroupTitle = group.title;
      break;
    }
  }

  const handleNavClick = (sectionId: AdminSectionId) => {
    onSelectSection(sectionId);
    setIsMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-ink antialiased flex flex-col">
      {/* MOBILE DRAWER BACKDROP */}
      {isMobileOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#FFFFFF] shadow-2xl border-r border-[#E8E2D9] flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-[#E8E2D9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-clay text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm">
              L
            </div>
            <div>
              <span className="font-serif font-bold text-base tracking-wider text-ink block leading-none">
                LITTLE LOOM
              </span>
              <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                Studio Admin
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-[#F3EFE6] transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {ADMIN_NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => {
              if (item.requiredRoles && !item.requiredRoles.some((r) => adminRoles.includes(r))) {
                return false;
              }
              return true;
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                  {group.title}
                </p>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentSection === item.id;
                  const badgeValue = item.badge ? item.badge(dashboardData) : null;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-clay text-white shadow-sm font-semibold'
                          : 'text-ink-soft hover:bg-[#F3EFE6] hover:text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-clay'}`} />
                        <span>{item.label}</span>
                      </div>
                      {badgeValue != null && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-[#EAE4D9] text-ink'
                          }`}
                        >
                          {badgeValue}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Mobile User Footer */}
        <div className="p-4 border-t border-[#E8E2D9] bg-[#FAF7F0] flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-ink truncate">{userEmail || 'Admin User'}</p>
            <p className="text-[11px] text-clay font-medium">{roleDisplay}</p>
          </div>
          <button
            onClick={onSignOut}
            className="p-2 text-ink-muted hover:text-red-600 rounded-lg transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP FIXED/STICKY LEFT SIDEBAR */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-[#E8E2D9] transition-all duration-300 select-none z-30 shrink-0 ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-[#E8E2D9] flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-clay to-[#a65b46] text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm shrink-0">
                L
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <span className="font-serif font-bold text-base tracking-wider text-ink block leading-none truncate">
                    LITTLE LOOM
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-clay font-semibold">
                    Studio Admin
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-[#F3EFE6] transition"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {ADMIN_NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => {
                if (item.requiredRoles && !item.requiredRoles.some((r) => adminRoles.includes(r))) {
                  return false;
                }
                return true;
              });
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {!isCollapsed ? (
                    <p className="px-3 text-[10px] font-bold tracking-wider text-ink-muted/80 uppercase">
                      {group.title}
                    </p>
                  ) : (
                    <div className="border-t border-[#E8E2D9] my-2" />
                  )}
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentSection === item.id;
                    const badgeValue = item.badge ? item.badge(dashboardData) : null;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center ${
                          isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
                        } py-2.5 rounded-xl text-sm font-medium transition-all group ${
                          isActive
                            ? 'bg-clay text-white shadow-sm font-semibold'
                            : 'text-ink-soft hover:bg-[#F3EFE6] hover:text-ink'
                        }`}
                      >
                        <div className={`flex items-center ${isCollapsed ? 'gap-0' : 'gap-3'}`}>
                          <Icon
                            className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                              isActive ? 'text-white' : 'text-clay'
                            }`}
                          />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isCollapsed && badgeValue != null && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#EAE4D9] text-ink'
                            }`}
                          >
                            {badgeValue}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Sidebar Collapse Toggle (When collapsed) & User Profile */}
          <div className="p-3 border-t border-[#E8E2D9] bg-[#FAF7F0] space-y-2">
            {isCollapsed && (
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-full flex justify-center py-2 rounded-lg text-ink-muted hover:text-ink hover:bg-white transition"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <div
              className={`flex items-center ${
                isCollapsed ? 'justify-center' : 'justify-between'
              } p-1.5 rounded-xl bg-white border border-[#E8E2D9] shadow-2xs`}
            >
              {!isCollapsed && (
                <div className="truncate pr-2 pl-1">
                  <p className="text-xs font-semibold text-ink truncate">{userEmail || 'Admin User'}</p>
                  <p className="text-[11px] text-clay font-medium">{roleDisplay}</p>
                </div>
              )}
              <button
                onClick={onSignOut}
                className="p-1.5 text-ink-muted hover:text-red-600 rounded-lg hover:bg-red-50 transition shrink-0"
                title="Sign out of Admin Studio"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* COMPACT TOP HEADER */}
          <header className="h-16 bg-white border-b border-[#E8E2D9] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-[#F3EFE6] lg:hidden transition"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <span className="hidden sm:inline">Little Loom Studio</span>
                  <span className="hidden sm:inline text-ink-muted/50">/</span>
                  <span className="font-medium text-ink-soft">{activeGroupTitle}</span>
                </div>
                <h1 className="font-serif text-lg sm:text-xl font-bold text-ink leading-tight">
                  {activeItemLabel}
                </h1>
              </div>
            </div>

            {/* Quick Actions & Search */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative hidden md:block w-48 xl:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  placeholder="Quick find..."
                  value={headerSearch}
                  onChange={(e) => setHeaderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay/30"
                />
              </div>

              <button
                onClick={() => void onRefresh()}
                disabled={isRefreshing}
                className="p-2 rounded-xl text-ink-soft hover:text-ink hover:bg-[#FAF7F0] border border-[#E8E2D9] transition flex items-center gap-1.5 text-xs font-medium"
                title="Refresh studio data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-clay' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF7F0] hover:bg-[#F3EFE6] border border-[#E8E2D9] text-ink transition shadow-2xs"
              >
                <span>Storefront</span>
                <ExternalLink className="w-3 h-3 text-clay" />
              </Link>
            </div>
          </header>

          {/* NOTICES AND ALERTS */}
          <div className="px-4 sm:px-6 pt-4 space-y-2">
            {notice && (
              <div className="flex items-start justify-between gap-3 p-3.5 bg-emerald-50/90 border border-emerald-200/80 rounded-xl text-emerald-900 text-xs sm:text-sm animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{notice}</span>
                </div>
                {onClearNotice && (
                  <button
                    onClick={onClearNotice}
                    className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="flex items-start justify-between gap-3 p-3.5 bg-rose-50/90 border border-rose-200/80 rounded-xl text-rose-900 text-xs sm:text-sm animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
                {onClearError && (
                  <button
                    onClick={onClearError}
                    className="text-rose-700 hover:text-rose-900 p-0.5 rounded transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* MAIN PAGE BODY */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
