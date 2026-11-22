import { z } from 'zod';

export const uuidParamSchema = z.string().uuid('Format ID tidak valid.');

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Format alamat email tidak valid.')
    .max(120, 'Email terlalu panjang.'),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter.')
    .max(100, 'Password maksimal 100 karakter.'),
  displayName: z
    .string()
    .trim()
    .min(2, 'Nama tampilan minimal 2 karakter.')
    .max(80, 'Nama tampilan maksimal 80 karakter.'),
  timezone: z.string().trim().min(2).max(64).optional().default('Asia/Jakarta'),
  languages: z.array(z.string().trim().min(2).max(10)).max(10).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('Format alamat email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.')
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Nama tampilan minimal 2 karakter.')
    .max(80, 'Nama tampilan maksimal 80 karakter.')
    .optional(),
  username: z
    .string()
    .trim()
    .regex(
      /^[a-zA-Z0-9_.-]{3,30}$/,
      'Username hanya boleh berisi huruf, angka, titik, garis bawah, atau strip (3-30 karakter).'
    )
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio maksimal 500 karakter.')
    .nullable()
    .optional(),
  avatarUrl: z
    .string()
    .trim()
    .max(300)
    .refine(
      (val) => /^avatar:\d{1,2}$/.test(val) || /^https?:\/\/.+/.test(val),
      'Format URL atau preset avatar tidak valid.'
    )
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  timezone: z.string().trim().min(2).max(64).optional(),
  languages: z
    .array(z.string().trim().min(2).max(10))
    .min(1, 'Pilih minimal 1 bahasa komunikasi.')
    .max(10)
    .optional()
});

export const skillRoleEnum = z.enum(['TEACH', 'LEARN']);
export const skillLevelEnum = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const addUserSkillSchema = z.object({
  skillId: z.string().uuid('ID skill tidak valid.'),
  role: skillRoleEnum,
  proficiencyLevel: skillLevelEnum.nullable().optional(),
  targetLevel: skillLevelEnum.nullable().optional(),
  description: z
    .string()
    .trim()
    .max(300, 'Deskripsi pengalaman/tujuan maksimal 300 karakter.')
    .nullable()
    .optional()
});

export const updateUserSkillSchema = z.object({
  proficiencyLevel: skillLevelEnum.nullable().optional(),
  targetLevel: skillLevelEnum.nullable().optional(),
  description: z
    .string()
    .trim()
    .max(300, 'Deskripsi pengalaman/tujuan maksimal 300 karakter.')
    .nullable()
    .optional()
});

export const createRequestSchema = z.object({
  recipientId: z.string().uuid('ID penerima tidak valid.'),
  offeredSkillId: z.string().uuid().nullable().optional(),
  requestedSkillId: z.string().uuid().nullable().optional(),
  introMessage: z
    .string()
    .trim()
    .max(500, 'Pesan pengantar maksimal 500 karakter.')
    .nullable()
    .optional()
});

export const updateRequestSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT', 'CANCEL', 'COUNTER']),
  offeredSkillId: z.string().uuid().nullable().optional(),
  requestedSkillId: z.string().uuid().nullable().optional(),
  introMessage: z
    .string()
    .trim()
    .max(500, 'Detail kesepakatan/proposal maksimal 500 karakter.')
    .nullable()
    .optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi.'),
  newPassword: z
    .string()
    .min(8, 'Password baru minimal 8 karakter.')
    .max(100, 'Password baru maksimal 100 karakter.')
});

export const createSessionSchema = z.object({
  requestId: z.string().uuid('ID permintaan kolaborasi tidak valid.'),
  topic: z
    .string()
    .trim()
    .min(3, 'Topik sesi minimal 3 karakter.')
    .max(120, 'Topik sesi maksimal 120 karakter.'),
  description: z
    .string()
    .trim()
    .max(500, 'Deskripsi/tujuan sesi maksimal 500 karakter.')
    .nullable()
    .optional(),
  startAt: z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Format waktu mulai tidak valid (gunakan ISO-8601).'
  }),
  timezone: z.string().trim().min(2).max(64).default('Asia/Jakarta'),
  durationMinutes: z
    .number()
    .int()
    .min(15, 'Durasi minimal 15 menit.')
    .max(240, 'Durasi maksimal 240 menit.')
    .default(60)
});

