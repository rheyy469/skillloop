import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { repository } from '../lib/repository.js';
import { resolveStorageMode } from '../lib/store.js';
import {
  clearSessionCookie,
  issueSessionCookie,
  requireAuth
} from '../middleware/auth.middleware.js';
import {
  evaluateReciprocalMatch,
  ReciprocalMatchResult
} from '../services/matching.service.js';
import { AppError, sendSuccess } from '../utils/errors.js';
import {
  serializeUserSkill,
  toMatchableUser,
  toOwnProfileDto,
  toPublicProfileDto
} from '../utils/serializers.js';
import {
  addUserSkillSchema,
  adminCreateSkillSchema,
  adminReportUpdateSchema,
  adminUserStatusSchema,
  changePasswordSchema,
  createBlockSchema,
  createFeedbackSchema,
  createGroupSchema,
  createMessageSchema,
  createMilestoneSchema,
  createReportSchema,
  createRequestSchema,
  createSessionSchema,
  loginSchema,
  registerSchema,
  updateMilestoneSchema,
  updateProfileSchema,
  updateRequestSchema,
  updateSessionSchema,
  updateSettingsSchema,
  updateUserSkillSchema,
  uuidParamSchema
} from '../validators/schemas.js';
import { RequestStatus, SessionStatus } from '@skillloop/shared';

export const apiRouter = Router();

const isTestEnv = process.env.NODE_ENV === 'test';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Terlalu banyak percobaan autentikasi. Silakan coba lagi beberapa saat.',
      details: []
    }
  }
});

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// ============================================================================
// Health Check
// ============================================================================
apiRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    const storageMode = await resolveStorageMode();
    sendSuccess(res, {
      status: 'ok',
      service: 'skillloop-api',
      storageMode,
      timestamp: new Date().toISOString()
    });
  })
);

// ============================================================================
// Authentication (FR-001)
// ============================================================================
apiRouter.post(
  '/auth/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.parse(req.body);
    const existing = await repository.findUserByEmail(parsed.email);
    if (existing) {
      throw new AppError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'Alamat email ini sudah digunakan. Silakan login atau gunakan email lain.'
      );
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const user = await repository.createUser({
      email: parsed.email,
      passwordHash,
      displayName: parsed.displayName,
      timezone: parsed.timezone,
      languages: parsed.languages
    });

    await issueSessionCookie(res, user.id, req);
    const fullProfile = await repository.getFullUserProfile(user.id);
    sendSuccess(res, toOwnProfileDto(fullProfile!), 201);
  })
);

apiRouter.post(
  '/auth/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.parse(req.body);
    const user = await repository.findUserByEmail(parsed.email);
    if (!user || !user.isActive) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Email atau password yang kamu masukkan tidak sesuai.'
      );
    }

    const passwordValid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Email atau password yang kamu masukkan tidak sesuai.'
      );
    }

    await issueSessionCookie(res, user.id, req);
    const fullProfile = await repository.getFullUserProfile(user.id);
    sendSuccess(res, toOwnProfileDto(fullProfile!));
  })
);

apiRouter.post(
  '/auth/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.sessionTokenHash) {
      await repository.deleteSession(req.sessionTokenHash);
    }
    clearSessionCookie(res, req);
    sendSuccess(res, { loggedOut: true });
  })
);

apiRouter.get(
  '/auth/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await repository.getFullUserProfile(req.user!.id);
    if (!profile) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Profil pengguna tidak ditemukan.');
    }
    sendSuccess(res, toOwnProfileDto(profile));
  })
);

apiRouter.post(
  '/auth/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.parse(req.body);
    const user = await repository.findUserById(req.user!.id);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }
    const valid = await bcrypt.compare(parsed.currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError(
        401,
        'INVALID_CURRENT_PASSWORD',
        'Password saat ini tidak sesuai.'
      );
    }
    const newHash = await bcrypt.hash(parsed.newPassword, 10);
    await repository.updateUserPassword(user.id, newHash);
    sendSuccess(res, { updated: true });
  })
);

// ============================================================================
// Profile (FR-002, FR-005)
// ============================================================================
apiRouter.get(
  '/profile/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await repository.getFullUserProfile(req.user!.id);
    if (!profile) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Profil pengguna tidak ditemukan.');
    }
    sendSuccess(res, toOwnProfileDto(profile));
  })
);

apiRouter.patch(
  '/profile/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = updateProfileSchema.parse(req.body);
    const updated = await repository.updateUserProfile(req.user!.id, parsed);
    sendSuccess(res, toOwnProfileDto(updated));
  })
);

apiRouter.get(
  '/users/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = uuidParamSchema.parse(req.params.userId);
    const blockedIds = await repository.getBlockedUserIdsFor(req.user!.id);
    if (blockedIds.has(targetUserId)) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Profil pengguna tidak tersedia.');
    }

    const profile = await repository.getFullUserProfile(targetUserId);
    if (!profile || !profile.isActive) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Profil pengguna tidak ditemukan.');
    }
    sendSuccess(res, toPublicProfileDto(profile));
  })
);

// ============================================================================
// Skill Catalog & User Skill Declarations (FR-003, FR-004)
// ============================================================================
apiRouter.get(
  '/skills',
  requireAuth,
  asyncHandler(async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : undefined;
    const categorySlug =
      typeof req.query.category === 'string' ? req.query.category : undefined;

    const [skills, categories] = await Promise.all([
      repository.searchSkills({ query, categorySlug }),
      repository.listSkillCategories()
    ]);

    sendSuccess(
      res,
      skills.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        category: s.category,
        aliases: s.aliases.map((a) => a.alias)
      })),
      200,
      {
        total: skills.length,
        categories
      }
    );
  })
);

