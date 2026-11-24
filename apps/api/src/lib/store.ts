import crypto from 'node:crypto';
import net from 'node:net';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  ReportStatus,
  RequestStatus,
  SessionStatus,
  SkillLevel,
  SkillRole
} from '@skillloop/shared';
import {
  DEMO_USERS,
  INITIAL_CATEGORIES,
  INITIAL_SKILLS
} from '../data/catalog-seed.js';
import { normalizeSkillQuery } from '../services/matching.service.js';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLanguageRecord {
  id: string;
  userId: string;
  languageCode: string;
  proficiency: string | null;
}

export interface SkillCategoryRecord {
  id: string;
  name: string;
  slug: string;
}

export interface SkillAliasRecord {
  id: string;
  skillId: string;
  alias: string;
}

export interface SkillRecord {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string | null;
  isActive: boolean;
  category: SkillCategoryRecord;
  aliases: SkillAliasRecord[];
}

export interface UserSkillRecord {
  id: string;
  userId: string;
  skillId: string;
  role: SkillRole;
  proficiencyLevel: SkillLevel | null;
  targetLevel: SkillLevel | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  skill: SkillRecord;
}

export interface AvailabilitySlotRecord {
  id: string;
  userId: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  timezone: string;
}

export interface FullUserProfile extends UserRecord {
  languages: UserLanguageRecord[];
  skills: UserSkillRecord[];
  availabilitySlots: AvailabilitySlotRecord[];
}

export interface CollaborationRequestRecord {
  id: string;
  senderId: string;
  recipientId: string;
  offeredSkillId: string | null;
  requestedSkillId: string | null;
  status: RequestStatus;
  introMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  respondedAt: Date | null;
}

export interface LearningSessionRecord {
  id: string;
  requestId: string;
  topic: string;
  description: string | null;
  startAt: Date;
  timezone: string;
  durationMinutes: number;
  status: SessionStatus;
  proposedBy: string;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface UserBlockRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export interface UserReportRecord {
  id: string;
  reporterId: string;
  reportedUserId: string;
  category: string;
  description: string;
  status: ReportStatus;
  createdAt: Date;
  reviewedAt: Date | null;
}

export interface SessionFeedbackRecord {
  id: string;
  sessionId: string;
  reviewerId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface LearningMilestoneRecord {
  id: string;
  requestId: string;
  userId: string;
  title: string;
  notes: string | null;
  isCompleted: boolean;
  progressPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettingsRecord {
  userId: string;
  notifyNewRequest: boolean;
  notifyRequestAccepted: boolean;
  notifySessionUpdates: boolean;
  notifyNewFeedback: boolean;
  showTimezonePublicly: boolean;
  showPortfolioPublicly: boolean;
  showHistoryPublicly: boolean;
  interfaceLanguage: string;
}

export interface DirectMessageRecord {
  id: string;
  requestId: string;
  senderId: string;
  recipientId: string;
  body: string;
  resourceUrl: string | null;
  readAt: Date | null;
  isReported: boolean;
  createdAt: Date;
}

export interface CommunityGroupRecord {
  id: string;
  name: string;
  skillFocus: string;
  categoryName: string;
  description: string;
  meetingLink: string | null;
  scheduleNote: string;
  creatorId: string;
  memberIds: string[];
  createdAt: Date;
}

export interface AuthSessionRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

let prismaInstance: PrismaClient | null = null;
let storageMode: 'postgres' | 'memory' | null = null;
let lastPostgresProbeAt = 0;

function checkTcpPort(host: string, port: number, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const finish = (ok: boolean) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(ok);
      }
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

export async function resolveStorageMode(): Promise<'postgres' | 'memory'> {
  if (storageMode === 'postgres') return 'postgres';

  if (process.env.NODE_ENV === 'test' || process.env.USE_MEMORY_DB === 'true') {
    storageMode = 'memory';
    return storageMode;
  }

  const now = Date.now();
  // If previously in memory mode (and no active in-memory sessions yet), re-probe Postgres every 5s
  // so starting Docker PostgreSQL after the API server connects automatically.
  if (
    storageMode === 'memory' &&
    (memoryDb.sessions.size > 0 || now - lastPostgresProbeAt < 5000)
  ) {
    return 'memory';
  }
  lastPostgresProbeAt = now;

  const dbUrl = process.env.DATABASE_URL || '';
  let host = 'localhost';
  let port = 5432;
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname || 'localhost';
    port = parsed.port ? Number(parsed.port) : 5432;
  } catch {
    // Keep defaults
  }

  const probeTimeoutMs = process.env.NODE_ENV === 'production' ? 5000 : 1000;
  const reachable = await checkTcpPort(host, port, probeTimeoutMs);
  if (reachable) {
    prismaInstance = prismaInstance || new PrismaClient();
    if (process.env.NODE_ENV === 'production') {
      await prismaInstance.$queryRaw`SELECT 1`;
    }
    if (storageMode === 'memory') {
      console.log(
        `[SkillLoop DB] PostgreSQL di ${host}:${port} kini aktif! Beralih otomatis ke PostgreSQL.`
      );
    }
    storageMode = 'postgres';
    return storageMode;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `PostgreSQL database at ${host}:${port} is unreachable in production mode.`
    );
  }

