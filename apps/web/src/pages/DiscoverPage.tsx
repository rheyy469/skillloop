import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, BookOpen, Search, RotateCcw } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@skillloop/shared';
import {
  api,
  ReciprocalMatchDto,
  SkillCategoryDto
} from '../lib/api';
import { RequestStatusBadge, SkillChip } from '../components/StatusBadge';
import { CharacterPortrait } from '../components/CharacterPortraits';
import { useLanguage } from '../context/LanguageContext';

const AVATAR_BG = ['bg-[#EE7838]', 'bg-[#432319]', 'bg-[#4EA674]', 'bg-[#F6C945]'];

export function DiscoverPage() {
  const { tx } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [matches, setMatches] = useState<ReciprocalMatchDto[]>([]);
  const [categories, setCategories] = useState<SkillCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  // All P0 & P2 Filters Always Visible & Accessible
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState('overall');
  const [searchFilter, setSearchFilter] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null && qParam !== searchFilter) {
      setSearchFilter(qParam);
    }
  }, [searchParams]);

  const loadMatches = async () => {
    setLoading(true);
    try {
      const [matchRes, skillRes] = await Promise.all([
        api.matches.list({
          category: categoryFilter || undefined,
          language: languageFilter || undefined,
          level: levelFilter || undefined,
          availability: availabilityFilter || undefined,
          minScore: minScoreFilter > 0 ? minScoreFilter : undefined,
          sortBy,
          search: searchFilter || undefined
        }),
        api.skills.catalog()
      ]);
      setMatches(matchRes.data);
      setCategories(skillRes.meta.categories);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, [
    categoryFilter,
    languageFilter,
    levelFilter,
    availabilityFilter,
    minScoreFilter,
    sortBy,
    searchFilter
  ]);

  const resetFilters = () => {
    setCategoryFilter('');
    setLanguageFilter('');
    setLevelFilter('');
    setAvailabilityFilter('');
    setMinScoreFilter(0);
    setSortBy('overall');
    setSearchFilter('');
    if (searchParams.has('q')) {
      setSearchParams({});
    }
  };

  const hasActiveFilters = Boolean(
    categoryFilter ||
      languageFilter ||
      levelFilter ||
      availabilityFilter ||
      minScoreFilter > 0 ||
      sortBy !== 'overall' ||
      searchFilter
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-block rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
            {tx('Katalog Rekomendasi', 'Recommended Catalog')}
          </span>
          <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2317]">
            {tx('Temukan Partner Pertukaran Skill', 'Discover Skill Exchange Partners')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#8C7A70] max-w-2xl">
            {tx(
              'Algoritma hanya menampilkan kandidat aktif di mana terjadi kecocokan dua arah (kamu mengajarkan apa yang mereka butuhkan, dan sebaliknya).',
              'Our reciprocal engine exclusively lists active candidates with mutual two-way skill compatibility.'
            )}
          </p>
        </div>

        <Link
          to="/skills"
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-[#3D2317] shadow-sm hover:bg-[#F6C945] transition"
        >
          <span>{tx('Kelola Skill Saya', 'Manage My Skills')}</span>
        </Link>
      </div>

      {/* Complete Filter Bar (All P0 & P2 Filters Visible) */}
      <div className="rounded-[28px] bg-white p-5 shadow-sm space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search className="pointer-events-none absolute left-4 top-3 h-4 w-4 text-[#8C7A70]" />
            <input
              type="search"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={tx('Cari nama partner atau skill...', 'Search partner name or skill...')}
              className="w-full rounded-full bg-[#FAF1E6] pl-10 pr-4 py-2.5 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none focus:ring-2 focus:ring-[#F6C945]"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter kategori skill"
              className="w-full rounded-full bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317] focus:outline-none"
            >
              <option value="">{tx('Semua Kategori', 'All Categories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              aria-label="Filter bahasa"
              className="w-full rounded-full bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317] focus:outline-none"
            >
              <option value="">{tx('Semua Bahasa', 'All Languages')}</option>
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              aria-label="Filter ketersediaan jadwal"
              className="w-full rounded-full bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317] focus:outline-none"
            >
              <option value="">{tx('Semua Jadwal', 'All Schedules')}</option>
              <option value="compatible">{tx('Jadwal Cocok (>=80%)', 'Compatible Schedule (>=80%)')}</option>
              <option value="same_timezone">{tx('Zona Waktu Sama', 'Same Timezone')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 lg:col-span-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              aria-label="Filter level pengajar"
              className="w-full rounded-full bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317] focus:outline-none"
            >
              <option value="">{tx('Semua Level', 'All Levels')}</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                title={tx('Reset filter', 'Reset filters')}
                className="shrink-0 rounded-full bg-[#FAF1E6] p-2.5 text-[#3D2317] hover:bg-[#F4979C]/40 transition"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Smart Ranking Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#3D2317]/8 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-[#432319] px-3 py-0.5 text-[10px] font-extrabold text-[#F6C945]">
              SMART RANKING
            </span>
            <label className="inline-flex items-center gap-2 font-bold text-[#3D2317]">
              <span>Min Fit Score:</span>
              <select
                value={minScoreFilter}
                onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                className="rounded-full bg-[#FAF1E6] px-3 py-1 text-xs font-extrabold text-[#3D2317]"
              >
                <option value={0}>{tx('Semua Skor', 'All Scores')}</option>
                <option value={80}>&ge; 80% (Strong Match)</option>
                <option value={90}>&ge; 90% (Top Reciprocal Fit)</option>
              </select>
            </label>
          </div>

          <label className="inline-flex items-center gap-2 font-bold text-[#3D2317]">
            <span>{tx('Urutkan Ranking:', 'Sort Ranking:')}</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-full bg-[#FAF1E6] px-3 py-1 text-xs font-extrabold text-[#3D2317]"
            >
              <option value="overall">Overall Reciprocal Score (Default)</option>
              <option value="availability">{tx('Ketersediaan Waktu (Availability Fit)', 'Schedule Availability (Availability Fit)')}</option>
              <option value="completeness">{tx('Kelengkapan Profil Partner', 'Partner Profile Completeness')}</option>
            </select>
          </label>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-52 animate-pulse rounded-[28px] bg-[#F3E7D8]" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-[32px] bg-white p-12 text-center shadow-sm">
          <ArrowLeftRight className="mx-auto h-10 w-10 text-[#EE7838]" />
          <h2 className="mt-3 text-base font-extrabold text-[#3D2317]">
            {tx('Belum ada kandidat reciprocal match', 'No reciprocal match candidates yet')}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-[#8C7A70]">
            {tx(
              'Kandidat hanya muncul saat ada kecocokan dua arah. Tambahkan keahlian pada daftar Can Teach atau Want to Learn.',
              'Candidates only appear when there is a mutual two-way match. Add skills to your Can Teach or Want to Learn lists.'
            )}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full bg-[#FAF1E6] px-5 py-2.5 text-xs font-bold text-[#3D2317]"
              >
                {tx('Reset Filter', 'Reset Filters')}
              </button>
            )}
            <Link
              to="/skills"
              className="rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317]"
            >
              {tx('Tambah Skill', 'Add Skill')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {matches.map((match, idx) => {
            const avatarColor = AVATAR_BG[idx % AVATAR_BG.length];
            return (
              <div
                key={match.user.id}
                className="rounded-[28px] bg-white p-6 shadow-sm transition hover:shadow-md space-y-4"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl ${avatarColor} pt-1 flex items-end justify-center shadow-sm`}
                    >
                      <CharacterPortrait variant={idx} className="h-15 w-15" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg sm:text-xl font-extrabold text-[#3D2317]">
                          {match.user.displayName}
                        </h2>
                        <span className="text-xs font-bold text-[#8C7A70]">
                          {match.user.username ? `@${match.user.username} - ` : '- '}
                          Profil {match.user.profileCompleteness}%
                        </span>
                        {match.existingRequestStatus && (
                          <RequestStatusBadge status={match.existingRequestStatus} />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-[#8C7A70]">
                        {match.user.timezone} . Bahasa: {match.user.languages.map((l) => l.toUpperCase()).join(', ')} . Jadwal Cocok {match.score.availabilityFit}%
                      </p>
                      {match.user.bio && (
                        <p className="mt-1.5 text-xs text-[#8C7A70] line-clamp-2 max-w-2xl">
                          {match.user.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <span
                      title={match.score.note}
                      className="rounded-full bg-[#EE7838] px-4 py-1 text-xs font-extrabold text-white shadow-sm"
                    >
                      Fit: {match.score.overallScore}%
                    </span>

                    <Link
                      to={`/matches/${match.user.id}`}
                      className="group inline-flex items-center gap-2.5 rounded-full bg-[#F6C945] pl-5 pr-2 py-2 text-xs font-extrabold text-[#3D2317] shadow-sm hover:bg-[#432319] hover:text-white transition"
                    >
                      <span>{tx('Detail & Ajukan', 'View & Propose')}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                        <BookOpen className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Match Explanation */}
                <div className="rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs text-[#3D2317] space-y-1">
                  <div>
                    <span className="font-extrabold">
                      {tx('Alasan Rekomendasi: ', 'Compatibility Explanation: ')}
                    </span>
                    {match.explanation.summary}
                  </div>
                  <div className="text-[11px] font-bold text-[#4EA674]">
                    • Keseimbangan pertukaran dua arah {100 - Math.abs(match.score.aToBScore - match.score.bToAScore)}% dengan irisan ketersediaan waktu {match.score.availabilityFit}% di zona {match.user.timezone}.
                  </div>
                </div>

                {/* Two-Column Skill Exchange Card */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#FAF1E6]/60 p-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-extrabold uppercase tracking-wider text-[#4EA674]">
                        {tx('Kamu Ajarkan', 'You Teach')}
                      </span>
                      <span className="font-bold text-[#8C7A70]">
                        {tx('Skor A→B:', 'Score A→B:')} {match.score.aToBScore}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.explanation.aCanTeachB.map((pair) => (
                        <SkillChip
                          key={pair.skillId}
                          name={pair.skillName}
                          role="TEACH"
                          level={pair.teacherLevel}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#FAF1E6]/60 p-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-extrabold uppercase tracking-wider text-[#EE7838]">
                        {tx('Mereka Ajarkan', 'They Teach')}
                      </span>
                      <span className="font-bold text-[#8C7A70]">
                        {tx('Skor B→A:', 'Score B→A:')} {match.score.bToAScore}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {match.explanation.bCanTeachA.map((pair) => (
                        <SkillChip
                          key={pair.skillId}
                          name={pair.skillName}
                          role="LEARN"
                          level={pair.teacherLevel}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
