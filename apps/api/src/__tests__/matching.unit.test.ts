import { describe, expect, it } from 'vitest';
import {
  calculateProfileCompleteness,
  computeAvailabilityFit,
  computeDirectionScore,
  computeLevelFit,
  evaluateReciprocalMatch,
  MatchableUser,
  normalizeSkillQuery
} from '../services/matching.service.js';

function makeUser(overrides: Partial<MatchableUser> & { id: string; displayName: string }): MatchableUser {
  return {
    id: overrides.id,
    displayName: overrides.displayName,
    username: overrides.username ?? null,
    bio: overrides.bio ?? 'Belajar dan berbagi pengetahuan praktis.',
    avatarUrl: overrides.avatarUrl ?? null,
    timezone: overrides.timezone ?? 'Asia/Jakarta',
    isActive: overrides.isActive ?? true,
    languages: overrides.languages ?? ['id'],
    skills: overrides.skills ?? [],
    availabilitySlots: overrides.availabilitySlots ?? []
  };
}

const JS_SKILL = {
  skillId: 'skill-js',
  skillName: 'JavaScript',
  skillSlug: 'javascript',
  categoryId: 'cat-dev',
  categoryName: 'Web Development',
  categorySlug: 'web-dev'
};

const UIUX_SKILL = {
  skillId: 'skill-uiux',
  skillName: 'UI/UX Design',
  skillSlug: 'ui-ux-design',
  categoryId: 'cat-design',
  categoryName: 'Design',
  categorySlug: 'design'
};

const PYTHON_SKILL = {
  skillId: 'skill-py',
  skillName: 'Python',
  skillSlug: 'python',
  categoryId: 'cat-data',
  categoryName: 'Data',
  categorySlug: 'data'
};

