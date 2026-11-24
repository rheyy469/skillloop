import {
  RequestStatus,
  SessionStatus,
  SkillLevel,
  SkillRole
} from '@skillloop/shared';
import { ApiClientError } from './errors';
import { localFallbackApi, setActiveUserEmail } from './localStore';

export { ApiClientError };

export interface SkillDeclarationDto {
  id: string;
  skillId: string;
  skillName: string;
  skillSlug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  role: SkillRole;
  proficiencyLevel: SkillLevel | null;
  targetLevel: SkillLevel | null;
  description: string | null;
}

export interface OwnProfileDto {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string;
  isAdmin?: boolean;
  languages: string[];
  skills: SkillDeclarationDto[];
  teachSkills: SkillDeclarationDto[];
  learnSkills: SkillDeclarationDto[];
  completeness: {
    score: number;
    missingSteps: string[];
    isComplete: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CatalogSkillDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  aliases: string[];
}

export interface SkillCategoryDto {
  id: string;
  name: string;
  slug: string;
}

export interface MatchedSkillPairDto {
  skillId: string;
  skillName: string;
  skillSlug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  teacherLevel: SkillLevel | null;
  learnerTargetLevel: SkillLevel | null;
  teacherDescription: string | null;
  learnerDescription: string | null;
  skillFit: number;
  levelFit: number;
}

export interface ReciprocalMatchDto {
  user: {
    id: string;
    displayName: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    timezone: string;
    languages: string[];
    profileCompleteness: number;
    teachSkills: SkillDeclarationDto[];
    learnSkills: SkillDeclarationDto[];
  };
  score: {
    algorithmVersion: number;
    aToBScore: number;
    bToAScore: number;
    overallScore: number;
    availabilityFit: number;
    hasAvailabilityData: boolean;
    note: string;
  };
  explanation: {
    summary: string;
    aCanTeachB: MatchedSkillPairDto[];
    bCanTeachA: MatchedSkillPairDto[];
    sharedLanguages: string[];
    reasons: string[];
  };
  existingRequestStatus?: RequestStatus | null;
  existingRequestId?: string | null;
}

export interface CollaborationRequestDto {
  id: string;
  senderId: string;
  recipientId: string;
  offeredSkillId: string | null;
  requestedSkillId: string | null;
  status: RequestStatus;
  introMessage: string | null;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  sender: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    timezone: string;
  };
  recipient: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    timezone: string;
  };
  offeredSkill: { id: string; name: string; slug: string } | null;
  requestedSkill: { id: string; name: string; slug: string } | null;
  sessionsCount: number;
}

