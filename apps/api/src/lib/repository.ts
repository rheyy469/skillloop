import crypto from 'node:crypto';
import {
  AuthSessionRecord,
  CollaborationRequestRecord,
  CommunityGroupRecord,
  DirectMessageRecord,
  FullUserProfile,
  getPrismaClient,
  LearningMilestoneRecord,
  LearningSessionRecord,
  memoryDb,
  NotificationRecord,
  resolveStorageMode,
  SessionFeedbackRecord,
  SkillAliasRecord,
  SkillCategoryRecord,
  SkillRecord,
  UserBlockRecord,
  UserLanguageRecord,
  UserRecord,
  UserReportRecord,
  UserSettingsRecord,
  UserSkillRecord
} from './store.js';
import {
  ReportStatus,
  RequestStatus,
  SessionStatus,
  SkillLevel,
  SkillRole
} from '@skillloop/shared';
import { normalizeSkillQuery } from '../services/matching.service.js';
import { AppError } from '../utils/errors.js';

export interface EnrichedCollaborationRequest extends CollaborationRequestRecord {
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

export interface EnrichedLearningSession extends LearningSessionRecord {
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
  proposer: {
    id: string;
    displayName: string;
  };
}

function toSkillRecord(raw: {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string | null;
  isActive: boolean;
  category: { id: string; name: string; slug: string };
  aliases: { id: string; skillId: string; alias: string }[];
}): SkillRecord {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    categoryId: raw.categoryId,
    description: raw.description,
    isActive: raw.isActive,
    category: raw.category,
    aliases: raw.aliases
  };
}

