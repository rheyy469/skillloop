import { describe, expect, it } from 'vitest';
import { SKILL_LEVEL_LABELS, SUPPORTED_LANGUAGES } from '@skillloop/shared';
import { formatDateTimeWithZone } from '../components/StatusBadge';

describe('SkillLoop Web — Shared Constants & Timezone Formatting', () => {
  it('provides declarative helper descriptions for skill levels', () => {
    expect(SKILL_LEVEL_LABELS.BEGINNER.helper).toContain('bukan sertifikasi');
    expect(SUPPORTED_LANGUAGES.some((l) => l.code === 'id')).toBe(true);
  });

  it('formats UTC ISO timestamps into target IANA timezones without shifting the instant', () => {
    const iso = '2027-01-15T07:00:00.000Z';
    const jakartaFormatted = formatDateTimeWithZone(iso, 'Asia/Jakarta');
    const makassarFormatted = formatDateTimeWithZone(iso, 'Asia/Makassar');
    expect(jakartaFormatted).toBeTruthy();
    expect(makassarFormatted).toBeTruthy();
    expect(jakartaFormatted).not.toEqual(makassarFormatted);
  });
});