apiRouter.get(
  '/skills/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await repository.listUserSkills(req.user!.id);
    const serialized = list.map(serializeUserSkill);
    sendSuccess(res, {
      all: serialized,
      teach: serialized.filter((s) => s.role === 'TEACH'),
      learn: serialized.filter((s) => s.role === 'LEARN')
    });
  })
);

apiRouter.post(
  '/skills/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = addUserSkillSchema.parse(req.body);
    const created = await repository.addUserSkill(req.user!.id, parsed);
    sendSuccess(res, serializeUserSkill(created), 201);
  })
);

apiRouter.patch(
  '/skills/me/:userSkillId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userSkillId = uuidParamSchema.parse(req.params.userSkillId);
    const parsed = updateUserSkillSchema.parse(req.body);
    const updated = await repository.updateUserSkill(
      req.user!.id,
      userSkillId,
      parsed
    );
    sendSuccess(res, serializeUserSkill(updated));
  })
);

apiRouter.delete(
  '/skills/me/:userSkillId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userSkillId = uuidParamSchema.parse(req.params.userSkillId);
    await repository.deleteUserSkill(req.user!.id, userSkillId);
    sendSuccess(res, { deleted: true });
  })
);

// ============================================================================
// Reciprocal Matching & Discovery (FR-006, FR-007, FR-008)
// ============================================================================
async function computeMatchesForUser(userId: string): Promise<ReciprocalMatchResult[]> {
  const [meProfile, allUsers, blockedIds, myRequests] = await Promise.all([
    repository.getFullUserProfile(userId),
    repository.getAllActiveUsersWithSkills(),
    repository.getBlockedUserIdsFor(userId),
    repository.listUserRequests(userId, { direction: 'all' })
  ]);

  if (!meProfile) {
    throw new AppError(404, 'USER_NOT_FOUND', 'Profil pengguna tidak ditemukan.');
  }

  const meMatchable = toMatchableUser(meProfile);
  const results: ReciprocalMatchResult[] = [];

  for (const candidateProfile of allUsers) {
    if (candidateProfile.id === userId) continue;
    const candidateMatchable = toMatchableUser(candidateProfile);
    const match = evaluateReciprocalMatch(meMatchable, candidateMatchable, blockedIds);
    if (!match) continue;

    // Attach latest active request status if any exists between the two users
    const existingReq = myRequests.find(
      (r) =>
        (r.senderId === userId && r.recipientId === candidateProfile.id) ||
        (r.senderId === candidateProfile.id && r.recipientId === userId)
    );
    if (existingReq) {
      match.existingRequestStatus = existingReq.status;
      match.existingRequestId = existingReq.id;
    }

    results.push(match);
  }

  // Sort per PRD 9.5: 1) Overall score desc, 2) Profile completeness desc
  results.sort((a, b) => {
    if (b.score.overallScore !== a.score.overallScore) {
      return b.score.overallScore - a.score.overallScore;
    }
    return b.user.profileCompleteness - a.user.profileCompleteness;
  });

  return results;
}

