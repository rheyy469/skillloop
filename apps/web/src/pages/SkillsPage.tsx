import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Trash2,
  Check,
  AlertCircle,
  BookOpen,
  Plus,
  ShieldCheck
} from 'lucide-react';
import {
  SKILL_LEVEL_LABELS,
  SkillLevel,
  SkillRole
} from '@skillloop/shared';
import {
  api,
  ApiClientError,
  CatalogSkillDto,
  SkillCategoryDto,
  SkillDeclarationDto
} from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function SkillsPage() {
  const { user, refreshUser } = useAuth();
  const { tx } = useLanguage();
  const [catalog, setCatalog] = useState<CatalogSkillDto[]>([]);
  const [categories, setCategories] = useState<SkillCategoryDto[]>([]);
  const [mySkills, setMySkills] = useState<SkillDeclarationDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Add form state (All P0 Section 3 features preserved)
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [role, setRole] = useState<SkillRole>('TEACH');
  const [level, setLevel] = useState<SkillLevel>('INTERMEDIATE');
  const [methodPreference, setMethodPreference] = useState(
    'Live 1-on-1 & Praktik Langsung'
  );
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, mineRes] = await Promise.all([
        api.skills.catalog({
          q: searchQuery || undefined,
          category: selectedCategory || undefined
        }),
        api.skills.getMine()
      ]);
      setCatalog(catRes.data);
      setCategories(catRes.meta.categories);
      setMySkills(mineRes.data.all);
      if (!selectedSkillId && catRes.data.length > 0) {
        setSelectedSkillId(catRes.data[0].id);
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal memuat katalog skill.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) return;
    setSubmitting(true);
    setFeedback(null);

    const combinedDescription = [
      description.trim(),
      methodPreference ? `[Metode: ${methodPreference}]` : '',
      role === 'TEACH' && portfolioUrl.trim()
        ? `[Portfolio: ${portfolioUrl.trim()}]`
        : ''
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 300);

    try {
      await api.skills.addMine({
        skillId: selectedSkillId,
        role,
        proficiencyLevel: role === 'TEACH' ? level : null,
        targetLevel: role === 'LEARN' ? level : null,
        description: combinedDescription || null
      });
      setDescription('');
      setPortfolioUrl('');
      await loadData();
      await refreshUser();
      setFeedback({
        type: 'success',
        message: `Skill berhasil ditambahkan ke daftar ${
          role === 'TEACH' ? 'Skills I Can Teach' : 'Skills I Want to Learn'
        }.`
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      } else {
        setFeedback({
          type: 'error',
          message: 'Gagal menambahkan deklarasi skill.'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSkill = async (userSkillId: string) => {
    setFeedback(null);
    try {
      await api.skills.deleteMine(userSkillId);
      await loadData();
      await refreshUser();
      setFeedback({
        type: 'success',
        message: 'Deklarasi skill berhasil dihapus.'
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal menghapus deklarasi skill.'
      });
    }
  };

  const handleQuickSelectFromCatalog = (skillId: string, targetRole: SkillRole) => {
    setSelectedSkillId(skillId);
    setRole(targetRole);
    setLevel(targetRole === 'TEACH' ? 'INTERMEDIATE' : 'BEGINNER');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const teachSkills = mySkills.filter((s) => s.role === 'TEACH');
  const learnSkills = mySkills.filter((s) => s.role === 'LEARN');

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-block rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
          {tx('Manajemen Profil Skill', 'Skill Profile Management')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2317] mt-2.5">
          {tx('Katalog & Deklarasi Skill', 'Skill Catalog & Declarations')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#8C7A70]">
          {tx(
            'Kelola keahlian yang bisa kamu ajarkan (Teach) dan keahlian yang ingin kamu pelajari (Learn).',
            'Manage skills you can teach and skills you want to learn.'
          )}
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 rounded-2xl p-4 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-[#4EA674]/20 text-[#2B6E48]'
              : 'bg-[#F4979C]/30 text-[#9E2A32]'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="h-4 w-4 shrink-0 text-[#4EA674]" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-[#9E2A32]" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form Input Card */}
        <div className="lg:col-span-5">
          <div className="rounded-[28px] bg-white p-6 sm:p-7 shadow-sm">
            <h2 className="text-lg font-extrabold text-[#3D2317]">
              {tx('Tambah Deklarasi Skill', 'Add Skill Declaration')}
            </h2>
            <p className="mt-1 text-xs text-[#8C7A70]">
              {tx('Pilih peran Teacher atau Learner beserta targetnya.', 'Choose Teacher or Learner role and your goal.')}
            </p>

            <form onSubmit={handleAddSkill} className="mt-5 space-y-4">
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
                  Peran (Role)
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('TEACH');
                      setLevel('INTERMEDIATE');
                    }}
                    className={`rounded-full px-4 py-2.5 text-xs font-extrabold transition ${
                      role === 'TEACH'
                        ? 'bg-[#F6C945] text-[#3D2317] shadow-sm'
                        : 'bg-[#FAF1E6] text-[#8C7A70] hover:text-[#3D2317]'
                    }`}
                  >
                    Can Teach
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('LEARN');
                      setLevel('BEGINNER');
                    }}
                    className={`rounded-full px-4 py-2.5 text-xs font-extrabold transition ${
                      role === 'LEARN'
                        ? 'bg-[#F4979C] text-[#3D2317] shadow-sm'
                        : 'bg-[#FAF1E6] text-[#8C7A70] hover:text-[#3D2317]'
                    }`}
                  >
                    Want to Learn
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="skillSelect"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Skill Kanonis
                </label>
                <select
                  id="skillSelect"
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  {catalog.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="levelSelect"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  {role === 'TEACH' ? 'Tingkat Kemampuan' : 'Target Level'}
                </label>
                <select
                  id="levelSelect"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as SkillLevel)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as SkillLevel[]).map(
                    (lvl) => (
                      <option key={lvl} value={lvl}>
                        {SKILL_LEVEL_LABELS[lvl].label} — {SKILL_LEVEL_LABELS[lvl].helper}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="methodPreference"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Metode Preferensi
                </label>
                <select
                  id="methodPreference"
                  value={methodPreference}
                  onChange={(e) => setMethodPreference(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  <option value="Live 1-on-1 & Praktik Langsung">
                    Live 1-on-1 & Praktik Langsung
                  </option>
                  <option value="Project-Based / Pair Session">
                    Project-Based / Pair Session
                  </option>
                  <option value="Code / Design Review & Diskusi">
                    Code / Design Review & Diskusi
                  </option>
                </select>
              </div>

              {role === 'TEACH' && (
                <div>
                  <label
                    htmlFor="portfolioUrl"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                  >
                    Portfolio Showcase (Opsional)
                  </label>
                  <input
                    id="portfolioUrl"
                    type="text"
                    maxLength={120}
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="github.com/username atau figma.com/@profile"
                    className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="skillDesc"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  {role === 'TEACH' ? 'Topik Bahasan' : 'Tujuan Pembelajaran'}
                </label>
                <textarea
                  id="skillDesc"
                  rows={2}
                  maxLength={220}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    role === 'TEACH'
                      ? 'Contoh: Membuat REST API dengan TypeScript...'
                      : 'Contoh: Memperdalam dasar Figma dan design token...'
                  }
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedSkillId}
                className="w-full inline-flex items-center justify-center gap-3 rounded-full bg-[#F6C945] px-6 py-3 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white disabled:opacity-50 transition shadow-md"
              >
                <span>{submitting ? 'Menyimpan...' : 'Simpan Deklarasi Skill'}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                  <BookOpen className="h-3 w-3" />
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Declared Skills Overview */}
        <div className="lg:col-span-7 space-y-6">
          {/* Can Teach */}
          <div className="rounded-[28px] bg-white p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#3D2317]/8 pb-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F6C945] px-3.5 py-1 text-xs font-extrabold text-[#3D2317]">
                Skills I Can Teach ({teachSkills.length})
              </span>
              <span className="text-[11px] font-bold text-[#8C7A70]">
                Teacher Role
              </span>
            </div>

            {teachSkills.length === 0 ? (
              <p className="mt-4 text-xs text-[#8C7A70]">
                Belum ada skill yang didaftarkan untuk diajarkan.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[#3D2317]/8">
                {teachSkills.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 py-3.5"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#3D2317]">
                          {item.skillName}
                        </span>
                        <span className="rounded-full bg-[#FAF1E6] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#EE7838]">
                          {item.proficiencyLevel || 'INTERMEDIATE'}
                        </span>
                        <span className="text-xs text-[#8C7A70]">
                          . {item.categoryName}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-xs text-[#8C7A70] leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(item.id)}
                      className="rounded-full p-2 text-[#8C7A70] hover:text-[#EE7838] hover:bg-[#FAF1E6] transition"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Want to Learn */}
          <div className="rounded-[28px] bg-white p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#3D2317]/8 pb-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F4979C]/40 px-3.5 py-1 text-xs font-extrabold text-[#3D2317]">
                Skills I Want to Learn ({learnSkills.length})
              </span>
              <span className="text-[11px] font-bold text-[#8C7A70]">
                Learner Role
              </span>
            </div>

            {learnSkills.length === 0 ? (
              <p className="mt-4 text-xs text-[#8C7A70]">
                Belum ada skill yang didaftarkan untuk dipelajari.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[#3D2317]/8">
                {learnSkills.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 py-3.5"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#3D2317]">
                          {item.skillName}
                        </span>
                        <span className="rounded-full bg-[#FAF1E6] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-[#4EA674]">
                          Target: {item.targetLevel || 'BEGINNER'}
                        </span>
                        <span className="text-xs text-[#8C7A70]">
                          . {item.categoryName}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-xs text-[#8C7A70] leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkill(item.id)}
                      className="rounded-full p-2 text-[#8C7A70] hover:text-[#EE7838] hover:bg-[#FAF1E6] transition"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Catalog Search & Browse ("Weekly Podcast" Clean Cards Grid) */}
      <div className="rounded-[32px] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-[#3D2317]/8 pb-5">
          <div>
            <h2 className="text-xl font-extrabold text-[#3D2317]">
              {tx('Eksplorasi Katalog Kanonis', 'Explore Canonical Catalog')}
            </h2>
            <p className="text-xs text-[#8C7A70]">
              {tx('Klik + Teach atau + Learn untuk langsung menambahkan ke profilmu.', 'Click + Teach or + Learn to quickly add to your profile.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#8C7A70]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari skill..."
                className="rounded-full bg-[#FAF1E6] pl-9 pr-4 py-2 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter kategori"
              className="rounded-full bg-[#FAF1E6] px-4 py-2 text-xs font-bold text-[#3D2317] focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {user?.isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#3D2317] px-4 py-2 text-xs font-extrabold text-[#F6C945] hover:bg-[#EE7838] hover:text-white transition"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{tx('Kelola & Hapus Katalog (Admin)', 'Manage & Delete Catalog (Admin)')}</span>
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-28 animate-pulse rounded-2xl bg-[#FAF1E6]" />
            ))}
          </div>
        ) : catalog.length === 0 ? (
          <p className="mt-8 text-center text-xs text-[#8C7A70]">
            Tidak ada skill yang cocok dengan kriteria pencarian.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between rounded-2xl bg-[#FAF1E6]/60 p-5 transition hover:bg-[#FAF1E6]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-[#3D2317]">
                      {s.name}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#8C7A70]">
                      {s.category.name}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[#8C7A70] line-clamp-2 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleQuickSelectFromCatalog(s.id, 'TEACH')}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-[#F6C945] py-1.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Teach</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectFromCatalog(s.id, 'LEARN')}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-full bg-white py-1.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#F4979C] transition shadow-sm"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Learn</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}