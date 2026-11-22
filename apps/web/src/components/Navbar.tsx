import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Menu,
  X,
  CheckCheck,
  ArrowUpRight,
  Infinity as InfinityIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export function Navbar() {
  const { user, notifications, unreadCount, refreshNotifications, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleMarkRead = async (id: string, entityType: string | null) => {
    await api.notifications.markRead(id);
    await refreshNotifications();
    setNotifOpen(false);
    if (entityType === 'CollaborationRequest') {
      navigate('/requests');
    } else if (entityType === 'LearningSession') {
      navigate('/sessions');
    }
  };

  const handleMarkAllRead = async () => {
    await api.notifications.markAllRead();
    await refreshNotifications();
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/discover', label: 'Discover' },
    { to: '/skills', label: 'Katalog Skill' },
    { to: '/requests', label: 'Permintaan' },
    { to: '/sessions', label: 'Sesi Belajar' },
    { to: '/profile', label: 'Profil' }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#132A2E]/10 bg-[#F5EFE6]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            to={user ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-[#132A2E] group"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D46A4C] text-white shadow-sm group-hover:rotate-12 transition transform">
              <InfinityIcon className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="leading-none text-[#132A2E]">SkillLoop</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#5C6B6E] mt-0.5">
                Peer Exchange
              </span>
            </div>
          </Link>

          {user && (
            <nav
              className="hidden md:flex md:items-center md:gap-1 rounded-full border border-[#132A2E]/15 bg-[#FBF8F3] p-1 shadow-sm"
              aria-label="Main Navigation"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-[#132A2E] text-[#F5EFE6] shadow-sm'
                        : 'text-[#5C6B6E] hover:text-[#132A2E] hover:bg-[#EAE0D2]/60'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="rounded-full border border-[#132A2E]/20 bg-[#FBF8F3] px-4 py-2 text-xs font-bold text-[#132A2E] hover:border-[#132A2E] transition"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#44624A] text-white font-bold text-xs px-5 py-2 hover:bg-[#132A2E] transition shadow-sm"
              >
                <span>Daftar</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <>
              {/* Notification Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative rounded-full border border-[#132A2E]/15 bg-[#FBF8F3] p-2.5 text-[#132A2E] hover:bg-[#EAE0D2] transition"
                  aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D46A4C] text-[9px] font-mono font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-3xl border border-[#132A2E]/15 bg-[#FBF8F3] p-4 shadow-xl z-50">
                    <div className="flex items-center justify-between border-b border-[#132A2E]/10 pb-2.5 px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#132A2E]">
                          Notifikasi
                        </span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-[#D6F55B] border border-[#132A2E]/20 text-[#132A2E] px-2 py-0.5 text-[10px] font-mono font-bold">
                            {unreadCount} baru
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#44624A] hover:underline transition"
                        >
                          <CheckCheck className="h-3 w-3" />
                          Tandai dibaca
                        </button>
                      )}
                    </div>

                    <div className="mt-1.5 max-h-72 divide-y divide-[#132A2E]/10 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="py-6 text-center text-xs text-[#5C6B6E]">
                          Tidak ada notifikasi baru.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleMarkRead(n.id, n.entityType)}
                            className={`w-full text-left py-2.5 px-2.5 rounded-2xl transition hover:bg-[#EAE0D2]/60 ${
                              !n.readAt ? 'bg-[#D6F55B]/25' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-[#132A2E]">
                                {n.title}
                              </span>
                              {!n.readAt && (
                                <span className="text-[#D46A4C] font-extrabold leading-none">.</span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-[#5C6B6E] line-clamp-2">
                              {n.body}
                            </p>
                            <span className="mt-1 block text-[10px] text-[#5C6B6E]/80 font-mono">
                              {new Date(n.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User badge */}
              <div className="hidden sm:flex sm:items-center sm:gap-2 rounded-full bg-[#FBF8F3] border border-[#132A2E]/15 pl-3.5 pr-2 py-1 text-xs text-[#132A2E] shadow-sm">
                <span className="text-[#44624A] font-extrabold leading-none">.</span>
                <span className="font-bold text-[#132A2E]">
                  {user.displayName}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full p-1.5 text-[#5C6B6E] hover:text-[#D46A4C] hover:bg-[#EAE0D2] transition"
                  title="Keluar"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="rounded-full border border-[#132A2E]/15 bg-[#FBF8F3] p-2 text-[#132A2E] md:hidden"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {user && mobileMenuOpen && (
        <div className="border-t border-[#132A2E]/10 bg-[#FBF8F3] px-4 py-4 md:hidden space-y-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-[#132A2E] text-[#F5EFE6]'
                      : 'text-[#5C6B6E] hover:text-[#132A2E] hover:bg-[#EAE0D2]/60'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-[#132A2E]/10 pt-3">
            <div>
              <p className="text-xs font-bold text-[#132A2E]">
                {user.displayName}
              </p>
              <p className="text-[11px] text-[#5C6B6E]">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded-full border border-[#132A2E]/20 px-3.5 py-1.5 text-xs font-bold text-[#132A2E] hover:bg-[#EAE0D2] transition"
            >
              <LogOut className="h-3 w-3" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