apiRouter.get(
  '/matches',
  requireAuth,
  asyncHandler(async (req, res) => {
    const categorySlug =
      typeof req.query.category === 'string' && req.query.category.trim()
        ? req.query.category.trim()
        : undefined;
    const language =
      typeof req.query.language === 'string' && req.query.language.trim()
        ? req.query.language.trim().toLowerCase()
        : undefined;
    const level =
      typeof req.query.level === 'string' && req.query.level.trim()
        ? req.query.level.trim().toUpperCase()
        : undefined;
    const search =
      typeof req.query.search === 'string' && req.query.search.trim()
        ? req.query.search.trim().toLowerCase()
        : undefined;
    const availability =
      typeof req.query.availability === 'string' && req.query.availability.trim()
        ? req.query.availability.trim().toLowerCase()
        : undefined;

    const minScore =
      typeof req.query.minScore === 'string' && !Number.isNaN(Number(req.query.minScore))
        ? Number(req.query.minScore)
        : undefined;
    const sortBy =
      typeof req.query.sortBy === 'string' && req.query.sortBy.trim()
        ? req.query.sortBy.trim()
        : 'overall';

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    let matches = await computeMatchesForUser(req.user!.id);

    if (categorySlug) {
      matches = matches.filter(
        (m) =>
          m.explanation.bCanTeachA.some((s) => s.categorySlug === categorySlug) ||
          m.explanation.aCanTeachB.some((s) => s.categorySlug === categorySlug)
      );
    }

    if (language) {
      matches = matches.filter((m) => m.user.languages.includes(language));
    }

    if (level && ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level)) {
      matches = matches.filter((m) =>
        m.explanation.bCanTeachA.some((s) => s.teacherLevel === level)
      );
    }

    if (availability === 'compatible') {
      matches = matches.filter((m) => m.score.availabilityFit >= 80);
    } else if (availability === 'same_timezone') {
      const meProfile = await repository.getFullUserProfile(req.user!.id);
      const myTz = meProfile?.timezone;
      if (myTz) {
        matches = matches.filter((m) => m.user.timezone === myTz);
      }
    }

    if (minScore !== undefined && minScore > 0) {
      matches = matches.filter((m) => m.score.overallScore >= minScore);
    }

    if (sortBy === 'availability') {
      matches.sort((a, b) => b.score.availabilityFit - a.score.availabilityFit);
    } else if (sortBy === 'completeness') {
      matches.sort((a, b) => b.user.profileCompleteness - a.user.profileCompleteness);
    }

    if (search) {
      matches = matches.filter(
        (m) =>
          m.user.displayName.toLowerCase().includes(search) ||
          m.explanation.bCanTeachA.some((s) =>
            s.skillName.toLowerCase().includes(search)
          ) ||
          m.explanation.aCanTeachB.some((s) =>
            s.skillName.toLowerCase().includes(search)
          )
      );
    }

    const total = matches.length;
    const paginated = matches.slice((page - 1) * limit, page * limit);

    sendSuccess(res, paginated, 200, {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

apiRouter.get(
  '/matches/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = uuidParamSchema.parse(req.params.userId);
    const [meProfile, targetProfile, blockedIds, existingReq] = await Promise.all([
      repository.getFullUserProfile(req.user!.id),
      repository.getFullUserProfile(targetUserId),
      repository.getBlockedUserIdsFor(req.user!.id),
      repository.findActiveOrLatestRequestBetween(req.user!.id, targetUserId)
    ]);

    if (!meProfile || !targetProfile || !targetProfile.isActive) {
      throw new AppError(404, 'MATCH_NOT_FOUND', 'Kandidat tidak ditemukan.');
    }

    if (blockedIds.has(targetUserId)) {
      throw new AppError(404, 'MATCH_NOT_FOUND', 'Kandidat tidak tersedia.');
    }

    const match = evaluateReciprocalMatch(
      toMatchableUser(meProfile),
      toMatchableUser(targetProfile),
      blockedIds
    );

    if (!match) {
      throw new AppError(
        404,
        'NOT_RECIPROCAL_MATCH',
        'Pengguna ini belum memenuhi syarat kecocokan dua arah (reciprocal match) dengan daftar skill kamu saat ini.'
      );
    }

    if (existingReq) {
      match.existingRequestStatus = existingReq.status;
      match.existingRequestId = existingReq.id;
    }

    sendSuccess(res, match);
  })
);

// ============================================================================
// Collaboration Requests (FR-009, FR-010)
// ============================================================================
apiRouter.post(
  '/requests',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createRequestSchema.parse(req.body);
    const senderId = req.user!.id;

    if (senderId === parsed.recipientId) {
      throw new AppError(
        400,
        'CANNOT_REQUEST_SELF',
        'Kamu tidak dapat mengirim permintaan kolaborasi ke akun sendiri.'
      );
    }

    const [meProfile, recipientProfile, blockedIds] = await Promise.all([
      repository.getFullUserProfile(senderId),
      repository.getFullUserProfile(parsed.recipientId),
      repository.getBlockedUserIdsFor(senderId)
    ]);

    if (!recipientProfile || !recipientProfile.isActive) {
      throw new AppError(404, 'RECIPIENT_NOT_FOUND', 'Penerima tidak ditemukan.');
    }

    if (blockedIds.has(parsed.recipientId)) {
      throw new AppError(
        403,
        'USER_BLOCKED',
        'Tidak dapat mengirim permintaan kolaborasi ke pengguna ini.'
      );
    }

    // Verify reciprocal match eligibility
    const match = evaluateReciprocalMatch(
      toMatchableUser(meProfile!),
      toMatchableUser(recipientProfile),
      blockedIds
    );

    if (!match) {
      throw new AppError(
        422,
        'NOT_RECIPROCAL_MATCH',
        'Permintaan kolaborasi pada MVP memerlukan kecocokan skill dua arah (reciprocal match).'
      );
    }

    const offeredSkillId =
      parsed.offeredSkillId ?? match.explanation.aCanTeachB[0]?.skillId ?? null;
    const requestedSkillId =
      parsed.requestedSkillId ?? match.explanation.bCanTeachA[0]?.skillId ?? null;

    const created = await repository.createCollaborationRequest({
      senderId,
      recipientId: parsed.recipientId,
      offeredSkillId,
      requestedSkillId,
      introMessage: parsed.introMessage
    });

    await repository.createNotification({
      userId: parsed.recipientId,
      type: 'COLLABORATION_REQUEST_RECEIVED',
      title: 'Permintaan Kolaborasi Baru',
      body: `${meProfile!.displayName} mengajak bertukar skill denganmu.`,
      entityType: 'CollaborationRequest',
      entityId: created.id
    });

    sendSuccess(res, created, 201);
  })
);

apiRouter.get(
  '/requests',
  requireAuth,
  asyncHandler(async (req, res) => {
    const direction =
      req.query.direction === 'incoming' ||
      req.query.direction === 'outgoing' ||
      req.query.direction === 'all'
        ? req.query.direction
        : 'all';

    const validStatuses: RequestStatus[] = [
      'PENDING',
      'ACCEPTED',
      'REJECTED',
      'CANCELLED',
      'EXPIRED'
    ];
    const status =
      typeof req.query.status === 'string' &&
      validStatuses.includes(req.query.status as RequestStatus)
        ? (req.query.status as RequestStatus)
        : undefined;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));

    const allRequests = await repository.listUserRequests(req.user!.id, {
      direction,
      status
    });

    const total = allRequests.length;
    const paginated = allRequests.slice((page - 1) * limit, page * limit);

    sendSuccess(res, paginated, 200, {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  })
);

