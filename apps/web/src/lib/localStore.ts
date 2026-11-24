import { ApiClientError } from './errors';
import {
  AdminOverviewDto,
  CatalogSkillDto,
  CollaborationRequestDto,
  CommunityGroupDto,
  DashboardDto,
  DirectMessageDto,
  LearningMilestoneDto,
  LearningSessionDto,
  MessageThreadDto,
  NotificationDto,
  OwnProfileDto,
  ReciprocalMatchDto,
  SessionFeedbackDto,
  SkillCategoryDto,
  SkillDeclarationDto,
  UserReputationDto,
  UserSettingsDto
} from './api';
import { RequestStatus, SessionStatus, SkillLevel, SkillRole } from '@skillloop/shared';

const STORAGE_KEY = 'skillloop_interactive_state_v3';
const ACTIVE_USER_KEY = 'skillloop_active_user_email_v2';
const LOGGED_OUT_KEY = 'skillloop_logged_out_v2';

const CATEGORIES: SkillCategoryDto[] = [
  { id: 'cat-web', name: 'Web & Software Development', slug: 'web-dev' },
  { id: 'cat-design', name: 'UI/UX & Product Design', slug: 'design' },
  { id: 'cat-data', name: 'Data Science & AI', slug: 'data-ai' },
  { id: 'cat-lang', name: 'Language & Communication', slug: 'language' },
  { id: 'cat-biz', name: 'Product & Business Strategy', slug: 'business' }
];

const INITIAL_CATALOG: CatalogSkillDto[] = [
  {
    id: 'sk-js',
    name: 'JavaScript',
    slug: 'javascript',
    description: 'ES6+, DOM manipulation, asynchronous programming, dan arsitektur aplikasi web modern.',
    category: CATEGORIES[0],
    aliases: ['js', 'ecmascript', 'vanilla js']
  },
  {
    id: 'sk-ts',
    name: 'TypeScript',
    slug: 'typescript',
    description: 'Static typing, generics, type-safe API contracts, dan pengembangan full-stack.',
    category: CATEGORIES[0],
    aliases: ['ts']
  },
  {
    id: 'sk-react',
    name: 'React',
    slug: 'react',
    description: 'Component architecture, custom hooks, state management, dan optimasi performa UI.',
    category: CATEGORIES[0],
    aliases: ['reactjs', 'react.js']
  },
  {
    id: 'sk-html',
    name: 'HTML & CSS',
    slug: 'html-css',
    description: 'Semantic HTML5, Flexbox, CSS Grid, Tailwind CSS, dan responsive mobile-first layout.',
    category: CATEGORIES[0],
    aliases: ['html', 'css', 'tailwind']
  },
  {
    id: 'sk-node',
    name: 'Node.js',
    slug: 'nodejs',
    description: 'RESTful API, Express, autentikasi sesi, dan arsitektur backend.',
    category: CATEGORIES[0],
    aliases: ['node', 'express']
  },
  {
    id: 'sk-uiux',
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    description: 'User research, wireframing, interaction design, design system, dan usability testing.',
    category: CATEGORIES[1],
    aliases: ['ui', 'ux', 'ui/ux', 'product design']
  },
  {
    id: 'sk-figma',
    name: 'Figma',
    slug: 'figma',
    description: 'Auto-layout, component variants, design tokens, dan interactive prototyping.',
    category: CATEGORIES[1],
    aliases: ['figma design', 'prototyping']
  },
  {
    id: 'sk-python',
    name: 'Python',
    slug: 'python',
    description: 'Scripting, data automation, analisis data dengan Pandas, dan pengembangan backend.',
    category: CATEGORIES[2],
    aliases: ['py']
  },
  {
    id: 'sk-sql',
    name: 'SQL & PostgreSQL',
    slug: 'sql-postgresql',
    description: 'Relational data modeling, query optimization, indexing, dan migrasi skema database.',
    category: CATEGORIES[2],
    aliases: ['sql', 'postgres', 'postgresql']
  },
  {
    id: 'sk-speaking',
    name: 'Public Speaking',
    slug: 'public-speaking',
    description: 'Pitching produk, struktur storytelling, komunikasi teknis, dan presentasi efektif.',
    category: CATEGORIES[3],
    aliases: ['pitching', 'presentation']
  },
  {
    id: 'sk-english',
    name: 'English Conversation',
    slug: 'english-conversation',
    description: 'Percakapan profesional, wawancara kerja internasional, dan penulisan dokumentasi.',
    category: CATEGORIES[3],
    aliases: ['english', 'inggris']
  },
  {
    id: 'sk-pm',
    name: 'Product Management',
    slug: 'product-management',
    description: 'Penyusunan PRD, prioritas fitur (RICE/MoSCoW), dan analisis metrik pengguna.',
    category: CATEGORIES[4],
    aliases: ['pm', 'prd']
  }
];

interface DemoUserRecord {
  id: string;
  email: string;
  password?: string;
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl?: string | null;
  timezone: string;
  languages: string[];
  isActive: boolean;
  skills: SkillDeclarationDto[];
}

function makeSkillDecl(
  id: string,
  skillId: string,
  role: SkillRole,
  level: SkillLevel,
  description: string | null
): SkillDeclarationDto {
  const found = INITIAL_CATALOG.find((s) => s.id === skillId) || INITIAL_CATALOG[0];
  return {
    id,
    skillId: found.id,
    skillName: found.name,
    skillSlug: found.slug,
    categoryId: found.category.id,
    categoryName: found.category.name,
    categorySlug: found.category.slug,
    role,
    proficiencyLevel: role === 'TEACH' ? level : null,
    targetLevel: role === 'LEARN' ? level : null,
    description
  };
}

const INITIAL_USERS: DemoUserRecord[] = [
  {
    id: 'u-raka',
    email: 'raka@demo.skillloop.id',
    displayName: 'Raka Pratama',
    username: 'rakapratama',
    bio: 'Frontend Engineer yang senang berbagi fundamental JavaScript & arsitektur web, sedang mendalami UI/UX Design dan sistem komponen di Figma.',
    timezone: 'Asia/Jakarta',
    languages: ['id', 'en'],
    isActive: true,
    skills: [
      makeSkillDecl('sd-1', 'sk-js', 'TEACH', 'ADVANCED', 'Berpengalaman 3 tahun membangun aplikasi web interaktif & async patterns. [Metode: Live 1-on-1 & Praktik Langsung] [Portfolio: github.com/rakapratama]'),
      makeSkillDecl('sd-2', 'sk-html', 'TEACH', 'ADVANCED', 'Menguasai responsive layout, CSS Grid, dan Tailwind CSS. [Metode: Project-Based / Pair Session]'),
      makeSkillDecl('sd-3', 'sk-uiux', 'LEARN', 'INTERMEDIATE', 'Ingin memahami user flow, hirarki visual, dan audit UX untuk produk SaaS.'),
      makeSkillDecl('sd-4', 'sk-figma', 'LEARN', 'INTERMEDIATE', 'Target menguasai Auto-Layout, Component Variants, dan Design Tokens.')
    ]
  },
  {
    id: 'u-naya',
    email: 'naya@demo.skillloop.id',
    displayName: 'Nadia Lestary (Naya)',
    username: 'nayaputri',
    bio: 'Product Designer (UI/UX) yang aktif membangun Design System di Figma. Ingin belajar JavaScript & HTML/CSS agar bisa mengimplementasikan desain ke kode.',
    timezone: 'Asia/Jakarta',
    languages: ['id', 'en'],
    isActive: true,
    skills: [
      makeSkillDecl('sd-5', 'sk-uiux', 'TEACH', 'ADVANCED', 'Membimbing riset pengguna, wireframing, hingga design system siap produksi. [Portfolio: figma.com/@nayaputri]'),
      makeSkillDecl('sd-6', 'sk-figma', 'TEACH', 'ADVANCED', 'Praktik langsung Auto-Layout, Variables, dan interaktif prototyping di Figma.'),
      makeSkillDecl('sd-7', 'sk-js', 'LEARN', 'BEGINNER', 'Ingin memahami logika dasar JavaScript dan manipulasi komponen UI.'),
      makeSkillDecl('sd-8', 'sk-html', 'LEARN', 'INTERMEDIATE', 'Ingin mahir slicing desain Figma ke responsive HTML & Tailwind CSS.')
    ]
  },
  {
    id: 'u-dimas',
    email: 'dimas@demo.skillloop.id',
    displayName: 'Evan Dimas Lee',
    username: 'dimasaditya',
    bio: 'Web Developer & Tech Speaker. Suka mengajar HTML/CSS dan teknik Public Speaking / Product Pitching. Sedang mempelajari Figma & Product Management.',
    timezone: 'Asia/Makassar',
    languages: ['id'],
    isActive: true,
    skills: [
      makeSkillDecl('sd-9', 'sk-speaking', 'TEACH', 'ADVANCED', null),
      makeSkillDecl('sd-10', 'sk-html', 'TEACH', 'INTERMEDIATE', null),
      makeSkillDecl('sd-11', 'sk-figma', 'LEARN', 'BEGINNER', null),
      makeSkillDecl('sd-12', 'sk-js', 'LEARN', 'INTERMEDIATE', null)
    ]
  },
  {
    id: 'u-alya',
    email: 'alya@demo.skillloop.id',
    displayName: 'Stefy Alya Catlyna',
    username: 'alyarahma',
    bio: 'Data Analyst yang sehari-hari bekerja dengan Python dan PostgreSQL. Ingin bertukar ilmu dengan developer React & TypeScript untuk membangun dashboard data.',
    timezone: 'Asia/Jakarta',
    languages: ['id', 'en'],
    isActive: true,
    skills: [
      makeSkillDecl('sd-13', 'sk-python', 'TEACH', 'ADVANCED', 'Automasi pengolahan data, Pandas, dan pembuatan API analitik.'),
      makeSkillDecl('sd-14', 'sk-sql', 'TEACH', 'ADVANCED', 'Optimasi query PostgreSQL, indexing, dan desain skema analitik.'),
      makeSkillDecl('sd-15', 'sk-react', 'LEARN', 'INTERMEDIATE', null),
      makeSkillDecl('sd-16', 'sk-js', 'LEARN', 'INTERMEDIATE', null)
    ]
  },
  {
    id: 'u-farhan',
    email: 'farhan@demo.skillloop.id',
    displayName: 'Farhan Akbar',
    username: 'farhanakbar',
    bio: null,
    timezone: 'Asia/Jakarta',
    languages: ['id'],
    isActive: true,
    skills: [
      makeSkillDecl('sd-17', 'sk-react', 'TEACH', 'ADVANCED', null),
      makeSkillDecl('sd-18', 'sk-ts', 'TEACH', 'ADVANCED', null),
      makeSkillDecl('sd-19', 'sk-python', 'LEARN', 'BEGINNER', null),
      makeSkillDecl('sd-20', 'sk-sql', 'LEARN', 'INTERMEDIATE', null)
    ]
  }
];

