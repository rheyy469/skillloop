import { SkillLevel, SkillRole } from '@skillloop/shared';

export const MATCHING_ALGORITHM_VERSION = 1;

export interface MatchableSkillDeclaration {
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

export interface MatchableAvailabilitySlot {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  timezone: string;
}

export interface MatchableUser {
  id: string;
  displayName: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string;
  isActive: boolean;
  languages: string[];
  skills: MatchableSkillDeclaration[];
  availabilitySlots?: MatchableAvailabilitySlot[];
}

export interface MatchedSkillPair {
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

export interface MatchScoreBreakdown {
  algorithmVersion: number;
  aToBScore: number;
  bToAScore: number;
  overallScore: number;
  availabilityFit: number;
  hasAvailabilityData: boolean;
  note: string;
}

export interface MatchExplanation {
  summary: string;
  aCanTeachB: MatchedSkillPair[];
  bCanTeachA: MatchedSkillPair[];
  sharedLanguages: string[];
  reasons: string[];
}

export interface ReciprocalMatchResult {
  user: {
    id: string;
    displayName: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    timezone: string;
    languages: string[];
    profileCompleteness: number;
    teachSkills: MatchableSkillDeclaration[];
    learnSkills: MatchableSkillDeclaration[];
  };
  score: MatchScoreBreakdown;
  explanation: MatchExplanation;
  existingRequestStatus?: string | null;
  existingRequestId?: string | null;
}

const LEVEL_RANK: Record<SkillLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3
};

/**
 * Normalizes a free-text alias or skill string for canonical lookup.
 */
export function normalizeSkillQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/**
 * Calculates profile completeness (0-100) and missing steps.
 */
export function calculateProfileCompleteness(user: {
  displayName: string;
  bio: string | null;
  timezone: string;
  languages: string[];
  skills: { role: SkillRole }[];
}): { score: number; missingSteps: string[]; isComplete: boolean } {
  const missingSteps: string[] = [];
  let score = 0;

  if (user.displayName && user.displayName.trim().length >= 2) {
    score += 20;
  } else {
    missingSteps.push('Lengkapi nama tampilan (minimal 2 karakter)');
  }

  if (user.bio && user.bio.trim().length >= 10) {
    score += 15;
  } else {
    missingSteps.push('Tambahkan bio singkat tentang latar belakang dan minat belajarmu');
  }

  if (user.timezone && user.timezone.trim().length > 0) {
    score += 10;
  } else {
    missingSteps.push('Pilih zona waktu');
  }

  if (user.languages.length > 0) {
    score += 15;
  } else {
    missingSteps.push('Pilih minimal 1 bahasa komunikasi');
  }

  const hasTeach = user.skills.some((s) => s.role === 'TEACH');
  const hasLearn = user.skills.some((s) => s.role === 'LEARN');

  if (hasTeach) {
    score += 20;
  } else {
    missingSteps.push('Tambahkan minimal 1 skill yang bisa kamu ajarkan (Can Teach)');
  }

  if (hasLearn) {
    score += 20;
  } else {
    missingSteps.push('Tambahkan minimal 1 skill yang ingin kamu pelajari (Want to Learn)');
  }

  return {
    score,
    missingSteps,
    isComplete: hasTeach && hasLearn && Boolean(user.displayName?.trim())
  };
}

/**
 * Evaluates LevelFit (0-100) between a teacher's self-assessed proficiency
 * and a learner's target level.
 * Per PRD 9.4: If level data is incomplete, use a neutral value (80) and do not penalize heavily.
 */
export function computeLevelFit(
  teacherLevel: SkillLevel | null,
  learnerTargetLevel: SkillLevel | null
): number {
  if (!teacherLevel || !learnerTargetLevel) {
    return 80;
  }

  const tRank = LEVEL_RANK[teacherLevel];
  const lRank = LEVEL_RANK[learnerTargetLevel];

  if (tRank > lRank) {
    return 100;
  }
  if (tRank === lRank) {
    return teacherLevel === 'BEGINNER' ? 85 : 95;
  }
  // Teacher level is lower than learner's target level
  if (tRank + 1 === lRank) {
    return 55;
  }
  return 30;
}

/**
 * Computes availability overlap (0-100) if both users have declared AvailabilitySlots.
 * Per PRD 9.4: If availability is not provided, return a neutral score (80) and flag hasAvailabilityData = false.
 */
export function computeAvailabilityFit(
  slotsA?: MatchableAvailabilitySlot[],
  slotsB?: MatchableAvailabilitySlot[]
): { fit: number; hasData: boolean } {
  if (!slotsA || !slotsB || slotsA.length === 0 || slotsB.length === 0) {
    return { fit: 80, hasData: false };
  }

  let totalOverlapMinutes = 0;
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.dayOfWeek === b.dayOfWeek) {
        const start = Math.max(a.startMinute, b.startMinute);
        const end = Math.min(a.endMinute, b.endMinute);
        if (end > start) {
          totalOverlapMinutes += end - start;
        }
      }
    }
  }

  if (totalOverlapMinutes >= 120) return { fit: 100, hasData: true };
  if (totalOverlapMinutes >= 60) return { fit: 85, hasData: true };
  if (totalOverlapMinutes >= 30) return { fit: 65, hasData: true };
  return { fit: 30, hasData: true };
}

/**
 * Finds matched skills where teacher has role=TEACH and learner has role=LEARN for the same canonical skillId.
 */