apiRouter.patch(
  '/requests/:requestId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const requestId = uuidParamSchema.parse(req.params.requestId);
    const parsed = updateRequestSchema.parse(req.body);
    const currentUserId = req.user!.id;

    const existing = await repository.getCollaborationRequestById(requestId);
    if (!existing) {
      throw new AppError(
        404,
        'REQUEST_NOT_FOUND',
        'Permintaan kolaborasi tidak ditemukan.'
      );
    }

    if (
      existing.senderId !== currentUserId &&
      existing.recipientId !== currentUserId
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Kamu tidak memiliki akses ke permintaan kolaborasi ini.'
      );
    }

    if (existing.status !== 'PENDING') {
      throw new AppError(
        409,
        'INVALID_STATE_TRANSITION',
        `Permintaan dengan status ${existing.status} tidak dapat diubah lagi.`
      );
    }

    let nextStatus: RequestStatus;
    let notifyUserId: string;
    let notifyTitle: string;
    let notifyBody: string;
    let counterDetails:
      | {
          offeredSkillId?: string | null;
          requestedSkillId?: string | null;
          introMessage?: string | null;
        }
      | undefined;

    if (parsed.action === 'ACCEPT') {
      if (existing.recipientId !== currentUserId) {
        throw new AppError(
          403,
          'ONLY_RECIPIENT_CAN_ACCEPT',
          'Hanya penerima yang dapat menerima permintaan kolaborasi.'
        );
      }
      nextStatus = 'ACCEPTED';
      notifyUserId = existing.senderId;
      notifyTitle = 'Permintaan Kolaborasi Diterima!';
      notifyBody = `${existing.recipient.displayName} menerima ajakan pertukaran skill. Kamu sekarang dapat menjadwalkan sesi belajar.`;
    } else if (parsed.action === 'REJECT') {
      if (existing.recipientId !== currentUserId) {
        throw new AppError(
          403,
          'ONLY_RECIPIENT_CAN_REJECT',
          'Hanya penerima yang dapat menolak permintaan kolaborasi.'
        );
      }
      nextStatus = 'REJECTED';
      notifyUserId = existing.senderId;
      notifyTitle = 'Permintaan Kolaborasi Ditolak';
      notifyBody = `${existing.recipient.displayName} belum dapat menerima permintaan kolaborasi saat ini.`;
    } else if (parsed.action === 'COUNTER') {
      nextStatus = 'PENDING';
      const actorName =
        existing.senderId === currentUserId
          ? existing.sender.displayName
          : existing.recipient.displayName;
      notifyUserId =
        existing.senderId === currentUserId
          ? existing.recipientId
          : existing.senderId;
      notifyTitle = 'Counter Proposal Pertukaran Skill';
      notifyBody = `${actorName} mengajukan perubahan kesepakatan pertukaran (Counter Proposal).`;
      counterDetails = {
        ...(parsed.offeredSkillId !== undefined
          ? { offeredSkillId: parsed.offeredSkillId }
          : {}),
        ...(parsed.requestedSkillId !== undefined
          ? { requestedSkillId: parsed.requestedSkillId }
          : {}),
        ...(parsed.introMessage !== undefined
          ? { introMessage: parsed.introMessage }
          : {})
      };
    } else {
      // CANCEL
      if (existing.senderId !== currentUserId) {
        throw new AppError(
          403,
          'ONLY_SENDER_CAN_CANCEL',
          'Hanya pengirim yang dapat membatalkan permintaan yang masih pending.'
        );
      }
      nextStatus = 'CANCELLED';
      notifyUserId = existing.recipientId;
      notifyTitle = 'Permintaan Kolaborasi Dibatalkan';
      notifyBody = `${existing.sender.displayName} membatalkan permintaan kolaborasi.`;
    }

    const updated = await repository.updateCollaborationRequestStatus(
      requestId,
      nextStatus,
      counterDetails
    );

    await repository.createNotification({
      userId: notifyUserId,
      type: `COLLABORATION_REQUEST_${nextStatus}`,
      title: notifyTitle,
      body: notifyBody,
      entityType: 'CollaborationRequest',
      entityId: updated.id
    });

    sendSuccess(res, updated);
  })
);

// ============================================================================
// Learning Sessions (FR-011, FR-012)
// ============================================================================
apiRouter.post(
  '/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createSessionSchema.parse(req.body);
    const currentUserId = req.user!.id;

    const collabReq = await repository.getCollaborationRequestById(parsed.requestId);
    if (!collabReq) {
      throw new AppError(
        404,
        'REQUEST_NOT_FOUND',
        'Permintaan kolaborasi tidak ditemukan.'
      );
    }

    if (
      collabReq.senderId !== currentUserId &&
      collabReq.recipientId !== currentUserId
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Kamu bukan bagian dari kolaborasi ini.'
      );
    }

    if (collabReq.status !== 'ACCEPTED') {
      throw new AppError(
        422,
        'REQUEST_NOT_ACCEPTED',
        'Sesi belajar hanya dapat diajukan untuk permintaan kolaborasi yang sudah berstatus ACCEPTED.'
      );
    }

    const partnerId =
      collabReq.senderId === currentUserId
        ? collabReq.recipientId
        : collabReq.senderId;
    const blockedIds = await repository.getBlockedUserIdsFor(currentUserId);
    if (blockedIds.has(partnerId)) {
      throw new AppError(
        403,
        'USER_BLOCKED',
        'Tidak dapat menjadwalkan sesi dengan pengguna ini.'
      );
    }

    const startAtDate = new Date(parsed.startAt);
    if (startAtDate.getTime() <= Date.now()) {
      throw new AppError(
        422,
        'SESSION_MUST_BE_IN_FUTURE',
        'Tanggal dan jam sesi harus berada di masa depan.'
      );
    }

    const created = await repository.createLearningSession({
      requestId: parsed.requestId,
      proposedBy: currentUserId,
      topic: parsed.topic,
      description: parsed.description,
      startAt: startAtDate,
      timezone: parsed.timezone,
      durationMinutes: parsed.durationMinutes
    });

    await repository.createNotification({
      userId: partnerId,
      type: 'SESSION_PROPOSED',
      title: 'Proposal Jadwal Sesi Baru',
      body: `${req.user!.displayName} mengajukan jadwal sesi belajar: "${created.topic}".`,
      entityType: 'LearningSession',
      entityId: created.id
    });

    sendSuccess(res, created, 201);
  })
);

apiRouter.get(
  '/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const validStatuses: SessionStatus[] = [
      'PROPOSED',
      'SCHEDULED',
      'COMPLETED',
      'CANCELLED'
    ];
    const status =
      typeof req.query.status === 'string' &&
      validStatuses.includes(req.query.status as SessionStatus)
        ? (req.query.status as SessionStatus)
        : undefined;

    const list = await repository.listUserSessions(req.user!.id, { status });
    sendSuccess(res, list, 200, { total: list.length });
  })
);

