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
    <div className="min-h-screen bg-[#FAF7F0] text-ink antialiased flex flex-col font-sans">
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
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl border-r border-[#E8E2D9] flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-5 border-b border-[#E8E2D9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-clay text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
              VJ
            </div>
            <div>
              <span className="font-serif font-bold text-sm tracking-wider text-ink block leading-none">
                VJ COLLECTION
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
                <p className="px-3 text-[10px] font-bold tracking-wider text-ink-muted uppercase">
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
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-clay text-white shadow-xs font-semibold'
                          : 'text-ink-soft hover:bg-[#F3EFE6] hover:text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-clay'}`} />
                        <span>{item.label}</span>
                      </div>
                      {badgeValue != null && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-clay/10 text-clay'
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

        {/* Mobile User Profile Footer */}
        <div className="p-4 border-t border-[#E8E2D9] bg-[#FAF7F0] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-ink-muted truncate max-w-[140px]">{userEmail}</span>
            <span className="px-2 py-0.5 bg-clay/10 text-clay text-[10px] font-bold rounded-full uppercase">
              {roleDisplay}
            </span>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#E8E2D9] bg-white text-xs font-semibold text-ink-muted hover:text-ink hover:border-ink transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-[#E8E2D9] transition-all duration-300 shrink-0 select-none ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Logo Header */}
          <div className="h-16 px-5 border-b border-[#E8E2D9] flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-clay text-white flex items-center justify-center font-serif text-base font-bold shadow-xs">
                  VJ
                </div>
                <div>
                  <span className="font-serif font-bold text-sm tracking-wider text-ink block leading-none">
                    VJ COLLECTION
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-ink-muted">
                    Studio Admin
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 mx-auto rounded-lg bg-clay text-white flex items-center justify-center font-serif text-base font-bold shadow-xs">
                VJ
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-[#F3EFE6] transition"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
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
                  {!isCollapsed && (
                    <p className="px-3 text-[10px] font-bold tracking-wider text-ink-muted uppercase">
                      {group.title}
                    </p>
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
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-clay text-white shadow-xs font-semibold'
                            : 'text-ink-soft hover:bg-[#F3EFE6] hover:text-ink'
                        } ${isCollapsed ? 'justify-center' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-clay'}`} />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isCollapsed && badgeValue != null && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                              isActive ? 'bg-white/20 text-white' : 'bg-clay/10 text-clay'
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

          {/* Desktop User Footer */}
          <div className="p-3 border-t border-[#E8E2D9] bg-[#FAF7F0]">
            {!isCollapsed ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-muted truncate max-w-[130px] font-medium">{userEmail}</span>
                  <span className="px-1.5 py-0.5 bg-clay/10 text-clay text-[9px] font-bold rounded-full uppercase">
                    {roleDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to="/"
                    target="_blank"
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-[#E8E2D9] bg-white text-[11px] font-medium text-ink-muted hover:text-ink hover:border-ink transition"
                  >
                    <span>Store</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={onSignOut}
                    className="p-1.5 rounded-lg border border-[#E8E2D9] bg-white text-ink-muted hover:text-ink hover:border-ink transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Link
                  to="/"
                  target="_blank"
                  className="p-2 rounded-lg border border-[#E8E2D9] bg-white text-ink-muted hover:text-ink hover:border-ink transition"
                  title="View Store"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={onSignOut}
                  className="p-2 rounded-lg border border-[#E8E2D9] bg-white text-ink-muted hover:text-ink hover:border-ink transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* TOP APP BAR */}
          <header className="h-16 bg-white border-b border-[#E8E2D9] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-2 rounded-lg text-ink-muted hover:text-ink hover:bg-[#F3EFE6] lg:hidden transition"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="font-semibold text-ink-muted uppercase tracking-wider">{activeGroupTitle}</span>
                <span className="text-[#D8D2C7]">/</span>
                <span className="font-bold text-ink">{activeItemLabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => void onRefresh()}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E8E2D9] bg-[#FAF7F0] text-xs font-semibold text-ink hover:bg-white hover:border-clay transition disabled:opacity-50"
                title="Refresh studio telemetry"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-clay ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <Link
                to="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
              >
                <span>Live Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </header>

          {/* NOTICES / ALERTS */}
          {notice && (
            <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{notice}</span>
              </div>
              {onClearNotice && (
                <button onClick={onClearNotice} className="text-emerald-700 hover:text-emerald-950 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mx-4 sm:mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>{error}</span>
              </div>
              {onClearError && (
                <button onClick={onClearError} className="text-rose-700 hover:text-rose-950 p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* PAGE BODY */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