  if (storageMode === null) {
    console.warn(
      `[SkillLoop DB] PostgreSQL di ${host}:${port} belum aktif (Docker belum berjalan). Menggunakan in-memory development store dengan akun demo PRD agar aplikasi dapat langsung dijalankan. Jalankan "docker compose up -d" dan "npm run db:migrate && npm run db:seed" untuk beralih ke PostgreSQL.`
    );
  }
  storageMode = 'memory';
  return storageMode;
}

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

export async function disconnectDatabase(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

class MemoryDatabase {
  users = new Map<string, UserRecord>();
  sessions = new Map<string, AuthSessionRecord>();
  categories = new Map<string, SkillCategoryRecord>();
  skills = new Map<string, SkillRecord>();
  aliases = new Map<string, SkillAliasRecord>();
  userSkills = new Map<string, UserSkillRecord>();
  userLanguages = new Map<string, UserLanguageRecord>();
  availabilitySlots = new Map<string, AvailabilitySlotRecord>();
  requests = new Map<string, CollaborationRequestRecord>();
  learningSessions = new Map<string, LearningSessionRecord>();
  notifications = new Map<string, NotificationRecord>();
  blocks = new Map<string, UserBlockRecord>();
  reports = new Map<string, UserReportRecord>();
  feedbacks = new Map<string, SessionFeedbackRecord>();
  milestones = new Map<string, LearningMilestoneRecord>();
  userSettings = new Map<string, UserSettingsRecord>();
  messages = new Map<string, DirectMessageRecord>();
  groups = new Map<string, CommunityGroupRecord>();

  constructor() {
    this.resetAndSeed();
  }

  resetAndSeed(): void {
    this.users.clear();
    this.sessions.clear();
    this.categories.clear();
    this.skills.clear();
    this.aliases.clear();
    this.userSkills.clear();
    this.userLanguages.clear();
    this.availabilitySlots.clear();
    this.requests.clear();
    this.learningSessions.clear();
    this.notifications.clear();
    this.blocks.clear();
    this.reports.clear();
    this.feedbacks.clear();
    this.milestones.clear();
    this.userSettings.clear();
    this.messages.clear();
    this.groups.clear();

    const now = new Date();

    for (const cat of INITIAL_CATEGORIES) {
      this.categories.set(cat.id, { ...cat });
    }

    for (const s of INITIAL_SKILLS) {
      const category = this.categories.get(s.categoryId)!;
      const aliasRecords: SkillAliasRecord[] = s.aliases.map((alias) => {
        const rec: SkillAliasRecord = {
          id: crypto.randomUUID(),
          skillId: s.id,
          alias: normalizeSkillQuery(alias)
        };
        this.aliases.set(rec.alias, rec);
        return rec;
      });

      const skillRecord: SkillRecord = {
        id: s.id,
        name: s.name,
        slug: s.slug,
        categoryId: s.categoryId,
        description: s.description,
        isActive: true,
        category,
        aliases: aliasRecords
      };
      this.skills.set(s.id, skillRecord);
    }

    const demoPasswordHash = bcrypt.hashSync('DemoSkillLoop123!', 10);

    for (const u of DEMO_USERS) {
      const userRec: UserRecord = {
        id: u.id,
        email: u.email.toLowerCase(),
        passwordHash: demoPasswordHash,
        displayName: u.displayName,
        username: u.username,
        bio: u.bio,
        avatarUrl: null,
        timezone: u.timezone,
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      this.users.set(userRec.id, userRec);

      for (const lang of u.languages) {
        const langRec: UserLanguageRecord = {
          id: crypto.randomUUID(),
          userId: userRec.id,
          languageCode: lang.code,
          proficiency: lang.proficiency
        };
        this.userLanguages.set(langRec.id, langRec);
      }

      for (const decl of u.skills) {
        const skill = Array.from(this.skills.values()).find(
          (sk) => sk.slug === decl.skillSlug
        );
        if (!skill) continue;
        const usRec: UserSkillRecord = {
          id: crypto.randomUUID(),
          userId: userRec.id,
          skillId: skill.id,
          role: decl.role,
          proficiencyLevel: decl.proficiencyLevel ?? null,
          targetLevel: decl.targetLevel ?? null,
          description: decl.description,
          createdAt: now,
          updatedAt: now,
          skill
        };
        this.userSkills.set(usRec.id, usRec);
      }

      // Seed varied availability slots per demo user for realistic Availability Fit
      const slotScheduleByEmail: Record<string, { days: number[]; start: number; end: number }> = {
        'raka@demo.skillloop.id': { days: [2, 4, 6], start: 19 * 60, end: 21 * 60 },
        'naya@demo.skillloop.id': { days: [2, 4, 6], start: 19 * 60, end: 21 * 60 },
        'dimas@demo.skillloop.id': { days: [6], start: 20 * 60, end: 21 * 60 + 15 },
        'alya@demo.skillloop.id': { days: [6], start: 20 * 60 + 20, end: 21 * 60 + 30 },
        'farhan@demo.skillloop.id': { days: [1, 3, 5], start: 18 * 60, end: 20 * 60 }
      };
      const slotConfig = slotScheduleByEmail[userRec.email] || {
        days: [2, 4, 6],
        start: 19 * 60,
        end: 21 * 60
      };
      for (const dayOfWeek of slotConfig.days) {
        const slotRec: AvailabilitySlotRecord = {
          id: crypto.randomUUID(),
          userId: userRec.id,
          dayOfWeek,
          startMinute: slotConfig.start,
          endMinute: slotConfig.end,
          timezone: userRec.timezone
        };
        this.availabilitySlots.set(slotRec.id, slotRec);
      }

      this.userSettings.set(userRec.id, {
        userId: userRec.id,
        notifyNewRequest: true,
        notifyRequestAccepted: true,
        notifySessionUpdates: true,
        notifyNewFeedback: true,
        showTimezonePublicly: true,
        showPortfolioPublicly: true,
        showHistoryPublicly: true,
        interfaceLanguage: 'id'
      });
    }

    // Seed P2 Community Learning Groups
    const defaultGroups: CommunityGroupRecord[] = [
      {
        id: '44444444-4444-4444-8444-444444444401',
        name: 'Frontend & UI/UX Design Circle',
        skillFocus: 'JavaScript ⇄ UI/UX Design & Figma',
        categoryName: 'Web & Product Design',
        description:
          'Kelompok belajar mingguan untuk desainer produk dan frontend developer yang saling membedah sistem desain Figma serta implementasi komponen interaktif.',
        meetingLink: 'https://meet.jit.si/SkillLoop-Frontend-UIUX-Circle',
        scheduleNote: 'Sabtu . 19:30 WIB (UTC+7)',
        creatorId: '33333333-3333-4333-8333-333333333301',
        memberIds: [
          '33333333-3333-4333-8333-333333333301',
          '33333333-3333-4333-8333-333333333302',
          '33333333-3333-4333-8333-333333333303'
        ],
        createdAt: now
      },
      {
        id: '44444444-4444-4444-8444-444444444402',
        name: 'Full-Stack React & Python Data Guild',
        skillFocus: 'React & TypeScript ⇄ Python & PostgreSQL',
        categoryName: 'Data & Software Engineering',
        description:
          'Komunitas kolaborasi dua arah antara praktisi data Python/SQL dan pengembang aplikasi React/TypeScript.',
        meetingLink: 'https://meet.jit.si/SkillLoop-React-Python-Guild',
        scheduleNote: 'Kamis . 20:00 WIB (UTC+7)',
        creatorId: '33333333-3333-4333-8333-333333333304',
        memberIds: [
          '33333333-3333-4333-8333-333333333304',
          '33333333-3333-4333-8333-333333333305'
        ],
        createdAt: now
      },
      {
        id: '44444444-4444-4444-8444-444444444403',
        name: 'Bilingual Tech Pitching & Speaking Club',
        skillFocus: 'English Conversation ⇄ Public Speaking & Technical Writing',
        categoryName: 'Languages & Communication',
        description:
          'Sesi latihan presentasi produk, wawancara teknis bahasa Inggris, dan penulisan dokumentasi bersama.',
        meetingLink: 'https://meet.jit.si/SkillLoop-Bilingual-Pitch-Club',
        scheduleNote: 'Minggu . 16:00 WIB (UTC+7)',
        creatorId: '33333333-3333-4333-8333-333333333303',
        memberIds: [
          '33333333-3333-4333-8333-333333333303',
          '33333333-3333-4333-8333-333333333304'
        ],
        createdAt: now
      }
    ];

    for (const g of defaultGroups) {
      this.groups.set(g.id, g);
    }

    // Seed P0/P1/P2 Demo Exchange Requests, Learning Sessions, Milestones, Feedbacks, and Direct Messages
    // in development/production so that every Sidebar menu item has rich initial data!
    if (process.env.NODE_ENV !== 'test') {
      const skillJs = '22222222-2222-4222-8222-222222222201';
    const skillHtml = '22222222-2222-4222-8222-222222222202';
    const skillReact = '22222222-2222-4222-8222-222222222203';
    const skillUiUx = '22222222-2222-4222-8222-222222222206';
    const skillFigma = '22222222-2222-4222-8222-222222222207';
    const skillPython = '22222222-2222-4222-8222-222222222208';

    const userRaka = '33333333-3333-4333-8333-333333333301';
    const userNaya = '33333333-3333-4333-8333-333333333302';
    const userDimas = '33333333-3333-4333-8333-333333333303';
    const userAlya = '33333333-3333-4333-8333-333333333304';
    const userFarhan = '33333333-3333-4333-8333-333333333305';

    // 1. Active ACCEPTED Exchange between Raka & Naya
    const reqRakaNayaId = '55555555-5555-4555-8555-555555555501';
    this.requests.set(reqRakaNayaId, {
      id: reqRakaNayaId,
      senderId: userRaka,
      recipientId: userNaya,
      offeredSkillId: skillJs,
      requestedSkillId: skillUiUx,
      status: 'ACCEPTED',
      introMessage:
        '[Exchange Agreement: 4 Sesi . Metode: Online 1-on-1 . Praktik & Review Langsung] Target Belajar: Membangun Design System di Figma & komponen JavaScript interaktif.',
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000)
    });

    // 2. Incoming PENDING Exchange Request from Alya to Raka
    const reqAlyaRakaId = '55555555-5555-4555-8555-555555555502';
    this.requests.set(reqAlyaRakaId, {
      id: reqAlyaRakaId,
      senderId: userAlya,
      recipientId: userRaka,
      offeredSkillId: skillPython,
      requestedSkillId: skillJs,
      status: 'PENDING',
      introMessage:
        '[Exchange Agreement: 2 Sesi . Metode: Pair Programming / Co-Design Live] Halo Raka! Yuk bertukar fundamental JavaScript DOM dengan automasi data Python.',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      respondedAt: null
    });

    // 3. Active ACCEPTED Exchange between Naya & Dimas
    const reqNayaDimasId = '55555555-5555-4555-8555-555555555503';
    this.requests.set(reqNayaDimasId, {
      id: reqNayaDimasId,
      senderId: userDimas,
      recipientId: userNaya,
      offeredSkillId: skillHtml,
      requestedSkillId: skillFigma,
      status: 'ACCEPTED',
      introMessage:
        '[Exchange Agreement: 4 Sesi . Metode: Online 1-on-1] Slicing layout HTML/CSS responsif & Auto-Layout Figma.',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    });

    // 4. Active ACCEPTED Exchange between Alya & Farhan
    const reqAlyaFarhanId = '55555555-5555-4555-8555-555555555504';
    this.requests.set(reqAlyaFarhanId, {
      id: reqAlyaFarhanId,
      senderId: userFarhan,
      recipientId: userAlya,
      offeredSkillId: skillReact,
      requestedSkillId: skillPython,
      status: 'ACCEPTED',
      introMessage:
        '[Exchange Agreement: 4 Sesi . Metode: Pair Programming] Pertukaran arsitektur React Hooks dengan pengolahan data Python.',
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      respondedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    });

    // Seed Sessions for Raka & Naya (1 COMPLETED + 1 SCHEDULED + 1 PROPOSED)
    const sessCompletedId = '66666666-6666-4666-8666-666666666601';
    this.learningSessions.set(sessCompletedId, {
      id: sessCompletedId,
      requestId: reqRakaNayaId,
      topic: 'Sesi 1: Bedah UX Heuristics & Struktur DOM JavaScript',
      description: 'Review user flow aplikasi web dan praktik manipulasi state dasar.',
      startAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      timezone: 'Asia/Jakarta',
      durationMinutes: 60,
      status: 'COMPLETED',
      proposedBy: userRaka,
      cancelReason: null,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    });

    const sessScheduledId = '66666666-6666-4666-8666-666666666602';
    this.learningSessions.set(sessScheduledId, {
      id: sessScheduledId,
      requestId: reqRakaNayaId,
      topic: 'Sesi 2: Auto-Layout Figma & Async Fetch API',
      description: 'Membangun komponen kartu responsif di Figma lalu mengintegrasikannya dengan data API.',
      startAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      timezone: 'Asia/Jakarta',
      durationMinutes: 60,
      status: 'SCHEDULED',
      proposedBy: userNaya,
      cancelReason: null,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: now
    });

    // Seed Feedback & Reputation on Completed Session
    const fb1Id = '77777777-7777-4777-8777-777777777701';
    this.feedbacks.set(fb1Id, {
      id: fb1Id,
      sessionId: sessCompletedId,
      reviewerId: userNaya,
      rating: 5,
      comment:
        'Penjelasan Raka tentang konsep asynchronous JavaScript sangat runtut dan mudah dipraktikkan langsung!',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    });

    const fb2Id = '77777777-7777-4777-8777-777777777702';
    this.feedbacks.set(fb2Id, {
      id: fb2Id,
      sessionId: sessCompletedId,
      reviewerId: userRaka,
      rating: 5,
      comment:
        'Naya mengajarkan prinsip hierarchy visual dan Auto-Layout Figma dengan contoh nyata yang sangat aplikatif.',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    });

    // Seed Learning Milestones for Raka
    const ms1Id = '88888888-8888-4888-8888-888888888801';
    this.milestones.set(ms1Id, {
      id: ms1Id,
      requestId: reqRakaNayaId,
      userId: userRaka,
      title: 'Menguasai Auto-Layout & Component Variants di Figma',
      notes: 'Sudah menyelesaikan 3 komponen kartu dan navigasi sidebar responsif.',
      isCompleted: true,
      progressPercent: 100,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: now
    });

    const ms2Id = '88888888-8888-4888-8888-888888888802';
    this.milestones.set(ms2Id, {
      id: ms2Id,
      requestId: reqRakaNayaId,
      userId: userRaka,
      title: 'Menyusun Design System Tokens & Wireframe Interaktif',
      notes: 'Target sesi minggu ini bersama Naya Putri.',
      isCompleted: false,
      progressPercent: 50,
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: now
    });

    // Seed Direct Messages & Resource Sharing between Raka & Naya
    const msg1Id = '99999999-9999-4999-8999-999999999901';
    this.messages.set(msg1Id, {
      id: msg1Id,
      requestId: reqRakaNayaId,
      senderId: userNaya,
      recipientId: userRaka,
      body: 'Halo Raka! Ini tautan file Figma Design System yang kita bahas untuk persiapan sesi ke-2 ya.',
      resourceUrl: 'https://www.figma.com/community/file/skillloop-design-tokens',
      readAt: now,
      isReported: false,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000)
    });

    const msg2Id = '99999999-9999-4999-8999-999999999902';
    this.messages.set(msg2Id, {
      id: msg2Id,
      requestId: reqRakaNayaId,
      senderId: userRaka,
      recipientId: userNaya,
      body: 'Terima kasih Naya! Aku juga sudah menyiapkan starter repo latihan JavaScript DOM & Fetch API di GitHub.',
      resourceUrl: 'https://github.com/skillloop-demo/js-interactive-components',
      readAt: now,
      isReported: false,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
    });

    // Seed Notifications for Raka
    const notif1Id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01';
    this.notifications.set(notif1Id, {
      id: notif1Id,
      userId: userRaka,
      type: 'SESSION_CONFIRMED',
      title: 'Jadwal Sesi Ke-2 Terkonfirmasi',
      body: 'Sesi "Auto-Layout Figma & Async Fetch API" bersama Naya Putri telah dijadwalkan.',
      entityType: 'LearningSession',
      entityId: sessScheduledId,
      readAt: null,
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
    });

    const notif2Id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02';
    this.notifications.set(notif2Id, {
      id: notif2Id,
      userId: userRaka,
      type: 'NEW_FEEDBACK_RECEIVED',
      title: 'Rating 5/5 ★ dari Naya Putri',
      body: 'Naya Putri memberikan ulasan positif pada Sesi 1 pertukaran skill kamu.',
      entityType: 'LearningSession',
      entityId: sessCompletedId,
      readAt: null,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
    });
    }
  }
}

export const memoryDb = new MemoryDatabase();

export function resetTestDatabase(): void {
  memoryDb.resetAndSeed();
}