apiRouter.get(
  '/sessions/:sessionId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessionId = uuidParamSchema.parse(req.params.sessionId);
    const session = await repository.getLearningSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Sesi belajar tidak ditemukan.');
    }

    const currentUserId = req.user!.id;
    if (
      session.request.senderId !== currentUserId &&
      session.request.recipientId !== currentUserId
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Kamu tidak berhak mengakses sesi belajar milik pengguna lain.'
      );
    }

    sendSuccess(res, session);
  })
);

apiRouter.patch(
  '/sessions/:sessionId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessionId = uuidParamSchema.parse(req.params.sessionId);
    const parsed = updateSessionSchema.parse(req.body);
    const currentUserId = req.user!.id;

    const session = await repository.getLearningSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Sesi belajar tidak ditemukan.');
    }

    if (
      session.request.senderId !== currentUserId &&
      session.request.recipientId !== currentUserId
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Kamu tidak berhak mengubah sesi belajar ini.'
      );
    }

    const partnerId =
      session.request.senderId === currentUserId
        ? session.request.recipientId
        : session.request.senderId;

    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      throw new AppError(
        409,
        'SESSION_ALREADY_FINALIZED',
        `Sesi yang sudah berstatus ${session.status} tidak dapat diubah lagi.`
      );
    }

    if (parsed.action === 'CONFIRM') {
      if (session.status !== 'PROPOSED') {
        throw new AppError(
          409,
          'INVALID_SESSION_TRANSITION',
          'Hanya sesi berstatus PROPOSED yang dapat dikonfirmasi.'
        );
      }
      if (session.proposedBy === currentUserId) {
        throw new AppError(
          403,
          'PROPOSER_CANNOT_SELF_CONFIRM',
          'Jadwal sesi harus dikonfirmasi oleh partner belajarmu.'
        );
      }

      const updated = await repository.updateLearningSession(sessionId, {
        status: 'SCHEDULED'
      });

      await repository.createNotification({
        userId: partnerId,
        type: 'SESSION_CONFIRMED',
        title: 'Jadwal Sesi Dikonfirmasi!',
        body: `${req.user!.displayName} menyepakati jadwal sesi "${updated.topic}".`,
        entityType: 'LearningSession',
        entityId: updated.id
      });

      sendSuccess(res, updated);
      return;
    }

    if (parsed.action === 'RESCHEDULE') {
      if (!parsed.startAt) {
        throw new AppError(
          422,
          'START_AT_REQUIRED',
          'Waktu mulai baru (startAt) wajib diisi saat mengajukan perubahan jadwal.'
        );
      }
      const newStart = new Date(parsed.startAt);
      if (newStart.getTime() <= Date.now()) {
        throw new AppError(
          422,
          'SESSION_MUST_BE_IN_FUTURE',
          'Waktu sesi baru harus berada di masa depan.'
        );
      }

      const updated = await repository.updateLearningSession(sessionId, {
        status: 'PROPOSED',
        proposedBy: currentUserId,
        startAt: newStart,
        ...(parsed.timezone ? { timezone: parsed.timezone } : {}),
        ...(parsed.durationMinutes ? { durationMinutes: parsed.durationMinutes } : {}),
        ...(parsed.topic ? { topic: parsed.topic } : {}),
        ...(parsed.description !== undefined ? { description: parsed.description } : {})
      });

      await repository.createNotification({
        userId: partnerId,
        type: 'SESSION_RESCHEDULED',
        title: 'Usulan Perubahan Jadwal Sesi',
        body: `${req.user!.displayName} mengusulkan waktu baru untuk sesi "${updated.topic}".`,
        entityType: 'LearningSession',
        entityId: updated.id
      });

      sendSuccess(res, updated);
      return;
    }

    if (parsed.action === 'COMPLETE') {
      if (session.status !== 'SCHEDULED') {
        throw new AppError(
          409,
          'SESSION_NOT_SCHEDULED',
          'Hanya sesi berstatus SCHEDULED yang dapat ditandai selesai (COMPLETED).'
        );
      }

      const updated = await repository.updateLearningSession(sessionId, {
        status: 'COMPLETED'
      });

      await repository.createNotification({
        userId: partnerId,
        type: 'SESSION_COMPLETED',
        title: 'Sesi Belajar Selesai!',
        body: `${req.user!.displayName} menandai sesi "${updated.topic}" telah selesai.`,
        entityType: 'LearningSession',
        entityId: updated.id
      });

      sendSuccess(res, updated);
      return;
    }

    // CANCEL
    const updated = await repository.updateLearningSession(sessionId, {
      status: 'CANCELLED',
      cancelReason: parsed.cancelReason ?? null
    });

    await repository.createNotification({
      userId: partnerId,
      type: 'SESSION_CANCELLED',
      title: 'Sesi Belajar Dibatalkan',
      body: `${req.user!.displayName} membatalkan sesi "${updated.topic}".`,
      entityType: 'LearningSession',
      entityId: updated.id
    });

    sendSuccess(res, updated);
  })
);

// ============================================================================
// Notifications (FR-014)
// ============================================================================
apiRouter.get(
  '/notifications',
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await repository.listUserNotifications(req.user!.id);
    const unreadCount = list.filter((n) => !n.readAt).length;
    sendSuccess(res, list, 200, {
      total: list.length,
      unreadCount
    });
  })
);

apiRouter.patch(
  '/notifications/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updatedCount = await repository.markAllNotificationsRead(req.user!.id);
    sendSuccess(res, { updatedCount });
  })
);

apiRouter.patch(
  '/notifications/:id/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const notificationId = uuidParamSchema.parse(req.params.id);
    const updated = await repository.markNotificationRead(
      req.user!.id,
      notificationId
    );
    sendSuccess(res, updated);
  })
);

