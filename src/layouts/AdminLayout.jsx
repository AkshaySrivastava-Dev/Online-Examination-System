import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  BookOpen,
  LayoutDashboard,
  Users,
  FileText,
  Layers,
  Award,
  UserCheck,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { Badge } from '../components/common';

export function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/admin/students', label: 'Student Management', icon: <Users size={18} /> },
    { to: '/admin/examinations', label: 'Examinations', icon: <BookOpen size={18} /> },
    { to: '/admin/questions', label: 'Question Bank', icon: <Layers size={18} /> },
    { to: '/admin/results', label: 'Results & Attempts', icon: <Award size={18} /> },
    { to: '/admin/profile', label: 'Admin Profile', icon: <UserCheck size={18} /> },
  ];

  // Derive page heading from active route
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'block' }}>
                ExamPro
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Admin Portal
              </span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.5rem 0.75rem' }}>
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
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.8125rem',
                flexShrink: 0,
              }}
            >
              {currentUser?.fullName?.charAt(0) || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.fullName}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color var(--transition-fast)',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="admin-main">
        {/* Sticky Topbar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {currentNav.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge variant="primary" size="sm" dot>
              Institution Mode
            </Badge>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="admin-body">
          <Outlet />
        </main>

        {/* Academic Demonstration Footer */}
        <footer style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', padding: '1rem var(--space-6)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Shield size={14} color="var(--color-primary)" />
            <span>ExamPro Academic System • Institutional Administration • Client-Side LocalStorage Simulation</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminLayout;

