import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Compass,
  BookOpen,
  ArrowLeftRight,
  Calendar,
  Settings,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
  CheckCheck,
  CheckCircle2,
  Mail,
  ShieldCheck,
  MessageSquare,
  Users,
  UserCheck,
  LogIn,
  ArrowUp
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  CharacterPortrait,
  resolveAvatarBg,
  resolveAvatarVariant
} from './CharacterPortraits';
import { api } from '../lib/api';

const QUICK_PERSONAS = [
  { name: 'Raka (Admin . JS ⇄ UI/UX)', email: 'raka@demo.skillloop.id' },
  { name: 'Naya (User . UI/UX ⇄ JS)', email: 'naya@demo.skillloop.id' },
  { name: 'Dimas (User . HTML ⇄ Figma)', email: 'dimas@demo.skillloop.id' },
  { name: 'Alya (User . Python ⇄ React)', email: 'alya@demo.skillloop.id' },
  { name: 'Farhan (User . React ⇄ Python)', email: 'farhan@demo.skillloop.id' }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, notifications, unreadCount, refreshUser, refreshNotifications, logout } = useAuth();
  const { lang, setLang, tx } = useLanguage();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const [switchingPersona, setSwitchingPersona] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    navigate('/login');
  };

  const handlePersonaSwitch = async (email: string) => {
    setSwitchingPersona(true);
    try {
      await api.auth.login({
        email,
        password: 'DemoSkillLoop123!'
      });
      await refreshUser();
      setMobileOpen(false);
      navigate('/dashboard');
    } finally {
      setSwitchingPersona(false);
    }
  };

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      navigate(`/discover?q=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      navigate('/discover');
    }
  };

  const handleMarkRead = async (id: string, entityType: string | null) => {
    await api.notifications.markRead(id);
    await refreshNotifications();
    setNotifOpen(false);
    if (entityType === 'CollaborationRequest') {
      navigate('/requests');
    } else if (entityType === 'LearningSession') {
      navigate('/sessions');
    } else if (entityType === 'DirectMessage') {
      navigate('/messages');
    }
  };

  const handleMarkAllRead = async () => {
    await api.notifications.markAllRead();
    await refreshNotifications();
  };

  const firstName = user?.displayName?.split(' ')[0] || 'Learner';

  // All 10 Main Feature Menus in the Sidebar
  const navItems = [
    {
      to: '/dashboard',
      label: tx('Dashboard', 'Dashboard'),
      icon: LayoutGrid
    },
    {
      to: '/skills',
      label: tx('Skill Saya', 'My Skills'),
      icon: BookOpen
    },
    {
      to: '/discover',
      label: tx('Cari Partner', 'Discover Partners'),
      icon: Compass
    },
    {
      to: '/requests',
      label: tx('Permintaan Tukar', 'Exchange Requests'),
      icon: ArrowLeftRight,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      to: '/sessions',
      label: tx('Jadwal & Progress', 'My Schedule'),
      icon: Calendar
    },
    {
      to: '/messages',
      label: tx('Pesan Pribadi', 'Messages'),
      icon: MessageSquare
    },
    {
      to: '/community',
      label: tx('Komunitas', 'Community'),
      icon: Users
    },
    {
      to: '/profile',
      label: tx('Pengaturan', 'Settings'),
      icon: Settings
    },
    ...(user?.isAdmin
      ? [
          {
            to: '/admin',
            label: tx('Admin & Moderasi', 'Admin & Moderation'),
            icon: ShieldCheck
          }
        ]
      : []),
    {
      to: '/landing',
      label: tx('Tentang Platform', 'Overview & Guide'),
      icon: BookOpen
    }
  ];

  // Mobile Bottom Bar Shortcuts for Easy Phone Navigation
  const mobileBottomTabs = [
    { to: '/dashboard', label: tx('Home', 'Home'), icon: LayoutGrid },
    { to: '/discover', label: tx('Partner', 'Discover'), icon: Compass },
    { to: '/skills', label: tx('Skill', 'Skills'), icon: BookOpen },
    {
      to: '/requests',
      label: tx('Tukar', 'Requests'),
      icon: ArrowLeftRight,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    { to: '/sessions', label: tx('Jadwal', 'Sessions'), icon: Calendar }
  ];

  return (
    <div className="min-h-screen bg-notebook-grid p-0 sm:p-3 lg:p-5 text-[#3D2317] pb-16 md:pb-5">
      {/* Outer App Frame: Outer backdrop has Foto 5 Grid, Inner Workspace keeps clean Warm Cream #FAF1E6 */}
      <div className="mx-auto flex min-h-screen sm:min-h-[calc(100vh-2.5rem)] max-w-[1440px] sm:rounded-[32px] border border-[#3D2317]/12 bg-[#FAF1E6] shadow-xl overflow-hidden">
        {/* Left Vertical Sidebar — Always visible on md+ screens */}
        <aside className="hidden md:flex md:w-64 lg:w-68 md:flex-col md:justify-between border-r border-[#3D2317]/10 bg-white p-5 lg:p-6 shrink-0">
          <div className="space-y-5">
            {/* Brand Logo (Book/Page Icon) + Bilingual Quick Toggle */}
            <div className="flex items-center justify-between px-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-[#3D2317] group"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F6C945] text-[#3D2317] shadow-sm group-hover:scale-105 transition">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="leading-none">SkillLoop</span>
              </Link>

              {/* Language Pill Toggle (ID | EN) */}
              <div
                className="inline-flex items-center rounded-xl bg-[#FAF1E6] p-0.5 text-[10px] font-extrabold"
                title={tx('Pilih Bahasa (ID / EN)', 'Switch Language (ID / EN)')}
              >
                <button
                  type="button"
                  onClick={() => setLang('id')}
                  className={`rounded-lg px-2 py-1 transition ${
                    lang === 'id'
                      ? 'bg-[#3D2317] text-[#F6C945]'
                      : 'text-[#8C7A70] hover:text-[#3D2317]'
                  }`}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`rounded-lg px-2 py-1 transition ${
                    lang === 'en'
                      ? 'bg-[#3D2317] text-[#F6C945]'
                      : 'text-[#8C7A70] hover:text-[#3D2317]'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Sidebar Navigation Links (All 10 Features Preserved) */}
            <div className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-[#8C7A70]">
                {tx('Menu Fitur Utama', 'Main Features Menu')}
              </p>
              <nav className="space-y-1" aria-label="Sidebar Navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#F6C945] text-[#3D2317] font-extrabold shadow-sm'
                            : 'text-[#8C7A70] hover:bg-[#FAF1E6] hover:text-[#3D2317]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-[#EE7838] px-1.5 text-[10px] font-extrabold text-white">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Quick 1-Click Persona Switcher in Sidebar */}
            <div className="rounded-2xl bg-[#FAF1E6] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#4EA674]">
                  <UserCheck className="h-3 w-3" />
                  <span>{tx('Akun Demo Cepat', 'Quick Persona')}</span>
                </span>
                {user ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#9E2A32] hover:bg-[#F4979C]/30 transition"
                    title={tx('Keluar dari akun aktif', 'Sign out of active account')}
                  >
                    <LogOut className="h-2.5 w-2.5" />
                    <span>{tx('Sign Out', 'Sign Out')}</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-[#8C7A70]">
                    {tx('Belum Masuk', 'Signed Out')}
                  </span>
                )}
              </div>
              <select
                value={user?.email || ''}
                disabled={switchingPersona}
                onChange={(e) => {
                  if (e.target.value === '__SIGN_OUT__') {
                    handleLogout();
                  } else if (e.target.value) {
                    handlePersonaSwitch(e.target.value);
                  }
                }}
                aria-label="Pilih Akun Demo"
                className="w-full rounded-xl border border-[#3D2317]/10 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-[#3D2317] focus:outline-none cursor-pointer"
              >
                {!user && (
                  <option value="">
                    {tx('Pilih Akun Demo...', 'Select Demo Persona...')}
                  </option>
                )}
                {QUICK_PERSONAS.map((p) => (
                  <option key={p.email} value={p.email}>
                    {p.name}
                  </option>
                ))}
                {user && (
                  <option value="__SIGN_OUT__">
                    — {tx('Keluar / Sign Out', 'Sign Out (Guest Mode)')} —
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Bottom Onboarding / Guide Card in Sidebar */}
          <div className="space-y-3 pt-4">
            <div className="relative overflow-hidden rounded-[24px] bg-[#432319] p-4 text-center text-white shadow-md">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F6C945] text-[#3D2317]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-extrabold text-white">
                {tx('Panduan Onboarding', 'Onboarding Guide')}
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-white/75">
                {tx(
                  'Pelajari alur Reciprocal Exchange & kesepakatan belajar dua arah.',
                  'Learn the Reciprocal Exchange flow & two-way learning agreement.'
                )}
              </p>
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="mt-3 w-full rounded-full bg-[#F6C945] py-2 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-sm"
              >
                {tx('Buka Panduan', 'Open Guide')}
              </button>
            </div>

            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FAF1E6] py-2 text-xs font-bold text-[#8C7A70] hover:bg-[#F4979C]/30 hover:text-[#9E2A32] transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>
                  {tx('Keluar', 'Sign Out')} ({firstName})
                </span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#F6C945] py-2 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{tx('Masuk / Daftar', 'Sign In / Register')}</span>
              </Link>
            )}
          </div>
        </aside>

        {/* Right Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 border-b border-[#3D2317]/8 bg-white/90 backdrop-blur-md px-4 py-3.5 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setMobileOpen((prev) => !prev)}
                  className="rounded-xl bg-[#FAF1E6] p-2 text-[#3D2317] md:hidden shrink-0"
                  aria-label="Toggle Menu"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
                <div className="min-w-0">
                  <h2 className="truncate text-base sm:text-lg font-extrabold tracking-tight text-[#3D2317]">
                    {user
                      ? tx(`Selamat datang kembali, ${firstName}!`, `Welcome back, ${firstName}!`)
                      : tx('SkillLoop — Reciprocal Skill Exchange!', 'SkillLoop — Reciprocal Skill Exchange!')}
                  </h2>
                  <p className="hidden sm:block text-[11px] text-[#8C7A70]">
                    {tx(
                      'Bertukar Keahlian. Bangun Koneksi. Tumbuh Bersama.',
                      'Navigating Ideas. Sharing Insights. Growing Together.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Input + Login / Sign Out Action Buttons Right Beside It */}
                <form onSubmit={handleQuickSearch} className="hidden sm:block relative w-44 lg:w-56">
                  <Search className="pointer-events-none absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#8C7A70]" />
                  <input
                    type="search"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder={tx(
                      'Cari skill atau partner...',
                      'Search skills or partners...'
                    )}
                    className="w-full rounded-full bg-[#FAF1E6] pl-9 pr-4 py-1.5 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none focus:ring-2 focus:ring-[#F6C945]"
                  />
                </form>

                {/* Login / Sign In & Sign Out Buttons right next to Search Bar */}
                {user ? (
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/login"
                      className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-[#3D2317]/15 bg-[#FAF1E6] px-3.5 py-1.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#F6C945] transition"
                      title={tx('Masuk atau Ganti Akun', 'Sign In or Switch Account')}
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>{tx('Sign In', 'Sign In')}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F4979C]/25 px-3.5 py-1.5 text-xs font-extrabold text-[#9E2A32] hover:bg-[#9E2A32] hover:text-white transition"
                      title={tx('Keluar dari akun aktif (Sign Out)', 'Sign Out')}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{tx('Sign Out', 'Sign Out')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F6C945] px-4 py-1.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-sm"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>{tx('Sign In', 'Sign In')}</span>
                    </Link>
                    <Link
                      to="/register"
                      className="hidden sm:inline-flex items-center rounded-full border border-[#3D2317]/20 bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#3D2317] hover:text-white transition"
                    >
                      {tx('Sign Up', 'Sign Up')}
                    </Link>
                  </div>
                )}

                {/* Mobile Language Toggle */}
                <button
                  type="button"
                  onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
                  className="md:hidden rounded-full bg-[#FAF1E6] px-2.5 py-1.5 text-[11px] font-extrabold text-[#3D2317]"
                >
                  {lang.toUpperCase()}
                </button>

                {/* Quick User Avatar Button to Profile & Avatar Settings */}
                {user && (
                  <Link
                    to="/profile"
                    title={tx('Profil & Ganti Foto Avatar', 'Profile & Change Avatar')}
                    className={`hidden sm:flex h-9 w-9 shrink-0 items-end justify-center overflow-hidden rounded-full border-2 border-[#3D2317]/15 ${resolveAvatarBg(
                      user.avatarUrl,
                      'bg-[#F6C945]'
                    )} pt-1 hover:scale-105 transition shadow-sm`}
                  >
                    <CharacterPortrait
                      variant={resolveAvatarVariant(user.avatarUrl, user.isAdmin ? 0 : 1)}
                      className="h-8 w-8"
                    />
                  </Link>
                )}

                {/* Quick Messages Icon Button */}
                <Link
                  to="/messages"
                  className="rounded-full bg-[#FAF1E6] p-2.5 text-[#3D2317] hover:bg-[#F6C945] transition"
                  title={tx('Pesan Pribadi', 'Private Messages')}
                >
                  <Mail className="h-4 w-4" />
                </Link>

                {/* Notification Bell Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setNotifOpen((prev) => !prev)}
                    className="relative rounded-full bg-[#FAF1E6] p-2.5 text-[#3D2317] hover:bg-[#F6C945] transition"
                    aria-label={`Notifikasi (${unreadCount})`}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EE7838] text-[9px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setNotifOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-[#3D2317]/10 bg-white p-4 shadow-xl z-20">
                        <div className="flex items-center justify-between border-b border-[#3D2317]/10 pb-2.5 px-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#3D2317]">
                              {tx('Pusat Notifikasi', 'Notification Center')}
                            </span>
                            {unreadCount > 0 && (
                              <span className="rounded-full bg-[#F6C945] text-[#3D2317] px-2 py-0.5 text-[10px] font-bold">
                                {unreadCount} {tx('baru', 'new')}
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={handleMarkAllRead}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4EA674] hover:underline"
                            >
                              <CheckCheck className="h-3 w-3" />
                              {tx('Tandai dibaca', 'Mark all read')}
                            </button>
                          )}
                        </div>

                        <div className="mt-1.5 max-h-72 divide-y divide-[#3D2317]/8 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="py-6 text-center text-xs text-[#8C7A70]">
                              {tx('Tidak ada notifikasi baru.', 'No new notifications.')}
                            </p>
                          ) : (
                            notifications.map((n) => (
                              <button
                                key={n.id}
                                type="button"
                                onClick={() => handleMarkRead(n.id, n.entityType)}
                                className={`w-full text-left py-2.5 px-2.5 rounded-2xl transition hover:bg-[#FAF1E6] ${
                                  !n.readAt ? 'bg-[#F6C945]/20' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-[#3D2317]">
                                    {n.title}
                                  </span>
                                  {!n.readAt && (
                                    <span className="h-2 w-2 rounded-full bg-[#EE7838] shrink-0 mt-1" />
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-[#8C7A70] line-clamp-2">
                                  {n.body}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Sidebar Drawer (When hamburger clicked on phone) */}
            {mobileOpen && (
              <div className="mt-4 border-t border-[#3D2317]/10 pt-4 md:hidden space-y-4 max-h-[78vh] overflow-y-auto">
                {/* Section 1: Mobile Search */}
                <section className="space-y-1.5">
                  <p className="px-1 text-[10px] font-extrabold uppercase tracking-widest text-[#8C7A70]">
                    {tx('Pencarian', 'Search')}
                  </p>
                  <form onSubmit={handleQuickSearch} className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#8C7A70]" />
                    <input
                      type="search"
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      placeholder={tx('Cari skill atau partner...', 'Search skills or partners...')}
                      className="w-full rounded-full border border-[#3D2317]/15 bg-white pl-9 pr-4 py-2 text-xs font-medium text-[#3D2317] shadow-sm focus:border-[#EE7838] focus:outline-none"
                    />
                  </form>
                </section>

                {/* Section 2: Quick Demo Account (High-Contrast Separator) */}
                <section className="rounded-2xl bg-[#3D2317] p-3.5 text-white shadow-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#F6C945]">
                      <UserCheck className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{tx('Akun Demo Cepat (1-Klik)', 'Quick Demo Account (1-Click)')}</span>
                    </span>
                    {user && (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold text-[#FFD7DC] hover:bg-white/25 transition"
                      >
                        <LogOut className="h-2.5 w-2.5" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={user?.email || ''}
                    disabled={switchingPersona}
                    onChange={(e) => {
                      if (e.target.value === '__SIGN_OUT__') {
                        handleLogout();
                      } else if (e.target.value) {
                        handlePersonaSwitch(e.target.value);
                      }
                    }}
                    className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-xs font-bold text-[#3D2317] focus:border-[#F6C945] focus:outline-none"
                  >
                    {!user && (
                      <option value="">
                        {tx('Pilih Akun Demo...', 'Select Demo Persona...')}
                      </option>
                    )}
                    {QUICK_PERSONAS.map((p) => (
                      <option key={p.email} value={p.email}>
                        {p.name}
                      </option>
                    ))}
                    {user && (
                      <option value="__SIGN_OUT__">
                        — {tx('Keluar / Sign Out', 'Sign Out (Guest Mode)')} —
                      </option>
                    )}
                  </select>
                </section>

                {/* Section 3: Main Menu */}
                <section className="space-y-2">
                  <p className="px-1 text-[10px] font-extrabold uppercase tracking-widest text-[#8C7A70]">
                    {tx('Menu Utama', 'Main Menu')}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center justify-between rounded-2xl border px-3.5 py-2.5 text-xs font-bold transition ${
                              isActive
                                ? 'border-[#E0B12B] bg-[#F6C945] text-[#3D2317] font-extrabold shadow-sm'
                                : 'border-[#3D2317]/10 bg-white text-[#3D2317] hover:bg-[#FAF1E6]'
                            }`
                          }
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="shrink-0 rounded-full bg-[#EE7838] px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </section>

                <div className="flex items-center justify-between border-t border-[#3D2317]/10 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setGuideOpen(true);
                    }}
                    className="text-xs font-extrabold text-[#4EA674]"
                  >
                    {tx('Panduan Onboarding', 'Onboarding Guide')}
                  </button>
                  {user ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-1 rounded-full bg-[#FAF1E6] px-3.5 py-1.5 text-xs font-bold text-[#3D2317]"
                    >
                      <LogOut className="h-3 w-3" />
                      {tx('Keluar', 'Sign Out')}
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#F6C945] px-4 py-1.5 text-xs font-extrabold text-[#3D2317]"
                    >
                      <LogIn className="h-3 w-3" />
                      {tx('Masuk', 'Sign In')}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* Main Workspace Body */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
            {children}

            {/* InsightPod-Styled Footer Inside Workspace */}
            <footer className="mt-14 rounded-[32px] bg-white border border-[#3D2317]/8 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <h2 className="max-w-lg text-xl sm:text-2xl font-extrabold tracking-tight leading-snug">
                  <span className="text-[#3D2317]">
                    {tx(
                      'Unlock invaluable wisdom personalized for ',
                      'Unlock invaluable wisdom personalized for '
                    )}
                  </span>
                  <span className="text-[#9C8D84]">
                    {tx(
                      'you in our top-notch reciprocal skill exchange.',
                      'you in our top-notch reciprocal skill exchange.'
                    )}
                  </span>
                </h2>

                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="self-start md:self-auto inline-flex items-center gap-2 rounded-full bg-[#FAF1E6] px-4 py-2 text-xs font-extrabold text-[#3D2317] hover:bg-[#F6C945] transition"
                >
                  <span>{tx('Ke Atas', 'Back to Top')}</span>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 text-base font-extrabold text-[#3D2317]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F6C945] text-[#3D2317]">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                  <span>SkillLoop</span>
                </Link>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-[#8C7A70]">
                  <Link to="/dashboard" className="hover:text-[#3D2317] transition">
                    Dashboard
                  </Link>
                  <Link to="/discover" className="hover:text-[#3D2317] transition">
                    {tx('Cari Partner', 'Discover')}
                  </Link>
                  <Link to="/skills" className="hover:text-[#3D2317] transition">
                    {tx('Skill Saya', 'Skills')}
                  </Link>
                  <Link to="/requests" className="hover:text-[#3D2317] transition">
                    {tx('Permintaan', 'Requests')}
                  </Link>
                  <Link to="/sessions" className="hover:text-[#3D2317] transition">
                    {tx('Jadwal Sesi', 'Episodes & Sessions')}
                  </Link>
                  <Link to="/community" className="hover:text-[#3D2317] transition">
                    {tx('Komunitas', 'Insiders')}
                  </Link>
                </div>
              </div>

              <div className="border-t border-[#3D2317]/10 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Twitter', letter: 't' },
                    { label: 'Instagram', letter: 'ig' },
                    { label: 'Facebook', letter: 'f' }
                  ].map((soc) => (
                    <button
                      key={soc.label}
                      type="button"
                      onClick={() => setGuideOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#3D2317]/20 bg-white px-4 py-1.5 text-xs font-bold text-[#3D2317] hover:bg-[#FAF1E6] transition"
                    >
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#3D2317] text-[9px] font-black text-white">
                        {soc.letter}
                      </span>
                      <span>{soc.label}</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs font-medium text-[#8C7A70]">
                  © {new Date().getFullYear()} SkillLoop — Reciprocal Peer Skill Exchange.
                </p>
              </div>
            </footer>
          </div>
        </div>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar ("bisa di lihat dari hp") */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-[#3D2317]/10 bg-white/95 backdrop-blur-md px-2 py-2 md:hidden shadow-lg"
      >
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center rounded-2xl px-3 py-1 text-[10px] font-bold transition ${
                  isActive
                    ? 'text-[#3D2317] font-extrabold'
                    : 'text-[#8C7A70] hover:text-[#3D2317]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-xl transition ${
                      isActive ? 'bg-[#F6C945] text-[#3D2317]' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="mt-0.5">{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute top-0.5 right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EE7838] px-1 text-[9px] font-extrabold text-white">
                      {tab.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* P0 Onboarding Guide Modal */}
      {guideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D2317]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[32px] bg-white p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-block rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
                  ONBOARDING GUIDE
                </span>
                <h3 className="mt-2 text-2xl font-extrabold text-[#3D2317]">
                  {tx(
                    'Cara Kerja Pertukaran di SkillLoop',
                    'How Reciprocal Skill Exchange Works'
                  )}
                </h3>
                <p className="mt-1 text-xs text-[#8C7A70]">
                  {tx(
                    'Setiap pengguna berperan sebagai Teacher sekaligus Learner tanpa transaksi uang.',
                    'Every member acts as both a Teacher and a Learner with zero monetary transactions.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="rounded-full border border-[#3D2317]/15 p-2 text-[#8C7A70] hover:text-[#3D2317]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#FAF1E6] p-4">
                <span className="text-[11px] font-extrabold text-[#EE7838]">
                  01 . SKILL PROFILE
                </span>
                <h4 className="mt-1 text-sm font-extrabold text-[#3D2317]">
                  {tx('Deklarasi Teach & Learn', 'Declare Teach & Learn Skills')}
                </h4>
                <p className="mt-1 text-xs text-[#8C7A70] leading-relaxed">
                  {tx(
                    'Tambahkan minimal 1 skill yang bisa kamu ajarkan beserta levelnya, dan 1 skill yang ingin kamu pelajari beserta tujuan belajarmu.',
                    'Add at least 1 skill you can teach with your proficiency level, and 1 skill you want to learn with your learning goals.'
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF1E6] p-4">
                <span className="text-[11px] font-extrabold text-[#4EA674]">
                  02 . RECIPROCAL MATCHING
                </span>
                <h4 className="mt-1 text-sm font-extrabold text-[#3D2317]">
                  {tx('Temukan Kecocokan Dua Arah', 'Discover Two-Way Matches')}
                </h4>
                <p className="mt-1 text-xs text-[#8C7A70] leading-relaxed">
                  {tx(
                    'Mesin pencocokan mencari partner yang membutuhkan skill-mu dan menguasai skill yang ingin kamu pelajari, lengkap dengan penjelasan alasan kecocokannya.',
                    'Our engine matches you with partners who want your skills and can teach what you seek, complete with transparent compatibility explanations.'
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF1E6] p-4">
                <span className="text-[11px] font-extrabold text-[#3D2317]">
                  03 . EXCHANGE AGREEMENT
                </span>
                <h4 className="mt-1 text-sm font-extrabold text-[#3D2317]">
                  {tx('Kirim Request & Counter Proposal', 'Send Requests & Counter Proposals')}
                </h4>
                <p className="mt-1 text-xs text-[#8C7A70] leading-relaxed">
                  {tx(
                    'Kirim permintaan pertukaran atau ajukan Counter Proposal hingga kedua pihak menyepakati jumlah sesi dan target belajar.',
                    'Send an exchange request or propose counter terms until both sides agree on target sessions and learning outcomes.'
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF1E6] p-4">
                <span className="text-[11px] font-extrabold text-[#74A8F2]">
                  04 . SESSIONS & FEEDBACK
                </span>
                <h4 className="mt-1 text-sm font-extrabold text-[#3D2317]">
                  {tx('Jadwalkan Sesi & Pantau Milestone', 'Schedule Sessions & Track Milestones')}
                </h4>
                <p className="mt-1 text-xs text-[#8C7A70] leading-relaxed">
                  {tx(
                    'Atur jadwal lintas zona waktu, diskusi via Private Messaging, perbarui milestone, dan berikan ulasan reputasi setelah sesi selesai.',
                    'Coordinate cross-timezone sessions, chat via Private Messaging, update milestones, and leave reputation reviews upon completion.'
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#3D2317]/10 pt-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4EA674]">
                <CheckCircle2 className="h-4 w-4" />
                <span>100% Peer-to-Peer Reciprocal Skill Exchange</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Link
                  to="/skills"
                  onClick={() => setGuideOpen(false)}
                  className="rounded-full bg-[#FAF1E6] px-5 py-2 text-xs font-bold text-[#3D2317]"
                >
                  {tx('Atur Skill', 'Manage Skills')}
                </Link>
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="rounded-full bg-[#F6C945] px-6 py-2 text-xs font-extrabold text-[#3D2317]"
                >
                  {tx('Mengerti', 'Got It')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