// ============================================================================
// Block & Report Safety Controls (FR-015)
// ============================================================================
apiRouter.get(
  '/blocks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const list = await repository.listBlocksInitiatedBy(req.user!.id);
    sendSuccess(res, list);
  })
);

apiRouter.post(
  '/blocks',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createBlockSchema.parse(req.body);
    const created = await repository.blockUser(req.user!.id, parsed.userId);
    sendSuccess(res, created, 201);
  })
);

apiRouter.delete(
  '/blocks/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = uuidParamSchema.parse(req.params.userId);
    await repository.unblockUser(req.user!.id, targetUserId);
    sendSuccess(res, { unblocked: true });
  })
);

apiRouter.post(
  '/reports',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createReportSchema.parse(req.body);
    const report = await repository.createReport({
      reporterId: req.user!.id,
      reportedUserId: parsed.reportedUserId,
      category: parsed.category,
      description: parsed.description
    });
    sendSuccess(res, report, 201);
  })
);

// ============================================================================
// P1: Feedback & Reputation System (Spec Section 9)
// ============================================================================
apiRouter.post(
  '/sessions/:sessionId/feedback',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessionId = uuidParamSchema.parse(req.params.sessionId);
    const parsed = createFeedbackSchema.parse(req.body);
    const currentUserId = req.user!.id;

    const session = await repository.getLearningSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Sesi belajar tidak ditemukan.');
    }

    if (
      session.request.senderId !== currentUserId &&
      session.request.recipientId !== currentUserId
    ) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Kamu bukan bagian dari sesi belajar ini.'
      );
    }

    if (session.status !== 'COMPLETED') {
      throw new AppError(
        422,
        'SESSION_NOT_COMPLETED',
        'Feedback & review hanya dapat diberikan setelah sesi selesai (COMPLETED).'
      );
    }

    const created = await repository.createSessionFeedback({
      sessionId,
      reviewerId: currentUserId,
      rating: parsed.rating,
      comment: parsed.comment
    });

    const partnerId =
      session.request.senderId === currentUserId
        ? session.request.recipientId
        : session.request.senderId;

    await repository.createNotification({
      userId: partnerId,
      type: 'NEW_FEEDBACK_RECEIVED',
      title: 'Feedback & Rating Baru!',
      body: `${req.user!.displayName} memberikan rating ${parsed.rating}/5 bintang untuk sesi "${session.topic}".`,
      entityType: 'LearningSession',
      entityId: session.id
    });

    sendSuccess(res, created, 201);
  })
);

apiRouter.get(
  '/sessions/:sessionId/feedback',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessionId = uuidParamSchema.parse(req.params.sessionId);
    const list = await repository.listFeedbacksForSession(sessionId);
    sendSuccess(res, list);
  })
);

apiRouter.get(
  '/reputation/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const targetUserId = uuidParamSchema.parse(req.params.userId);
    const rep = await repository.getUserReputation(targetUserId);
    sendSuccess(res, rep);
  })
);

// ============================================================================
// P1: Learning Progress Tracking & Milestones (Spec Section 8)
// ============================================================================
apiRouter.get(
  '/progress',
  requireAuth,
  asyncHandler(async (req, res) => {
    const milestones = await repository.listUserMilestones(req.user!.id);
    sendSuccess(res, milestones);
  })
);

apiRouter.post(
  '/progress',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createMilestoneSchema.parse(req.body);
    const created = await repository.createMilestone({
      userId: req.user!.id,
      requestId: parsed.requestId,
      title: parsed.title,
      notes: parsed.notes,
      progressPercent: parsed.progressPercent
    });
    sendSuccess(res, created, 201);
  })
);

apiRouter.patch(
  '/progress/:milestoneId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const milestoneId = uuidParamSchema.parse(req.params.milestoneId);
    const parsed = updateMilestoneSchema.parse(req.body);
    const updated = await repository.updateMilestone(
      req.user!.id,
      milestoneId,
      parsed
    );
    sendSuccess(res, updated);
  })
);

apiRouter.delete(
  '/progress/:milestoneId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const milestoneId = uuidParamSchema.parse(req.params.milestoneId);
    await repository.deleteMilestone(req.user!.id, milestoneId);
    sendSuccess(res, { deleted: true });
  })
);

// ============================================================================
// P1: Settings & Account Preferences (Spec Section 13)
// ============================================================================
apiRouter.get(
  '/settings/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const settings = await repository.getUserSettings(req.user!.id);
    sendSuccess(res, settings);
  })
);

apiRouter.patch(
  '/settings/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = updateSettingsSchema.parse(req.body);
    const updated = await repository.updateUserSettings(req.user!.id, parsed);
    sendSuccess(res, updated);
  })
);

// ============================================================================
// P1: Admin Dashboard & Moderation (Spec Section 11 & 14)
// ============================================================================
function assertAdminAccess(email: string) {
  const lower = email.toLowerCase();
  if (lower !== 'raka@demo.skillloop.id' && !lower.startsWith('admin@')) {
    throw new AppError(
      403,
      'ADMIN_ONLY',
      'Akses ditolak: Hanya akun dengan hak akses Administrator yang dapat mengelola menu Admin & Moderasi.'
    );
  }
}

apiRouter.get(
  '/admin/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    assertAdminAccess(req.user!.email);
    const overview = await repository.getAdminOverview();
    sendSuccess(res, overview);
  })
);

apiRouter.patch(
  '/admin/reports/:reportId',
  requireAuth,
  asyncHandler(async (req, res) => {
    assertAdminAccess(req.user!.email);
    const reportId = uuidParamSchema.parse(req.params.reportId);
    const parsed = adminReportUpdateSchema.parse(req.body);
    const updated = await repository.updateReportStatus(reportId, parsed.status);
    sendSuccess(res, updated);
  })
);