export const repository = {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().user.findUnique({ where: { email: normalized } });
    }
    for (const u of memoryDb.users.values()) {
      if (u.email === normalized) return u;
    }
    return null;
  },

  async findUserById(userId: string): Promise<UserRecord | null> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().user.findUnique({ where: { id: userId } });
    }
    return memoryDb.users.get(userId) ?? null;
  },

  async createUser(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    timezone: string;
    languages?: string[];
  }): Promise<UserRecord> {
    const email = input.email.trim().toLowerCase();
    const mode = await resolveStorageMode();
    const langs = input.languages && input.languages.length > 0 ? input.languages : ['id'];

    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      return prisma.user.create({
        data: {
          email,
          passwordHash: input.passwordHash,
          displayName: input.displayName.trim(),
          timezone: input.timezone || 'Asia/Jakarta',
          languages: {
            create: langs.map((code) => ({
              languageCode: code,
              proficiency: 'Conversational'
            }))
          }
        }
      });
    }

    for (const u of memoryDb.users.values()) {
      if (u.email === email) {
        throw new AppError(409, 'EMAIL_ALREADY_EXISTS', 'Email sudah terdaftar.');
      }
    }

    const now = new Date();
    const user: UserRecord = {
      id: crypto.randomUUID(),
      email,
      passwordHash: input.passwordHash,
      displayName: input.displayName.trim(),
      username: null,
      bio: null,
      avatarUrl: null,
      timezone: input.timezone || 'Asia/Jakarta',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    memoryDb.users.set(user.id, user);

    for (const code of langs) {
      const langRec: UserLanguageRecord = {
        id: crypto.randomUUID(),
        userId: user.id,
        languageCode: code,
        proficiency: 'Conversational'
      };
      memoryDb.userLanguages.set(langRec.id, langRec);
    }

    return user;
  },

  async createAuthSession(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSessionRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().authSession.create({
        data: {
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt
        }
      });
    }

    const now = new Date();
    const rec: AuthSessionRecord = {
      id: crypto.randomUUID(),
      tokenHash: input.tokenHash,
      userId: input.userId,
      expiresAt: input.expiresAt,
      createdAt: now,
      updatedAt: now
    };
    memoryDb.sessions.set(rec.tokenHash, rec);
    return rec;
  },

  async findValidSession(
    tokenHash: string
  ): Promise<{ session: AuthSessionRecord; user: UserRecord } | null> {
    const mode = await resolveStorageMode();
    const now = new Date();

    if (mode === 'postgres') {
      const found = await getPrismaClient().authSession.findUnique({
        where: { tokenHash },
        include: { user: true }
      });
      if (!found || found.expiresAt <= now || !found.user.isActive) {
        return null;
      }
      return { session: found, user: found.user };
    }

    const sess = memoryDb.sessions.get(tokenHash);
    if (!sess || sess.expiresAt <= now) return null;
    const user = memoryDb.users.get(sess.userId);
    if (!user || !user.isActive) return null;
    return { session: sess, user };
  },

  async deleteSession(tokenHash: string): Promise<void> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      await getPrismaClient().authSession.deleteMany({ where: { tokenHash } });
      return;
    }
    memoryDb.sessions.delete(tokenHash);
  },

  async getFullUserProfile(userId: string): Promise<FullUserProfile | null> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const user = await getPrismaClient().user.findUnique({
        where: { id: userId },
        include: {
          languages: true,
          availabilitySlots: true,
          skills: {
            include: {
              skill: {
                include: {
                  category: true,
                  aliases: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      if (!user) return null;
      return {
        ...user,
        skills: user.skills.map((us) => ({
          ...us,
          role: us.role as SkillRole,
          proficiencyLevel: (us.proficiencyLevel as SkillLevel | null) ?? null,
          targetLevel: (us.targetLevel as SkillLevel | null) ?? null,
          skill: toSkillRecord(us.skill)
        }))
      };
    }

    const user = memoryDb.users.get(userId);
    if (!user) return null;

    const languages = Array.from(memoryDb.userLanguages.values()).filter(
      (l) => l.userId === userId
    );
    const skills = Array.from(memoryDb.userSkills.values()).filter(
      (s) => s.userId === userId
    );
    const availabilitySlots = Array.from(memoryDb.availabilitySlots.values()).filter(
      (a) => a.userId === userId
    );

    return {
      ...user,
      languages,
      skills,
      availabilitySlots
    };
  },

  async updateUserProfile(
    userId: string,
    input: {
      displayName?: string;
      username?: string | null;
      bio?: string | null;
      avatarUrl?: string | null;
      timezone?: string;
      languages?: string[];
    }
  ): Promise<FullUserProfile> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      await prisma.$transaction(async (tx) => {
        if (input.username) {
          const existingUsername = await tx.user.findFirst({
            where: { username: input.username, id: { not: userId } }
          });
          if (existingUsername) {
            throw new AppError(409, 'USERNAME_TAKEN', 'Username sudah digunakan oleh pengguna lain.');
          }
        }

        await tx.user.update({
          where: { id: userId },
          data: {
            ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}),
            ...(input.username !== undefined ? { username: input.username?.trim() || null } : {}),
            ...(input.bio !== undefined ? { bio: input.bio?.trim() || null } : {}),
            ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl?.trim() || null } : {}),
            ...(input.timezone !== undefined ? { timezone: input.timezone } : {})
          }
        });

        if (input.languages !== undefined) {
          await tx.userLanguage.deleteMany({ where: { userId } });
          const uniqueLangs = Array.from(new Set(input.languages));
          if (uniqueLangs.length > 0) {
            await tx.userLanguage.createMany({
              data: uniqueLangs.map((code) => ({
                userId,
                languageCode: code,
                proficiency: 'Conversational'
              }))
            });
          }
        }
      });

      const updated = await this.getFullUserProfile(userId);
      if (!updated) throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
      return updated;
    }

    const user = memoryDb.users.get(userId);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');

    if (input.username) {
      const trimmedUsername = input.username.trim();
      for (const other of memoryDb.users.values()) {
        if (other.id !== userId && other.username === trimmedUsername) {
          throw new AppError(409, 'USERNAME_TAKEN', 'Username sudah digunakan oleh pengguna lain.');
        }
      }
    }

    if (input.displayName !== undefined) user.displayName = input.displayName.trim();
    if (input.username !== undefined) user.username = input.username?.trim() || null;
    if (input.bio !== undefined) user.bio = input.bio?.trim() || null;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl?.trim() || null;
    if (input.timezone !== undefined) user.timezone = input.timezone;
    user.updatedAt = new Date();

    if (input.languages !== undefined) {
      for (const [id, lang] of memoryDb.userLanguages.entries()) {
        if (lang.userId === userId) {
          memoryDb.userLanguages.delete(id);
        }
      }
      const uniqueLangs = Array.from(new Set(input.languages));
      for (const code of uniqueLangs) {
        const rec: UserLanguageRecord = {
          id: crypto.randomUUID(),
          userId,
          languageCode: code,
          proficiency: 'Conversational'
        };
        memoryDb.userLanguages.set(rec.id, rec);
      }
    }

    const updated = await this.getFullUserProfile(userId);
    return updated!;
  },

  async listSkillCategories(): Promise<SkillCategoryRecord[]> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().skillCategory.findMany({ orderBy: { name: 'asc' } });
    }
    return Array.from(memoryDb.categories.values());
  },

  async searchSkills(params: {
    query?: string;
    categorySlug?: string;
  }): Promise<SkillRecord[]> {
    const mode = await resolveStorageMode();
    const normalizedQuery = params.query ? normalizeSkillQuery(params.query) : '';

    let allSkills: SkillRecord[] = [];
    if (mode === 'postgres') {
      const rows = await getPrismaClient().skill.findMany({
        where: {
          isActive: true,
          ...(params.categorySlug
            ? { category: { slug: params.categorySlug } }
            : {})
        },
        include: {
          category: true,
          aliases: true
        },
        orderBy: { name: 'asc' }
      });
      allSkills = rows.map(toSkillRecord);
    } else {
      allSkills = Array.from(memoryDb.skills.values()).filter(
        (s) =>
          s.isActive &&
          (!params.categorySlug || s.category.slug === params.categorySlug)
      );
    }

    if (!normalizedQuery) {
      return allSkills;
    }

    return allSkills.filter((skill) => {
      if (skill.name.toLowerCase().includes(normalizedQuery)) return true;
      if (skill.slug.toLowerCase().includes(normalizedQuery)) return true;
      if (
        skill.aliases.some(
          (a) =>
            a.alias === normalizedQuery || a.alias.includes(normalizedQuery)
        )
      ) {
        return true;
      }
      return false;
    });
  },

  async getSkillById(skillId: string): Promise<SkillRecord | null> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const row = await getPrismaClient().skill.findUnique({
        where: { id: skillId },
        include: { category: true, aliases: true }
      });
      return row ? toSkillRecord(row) : null;
    }
    return memoryDb.skills.get(skillId) ?? null;
  },

  async listUserSkills(userId: string): Promise<UserSkillRecord[]> {
    const profile = await this.getFullUserProfile(userId);
    return profile ? profile.skills : [];
  },

  async addUserSkill(
    userId: string,
    input: {
      skillId: string;
      role: SkillRole;
      proficiencyLevel?: SkillLevel | null;
      targetLevel?: SkillLevel | null;
      description?: string | null;
    }
  ): Promise<UserSkillRecord> {
    const skill = await this.getSkillById(input.skillId);
    if (!skill || !skill.isActive) {
      throw new AppError(404, 'SKILL_NOT_FOUND', 'Skill tidak ditemukan dalam katalog.');
    }

    const mode = await resolveStorageMode();
    const proficiencyLevel =
      input.role === 'TEACH' ? input.proficiencyLevel ?? 'INTERMEDIATE' : null;
    const targetLevel =
      input.role === 'LEARN' ? input.targetLevel ?? 'BEGINNER' : null;

    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.userSkill.findUnique({
        where: {
          userId_skillId_role: {
            userId,
            skillId: input.skillId,
            role: input.role
          }
        }
      });
      if (existing) {
        throw new AppError(
          409,
          'DUPLICATE_SKILL_DECLARATION',
          `Skill "${skill.name}" sudah ada pada daftar ${input.role === 'TEACH' ? 'Can Teach' : 'Want to Learn'} kamu.`
        );
      }

      const created = await prisma.userSkill.create({
        data: {
          userId,
          skillId: input.skillId,
          role: input.role,
          proficiencyLevel,
          targetLevel,
          description: input.description?.trim() || null
        },
        include: {
          skill: {
            include: { category: true, aliases: true }
          }
        }
      });

      return {
        ...created,
        role: created.role as SkillRole,
        proficiencyLevel: (created.proficiencyLevel as SkillLevel | null) ?? null,
        targetLevel: (created.targetLevel as SkillLevel | null) ?? null,
        skill: toSkillRecord(created.skill)
      };
    }

    for (const existing of memoryDb.userSkills.values()) {
      if (
        existing.userId === userId &&
        existing.skillId === input.skillId &&
        existing.role === input.role
      ) {
        throw new AppError(
          409,
          'DUPLICATE_SKILL_DECLARATION',
          `Skill "${skill.name}" sudah ada pada daftar ${input.role === 'TEACH' ? 'Can Teach' : 'Want to Learn'} kamu.`
        );
      }
    }

    const now = new Date();
    const rec: UserSkillRecord = {
      id: crypto.randomUUID(),
      userId,
      skillId: input.skillId,
      role: input.role,
      proficiencyLevel,
      targetLevel,
      description: input.description?.trim() || null,
      createdAt: now,
      updatedAt: now,
      skill
    };
    memoryDb.userSkills.set(rec.id, rec);
    return rec;
  },

  async updateUserSkill(
    userId: string,
    userSkillId: string,
    input: {
      proficiencyLevel?: SkillLevel | null;
      targetLevel?: SkillLevel | null;
      description?: string | null;
    }
  ): Promise<UserSkillRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.userSkill.findUnique({
        where: { id: userSkillId }
      });
      if (!existing) {
        throw new AppError(404, 'USER_SKILL_NOT_FOUND', 'Deklarasi skill tidak ditemukan.');
      }
      if (existing.userId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Kamu tidak berhak mengubah deklarasi skill pengguna lain.');
      }

      const updated = await prisma.userSkill.update({
        where: { id: userSkillId },
        data: {
          ...(existing.role === 'TEACH' && input.proficiencyLevel !== undefined
            ? { proficiencyLevel: input.proficiencyLevel }
            : {}),
          ...(existing.role === 'LEARN' && input.targetLevel !== undefined
            ? { targetLevel: input.targetLevel }
            : {}),
          ...(input.description !== undefined
            ? { description: input.description?.trim() || null }
            : {})
        },
        include: {
          skill: { include: { category: true, aliases: true } }
        }
      });

      return {
        ...updated,
        role: updated.role as SkillRole,
        proficiencyLevel: (updated.proficiencyLevel as SkillLevel | null) ?? null,
        targetLevel: (updated.targetLevel as SkillLevel | null) ?? null,
        skill: toSkillRecord(updated.skill)
      };
    }

    const existing = memoryDb.userSkills.get(userSkillId);
    if (!existing) {
      throw new AppError(404, 'USER_SKILL_NOT_FOUND', 'Deklarasi skill tidak ditemukan.');
    }
    if (existing.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Kamu tidak berhak mengubah deklarasi skill pengguna lain.');
    }

    if (existing.role === 'TEACH' && input.proficiencyLevel !== undefined) {
      existing.proficiencyLevel = input.proficiencyLevel;
    }
    if (existing.role === 'LEARN' && input.targetLevel !== undefined) {
      existing.targetLevel = input.targetLevel;
    }
    if (input.description !== undefined) {
      existing.description = input.description?.trim() || null;
    }
    existing.updatedAt = new Date();
    return existing;
  },

  async deleteUserSkill(userId: string, userSkillId: string): Promise<void> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.userSkill.findUnique({ where: { id: userSkillId } });
      if (!existing) {
        throw new AppError(404, 'USER_SKILL_NOT_FOUND', 'Deklarasi skill tidak ditemukan.');
      }
      if (existing.userId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Kamu tidak berhak menghapus deklarasi skill pengguna lain.');
      }
      await prisma.userSkill.delete({ where: { id: userSkillId } });
      return;
    }

    const existing = memoryDb.userSkills.get(userSkillId);
    if (!existing) {
      throw new AppError(404, 'USER_SKILL_NOT_FOUND', 'Deklarasi skill tidak ditemukan.');
    }
    if (existing.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Kamu tidak berhak menghapus deklarasi skill pengguna lain.');
    }
    memoryDb.userSkills.delete(userSkillId);
  },

  async getAllActiveUsersWithSkills(): Promise<FullUserProfile[]> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const users = await getPrismaClient().user.findMany({
        where: { isActive: true },
        include: {
          languages: true,
          availabilitySlots: true,
          skills: {
            include: {
              skill: { include: { category: true, aliases: true } }
            }
          }
        }
      });
      return users.map((u) => ({
        ...u,
        skills: u.skills.map((us) => ({
          ...us,
          role: us.role as SkillRole,
          proficiencyLevel: (us.proficiencyLevel as SkillLevel | null) ?? null,
          targetLevel: (us.targetLevel as SkillLevel | null) ?? null,
          skill: toSkillRecord(us.skill)
        }))
      }));
    }

    const profiles: FullUserProfile[] = [];
    for (const user of memoryDb.users.values()) {
      if (!user.isActive) continue;
      const profile = await this.getFullUserProfile(user.id);
      if (profile) profiles.push(profile);
    }
    return profiles;
  },

  async getBlockedUserIdsFor(userId: string): Promise<Set<string>> {
    const mode = await resolveStorageMode();
    const blockedIds = new Set<string>();

    if (mode === 'postgres') {
      const blocks = await getPrismaClient().userBlock.findMany({
        where: {
          OR: [{ blockerId: userId }, { blockedId: userId }]
        }
      });
      for (const b of blocks) {
        if (b.blockerId === userId) blockedIds.add(b.blockedId);
        if (b.blockedId === userId) blockedIds.add(b.blockerId);
      }
      return blockedIds;
    }

    for (const b of memoryDb.blocks.values()) {
      if (b.blockerId === userId) blockedIds.add(b.blockedId);
      if (b.blockedId === userId) blockedIds.add(b.blockerId);
    }
    return blockedIds;
  },

  async listBlocksInitiatedBy(
    userId: string
  ): Promise<
    Array<{
      id: string;
      blockedId: string;
      createdAt: Date;
      blockedUser: { id: string; displayName: string; username: string | null };
    }>
  > {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const rows = await getPrismaClient().userBlock.findMany({
        where: { blockerId: userId },
        include: {
          blocked: {
            select: { id: true, displayName: true, username: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return rows.map((r) => ({
        id: r.id,
        blockedId: r.blockedId,
        createdAt: r.createdAt,
        blockedUser: r.blocked
      }));
    }

    const results: Array<{
      id: string;
      blockedId: string;
      createdAt: Date;
      blockedUser: { id: string; displayName: string; username: string | null };
    }> = [];

    for (const b of memoryDb.blocks.values()) {
      if (b.blockerId === userId) {
        const target = memoryDb.users.get(b.blockedId);
        if (target) {
          results.push({
            id: b.id,
            blockedId: b.blockedId,
            createdAt: b.createdAt,
            blockedUser: {
              id: target.id,
              displayName: target.displayName,
              username: target.username
            }
          });
        }
      }
    }
    return results;
  },

  async blockUser(blockerId: string, blockedId: string): Promise<UserBlockRecord> {
    if (blockerId === blockedId) {
      throw new AppError(400, 'CANNOT_BLOCK_SELF', 'Kamu tidak dapat memblokir akun sendiri.');
    }

    const target = await this.findUserById(blockedId);
    if (!target) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }

    const mode = await resolveStorageMode();
    const now = new Date();

    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      return prisma.$transaction(async (tx) => {
        // Cancel any pending requests between the two users
        await tx.collaborationRequest.updateMany({
          where: {
            status: 'PENDING',
            OR: [
              { senderId: blockerId, recipientId: blockedId },
              { senderId: blockedId, recipientId: blockerId }
            ]
          },
          data: {
            status: 'CANCELLED',
            respondedAt: now
          }
        });

        const existing = await tx.userBlock.findUnique({
          where: {
            blockerId_blockedId: { blockerId, blockedId }
          }
        });
        if (existing) return existing;

        return tx.userBlock.create({
          data: { blockerId, blockedId }
        });
      });
    }

    // Cancel any pending requests between the two users in memoryDb
    for (const req of memoryDb.requests.values()) {
      if (
        req.status === 'PENDING' &&
        ((req.senderId === blockerId && req.recipientId === blockedId) ||
          (req.senderId === blockedId && req.recipientId === blockerId))
      ) {
        req.status = 'CANCELLED';
        req.respondedAt = now;
        req.updatedAt = now;
      }
    }

    for (const b of memoryDb.blocks.values()) {
      if (b.blockerId === blockerId && b.blockedId === blockedId) {
        return b;
      }
    }

    const block: UserBlockRecord = {
      id: crypto.randomUUID(),
      blockerId,
      blockedId,
      createdAt: now
    };
    memoryDb.blocks.set(block.id, block);
    return block;
  },

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      await getPrismaClient().userBlock.deleteMany({
        where: { blockerId, blockedId }
      });
      return;
    }
    for (const [id, b] of memoryDb.blocks.entries()) {
      if (b.blockerId === blockerId && b.blockedId === blockedId) {
        memoryDb.blocks.delete(id);
      }
    }
  },

  async createReport(input: {
    reporterId: string;
    reportedUserId: string;
    category: string;
    description: string;
  }): Promise<UserReportRecord> {
    if (input.reporterId === input.reportedUserId) {
      throw new AppError(400, 'CANNOT_REPORT_SELF', 'Kamu tidak dapat melaporkan akun sendiri.');
    }
    const target = await this.findUserById(input.reportedUserId);
    if (!target) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna yang dilaporkan tidak ditemukan.');
    }

    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const created = await getPrismaClient().userReport.create({
        data: {
          reporterId: input.reporterId,
          reportedUserId: input.reportedUserId,
          category: input.category,
          description: input.description.trim(),
          status: 'OPEN'
        }
      });
      return {
        ...created,
        status: created.status as ReportStatus
      };
    }

    const rec: UserReportRecord = {
      id: crypto.randomUUID(),
      reporterId: input.reporterId,
      reportedUserId: input.reportedUserId,
      category: input.category,
      description: input.description.trim(),
      status: 'OPEN',
      createdAt: new Date(),
      reviewedAt: null
    };
    memoryDb.reports.set(rec.id, rec);
    return rec;
  },

  async findActiveOrLatestRequestBetween(
    userAId: string,
    userBId: string
  ): Promise<CollaborationRequestRecord | null> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const found = await getPrismaClient().collaborationRequest.findFirst({
        where: {
          OR: [
            { senderId: userAId, recipientId: userBId },
            { senderId: userBId, recipientId: userAId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      return found ? { ...found, status: found.status as RequestStatus } : null;
    }

    const matches = Array.from(memoryDb.requests.values())
      .filter(
        (r) =>
          (r.senderId === userAId && r.recipientId === userBId) ||
          (r.senderId === userBId && r.recipientId === userAId)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return matches[0] ?? null;
  },

  async createCollaborationRequest(input: {
    senderId: string;
    recipientId: string;
    offeredSkillId?: string | null;
    requestedSkillId?: string | null;
    introMessage?: string | null;
  }): Promise<EnrichedCollaborationRequest> {
    if (input.senderId === input.recipientId) {
      throw new AppError(400, 'INVALID_RECIPIENT', 'Tidak dapat mengirim permintaan ke diri sendiri.');
    }

    const blockedIds = await this.getBlockedUserIdsFor(input.senderId);
    if (blockedIds.has(input.recipientId)) {
      throw new AppError(403, 'USER_BLOCKED', 'Tidak dapat mengirim permintaan ke pengguna ini.');
    }

    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existingPending = await prisma.collaborationRequest.findFirst({
        where: {
          status: 'PENDING',
          OR: [
            { senderId: input.senderId, recipientId: input.recipientId },
            { senderId: input.recipientId, recipientId: input.senderId }
          ]
        }
      });

      if (existingPending) {
        throw new AppError(
          409,
          'DUPLICATE_PENDING_REQUEST',
          'Masih ada permintaan kolaborasi berstatus PENDING antara kamu dan pengguna ini.'
        );
      }

      const created = await prisma.collaborationRequest.create({
        data: {
          senderId: input.senderId,
          recipientId: input.recipientId,
          offeredSkillId: input.offeredSkillId || null,
          requestedSkillId: input.requestedSkillId || null,
          introMessage: input.introMessage?.trim() || null,
          status: 'PENDING'
        }
      });

      const enriched = await this.getCollaborationRequestById(created.id);
      return enriched!;
    }

    for (const r of memoryDb.requests.values()) {
      if (
        r.status === 'PENDING' &&
        ((r.senderId === input.senderId && r.recipientId === input.recipientId) ||
          (r.senderId === input.recipientId && r.recipientId === input.senderId))
      ) {
        throw new AppError(
          409,
          'DUPLICATE_PENDING_REQUEST',
          'Masih ada permintaan kolaborasi berstatus PENDING antara kamu dan pengguna ini.'
        );
      }
    }

    const now = new Date();
    const rec: CollaborationRequestRecord = {
      id: crypto.randomUUID(),
      senderId: input.senderId,
      recipientId: input.recipientId,
      offeredSkillId: input.offeredSkillId || null,
      requestedSkillId: input.requestedSkillId || null,
      status: 'PENDING',
      introMessage: input.introMessage?.trim() || null,
      createdAt: now,
      updatedAt: now,
      respondedAt: null
    };
    memoryDb.requests.set(rec.id, rec);

    const enriched = await this.getCollaborationRequestById(rec.id);
    return enriched!;
  },

  async getCollaborationRequestById(
    requestId: string
  ): Promise<EnrichedCollaborationRequest | null> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const row = await getPrismaClient().collaborationRequest.findUnique({
        where: { id: requestId },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true,
              timezone: true
            }
          },
          recipient: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatarUrl: true,
              timezone: true
            }
          },
          offeredSkill: { select: { id: true, name: true, slug: true } },
          requestedSkill: { select: { id: true, name: true, slug: true } },
          _count: { select: { sessions: true } }
        }
      });
      if (!row) return null;
      return {
        id: row.id,
        senderId: row.senderId,
        recipientId: row.recipientId,
        offeredSkillId: row.offeredSkillId,
        requestedSkillId: row.requestedSkillId,
        status: row.status as RequestStatus,
        introMessage: row.introMessage,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        respondedAt: row.respondedAt,
        sender: row.sender,
        recipient: row.recipient,
        offeredSkill: row.offeredSkill,
        requestedSkill: row.requestedSkill,
        sessionsCount: row._count.sessions
      };
    }

    const r = memoryDb.requests.get(requestId);
    if (!r) return null;
    const sender = memoryDb.users.get(r.senderId);
    const recipient = memoryDb.users.get(r.recipientId);
    if (!sender || !recipient) return null;

    const offeredSkill = r.offeredSkillId ? memoryDb.skills.get(r.offeredSkillId) ?? null : null;
    const requestedSkill = r.requestedSkillId
      ? memoryDb.skills.get(r.requestedSkillId) ?? null
      : null;
    const sessionsCount = Array.from(memoryDb.learningSessions.values()).filter(
      (s) => s.requestId === r.id
    ).length;

    return {
      ...r,
      sender: {
        id: sender.id,
        displayName: sender.displayName,
        username: sender.username,
        avatarUrl: sender.avatarUrl,
        timezone: sender.timezone
      },
      recipient: {
        id: recipient.id,
        displayName: recipient.displayName,
        username: recipient.username,
        avatarUrl: recipient.avatarUrl,
        timezone: recipient.timezone
      },
      offeredSkill: offeredSkill
        ? { id: offeredSkill.id, name: offeredSkill.name, slug: offeredSkill.slug }
        : null,
      requestedSkill: requestedSkill
        ? { id: requestedSkill.id, name: requestedSkill.name, slug: requestedSkill.slug }
        : null,
      sessionsCount
    };
  },

  async listUserRequests(
    userId: string,
    params: {
      direction?: 'incoming' | 'outgoing' | 'all';
      status?: RequestStatus;
    } = {}
  ): Promise<EnrichedCollaborationRequest[]> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const whereClause: Record<string, unknown> = {};
      if (params.direction === 'incoming') {
        whereClause.recipientId = userId;
      } else if (params.direction === 'outgoing') {
        whereClause.senderId = userId;
      } else {
        whereClause.OR = [{ senderId: userId }, { recipientId: userId }];
      }
      if (params.status) {
        whereClause.status = params.status;
      }

      const rows = await getPrismaClient().collaborationRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      const enriched: EnrichedCollaborationRequest[] = [];
      for (const row of rows) {
        const item = await this.getCollaborationRequestById(row.id);
        if (item) enriched.push(item);
      }
      return enriched;
    }

    const filtered = Array.from(memoryDb.requests.values())
      .filter((r) => {
        if (params.direction === 'incoming' && r.recipientId !== userId) return false;
        if (params.direction === 'outgoing' && r.senderId !== userId) return false;
        if (
          (!params.direction || params.direction === 'all') &&
          r.senderId !== userId &&
          r.recipientId !== userId
        ) {
          return false;
        }
        if (params.status && r.status !== params.status) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const enriched: EnrichedCollaborationRequest[] = [];
    for (const r of filtered) {
      const item = await this.getCollaborationRequestById(r.id);
      if (item) enriched.push(item);
    }
    return enriched;
  },

  async updateCollaborationRequestStatus(
    requestId: string,
    status: RequestStatus,
    counterDetails?: {
      offeredSkillId?: string | null;
      requestedSkillId?: string | null;
      introMessage?: string | null;
    }
  ): Promise<EnrichedCollaborationRequest> {
    const mode = await resolveStorageMode();
    const now = new Date();

    if (mode === 'postgres') {
      await getPrismaClient().collaborationRequest.update({
        where: { id: requestId },
        data: {
          status,
          respondedAt: status === 'PENDING' ? null : now,
          ...(counterDetails?.offeredSkillId !== undefined
            ? { offeredSkillId: counterDetails.offeredSkillId }
            : {}),
          ...(counterDetails?.requestedSkillId !== undefined
            ? { requestedSkillId: counterDetails.requestedSkillId }
            : {}),
          ...(counterDetails?.introMessage !== undefined
            ? { introMessage: counterDetails.introMessage }
            : {})
        }
      });
      const updated = await this.getCollaborationRequestById(requestId);
      return updated!;
    }

    const req = memoryDb.requests.get(requestId);
    if (!req) {
      throw new AppError(404, 'REQUEST_NOT_FOUND', 'Permintaan kolaborasi tidak ditemukan.');
    }
    req.status = status;
    req.respondedAt = status === 'PENDING' ? null : now;
    if (counterDetails?.offeredSkillId !== undefined) {
      req.offeredSkillId = counterDetails.offeredSkillId;
    }
    if (counterDetails?.requestedSkillId !== undefined) {
      req.requestedSkillId = counterDetails.requestedSkillId;
    }
    if (counterDetails?.introMessage !== undefined) {
      req.introMessage = counterDetails.introMessage;
    }
    req.updatedAt = now;
    const updated = await this.getCollaborationRequestById(requestId);
    return updated!;
  },

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      await getPrismaClient().user.update({
        where: { id: userId },
        data: { passwordHash }
      });
      return;
    }
    const user = memoryDb.users.get(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }
    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
  },

  async createLearningSession(input: {
    requestId: string;
    proposedBy: string;
    topic: string;
    description?: string | null;
    startAt: Date;
    timezone: string;
    durationMinutes: number;
  }): Promise<EnrichedLearningSession> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const created = await getPrismaClient().learningSession.create({
        data: {
          requestId: input.requestId,
          proposedBy: input.proposedBy,
          topic: input.topic.trim(),
          description: input.description?.trim() || null,
          startAt: input.startAt,
          timezone: input.timezone,
          durationMinutes: input.durationMinutes,
          status: 'PROPOSED'
        }
      });
      const enriched = await this.getLearningSessionById(created.id);
      return enriched!;
    }

    const now = new Date();
    const rec: LearningSessionRecord = {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      proposedBy: input.proposedBy,
      topic: input.topic.trim(),
      description: input.description?.trim() || null,
      startAt: input.startAt,
      timezone: input.timezone,
      durationMinutes: input.durationMinutes,
      status: 'PROPOSED',
      cancelReason: null,
      createdAt: now,
      updatedAt: now
    };
    memoryDb.learningSessions.set(rec.id, rec);
    const enriched = await this.getLearningSessionById(rec.id);
    return enriched!;
  },

  async getLearningSessionById(
    sessionId: string
  ): Promise<EnrichedLearningSession | null> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const row = await getPrismaClient().learningSession.findUnique({
        where: { id: sessionId },
        include: {
          proposer: { select: { id: true, displayName: true } },
          request: {
            include: {
              sender: { select: { id: true, displayName: true, timezone: true } },
              recipient: { select: { id: true, displayName: true, timezone: true } },
              offeredSkill: { select: { id: true, name: true } },
              requestedSkill: { select: { id: true, name: true } }
            }
          }
        }
      });
      if (!row) return null;
      return {
        id: row.id,
        requestId: row.requestId,
        topic: row.topic,
        description: row.description,
        startAt: row.startAt,
        timezone: row.timezone,
        durationMinutes: row.durationMinutes,
        status: row.status as SessionStatus,
        proposedBy: row.proposedBy,
        cancelReason: row.cancelReason,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        proposer: row.proposer,
        request: {
          id: row.request.id,
          senderId: row.request.senderId,
          recipientId: row.request.recipientId,
          status: row.request.status as RequestStatus,
          sender: row.request.sender,
          recipient: row.request.recipient,
          offeredSkill: row.request.offeredSkill,
          requestedSkill: row.request.requestedSkill
        }
      };
    }

    const sess = memoryDb.learningSessions.get(sessionId);
    if (!sess) return null;
    const req = await this.getCollaborationRequestById(sess.requestId);
    if (!req) return null;
    const proposer = memoryDb.users.get(sess.proposedBy);
    if (!proposer) return null;

    return {
      ...sess,
      proposer: { id: proposer.id, displayName: proposer.displayName },
      request: {
        id: req.id,
        senderId: req.senderId,
        recipientId: req.recipientId,
        status: req.status,
        sender: {
          id: req.sender.id,
          displayName: req.sender.displayName,
          timezone: req.sender.timezone
        },
        recipient: {
          id: req.recipient.id,
          displayName: req.recipient.displayName,
          timezone: req.recipient.timezone
        },
        offeredSkill: req.offeredSkill
          ? { id: req.offeredSkill.id, name: req.offeredSkill.name }
          : null,
        requestedSkill: req.requestedSkill
          ? { id: req.requestedSkill.id, name: req.requestedSkill.name }
          : null
      }
    };
  },

  async listUserSessions(
    userId: string,
    params: { status?: SessionStatus } = {}
  ): Promise<EnrichedLearningSession[]> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const rows = await getPrismaClient().learningSession.findMany({
        where: {
          request: {
            OR: [{ senderId: userId }, { recipientId: userId }]
          },
          ...(params.status ? { status: params.status } : {})
        },
        orderBy: { startAt: 'asc' }
      });

      const list: EnrichedLearningSession[] = [];
      for (const r of rows) {
        const item = await this.getLearningSessionById(r.id);
        if (item) list.push(item);
      }
      return list;
    }

    const list: EnrichedLearningSession[] = [];
    for (const s of memoryDb.learningSessions.values()) {
      if (params.status && s.status !== params.status) continue;
      const item = await this.getLearningSessionById(s.id);
      if (
        item &&
        (item.request.senderId === userId || item.request.recipientId === userId)
      ) {
        list.push(item);
      }
    }
    return list.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  },

  async updateLearningSession(
    sessionId: string,
    data: {
      status?: SessionStatus;
      topic?: string;
      description?: string | null;
      startAt?: Date;
      timezone?: string;
      durationMinutes?: number;
      proposedBy?: string;
      cancelReason?: string | null;
    }
  ): Promise<EnrichedLearningSession> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      await getPrismaClient().learningSession.update({
        where: { id: sessionId },
        data: {
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.topic !== undefined ? { topic: data.topic.trim() } : {}),
          ...(data.description !== undefined
            ? { description: data.description?.trim() || null }
            : {}),
          ...(data.startAt !== undefined ? { startAt: data.startAt } : {}),
          ...(data.timezone !== undefined ? { timezone: data.timezone } : {}),
          ...(data.durationMinutes !== undefined
            ? { durationMinutes: data.durationMinutes }
            : {}),
          ...(data.proposedBy !== undefined ? { proposedBy: data.proposedBy } : {}),
          ...(data.cancelReason !== undefined
            ? { cancelReason: data.cancelReason?.trim() || null }
            : {})
        }
      });
      const updated = await this.getLearningSessionById(sessionId);
      return updated!;
    }

    const sess = memoryDb.learningSessions.get(sessionId);
    if (!sess) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Sesi belajar tidak ditemukan.');
    }
    if (data.status !== undefined) sess.status = data.status;
    if (data.topic !== undefined) sess.topic = data.topic.trim();
    if (data.description !== undefined) {
      sess.description = data.description?.trim() || null;
    }
    if (data.startAt !== undefined) sess.startAt = data.startAt;
    if (data.timezone !== undefined) sess.timezone = data.timezone;
    if (data.durationMinutes !== undefined) {
      sess.durationMinutes = data.durationMinutes;
    }
    if (data.proposedBy !== undefined) sess.proposedBy = data.proposedBy;
    if (data.cancelReason !== undefined) {
      sess.cancelReason = data.cancelReason?.trim() || null;
    }
    sess.updatedAt = new Date();
    const updated = await this.getLearningSessionById(sessionId);
    return updated!;
  },

  async createNotification(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    entityType?: string | null;
    entityId?: string | null;
  }): Promise<NotificationRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null
        }
      });
    }

    const rec: NotificationRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      readAt: null,
      createdAt: new Date()
    };
    memoryDb.notifications.set(rec.id, rec);
    return rec;
  },

  async listUserNotifications(userId: string): Promise<NotificationRecord[]> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
    }

    return Array.from(memoryDb.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);
  },

  async markNotificationRead(
    userId: string,
    notificationId: string
  ): Promise<NotificationRecord> {
    const mode = await resolveStorageMode();
    const now = new Date();

    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.notification.findUnique({
        where: { id: notificationId }
      });
      if (!existing) {
        throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notifikasi tidak ditemukan.');
      }
      if (existing.userId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Kamu tidak berhak mengakses notifikasi pengguna lain.');
      }
      return prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: existing.readAt ?? now }
      });
    }

    const existing = memoryDb.notifications.get(notificationId);
    if (!existing) {
      throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notifikasi tidak ditemukan.');
    }
    if (existing.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Kamu tidak berhak mengakses notifikasi pengguna lain.');
    }
    existing.readAt = existing.readAt ?? now;
    return existing;
  },

  async markAllNotificationsRead(userId: string): Promise<number> {
    const mode = await resolveStorageMode();
    const now = new Date();

    if (mode === 'postgres') {
      const res = await getPrismaClient().notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: now }
      });
      return res.count;
    }

    let count = 0;
    for (const n of memoryDb.notifications.values()) {
      if (n.userId === userId && !n.readAt) {
        n.readAt = now;
        count++;
      }
    }
    return count;
  },

  // ==========================================================================
  // P1: Session Feedback & Reputation System (Spec Section 9)
  // ==========================================================================
  async createSessionFeedback(input: {
    sessionId: string;
    reviewerId: string;
    rating: number;
    comment: string;
  }): Promise<SessionFeedbackRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.sessionFeedback.findUnique({
        where: {
          sessionId_reviewerId: {
            sessionId: input.sessionId,
            reviewerId: input.reviewerId
          }
        }
      });
      if (existing) {
        throw new AppError(409, 'FEEDBACK_ALREADY_EXISTS', 'Kamu sudah memberikan ulasan untuk sesi ini.');
      }
      const created = await prisma.sessionFeedback.create({
        data: {
          sessionId: input.sessionId,
          reviewerId: input.reviewerId,
          rating: input.rating,
          comment: input.comment.trim()
        }
      });
      return {
        ...created,
        rating: created.rating ?? 5
      };
    }

    for (const f of memoryDb.feedbacks.values()) {
      if (f.sessionId === input.sessionId && f.reviewerId === input.reviewerId) {
        throw new AppError(409, 'FEEDBACK_ALREADY_EXISTS', 'Kamu sudah memberikan ulasan untuk sesi ini.');
      }
    }

    const rec: SessionFeedbackRecord = {
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      reviewerId: input.reviewerId,
      rating: input.rating,
      comment: input.comment.trim(),
      createdAt: new Date()
    };
    memoryDb.feedbacks.set(rec.id, rec);
    return rec;
  },

  async listFeedbacksForSession(sessionId: string): Promise<
    Array<SessionFeedbackRecord & { reviewerName: string }>
  > {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const rows = await getPrismaClient().sessionFeedback.findMany({
        where: { sessionId },
        include: { reviewer: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' }
      });
      return rows.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        reviewerId: r.reviewerId,
        rating: r.rating ?? 5,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: r.reviewer.displayName
      }));
    }

    const list: Array<SessionFeedbackRecord & { reviewerName: string }> = [];
    for (const f of memoryDb.feedbacks.values()) {
      if (f.sessionId === sessionId) {
        const reviewer = memoryDb.users.get(f.reviewerId);
        list.push({
          ...f,
          reviewerName: reviewer?.displayName || 'Learner'
        });
      }
    }
    return list;
  },

  async getUserReputation(targetUserId: string): Promise<{
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
      createdAt: Date;
    }>;
  }> {
    const allSessions = await this.listUserSessions(targetUserId);
    const completedSessions = allSessions.filter((s) => s.status === 'COMPLETED');
    const reviews: Array<{
      id: string;
      sessionId: string;
      sessionTopic: string;
      reviewerId: string;
      reviewerName: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
    }> = [];

    for (const sess of allSessions) {
      const fbs = await this.listFeedbacksForSession(sess.id);
      for (const fb of fbs) {
        if (fb.reviewerId !== targetUserId) {
          reviews.push({
            id: fb.id,
            sessionId: sess.id,
            sessionTopic: sess.topic,
            reviewerId: fb.reviewerId,
            reviewerName: fb.reviewerName,
            rating: fb.rating,
            comment: fb.comment,
            createdAt: fb.createdAt
          });
        }
      }
    }

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
            ).toFixed(1)
          )
        : 5.0;

    return {
      averageRating,
      totalReviews,
      completedSessionsCount: completedSessions.length,
      reviews
    };
  },

  // ==========================================================================
  // P1: Learning Progress Tracking & Milestones (Spec Section 8)
  // ==========================================================================
  async listUserMilestones(userId: string): Promise<LearningMilestoneRecord[]> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().learningMilestone.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    }

    const items = Array.from(memoryDb.milestones.values()).filter(
      (m) => m.userId === userId
    );
    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async createMilestone(input: {
    userId: string;
    requestId: string;
    title: string;
    notes?: string | null;
    progressPercent: number;
  }): Promise<LearningMilestoneRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().learningMilestone.create({
        data: {
          userId: input.userId,
          requestId: input.requestId,
          title: input.title.trim(),
          notes: input.notes?.trim() || null,
          isCompleted: input.progressPercent >= 100,
          progressPercent: input.progressPercent
        }
      });
    }

    const now = new Date();
    const rec: LearningMilestoneRecord = {
      id: crypto.randomUUID(),
      userId: input.userId,
      requestId: input.requestId,
      title: input.title.trim(),
      notes: input.notes?.trim() || null,
      isCompleted: input.progressPercent >= 100,
      progressPercent: input.progressPercent,
      createdAt: now,
      updatedAt: now
    };
    memoryDb.milestones.set(rec.id, rec);
    return rec;
  },

  async updateMilestone(
    userId: string,
    milestoneId: string,
    input: {
      title?: string;
      notes?: string | null;
      isCompleted?: boolean;
      progressPercent?: number;
    }
  ): Promise<LearningMilestoneRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.learningMilestone.findUnique({
        where: { id: milestoneId }
      });
      if (!existing) {
        throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone tidak ditemukan.');
      }
      if (existing.userId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Tidak berhak mengubah milestone ini.');
      }

      let nextProgress =
        input.progressPercent !== undefined ? input.progressPercent : existing.progressPercent;
      let nextCompleted =
        input.isCompleted !== undefined ? input.isCompleted : existing.isCompleted;
      if (input.progressPercent !== undefined && input.progressPercent >= 100) {
        nextCompleted = true;
      }
      if (input.isCompleted === true) {
        nextProgress = 100;
      }

      return prisma.learningMilestone.update({
        where: { id: milestoneId },
        data: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
          progressPercent: nextProgress,
          isCompleted: nextCompleted
        }
      });
    }

    const existing = memoryDb.milestones.get(milestoneId);
    if (!existing) {
      throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone tidak ditemukan.');
    }
    if (existing.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Tidak berhak mengubah milestone ini.');
    }
    if (input.title !== undefined) existing.title = input.title.trim();
    if (input.notes !== undefined) existing.notes = input.notes?.trim() || null;
    if (input.progressPercent !== undefined) {
      existing.progressPercent = input.progressPercent;
      if (input.progressPercent >= 100) existing.isCompleted = true;
    }
    if (input.isCompleted !== undefined) {
      existing.isCompleted = input.isCompleted;
      if (input.isCompleted) existing.progressPercent = 100;
    }
    existing.updatedAt = new Date();
    return existing;
  },

  async deleteMilestone(userId: string, milestoneId: string): Promise<void> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.learningMilestone.findUnique({
        where: { id: milestoneId }
      });
      if (!existing) {
        throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone tidak ditemukan.');
      }
      if (existing.userId !== userId) {
        throw new AppError(403, 'FORBIDDEN', 'Tidak berhak menghapus milestone ini.');
      }
      await prisma.learningMilestone.delete({ where: { id: milestoneId } });
      return;
    }

    const existing = memoryDb.milestones.get(milestoneId);
    if (!existing) {
      throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone tidak ditemukan.');
    }
    if (existing.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Tidak berhak menghapus milestone ini.');
    }
    memoryDb.milestones.delete(milestoneId);
  },

  // ==========================================================================
  // P1: Settings & Account Preferences (Spec Section 13)
  // ==========================================================================
  async getUserSettings(userId: string): Promise<UserSettingsRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.userSettings.findUnique({ where: { userId } });
      if (existing) {
        return {
          userId: existing.userId,
          notifyNewRequest: existing.notifyNewRequest,
          notifyRequestAccepted: existing.notifyRequestAccepted,
          notifySessionUpdates: existing.notifySessionUpdates,
          notifyNewFeedback: existing.notifyNewFeedback,
          showTimezonePublicly: existing.showTimezonePublicly,
          showPortfolioPublicly: existing.showPortfolioPublicly,
          showHistoryPublicly: existing.showHistoryPublicly,
          interfaceLanguage: existing.interfaceLanguage
        };
      }
      const created = await prisma.userSettings.create({
        data: { userId }
      });
      return {
        userId: created.userId,
        notifyNewRequest: created.notifyNewRequest,
        notifyRequestAccepted: created.notifyRequestAccepted,
        notifySessionUpdates: created.notifySessionUpdates,
        notifyNewFeedback: created.notifyNewFeedback,
        showTimezonePublicly: created.showTimezonePublicly,
        showPortfolioPublicly: created.showPortfolioPublicly,
        showHistoryPublicly: created.showHistoryPublicly,
        interfaceLanguage: created.interfaceLanguage
      };
    }

    const existing = memoryDb.userSettings.get(userId);
    if (existing) return existing;
    const def: UserSettingsRecord = {
      userId,
      notifyNewRequest: true,
      notifyRequestAccepted: true,
      notifySessionUpdates: true,
      notifyNewFeedback: true,
      showTimezonePublicly: true,
      showPortfolioPublicly: true,
      showHistoryPublicly: true,
      interfaceLanguage: 'id'
    };
    memoryDb.userSettings.set(userId, def);
    return def;
  },

  async updateUserSettings(
    userId: string,
    patch: Partial<Omit<UserSettingsRecord, 'userId'>>
  ): Promise<UserSettingsRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const saved = await getPrismaClient().userSettings.upsert({
        where: { userId },
        update: { ...patch },
        create: { userId, ...patch }
      });
      return {
        userId: saved.userId,
        notifyNewRequest: saved.notifyNewRequest,
        notifyRequestAccepted: saved.notifyRequestAccepted,
        notifySessionUpdates: saved.notifySessionUpdates,
        notifyNewFeedback: saved.notifyNewFeedback,
        showTimezonePublicly: saved.showTimezonePublicly,
        showPortfolioPublicly: saved.showPortfolioPublicly,
        showHistoryPublicly: saved.showHistoryPublicly,
        interfaceLanguage: saved.interfaceLanguage
      };
    }

    const current = await this.getUserSettings(userId);
    const updated: UserSettingsRecord = {
      ...current,
      ...patch,
      userId
    };
    memoryDb.userSettings.set(userId, updated);
    return updated;
  },

  // ==========================================================================
  // P1: Admin Dashboard & Moderation (Spec Section 11 & 14)
  // ==========================================================================
  async getAdminOverview() {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const [users, reports, categories, skills, requests, sessions] =
        await Promise.all([
          prisma.user.findMany({
            include: { _count: { select: { skills: true } } },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.userReport.findMany({
            include: {
              reporter: { select: { id: true, displayName: true, email: true } },
              reportedUser: { select: { id: true, displayName: true, email: true, isActive: true } }
            },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.skillCategory.findMany({ orderBy: { name: 'asc' } }),
          prisma.skill.findMany({
            include: { category: true, aliases: true },
            orderBy: { name: 'asc' }
          }),
          prisma.collaborationRequest.count(),
          prisma.learningSession.count()
        ]);

      return {
        stats: {
          totalUsers: users.length,
          activeUsers: users.filter((u) => u.isActive).length,
          suspendedUsers: users.filter((u) => !u.isActive).length,
          totalSkills: skills.length,
          totalCategories: categories.length,
          totalRequests: requests,
          totalSessions: sessions,
          openReports: reports.filter((r) => r.status === 'OPEN').length
        },
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          displayName: u.displayName,
          username: u.username,
          timezone: u.timezone,
          isActive: u.isActive,
          skillsCount: u._count.skills,
          createdAt: u.createdAt
        })),
        reports: reports.map((r) => ({
          id: r.id,
          category: r.category,
          description: r.description,
          status: r.status as ReportStatus,
          createdAt: r.createdAt,
          reviewedAt: r.reviewedAt,
          reporter: r.reporter,
          reportedUser: r.reportedUser
        })),
        categories,
        skills: skills.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description,
          category: {
            id: s.category.id,
            name: s.category.name,
            slug: s.category.slug
          },
          aliases: s.aliases.map((a) => a.alias)
        }))
      };
    }

    const users = Array.from(memoryDb.users.values());
    const reports = Array.from(memoryDb.reports.values());
    const categories = Array.from(memoryDb.categories.values());
    const skills = Array.from(memoryDb.skills.values());

    return {
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
        suspendedUsers: users.filter((u) => !u.isActive).length,
        totalSkills: skills.length,
        totalCategories: categories.length,
        totalRequests: memoryDb.requests.size,
        totalSessions: memoryDb.learningSessions.size,
        openReports: reports.filter((r) => r.status === 'OPEN').length
      },
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        username: u.username,
        timezone: u.timezone,
        isActive: u.isActive,
        skillsCount: Array.from(memoryDb.userSkills.values()).filter(
          (s) => s.userId === u.id
        ).length,
        createdAt: u.createdAt
      })),
      reports: reports.map((r) => {
        const reporter = memoryDb.users.get(r.reporterId);
        const reported = memoryDb.users.get(r.reportedUserId);
        return {
          id: r.id,
          category: r.category,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt,
          reviewedAt: r.reviewedAt,
          reporter: {
            id: r.reporterId,
            displayName: reporter?.displayName || 'User',
            email: reporter?.email || ''
          },
          reportedUser: {
            id: r.reportedUserId,
            displayName: reported?.displayName || 'User',
            email: reported?.email || '',
            isActive: reported?.isActive ?? true
          }
        };
      }),
      categories,
      skills: skills.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        category: {
          id: s.category.id,
          name: s.category.name,
          slug: s.category.slug
        },
        aliases: s.aliases.map((a) => a.alias)
      }))
    };
  },

  async updateReportStatus(
    reportId: string,
    status: ReportStatus
  ): Promise<UserReportRecord> {
    const mode = await resolveStorageMode();
    const now = new Date();
    if (mode === 'postgres') {
      const updated = await getPrismaClient().userReport.update({
        where: { id: reportId },
        data: { status, reviewedAt: now }
      });
      return { ...updated, status: updated.status as ReportStatus };
    }
    const rec = memoryDb.reports.get(reportId);
    if (!rec) {
      throw new AppError(404, 'REPORT_NOT_FOUND', 'Laporan tidak ditemukan.');
    }
    rec.status = status;
    rec.reviewedAt = now;
    return rec;
  },

  async setUserActiveStatus(userId: string, isActive: boolean): Promise<UserRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      return getPrismaClient().user.update({
        where: { id: userId },
        data: { isActive }
      });
    }
    const user = memoryDb.users.get(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Pengguna tidak ditemukan.');
    }
    user.isActive = isActive;
    user.updatedAt = new Date();
    return user;
  },

  async adminCreateSkill(input: {
    name: string;
    categoryId: string;
    description: string;
    aliases: string[];
  }): Promise<SkillRecord> {
    const slug = input.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const created = await getPrismaClient().skill.create({
        data: {
          name: input.name.trim(),
          slug,
          categoryId: input.categoryId,
          description: input.description.trim(),
          aliases: {
            create: input.aliases.map((a) => ({
              alias: normalizeSkillQuery(a)
            }))
          }
        },
        include: { category: true, aliases: true }
      });
      return toSkillRecord(created);
    }

    const cat = memoryDb.categories.get(input.categoryId);
    if (!cat) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Kategori tidak ditemukan.');
    }

    const skillId = crypto.randomUUID();
    const aliasRecords: SkillAliasRecord[] = input.aliases.map((a) => {
      const rec: SkillAliasRecord = {
        id: crypto.randomUUID(),
        skillId,
        alias: normalizeSkillQuery(a)
      };
      memoryDb.aliases.set(rec.alias, rec);
      return rec;
    });

    const rec: SkillRecord = {
      id: skillId,
      name: input.name.trim(),
      slug,
      categoryId: input.categoryId,
      description: input.description.trim(),
      isActive: true,
      category: cat,
      aliases: aliasRecords
    };
    memoryDb.skills.set(rec.id, rec);
    return rec;
  },

  async adminDeleteSkill(
    skillId: string
  ): Promise<{ deleted: boolean; id: string }> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.skill.findUnique({ where: { id: skillId } });
      if (!existing) {
        throw new AppError(
          404,
          'SKILL_NOT_FOUND',
          'Skill tidak ditemukan di katalog kanonis.'
        );
      }
      await prisma.userSkill.deleteMany({ where: { skillId } });
      await prisma.skillAlias.deleteMany({ where: { skillId } });
      await prisma.skill.delete({ where: { id: skillId } });
      return { deleted: true, id: skillId };
    }

    const existing = memoryDb.skills.get(skillId);
    if (!existing) {
      throw new AppError(
        404,
        'SKILL_NOT_FOUND',
        'Skill tidak ditemukan di katalog kanonis.'
      );
    }

    memoryDb.skills.delete(skillId);
    for (const [aliasKey, aliasRec] of memoryDb.aliases.entries()) {
      if (aliasRec.skillId === skillId) {
        memoryDb.aliases.delete(aliasKey);
      }
    }
    for (const [usId, usRec] of memoryDb.userSkills.entries()) {
      if (usRec.skillId === skillId) {
        memoryDb.userSkills.delete(usId);
      }
    }

    return { deleted: true, id: skillId };
  },

  // ==========================================================================
  // P2: Real-Time / Private Messaging & Resource Sharing (Spec Section 7 & 11)
  // ==========================================================================
  async listMessagesForRequest(
    requestId: string
  ): Promise<Array<DirectMessageRecord & { senderName: string }>> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const rows = await getPrismaClient().directMessage.findMany({
        where: { requestId },
        include: { sender: { select: { displayName: true } } },
        orderBy: { createdAt: 'asc' }
      });
      return rows.map((m) => ({
        id: m.id,
        requestId: m.requestId,
        senderId: m.senderId,
        recipientId: m.recipientId,
        body: m.body,
        resourceUrl: m.resourceUrl,
        readAt: m.readAt,
        isReported: m.isReported,
        createdAt: m.createdAt,
        senderName: m.sender.displayName
      }));
    }

    const items = Array.from(memoryDb.messages.values())
      .filter((m) => m.requestId === requestId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    const enriched: Array<DirectMessageRecord & { senderName: string }> = [];
    for (const m of items) {
      const sender = await this.findUserById(m.senderId);
      enriched.push({
        ...m,
        senderName: sender?.displayName || 'Partner'
      });
    }
    return enriched;
  },

  async createDirectMessage(input: {
    requestId: string;
    senderId: string;
    recipientId: string;
    body: string;
    resourceUrl?: string | null;
  }): Promise<DirectMessageRecord & { senderName: string }> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const created = await getPrismaClient().directMessage.create({
        data: {
          requestId: input.requestId,
          senderId: input.senderId,
          recipientId: input.recipientId,
          body: input.body.trim(),
          resourceUrl: input.resourceUrl?.trim() || null
        },
        include: { sender: { select: { displayName: true } } }
      });
      return {
        id: created.id,
        requestId: created.requestId,
        senderId: created.senderId,
        recipientId: created.recipientId,
        body: created.body,
        resourceUrl: created.resourceUrl,
        readAt: created.readAt,
        isReported: created.isReported,
        createdAt: created.createdAt,
        senderName: created.sender.displayName
      };
    }

    const sender = await this.findUserById(input.senderId);
    const rec: DirectMessageRecord = {
      id: crypto.randomUUID(),
      requestId: input.requestId,
      senderId: input.senderId,
      recipientId: input.recipientId,
      body: input.body.trim(),
      resourceUrl: input.resourceUrl?.trim() || null,
      readAt: null,
      isReported: false,
      createdAt: new Date()
    };
    memoryDb.messages.set(rec.id, rec);
    return {
      ...rec,
      senderName: sender?.displayName || 'Partner'
    };
  },

  async markMessagesReadForRequest(
    requestId: string,
    recipientId: string
  ): Promise<number> {
    const mode = await resolveStorageMode();
    const now = new Date();
    if (mode === 'postgres') {
      const res = await getPrismaClient().directMessage.updateMany({
        where: { requestId, recipientId, readAt: null },
        data: { readAt: now }
      });
      return res.count;
    }

    let count = 0;
    for (const m of memoryDb.messages.values()) {
      if (m.requestId === requestId && m.recipientId === recipientId && !m.readAt) {
        m.readAt = now;
        count++;
      }
    }
    return count;
  },

  async reportMessage(
    messageId: string,
    reporterId: string,
    reason?: string
  ): Promise<DirectMessageRecord> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.directMessage.findUnique({
        where: { id: messageId }
      });
      if (!existing) {
        throw new AppError(404, 'MESSAGE_NOT_FOUND', 'Pesan tidak ditemukan.');
      }
      const updated = await prisma.directMessage.update({
        where: { id: messageId },
        data: { isReported: true }
      });
      await this.createReport({
        reporterId,
        reportedUserId: updated.senderId,
        category: 'INAPPROPRIATE_CONTENT',
        description:
          reason?.trim() || `Laporan pesan pribadi: "${updated.body.slice(0, 120)}"`
      });
      return updated;
    }

    const msg = memoryDb.messages.get(messageId);
    if (!msg) {
      throw new AppError(404, 'MESSAGE_NOT_FOUND', 'Pesan tidak ditemukan.');
    }
    msg.isReported = true;
    await this.createReport({
      reporterId,
      reportedUserId: msg.senderId,
      category: 'INAPPROPRIATE_CONTENT',
      description: reason?.trim() || `Laporan pesan pribadi: "${msg.body.slice(0, 120)}"`
    });
    return msg;
  },

  // ==========================================================================
  // P2: Community Learning Groups (Spec Section 15)
  // ==========================================================================
  async listCommunityGroups(): Promise<
    Array<CommunityGroupRecord & { creatorName: string; membersCount: number }>
  > {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      let rows = await prisma.communityGroup.findMany({
        include: { creator: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' }
      });

      if (rows.length === 0) {
        const users = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, email: true },
          take: 5
        });
        if (users.length > 0) {
          const byEmail = (email: string) =>
            users.find((u) => u.email === email)?.id || users[0].id;
          const rakaId = byEmail('raka@demo.skillloop.id');
          const nayaId = byEmail('naya@demo.skillloop.id');
          const alyaId = byEmail('alya@demo.skillloop.id');
          const dimasId = byEmail('dimas@demo.skillloop.id');
          const farhanId = byEmail('farhan@demo.skillloop.id');

          const starterGroups = [
            {
              name: 'Frontend & UI/UX Design Jam',
              skillFocus: 'JavaScript ⇄ UI/UX Design',
              categoryName: 'Web & Product Design',
              description:
                'Weekly hands-on circle where developers trade React & JavaScript fundamentals for Figma auto-layout, design tokens, and usability reviews.',
              meetingLink: 'https://meet.jit.si/SkillLoop-FrontendUIUXJam',
              scheduleNote: 'Sat . 19:30 WIB (UTC+7)',
              creatorId: nayaId,
              memberIds: Array.from(new Set([nayaId, rakaId, dimasId]))
            },
            {
              name: 'Python Data & React Builders',
              skillFocus: 'Python & SQL ⇄ React & TypeScript',
              categoryName: 'Data & Fullstack',
              description:
                'Peer study circle connecting data & backend learners with frontend engineers to build end-to-end mini-projects together.',
              meetingLink: 'https://meet.jit.si/SkillLoop-PythonReactBuilders',
              scheduleNote: 'Sun . 16:00 WIB (UTC+7)',
              creatorId: alyaId,
              memberIds: Array.from(new Set([alyaId, farhanId, rakaId]))
            },
            {
              name: 'Public Speaking & Pitching Studio',
              skillFocus: 'Public Speaking ⇄ English Conversation',
              categoryName: 'Languages & Communication',
              description:
                'Supportive weekly practice room for hackathon pitches, technical storytelling, and structured peer presentation feedback.',
              meetingLink: 'https://meet.jit.si/SkillLoop-PitchingStudio',
              scheduleNote: 'Wed . 20:00 WIB (UTC+7)',
              creatorId: dimasId,
              memberIds: Array.from(new Set([dimasId, nayaId]))
            }
          ];

          for (const grp of starterGroups) {
            await prisma.communityGroup.create({ data: grp });
          }

          rows = await prisma.communityGroup.findMany({
            include: { creator: { select: { displayName: true } } },
            orderBy: { createdAt: 'desc' }
          });
        }
      }

      return rows.map((g) => ({
        id: g.id,
        name: g.name,
        skillFocus: g.skillFocus,
        categoryName: g.categoryName,
        description: g.description,
        meetingLink: g.meetingLink,
        scheduleNote: g.scheduleNote,
        creatorId: g.creatorId,
        memberIds: g.memberIds,
        createdAt: g.createdAt,
        creatorName: g.creator.displayName,
        membersCount: g.memberIds.length
      }));
    }

    const list = Array.from(memoryDb.groups.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    const enriched: Array<
      CommunityGroupRecord & { creatorName: string; membersCount: number }
    > = [];
    for (const g of list) {
      const creator = await this.findUserById(g.creatorId);
      enriched.push({
        ...g,
        creatorName: creator?.displayName || 'Member',
        membersCount: g.memberIds.length
      });
    }
    return enriched;
  },

  async createCommunityGroup(input: {
    creatorId: string;
    name: string;
    skillFocus: string;
    categoryName: string;
    description: string;
    meetingLink?: string | null;
    scheduleNote: string;
  }): Promise<CommunityGroupRecord & { creatorName: string; membersCount: number }> {
    const meetingLink =
      input.meetingLink?.trim() ||
      `https://meet.jit.si/SkillLoop-${input.name.trim().replace(/[^a-zA-Z0-9]/g, '')}`;

    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const created = await getPrismaClient().communityGroup.create({
        data: {
          name: input.name.trim(),
          skillFocus: input.skillFocus.trim(),
          categoryName: input.categoryName.trim(),
          description: input.description.trim(),
          meetingLink,
          scheduleNote: input.scheduleNote.trim(),
          creatorId: input.creatorId,
          memberIds: [input.creatorId]
        },
        include: { creator: { select: { displayName: true } } }
      });
      return {
        id: created.id,
        name: created.name,
        skillFocus: created.skillFocus,
        categoryName: created.categoryName,
        description: created.description,
        meetingLink: created.meetingLink,
        scheduleNote: created.scheduleNote,
        creatorId: created.creatorId,
        memberIds: created.memberIds,
        createdAt: created.createdAt,
        creatorName: created.creator.displayName,
        membersCount: created.memberIds.length
      };
    }

    const creator = await this.findUserById(input.creatorId);
    const rec: CommunityGroupRecord = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      skillFocus: input.skillFocus.trim(),
      categoryName: input.categoryName.trim(),
      description: input.description.trim(),
      meetingLink,
      scheduleNote: input.scheduleNote.trim(),
      creatorId: input.creatorId,
      memberIds: [input.creatorId],
      createdAt: new Date()
    };
    memoryDb.groups.set(rec.id, rec);
    return {
      ...rec,
      creatorName: creator?.displayName || 'Member',
      membersCount: 1
    };
  },

  async toggleGroupMembership(
    groupId: string,
    userId: string
  ): Promise<CommunityGroupRecord & { creatorName: string; membersCount: number }> {
    const mode = await resolveStorageMode();
    if (mode === 'postgres') {
      const prisma = getPrismaClient();
      const existing = await prisma.communityGroup.findUnique({
        where: { id: groupId }
      });
      if (!existing) {
        throw new AppError(404, 'GROUP_NOT_FOUND', 'Kelompok belajar tidak ditemukan.');
      }
      const nextMembers = existing.memberIds.includes(userId)
        ? existing.memberIds.filter((id) => id !== userId)
        : [...existing.memberIds, userId];

      const updated = await prisma.communityGroup.update({
        where: { id: groupId },
        data: { memberIds: nextMembers },
        include: { creator: { select: { displayName: true } } }
      });
      return {
        id: updated.id,
        name: updated.name,
        skillFocus: updated.skillFocus,
        categoryName: updated.categoryName,
        description: updated.description,
        meetingLink: updated.meetingLink,
        scheduleNote: updated.scheduleNote,
        creatorId: updated.creatorId,
        memberIds: updated.memberIds,
        createdAt: updated.createdAt,
        creatorName: updated.creator.displayName,
        membersCount: updated.memberIds.length
      };
    }

    const group = memoryDb.groups.get(groupId);
    if (!group) {
      throw new AppError(404, 'GROUP_NOT_FOUND', 'Kelompok belajar tidak ditemukan.');
    }
    if (group.memberIds.includes(userId)) {
      group.memberIds = group.memberIds.filter((id) => id !== userId);
    } else {
      group.memberIds.push(userId);
    }
    const creator = await this.findUserById(group.creatorId);
    return {
      ...group,
      creatorName: creator?.displayName || 'Member',
      membersCount: group.memberIds.length
    };
  }
};
