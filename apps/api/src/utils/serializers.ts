import { FullUserProfile, UserSkillRecord } from '../lib/store.js';
import {
  calculateProfileCompleteness,
  MatchableSkillDeclaration,
  MatchableUser
} from '../services/matching.service.js';

export function serializeUserSkill(us: UserSkillRecord): MatchableSkillDeclaration {
  return {
    id: us.id,
    skillId: us.skillId,
    skillName: us.skill.name,
    skillSlug: us.skill.slug,
    categoryId: us.skill.category.id,
    categoryName: us.skill.category.name,
    categorySlug: us.skill.category.slug,
    role: us.role,
    proficiencyLevel: us.proficiencyLevel,
    targetLevel: us.targetLevel,
    description: us.description
  };
}

export function toMatchableUser(profile: FullUserProfile): MatchableUser {
  return {
    id: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    timezone: profile.timezone,
    isActive: profile.isActive,
    languages: profile.languages.map((l) => l.languageCode),
    skills: profile.skills.map(serializeUserSkill),
    availabilitySlots: profile.availabilitySlots.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startMinute: a.startMinute,
      endMinute: a.endMinute,
      timezone: a.timezone
    }))
  };
}

export function toOwnProfileDto(profile: FullUserProfile) {
  const languages = profile.languages.map((l) => l.languageCode);
  const skills = profile.skills.map(serializeUserSkill);
  const completeness = calculateProfileCompleteness({
    displayName: profile.displayName,
    bio: profile.bio,
    timezone: profile.timezone,
    languages,
    skills
  });
  const emailLower = profile.email.toLowerCase();
  const isAdmin =
    emailLower === 'raka@demo.skillloop.id' || emailLower.startsWith('admin@');

  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    timezone: profile.timezone,
    isAdmin,
    languages,
    skills,
    teachSkills: skills.filter((s) => s.role === 'TEACH'),
    learnSkills: skills.filter((s) => s.role === 'LEARN'),
    completeness,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

/**
 * Public profile DTO — strictly omits email, passwordHash, and private metadata (PRD 8.2 & 14.4).
 */
export function toPublicProfileDto(profile: FullUserProfile) {
  const languages = profile.languages.map((l) => l.languageCode);
  const skills = profile.skills.map(serializeUserSkill);
  const completeness = calculateProfileCompleteness({
    displayName: profile.displayName,
    bio: profile.bio,
    timezone: profile.timezone,
    languages,
    skills
  });

  return {
    id: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    timezone: profile.timezone,
    languages,
    teachSkills: skills.filter((s) => s.role === 'TEACH'),
    learnSkills: skills.filter((s) => s.role === 'LEARN'),
    profileCompleteness: completeness.score
  };
}