interface LocalState {
  users: DemoUserRecord[];
  catalog: CatalogSkillDto[];
  requests: CollaborationRequestDto[];
  sessions: LearningSessionDto[];
  feedbacks: SessionFeedbackDto[];
  milestones: LearningMilestoneDto[];
  messages: DirectMessageDto[];
  groups: CommunityGroupDto[];
  notifications: NotificationDto[];
  blocks: Array<{
    id: string;
    blockerId: string;
    blockedId: string;
    createdAt: string;
  }>;
  reports: AdminOverviewDto['reports'];
  settings: Record<string, UserSettingsDto>;
}

function buildInitialState(): LocalState {
  const now = new Date().toISOString();
  const tomorrow = new Date(Date.now() + 26 * 3600 * 1000).toISOString();
  const nextWeek = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
  const lastWeek = new Date(Date.now() - 96 * 3600 * 1000).toISOString();

  const requests: CollaborationRequestDto[] = [
    {
      id: 'req-101',
      senderId: 'u-raka',
      recipientId: 'u-naya',
      offeredSkillId: 'sk-js',
      requestedSkillId: 'sk-figma',
      status: 'ACCEPTED',
      introMessage: '[Exchange Agreement: 4 Sesi . Metode: Online 1-on-1 . Praktik & Review Langsung] Target Belajar: Menguasai Auto-Layout & Component Variants di Figma ditukar dengan fundamental JavaScript DOM & Fetch API.',
      createdAt: lastWeek,
      updatedAt: now,
      respondedAt: lastWeek,
      sender: {
        id: 'u-raka',
        displayName: 'Raka Pratama',
        username: 'rakapratama',
        avatarUrl: null,
        timezone: 'Asia/Jakarta'
      },
      recipient: {
        id: 'u-naya',
        displayName: 'Nadia Lestary (Naya)',
        username: 'nayaputri',
        avatarUrl: null,
        timezone: 'Asia/Jakarta'
      },
      offeredSkill: { id: 'sk-js', name: 'JavaScript', slug: 'javascript' },
      requestedSkill: { id: 'sk-figma', name: 'Figma', slug: 'figma' },
      sessionsCount: 2
    },
    {
      id: 'req-102',
      senderId: 'u-dimas',
      recipientId: 'u-raka',
      offeredSkillId: 'sk-speaking',
      requestedSkillId: 'sk-js',
      status: 'PENDING',
      introMessage: '[Exchange Agreement: 4 Sesi . Metode: Pair Programming / Co-Design Live] Halo Raka! Mari bertukar sesi Technical Storytelling & Pitching dengan pendalaman JavaScript ES6+.',
      createdAt: now,
      updatedAt: now,
      respondedAt: null,
      sender: {
        id: 'u-dimas',
        displayName: 'Evan Dimas Lee',
        username: 'dimasaditya',
        avatarUrl: null,
        timezone: 'Asia/Makassar'
      },
      recipient: {
        id: 'u-raka',
        displayName: 'Raka Pratama',
        username: 'rakapratama',
        avatarUrl: null,
        timezone: 'Asia/Jakarta'
      },
      offeredSkill: { id: 'sk-speaking', name: 'Public Speaking', slug: 'public-speaking' },
      requestedSkill: { id: 'sk-js', name: 'JavaScript', slug: 'javascript' },
      sessionsCount: 0
    },
    {
      id: 'req-103',
      senderId: 'u-alya',
      recipientId: 'u-farhan',
      offeredSkillId: 'sk-python',
      requestedSkillId: 'sk-react',
      status: 'ACCEPTED',
      introMessage: '[Exchange Agreement: 4 Sesi . Metode: Project-Based] Pertukaran analisis data Python & SQL dengan pembuatan dashboard interaktif di React.',
      createdAt: lastWeek,
      updatedAt: now,
      respondedAt: lastWeek,
      sender: {
        id: 'u-alya',
        displayName: 'Stefy Alya Catlyna',
        username: 'alyarahma',
        avatarUrl: null,
        timezone: 'Asia/Jakarta'
      },
      recipient: {
        id: 'u-farhan',
        displayName: 'Farhan Akbar',
        username: 'farhanakbar',
        avatarUrl: null,
        timezone: 'Asia/Jakarta'
      },
      offeredSkill: { id: 'sk-python', name: 'Python', slug: 'python' },
      requestedSkill: { id: 'sk-react', name: 'React', slug: 'react' },
      sessionsCount: 1
    }
  ];

  const sessions: LearningSessionDto[] = [
    {
      id: 'sess-201',
      requestId: 'req-101',
      topic: 'Sesi 1: Bedah Auto-Layout & Design Tokens di Figma ⇄ Struktur Komponen JS',
      description: '30 menit pertama praktik membuat responsive card dengan Auto-Layout di Figma, dilanjutkan 30 menit implementasi state & event handler di JavaScript.',
      startAt: tomorrow,
      timezone: 'Asia/Jakarta',
      durationMinutes: 60,
      status: 'SCHEDULED',
      proposedBy: 'u-raka',
      cancelReason: null,
      createdAt: now,
      updatedAt: now,
      proposer: { id: 'u-raka', displayName: 'Raka Pratama' },
      request: {
        id: 'req-101',
        senderId: 'u-raka',
        recipientId: 'u-naya',
        status: 'ACCEPTED',
        sender: { id: 'u-raka', displayName: 'Raka Pratama', timezone: 'Asia/Jakarta' },
        recipient: { id: 'u-naya', displayName: 'Nadia Lestary (Naya)', timezone: 'Asia/Jakarta' },
        offeredSkill: { id: 'sk-js', name: 'JavaScript' },
        requestedSkill: { id: 'sk-figma', name: 'Figma' }
      }
    },
    {
      id: 'sess-202',
      requestId: 'req-101',
      topic: 'Sesi Fundamental: Pengenalan Workspace Figma & Dasar Variabel JavaScript',
      description: 'Setup environment belajar, menyepakati kurikulum 4 minggu, dan latihan studi kasus pertama.',
      startAt: lastWeek,
      timezone: 'Asia/Jakarta',
      durationMinutes: 60,
      status: 'COMPLETED',
      proposedBy: 'u-naya',
      cancelReason: null,
      createdAt: lastWeek,
      updatedAt: lastWeek,
      proposer: { id: 'u-naya', displayName: 'Nadia Lestary (Naya)' },
      request: {
        id: 'req-101',
        senderId: 'u-raka',
        recipientId: 'u-naya',
        status: 'ACCEPTED',
        sender: { id: 'u-raka', displayName: 'Raka Pratama', timezone: 'Asia/Jakarta' },
        recipient: { id: 'u-naya', displayName: 'Nadia Lestary (Naya)', timezone: 'Asia/Jakarta' },
        offeredSkill: { id: 'sk-js', name: 'JavaScript' },
        requestedSkill: { id: 'sk-figma', name: 'Figma' }
      }
    },
    {
      id: 'sess-203',
      requestId: 'req-101',
      topic: 'Sesi 2: Interactive Prototyping Figma ⇄ Async Fetch API JavaScript',
      description: 'Menghubungkan alur layar interaktif di Figma dan memanggil data JSON dinamis di web.',
      startAt: nextWeek,
      timezone: 'Asia/Jakarta',
      durationMinutes: 90,
      status: 'PROPOSED',
      proposedBy: 'u-naya',
      cancelReason: null,
      createdAt: now,
      updatedAt: now,
      proposer: { id: 'u-naya', displayName: 'Nadia Lestary (Naya)' },
      request: {
        id: 'req-101',
        senderId: 'u-raka',
        recipientId: 'u-naya',
        status: 'ACCEPTED',
        sender: { id: 'u-raka', displayName: 'Raka Pratama', timezone: 'Asia/Jakarta' },
        recipient: { id: 'u-naya', displayName: 'Nadia Lestary (Naya)', timezone: 'Asia/Jakarta' },
        offeredSkill: { id: 'sk-js', name: 'JavaScript' },
        requestedSkill: { id: 'sk-figma', name: 'Figma' }
      }
    }
  ];

  const feedbacks: SessionFeedbackDto[] = [
    {
      id: 'fb-301',
      sessionId: 'sess-202',
      reviewerId: 'u-naya',
      reviewerName: 'Nadia Lestary (Naya)',
      rating: 5,
      comment: 'Penjelasan Raka tentang konsep DOM & variabel di JavaScript sangat runtut dan mudah dipahami oleh desainer!',
      createdAt: lastWeek
    },
    {
      id: 'fb-302',
      sessionId: 'sess-202',
      reviewerId: 'u-raka',
      reviewerName: 'Raka Pratama',
      rating: 5,
      comment: 'Naya mengajarkan struktur Auto-Layout Figma dengan contoh nyata yang langsung bisa saya terapkan di proyek.',
      createdAt: lastWeek
    }
  ];

  const milestones: LearningMilestoneDto[] = [
    {
      id: 'ms-401',
      requestId: 'req-101',
      userId: 'u-raka',
      title: 'Menyelesaikan Sistem Komponen & Auto-Layout Responsif di Figma',
      notes: 'Sudah berhasil membuat 4 varian kartu dan navigasi sidebar menggunakan Auto-Layout.',
      isCompleted: true,
      progressPercent: 100,
      createdAt: lastWeek,
      updatedAt: now
    },
    {
      id: 'ms-402',
      requestId: 'req-101',
      userId: 'u-raka',
      title: 'Menyusun Design Tokens (Warna, Tipografi & Spacing) untuk Handoff Developer',
      notes: 'Sedang mempraktikkan penggunaan Figma Variables bersama Naya.',
      isCompleted: false,
      progressPercent: 75,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'ms-403',
      requestId: 'req-101',
      userId: 'u-raka',
      title: 'Modul Latihan JavaScript Fetch API & Manipulasi Komponen untuk Naya',
      notes: 'Menyiapkan repositori starter code sederhana agar Naya bisa langsung praktik.',
      isCompleted: false,
      progressPercent: 50,
      createdAt: now,
      updatedAt: now
    }
  ];

  const messages: DirectMessageDto[] = [
    {
      id: 'msg-501',
      requestId: 'req-101',
      senderId: 'u-naya',
      senderName: 'Nadia Lestary (Naya)',
      recipientId: 'u-raka',
      body: 'Halo Raka! Aku sudah menyiapkan file latihan Figma Auto-Layout & Component Variants untuk sesi kita besok ya.',
      resourceUrl: 'https://figma.com/community/file/skillloop-ui-kit',
      readAt: now,
      isReported: false,
      createdAt: lastWeek
    },
    {
      id: 'msg-502',
      requestId: 'req-101',
      senderId: 'u-raka',
      senderName: 'Raka Pratama',
      recipientId: 'u-naya',
      body: 'Mantap Naya! Aku juga sudah buatkan catatan interaktif JavaScript DOM & starter repo untuk latihan kita.',
      resourceUrl: 'https://github.com/skillloop/js-for-designers-handbook',
      readAt: now,
      isReported: false,
      createdAt: now
    },
    {
      id: 'msg-503',
      requestId: 'req-102',
      senderId: 'u-dimas',
      senderName: 'Evan Dimas Lee',
      recipientId: 'u-raka',
      body: 'Halo Raka, aku kirimkan kerangka materi Product Pitching & Storytelling kalau kamu tertarik bertukar sesi minggu depan!',
      resourceUrl: 'https://docs.skillloop.id/pitching-framework-handbook',
      readAt: null,
      isReported: false,
      createdAt: now
    }
  ];

  const groups: CommunityGroupDto[] = [
    {
      id: 'grp-601',
      name: 'Design-to-Code Reciprocal Study Circle',
      skillFocus: 'UI/UX Figma ⇄ Frontend JavaScript & Tailwind',
      categoryName: 'Web & Product Design',
      description: 'Kelompok belajar mingguan tempat desainer UI/UX dan developer frontend saling membedah file Figma serta menulis kode komponen bersama.',
      meetingLink: 'https://meet.jit.si/SkillLoop-DesignToCode-Circle',
      scheduleNote: 'Setiap Sabtu . 19:30 WIB (UTC+7)',
      creatorId: 'u-naya',
      creatorName: 'Nadia Lestary (Naya)',
      memberIds: ['u-naya', 'u-raka', 'u-dimas'],
      membersCount: 3,
      createdAt: lastWeek
    },
    {
      id: 'grp-602',
      name: 'Full-Stack Data & React Analytics Guild',
      skillFocus: 'Python & PostgreSQL ⇄ React & TypeScript',
      categoryName: 'Data Science & Web',
      description: 'Lingkaran kolaborasi antara praktisi data dan engineer web untuk membangun aplikasi analitik end-to-end.',
      meetingLink: 'https://meet.jit.si/SkillLoop-DataReact-Guild',
      scheduleNote: 'Setiap Minggu . 16:00 WIB (UTC+7)',
      creatorId: 'u-alya',
      creatorName: 'Stefy Alya Catlyna',
      memberIds: ['u-alya', 'u-farhan', 'u-raka'],
      membersCount: 3,
      createdAt: lastWeek
    },
    {
      id: 'grp-603',
      name: 'Tech Storytelling & Product Pitching Lab',
      skillFocus: 'Public Speaking & English ⇄ Product Management',
      categoryName: 'Language & Strategy',
      description: 'Latihan presentasi proyek teknis, review portofolio, dan simulasi tanya-jawab produk dalam bahasa Indonesia & Inggris.',
      meetingLink: 'https://meet.jit.si/SkillLoop-Storytelling-Lab',
      scheduleNote: 'Setiap Kamis . 20:00 WITA (UTC+8)',
      creatorId: 'u-dimas',
      creatorName: 'Evan Dimas Lee',
      memberIds: ['u-dimas', 'u-naya'],
      membersCount: 2,
      createdAt: now
    }
  ];

  const notifications: NotificationDto[] = [
    {
      id: 'notif-701',
      userId: 'u-raka',
      type: 'REQUEST_RECEIVED',
      title: 'Permintaan Pertukaran Baru dari Evan Dimas Lee',
      body: 'Evan Dimas menawarkan Public Speaking untuk ditukar dengan sesi JavaScript.',
      entityType: 'CollaborationRequest',
      entityId: 'req-102',
      readAt: null,
      createdAt: now
    },
    {
      id: 'notif-702',
      userId: 'u-raka',
      type: 'SESSION_PROPOSED',
      title: 'Usulan Jadwal Sesi Baru dari Nadia Lestary',
      body: 'Sesi 2: Interactive Prototyping Figma ⇄ Async Fetch API JavaScript (90 menit).',
      entityType: 'LearningSession',
      entityId: 'sess-203',
      readAt: null,
      createdAt: now
    },
    {
      id: 'notif-703',
      userId: 'u-raka',
      type: 'MESSAGE_RECEIVED',
      title: 'Materi Baru Dibagikan di Ruang Pesan',
      body: 'Nadia Lestary membagikan tautan Figma UI Kit untuk persiapan sesi belajar.',
      entityType: 'DirectMessage',
      entityId: 'msg-501',
      readAt: now,
      createdAt: lastWeek
    }
  ];

  const reports: AdminOverviewDto['reports'] = [
    {
      id: 'rep-801',
      category: 'SPAM_OR_PROMOTION',
      description: 'Mengirimkan pesan promosi komersial di luar konteks pertukaran skill.',
      status: 'OPEN',
      createdAt: now,
      reviewedAt: null,
      reporter: {
        id: 'u-naya',
        displayName: 'Nadia Lestary (Naya)',
        email: 'naya@demo.skillloop.id'
      },
      reportedUser: {
        id: 'u-dimas',
        displayName: 'Evan Dimas Lee',
        email: 'dimas@demo.skillloop.id',
        isActive: true
      }
    }
  ];

  return {
    users: INITIAL_USERS,
    catalog: INITIAL_CATALOG,
    requests,
    sessions,
    feedbacks,
    milestones,
    messages,
    groups,
    notifications,
    blocks: [],
    reports,
    settings: {}
  };
}

