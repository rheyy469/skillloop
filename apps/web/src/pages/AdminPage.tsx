import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  BookOpen,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Search,
  Lock
} from 'lucide-react';
import { api, AdminOverviewDto, ApiClientError, CatalogSkillDto } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export function AdminPage() {
  const { tx } = useLanguage();
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState<AdminOverviewDto | null>(null);
  const [catalogSkills, setCatalogSkills] = useState<CatalogSkillDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users' | 'skills'>('overview');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [skillName, setSkillName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [aliasesText, setAliasesText] = useState('');
  const [creatingSkill, setCreatingSkill] = useState(false);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('');
  const [switchingToAdmin, setSwitchingToAdmin] = useState(false);

  const loadAdmin = async () => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [overviewRes, catRes] = await Promise.all([
        api.admin.overview(),
        api.skills.catalog()
      ]);
      setData(overviewRes.data);
      setCatalogSkills(overviewRes.data.skills || catRes.data);
      if (!categoryId && overviewRes.data.categories.length > 0) {
        setCategoryId(overviewRes.data.categories[0].id);
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal memuat data Admin Moderation Dashboard.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
  }, [user?.email, user?.isAdmin]);

  const handleSwitchToAdminAccount = async () => {
    setSwitchingToAdmin(true);
    try {
      await api.auth.login({
        email: 'raka@demo.skillloop.id',
        password: 'DemoSkillLoop123!'
      });
      await refreshUser();
    } finally {
      setSwitchingToAdmin(false);
    }
  };

  const handleReportStatus = async (
    reportId: string,
    status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED'
  ) => {
    setFeedback(null);
    try {
      await api.admin.updateReport(reportId, status);
      await loadAdmin();
      setFeedback({
        type: 'success',
        message: `Status laporan berhasil diperbarui menjadi ${status}.`
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const handleToggleUserStatus = async (userId: string, nextActive: boolean) => {
    setFeedback(null);
    try {
      await api.admin.setUserStatus(userId, nextActive);
      await loadAdmin();
      setFeedback({
        type: 'success',
        message: nextActive
          ? 'Akun pengguna berhasil diaktifkan kembali.'
          : 'Akun pengguna telah ditangguhkan (Suspended).'
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) return;
    setCreatingSkill(true);
    setFeedback(null);

    try {
      const aliases = aliasesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      const created = await api.admin.createSkill({
        name: skillName,
        categoryId,
        description: skillDesc,
        aliases
      });
      setSkillName('');
      setSkillDesc('');
      setAliasesText('');
      await loadAdmin();
      setFeedback({
        type: 'success',
        message: `Skill kanonis "${created.data.name}" berhasil ditambahkan ke katalog platform.`
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setCreatingSkill(false);
    }
  };

  const handleDeleteCatalogSkill = async (skill: CatalogSkillDto) => {
    setDeletingSkillId(skill.id);
    setFeedback(null);
    try {
      await api.admin.deleteSkill(skill.id);
      await loadAdmin();
      await refreshUser();
      setFeedback({
        type: 'success',
        message: `Skill "${skill.name}" berhasil dihapus dari Katalog Kanonis.`
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      } else {
        setFeedback({
          type: 'error',
          message: `Gagal menghapus skill "${skill.name}" dari katalog.`
        });
      }
    } finally {
      setDeletingSkillId(null);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="rounded-[32px] bg-white p-8 sm:p-10 text-center shadow-sm border border-[#3D2317]/10 space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4979C]/35 text-[#9E2A32]">
            <Lock className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-[#3D2317] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#F6C945]">
              {tx('Akses Terbatas . Khusus Admin', 'Restricted Access . Admin Only')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3D2317]">
              {tx(
                'Halaman Ini Hanya untuk Akun Administrator',
                'This Page Is Restricted to Administrator Accounts'
              )}
            </h1>
            <p className="text-xs sm:text-sm text-[#8C7A70] leading-relaxed">
              {tx(
                `Akun yang sedang aktif (${user?.displayName || 'Tamu'} — ${user?.email || ''}) adalah akun pengguna biasa dan tidak memiliki hak akses Admin & Moderasi.`,
                `The currently active account (${user?.displayName || 'Guest'}) is a standard member account and does not have Admin & Moderation privileges.`
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FAF1E6] p-4 text-left text-xs text-[#3D2317] space-y-1">
            <p className="font-extrabold">
              {tx('Ingin menguji fitur Admin & Hapus Katalog Skill?', 'Want to test Admin & Delete Catalog Skills?')}
            </p>
            <p className="text-[#8C7A70]">
              {tx(
                'Gunakan akun demo Administrator (Raka Pratama — raka@demo.skillloop.id) untuk menambah atau menghapus daftar skill di Katalog Kanonis.',
                'Switch to the Administrator demo account (Raka Pratama — raka@demo.skillloop.id) to add or delete canonical catalog skills.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={switchingToAdmin}
              onClick={handleSwitchToAdminAccount}
              className="inline-flex items-center gap-2 rounded-full bg-[#F6C945] px-6 py-3 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>
                {switchingToAdmin
                  ? tx('Beralih ke Admin...', 'Switching to Admin...')
                  : tx('Masuk sebagai Admin (Raka Pratama)', 'Switch to Admin (Raka Pratama)')}
              </span>
            </button>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#FAF1E6] px-6 py-3 text-xs font-extrabold text-[#3D2317] hover:bg-[#3D2317] hover:text-white transition"
            >
              <span>{tx('Kembali ke Dashboard', 'Back to Dashboard')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-[28px] bg-[#F3E7D8]" />
        <div className="h-72 animate-pulse rounded-[28px] bg-[#F3E7D8]" />
      </div>
    );
  }

  const { stats, users, reports, categories } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-block rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
            {tx('Admin & Moderasi', 'Admin & Moderation')}
          </span>
          <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2317]">
            {tx('Ringkasan Platform & Moderasi', 'Platform Overview & Moderation')}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-full bg-white p-1.5 shadow-sm">
          {(
            [
              { id: 'overview', label: 'Overview' },
              { id: 'reports', label: `Reports (${stats.openReports})` },
              { id: 'users', label: `Users (${stats.totalUsers})` },
              { id: 'skills', label: 'Skill Catalog' }
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                activeTab === t.id
                  ? 'bg-[#3D2317] text-white'
                  : 'text-[#8C7A70] hover:text-[#3D2317]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          className={`rounded-2xl px-5 py-3.5 text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-[#4EA674]/20 text-[#2B6E48]'
              : 'bg-[#F4979C]/30 text-[#9E2A32]'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* KPI Cards matching InsightPod 4-color palette */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] bg-[#EE7838] p-5 text-white shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider">
            Total Users
          </span>
          <p className="mt-1 text-3xl font-extrabold">{stats.totalUsers}</p>
          <p className="mt-1 text-xs opacity-85">
            {stats.activeUsers} aktif . {stats.suspendedUsers} suspended
          </p>
        </div>

        <div className="rounded-[24px] bg-[#432319] p-5 text-white shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F6C945]">
            Open Reports
          </span>
          <p className="mt-1 text-3xl font-extrabold">{stats.openReports}</p>
          <p className="mt-1 text-xs opacity-80">
            {reports.length} total laporan
          </p>
        </div>

        <div className="rounded-[24px] bg-[#4EA674] p-5 text-white shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider">
            Exchanges & Sessions
          </span>
          <p className="mt-1 text-3xl font-extrabold">
            {stats.totalRequests} / {stats.totalSessions}
          </p>
          <p className="mt-1 text-xs opacity-85">
            Request . Sesi Belajar
          </p>
        </div>

        <div className="rounded-[24px] bg-[#F6C945] p-5 text-[#3D2317] shadow-sm">
          <span className="text-[10px] font-extrabold uppercase tracking-wider">
            Canonical Catalog
          </span>
          <p className="mt-1 text-3xl font-extrabold">{stats.totalSkills}</p>
          <p className="mt-1 text-xs opacity-80">
            {stats.totalCategories} kategori skill
          </p>
        </div>
      </div>

      {/* Reports Management */}
      {(activeTab === 'overview' || activeTab === 'reports') && (
        <div className="rounded-[28px] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#3D2317]/8 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#EE7838]" />
              <h2 className="text-base font-extrabold text-[#3D2317]">
                Report Management
              </h2>
            </div>
            <span className="text-xs font-bold text-[#8C7A70]">
              {reports.length} laporan
            </span>
          </div>

          {reports.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#8C7A70]">
              Belum ada laporan pelanggaran yang masuk.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl bg-[#FAF1E6]/70 p-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#3D2317] px-2.5 py-0.5 text-[10px] font-extrabold text-[#F6C945]">
                        {r.category}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#3D2317]">
                        {r.status}
                      </span>
                      <span className="text-xs font-extrabold text-[#3D2317]">
                        Terlapor: {r.reportedUser.displayName}
                      </span>
                    </div>
                    <p className="text-xs text-[#8C7A70]">{r.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {r.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleReportStatus(r.id, 'RESOLVED')}
                        className="rounded-full bg-[#4EA674] px-3.5 py-1.5 text-[11px] font-extrabold text-white"
                      >
                        Resolve
                      </button>
                    )}
                    {r.status !== 'DISMISSED' && (
                      <button
                        type="button"
                        onClick={() => handleReportStatus(r.id, 'DISMISSED')}
                        className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-bold text-[#3D2317]"
                      >
                        Dismiss
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleUserStatus(
                          r.reportedUser.id,
                          !r.reportedUser.isActive
                        )
                      }
                      className={`rounded-full px-3.5 py-1.5 text-[11px] font-extrabold ${
                        r.reportedUser.isActive
                          ? 'bg-[#EE7838] text-white'
                          : 'bg-[#F6C945] text-[#3D2317]'
                      }`}
                    >
                      {r.reportedUser.isActive ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Management */}
      {(activeTab === 'overview' || activeTab === 'users') && (
        <div className="rounded-[28px] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#3D2317]/8 pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#4EA674]" />
              <h2 className="text-base font-extrabold text-[#3D2317]">
                User Management
              </h2>
            </div>
            <span className="text-xs font-bold text-[#8C7A70]">
              {users.length} akun
            </span>
          </div>

          <div className="divide-y divide-[#3D2317]/8">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-[#3D2317]">
                      {u.displayName}
                    </span>
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#4EA674]/20 px-2.5 py-0.5 text-[10px] font-extrabold text-[#2B6E48]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F4979C]/30 px-2.5 py-0.5 text-[10px] font-extrabold text-[#9E2A32]">
                        <XCircle className="h-3 w-3" />
                        <span>Suspended</span>
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#8C7A70]">
                    {u.email} . {u.timezone} . {u.skillsCount} skill
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleUserStatus(u.id, !u.isActive)}
                  className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                    u.isActive
                      ? 'bg-[#FAF1E6] text-[#9E2A32]'
                      : 'bg-[#4EA674] text-white'
                  }`}
                >
                  {u.isActive ? 'Suspend' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Canonical Catalog Management: Add & Delete Skills */}
      {(activeTab === 'overview' || activeTab === 'skills') && (
        <div className="space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D2317]/8 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[#EE7838]" />
                <h2 className="text-base font-extrabold text-[#3D2317]">
                  {tx('Tambah Skill Kanonis Baru', 'Add New Canonical Skill')}
                </h2>
              </div>
              <span className="rounded-full bg-[#FAF1E6] px-3 py-1 text-[10px] font-extrabold text-[#3D2317]">
                {tx('Hak Akses: Administrator', 'Access: Administrator')}
              </span>
            </div>

            <form onSubmit={handleCreateSkill} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="adminSkillName"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Nama Skill
                </label>
                <input
                  id="adminSkillName"
                  type="text"
                  required
                  minLength={2}
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="Contoh: Go (Golang)"
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="adminSkillCat"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Kategori Skill
                </label>
                <select
                  id="adminSkillCat"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="adminSkillAliases"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Alias (Pisahkan dengan koma)
                </label>
                <input
                  id="adminSkillAliases"
                  type="text"
                  value={aliasesText}
                  onChange={(e) => setAliasesText(e.target.value)}
                  placeholder="golang, go backend"
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="adminSkillDesc"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Deskripsi Skill
                </label>
                <input
                  id="adminSkillDesc"
                  type="text"
                  required
                  minLength={5}
                  value={skillDesc}
                  onChange={(e) => setSkillDesc(e.target.value)}
                  placeholder="Penjelasan singkat..."
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={creatingSkill}
                  className="inline-flex items-center gap-2 rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{creatingSkill ? 'Menambahkan...' : 'Tambah Skill ke Katalog'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Canonical Catalog List with Delete Feature */}
          <div className="rounded-[28px] bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-[#3D2317]/8 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#4EA674]" />
                  <h2 className="text-base font-extrabold text-[#3D2317]">
                    {tx(
                      `Kelola & Hapus Katalog Skill Kanonis (${catalogSkills.length} Skill)`,
                      `Manage & Delete Canonical Catalog Skills (${catalogSkills.length} Skills)`
                    )}
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-[#8C7A70]">
                  {tx(
                    'Hapus skill dari katalog kanonis jika ditambahkan secara tidak sengaja.',
                    'Delete any skill from the canonical catalog if it was added by mistake.'
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#8C7A70]" />
                  <input
                    type="search"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder={tx('Cari katalog skill...', 'Search catalog skills...')}
                    className="rounded-full bg-[#FAF1E6] pl-9 pr-4 py-1.5 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none"
                  />
                </div>

                <select
                  value={catalogCategoryFilter}
                  onChange={(e) => setCatalogCategoryFilter(e.target.value)}
                  aria-label="Filter kategori katalog"
                  className="rounded-full bg-[#FAF1E6] px-3.5 py-1.5 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  <option value="">{tx('Semua Kategori', 'All Categories')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const filteredCatalog = catalogSkills.filter((s) => {
                const matchCat =
                  !catalogCategoryFilter || s.category.id === catalogCategoryFilter;
                const q = catalogSearch.trim().toLowerCase();
                const matchSearch =
                  !q ||
                  s.name.toLowerCase().includes(q) ||
                  (s.description || '').toLowerCase().includes(q) ||
                  s.aliases.some((a) => a.toLowerCase().includes(q));
                return matchCat && matchSearch;
              });

              if (filteredCatalog.length === 0) {
                return (
                  <p className="py-6 text-center text-xs text-[#8C7A70]">
                    {tx(
                      'Tidak ada skill di katalog yang sesuai dengan filter pencarian.',
                      'No catalog skills match the current search filter.'
                    )}
                  </p>
                );
              }

              return (
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCatalog.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-col justify-between rounded-2xl bg-[#FAF1E6]/70 p-4 border border-[#3D2317]/6 transition hover:bg-[#FAF1E6]"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-extrabold text-[#3D2317]">
                            {s.name}
                          </span>
                          <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-[#8C7A70]">
                            {s.category.name}
                          </span>
                        </div>
                        {s.description && (
                          <p className="mt-1.5 text-xs text-[#8C7A70] line-clamp-2 leading-relaxed">
                            {s.description}
                          </p>
                        )}
                        {s.aliases && s.aliases.length > 0 && (
                          <p className="mt-1.5 text-[10px] font-bold text-[#8C7A70]">
                            Alias: {s.aliases.join(', ')}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[#3D2317]/8 pt-3">
                        <span className="text-[10px] font-bold text-[#8C7A70]">
                          Slug: {s.slug}
                        </span>
                        <button
                          type="button"
                          disabled={deletingSkillId === s.id}
                          onClick={() => handleDeleteCatalogSkill(s)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#F4979C]/35 px-3.5 py-1.5 text-[11px] font-extrabold text-[#9E2A32] hover:bg-[#9E2A32] hover:text-white disabled:opacity-50 transition"
                          title={tx(`Hapus ${s.name} dari katalog`, `Delete ${s.name} from catalog`)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>
                            {deletingSkillId === s.id
                              ? tx('Menghapus...', 'Deleting...')
                              : tx('Hapus Katalog', 'Delete Skill')}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}