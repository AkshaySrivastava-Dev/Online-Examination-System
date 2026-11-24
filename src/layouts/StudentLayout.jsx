import React, { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  BookOpen,
  LayoutDashboard,
  Calendar,
  Award,
  UserCheck,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../components/common';

export function StudentLayout() {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { to: '/student/examinations', label: 'Available Examinations', icon: <BookOpen size={16} /> },
    { to: '/student/upcoming', label: 'Upcoming Schedule', icon: <Calendar size={16} /> },
    { to: '/student/results', label: 'My Results', icon: <Award size={16} /> },
    { to: '/student/profile', label: 'Profile', icon: <UserCheck size={16} /> },
  ];

  return (
    <div className="student-shell">
      {/* Student Top Navigation Bar */}
      <header className="student-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Brand */}
          <Link to="/student/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
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
              <GraduationCap size={18} />
            </div>
            <div>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', display: 'block' }}>
                ExamPro
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Student Portal
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="student-nav-links">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Card & Mobile Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-success-subtle)',
                color: 'var(--color-success-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.8125rem',
              }}
            >
              {currentUser?.fullName?.charAt(0) || 'S'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {currentUser?.fullName}
              </span>
              <code style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                {currentUser?.studentId || 'STUDENT'}
              </code>
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
            }}
          >
            <LogOut size={16} />
          </button>

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <nav className="student-nav-links mobile-open">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      {/* Main Student Portal Content */}
      <main className="student-body">
        <Outlet />
      </main>

      {/* Academic Disclaimer Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', padding: '1.25rem var(--space-6)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={14} />
          <span>ExamPro Academic System • Student Portal • Frontend LocalStorage</span>
        </div>
      </footer>
    </div>
  );
}

export default StudentLayout;