apiRouter.patch(
  '/admin/users/:userId/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    assertAdminAccess(req.user!.email);
    const targetUserId = uuidParamSchema.parse(req.params.userId);
    const parsed = adminUserStatusSchema.parse(req.body);
    if (targetUserId === req.user!.id && !parsed.isActive) {
      throw new AppError(
        400,
        'CANNOT_SUSPEND_SELF',
        'Tidak dapat menangguhkan akun yang sedang digunakan.'
      );
    }
    const updated = await repository.setUserActiveStatus(
      targetUserId,
      parsed.isActive
    );
    sendSuccess(res, {
      id: updated.id,
      displayName: updated.displayName,
      isActive: updated.isActive
    });
  })
);

apiRouter.post(
  '/admin/skills',
  requireAuth,
  asyncHandler(async (req, res) => {
    assertAdminAccess(req.user!.email);
    const parsed = adminCreateSkillSchema.parse(req.body);
    const created = await repository.adminCreateSkill(parsed);
    sendSuccess(res, created, 201);
  })
);

apiRouter.delete(
  '/admin/skills/:skillId',
  requireAuth,
  asyncHandler(async (req, res) => {
    assertAdminAccess(req.user!.email);
    const skillId = String(req.params.skillId || '').trim();
    if (!skillId) {
      throw new AppError(400, 'INVALID_SKILL_ID', 'ID skill tidak valid.');
    }
    const deleted = await repository.adminDeleteSkill(skillId);
    sendSuccess(res, deleted);
  })
);

// ============================================================================
// P2: Real-Time Private Messaging & Resource Sharing (Spec Section 7 & 11)
// ============================================================================
apiRouter.get(
  '/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentUserId = req.user!.id;
    const allRequests = await repository.listUserRequests(currentUserId, {
      direction: 'all'
    });
    // Per Spec Section 7: Private messaging between users with approved exchange relationship (or active request)
    const eligibleRequests = allRequests.filter(
      (r) => r.status === 'ACCEPTED' || r.status === 'PENDING'
    );

    const threads = await Promise.all(
      eligibleRequests.map(async (r) => {
        const msgs = await repository.listMessagesForRequest(r.id);
        const partner = r.senderId === currentUserId ? r.recipient : r.sender;
        const unreadCount = msgs.filter(
          (m) => m.recipientId === currentUserId && !m.readAt
        ).length;
        return {
          request: r,
          partner,
          messages: msgs,
          unreadCount
        };
      })
    );

    sendSuccess(res, threads);
  })
);

apiRouter.post(
  '/messages',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createMessageSchema.parse(req.body);
    const currentUserId = req.user!.id;

    const collabReq = await repository.getCollaborationRequestById(parsed.requestId);
    if (!collabReq) {
      throw new AppError(404, 'REQUEST_NOT_FOUND', 'Exchange request tidak ditemukan.');
    }
    if (
      collabReq.senderId !== currentUserId &&
      collabReq.recipientId !== currentUserId
    ) {
      throw new AppError(403, 'FORBIDDEN', 'Kamu bukan bagian dari pertukaran ini.');
    }

    const recipientId =
      collabReq.senderId === currentUserId
        ? collabReq.recipientId
        : collabReq.senderId;

    const created = await repository.createDirectMessage({
      requestId: collabReq.id,
      senderId: currentUserId,
      recipientId,
      body: parsed.body,
      resourceUrl: parsed.resourceUrl
    });

    await repository.createNotification({
      userId: recipientId,
      type: 'NEW_MESSAGE_RECEIVED',
      title: `Pesan Baru dari ${req.user!.displayName}`,
      body: parsed.body.slice(0, 90),
      entityType: 'DirectMessage',
      entityId: collabReq.id
    });

    sendSuccess(res, created, 201);
  })
);

apiRouter.patch(
  '/messages/:requestId/read',
  requireAuth,
  asyncHandler(async (req, res) => {
    const requestId = uuidParamSchema.parse(req.params.requestId);
    const updatedCount = await repository.markMessagesReadForRequest(
      requestId,
      req.user!.id
    );
    sendSuccess(res, { updatedCount });
  })
);

apiRouter.post(
  '/messages/:messageId/report',
  requireAuth,
  asyncHandler(async (req, res) => {
    const messageId = uuidParamSchema.parse(req.params.messageId);
    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason : undefined;
    const reported = await repository.reportMessage(
      messageId,
      req.user!.id,
      reason
    );
    sendSuccess(res, reported);
  })
);

// ============================================================================
// P2: Community Learning Groups (Spec Section 15)
// ============================================================================
apiRouter.get(
  '/groups',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const groups = await repository.listCommunityGroups();
    sendSuccess(res, groups);
  })
);

apiRouter.post(
  '/groups',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = createGroupSchema.parse(req.body);
    const created = await repository.createCommunityGroup({
      creatorId: req.user!.id,
      ...parsed
    });
    sendSuccess(res, created, 201);
  })
);

apiRouter.post(
  '/groups/:groupId/toggle-join',
  requireAuth,
  asyncHandler(async (req, res) => {
    const groupId = uuidParamSchema.parse(req.params.groupId);
    const updated = await repository.toggleGroupMembership(groupId, req.user!.id);
    sendSuccess(res, updated);
  })
);