export function findDirectionalSkillMatches(
  teacherSkills: MatchableSkillDeclaration[],
  learnerSkills: MatchableSkillDeclaration[]
): MatchedSkillPair[] {
  const teachMap = new Map<string, MatchableSkillDeclaration>();
  for (const s of teacherSkills) {
    if (s.role === 'TEACH') {
      teachMap.set(s.skillId, s);
    }
  }

  const pairs: MatchedSkillPair[] = [];
  for (const learn of learnerSkills) {
    if (learn.role !== 'LEARN') continue;
    const teach = teachMap.get(learn.skillId);
    if (!teach) continue;

    const skillFit = 100; // Canonical exact match
    const levelFit = computeLevelFit(teach.proficiencyLevel, learn.targetLevel);

    pairs.push({
      skillId: teach.skillId,
      skillName: teach.skillName,
      skillSlug: teach.skillSlug,
      categoryId: teach.categoryId,
      categoryName: teach.categoryName,
      categorySlug: teach.categorySlug,
      teacherLevel: teach.proficiencyLevel,
      learnerTargetLevel: learn.targetLevel,
      teacherDescription: teach.description,
      learnerDescription: learn.description,
      skillFit,
      levelFit
    });
  }

  return pairs;
}

/**
 * Computes DirectionScore per PRD Section 9.4:
 * DirectionScore = 0.70 * SkillFit + 0.20 * LevelFit + 0.10 * AvailabilityFit
 */
export function computeDirectionScore(
  matchedPairs: MatchedSkillPair[],
  availabilityFit: number
): number {
  if (matchedPairs.length === 0) return 0;

  // Use the best matched skill pair in this direction, with a small bonus (up to +5 capped at 100) for multiple matched skills
  let bestPairScore = 0;
  for (const pair of matchedPairs) {
    const score = 0.7 * pair.skillFit + 0.2 * pair.levelFit + 0.1 * availabilityFit;
    if (score > bestPairScore) {
      bestPairScore = score;
    }
  }

  const multiSkillBonus = Math.min((matchedPairs.length - 1) * 2, 4);
  return Math.min(100, Math.round(bestPairScore + multiSkillBonus));
}

/**
 * Evaluates whether User A and User B form a valid Reciprocal Match and returns the full explanation & score.
 * Returns null if not eligible (inactive, same user, blocked, or one-way match).
 */
export function evaluateReciprocalMatch(
  userA: MatchableUser,
  userB: MatchableUser,
  blockedUserIds: Set<string>
): ReciprocalMatchResult | null {
  if (userA.id === userB.id) return null;
  if (!userA.isActive || !userB.isActive) return null;
  if (blockedUserIds.has(userB.id)) return null;

  const aCanTeachB = findDirectionalSkillMatches(userA.skills, userB.skills);
  const bCanTeachA = findDirectionalSkillMatches(userB.skills, userA.skills);

  // Critical rule (PRD Section 9.3): Both directions MUST have at least 1 canonical match
  if (aCanTeachB.length === 0 || bCanTeachA.length === 0) {
    return null;
  }

  const availability = computeAvailabilityFit(userA.availabilitySlots, userB.availabilitySlots);
  const aToBScore = computeDirectionScore(aCanTeachB, availability.fit);
  const bToAScore = computeDirectionScore(bCanTeachA, availability.fit);

  // OverallScore = 0.65 * min(AtoB, BtoA) + 0.35 * average(AtoB, BtoA)
  const minScore = Math.min(aToBScore, bToAScore);
  const avgScore = (aToBScore + bToAScore) / 2;
  const overallScore = Math.round(0.65 * minScore + 0.35 * avgScore);

  const aTeachNames = aCanTeachB.map((m) => m.skillName).join(', ');
  const bTeachNames = bCanTeachA.map((m) => m.skillName).join(', ');

  const sharedLanguages = userA.languages.filter((lang) => userB.languages.includes(lang));

  const reasons: string[] = [
    `Kamu bisa mengajarkan ${aTeachNames} yang ingin dipelajari ${userB.displayName}.`,
    `${userB.displayName} bisa mengajarkan ${bTeachNames} yang ingin kamu pelajari.`
  ];

  if (sharedLanguages.length > 0) {
    reasons.push(`Memiliki bahasa komunikasi yang sama (${sharedLanguages.map((l) => l.toUpperCase()).join(', ')}).`);
  }

  if (userA.timezone === userB.timezone) {
    reasons.push(`Zona waktu sama (${userB.timezone}), memudahkan penjadwalan sesi.`);
  }

  const summary = `Kecocokan timbal balik: Kamu dapat berbagi ${aTeachNames}, sementara ${userB.displayName} dapat berbagi ${bTeachNames}.`;

  const bCompleteness = calculateProfileCompleteness({
    displayName: userB.displayName,
    bio: userB.bio,
    timezone: userB.timezone,
    languages: userB.languages,
    skills: userB.skills
  });

  return {
    user: {
      id: userB.id,
      displayName: userB.displayName,
      username: userB.username,
      bio: userB.bio,
      avatarUrl: userB.avatarUrl,
      timezone: userB.timezone,
      languages: userB.languages,
      profileCompleteness: bCompleteness.score,
      teachSkills: userB.skills.filter((s) => s.role === 'TEACH'),
      learnSkills: userB.skills.filter((s) => s.role === 'LEARN')
    },
    score: {
      algorithmVersion: MATCHING_ALGORITHM_VERSION,
      aToBScore,
      bToAScore,
      overallScore,
      availabilityFit: availability.fit,
      hasAvailabilityData: availability.hasData,
      note: 'Skor kecocokan relatif berdasarkan kesesuaian skill dan level dua arah (bukan probabilitas keberhasilan).'
    },
    explanation: {
      summary,
      aCanTeachB,
      bCanTeachA,
      sharedLanguages,
      reasons
    }
  };
}
