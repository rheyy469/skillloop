import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CharacterPortrait } from '../components/CharacterPortraits';
import { api } from '../lib/api';

const WEEKLY_SESSIONS = [
  {
    id: 'ws-1',
    title: 'Quarter-life & UI/UX Career',
    author: 'Naya Putri ⇄ Raka',
    duration: '23:30',
    bg: 'bg-[#4EA674]',
    portraitVariant: 1,
    summary: 'Sesi bedah portofolio Figma & fundamental JavaScript untuk transisi karier produk digital.'
  },
  {
    id: 'ws-2',
    title: 'Finance & Python Gen Z',
    author: 'Alya Rahma ⇄ Farhan',
    duration: '45:00',
    bg: 'bg-[#F4979C]',
    portraitVariant: 2,
    summary: 'Automasi analisis data keuangan dengan Python ditukar dengan pembuatan dashboard React.'
  },
  {
    id: 'ws-3',
    title: 'Product Design & Pitching',
    author: 'Dimas Aditya ⇄ Naya',
    duration: '16:20',
    bg: 'bg-[#EE7838]',
    portraitVariant: 3,
    summary: 'Teknik komunikasi presentasi produk ditukar dengan pembuatan sistem komponen di Figma.'
  }
];

const TOP_PODCASTERS_MENTORS = [
  {
    id: 'raka',
    name: 'Mr. Raka Pratama',
    streams: '98% Match Fit . 12 Sesi',
    tech: ['JavaScript', 'HTML/CSS', 'UI/UX'],
    teach: 'JavaScript & HTML/CSS',
    learn: 'UI/UX Design & Figma',
    timezone: 'WIB (UTC+7)',
    email: 'raka@demo.skillloop.id',
    bg: 'bg-[#EE7838]',
    textColor: 'text-white',
    badgeBg: 'bg-white text-[#3D2317]',
    chipBg: 'bg-black/15 text-white',
    portraitVariant: 0
  },
  {
    id: 'naya',
    name: 'Nadia Lestary',
    streams: '98% Match Fit . 10 Sesi',
    tech: ['UI/UX Design', 'Figma', 'React'],
    teach: 'UI/UX Design & Figma',
    learn: 'JavaScript & React',
    timezone: 'WIB (UTC+7)',
    email: 'naya@demo.skillloop.id',
    bg: 'bg-[#432319]',
    textColor: 'text-white',
    badgeBg: 'bg-[#F6C945] text-[#3D2317]',
    chipBg: 'bg-white/12 text-white',
    portraitVariant: 1
  },
  {
    id: 'dimas',
    name: 'Evan Caster Lee',
    streams: '94% Match Fit . 8 Sesi',
    tech: ['HTML/CSS', 'Pitching', 'Figma'],
    teach: 'HTML/CSS & Pitching',
    learn: 'Figma Prototyping',
    timezone: 'WITA (UTC+8)',
    email: 'dimas@demo.skillloop.id',
    bg: 'bg-[#4EA674]',
    textColor: 'text-white',
    badgeBg: 'bg-white text-[#3D2317]',
    chipBg: 'bg-black/15 text-white',
    portraitVariant: 2
  },
  {
    id: 'alya',
    name: 'Stefy Catlyna',
    streams: '96% Match Fit . 11 Sesi',
    tech: ['Python', 'Data SQL', 'TypeScript'],
    teach: 'Python & Data SQL',
    learn: 'React & TypeScript',
    timezone: 'WIB (UTC+7)',
    email: 'alya@demo.skillloop.id',
    bg: 'bg-[#F6C945]',
    textColor: 'text-[#3D2317]',
    badgeBg: 'bg-[#3D2317] text-white',
    chipBg: 'bg-[#3D2317]/10 text-[#3D2317]',
    portraitVariant: 3
  }
];