// ============================================================================
// Aggregated Dashboard (FR-013)
// ============================================================================
function buildActivitySummary(
  sessions: Array<{ startAt: Date; durationMinutes: number; status: SessionStatus; topic: string }>,
  requests: Array<{ createdAt: Date; status: RequestStatus }>,
  milestones: Array<{ updatedAt: Date; isCompleted: boolean; title: string }>
) {
  const now = new Date();
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayStart = startOfDay(now);

  // Daily: last 7 days (from -6 days to today)
  const daily = Array.from({ length: 7 }, (_, idx) => {
    const offset = idx - 6;
    const targetStart = new Date(todayStart.getTime() + offset * 24 * 60 * 60 * 1000);
    const targetEnd = new Date(targetStart.getTime() + 24 * 60 * 60 * 1000);
    const inDay = (dt: Date) => dt >= targetStart && dt < targetEnd;

    const daySessions = sessions.filter((s) => s.status !== 'CANCELLED' && inDay(new Date(s.startAt)));
    const dayRequests = requests.filter((r) => inDay(new Date(r.createdAt)));
    const dayMilestones = milestones.filter((m) => inDay(new Date(m.updatedAt)));
    const minutes =
      daySessions.reduce((acc, s) => acc + s.durationMinutes, 0) +
      dayMilestones.length * 15 +
      dayRequests.length * 10;

    return {
      key: targetStart.toISOString().slice(0, 10),
      label: offset === 0 ? 'Hari Ini' : dayNames[targetStart.getDay()],
      fullLabel: targetStart.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }),
      sessionsCount: daySessions.length,
      requestsCount: dayRequests.length,
      milestonesCount: dayMilestones.length,
      minutes,
      totalActivities: daySessions.length + dayRequests.length + dayMilestones.length
    };
  });

  // Weekly: last 4 weeks (7-day windows)
  const weekly = Array.from({ length: 4 }, (_, idx) => {
    const weeksAgo = 3 - idx;
    const end = new Date(todayStart.getTime() + (1 - weeksAgo * 7) * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inWeek = (dt: Date) => dt >= start && dt < end;

    const weekSessions = sessions.filter((s) => s.status !== 'CANCELLED' && inWeek(new Date(s.startAt)));
    const weekRequests = requests.filter((r) => inWeek(new Date(r.createdAt)));
    const weekMilestones = milestones.filter((m) => inWeek(new Date(m.updatedAt)));
    const minutes =
      weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0) +
      weekMilestones.length * 15 +
      weekRequests.length * 10;

    return {
      key: `week-${idx + 1}`,
      label: weeksAgo === 0 ? 'Minggu Ini' : `Mg -${weeksAgo}`,
      fullLabel:
        weeksAgo === 0
          ? 'Minggu Ini (7 Hari Terakhir)'
          : `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${new Date(
              end.getTime() - 1
            ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`,
      sessionsCount: weekSessions.length,
      requestsCount: weekRequests.length,
      milestonesCount: weekMilestones.length,
      minutes,
      totalActivities: weekSessions.length + weekRequests.length + weekMilestones.length
    };
  });

  // Monthly: last 6 months
  const monthly = Array.from({ length: 6 }, (_, idx) => {
    const monthsAgo = 5 - idx;
    const refDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const mYear = refDate.getFullYear();
    const mIdx = refDate.getMonth();
    const inMonth = (dt: Date) => dt.getFullYear() === mYear && dt.getMonth() === mIdx;

    const monthSessions = sessions.filter((s) => s.status !== 'CANCELLED' && inMonth(new Date(s.startAt)));
    const monthRequests = requests.filter((r) => inMonth(new Date(r.createdAt)));
    const monthMilestones = milestones.filter((m) => inMonth(new Date(m.updatedAt)));
    const minutes =
      monthSessions.reduce((acc, s) => acc + s.durationMinutes, 0) +
      monthMilestones.length * 15 +
      monthRequests.length * 10;

    return {
      key: `${mYear}-${String(mIdx + 1).padStart(2, '0')}`,
      label: monthNames[mIdx],
      fullLabel: `${monthNames[mIdx]} ${mYear}`,
      sessionsCount: monthSessions.length,
      requestsCount: monthRequests.length,
      milestonesCount: monthMilestones.length,
      minutes,
      totalActivities: monthSessions.length + monthRequests.length + monthMilestones.length
    };
  });

  return { daily, weekly, monthly };
}

apiRouter.get(
  '/dashboard',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const [profile, matches, requests, sessions, notifications, reputation, milestones] =
      await Promise.all([
        repository.getFullUserProfile(userId),
        computeMatchesForUser(userId),
        repository.listUserRequests(userId, { direction: 'all' }),
        repository.listUserSessions(userId),
        repository.listUserNotifications(userId),
        repository.getUserReputation(userId),
        repository.listUserMilestones(userId)
      ]);

    const incomingPending = requests.filter(
      (r) => r.recipientId === userId && r.status === 'PENDING'
    );
    const outgoingPending = requests.filter(
      (r) => r.senderId === userId && r.status === 'PENDING'
    );
    const acceptedRequests = requests.filter((r) => r.status === 'ACCEPTED');
    const upcomingSessions = sessions.filter(
      (s) => s.status === 'SCHEDULED' || s.status === 'PROPOSED'
    );
    const completedSessionsCount = sessions.filter(
      (s) => s.status === 'COMPLETED'
    ).length;
    const unreadNotificationsCount = notifications.filter((n) => !n.readAt).length;
    const activitySummary = buildActivitySummary(sessions, requests, milestones);

    sendSuccess(res, {
      profile: toOwnProfileDto(profile!),
      stats: {
        reciprocalMatchesCount: matches.length,
        incomingPendingCount: incomingPending.length,
        outgoingPendingCount: outgoingPending.length,
        activeCollaborationsCount: acceptedRequests.length,
        upcomingSessionsCount: upcomingSessions.length,
        completedSessionsCount,
        unreadNotificationsCount,
        averageRating: reputation.averageRating,
        totalReviews: reputation.totalReviews
      },
      topMatches: matches.slice(0, 3),
      recentRequests: requests.slice(0, 5),
      upcomingSessions: upcomingSessions.slice(0, 5),
      milestones: milestones.slice(0, 5),
      activitySummary
    });
  })
);