export interface LearningSessionDto {
  id: string;
  requestId: string;
  topic: string;
  description: string | null;
  startAt: string;
  timezone: string;
  durationMinutes: number;
  status: SessionStatus;
  proposedBy: string;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  proposer: {
    id: string;
    displayName: string;
  };
  request: {
    id: string;
    senderId: string;
    recipientId: string;
    status: RequestStatus;
    sender: { id: string; displayName: string; timezone: string };
    recipient: { id: string; displayName: string; timezone: string };
    offeredSkill: { id: string; name: string } | null;
    requestedSkill: { id: string; name: string } | null;
  };
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface SessionFeedbackDto {
  id: string;
  sessionId: string;
  reviewerId: string;
  reviewerName?: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface UserReputationDto {
  averageRating: number;
  totalReviews: number;
  completedSessionsCount: number;
  reviews: Array<{
    id: string;
    sessionId: string;
    sessionTopic: string;
    reviewerId: string;
    reviewerName: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
}

export interface LearningMilestoneDto {
  id: string;
  requestId: string;
  userId: string;
  title: string;
  notes: string | null;
  isCompleted: boolean;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettingsDto {
  userId: string;
  notifyNewRequest: boolean;
  notifyRequestAccepted: boolean;
  notifySessionUpdates: boolean;
  notifyNewFeedback: boolean;
  showTimezonePublicly: boolean;
  showPortfolioPublicly: boolean;
  showHistoryPublicly: boolean;
  interfaceLanguage: 'id' | 'en';
}

export interface AdminOverviewDto {
  stats: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    totalSkills: number;
    totalCategories: number;
    totalRequests: number;
    totalSessions: number;
    openReports: number;
  };
  users: Array<{
    id: string;
    email: string;
    displayName: string;
    username: string | null;
    timezone: string;
    isActive: boolean;
    skillsCount: number;
    createdAt: string;
  }>;
  reports: Array<{
    id: string;
    category: string;
    description: string;
    status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
    createdAt: string;
    reviewedAt: string | null;
    reporter: { id: string; displayName: string; email: string };
    reportedUser: {
      id: string;
      displayName: string;
      email: string;
      isActive: boolean;
    };
  }>;
  categories: SkillCategoryDto[];
  skills?: CatalogSkillDto[];
}

export interface DirectMessageDto {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  body: string;
  resourceUrl: string | null;
  readAt: string | null;
  isReported: boolean;
  createdAt: string;
}

export interface MessageThreadDto {
  request: CollaborationRequestDto;
  partner: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    timezone: string;
  };
  messages: DirectMessageDto[];
  unreadCount: number;
}

export interface CommunityGroupDto {
  id: string;
  name: string;
  skillFocus: string;
  categoryName: string;
  description: string;
  meetingLink: string | null;
  scheduleNote: string;
  creatorId: string;
  creatorName: string;
  memberIds: string[];
  membersCount: number;
  createdAt: string;
}

export interface ActivityBucketDto {
  key: string;
  label: string;
  fullLabel: string;
  sessionsCount: number;
  requestsCount: number;
  milestonesCount: number;
  minutes: number;
  totalActivities: number;
}

export interface ActivitySummaryDto {
  daily: ActivityBucketDto[];
  weekly: ActivityBucketDto[];
  monthly: ActivityBucketDto[];
}

export interface DashboardDto {
  profile: OwnProfileDto;
  stats: {
    reciprocalMatchesCount: number;
    incomingPendingCount: number;
    outgoingPendingCount: number;
    activeCollaborationsCount: number;
    upcomingSessionsCount: number;
    completedSessionsCount: number;
    unreadNotificationsCount: number;
    averageRating?: number;
    totalReviews?: number;
  };
  topMatches: ReciprocalMatchDto[];
  recentRequests: CollaborationRequestDto[];
  upcomingSessions: LearningSessionDto[];
  milestones?: LearningMilestoneDto[];
  activitySummary?: ActivitySummaryDto;
}

const viteEnv =
  (
    import.meta as unknown as {
      env?: {
        DEV?: boolean;
        VITE_API_URL?: string;
        VITE_API_BASE_URL?: string;
        VITE_ENABLE_OFFLINE_FALLBACK?: string;
      };
    }
  ).env || {};

function resolveApiBase(): string {
  const raw = (viteEnv.VITE_API_URL || viteEnv.VITE_API_BASE_URL || '').trim();
  if (
    !raw ||
    (typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      raw.includes('localhost'))
  ) {
    return '/api/v1';
  }
  const normalized = raw.replace(/\/+$/, '');
  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
}

const API_BASE = resolveApiBase();
const ALLOW_OFFLINE_FALLBACK =
  Boolean(viteEnv.DEV) || viteEnv.VITE_ENABLE_OFFLINE_FALLBACK === 'true';

const SESSION_TOKEN_STORAGE_KEY = 'skillloop_session_token_v1';

function getStoredSessionToken(): string | null {
  try {
    return typeof window !== 'undefined'
      ? window.localStorage.getItem(SESSION_TOKEN_STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
}

function setStoredSessionToken(token: string | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (token) {
      window.localStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

async function requestJson<T, M = Record<string, unknown>>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; meta: M }> {
  const token = getStoredSessionToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      setStoredSessionToken(null);
    }
    const errObj = body?.error;
    throw new ApiClientError(
      res.status,
      errObj?.code || 'REQUEST_FAILED',
      errObj?.message || 'Terjadi kesalahan saat menghubungi server.',
      errObj?.details || []
    );
  }

  return {
    data: body.data as T,
    meta: (body.meta || {}) as M
  };
}

function isBackendOfflineError(err: unknown): boolean {
  if (!(err instanceof ApiClientError)) {
    return true;
  }
  return (
    err.code === 'BACKEND_OFFLINE' ||
    err.status === 502 ||
    err.status === 503 ||
    err.status === 504
  );
}

async function withFallback<T, M = Record<string, unknown>>(
  fn: () => Promise<{ data: T; meta: M }>,
  fallbackFn: () => { data: T; meta: M }
): Promise<{ data: T; meta: M }> {
  try {
    return await fn();
  } catch (err) {
    if (ALLOW_OFFLINE_FALLBACK && isBackendOfflineError(err)) {
      return fallbackFn();
    }
    throw err;
  }
}

export const api = {
  auth: {
    me: () =>
      withFallback(
        () => requestJson<OwnProfileDto>('/auth/me'),
        () => ({ data: localFallbackApi.getCurrentUser(), meta: {} })
      ),
    login: (payload: { email: string; password: string }) =>
      withFallback(
        async () => {
          const res = await requestJson<OwnProfileDto, { sessionToken?: string }>(
            '/auth/login',
            {
              method: 'POST',
              body: JSON.stringify(payload)
            }
          );
          if (res.meta?.sessionToken) {
            setStoredSessionToken(res.meta.sessionToken);
          }
          setActiveUserEmail(res.data.email);
          localFallbackApi.clearLoggedOut();
          return res;
        },
        () => ({ data: localFallbackApi.login(payload.email, payload.password), meta: {} })
      ),
    register: (payload: {
      email: string;
      password: string;
      displayName: string;
      timezone?: string;
      languages?: string[];
    }) =>
      withFallback(
        async () => {
          const res = await requestJson<OwnProfileDto, { sessionToken?: string }>(
            '/auth/register',
            {
              method: 'POST',
              body: JSON.stringify(payload)
            }
          );
          if (res.meta?.sessionToken) {
            setStoredSessionToken(res.meta.sessionToken);
          }
          setActiveUserEmail(res.data.email);
          localFallbackApi.clearLoggedOut();
          return res;
        },
        () => ({ data: localFallbackApi.register(payload), meta: {} })
      ),
    logout: () =>
      withFallback(
        async () => {
          const res = await requestJson<{ loggedOut: boolean }>('/auth/logout', {
            method: 'POST'
          });
          setStoredSessionToken(null);
          localFallbackApi.logout();
          return res;
        },
        () => {
          setStoredSessionToken(null);
          localFallbackApi.logout();
          return { data: { loggedOut: true }, meta: {} };
        }
      ),
    changePassword: (payload: {
      currentPassword: string;
      newPassword: string;
    }) =>
      withFallback(
        () =>
          requestJson<{ updated: boolean }>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: { updated: true }, meta: {} })
      )
  },

  profile: {
    getMe: () =>
      withFallback(
        () => requestJson<OwnProfileDto>('/profile/me'),
        () => ({ data: localFallbackApi.getCurrentUser(), meta: {} })
      ),
    updateMe: (payload: {
      displayName?: string;
      username?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      timezone?: string;
      languages?: string[];
    }) =>
      withFallback(
        () =>
          requestJson<OwnProfileDto>('/profile/me', {
            method: 'PATCH',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.updateProfile(payload), meta: {} })
      )
  },

  skills: {
    catalog: (params?: { q?: string; category?: string }) => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set('q', params.q);
      if (params?.category) qs.set('category', params.category);
      const queryStr = qs.toString() ? `?${qs.toString()}` : '';
      return withFallback(
        () =>
          requestJson<
            CatalogSkillDto[],
            { total: number; categories: SkillCategoryDto[] }
          >(`/skills${queryStr}`),
        () => localFallbackApi.getCatalog(params)
      );
    },
    getMine: () =>
      withFallback(
        () =>
          requestJson<{
            all: SkillDeclarationDto[];
            teach: SkillDeclarationDto[];
            learn: SkillDeclarationDto[];
          }>('/skills/me'),
        () => ({ data: localFallbackApi.getMySkills(), meta: {} })
      ),
    addMine: (payload: {
      skillId: string;
      role: SkillRole;
      proficiencyLevel?: SkillLevel | null;
      targetLevel?: SkillLevel | null;
      description?: string | null;
    }) =>
      withFallback(
        () =>
          requestJson<SkillDeclarationDto>('/skills/me', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.addSkill(payload), meta: {} })
      ),
    updateMine: (
      userSkillId: string,
      payload: {
        proficiencyLevel?: SkillLevel | null;
        targetLevel?: SkillLevel | null;
        description?: string | null;
      }
    ) =>
      withFallback(
        () =>
          requestJson<SkillDeclarationDto>(`/skills/me/${userSkillId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.getMySkills().all[0], meta: {} })
      ),
    deleteMine: (userSkillId: string) =>
      withFallback(
        () =>
          requestJson<{ deleted: boolean }>(`/skills/me/${userSkillId}`, {
            method: 'DELETE'
          }),
        () => ({ data: localFallbackApi.deleteSkill(userSkillId), meta: {} })
      )
  },

  matches: {
    list: (params?: {
      category?: string;
      language?: string;
      level?: string;
      availability?: string;
      minScore?: number;
      sortBy?: string;
      search?: string;
    }) => {
      const qs = new URLSearchParams();
      if (params?.category) qs.set('category', params.category);
      if (params?.language) qs.set('language', params.language);
      if (params?.level) qs.set('level', params.level);
      if (params?.availability) qs.set('availability', params.availability);
      if (params?.minScore) qs.set('minScore', String(params.minScore));
      if (params?.sortBy) qs.set('sortBy', params.sortBy);
      if (params?.search) qs.set('search', params.search);
      const queryStr = qs.toString() ? `?${qs.toString()}` : '';
      return withFallback(
        () =>
          requestJson<
            ReciprocalMatchDto[],
            { page: number; limit: number; total: number; totalPages: number }
          >(`/matches${queryStr}`),
        () => localFallbackApi.listMatches(params)
      );
    },
    detail: (userId: string) =>
      withFallback(
        () => requestJson<ReciprocalMatchDto>(`/matches/${userId}`),
        () => ({ data: localFallbackApi.getMatchDetail(userId), meta: {} })
      )
  },

  requests: {
    list: (params?: { direction?: 'incoming' | 'outgoing' | 'all'; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.direction) qs.set('direction', params.direction);
      if (params?.status) qs.set('status', params.status);
      const queryStr = qs.toString() ? `?${qs.toString()}` : '';
      return withFallback(
        () => requestJson<CollaborationRequestDto[]>(`/requests${queryStr}`),
        () => ({ data: localFallbackApi.listRequests(params), meta: {} })
      );
    },
    create: (payload: {
      recipientId: string;
      offeredSkillId?: string | null;
      requestedSkillId?: string | null;
      introMessage?: string | null;
    }) =>
      withFallback(
        () =>
          requestJson<CollaborationRequestDto>('/requests', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.createRequest(payload), meta: {} })
      ),
    updateStatus: (
      requestId: string,
      action: 'ACCEPT' | 'REJECT' | 'CANCEL' | 'COUNTER',
      counterDetails?: {
        offeredSkillId?: string | null;
        requestedSkillId?: string | null;
        introMessage?: string | null;
      }
    ) =>
      withFallback(
        () =>
          requestJson<CollaborationRequestDto>(`/requests/${requestId}`, {
            method: 'PATCH',
            body: JSON.stringify({ action, ...(counterDetails || {}) })
          }),
        () => ({
          data: localFallbackApi.updateRequestStatus(requestId, action, counterDetails),
          meta: {}
        })
      )
  },

  sessions: {
    list: (status?: string) => {
      const queryStr = status ? `?status=${encodeURIComponent(status)}` : '';
      return withFallback(
        () => requestJson<LearningSessionDto[]>(`/sessions${queryStr}`),
        () => ({ data: localFallbackApi.listSessions(status), meta: {} })
      );
    },
    create: (payload: {
      requestId: string;
      topic: string;
      description?: string | null;
      startAt: string;
      timezone: string;
      durationMinutes: number;
    }) =>
      withFallback(
        () =>
          requestJson<LearningSessionDto>('/sessions', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.createSession(payload), meta: {} })
      ),
    update: (
      sessionId: string,
      payload: {
        action: 'CONFIRM' | 'RESCHEDULE' | 'COMPLETE' | 'CANCEL';
        startAt?: string;
        timezone?: string;
        durationMinutes?: number;
        topic?: string;
        description?: string | null;
        cancelReason?: string | null;
      }
    ) =>
      withFallback(
        () =>
          requestJson<LearningSessionDto>(`/sessions/${sessionId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.updateSession(sessionId, payload), meta: {} })
      ),
    listFeedback: (sessionId: string) =>
      withFallback(
        () => requestJson<SessionFeedbackDto[]>(`/sessions/${sessionId}/feedback`),
        () => ({ data: localFallbackApi.listSessionFeedback(sessionId), meta: {} })
      ),
    submitFeedback: (
      sessionId: string,
      payload: { rating: number; comment: string }
    ) =>
      withFallback(
        () =>
          requestJson<SessionFeedbackDto>(`/sessions/${sessionId}/feedback`, {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.submitFeedback(sessionId, payload), meta: {} })
      )
  },

  reputation: {
    getForUser: (userId: string) =>
      withFallback(
        () => requestJson<UserReputationDto>(`/reputation/${userId}`),
        () => ({ data: localFallbackApi.getReputation(userId), meta: {} })
      )
  },

  progress: {
    list: () =>
      withFallback(
        () => requestJson<LearningMilestoneDto[]>('/progress'),
        () => ({ data: localFallbackApi.listMilestones(), meta: {} })
      ),
    create: (payload: {
      requestId: string;
      title: string;
      notes?: string | null;
      progressPercent?: number;
    }) =>
      withFallback(
        () =>
          requestJson<LearningMilestoneDto>('/progress', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.createMilestone(payload), meta: {} })
      ),
    update: (
      milestoneId: string,
      payload: {
        title?: string;
        notes?: string | null;
        isCompleted?: boolean;
        progressPercent?: number;
      }
    ) =>
      withFallback(
        () =>
          requestJson<LearningMilestoneDto>(`/progress/${milestoneId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.updateMilestone(milestoneId, payload), meta: {} })
      ),
    delete: (milestoneId: string) =>
      withFallback(
        () =>
          requestJson<{ deleted: boolean }>(`/progress/${milestoneId}`, {
            method: 'DELETE'
          }),
        () => ({ data: localFallbackApi.deleteMilestone(milestoneId), meta: {} })
      )
  },

  settings: {
    getMe: () =>
      withFallback(
        () => requestJson<UserSettingsDto>('/settings/me'),
        () => ({ data: localFallbackApi.getSettings(), meta: {} })
      ),
    updateMe: (payload: Partial<Omit<UserSettingsDto, 'userId'>>) =>
      withFallback(
        () =>
          requestJson<UserSettingsDto>('/settings/me', {
            method: 'PATCH',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.updateSettings(payload), meta: {} })
      )
  },

  admin: {
    overview: () =>
      withFallback(
        () => requestJson<AdminOverviewDto>('/admin/overview'),
        () => ({ data: localFallbackApi.getAdminOverview(), meta: {} })
      ),
    updateReport: (
      reportId: string,
      status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'
    ) =>
      withFallback(
        () =>
          requestJson<{ id: string; status: string }>(`/admin/reports/${reportId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
          }),
        () => ({ data: localFallbackApi.updateAdminReport(reportId, status), meta: {} })
      ),
    setUserStatus: (userId: string, isActive: boolean) =>
      withFallback(
        () =>
          requestJson<{ id: string; displayName: string; isActive: boolean }>(
            `/admin/users/${userId}/status`,
            {
              method: 'PATCH',
              body: JSON.stringify({ isActive })
            }
          ),
        () => ({ data: localFallbackApi.setAdminUserStatus(userId, isActive), meta: {} })
      ),
    createSkill: (payload: {
      name: string;
      categoryId: string;
      description: string;
      aliases?: string[];
    }) =>
      withFallback(
        () =>
          requestJson<CatalogSkillDto>('/admin/skills', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.createAdminSkill(payload), meta: {} })
      ),
    deleteSkill: (skillId: string) =>
      withFallback(
        () =>
          requestJson<{ deleted: boolean; id: string }>(
            `/admin/skills/${encodeURIComponent(skillId)}`,
            {
              method: 'DELETE'
            }
          ),
        () => ({ data: localFallbackApi.deleteAdminSkill(skillId), meta: {} })
      )
  },

  notifications: {
    list: () =>
      withFallback(
        () =>
          requestJson<NotificationDto[], { total: number; unreadCount: number }>(
            '/notifications'
          ),
        () => localFallbackApi.listNotifications()
      ),
    markRead: (id: string) =>
      withFallback(
        () =>
          requestJson<NotificationDto>(`/notifications/${id}/read`, {
            method: 'PATCH'
          }),
        () => ({ data: localFallbackApi.markNotificationRead(id), meta: {} })
      ),
    markAllRead: () =>
      withFallback(
        () =>
          requestJson<{ updatedCount: number }>('/notifications/read-all', {
            method: 'PATCH'
          }),
        () => ({ data: localFallbackApi.markAllNotificationsRead(), meta: {} })
      )
  },

  safety: {
    listBlocks: () =>
      withFallback(
        () =>
          requestJson<
            Array<{
              id: string;
              blockedId: string;
              createdAt: string;
              blockedUser: { id: string; displayName: string; username: string | null };
            }>
          >('/blocks'),
        () => ({ data: localFallbackApi.listBlocks(), meta: {} })
      ),
    blockUser: (userId: string) =>
      withFallback(
        () =>
          requestJson<{ id: string }>('/blocks', {
            method: 'POST',
            body: JSON.stringify({ userId })
          }),
        () => ({ data: localFallbackApi.blockUser(userId), meta: {} })
      ),
    unblockUser: (userId: string) =>
      withFallback(
        () =>
          requestJson<{ unblocked: boolean }>(`/blocks/${userId}`, {
            method: 'DELETE'
          }),
        () => ({ data: localFallbackApi.unblockUser(userId), meta: {} })
      ),
    reportUser: (payload: {
      reportedUserId: string;
      category: string;
      description: string;
    }) =>
      withFallback(
        () =>
          requestJson<{ id: string; status: string }>('/reports', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.reportUser(payload), meta: {} })
      )
  },

  messages: {
    listThreads: () =>
      withFallback(
        () => requestJson<MessageThreadDto[]>('/messages'),
        () => ({ data: localFallbackApi.listMessageThreads(), meta: {} })
      ),
    send: (payload: {
      requestId: string;
      body: string;
      resourceUrl?: string | null;
    }) =>
      withFallback(
        () =>
          requestJson<DirectMessageDto>('/messages', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.sendMessage(payload), meta: {} })
      ),
    markThreadRead: (requestId: string) =>
      withFallback(
        () =>
          requestJson<{ updatedCount: number }>(`/messages/${requestId}/read`, {
            method: 'PATCH'
          }),
        () => ({ data: localFallbackApi.markThreadRead(requestId), meta: {} })
      ),
    reportMessage: (messageId: string, reason?: string) =>
      withFallback(
        () =>
          requestJson<DirectMessageDto>(`/messages/${messageId}/report`, {
            method: 'POST',
            body: JSON.stringify({ reason })
          }),
        () => ({
          data: localFallbackApi.listMessageThreads()[0]?.messages[0],
          meta: {}
        })
      )
  },

  groups: {
    list: () =>
      withFallback(
        () => requestJson<CommunityGroupDto[]>('/groups'),
        () => ({ data: localFallbackApi.listGroups(), meta: {} })
      ),
    create: (payload: {
      name: string;
      skillFocus: string;
      categoryName?: string;
      description: string;
      meetingLink?: string | null;
      scheduleNote: string;
    }) =>
      withFallback(
        () =>
          requestJson<CommunityGroupDto>('/groups', {
            method: 'POST',
            body: JSON.stringify(payload)
          }),
        () => ({ data: localFallbackApi.createGroup(payload), meta: {} })
      ),
    toggleJoin: (groupId: string) =>
      withFallback(
        () =>
          requestJson<CommunityGroupDto>(`/groups/${groupId}/toggle-join`, {
            method: 'POST'
          }),
        () => ({ data: localFallbackApi.toggleJoinGroup(groupId), meta: {} })
      )
  },

  dashboard: {
    get: () =>
      withFallback(
        () => requestJson<DashboardDto>('/dashboard'),
        () => ({ data: localFallbackApi.getDashboard(), meta: {} })
      )
  }
};
