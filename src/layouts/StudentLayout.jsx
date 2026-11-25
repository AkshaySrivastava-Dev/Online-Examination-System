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
  Brain,
} from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';

export function StudentLayout() {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { to: '/student/examinations', label: 'Available Examinations', icon: <BookOpen size={15} /> },
    { to: '/student/upcoming', label: 'Upcoming Schedule', icon: <Calendar size={15} /> },
    { to: '/student/results', label: 'My Results', icon: <Award size={15} /> },
    { to: '/student/exam-dna', label: 'ExamDNA™', icon: <Brain size={15} /> },
    { to: '/student/profile', label: 'Profile', icon: <UserCheck size={15} /> },
  ];

  return (
    <div className="student-shell">
      {/* Student Top Navigation Bar */}
      <header className="student-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Brand */}
          <Link to="/student/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary)',
                color: '#1A1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GraduationCap size={16} strokeWidth={2.5} />
            </div>
            <div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.02em', display: 'block' }}>
                VERITY
              </span>
              <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Candidate Portal
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

        {/* User Card, Theme Toggle & Sign Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                border: '1px solid var(--color-primary-border)',
              }}
            >
              {currentUser?.fullName?.charAt(0) || 'S'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {currentUser?.fullName}
              </span>
              <code style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {currentUser?.studentId || 'STUDENT'}
              </code>
            </div>
          </div>

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
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
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
    </div>
  );
}
