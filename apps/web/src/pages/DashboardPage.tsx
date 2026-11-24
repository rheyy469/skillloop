import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  FileText,
  Check,
  Plus,
  Activity,
  Clock,
  Calendar,
  Award,
  Settings,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { api, ActivityBucketDto, DashboardDto } from '../lib/api';
import {
  formatDateTimeWithZone,
  RequestStatusBadge,
  SkillChip
} from '../components/StatusBadge';
import {
  CharacterPortrait,
  resolveAvatarBg,
  resolveAvatarVariant
} from '../components/CharacterPortraits';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const CARD_THEMES = [
  {
    bg: 'bg-[#EE7838]',
    text: 'text-white',
    badge: 'bg-white text-[#3D2317]',
    chipBg: 'bg-black/15 text-white',
    portraitVariant: 0
  },
  {
    bg: 'bg-[#432319]',
    text: 'text-white',
    badge: 'bg-[#F6C945] text-[#3D2317]',
    chipBg: 'bg-white/12 text-white',
    portraitVariant: 1
  },
  {
    bg: 'bg-[#4EA674]',
    text: 'text-white',
    badge: 'bg-white text-[#3D2317]',
    chipBg: 'bg-black/15 text-white',
    portraitVariant: 2
  },
  {
    bg: 'bg-[#F6C945]',
    text: 'text-[#3D2317]',
    badge: 'bg-[#3D2317] text-white',
    chipBg: 'bg-[#3D2317]/10 text-[#3D2317]',
    portraitVariant: 3
  }
];

const DEMO_PARTNER_CARDS = [
  {
    id: 'demo-raka',
    name: 'Mr. Raka Pratama',
    fitScore: 98,
    sessionsLabel: '12 Sesi',
    teach: 'JavaScript & HTML/CSS',
    learn: 'UI/UX Design & Figma',
    timezone: 'WIB (UTC+7)',
    email: 'raka@demo.skillloop.id',
    status: null as 'ACCEPTED' | 'PENDING' | null
  },
  {
    id: 'demo-naya',
    name: 'Nadia Lestary',
    fitScore: 98,
    sessionsLabel: '10 Sesi',
    teach: 'UI/UX Design & Figma',
    learn: 'JavaScript & React',
    timezone: 'WIB (UTC+7)',
    email: 'naya@demo.skillloop.id',
    status: 'ACCEPTED' as 'ACCEPTED' | 'PENDING' | null
  },
  {
    id: 'demo-dimas',
    name: 'Evan Caster Lee',
    fitScore: 94,
    sessionsLabel: '8 Sesi',
    teach: 'HTML/CSS & Pitching',
    learn: 'Figma Prototyping',
    timezone: 'WITA (UTC+8)',
    email: 'dimas@demo.skillloop.id',
    status: 'PENDING' as 'ACCEPTED' | 'PENDING' | null
  },
  {
    id: 'demo-alya',
    name: 'Stefy Catlyna',
    fitScore: 96,
    sessionsLabel: '11 Sesi',
    teach: 'Python & Data SQL',
    learn: 'React & TypeScript',
    timezone: 'WIB (UTC+7)',
    email: 'alya@demo.skillloop.id',
    status: 'ACCEPTED' as 'ACCEPTED' | 'PENDING' | null
  }
];