function loadState(): LocalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalState;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage parse error
  }
  const initial = buildInitialState();
  saveState(initial);
  return initial;
}

function saveState(state: LocalState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export function getActiveUserEmail(): string {
  try {
    return localStorage.getItem(ACTIVE_USER_KEY) || 'raka@demo.skillloop.id';
  } catch {
    return 'raka@demo.skillloop.id';
  }
}

export function setActiveUserEmail(email: string) {
  try {
    localStorage.setItem(ACTIVE_USER_KEY, email);
  } catch {
    // Ignore
  }
}

function toOwnProfile(u: DemoUserRecord): OwnProfileDto {
  const teachSkills = u.skills.filter((s) => s.role === 'TEACH');
  const learnSkills = u.skills.filter((s) => s.role === 'LEARN');
  const missingSteps: string[] = [];
  let score = 0;

  if (u.displayName && u.displayName.trim().length >= 2) {
    score += 20;
  } else {
    missingSteps.push('Lengkapi nama tampilan (minimal 2 karakter)');
  }

  const trimmedBio = u.bio?.trim() || '';
  if (trimmedBio.length >= 80) {
    score += 15;
  } else if (trimmedBio.length >= 10) {
    score += 8;
  } else {
    missingSteps.push('Tambahkan bio singkat & fokus belajar');
  }

  if (u.timezone && u.timezone.trim().length > 0) {
    score += 10;
  }

  if (u.languages.length > 0) {
    score += 15;
  } else {
    missingSteps.push('Pilih minimal 1 bahasa komunikasi');
  }

  if (teachSkills.length > 0) {
    const hasTeachDetail = teachSkills.some((s) => Boolean(s.description?.trim()));
    score += hasTeachDetail ? 20 : 7;
  } else {
    missingSteps.push('Tambahkan minimal 1 skill Can Teach');
  }

  if (learnSkills.length > 0) {
    const hasLearnDetail = learnSkills.some((s) => Boolean(s.description?.trim()));
    score += hasLearnDetail ? 20 : 6;
  } else {
    missingSteps.push('Tambahkan minimal 1 skill Want to Learn');
  }
  const emailLower = u.email.toLowerCase();
  const isAdmin =
    emailLower === 'raka@demo.skillloop.id' || emailLower.startsWith('admin@');

  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    username: u.username,
    bio: u.bio,
    avatarUrl: u.avatarUrl ?? null,
    timezone: u.timezone,
    isAdmin,
    languages: u.languages,
    skills: u.skills,
    teachSkills,
    learnSkills,
    completeness: {
      score,
      missingSteps,
      isComplete: missingSteps.length === 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function levelWeight(lvl: SkillLevel | null): number {
  if (lvl === 'ADVANCED') return 100;
  if (lvl === 'INTERMEDIATE') return 88;
  return 76;
}

function computeMatchesForUser(
  state: LocalState,
  currentUser: DemoUserRecord
): ReciprocalMatchDto[] {
  const myTeach = currentUser.skills.filter((s) => s.role === 'TEACH');
  const myLearn = currentUser.skills.filter((s) => s.role === 'LEARN');
  const blockedIds = new Set(
    state.blocks
      .filter((b) => b.blockerId === currentUser.id || b.blockedId === currentUser.id)
      .map((b) => (b.blockerId === currentUser.id ? b.blockedId : b.blockerId))
  );

  const results: ReciprocalMatchDto[] = [];

  for (const candidate of state.users) {
    if (candidate.id === currentUser.id || !candidate.isActive || blockedIds.has(candidate.id)) {
      continue;
    }

    const candTeach = candidate.skills.filter((s) => s.role === 'TEACH');
    const candLearn = candidate.skills.filter((s) => s.role === 'LEARN');

    // A can teach B (overlap between myTeach and candLearn, or fallback complementary category)
    let aCanTeachB = myTeach
      .filter((mt) => candLearn.some((cl) => cl.skillId === mt.skillId))
      .map((mt) => {
        const cl = candLearn.find((x) => x.skillId === mt.skillId)!;
        return {
          skillId: mt.skillId,
          skillName: mt.skillName,
          skillSlug: mt.skillSlug,
          categoryId: mt.categoryId,
          categoryName: mt.categoryName,
          categorySlug: mt.categorySlug,
          teacherLevel: mt.proficiencyLevel,
          learnerTargetLevel: cl.targetLevel,
          teacherDescription: mt.description,
          learnerDescription: cl.description,
          skillFit: 100,
          levelFit: levelWeight(mt.proficiencyLevel)
        };
      });

    let bCanTeachA = candTeach
      .filter((ct) => myLearn.some((ml) => ml.skillId === ct.skillId))
      .map((ct) => {
        const ml = myLearn.find((x) => x.skillId === ct.skillId)!;
        return {
          skillId: ct.skillId,
          skillName: ct.skillName,
          skillSlug: ct.skillSlug,
          categoryId: ct.categoryId,
          categoryName: ct.categoryName,
          categorySlug: ct.categorySlug,
          teacherLevel: ct.proficiencyLevel,
          learnerTargetLevel: ml.targetLevel,
          teacherDescription: ct.description,
          learnerDescription: ml.description,
          skillFit: 100,
          levelFit: levelWeight(ct.proficiencyLevel)
        };
      });

    // Ensure rich demo reciprocal visibility across all demo personas with realistic varied fit scores
    if (aCanTeachB.length === 0 && myTeach.length > 0) {
      const mt = myTeach[0];
      aCanTeachB = [
        {
          skillId: mt.skillId,
          skillName: mt.skillName,
          skillSlug: mt.skillSlug,
          categoryId: mt.categoryId,
          categoryName: mt.categoryName,
          categorySlug: mt.categorySlug,
          teacherLevel: mt.proficiencyLevel,
          learnerTargetLevel: 'INTERMEDIATE',
          teacherDescription: mt.description,
          learnerDescription: 'Tertarik memperdalam topik ini untuk kolaborasi lintas disiplin.',
          skillFit: 72,
          levelFit: 78
        }
      ];
    }

    if (bCanTeachA.length === 0 && candTeach.length > 0) {
      const ct = candTeach[0];
      bCanTeachA = [
        {
          skillId: ct.skillId,
          skillName: ct.skillName,
          skillSlug: ct.skillSlug,
          categoryId: ct.categoryId,
          categoryName: ct.categoryName,
          categorySlug: ct.categorySlug,
          teacherLevel: ct.proficiencyLevel,
          learnerTargetLevel: 'INTERMEDIATE',
          teacherDescription: ct.description,
          learnerDescription: 'Relevan untuk memperluas wawasan teknis & produk.',
          skillFit: 70,
          levelFit: 76
        }
      ];
    }

    if (aCanTeachB.length === 0 || bCanTeachA.length === 0) continue;

    const availabilityById: Record<string, number> = {
      'u-naya': 98,
      'u-dimas': 82,
      'u-alya': 74,
      'u-farhan': 61
    };
    const sameTz = candidate.timezone === currentUser.timezone;
    const availabilityFit = availabilityById[candidate.id] ?? (sameTz ? 88 : 72);
    const aToBScore = Math.round(
      0.7 * aCanTeachB[0].skillFit + 0.2 * aCanTeachB[0].levelFit + 0.1 * availabilityFit
    );
    const bToAScore = Math.round(
      0.7 * bCanTeachA[0].skillFit + 0.2 * bCanTeachA[0].levelFit + 0.1 * availabilityFit
    );
    const overallScore = Math.round(
      0.65 * Math.min(aToBScore, bToAScore) + 0.35 * ((aToBScore + bToAScore) / 2)
    );

    const existingReq = state.requests.find(
      (r) =>
        (r.senderId === currentUser.id && r.recipientId === candidate.id) ||
        (r.senderId === candidate.id && r.recipientId === currentUser.id)
    );

    const sharedLanguages = currentUser.languages.filter((l) =>
      candidate.languages.includes(l)
    );

    const candOwn = toOwnProfile(candidate);

    results.push({
      user: {
        id: candidate.id,
        displayName: candidate.displayName,
        username: candidate.username,
        bio: candidate.bio,
        avatarUrl: null,
        timezone: candidate.timezone,
        languages: candidate.languages,
        profileCompleteness: candOwn.completeness.score,
        teachSkills: candTeach,
        learnSkills: candLearn
      },
      score: {
        algorithmVersion: 1,
        aToBScore,
        bToAScore,
        overallScore,
        availabilityFit,
        hasAvailabilityData: true,
        note: 'Reciprocal two-way deterministic fit'
      },
      explanation: {
        summary: `Kamu dapat mengajarkan ${aCanTeachB.map((x) => x.skillName).join(', ')} kepada ${candidate.displayName}, sementara ${candidate.displayName} dapat membimbingmu menguasai ${bCanTeachA.map((x) => x.skillName).join(', ')}.`,
        aCanTeachB,
        bCanTeachA,
        sharedLanguages,
        reasons: [
          `Kecocokan dua arah langsung: Kamu mengajar ${aCanTeachB[0].skillName} (${aCanTeachB[0].teacherLevel}) & belajar ${bCanTeachA[0].skillName} (${bCanTeachA[0].teacherLevel}).`,
          `Kesesuaian zona waktu ${candidate.timezone} dengan tingkat kecocokan jadwal ${availabilityFit}%.`,
          `Bahasa komunikasi bersama: ${sharedLanguages.map((l) => l.toUpperCase()).join(', ')}.`
        ]
      },
      existingRequestStatus: existingReq?.status || null,
      existingRequestId: existingReq?.id || null
    });
  }

  return results.sort((a, b) => b.score.overallScore - a.score.overallScore);
}

export const localFallbackApi = {
  clearLoggedOut() {
    try {
      localStorage.removeItem(LOGGED_OUT_KEY);
    } catch {
      // Ignore
    }
  },

  logout() {
    try {
      localStorage.setItem(LOGGED_OUT_KEY, '1');
    } catch {
      // Ignore
    }
  },

  getCurrentUserOrNull(): OwnProfileDto | null {
    try {
      if (localStorage.getItem(LOGGED_OUT_KEY) === '1') {
        return null;
      }
    } catch {
      // Ignore
    }
    return this.getCurrentUser();
  },

  getCurrentUser(): OwnProfileDto {
    const state = loadState();
    const email = getActiveUserEmail();
    const found =
      state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      state.users[0];
    return toOwnProfile(found);
  },

  login(email: string, password?: string): OwnProfileDto {
    const state = loadState();
    const normalizedEmail = email.trim().toLowerCase();
    const found = state.users.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );
    if (!found) {
      throw new ApiClientError(
        401,
        'INVALID_CREDENTIALS',
        'Email atau password yang kamu masukkan tidak sesuai.'
      );
    }
    const expectedPassword = found.password || 'DemoSkillLoop123!';
    if (password !== undefined && password !== expectedPassword) {
      throw new ApiClientError(
        401,
        'INVALID_CREDENTIALS',
        'Email atau password yang kamu masukkan tidak sesuai.'
      );
    }
    if (!found.isActive) {
      throw new ApiClientError(
        403,
        'ACCOUNT_SUSPENDED',
        'Akun ini sedang ditangguhkan oleh administrator.'
      );
    }
    this.clearLoggedOut();
    setActiveUserEmail(found.email);
    return toOwnProfile(found);
  },

  register(payload: {
    email: string;
    password?: string;
    displayName: string;
    timezone?: string;
    languages?: string[];
  }): OwnProfileDto {
    const state = loadState();
    const normalizedEmail = payload.email.trim().toLowerCase();
    if (state.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      throw new ApiClientError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'Alamat email ini sudah digunakan. Silakan login atau gunakan email lain.'
      );
    }
    if (payload.password !== undefined && payload.password.length < 8) {
      throw new ApiClientError(
        422,
        'VALIDATION_ERROR',
        'Password minimal 8 karakter.'
      );
    }

    const baseUsername = payload.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const newUser: DemoUserRecord = {
      id: `u-${Date.now()}`,
      email: normalizedEmail,
      password: payload.password || 'DemoSkillLoop123!',
      displayName: payload.displayName.trim(),
      username: baseUsername || `user${Date.now()}`,
      bio: '',
      timezone: payload.timezone || 'Asia/Jakarta',
      languages:
        payload.languages && payload.languages.length > 0
          ? payload.languages
          : ['id'],
      isActive: true,
      skills: []
    };
    state.users.push(newUser);
    saveState(state);
    this.clearLoggedOut();
    setActiveUserEmail(newUser.email);
    return toOwnProfile(newUser);
  },

  updateProfile(payload: {
    displayName?: string;
    username?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    timezone?: string;
    languages?: string[];
  }): OwnProfileDto {
    const state = loadState();
    const email = getActiveUserEmail();
    const user =
      state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      state.users[0];
    if (payload.displayName) user.displayName = payload.displayName;
    if (payload.username !== undefined) user.username = payload.username || user.username;
    if (payload.bio !== undefined) user.bio = payload.bio || '';
    if (payload.avatarUrl !== undefined) user.avatarUrl = payload.avatarUrl;
    if (payload.timezone) user.timezone = payload.timezone;
    if (payload.languages) user.languages = payload.languages;
    saveState(state);
    return toOwnProfile(user);
  },

  getCatalog(params?: { q?: string; category?: string }) {
    const state = loadState();
    let list = [...state.catalog];
    if (params?.category) {
      list = list.filter((s) => s.category.slug === params.category || s.category.id === params.category);
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q) ||
          s.aliases.some((a) => a.toLowerCase().includes(q))
      );
    }
    return {
      data: list,
      meta: { total: list.length, categories: CATEGORIES }
    };
  },

  getMySkills() {
    const profile = this.getCurrentUser();
    return {
      all: profile.skills,
      teach: profile.teachSkills,
      learn: profile.learnSkills
    };
  },

  addSkill(payload: {
    skillId: string;
    role: SkillRole;
    proficiencyLevel?: SkillLevel | null;
    targetLevel?: SkillLevel | null;
    description?: string | null;
  }): SkillDeclarationDto {
    const state = loadState();
    const email = getActiveUserEmail();
    const user =
      state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      state.users[0];

    const existingIdx = user.skills.findIndex(
      (s) => s.skillId === payload.skillId && s.role === payload.role
    );
    const decl = makeSkillDecl(
      `sd-${Date.now()}`,
      payload.skillId,
      payload.role,
      (payload.role === 'TEACH' ? payload.proficiencyLevel : payload.targetLevel) ||
        'INTERMEDIATE',
      payload.description || ''
    );

    if (existingIdx >= 0) {
      user.skills[existingIdx] = decl;
    } else {
      user.skills.unshift(decl);
    }
    saveState(state);
    return decl;
  },

  deleteSkill(userSkillId: string) {
    const state = loadState();
    const email = getActiveUserEmail();
    const user =
      state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      state.users[0];
    user.skills = user.skills.filter((s) => s.id !== userSkillId);
    saveState(state);
    return { deleted: true };
  },

  listMatches(params?: {
    category?: string;
    language?: string;
    level?: string;
    availability?: string;
    minScore?: number;
    sortBy?: string;
    search?: string;
  }) {
    const state = loadState();
    const email = getActiveUserEmail();
    const user =
      state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      state.users[0];
    let matches = computeMatchesForUser(state, user);

    if (params?.category) {
      matches = matches.filter(
        (m) =>
          m.explanation.aCanTeachB.some((s) => s.categorySlug === params.category) ||
          m.explanation.bCanTeachA.some((s) => s.categorySlug === params.category)
      );
    }
    if (params?.language) {
      matches = matches.filter((m) => m.user.languages.includes(params.language!));
    }
    if (params?.level) {
      matches = matches.filter((m) =>
        m.explanation.bCanTeachA.some((s) => s.teacherLevel === params.level)
      );
    }
    if (params?.availability === 'same_timezone') {
      matches = matches.filter((m) => m.user.timezone === user.timezone);
    } else if (params?.availability === 'compatible') {
      matches = matches.filter((m) => m.score.availabilityFit >= 80);
    }
    if (params?.minScore) {
      matches = matches.filter((m) => m.score.overallScore >= params.minScore!);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      matches = matches.filter(
        (m) =>
          m.user.displayName.toLowerCase().includes(q) ||
          m.user.teachSkills.some((s) => s.skillName.toLowerCase().includes(q)) ||
          m.user.learnSkills.some((s) => s.skillName.toLowerCase().includes(q))
      );
    }
    if (params?.sortBy === 'availability') {
      matches.sort((a, b) => b.score.availabilityFit - a.score.availabilityFit);
    } else if (params?.sortBy === 'completeness') {
      matches.sort((a, b) => b.user.profileCompleteness - a.user.profileCompleteness);
    }

    return {
      data: matches,
      meta: { page: 1, limit: 20, total: matches.length, totalPages: 1 }
    };
  },

  getMatchDetail(userId: string): ReciprocalMatchDto {
    const state = loadState();
    const email = getActiveUserEmail();
    const user =
      state.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ||
      state.users[0];
    const matches = computeMatchesForUser(state, user);
    return matches.find((m) => m.user.id === userId) || matches[0];
  },

  listRequests(params?: { direction?: 'incoming' | 'outgoing' | 'all'; status?: string }) {
    const state = loadState();
    const current = this.getCurrentUser();
    let list = state.requests.filter(
      (r) => r.senderId === current.id || r.recipientId === current.id
    );
    if (params?.direction === 'incoming') {
      list = list.filter((r) => r.recipientId === current.id);
    } else if (params?.direction === 'outgoing') {
      list = list.filter((r) => r.senderId === current.id);
    }
    if (params?.status) {
      list = list.filter((r) => r.status === params.status);
    }
    return list;
  },

  createRequest(payload: {
    recipientId: string;
    offeredSkillId?: string | null;
    requestedSkillId?: string | null;
    introMessage?: string | null;
  }): CollaborationRequestDto {
    const state = loadState();
    const current = this.getCurrentUser();
    const recipient =
      state.users.find((u) => u.id === payload.recipientId) || state.users[1];
    const offered = state.catalog.find((s) => s.id === payload.offeredSkillId) || state.catalog[0];
    const requested = state.catalog.find((s) => s.id === payload.requestedSkillId) || state.catalog[5];
    const now = new Date().toISOString();

    const newReq: CollaborationRequestDto = {
      id: `req-${Date.now()}`,
      senderId: current.id,
      recipientId: recipient.id,
      offeredSkillId: offered.id,
      requestedSkillId: requested.id,
      status: 'PENDING',
      introMessage: payload.introMessage || 'Mari bertukar sesi belajar mingguan!',
      createdAt: now,
      updatedAt: now,
      respondedAt: null,
      sender: {
        id: current.id,
        displayName: current.displayName,
        username: current.username,
        avatarUrl: null,
        timezone: current.timezone
      },
      recipient: {
        id: recipient.id,
        displayName: recipient.displayName,
        username: recipient.username,
        avatarUrl: null,
        timezone: recipient.timezone
      },
      offeredSkill: { id: offered.id, name: offered.name, slug: offered.slug },
      requestedSkill: { id: requested.id, name: requested.name, slug: requested.slug },
      sessionsCount: 0
    };
    state.requests.unshift(newReq);
    saveState(state);
    return newReq;
  },

  updateRequestStatus(
    requestId: string,
    action: 'ACCEPT' | 'REJECT' | 'CANCEL' | 'COUNTER',
    counterDetails?: {
      offeredSkillId?: string | null;
      requestedSkillId?: string | null;
      introMessage?: string | null;
    }
  ): CollaborationRequestDto {
    const state = loadState();
    const req = state.requests.find((r) => r.id === requestId) || state.requests[0];
    if (action === 'ACCEPT') req.status = 'ACCEPTED';
    if (action === 'REJECT') req.status = 'REJECTED';
    if (action === 'CANCEL') req.status = 'CANCELLED';
    if (action === 'COUNTER' && counterDetails?.introMessage) {
      req.introMessage = counterDetails.introMessage;
      req.status = 'PENDING';
    }
    req.updatedAt = new Date().toISOString();
    saveState(state);
    return req;
  },

  listSessions(status?: string): LearningSessionDto[] {
    const state = loadState();
    const current = this.getCurrentUser();
    let list = state.sessions.filter(
      (s) => s.request.senderId === current.id || s.request.recipientId === current.id
    );
    if (list.length === 0) list = state.sessions;
    if (status) {
      list = list.filter((s) => s.status === status);
    }
    return list;
  },

  createSession(payload: {
    requestId: string;
    topic: string;
    description?: string | null;
    startAt: string;
    timezone: string;
    durationMinutes: number;
  }): LearningSessionDto {
    const state = loadState();
    const current = this.getCurrentUser();
    const req = state.requests.find((r) => r.id === payload.requestId) || state.requests[0];
    const now = new Date().toISOString();
    const newSess: LearningSessionDto = {
      id: `sess-${Date.now()}`,
      requestId: req.id,
      topic: payload.topic,
      description: payload.description || null,
      startAt: payload.startAt,
      timezone: payload.timezone,
      durationMinutes: payload.durationMinutes,
      status: 'PROPOSED',
      proposedBy: current.id,
      cancelReason: null,
      createdAt: now,
      updatedAt: now,
      proposer: { id: current.id, displayName: current.displayName },
      request: {
        id: req.id,
        senderId: req.senderId,
        recipientId: req.recipientId,
        status: req.status,
        sender: req.sender,
        recipient: req.recipient,
        offeredSkill: req.offeredSkill,
        requestedSkill: req.requestedSkill
      }
    };
    req.sessionsCount += 1;
    state.sessions.unshift(newSess);
    saveState(state);
    return newSess;
  },

  updateSession(
    sessionId: string,
    payload: {
      action: 'CONFIRM' | 'RESCHEDULE' | 'COMPLETE' | 'CANCEL';
      startAt?: string;
      timezone?: string;
      durationMinutes?: number;
      cancelReason?: string | null;
    }
  ): LearningSessionDto {
    const state = loadState();
    const sess = state.sessions.find((s) => s.id === sessionId) || state.sessions[0];
    if (payload.action === 'CONFIRM') sess.status = 'SCHEDULED';
    if (payload.action === 'COMPLETE') sess.status = 'COMPLETED';
    if (payload.action === 'CANCEL') {
      sess.status = 'CANCELLED';
      sess.cancelReason = payload.cancelReason || 'Dibatalkan oleh pengguna';
    }
    if (payload.action === 'RESCHEDULE') {
      if (payload.startAt) sess.startAt = payload.startAt;
      if (payload.durationMinutes) sess.durationMinutes = payload.durationMinutes;
      sess.status = 'PROPOSED';
    }
    sess.updatedAt = new Date().toISOString();
    saveState(state);
    return sess;
  },

  listSessionFeedback(sessionId: string): SessionFeedbackDto[] {
    const state = loadState();
    return state.feedbacks.filter((f) => f.sessionId === sessionId);
  },

  submitFeedback(sessionId: string, payload: { rating: number; comment: string }): SessionFeedbackDto {
    const state = loadState();
    const current = this.getCurrentUser();
    const fb: SessionFeedbackDto = {
      id: `fb-${Date.now()}`,
      sessionId,
      reviewerId: current.id,
      reviewerName: current.displayName,
      rating: payload.rating,
      comment: payload.comment,
      createdAt: new Date().toISOString()
    };
    state.feedbacks.push(fb);
    saveState(state);
    return fb;
  },

  getReputation(_userId: string): UserReputationDto {
    const state = loadState();
    return {
      averageRating: 4.9,
      totalReviews: state.feedbacks.length,
      completedSessionsCount: state.sessions.filter((s) => s.status === 'COMPLETED').length + 3,
      reviews: state.feedbacks.map((f) => ({
        id: f.id,
        sessionId: f.sessionId,
        sessionTopic: 'Sesi Pertukaran Figma ⇄ JavaScript',
        reviewerId: f.reviewerId,
        reviewerName: f.reviewerName || 'Partner Komunitas',
        rating: f.rating,
        comment: f.comment,
        createdAt: f.createdAt
      }))
    };
  },

  listMilestones(): LearningMilestoneDto[] {
    const state = loadState();
    return state.milestones;
  },

  createMilestone(payload: {
    requestId: string;
    title: string;
    notes?: string | null;
    progressPercent?: number;
  }): LearningMilestoneDto {
    const state = loadState();
    const current = this.getCurrentUser();
    const now = new Date().toISOString();
    const pct = payload.progressPercent ?? 50;
    const ms: LearningMilestoneDto = {
      id: `ms-${Date.now()}`,
      requestId: payload.requestId,
      userId: current.id,
      title: payload.title,
      notes: payload.notes || null,
      isCompleted: pct >= 100,
      progressPercent: pct,
      createdAt: now,
      updatedAt: now
    };
    state.milestones.unshift(ms);
    saveState(state);
    return ms;
  },

  updateMilestone(
    milestoneId: string,
    payload: {
      title?: string;
      notes?: string | null;
      isCompleted?: boolean;
      progressPercent?: number;
    }
  ): LearningMilestoneDto {
    const state = loadState();
    const ms = state.milestones.find((m) => m.id === milestoneId) || state.milestones[0];
    if (payload.title !== undefined) ms.title = payload.title;
    if (payload.notes !== undefined) ms.notes = payload.notes;
    if (payload.isCompleted !== undefined) ms.isCompleted = payload.isCompleted;
    if (payload.progressPercent !== undefined) ms.progressPercent = payload.progressPercent;
    saveState(state);
    return ms;
  },

  deleteMilestone(milestoneId: string) {
    const state = loadState();
    state.milestones = state.milestones.filter((m) => m.id !== milestoneId);
    saveState(state);
    return { deleted: true };
  },

  listMessageThreads(): MessageThreadDto[] {
    const state = loadState();
    const current = this.getCurrentUser();
    const myRequests = state.requests.filter(
      (r) => r.senderId === current.id || r.recipientId === current.id
    );
    const activeReqs = myRequests.length > 0 ? myRequests : state.requests;

    return activeReqs.map((r) => {
      const partner = r.senderId === current.id ? r.recipient : r.sender;
      const msgs = state.messages.filter((m) => m.requestId === r.id);
      const unreadCount = msgs.filter((m) => m.recipientId === current.id && !m.readAt).length;
      return {
        request: r,
        partner,
        messages: msgs,
        unreadCount
      };
    });
  },

  sendMessage(payload: {
    requestId: string;
    body: string;
    resourceUrl?: string | null;
  }): DirectMessageDto {
    const state = loadState();
    const current = this.getCurrentUser();
    const req = state.requests.find((r) => r.id === payload.requestId) || state.requests[0];
    const recipientId = req.senderId === current.id ? req.recipientId : req.senderId;
    const msg: DirectMessageDto = {
      id: `msg-${Date.now()}`,
      requestId: req.id,
      senderId: current.id,
      senderName: current.displayName,
      recipientId,
      body: payload.body,
      resourceUrl: payload.resourceUrl || null,
      readAt: null,
      isReported: false,
      createdAt: new Date().toISOString()
    };
    state.messages.push(msg);
    saveState(state);
    return msg;
  },

  markThreadRead(requestId: string) {
    const state = loadState();
    const current = this.getCurrentUser();
    const now = new Date().toISOString();
    let count = 0;
    for (const m of state.messages) {
      if (m.requestId === requestId && m.recipientId === current.id && !m.readAt) {
        m.readAt = now;
        count++;
      }
    }
    saveState(state);
    return { updatedCount: count };
  },

  listGroups(): CommunityGroupDto[] {
    const state = loadState();
    return state.groups;
  },

  createGroup(payload: {
    name: string;
    skillFocus: string;
    categoryName?: string;
    description: string;
    meetingLink?: string | null;
    scheduleNote: string;
  }): CommunityGroupDto {
    const state = loadState();
    const current = this.getCurrentUser();
    const grp: CommunityGroupDto = {
      id: `grp-${Date.now()}`,
      name: payload.name,
      skillFocus: payload.skillFocus,
      categoryName: payload.categoryName || 'Web & Product Design',
      description: payload.description,
      meetingLink:
        payload.meetingLink ||
        `https://meet.jit.si/SkillLoop-Circle-${Date.now().toString().slice(-4)}`,
      scheduleNote: payload.scheduleNote,
      creatorId: current.id,
      creatorName: current.displayName,
      memberIds: [current.id],
      membersCount: 1,
      createdAt: new Date().toISOString()
    };
    state.groups.unshift(grp);
    saveState(state);
    return grp;
  },

  toggleJoinGroup(groupId: string): CommunityGroupDto {
    const state = loadState();
    const current = this.getCurrentUser();
    const grp = state.groups.find((g) => g.id === groupId) || state.groups[0];
    if (grp.memberIds.includes(current.id)) {
      grp.memberIds = grp.memberIds.filter((id) => id !== current.id);
    } else {
      grp.memberIds.push(current.id);
    }
    grp.membersCount = grp.memberIds.length;
    saveState(state);
    return grp;
  },

  getSettings(): UserSettingsDto {
    const state = loadState();
    const current = this.getCurrentUser();
    return (
      state.settings[current.id] || {
        userId: current.id,
        notifyNewRequest: true,
        notifyRequestAccepted: true,
        notifySessionUpdates: true,
        notifyNewFeedback: true,
        showTimezonePublicly: true,
        showPortfolioPublicly: true,
        showHistoryPublicly: true,
        interfaceLanguage: 'id'
      }
    );
  },

  updateSettings(payload: Partial<Omit<UserSettingsDto, 'userId'>>): UserSettingsDto {
    const state = loadState();
    const current = this.getCurrentUser();
    const existing = this.getSettings();
    const updated = { ...existing, ...payload, userId: current.id };
    state.settings[current.id] = updated;
    saveState(state);
    return updated;
  },

  listNotifications() {
    const state = loadState();
    const unreadCount = state.notifications.filter((n) => !n.readAt).length;
    return {
      data: state.notifications,
      meta: { total: state.notifications.length, unreadCount }
    };
  },

  markNotificationRead(id: string) {
    const state = loadState();
    const n = state.notifications.find((x) => x.id === id) || state.notifications[0];
    if (n) n.readAt = new Date().toISOString();
    saveState(state);
    return n;
  },

  markAllNotificationsRead() {
    const state = loadState();
    const now = new Date().toISOString();
    state.notifications.forEach((n) => {
      n.readAt = now;
    });
    saveState(state);
    return { updatedCount: state.notifications.length };
  },

  listBlocks() {
    const state = loadState();
    const current = this.getCurrentUser();
    return state.blocks
      .filter((b) => b.blockerId === current.id)
      .map((b) => {
        const u = state.users.find((x) => x.id === b.blockedId) || state.users[1];
        return {
          id: b.id,
          blockedId: b.blockedId,
          createdAt: b.createdAt,
          blockedUser: { id: u.id, displayName: u.displayName, username: u.username }
        };
      });
  },

  blockUser(userId: string) {
    const state = loadState();
    const current = this.getCurrentUser();
    const b = {
      id: `blk-${Date.now()}`,
      blockerId: current.id,
      blockedId: userId,
      createdAt: new Date().toISOString()
    };
    state.blocks.push(b);
    saveState(state);
    return { id: b.id };
  },

  unblockUser(userId: string) {
    const state = loadState();
    const current = this.getCurrentUser();
    state.blocks = state.blocks.filter(
      (b) => !(b.blockerId === current.id && b.blockedId === userId)
    );
    saveState(state);
    return { unblocked: true };
  },

  reportUser(payload: { reportedUserId: string; category: string; description: string }) {
    const state = loadState();
    const current = this.getCurrentUser();
    const target = state.users.find((u) => u.id === payload.reportedUserId) || state.users[2];
    const rep = {
      id: `rep-${Date.now()}`,
      category: payload.category,
      description: payload.description,
      status: 'OPEN' as const,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reporter: { id: current.id, displayName: current.displayName, email: current.email },
      reportedUser: {
        id: target.id,
        displayName: target.displayName,
        email: target.email,
        isActive: target.isActive
      }
    };
    state.reports.unshift(rep);
    saveState(state);
    return { id: rep.id, status: rep.status };
  },

  getAdminOverview(): AdminOverviewDto {
    const state = loadState();
    return {
      stats: {
        totalUsers: state.users.length,
        activeUsers: state.users.filter((u) => u.isActive).length,
        suspendedUsers: state.users.filter((u) => !u.isActive).length,
        totalSkills: state.catalog.length,
        totalCategories: CATEGORIES.length,
        totalRequests: state.requests.length,
        totalSessions: state.sessions.length,
        openReports: state.reports.filter((r) => r.status === 'OPEN').length
      },
      users: state.users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        username: u.username,
        timezone: u.timezone,
        isActive: u.isActive,
        skillsCount: u.skills.length,
        createdAt: new Date().toISOString()
      })),
      reports: state.reports,
      categories: CATEGORIES,
      skills: state.catalog
    };
  },

  updateAdminReport(reportId: string, status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED') {
    const state = loadState();
    const rep = state.reports.find((r) => r.id === reportId);
    if (rep) {
      rep.status = status;
      rep.reviewedAt = new Date().toISOString();
      saveState(state);
    }
    return { id: reportId, status };
  },

  setAdminUserStatus(userId: string, isActive: boolean) {
    const state = loadState();
    const u = state.users.find((x) => x.id === userId) || state.users[0];
    u.isActive = isActive;
    state.reports.forEach((r) => {
      if (r.reportedUser.id === userId) {
        r.reportedUser.isActive = isActive;
      }
    });
    saveState(state);
    return { id: u.id, displayName: u.displayName, isActive: u.isActive };
  },

  createAdminSkill(payload: {
    name: string;
    categoryId: string;
    description: string;
    aliases?: string[];
  }): CatalogSkillDto {
    const state = loadState();
    const cat = CATEGORIES.find((c) => c.id === payload.categoryId) || CATEGORIES[0];
    const newSkill: CatalogSkillDto = {
      id: `sk-${Date.now()}`,
      name: payload.name,
      slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: payload.description,
      category: cat,
      aliases: payload.aliases || []
    };
    state.catalog.unshift(newSkill);
    saveState(state);
    return newSkill;
  },

  deleteAdminSkill(skillId: string): { deleted: boolean; id: string } {
    const state = loadState();
    state.catalog = state.catalog.filter((s) => s.id !== skillId);
    state.users.forEach((u) => {
      u.skills = u.skills.filter((s) => s.skillId !== skillId);
    });
    saveState(state);
    return { deleted: true, id: skillId };
  },

  getDashboard(): DashboardDto {
    const state = loadState();
    const profile = this.getCurrentUser();
    const userRecord =
      state.users.find((u) => u.id === profile.id) || state.users[0];
    const topMatches = computeMatchesForUser(state, userRecord);
    const myRequests = this.listRequests({ direction: 'all' });
    const mySessions = this.listSessions();
    const myMilestones = state.milestones.filter((m) => m.userId === profile.id);

    const now = new Date();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const daily = Array.from({ length: 7 }, (_, idx) => {
      const offset = idx - 6;
      const start = new Date(todayStart.getTime() + offset * 24 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      const inRange = (dStr: string) => {
        const dt = new Date(dStr);
        return dt >= start && dt < end;
      };
      const sess = mySessions.filter((s) => s.status !== 'CANCELLED' && inRange(s.startAt));
      const reqs = myRequests.filter((r) => inRange(r.createdAt));
      const ms = myMilestones.filter((m) => inRange(m.updatedAt));
      const minutes =
        sess.reduce((acc, s) => acc + s.durationMinutes, 0) + ms.length * 15 + reqs.length * 10;
      return {
        key: start.toISOString().slice(0, 10),
        label: offset === 0 ? 'Hari Ini' : dayNames[start.getDay()],
        fullLabel: start.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
        sessionsCount: sess.length,
        requestsCount: reqs.length,
        milestonesCount: ms.length,
        minutes,
        totalActivities: sess.length + reqs.length + ms.length
      };
    });

    const weekly = Array.from({ length: 4 }, (_, idx) => {
      const weeksAgo = 3 - idx;
      const end = new Date(todayStart.getTime() + (1 - weeksAgo * 7) * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      const inRange = (dStr: string) => {
        const dt = new Date(dStr);
        return dt >= start && dt < end;
      };
      const sess = mySessions.filter((s) => s.status !== 'CANCELLED' && inRange(s.startAt));
      const reqs = myRequests.filter((r) => inRange(r.createdAt));
      const ms = myMilestones.filter((m) => inRange(m.updatedAt));
      const minutes =
        sess.reduce((acc, s) => acc + s.durationMinutes, 0) + ms.length * 15 + reqs.length * 10;
      return {
        key: `week-${idx + 1}`,
        label: weeksAgo === 0 ? 'Minggu Ini' : `Mg -${weeksAgo}`,
        fullLabel:
          weeksAgo === 0
            ? 'Minggu Ini (7 Hari Terakhir)'
            : `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${new Date(
                end.getTime() - 1
              ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
        sessionsCount: sess.length,
        requestsCount: reqs.length,
        milestonesCount: ms.length,
        minutes,
        totalActivities: sess.length + reqs.length + ms.length
      };
    });

    const monthly = Array.from({ length: 6 }, (_, idx) => {
      const monthsAgo = 5 - idx;
      const refDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const y = refDate.getFullYear();
      const m = refDate.getMonth();
      const inMonth = (dStr: string) => {
        const dt = new Date(dStr);
        return dt.getFullYear() === y && dt.getMonth() === m;
      };
      const sess = mySessions.filter((s) => s.status !== 'CANCELLED' && inMonth(s.startAt));
      const reqs = myRequests.filter((r) => inMonth(r.createdAt));
      const ms = myMilestones.filter((mItem) => inMonth(mItem.updatedAt));
      const minutes =
        sess.reduce((acc, s) => acc + s.durationMinutes, 0) + ms.length * 15 + reqs.length * 10;
      return {
        key: `${y}-${String(m + 1).padStart(2, '0')}`,
        label: monthNames[m],
        fullLabel: `${monthNames[m]} ${y}`,
        sessionsCount: sess.length,
        requestsCount: reqs.length,
        milestonesCount: ms.length,
        minutes,
        totalActivities: sess.length + reqs.length + ms.length
      };
    });

    return {
      profile,
      stats: {
        reciprocalMatchesCount: topMatches.length,
        incomingPendingCount: myRequests.filter(
          (r) => r.recipientId === profile.id && r.status === 'PENDING'
        ).length,
        outgoingPendingCount: myRequests.filter(
          (r) => r.senderId === profile.id && r.status === 'PENDING'
        ).length,
        activeCollaborationsCount: myRequests.filter((r) => r.status === 'ACCEPTED').length,
        upcomingSessionsCount: mySessions.filter(
          (s) => s.status === 'SCHEDULED' || s.status === 'PROPOSED'
        ).length,
        completedSessionsCount: mySessions.filter((s) => s.status === 'COMPLETED').length,
        unreadNotificationsCount: state.notifications.filter((n) => !n.readAt).length,
        averageRating: 4.9,
        totalReviews: state.feedbacks.length
      },
      topMatches,
      recentRequests: myRequests,
      upcomingSessions: mySessions.filter((s) => s.status !== 'CANCELLED'),
      milestones: myMilestones,
      activitySummary: { daily, weekly, monthly }
    };
  }
};
