import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  Layers,
  Award,
  UserCheck,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { VerityLogo } from '../components/common';

export function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { to: '/admin/students', label: 'Student Management', icon: <Users size={16} /> },
    { to: '/admin/examinations', label: 'Examinations', icon: <BookOpen size={16} /> },
    { to: '/admin/questions', label: 'Question Bank', icon: <Layers size={16} /> },
    { to: '/admin/results', label: 'Results & Attempts', icon: <Award size={16} /> },
    { to: '/admin/profile', label: 'Admin Profile', icon: <UserCheck size={16} /> },
  ];

  const currentNav = navLinks.find((n) => location.pathname.startsWith(n.to)) || {
    label: 'Administration',
  };

  return (
    <div className="admin-shell">
      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-sidebar-backdrop ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <VerityLogo variant="compact" size="md" subtitle="Institutional Oversight" />

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 0.75rem' }}>
            Management
          </div>

          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Card & Sign Out */}
        <div className="admin-sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.75rem',
                flexShrink: 0,
                border: '1px solid var(--color-primary-border)',
              }}
            >
              {currentUser?.fullName?.charAt(0) || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: 'var(--color-text-primary)' }}>
                {currentUser?.fullName}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ThemeToggle size="sm" />
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: '0.375rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={18} />
            </button>
            <div className="topbar-breadcrumb">
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Administration</span>
              <span style={{ color: 'var(--color-border)', margin: '0 0.5rem' }}>/</span>
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '0.875rem' }}>{currentNav.label}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle size="sm" />
          </div>
        </header>

        <main className="admin-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