export const updateSessionSchema = z.object({
  action: z.enum(['CONFIRM', 'RESCHEDULE', 'COMPLETE', 'CANCEL']),
  topic: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  startAt: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Format waktu mulai tidak valid.'
    })
    .optional(),
  timezone: z.string().trim().min(2).max(64).optional(),
  durationMinutes: z.number().int().min(15).max(240).optional(),
  cancelReason: z.string().trim().max(300).nullable().optional()
});

export const createBlockSchema = z.object({
  userId: z.string().uuid('ID pengguna tidak valid.')
});

export const createReportSchema = z.object({
  reportedUserId: z.string().uuid('ID pengguna yang dilaporkan tidak valid.'),
  category: z.string().trim().min(2).max(60),
  description: z
    .string()
    .trim()
    .min(10, 'Deskripsi laporan minimal 10 karakter.')
    .max(1000, 'Deskripsi laporan maksimal 1000 karakter.')
});

export const createFeedbackSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating minimal 1 bintang.')
    .max(5, 'Rating maksimal 5 bintang.'),
  comment: z
    .string()
    .trim()
    .min(3, 'Ulasan minimal 3 karakter.')
    .max(500, 'Ulasan maksimal 500 karakter.')
});

export const createMilestoneSchema = z.object({
  requestId: z.string().uuid('ID exchange request tidak valid.'),
  title: z
    .string()
    .trim()
    .min(3, 'Judul milestone minimal 3 karakter.')
    .max(120, 'Judul milestone maksimal 120 karakter.'),
  notes: z.string().trim().max(500).nullable().optional(),
  progressPercent: z.number().int().min(0).max(100).default(25)
});

export const updateMilestoneSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  isCompleted: z.boolean().optional(),
  progressPercent: z.number().int().min(0).max(100).optional()
});

export const updateSettingsSchema = z.object({
  notifyNewRequest: z.boolean().optional(),
  notifyRequestAccepted: z.boolean().optional(),
  notifySessionUpdates: z.boolean().optional(),
  notifyNewFeedback: z.boolean().optional(),
  showTimezonePublicly: z.boolean().optional(),
  showPortfolioPublicly: z.boolean().optional(),
  showHistoryPublicly: z.boolean().optional(),
  interfaceLanguage: z.enum(['id', 'en']).optional()
});

export const adminReportUpdateSchema = z.object({
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'])
});

export const adminUserStatusSchema = z.object({
  isActive: z.boolean()
});

export const adminCreateSkillSchema = z.object({
  name: z.string().trim().min(2).max(80),
  categoryId: z.string().uuid('ID kategori tidak valid.'),
  description: z.string().trim().min(5).max(300),
  aliases: z.array(z.string().trim().min(1).max(50)).max(10).optional().default([])
});

export const createMessageSchema = z.object({
  requestId: z.string().uuid('ID exchange request tidak valid.'),
  body: z
    .string()
    .trim()
    .min(1, 'Isi pesan tidak boleh kosong.')
    .max(1000, 'Pesan maksimal 1000 karakter.'),
  resourceUrl: z
    .string()
    .trim()
    .max(300, 'Tautan materi maksimal 300 karakter.')
    .nullable()
    .optional()
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(3).max(100),
  skillFocus: z.string().trim().min(3).max(120),
  categoryName: z.string().trim().min(2).max(80).default('Peer Learning Group'),
  description: z.string().trim().min(5).max(400),
  meetingLink: z.string().trim().max(250).nullable().optional(),
  scheduleNote: z.string().trim().min(3).max(120)
});