const DIFFERENCE_POINTS = [
  {
    id: 'diff-1',
    title: 'Content Relevance — 100% Two-Way Reciprocal Match',
    detail: 'Algoritma mencocokkan 100% timbal-balik: kamu mengajar yang mereka cari, dan sebaliknya.'
  },
  {
    id: 'diff-2',
    title: 'Depth of Insight — Explainable Compatibility Score',
    detail: 'Dilengkapi penjelasan kecocokan level, irisan bahasa, dan ketersediaan zona waktu.'
  },
  {
    id: 'diff-3',
    title: 'Combination of 1-on-1 Sessions & Community Circles',
    detail: 'Mendukung sesi privat 1-on-1 maupun kelompok belajar komunitas dengan ruang video.'
  },
  {
    id: 'diff-4',
    title: 'Reliable Source of Knowledge — Canonical Skill Catalog',
    detail: 'Katalog skill kanonis bebas duplikat dengan ulasan reputasi transparan pasca-sesi.'
  }
];

export function LandingPage() {
  const { refreshUser } = useAuth();
  const { tx } = useLanguage();
  const navigate = useNavigate();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedMentorIdx, setSelectedMentorIdx] = useState<number | null>(null);
  const [activeDiffId, setActiveDiffId] = useState<string>('diff-1');
  const [loggingInDemo, setLoggingInDemo] = useState(false);

  const activeSession = WEEKLY_SESSIONS.find((s) => s.id === activeSessionId);
  const activeMentor =
    selectedMentorIdx !== null ? TOP_PODCASTERS_MENTORS[selectedMentorIdx] : null;

  useEffect(() => {
    if (selectedMentorIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMentorIdx(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMentorIdx]);

  const handleQuickDemo = async (email: string) => {
    setLoggingInDemo(true);
    try {
      await api.auth.login({
        email,
        password: 'DemoSkillLoop123!'
      });
      await refreshUser();
      navigate('/dashboard');
    } finally {
      setLoggingInDemo(false);
    }
  };

  return (
    <div className="space-y-12 text-[#3D2317]">
      {/* 1. HERO SECTION (With Book/Page Icons & Vector Character Illustrations) */}
      <section className="rounded-[36px] border border-[#3D2317]/10 bg-[#FAF1E6] p-6 sm:p-10 shadow-sm grid items-center gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#3D2317] leading-[1.12]">
            {tx(
              'Navigating Ideas, Sharing Insights.',
              'Navigating Ideas, Sharing Insights.'
            )}
          </h1>

          <p className="max-w-md text-xs sm:text-sm text-[#8C7A70] leading-relaxed">
            {tx(
              'Buka wawasan berharga yang dipersonalisasi untukmu di platform pertukaran skill dua arah kami. Ajarkan keahlianmu dan pelajari skill baru sesuai minatmu.',
              'Unlock invaluable wisdom personalized for you in our top-notch skill exchange. Dive into reciprocal sessions designed to deliver relevant insights that cater to your interests and needs.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/register"
              className="group inline-flex items-center gap-3 rounded-full bg-[#F6C945] pl-6 pr-2.5 py-2.5 text-xs sm:text-sm font-extrabold text-[#3D2317] shadow-md hover:bg-[#EE7838] hover:text-white transition"
            >
              <span>{tx('Buat Akun / Mulai Belajar', 'Create Account / Start')}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#3D2317] shadow-sm group-hover:scale-105 transition">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#3D2317]/20 bg-white px-5 py-2.5 text-xs font-bold text-[#3D2317] hover:bg-[#3D2317] hover:text-white transition"
            >
              <span>{tx('Masuk', 'Sign In')}</span>
            </Link>

            <button
              type="button"
              disabled={loggingInDemo}
              onClick={() => handleQuickDemo('raka@demo.skillloop.id')}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#3D2317]/20 bg-white px-5 py-2.5 text-xs font-bold text-[#3D2317] hover:bg-[#3D2317] hover:text-white transition"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#EE7838]" />
              <span>{loggingInDemo ? 'Memuat...' : tx('Demo 1-Klik', '1-Click Demo')}</span>
            </button>
          </div>
        </div>

        {/* Right Hero Playful Geometric Collage with Book/Page Icons */}
        <div className="lg:col-span-6">
          <div className="relative mx-auto max-w-[440px] select-none">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 shadow-sm text-[#EE7838]">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-[11px] font-extrabold text-[#3D2317]">SkillBook</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSessionId(WEEKLY_SESSIONS[0].id)}
                    title="Buka Preview Modul"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4979C] text-white shadow-sm hover:scale-105 transition"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#F4979C]">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                  </button>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#74A8F2] text-white shadow-sm">
                    <FileText className="h-4 w-4" />
                  </span>
                </div>

                <div className="h-20 w-20 rounded-bl-[12px] rounded-tr-[72px] rounded-tl-[12px] rounded-br-[12px] bg-[#432319]" />
              </div>

              <div className="col-span-5 relative">
                <div className="absolute -top-3 right-0 z-10 rounded-full bg-white px-3.5 py-1 text-xs font-extrabold text-[#3D2317] shadow-md">
                  Hello!
                </div>
                <div className="overflow-hidden rounded-t-full rounded-b-[48px] bg-[#F6C945] pt-4 px-2 pb-0 shadow-md h-48 flex items-end justify-center">
                  <CharacterPortrait variant={0} className="h-44 w-full" />
                </div>
              </div>

              <div className="col-span-3 flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-2xl rotate-12 bg-[#74A8F2] shadow-sm" />

                <div className="-ml-8 z-10 rotate-6 rounded-full bg-[#432319] px-4 py-1.5 text-xs font-extrabold text-white shadow-md">
                  SkillLoop
                </div>

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EE7838] text-white shadow-md">
                  <BookOpen className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-12 gap-3 items-end">
              <div className="col-span-3">
                <div className="h-20 w-full rounded-t-full bg-[#4EA674]" />
              </div>

              <div className="col-span-7 relative">
                <div className="flex items-center justify-between overflow-hidden rounded-[36px] bg-[#432319] h-28 px-4 shadow-md">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-[#F6C945]/20 flex items-end justify-center">
                    <CharacterPortrait variant={4} className="h-24 w-24" />
                  </div>
                  <div className="ml-2 text-left text-white flex-1 min-w-0">
                    <span className="inline-block rounded-full bg-[#F6C945] px-2.5 py-0.5 text-[10px] font-extrabold text-[#3D2317]">
                      98% Match!
                    </span>
                    <p className="mt-1 text-xs font-extrabold truncate">Naya ⇄ Raka</p>
                    <p className="text-[10px] text-white/75 truncate">UI/UX ⇄ JavaScript</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 flex justify-center">
                <div className="flex h-20 w-10 items-center justify-center rounded-full bg-[#F6C945]">
                  <div className="h-10 w-3 rounded-full bg-[#FAF1E6]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHITE BACKGROUND CONTENT CONTAINER */}
      <div className="bg-white rounded-[36px] border border-[#3D2317]/10 p-6 sm:p-10 shadow-sm space-y-14">
        {/* 2. WEEKLY SKILL SESSIONS ROW (With Circular Book/Page Button) */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#3D2317]">
              {tx('Weekly Skill Sessions', 'Weekly Skill Sessions')}
            </h2>
            <Link
              to="/sessions"
              className="rounded-full border border-[#F6C945] bg-[#FAF1E6]/50 px-5 py-1.5 text-xs font-bold text-[#EE7838] hover:bg-[#F6C945] hover:text-[#3D2317] transition"
            >
              {tx('See all', 'See all')}
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WEEKLY_SESSIONS.map((item) => {
              const isOpen = activeSessionId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() =>
                    setActiveSessionId((prev) => (prev === item.id ? null : item.id))
                  }
                  className={`cursor-pointer flex items-center justify-between gap-3.5 rounded-[24px] border p-3.5 transition shadow-sm ${
                    isOpen
                      ? 'border-[#F6C945] bg-[#FAF1E6]'
                      : 'border-[#3D2317]/10 bg-white hover:bg-[#FAF1E6]/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl ${item.bg} pt-1 flex items-end justify-center`}
                    >
                      <CharacterPortrait variant={item.portraitVariant} className="h-15 w-15" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-extrabold text-[#3D2317]">
                        {item.title}
                      </h3>
                      <p className="truncate text-[11px] font-medium text-[#8C7A70]">
                        {item.author}
                      </p>
                      <p className="mt-1.5 text-xs font-extrabold text-[#3D2317]">
                        {item.duration}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Buka ${item.title}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6C945] text-[#3D2317] shadow-sm hover:bg-[#EE7838] hover:text-white transition"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {activeSession && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-[#432319] px-5 py-4 text-white shadow-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F6C945] text-[#3D2317]">
                  <BookOpen className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#EE7838] px-2 py-0.5 text-[10px] font-extrabold">
                      SILABUS SESI
                    </span>
                    <span className="text-xs font-extrabold">{activeSession.title}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-white/80">{activeSession.summary}</p>
                </div>
              </div>
              <Link
                to="/discover"
                className="shrink-0 rounded-full bg-[#F6C945] px-4 py-1.5 text-xs font-extrabold text-[#3D2317] hover:bg-white transition"
              >
                {tx('Ikuti Sesi Ini →', 'Join This Exchange →')}
              </Link>
            </div>
          )}
        </section>

        {/* 3. TOP MENTORS OF THE WEEK (Clean Card: Name, Profile Tech, Portrait; Teach/Learn in Modal) */}
        <section>
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D2317] leading-tight">
              {tx('Top Skill Mentors', 'Top Skill Mentors')}
              <br />
              {tx('of the week', 'of the week')}
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TOP_PODCASTERS_MENTORS.map((mentor, idx) => {
              const isSelected = selectedMentorIdx === idx;
              return (
                <button
                  key={mentor.id}
                  type="button"
                  onClick={() => setSelectedMentorIdx(idx)}
                  className={`group text-center cursor-pointer relative overflow-hidden rounded-[28px] ${mentor.bg} ${mentor.textColor} p-5 pt-6 transition-all duration-300 shadow-md flex flex-col items-center justify-between min-h-[350px] ${
                    isSelected
                      ? 'ring-4 ring-[#3D2317]/25 -translate-y-1'
                      : 'hover:-translate-y-1 hover:shadow-lg'
                  }`}
                >
                  <span
                    className={`absolute right-3.5 top-3.5 flex h-6 w-6 items-center justify-center rounded-full ${mentor.chipBg} opacity-75 group-hover:opacity-100 group-hover:scale-105 transition`}
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>

                  {/* Card Header: Centered Name + Divider + Profile Tech Tags */}
                  <div className="relative z-10 w-full space-y-3 pt-1">
                    <div className="space-y-2">
                      <h3 className="px-4 text-[22px] sm:text-2xl font-extrabold tracking-tight leading-tight">
                        {mentor.name}
                      </h3>
                      <div
                        aria-hidden="true"
                        className="mx-auto h-[3px] w-10 rounded-full bg-current opacity-35"
                      />
                    </div>

                    <div className="flex flex-wrap justify-center gap-1.5">
                      {mentor.tech.map((skill) => (
                        <span
                          key={skill}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${mentor.chipBg}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Full-Bleed Character Portrait at Bottom */}
                  <div className="relative z-10 mt-4 -mx-3 -mb-5 flex w-[calc(100%+1.5rem)] justify-center">
                    <div className="h-48 w-full max-w-[220px] transition-transform duration-300 group-hover:scale-[1.03]">
                      <CharacterPortrait variant={mentor.portraitVariant} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* MENTOR DETAIL MODAL (Teach & Learn + Quick Action on Card Click) */}
        {activeMentor && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mentor-modal-title"
            onClick={() => setSelectedMentorIdx(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-2xl border border-[#3D2317]/10"
            >
              <div className={`${activeMentor.bg} ${activeMentor.textColor} p-6 pb-5 relative`}>
                <button
                  type="button"
                  aria-label="Tutup detail mentor"
                  onClick={() => setSelectedMentorIdx(null)}
                  className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full ${activeMentor.chipBg} hover:opacity-80 transition`}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-4 pr-8">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white/20 pt-1 flex items-end justify-center">
                    <CharacterPortrait variant={activeMentor.portraitVariant} className="h-20 w-20" />
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${activeMentor.badgeBg}`}
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>{activeMentor.streams}</span>
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeMentor.chipBg}`}>
                        {activeMentor.timezone}
                      </span>
                    </div>
                    <h3 id="mentor-modal-title" className="text-xl font-extrabold leading-tight">
                      {activeMentor.name}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 text-[#3D2317]">
                <div className="space-y-2.5 text-xs">
                  <div className="rounded-2xl bg-[#FAF1E6] p-3.5 border border-[#3D2317]/10">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#EE7838]">
                      Teach
                    </span>
                    <p className="mt-0.5 text-sm font-extrabold text-[#3D2317]">
                      {activeMentor.teach}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#FAF1E6] p-3.5 border border-[#3D2317]/10">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider text-[#4EA674]">
                      Learn
                    </span>
                    <p className="mt-0.5 text-sm font-extrabold text-[#3D2317]">
                      {activeMentor.learn}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Link
                    to="/discover"
                    onClick={() => setSelectedMentorIdx(null)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#F6C945] px-4 py-2.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition"
                  >
                    <span>{tx('Eksplorasi Partner', 'Discover Partners')}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>

                  <button
                    type="button"
                    disabled={loggingInDemo}
                    onClick={() => handleQuickDemo(activeMentor.email)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#3D2317]/20 bg-white px-4 py-2.5 text-xs font-bold text-[#3D2317] hover:bg-[#3D2317] hover:text-white transition"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[#EE7838]" />
                    <span>
                      {loggingInDemo
                        ? 'Memuat...'
                        : tx('Demo sbg Persona', 'Demo as Persona')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. TWO-TONE STATEMENT + STATS (5+, 12+, 236) + GEOMETRIC COLLAGE */}
        <section>
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                <span className="text-[#3D2317]">
                  {tx(
                    'Our platform dives into diverse topics like life, coding, design, ',
                    'Our platform dives into diverse topics like life, coding, design, '
                  )}
                </span>
                <span className="text-[#9C8D84]">
                  {tx(
                    'and personal experiences, offering valuable insights and practical advice.',
                    'and personal experiences, offering valuable insights and practical advice.'
                  )}
                </span>
              </h2>

              <div className="grid gap-6 sm:grid-cols-12 items-center pt-2">
                <div className="sm:col-span-7 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-3xl sm:text-4xl font-extrabold text-[#EE7838]">
                      5+
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-[#8C7A70]">
                      {tx('Skill Categories', 'Skill Categories')}
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl sm:text-4xl font-extrabold text-[#EE7838]">
                      12+
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-[#8C7A70]">
                      {tx('Canonical Skills', 'Canonical Skills')}
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl sm:text-4xl font-extrabold text-[#EE7838]">
                      236
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-[#8C7A70]">
                      {tx('Active Mentors', 'Active Mentors')}
                    </p>
                  </div>
                </div>

                <p className="sm:col-span-5 text-xs text-[#8C7A70] leading-relaxed">
                  {tx(
                    'Unlock invaluable wisdom personalized for you in our top-notch skill exchange. Dive into sessions designed to deliver relevant insights.',
                    'Unlock invaluable wisdom personalized for you in our top-notch skill exchange. Dive into sessions designed to deliver relevant insights.'
                  )}
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative h-56 w-64 select-none">
                <div className="absolute top-0 left-2 h-20 w-20 rounded-full border-[14px] border-[#4EA674]" />
                <div className="absolute top-2 right-4 flex h-10 w-10 rotate-12 items-center justify-center rounded-xl bg-[#EE7838] text-white">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="absolute top-12 right-14 h-16 w-16 rounded-full overflow-hidden bg-[#432319] shadow-md border-2 border-white">
                  <CharacterPortrait variant={1} />
                </div>
                <div className="absolute bottom-2 left-4 h-20 w-20 rotate-12 rounded-[24px] bg-[#F4979C]" />
                <div className="absolute bottom-10 left-28 flex h-7 w-7 items-center justify-center rounded-lg bg-[#74A8F2] text-white">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="absolute bottom-2 right-2 h-16 w-28 -rotate-45 rounded-b-full bg-[#F6C945]" />
              </div>
            </div>
          </div>
        </section>

        {/* 5. WHAT MAKES US DIFFERENT FROM OTHER (With Book/Notebook Capsule Illustration) */}
        <section>
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative flex flex-col items-center justify-between rounded-full bg-[#F6C945] w-44 h-72 p-6 shadow-md">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/80 bg-[#F6C945]">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
                <div className="flex flex-col items-center">
                  <div className="h-6 w-3 rounded-full bg-[#EE7838] mb-1" />
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#3D2317] text-white shadow-lg">
                    <FileText className="h-12 w-12 text-[#F6C945]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D2317] leading-tight">
                {tx(
                  'What makes us different from other',
                  'What makes us different from other'
                )}
              </h2>
              <p className="max-w-lg text-xs sm:text-sm text-[#8C7A70] leading-relaxed">
                {tx(
                  'Our commitment is to keep you comfortable by delivering quality reciprocal skill exchange, trusted peers, and useful material.',
                  'Our commitment is to keep you comfortable by delivering quality reciprocal skill exchange, trusted peers, and useful material.'
                )}
              </p>

              <div className="space-y-2.5 pt-1">
                {DIFFERENCE_POINTS.map((pt) => {
                  const isSelected = activeDiffId === pt.id;
                  return (
                    <div
                      key={pt.id}
                      onClick={() => setActiveDiffId(pt.id)}
                      className={`cursor-pointer rounded-2xl p-3 transition ${
                        isSelected ? 'bg-[#FAF1E6]' : 'hover:bg-[#FAF1E6]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F6C945] text-[#3D2317]">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                        <span className="text-xs sm:text-sm font-extrabold text-[#3D2317]">
                          {pt.title}
                        </span>
                      </div>
                      {isSelected && (
                        <p className="mt-1.5 pl-9 text-xs text-[#8C7A70] leading-relaxed">
                          {pt.detail}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 6. DEEP ESPRESSO BROWN CTA BANNER (#432319) */}
        <section>
          <div className="relative overflow-hidden rounded-[32px] bg-[#432319] px-6 py-10 sm:px-12 sm:py-14 text-white shadow-xl">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              <div className="hidden lg:flex lg:col-span-4 items-center justify-center relative h-36">
                <div className="h-24 w-24 rounded-l-full bg-[#4EA674]" />
                <div className="-ml-4 flex flex-col gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4979C]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#F4979C]">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="h-16 w-20 rounded-br-full bg-[#EE7838]" />
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4">
                <h2 className="max-w-lg text-2xl sm:text-3xl font-extrabold leading-snug text-white">
                  {tx(
                    'Explore the latest and exciting skill exchange content',
                    'Explore the latest and exciting skill exchange content'
                  )}
                </h2>
                <p className="max-w-md text-xs sm:text-sm text-white/75 leading-relaxed">
                  {tx(
                    "Don't miss the valuable updates in each session and join our exciting reciprocal learning community.",
                    "Don't miss the valuable updates in each session and join our exciting reciprocal learning community."
                  )}
                </p>

                <div className="pt-2">
                  <Link
                    to="/discover"
                    className="group inline-flex items-center gap-3 rounded-full bg-[#F6C945] pl-6 pr-2.5 py-2.5 text-xs sm:text-sm font-extrabold text-[#3D2317] shadow-md hover:bg-white transition"
                  >
                    <span>{tx('Eksplorasi Partner', 'Discover Now')}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#3D2317] shadow-sm">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
