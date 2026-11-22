export type SkillRole = 'TEACH' | 'LEARN';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type SessionStatus = 'PROPOSED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

export const SKILL_LEVEL_LABELS: Record<SkillLevel, { label: string; helper: string }> = {
  BEGINNER: {
    label: 'Beginner',
    helper: 'Memahami dasar dan masih perlu panduan (bukan sertifikasi formal)'
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    helper: 'Mampu menerapkan skill dalam tugas atau proyek umum'
  },
  ADVANCED: {
    label: 'Advanced',
    helper: 'Pengalaman lebih luas dan mampu menangani kasus lebih kompleks'
  }
};

export const SUPPORTED_LANGUAGES = [
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'en', name: 'English' },
  { code: 'jv', name: 'Basa Jawa' },
  { code: 'su', name: 'Basa Sunda' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Mandarin (中文)' }
] as const;

export const COMMON_TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Tokyo',
  'UTC',
  'Europe/London',
  'America/New_York'
] as const;

export const REPORT_CATEGORIES = [
  { value: 'HARASSMENT', label: 'Pelecehan atau perilaku tidak sopan' },
  { value: 'SPAM_COMMERCIAL', label: 'Spam, promosi berbayar, atau penipuan' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Konten profil atau pesan tidak pantas' },
  { value: 'MISLEADING_PROFILE', label: 'Profil palsu atau menyesatkan' },
  { value: 'SAFETY_CONCERN', label: 'Kekhawatiran keselamatan lainnya' }
] as const;

export interface ApiResponse<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[];
  };
}
