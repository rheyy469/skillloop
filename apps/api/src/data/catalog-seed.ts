import { SkillLevel, SkillRole } from '@skillloop/shared';

export interface SeedCategory {
  id: string;
  name: string;
  slug: string;
}

export interface SeedSkill {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  aliases: string[];
}

export interface SeedDemoUser {
  id: string;
  email: string;
  passwordPlain: string;
  displayName: string;
  username: string;
  bio: string | null;
  timezone: string;
  languages: { code: string; proficiency: string }[];
  skills: {
    skillSlug: string;
    role: SkillRole;
    proficiencyLevel?: SkillLevel;
    targetLevel?: SkillLevel;
    description: string | null;
  }[];
}

export const INITIAL_CATEGORIES: SeedCategory[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Web & Software Development',
    slug: 'web-software-development'
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'UI/UX & Product Design',
    slug: 'ui-ux-product-design'
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Data & Analytics',
    slug: 'data-analytics'
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Languages & Communication',
    slug: 'languages-communication'
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    name: 'Creative & Digital Media',
    slug: 'creative-digital-media'
  }
];

export const INITIAL_SKILLS: SeedSkill[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    name: 'JavaScript',
    slug: 'javascript',
    categoryId: '11111111-1111-4111-8111-111111111101',
    description: 'Pemrograman JavaScript modern (ES6+, DOM, asynchronous programming, dan logika aplikasi web).',
    aliases: ['js', 'javascript dasar', 'ecmascript', 'vanilla js', 'java script']
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    name: 'HTML & CSS',
    slug: 'html-css',
    categoryId: '11111111-1111-4111-8111-111111111101',
    description: 'Struktur halaman web semantik dengan HTML5 dan layout responsif modern menggunakan CSS3 / Flexbox / Grid.',
    aliases: ['html', 'css', 'html5', 'css3', 'html dan css', 'web layout']
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    name: 'React',
    slug: 'react',
    categoryId: '11111111-1111-4111-8111-111111111101',
    description: 'Membangun antarmuka pengguna deklaratif berbasis komponen dengan React dan Hooks.',
    aliases: ['reactjs', 'react.js', 'react hooks']
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    name: 'TypeScript',
    slug: 'typescript',
    categoryId: '11111111-1111-4111-8111-111111111101',
    description: 'Pengembangan aplikasi berskala kuat dengan static type checking di atas JavaScript.',
    aliases: ['ts', 'type script']
  },
  {
    id: '22222222-2222-4222-8222-222222222205',
    name: 'Node.js & Express',
    slug: 'nodejs-express',
    categoryId: '11111111-1111-4111-8111-111111111101',
    description: 'Pembuatan REST API, autentikasi, dan arsitektur server backend dengan Node.js dan Express.',
    aliases: ['nodejs', 'node.js', 'express', 'expressjs', 'backend node']
  },
  {
    id: '22222222-2222-4222-8222-222222222206',
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    categoryId: '11111111-1111-4111-8111-111111111102',
    description: 'Prinsip desain antarmuka, user flow, wireframing, usability, dan sistem desain produk digital.',
    aliases: ['ui/ux', 'ui ux', 'ux design', 'ui design', 'desain antarmuka', 'product design']
  },
  {
    id: '22222222-2222-4222-8222-222222222207',
    name: 'Figma',
    slug: 'figma',
    categoryId: '11111111-1111-4111-8111-111111111102',
    description: 'Desain kolaboratif, auto-layout, komponen, design tokens, dan interactive prototyping di Figma.',
    aliases: ['figma design', 'figma prototyping', 'auto layout figma']
  },
  {
    id: '22222222-2222-4222-8222-222222222208',
    name: 'Python',
    slug: 'python',
    categoryId: '11111111-1111-4111-8111-111111111103',
    description: 'Dasar hingga menengah pemrograman Python untuk otomasi, scripting, dan pengolahan data.',
    aliases: ['py', 'python3', 'python dasar']
  },
  {
    id: '22222222-2222-4222-8222-222222222209',
    name: 'SQL & PostgreSQL',
    slug: 'sql-postgresql',
    categoryId: '11111111-1111-4111-8111-111111111103',
    description: 'Pemodelan database relasional, query SQL, join, indexing, dan optimasi di PostgreSQL.',
    aliases: ['sql', 'postgres', 'postgresql', 'database relasional']
  },
  {
    id: '22222222-2222-4222-8222-222222222210',
    name: 'English Conversation',
    slug: 'english-conversation',
    categoryId: '11111111-1111-4111-8111-111111111104',
    description: 'Latihan percakapan bahasa Inggris aktif untuk studi, wawancara, dan kolaborasi internasional.',
    aliases: ['english', 'bahasa inggris', 'speaking english', 'english speaking']
  },
  {
    id: '22222222-2222-4222-8222-222222222211',
    name: 'Public Speaking & Pitching',
    slug: 'public-speaking-pitching',
    categoryId: '11111111-1111-4111-8111-111111111104',
    description: 'Menyusun struktur presentasi, storytelling produk, dan teknik berbicara di depan audiens.',
    aliases: ['public speaking', 'presentasi', 'pitching', 'storytelling']
  },
  {
    id: '22222222-2222-4222-8222-222222222212',
    name: 'Technical Writing',
    slug: 'technical-writing',
    categoryId: '11111111-1111-4111-8111-111111111105',
    description: 'Menulis dokumentasi teknis, README, tutorial, dan spesifikasi produk yang jelas dan terstruktur.',
    aliases: ['dokumentasi teknis', 'tech writing', 'penulisan teknis']
  }
];