describe('Reciprocal Matching Engine — Unit Tests (PRD Section 9 & 18.1)', () => {
  it('normalizes skill queries and aliases consistently', () => {
    expect(normalizeSkillQuery('  Java   Script  ')).toBe('java script');
    expect(normalizeSkillQuery('UI/UX')).toBe('ui/ux');
  });

  it('matches two users when both directions have at least one canonical skill match', () => {
    const raka = makeUser({
      id: 'user-raka',
      displayName: 'Raka',
      skills: [
        {
          id: 'us-1',
          ...JS_SKILL,
          role: 'TEACH',
          proficiencyLevel: 'ADVANCED',
          targetLevel: null,
          description: 'ES6+'
        },
        {
          id: 'us-2',
          ...UIUX_SKILL,
          role: 'LEARN',
          proficiencyLevel: null,
          targetLevel: 'INTERMEDIATE',
          description: 'Belajar wireframe'
        }
      ]
    });

    const naya = makeUser({
      id: 'user-naya',
      displayName: 'Naya',
      skills: [
        {
          id: 'us-3',
          ...UIUX_SKILL,
          role: 'TEACH',
          proficiencyLevel: 'ADVANCED',
          targetLevel: null,
          description: 'Design system'
        },
        {
          id: 'us-4',
          ...JS_SKILL,
          role: 'LEARN',
          proficiencyLevel: null,
          targetLevel: 'BEGINNER',
          description: 'Belajar dasar DOM'
        }
      ]
    });

    const result = evaluateReciprocalMatch(raka, naya, new Set());
    expect(result).not.toBeNull();
    expect(result!.explanation.aCanTeachB).toHaveLength(1);
    expect(result!.explanation.aCanTeachB[0].skillName).toBe('JavaScript');
    expect(result!.explanation.bCanTeachA).toHaveLength(1);
    expect(result!.explanation.bCanTeachA[0].skillName).toBe('UI/UX Design');
    expect(result!.explanation.summary).toContain('JavaScript');
    expect(result!.explanation.summary).toContain('UI/UX Design');
    // Both teachers are ADVANCED teaching BEGINNER/INTERMEDIATE -> LevelFit = 100, SkillFit = 100, Availability neutral = 80
    // DirectionScore = 0.70*100 + 0.20*100 + 0.10*80 = 98
    expect(result!.score.aToBScore).toBe(98);
    expect(result!.score.bToAScore).toBe(98);
    expect(result!.score.overallScore).toBe(98);
  });

  it('rejects one-way matches (critical PRD rule 9.3)', () => {
    const raka = makeUser({
      id: 'user-raka',
      displayName: 'Raka',
      skills: [
        {
          id: 'us-1',
          ...JS_SKILL,
          role: 'TEACH',
          proficiencyLevel: 'ADVANCED',
          targetLevel: null,
          description: null
        },
        {
          id: 'us-2',
          ...UIUX_SKILL,
          role: 'LEARN',
          proficiencyLevel: null,
          targetLevel: 'BEGINNER',
          description: null
        }
      ]
    });

    // One-way: Candidate wants JS (which Raka teaches), but only teaches Python (which Raka does NOT want)
    const oneWayCandidate = makeUser({
      id: 'user-oneway',
      displayName: 'OneWay',
      skills: [
        {
          id: 'us-3',
          ...PYTHON_SKILL,
          role: 'TEACH',
          proficiencyLevel: 'ADVANCED',
          targetLevel: null,
          description: null
        },
        {
          id: 'us-4',
          ...JS_SKILL,
          role: 'LEARN',
          proficiencyLevel: null,
          targetLevel: 'BEGINNER',
          description: null
        }
      ]
    });

    const result = evaluateReciprocalMatch(raka, oneWayCandidate, new Set());
    expect(result).toBeNull();
  });

  it('excludes blocked users and inactive accounts', () => {
    const userA = makeUser({
      id: 'user-a',
      displayName: 'User A',
      skills: [
        {
          id: '1',
          ...JS_SKILL,
          role: 'TEACH',
          proficiencyLevel: 'INTERMEDIATE',
          targetLevel: null,
          description: null
        },
        {
          id: '2',
          ...UIUX_SKILL,
          role: 'LEARN',
          proficiencyLevel: null,
          targetLevel: 'BEGINNER',
          description: null
        }
      ]
    });

    const userB = makeUser({
      id: 'user-b',
      displayName: 'User B',
      skills: [
        {
          id: '3',
          ...UIUX_SKILL,
          role: 'TEACH',
          proficiencyLevel: 'INTERMEDIATE',
          targetLevel: null,
          description: null
        },
        {
          id: '4',
          ...JS_SKILL,
          role: 'LEARN',
          proficiencyLevel: null,
          targetLevel: 'BEGINNER',
          description: null
        }
      ]
    });

    // Blocked check
    expect(evaluateReciprocalMatch(userA, userB, new Set(['user-b']))).toBeNull();

    // Inactive check
    const inactiveB = { ...userB, isActive: false };
    expect(evaluateReciprocalMatch(userA, inactiveB, new Set())).toBeNull();
  });

  it('penalizes imbalanced matches using 0.65 * min + 0.35 * avg formula', () => {
    // Teacher BEGINNER vs Learner ADVANCED -> LevelFit = 30
    expect(computeLevelFit('BEGINNER', 'ADVANCED')).toBe(30);
    // Teacher ADVANCED vs Learner BEGINNER -> LevelFit = 100
    expect(computeLevelFit('ADVANCED', 'BEGINNER')).toBe(100);

    const strongDirection = computeDirectionScore(
      [
        {
          ...JS_SKILL,
          teacherLevel: 'ADVANCED',
          learnerTargetLevel: 'BEGINNER',
          teacherDescription: null,
          learnerDescription: null,
          skillFit: 100,
          levelFit: 100
        }
      ],
      80
    ); // 70 + 20 + 8 = 98

    const weakDirection = computeDirectionScore(
      [
        {
          ...UIUX_SKILL,
          teacherLevel: 'BEGINNER',
          learnerTargetLevel: 'ADVANCED',
          teacherDescription: null,
          learnerDescription: null,
          skillFit: 100,
          levelFit: 30
        }
      ],
      80
    ); // 70 + 6 + 8 = 84

    expect(strongDirection).toBe(98);
    expect(weakDirection).toBe(84);
  });

  it('computes availability fit when slots overlap and neutral when absent', () => {
    const neutral = computeAvailabilityFit([], []);
    expect(neutral.hasData).toBe(false);
    expect(neutral.fit).toBe(80);

    const overlap = computeAvailabilityFit(
      [{ dayOfWeek: 1, startMinute: 600, endMinute: 780, timezone: 'Asia/Jakarta' }],
      [{ dayOfWeek: 1, startMinute: 630, endMinute: 750, timezone: 'Asia/Jakarta' }]
    );
    expect(overlap.hasData).toBe(true);
    expect(overlap.fit).toBe(100);
  });

  it('calculates profile completeness and missing steps accurately', () => {
    const incomplete = calculateProfileCompleteness({
      displayName: 'Raka',
      bio: null,
      timezone: 'Asia/Jakarta',
      languages: ['id'],
      skills: [{ role: 'TEACH' }]
    });
    expect(incomplete.isComplete).toBe(false);
    expect(incomplete.score).toBe(65);
    expect(incomplete.missingSteps.length).toBe(2);
  });
});