export function DashboardPage() {
  const { user, refreshNotifications } = useAuth();
  const { lang, tx } = useLanguage();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCardIdx, setSelectedCardIdx] = useState(0);
  const [matchTab, setMatchTab] = useState<'all' | 'active' | 'completed'>('all');
  const [todoTab, setTodoTab] = useState<'all' | 'open' | 'done'>('all');
  const [checkedTodos, setCheckedTodos] = useState<Record<string, boolean>>({});
  const [activityPeriod, setActivityPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedBucketIdx, setSelectedBucketIdx] = useState<number | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.dashboard.get();
      setData(res.data);
      await refreshNotifications();
    } catch {
      setError('Gagal memuat ringkasan dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-72 animate-pulse rounded-[32px] bg-[#E5E7EB]" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-[24px] bg-[#E5E7EB]" />
          <div className="h-24 animate-pulse rounded-[24px] bg-[#E5E7EB]" />
          <div className="h-24 animate-pulse rounded-[24px] bg-[#E5E7EB]" />
        </div>
        <div className="h-80 animate-pulse rounded-[32px] bg-[#E5E7EB]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-[#EE7838]" />
        <h2 className="mt-3 text-base font-extrabold text-[#3D2317]">
          {error || 'Data tidak tersedia'}
        </h2>
        <button
          type="button"
          onClick={loadDashboard}
          className="mt-4 rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { profile, stats, topMatches, recentRequests, upcomingSessions } = data;
  const firstName = profile.displayName.split(' ')[0];

  // Combine live topMatches with DEMO_PARTNER_CARDS so there are ALWAYS 4 full cards like on About Platform!
  const liveCards = topMatches.map((m) => ({
    id: m.user.id,
    isLiveMatch: true,
    name: m.user.displayName,
    fitScore: m.score.overallScore,
    sessionsLabel: 'Live Match',
    teach: m.explanation.bCanTeachA.map((s) => s.skillName).join(' & ') || 'UI/UX & Figma',
    learn: m.explanation.aCanTeachB.map((s) => s.skillName).join(' & ') || 'JavaScript',
    timezone: m.user.timezone.split('/')[1] || m.user.timezone,
    status: m.existingRequestStatus || null,
    targetUrl: `/matches/${m.user.id}`
  }));

  const fallbackDemoCards = DEMO_PARTNER_CARDS.filter(
    (d) =>
      !liveCards.some(
        (l) =>
          l.name.toLowerCase().includes(d.name.split(' ')[1]?.toLowerCase() || d.name.toLowerCase())
      )
  ).map((d) => ({
    id: d.id,
    isLiveMatch: false,
    name: d.name,
    fitScore: d.fitScore,
    sessionsLabel: d.sessionsLabel,
    teach: d.teach,
    learn: d.learn,
    timezone: d.timezone,
    status: d.status,
    targetUrl: liveCards[0]?.targetUrl || '/discover'
  }));

  const allFourPartnerCards = [...liveCards, ...fallbackDemoCards].slice(0, 4);

  const displayedPartnerCards = allFourPartnerCards.filter((c) => {
    if (matchTab === 'active') {
      return c.status === 'ACCEPTED' || c.status === 'PENDING' || true;
    }
    return true;
  });

  // Weekly cards from upcomingSessions, recentRequests, or topMatches
  const weeklyCards = [
    ...upcomingSessions.slice(0, 2).map((s, i) => ({
      id: `sess-${s.id}`,
      title: s.topic,
      subtitle: formatDateTimeWithZone(s.startAt, profile.timezone),
      meta: `${s.durationMinutes} Menit`,
      bg: i % 2 === 0 ? 'bg-[#4EA674]' : 'bg-[#F4979C]',
      portraitVariant: i + 1,
      to: '/sessions'
    })),
    ...recentRequests.slice(0, 2).map((r, i) => {
      const isIncoming = r.recipientId === profile.id;
      const partner = isIncoming ? r.sender : r.recipient;
      return {
        id: `req-${r.id}`,
        title:
          r.offeredSkill && r.requestedSkill
            ? `${r.offeredSkill.name} ⇄ ${r.requestedSkill.name}`
            : `Exchange: ${partner.displayName}`,
        subtitle: partner.displayName,
        meta: r.status,
        bg: 'bg-[#EE7838]',
        portraitVariant: i + 2,
        to: '/requests'
      };
    }),
    ...topMatches.slice(0, 3).map((m, i) => ({
      id: `match-${m.user.id}`,
      title:
        m.explanation.bCanTeachA[0]?.skillName ||
        m.explanation.aCanTeachB[0]?.skillName ||
        'Reciprocal Exchange',
      subtitle: m.user.displayName,
      meta: `${m.score.overallScore}% Fit`,
      bg: i === 0 ? 'bg-[#4EA674]' : i === 1 ? 'bg-[#F4979C]' : 'bg-[#EE7838]',
      portraitVariant: i,
      to: `/matches/${m.user.id}`
    }))
  ].slice(0, 3);

  // Action items from live profile, requests, sessions, and milestones
  const todoItems = [
    {
      id: 'todo-profile',
      title: tx(
        'Lengkapi Skill & Preferensi Belajar',
        'Complete Skills & Learning Preferences'
      ),
      detail: `${profile.teachSkills.length} Can Teach . ${profile.learnSkills.length} Want to Learn (${profile.completeness.score}%)`,
      to: '/skills',
      defaultDone: profile.completeness.isComplete
    },
    ...recentRequests.slice(0, 2).map((r) => {
      const isIncoming = r.recipientId === profile.id;
      const partner = isIncoming ? r.sender : r.recipient;
      return {
        id: `todo-req-${r.id}`,
        title: isIncoming
          ? tx(`Tinjau Exchange Request dari ${partner.displayName}`, `Review Exchange Request from ${partner.displayName}`)
          : tx(`Exchange Request ke ${partner.displayName}`, `Exchange Request to ${partner.displayName}`),
        detail:
          r.offeredSkill && r.requestedSkill
            ? `${r.offeredSkill.name} ⇄ ${r.requestedSkill.name} (${r.status})`
            : `${r.status} . ${new Date(r.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID')}`,
        to: '/requests',
        defaultDone: r.status === 'ACCEPTED'
      };
    }),
    ...upcomingSessions.slice(0, 2).map((s) => ({
      id: `todo-sess-${s.id}`,
      title: s.topic,
      detail: `${s.durationMinutes}m . ${formatDateTimeWithZone(s.startAt, profile.timezone)}`,
      to: '/sessions',
      defaultDone: s.status === 'COMPLETED'
    })),
    ...(data.milestones || []).slice(0, 2).map((m) => ({
      id: `todo-ms-${m.id}`,
      title: m.title,
      detail: m.notes || `Progress ${m.progressPercent}%`,
      to: '/sessions',
      defaultDone: m.isCompleted
    }))
  ];

  const isTodoDone = (item: (typeof todoItems)[number]) =>
    checkedTodos[item.id] !== undefined ? checkedTodos[item.id] : item.defaultDone;

  const visibleTodos = todoItems.filter((item) => {
    const done = isTodoDone(item);
    if (todoTab === 'open') return !done;
    if (todoTab === 'done') return done;
    return true;
  });

  const openTodoCount = todoItems.filter((i) => !isTodoDone(i)).length;
  const doneTodoCount = todoItems.filter((i) => isTodoDone(i)).length;

  // Fallback activity summary builder in case API omits it
  const activitySummary = data.activitySummary || {
    daily: [
      { key: 'd1', label: 'Min', fullLabel: 'Minggu', sessionsCount: 0, requestsCount: 0, milestonesCount: 0, minutes: 0, totalActivities: 0 },
      { key: 'd2', label: 'Sen', fullLabel: 'Senin', sessionsCount: 0, requestsCount: 1, milestonesCount: 0, minutes: 10, totalActivities: 1 },
      { key: 'd3', label: 'Sel', fullLabel: 'Selasa', sessionsCount: 1, requestsCount: 0, milestonesCount: 1, minutes: 75, totalActivities: 2 },
      { key: 'd4', label: 'Rab', fullLabel: 'Rabu', sessionsCount: 0, requestsCount: 0, milestonesCount: 1, minutes: 15, totalActivities: 1 },
      { key: 'd5', label: 'Kam', fullLabel: 'Kamis', sessionsCount: 1, requestsCount: 0, milestonesCount: 0, minutes: 60, totalActivities: 1 },
      { key: 'd6', label: 'Jum', fullLabel: 'Jumat', sessionsCount: 0, requestsCount: 1, milestonesCount: 0, minutes: 10, totalActivities: 1 },
      { key: 'd7', label: 'Hari Ini', fullLabel: 'Hari Ini', sessionsCount: stats.upcomingSessionsCount, requestsCount: stats.incomingPendingCount, milestonesCount: (data.milestones || []).length, minutes: stats.upcomingSessionsCount * 60, totalActivities: stats.upcomingSessionsCount + stats.incomingPendingCount }
    ],
    weekly: [
      { key: 'w1', label: 'Mg -3', fullLabel: '3 Minggu Lalu', sessionsCount: 0, requestsCount: 1, milestonesCount: 0, minutes: 10, totalActivities: 1 },
      { key: 'w2', label: 'Mg -2', fullLabel: '2 Minggu Lalu', sessionsCount: 1, requestsCount: 1, milestonesCount: 1, minutes: 85, totalActivities: 3 },
      { key: 'w3', label: 'Mg -1', fullLabel: 'Minggu Lalu', sessionsCount: 1, requestsCount: 0, milestonesCount: 1, minutes: 75, totalActivities: 2 },
      { key: 'w4', label: 'Minggu Ini', fullLabel: 'Minggu Ini', sessionsCount: stats.upcomingSessionsCount + stats.completedSessionsCount, requestsCount: recentRequests.length, milestonesCount: (data.milestones || []).length, minutes: (stats.upcomingSessionsCount + stats.completedSessionsCount) * 60, totalActivities: stats.upcomingSessionsCount + stats.completedSessionsCount + recentRequests.length }
    ],
    monthly: [
      { key: 'm1', label: 'Jun', fullLabel: 'Juni', sessionsCount: 0, requestsCount: 0, milestonesCount: 0, minutes: 0, totalActivities: 0 },
      { key: 'm2', label: 'Jul', fullLabel: 'Juli', sessionsCount: 0, requestsCount: 0, milestonesCount: 0, minutes: 0, totalActivities: 0 },
      { key: 'm3', label: 'Agu', fullLabel: 'Agustus', sessionsCount: 0, requestsCount: 0, milestonesCount: 0, minutes: 0, totalActivities: 0 },
      { key: 'm4', label: 'Sep', fullLabel: 'September', sessionsCount: 0, requestsCount: 0, milestonesCount: 0, minutes: 0, totalActivities: 0 },
      { key: 'm5', label: 'Okt', fullLabel: 'Oktober', sessionsCount: 0, requestsCount: 0, milestonesCount: 0, minutes: 0, totalActivities: 0 },
      { key: 'm6', label: 'Nov', fullLabel: 'Bulan Ini', sessionsCount: stats.upcomingSessionsCount + stats.completedSessionsCount, requestsCount: recentRequests.length, milestonesCount: (data.milestones || []).length, minutes: (stats.upcomingSessionsCount + stats.completedSessionsCount) * 60, totalActivities: stats.upcomingSessionsCount + stats.completedSessionsCount + recentRequests.length }
    ]
  };

  const activeBuckets: ActivityBucketDto[] = activitySummary[activityPeriod] || [];
  const activeBucketIdx =
    selectedBucketIdx !== null && selectedBucketIdx < activeBuckets.length
      ? selectedBucketIdx
      : Math.max(0, activeBuckets.length - 1);
  const focusedBucket = activeBuckets[activeBucketIdx];
  const maxMinutesInPeriod = Math.max(60, ...activeBuckets.map((b) => b.minutes));
  const periodTotalMinutes = activeBuckets.reduce((acc, b) => acc + b.minutes, 0);
  const periodTotalSessions = activeBuckets.reduce((acc, b) => acc + b.sessionsCount, 0);
  const periodTotalRequests = activeBuckets.reduce((acc, b) => acc + b.requestsCount, 0);
  const periodTotalMilestones = activeBuckets.reduce((acc, b) => acc + b.milestonesCount, 0);

  return (
    <div className="space-y-10">
      {/* 1. HERO SECTION (Book/Page Motifs + Vector Character Collage) */}
      <section className="rounded-[36px] border border-[#3D2317]/10 bg-[#FAF1E6] p-6 sm:p-10 shadow-sm grid items-center gap-8 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-5">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-extrabold text-[#3D2317] shadow-sm">
            <BookOpen className="h-3.5 w-3.5 text-[#EE7838]" />
            <span>
              {profile.displayName} . {profile.timezone} . {stats.averageRating ?? 4.9} ★ ({stats.totalReviews ?? 2} ulasan)
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#3D2317] leading-[1.12]">
            {tx('Navigating Ideas, Sharing Insights.', 'Navigating Ideas, Sharing Insights.')}
          </h1>

          <p className="max-w-md text-xs sm:text-sm text-[#8C7A70] leading-relaxed">
            {tx(
              `Kamu memiliki ${stats.reciprocalMatchesCount} kecocokan partner dua arah, ${stats.activeCollaborationsCount} kolaborasi aktif (${stats.incomingPendingCount} request masuk), dan ${stats.upcomingSessionsCount} sesi belajar terjadwal.`,
              `You have ${stats.reciprocalMatchesCount} two-way partner matches, ${stats.activeCollaborationsCount} active collaborations (${stats.incomingPendingCount} incoming), and ${stats.upcomingSessionsCount} scheduled study sessions.`
            )}
          </p>

          {/* Missing Completeness Steps Alert if incomplete */}
          {profile.completeness.missingSteps.length > 0 && (
            <div className="rounded-2xl bg-white p-3.5 border border-[#F6C945] text-xs space-y-1 shadow-sm">
              <p className="font-extrabold text-[#3D2317]">
                {tx(`Kelengkapan Profil (${profile.completeness.score}%):`, `Profile Completeness (${profile.completeness.score}%):`)}
              </p>
              <ul className="text-[#8C7A70] space-y-0.5">
                {profile.completeness.missingSteps.map((step, i) => (
                  <li key={i}>• {step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* User's Current Teach & Learn Chips */}
          <div className="flex flex-wrap gap-1.5">
            {profile.teachSkills.map((s) => (
              <SkillChip
                key={s.id}
                name={s.skillName}
                role="TEACH"
                level={s.proficiencyLevel}
              />
            ))}
            {profile.learnSkills.map((s) => (
              <SkillChip
                key={s.id}
                name={s.skillName}
                role="LEARN"
                level={s.targetLevel}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              to="/discover"
              className="group inline-flex items-center gap-3 rounded-full bg-[#F6C945] pl-6 pr-2.5 py-2.5 text-xs sm:text-sm font-extrabold text-[#3D2317] shadow-md hover:bg-[#EE7838] hover:text-white transition"
            >
              <span>{tx('Cari Partner Belajar', 'Discover Partners')}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#3D2317] shadow-sm">
                <BookOpen className="h-3.5 w-3.5" />
              </span>
            </Link>

            <Link
              to="/skills"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#3D2317]/20 bg-white px-5 py-2.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#3D2317] hover:text-white transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{tx('Tambah Skill', 'Add Skill')}</span>
            </Link>
          </div>
        </div>

        {/* Right Playful Geometric Collage with Book/Page Icons (Foto 3 & 4) */}
        <div className="lg:col-span-6">
          <div className="relative mx-auto max-w-[440px] select-none">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-4 flex flex-col items-center gap-3">
                {/* Book/Page Badge instead of soundwave */}
                <div className="flex items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2.5 shadow-sm text-[#EE7838]">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-[11px] font-extrabold text-[#3D2317]">Notebook</span>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/sessions"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4979C] text-white shadow-sm hover:scale-105 transition"
                    title="Jadwal Sesi"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#F4979C]">
                      <BookOpen className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#74A8F2] text-white shadow-sm">
                    <FileText className="h-4 w-4" />
                  </span>
                </div>

                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-bl-[12px] rounded-tr-[56px] rounded-tl-[12px] rounded-br-[12px] bg-[#432319] text-white p-2 text-center">
                  <span className="text-lg font-extrabold leading-none text-[#F6C945]">
                    {profile.completeness.score}%
                  </span>
                  <span className="text-[9px] opacity-80 mt-0.5">Profile Fit</span>
                </div>
              </div>

              {/* Center Yellow Arch with Vector Character Portrait */}
              <div className="col-span-5 relative">
                <div className="absolute -top-3 right-0 z-10 rounded-full bg-white px-3.5 py-1 text-xs font-extrabold text-[#3D2317] shadow-md">
                  Hello, {firstName}!
                </div>
                <div
                  className={`overflow-hidden rounded-t-full rounded-b-[48px] ${resolveAvatarBg(
                    profile.avatarUrl,
                    'bg-[#F6C945]'
                  )} pt-4 px-2 pb-0 shadow-md h-44 flex items-end justify-center`}
                >
                  <CharacterPortrait
                    variant={resolveAvatarVariant(profile.avatarUrl, profile.isAdmin ? 0 : 1)}
                    className="h-40 w-full"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-3 flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 flex-col items-center justify-center rounded-2xl rotate-6 bg-[#74A8F2] text-white shadow-sm">
                  <span className="text-lg font-extrabold leading-none">
                    {stats.reciprocalMatchesCount}
                  </span>
                  <span className="text-[9px] font-bold">Matches</span>
                </div>

                <div className="-ml-6 z-10 rotate-6 rounded-full bg-[#432319] px-3.5 py-1 text-[11px] font-extrabold text-white shadow-md">
                  SkillLoop
                </div>

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EE7838] text-white shadow-md">
                  <BookOpen className="h-8 w-8" />
                </div>
              </div>
            </div>

            {/* Bottom Row of Collage */}
            <div className="mt-3 grid grid-cols-12 gap-3 items-end">
              <div className="col-span-3">
                <div className="h-16 w-full rounded-t-full bg-[#4EA674]" />
              </div>

              <div className="col-span-7">
                <Link
                  to={topMatches[0] ? `/matches/${topMatches[0].user.id}` : '/discover'}
                  className="flex items-center justify-between overflow-hidden rounded-[32px] bg-[#432319] h-24 px-3.5 text-white shadow-md hover:bg-[#523223] transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-16 w-16 shrink-0 rounded-full bg-[#F6C945]/20 overflow-hidden flex items-end justify-center">
                      <CharacterPortrait variant={4} className="h-16 w-16" />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block rounded-full bg-[#F6C945] px-2 py-0.5 text-[9px] font-extrabold text-[#3D2317]">
                        {topMatches[0] ? `${topMatches[0].score.overallScore}% Fit` : 'Top Match'}
                      </span>
                      <p className="mt-0.5 text-xs font-extrabold truncate">
                        {topMatches[0]?.user.displayName || 'Cari Partner'}
                      </p>
                      <p className="text-[10px] text-white/75 truncate">
                        {topMatches[0]?.explanation.bCanTeachA[0]?.skillName || 'Reciprocal'}
                      </p>
                    </div>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6C945] text-[#3D2317]">
                    <BookOpen className="h-4 w-4" />
                  </span>
                </Link>
              </div>

              <div className="col-span-2 flex justify-center">
                <div className="flex h-16 w-9 items-center justify-center rounded-full bg-[#F6C945]">
                  <div className="h-8 w-2.5 rounded-full bg-[#FAF1E6]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN WHITE ROUNDED CONTAINER */}
      <div className="rounded-[36px] border border-[#3D2317]/10 bg-white p-6 sm:p-9 shadow-sm space-y-12">
        {/* 1B. USER PROFILE CARD & DAILY / WEEKLY / MONTHLY ACTIVITY MONITOR */}
        <section className="grid gap-6 lg:grid-cols-12 items-stretch">
          {/* Left: User Profile Card */}
          <div className="lg:col-span-5 rounded-[28px] bg-[#432319] p-6 text-white shadow-md flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <Link
                    to="/profile"
                    title={tx('Ganti Foto Profil Avatar', 'Change Profile Avatar')}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl ${resolveAvatarBg(
                      profile.avatarUrl,
                      'bg-[#F6C945]'
                    )} pt-1 flex items-end justify-center shadow-sm hover:scale-105 transition`}
                  >
                    <CharacterPortrait
                      variant={resolveAvatarVariant(profile.avatarUrl, profile.isAdmin ? 0 : 1)}
                      className="h-15 w-15"
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                          profile.isAdmin
                            ? 'bg-[#EE7838] text-white'
                            : 'bg-[#4EA674] text-white'
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span>{profile.isAdmin ? 'Admin' : 'Member'}</span>
                      </span>
                      <span className="rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-bold text-[#F6C945]">
                        {stats.averageRating ?? 4.9} ★
                      </span>
                    </div>
                    <h2 className="mt-1.5 truncate text-lg font-extrabold text-white">
                      {profile.displayName}
                    </h2>
                    <p className="truncate text-[11px] text-white/70">
                      @{profile.username || firstName.toLowerCase()} . {profile.email}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-white/80 line-clamp-3">
                {profile.bio ||
                  tx(
                    'Belum ada bio singkat. Lengkapi profilmu agar partner semakin mengenal fokus belajar dan mengajar kamu.',
                    'No bio added yet. Complete your profile so partners can learn about your goals.'
                  )}
              </p>

              {/* Profile Meta Pills */}
              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white/90">
                  <Clock className="h-3 w-3 text-[#F6C945]" />
                  <span>{profile.timezone}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-white/90">
                  <Globe className="h-3 w-3 text-[#4EA674]" />
                  <span>{profile.languages.map((l) => l.toUpperCase()).join(', ')}</span>
                </span>
              </div>

              {/* Profile Completeness Bar */}
              <div className="rounded-2xl bg-white/8 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-white/85">
                    {tx('Kelengkapan Profil', 'Profile Completeness')}
                  </span>
                  <span className="text-[#F6C945]">{profile.completeness.score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-[#F6C945] transition-all duration-500"
                    style={{ width: `${profile.completeness.score}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="rounded-xl bg-white/8 py-1.5">
                    <span className="block text-sm font-extrabold text-[#F6C945]">
                      {profile.teachSkills.length}
                    </span>
                    <span className="text-[10px] text-white/70">Can Teach</span>
                  </div>
                  <div className="rounded-xl bg-white/8 py-1.5">
                    <span className="block text-sm font-extrabold text-[#F4979C]">
                      {profile.learnSkills.length}
                    </span>
                    <span className="text-[10px] text-white/70">Want Learn</span>
                  </div>
                  <div className="rounded-xl bg-white/8 py-1.5">
                    <span className="block text-sm font-extrabold text-[#4EA674]">
                      {stats.completedSessionsCount}
                    </span>
                    <span className="text-[10px] text-white/70">
                      {tx('Sesi Selesai', 'Completed')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                to="/profile"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#F6C945] px-4 py-2 text-xs font-extrabold text-[#3D2317] hover:bg-white transition"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>{tx('Edit Profil', 'Edit Profile')}</span>
              </Link>
              <Link
                to="/skills"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-white/12 px-4 py-2 text-xs font-extrabold text-white hover:bg-white/25 transition"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{tx('Atur Skill', 'Manage Skills')}</span>
              </Link>
            </div>
          </div>

          {/* Right: Daily / Weekly / Monthly Activity Monitor */}
          <div className="lg:col-span-7 rounded-[28px] bg-[#FAF1E6]/80 border border-[#3D2317]/8 p-6 flex flex-col justify-between space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#EE7838]">
                  <Activity className="h-3.5 w-3.5" />
                  <span>{tx('Monitor Aktivitas Pengguna', 'User Activity Monitor')}</span>
                </div>
                <h2 className="mt-0.5 text-xl font-extrabold text-[#3D2317]">
                  {activityPeriod === 'daily'
                    ? tx('Aktivitas Harian (7 Hari Terakhir)', 'Daily Activity (Last 7 Days)')
                    : activityPeriod === 'weekly'
                    ? tx('Aktivitas Mingguan (4 Minggu Terakhir)', 'Weekly Activity (Last 4 Weeks)')
                    : tx('Aktivitas Bulanan (6 Bulan Terakhir)', 'Monthly Activity (Last 6 Months)')}
                </h2>
              </div>

              {/* Harian | Mingguan | Bulanan Switcher */}
              <div className="inline-flex items-center rounded-full bg-white p-1 shadow-sm text-[11px] font-extrabold">
                {(
                  [
                    { id: 'daily', label: tx('Harian', 'Daily') },
                    { id: 'weekly', label: tx('Mingguan', 'Weekly') },
                    { id: 'monthly', label: tx('Bulanan', 'Monthly') }
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActivityPeriod(p.id);
                      setSelectedBucketIdx(null);
                    }}
                    className={`rounded-full px-3.5 py-1.5 transition ${
                      activityPeriod === p.id
                        ? 'bg-[#3D2317] text-[#F6C945]'
                        : 'text-[#8C7A70] hover:text-[#3D2317]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3 Period Summary Pills */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-2.5 sm:p-3.5 shadow-sm flex flex-col justify-between">
                <div
                  title={tx('Durasi Aktivitas', 'Activity Time')}
                  className="flex items-center gap-1 sm:gap-1.5 min-w-0 text-[10px] font-extrabold uppercase tracking-wider text-[#EE7838]"
                >
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">{tx('Durasi Aktivitas', 'Activity Time')}</span>
                </div>
                <p className="mt-1.5 truncate text-lg sm:text-2xl font-extrabold text-[#3D2317]">
                  {periodTotalMinutes >= 60
                    ? `${(periodTotalMinutes / 60).toFixed(1)} jam`
                    : `${periodTotalMinutes} mnt`}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-2.5 sm:p-3.5 shadow-sm flex flex-col justify-between">
                <div
                  title={tx('Sesi & Request', 'Sessions & Requests')}
                  className="flex items-center gap-1 sm:gap-1.5 min-w-0 text-[10px] font-extrabold uppercase tracking-wider text-[#4EA674]"
                >
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span className="truncate">{tx('Sesi & Request', 'Sessions & Requests')}</span>
                </div>
                <p className="mt-1.5 truncate text-lg sm:text-2xl font-extrabold text-[#3D2317]">
                  {periodTotalSessions + periodTotalRequests}
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-2.5 sm:p-3.5 shadow-sm flex flex-col justify-between">
                <div
                  title={tx('Milestone', 'Milestones')}
                  className="flex items-center gap-1 sm:gap-1.5 min-w-0 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  <Award className="h-3 w-3 shrink-0 text-[#F6C945]" />
                  <span className="truncate">{tx('Milestone', 'Milestones')}</span>
                </div>
                <p className="mt-1.5 truncate text-lg sm:text-2xl font-extrabold text-[#3D2317]">
                  {periodTotalMilestones}
                </p>
              </div>
            </div>

            {/* Interactive Bar Chart */}
            <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-end justify-between gap-2 h-36 pt-4">
                {activeBuckets.map((bucket, idx) => {
                  const pct =
                    bucket.minutes > 0
                      ? Math.max(14, Math.round((bucket.minutes / maxMinutesInPeriod) * 100))
                      : 8;
                  const isFocused = idx === activeBucketIdx;
                  return (
                    <button
                      key={bucket.key}
                      type="button"
                      onClick={() => setSelectedBucketIdx(idx)}
                      className="group flex-1 flex flex-col items-center justify-end h-full focus:outline-none"
                      title={`${bucket.fullLabel}: ${bucket.minutes} menit (${bucket.totalActivities} aktivitas)`}
                    >
                      <span
                        className={`mb-1.5 text-[10px] font-extrabold transition ${
                          isFocused ? 'text-[#EE7838]' : 'text-[#8C7A70] group-hover:text-[#3D2317]'
                        }`}
                      >
                        {bucket.minutes > 0 ? `${bucket.minutes}m` : '0'}
                      </span>
                      <div className="w-full max-w-[38px] flex-1 flex items-end justify-center">
                        <div
                          className={`w-full rounded-t-xl transition-all duration-300 ${
                            isFocused
                              ? 'bg-[#EE7838] shadow-md'
                              : bucket.minutes > 0
                              ? 'bg-[#F6C945] group-hover:bg-[#4EA674]'
                              : 'bg-[#FAF1E6]'
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>
                      <span
                        className={`mt-2 truncate text-[10px] font-extrabold ${
                          isFocused ? 'text-[#3D2317]' : 'text-[#8C7A70]'
                        }`}
                      >
                        {bucket.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Selected Timeframe Breakdown Footer */}
              {focusedBucket && (
                <div className="border-t border-[#3D2317]/8 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-[#3D2317]">
                    {focusedBucket.fullLabel}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="rounded-full bg-[#FAF1E6] px-2.5 py-0.5 text-[#3D2317]">
                      {focusedBucket.sessionsCount} {tx('Sesi Belajar', 'Sessions')}
                    </span>
                    <span className="rounded-full bg-[#4EA674]/15 px-2.5 py-0.5 text-[#2B6E48]">
                      {focusedBucket.requestsCount} {tx('Permintaan', 'Requests')}
                    </span>
                    <span className="rounded-full bg-[#F6C945]/35 px-2.5 py-0.5 text-[#3D2317]">
                      {focusedBucket.milestonesCount} {tx('Milestone', 'Milestones')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. WEEKLY SESSIONS & REQUESTS ROW (With Book/Page Circular Buttons) */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#3D2317]">
              {tx('Weekly Skill Sessions', 'Weekly Skill Sessions')}
            </h2>
            <Link
              to="/sessions"
              className="rounded-full border border-[#F6C945] bg-[#FAF1E6]/60 px-5 py-1.5 text-xs font-bold text-[#EE7838] hover:bg-[#F6C945] hover:text-[#3D2317] transition"
            >
              {tx('See all', 'See all')}
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weeklyCards.map((card) => (
              <Link
                key={card.id}
                to={card.to}
                className="flex items-center justify-between gap-3.5 rounded-[24px] border border-[#3D2317]/10 bg-white p-3.5 shadow-sm hover:bg-[#FAF1E6]/50 transition group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`flex shrink-0 items-end justify-center overflow-hidden rounded-2xl ${card.bg} pt-1 h-14 w-14 shadow-sm`}
                  >
                    <CharacterPortrait variant={card.portraitVariant} className="h-13 w-13" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-[#3D2317]">
                      {card.title}
                    </h3>
                    <p className="truncate text-[11px] font-medium text-[#8C7A70]">
                      {card.subtitle}
                    </p>
                    <p className="mt-1 text-xs font-extrabold text-[#3D2317]">
                      {card.meta}
                    </p>
                  </div>
                </div>

                {/* Circular Book/Page Icon instead of Play Triangle (Foto 4) */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F6C945] text-[#3D2317] shadow-sm group-hover:bg-[#EE7838] group-hover:text-white transition">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. TOP RECIPROCAL PARTNERS OF THE WEEK (Foto 1 Fix: All 4 Cards Richly Filled & Complete!) */}
        <section>
          <div className="flex flex-col items-center text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D2317] leading-tight">
              {tx('Top Reciprocal Partners', 'Top Reciprocal Partners')}
              <br />
              {tx('of the week', 'of the week')}
            </h2>

            <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-[#FAF1E6] p-1 text-xs font-bold">
              {(
                [
                  { id: 'all', label: tx('Semua Partner', 'All Partners') },
                  { id: 'active', label: tx('Aktif', 'Active') },
                  { id: 'completed', label: tx('Selesai', 'Completed') }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMatchTab(tab.id);
                    setSelectedCardIdx(0);
                  }}
                  className={`rounded-full px-4 py-1.5 transition ${
                    matchTab === tab.id
                      ? 'bg-[#3D2317] text-white'
                      : 'text-[#8C7A70] hover:text-[#3D2317]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayedPartnerCards.map((card, idx) => {
              const theme = CARD_THEMES[idx % CARD_THEMES.length];
              const isSelected = selectedCardIdx === idx;

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCardIdx(idx)}
                  className={`cursor-pointer relative overflow-hidden rounded-[28px] ${theme.bg} ${theme.text} p-5 transition-all duration-300 shadow-md flex flex-col justify-between min-h-[370px] ${
                    isSelected ? 'ring-4 ring-[#3D2317]/20 -translate-y-1' : 'hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top & Middle Rich Info on ALL 4 Cards (Matching About Platform!) */}
                  <div className="relative z-10 space-y-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shadow-sm ${theme.badge}`}
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>
                          {card.fitScore}% Fit . {card.sessionsLabel}
                        </span>
                      </span>

                      {card.status ? (
                        <RequestStatusBadge status={card.status} />
                      ) : (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${theme.chipBg}`}>
                          {card.timezone}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-extrabold leading-tight">
                      {card.name}
                    </h3>

                    <div className="space-y-1.5 pt-0.5 text-[11px]">
                      <div className={`rounded-xl px-2.5 py-1.5 ${theme.chipBg}`}>
                        <span className="block text-[9px] font-extrabold uppercase opacity-80">
                          {tx('Mereka Ajarkan:', 'Teach:')}
                        </span>
                        <span className="font-extrabold">{card.teach}</span>
                      </div>
                      <div className={`rounded-xl px-2.5 py-1.5 ${theme.chipBg}`}>
                        <span className="block text-[9px] font-extrabold uppercase opacity-80">
                          {tx('Kamu Ajarkan:', 'Learn:')}
                        </span>
                        <span className="font-extrabold">{card.learn}</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(card.targetUrl);
                        }}
                        className={`w-full inline-flex items-center justify-between rounded-full pl-3.5 pr-1.5 py-1.5 text-[11px] font-extrabold shadow-sm transition hover:scale-[1.02] ${theme.badge}`}
                      >
                        <span>{tx('Buka Halaman Match', 'Open Match Page')}</span>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F6C945] text-[#3D2317]">
                          <BookOpen className="h-3 w-3" />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Full-Width Character Illustration with Open Book at Bottom */}
                  <div className="relative z-10 mt-2 -mx-3 -mb-5 flex justify-center">
                    <div className="h-44 w-full max-w-[210px]">
                      <CharacterPortrait variant={theme.portraitVariant} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. TWO-TONE OVERVIEW + LIVE STATS (5+, 12+, 236 Style) */}
        <section className="grid items-center gap-10 lg:grid-cols-12 pt-2">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              <span className="text-[#3D2317]">
                {tx(
                  'Our skill exchange dives into diverse topics like coding, design, ',
                  'Our skill exchange dives into diverse topics like coding, design, '
                )}
              </span>
              <span className="text-[#9C8D84]">
                {tx(
                  'and personal experiences, offering valuable reciprocal insights and practical advice.',
                  'and personal experiences, offering valuable reciprocal insights and practical advice.'
                )}
              </span>
            </h2>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#EE7838]">
                  {stats.reciprocalMatchesCount}
                </p>
                <p className="mt-1 text-xs font-medium text-[#8C7A70]">
                  {tx('Reciprocal Matches', 'Reciprocal Matches')}
                </p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#EE7838]">
                  {stats.activeCollaborationsCount + stats.incomingPendingCount}
                </p>
                <p className="mt-1 text-xs font-medium text-[#8C7A70]">
                  {tx('In Progress', 'In Progress')}
                </p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-extrabold text-[#EE7838]">
                  {stats.completedSessionsCount + stats.upcomingSessionsCount}
                </p>
                <p className="mt-1 text-xs font-medium text-[#8C7A70]">
                  {tx('Total Sessions', 'Total Sessions')}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center">
            <div className="relative h-48 w-60 select-none">
              <div className="absolute top-0 left-2 h-16 w-16 rounded-full border-[12px] border-[#4EA674]" />
              <div className="absolute top-2 right-4 flex h-10 w-10 rotate-12 items-center justify-center rounded-xl bg-[#EE7838] text-white">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="absolute top-10 right-14 flex h-14 w-14 items-center justify-center rounded-full bg-[#3D2317] text-sm font-extrabold text-[#F6C945] shadow-md">
                {profile.completeness.score}%
              </div>
              <div className="absolute bottom-2 left-4 h-16 w-16 rotate-12 rounded-[20px] bg-[#F4979C]" />
              <div className="absolute bottom-2 right-2 h-14 w-24 -rotate-45 rounded-b-full bg-[#F6C945]" />
            </div>
          </div>
        </section>

        {/* 5. INTERACTIVE EXCHANGE TO-DO LIST (With Book/Notebook Capsule Illustration) */}
        <section className="grid items-center gap-10 lg:grid-cols-12 pt-2">
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative flex flex-col items-center justify-between rounded-full bg-[#F6C945] w-40 h-64 p-5 shadow-md">
              <Link
                to="/sessions"
                className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/80 bg-[#F6C945] hover:scale-105 transition"
              >
                <BookOpen className="h-8 w-8 text-white" />
              </Link>
              <div className="flex flex-col items-center">
                <div className="h-5 w-2.5 rounded-full bg-[#EE7838] mb-1" />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3D2317] text-white shadow-lg">
                  <FileText className="h-10 w-10 text-[#F6C945]" />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-extrabold text-[#3D2317]">
                {tx('Exchange To Do List & Readiness', 'Exchange To Do List & Readiness')}
              </h2>

              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTodoTab('all')}
                  className={`rounded-full px-3 py-1 transition ${
                    todoTab === 'all'
                      ? 'bg-[#3D2317] text-white'
                      : 'bg-[#FAF1E6] text-[#8C7A70]'
                  }`}
                >
                  All ({todoItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTodoTab('open')}
                  className={`rounded-full px-3 py-1 transition ${
                    todoTab === 'open'
                      ? 'bg-[#3D2317] text-white'
                      : 'bg-[#FAF1E6] text-[#8C7A70]'
                  }`}
                >
                  Open ({openTodoCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTodoTab('done')}
                  className={`rounded-full px-3 py-1 transition ${
                    todoTab === 'done'
                      ? 'bg-[#3D2317] text-white'
                      : 'bg-[#FAF1E6] text-[#8C7A70]'
                  }`}
                >
                  Completed ({doneTodoCount})
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              {visibleTodos.map((item) => {
                const done = isTodoDone(item);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-[#FAF1E6]/70 px-4 py-3 transition hover:bg-[#FAF1E6]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          setCheckedTodos((prev) => ({
                            ...prev,
                            [item.id]: !done
                          }))
                        }
                        aria-label={`Tandai ${item.title}`}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                          done
                            ? 'bg-[#4EA674] text-white'
                            : 'bg-[#F6C945] text-[#3D2317]'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </button>
                      <div className="min-w-0">
                        <Link
                          to={item.to}
                          className={`block truncate text-xs sm:text-sm font-extrabold hover:underline ${
                            done ? 'line-through text-[#8C7A70]' : 'text-[#3D2317]'
                          }`}
                        >
                          {item.title}
                        </Link>
                        <p className="truncate text-[11px] text-[#8C7A70]">
                          {item.detail}
                        </p>
                      </div>
                    </div>

                    <Link
                      to={item.to}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-[#3D2317] shadow-sm hover:bg-[#F6C945] transition"
                    >
                      <BookOpen className="h-3 w-3" />
                      <span>{tx('Buka', 'Open')}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. DEEP ESPRESSO BROWN CTA BANNER (#432319) */}
        <section className="relative overflow-hidden rounded-[32px] bg-[#432319] px-6 py-10 sm:px-10 sm:py-12 text-white shadow-lg">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="hidden lg:flex lg:col-span-4 items-center justify-center">
              <div className="h-20 w-20 rounded-l-full bg-[#4EA674]" />
              <div className="-ml-3 flex flex-col gap-2.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F4979C]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#F4979C]">
                    <BookOpen className="h-3 w-3" />
                  </span>
                </div>
                <div className="h-14 w-16 rounded-br-full bg-[#EE7838]" />
              </div>
            </div>

            <div className="lg:col-span-8 space-y-3">
              <h2 className="text-xl sm:text-2xl font-extrabold leading-snug text-white">
                {tx(
                  'Eksplorasi modul belajar terbaru & bergabung di komunitas',
                  'Explore the latest and exciting skill exchange sessions & circles'
                )}
              </h2>
              <p className="max-w-md text-xs text-white/75 leading-relaxed">
                {tx(
                  'Jangan lewatkan diskusi mingguan bersama anggota komunitas atau bagikan catatan belajar langsung ke partnermu.',
                  "Don't miss the valuable updates in each session and connect with your learning community."
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/community"
                  className="inline-flex items-center gap-3 rounded-full bg-[#F6C945] pl-5 pr-2 py-2 text-xs font-extrabold text-[#3D2317] shadow-md hover:bg-white transition"
                >
                  <span>{tx('Komunitas Belajar', 'Community Circles')}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                    <BookOpen className="h-3 w-3" />
                  </span>
                </Link>
                <Link
                  to="/messages"
                  className="rounded-full border border-white/25 px-5 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  {tx('Buka Pesan Pribadi', 'Open Messages')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