/**
 * Demo users aligned with PRD Section 4 (Personas) & Section 24.2 (Demo Plan):
 * - User A: Raka Pratama (Teaches JS, HTML/CSS; Wants UI/UX Design, Figma)
 * - User B: Naya Putri (Teaches UI/UX Design, Figma; Wants JS, HTML/CSS) -> Reciprocal match with Raka!
 * - User C: Dimas Aditya (Teaches HTML/CSS, React; Wants UI/UX Design, Python) -> Reciprocal match with Naya!
 * - User D: Alya Rahma (Teaches Python, SQL & PostgreSQL; Wants React, TypeScript) -> Reciprocal match with Farhan!
 * - User E: Farhan Akbar (Teaches React, TypeScript, Node.js; Wants Python, UI/UX Design) -> One-way only with Raka (to prove one-way matches are excluded!).
 */
export const DEMO_USERS: SeedDemoUser[] = [
  {
    id: '33333333-3333-4333-8333-333333333301',
    email: 'raka@demo.skillloop.id',
    passwordPlain: 'DemoSkillLoop123!',
    displayName: 'Raka Pratama',
    username: 'rakapratama',
    bio: 'Frontend developer mahasiswa yang senang membedah konsep dasar JavaScript dan layout web. Sedang ingin mendalami UI/UX Design dan Figma agar aplikasi yang kubuat lebih nyaman digunakan.',
    timezone: 'Asia/Jakarta',
    languages: [
      { code: 'id', proficiency: 'Native' },
      { code: 'en', proficiency: 'Conversational' }
    ],
    skills: [
      {
        skillSlug: 'javascript',
        role: 'TEACH',
        proficiencyLevel: 'INTERMEDIATE',
        description: 'Bisa membimbing fundamental ES6+, DOM manipulation, async/await, dan problem solving dasar.'
      },
      {
        skillSlug: 'html-css',
        role: 'TEACH',
        proficiencyLevel: 'ADVANCED',
        description: 'Terbiasa membuat layout responsif dengan Flexbox, CSS Grid, dan aksesibilitas web.'
      },
      {
        skillSlug: 'ui-ux-design',
        role: 'LEARN',
        targetLevel: 'INTERMEDIATE',
        description: 'Ingin belajar cara menyusun user flow, hierarchy visual, dan usability heuristics.'
      },
      {
        skillSlug: 'figma',
        role: 'LEARN',
        targetLevel: 'INTERMEDIATE',
        description: 'Ingin lancar menggunakan Auto Layout, komponen, dan membuat wireframe interaktif.'
      }
    ]
  },
  {
    id: '33333333-3333-4333-8333-333333333302',
    email: 'naya@demo.skillloop.id',
    passwordPlain: 'DemoSkillLoop123!',
    displayName: 'Naya Putri',
    username: 'nayaputri',
    bio: 'Product & UI/UX Designer yang sehari-hari merancang sistem desain di Figma. Ingin belajar HTML/CSS dan JavaScript dasar supaya bisa menerjemahkan desain ke kode interaktif.',
    timezone: 'Asia/Jakarta',
    languages: [
      { code: 'id', proficiency: 'Native' },
      { code: 'en', proficiency: 'Fluent' }
    ],
    skills: [
      {
        skillSlug: 'ui-ux-design',
        role: 'TEACH',
        proficiencyLevel: 'ADVANCED',
        description: 'Siap berbagi cara riset pengguna, informasi arsitektur, wireframe, dan evaluasi desain.'
      },
      {
        skillSlug: 'figma',
        role: 'TEACH',
        proficiencyLevel: 'ADVANCED',
        description: 'Bisa mengajarkan Auto Layout, Component Variants, Design Tokens, dan Prototyping.'
      },
      {
        skillSlug: 'javascript',
        role: 'LEARN',
        targetLevel: 'BEGINNER',
        description: 'Ingin memahami logika dasar JavaScript untuk interaksi komponen UI.'
      },
      {
        skillSlug: 'html-css',
        role: 'LEARN',
        targetLevel: 'INTERMEDIATE',
        description: 'Ingin mempraktikkan slicing desain Figma menjadi kode HTML & CSS yang rapi.'
      }
    ]
  },
  {
    id: '33333333-3333-4333-8333-333333333303',
    email: 'dimas@demo.skillloop.id',
    passwordPlain: 'DemoSkillLoop123!',
    displayName: 'Dimas Aditya',
    username: 'dimasaditya',
    bio: 'The Skill Sharer — mahasiswa teknik informatika yang suka mengajar HTML/CSS dan Public Speaking, sedang mencari teman belajar Figma dan English Conversation.',
    timezone: 'Asia/Jakarta',
    languages: [{ code: 'id', proficiency: 'Native' }],
    skills: [
      {
        skillSlug: 'html-css',
        role: 'TEACH',
        proficiencyLevel: 'INTERMEDIATE',
        description: null
      },
      {
        skillSlug: 'public-speaking-pitching',
        role: 'TEACH',
        proficiencyLevel: 'INTERMEDIATE',
        description: null
      },
      {
        skillSlug: 'figma',
        role: 'LEARN',
        targetLevel: 'BEGINNER',
        description: null
      },
      {
        skillSlug: 'english-conversation',
        role: 'LEARN',
        targetLevel: 'INTERMEDIATE',
        description: null
      }
    ]
  },
  {
    id: '33333333-3333-4333-8333-333333333304',
    email: 'alya@demo.skillloop.id',
    passwordPlain: 'DemoSkillLoop123!',
    displayName: 'Alya Rahma',
    username: 'alyarahma',
    bio: 'Data enthusiast yang menguasai Python, SQL, dan English Conversation. Sedang ingin belajar JavaScript dan React untuk membangun dashboard visualisasi data.',
    timezone: 'Asia/Makassar',
    languages: [
      { code: 'id', proficiency: 'Native' },
      { code: 'en', proficiency: 'Fluent' }
    ],
    skills: [
      {
        skillSlug: 'python',
        role: 'TEACH',
        proficiencyLevel: 'ADVANCED',
        description: 'Bisa mengajarkan Python dari nol, data manipulation, dan scripting otomasi.'
      },
      {
        skillSlug: 'sql-postgresql',
        role: 'TEACH',
        proficiencyLevel: 'INTERMEDIATE',
        description: 'Bisa membimbing desain tabel relasional, query JOIN, agregasi, dan indexing.'
      },
      {
        skillSlug: 'english-conversation',
        role: 'TEACH',
        proficiencyLevel: 'ADVANCED',
        description: 'Siap menjadi partner latihan percakapan bahasa Inggris santai maupun profesional.'
      },
      {
        skillSlug: 'javascript',
        role: 'LEARN',
        targetLevel: 'BEGINNER',
        description: null
      },
      {
        skillSlug: 'react',
        role: 'LEARN',
        targetLevel: 'BEGINNER',
        description: null
      }
    ]
  },
  {
    id: '33333333-3333-4333-8333-333333333305',
    email: 'farhan@demo.skillloop.id',
    passwordPlain: 'DemoSkillLoop123!',
    displayName: 'Farhan Akbar',
    username: 'farhanakbar',
    bio: null,
    timezone: 'Asia/Jakarta',
    languages: [{ code: 'id', proficiency: 'Native' }],
    skills: [
      {
        skillSlug: 'react',
        role: 'TEACH',
        proficiencyLevel: 'ADVANCED',
        description: null
      },
      {
        skillSlug: 'typescript',
        role: 'TEACH',
        proficiencyLevel: 'ADVANCED',
        description: null
      },
      {
        skillSlug: 'nodejs-express',
        role: 'TEACH',
        proficiencyLevel: 'INTERMEDIATE',
        description: null
      },
      {
        skillSlug: 'python',
        role: 'LEARN',
        targetLevel: 'INTERMEDIATE',
        description: null
      },
      {
        skillSlug: 'sql-postgresql',
        role: 'LEARN',
        targetLevel: 'ADVANCED',
        description: null
      }
    ]
  }
];
