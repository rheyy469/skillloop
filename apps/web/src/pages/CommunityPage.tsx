import React, { useEffect, useState } from 'react';
import {
  Users,
  Video,
  Plus,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { api, ApiClientError, CommunityGroupDto } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function CommunityPage() {
  const { user } = useAuth();
  const { tx } = useLanguage();
  const [groups, setGroups] = useState<CommunityGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [name, setName] = useState('');
  const [skillFocus, setSkillFocus] = useState('');
  const [categoryName] = useState('Web & Product Design');
  const [scheduleNote, setScheduleNote] = useState('Sabtu . 19:30 WIB (UTC+7)');
  const [meetingLink, setMeetingLink] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await api.groups.list();
      setGroups(res.data);
    } catch {
      setFeedback({
        type: 'error',
        message: tx(
          'Gagal memuat daftar Community Learning Groups.',
          'Failed to load Community Learning Groups.'
        )
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleToggleJoin = async (groupId: string) => {
    setFeedback(null);
    try {
      await api.groups.toggleJoin(groupId);
      await loadGroups();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);
    try {
      await api.groups.create({
        name,
        skillFocus,
        categoryName,
        scheduleNote,
        meetingLink: meetingLink.trim() || null,
        description
      });
      setName('');
      setSkillFocus('');
      setMeetingLink('');
      setDescription('');
      await loadGroups();
      setFeedback({
        type: 'success',
        message: tx(
          'Kelompok belajar komunitas baru berhasil dibuat!',
          'New community study circle created successfully!'
        )
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setCreating(false);
    }
  };

  const badgeColors = ['bg-[#4EA674]', 'bg-[#EE7838]', 'bg-[#F4979C]'];

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-block rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
          {tx('Kelompok Belajar Komunitas', 'Community Learning Circles')}
        </span>
        <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2317]">
          {tx('Kelompok Belajar Komunitas', 'Community Learning Circles')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#8C7A70]">
          {tx(
            'Bergabung dalam lingkaran belajar bersama dengan ruang video online terintegrasi.',
            'Join peer learning circles with integrated online video rooms.'
          )}
        </p>
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

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            [1, 2].map((n) => (
              <div key={n} className="h-40 animate-pulse rounded-[28px] bg-[#F3E7D8]" />
            ))
          ) : (
            groups.map((g, idx) => {
              const joined = user ? g.memberIds.includes(user.id) : false;
              return (
                <div
                  key={g.id}
                  className="rounded-[28px] bg-white p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                          badgeColors[idx % badgeColors.length]
                        } text-white font-extrabold text-sm shadow-sm`}
                      >
                        {g.membersCount}
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-[#3D2317]">
                          {g.name}
                        </h2>
                        <span className="mt-1 inline-block rounded-full bg-[#FAF1E6] px-3 py-0.5 text-xs font-bold text-[#EE7838]">
                          {g.skillFocus}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {g.meetingLink && (
                        <a
                          href={g.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF1E6] px-4 py-2 text-xs font-extrabold text-[#3D2317] hover:bg-[#F6C945] transition"
                        >
                          <Video className="h-3.5 w-3.5 text-[#EE7838]" />
                          <span>Video Room</span>
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleJoin(g.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-extrabold transition shadow-sm ${
                          joined
                            ? 'bg-[#4EA674] text-white'
                            : 'bg-[#F6C945] text-[#3D2317] hover:bg-[#EE7838] hover:text-white'
                        }`}
                      >
                        {joined ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{tx('Terdaftar', 'Joined')}</span>
                          </>
                        ) : (
                          <>
                            <Users className="h-3.5 w-3.5" />
                            <span>{tx('Gabung', 'Join')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-[#8C7A70]">
                    {g.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#3D2317]/8 pt-3 text-xs text-[#8C7A70]">
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#3D2317]">
                      <Calendar className="h-3.5 w-3.5 text-[#4EA674]" />
                      <span>{g.scheduleNote}</span>
                    </span>
                    <span>
                      {tx('Inisiator:', 'Host:')} <strong className="text-[#3D2317]">{g.creatorName}</strong>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create New Learning Group Form */}
        <div className="lg:col-span-4 rounded-[28px] bg-white p-6 shadow-sm">
          <span className="inline-block rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
            {tx('Buat Kelompok Baru', 'Create New Circle')}
          </span>
          <h2 className="mt-2 text-lg font-extrabold text-[#3D2317]">
            {tx('Bentuk Community Circle', 'Start a Community Circle')}
          </h2>

          <form onSubmit={handleCreateGroup} className="mt-4 space-y-3.5">
            <div>
              <label
                htmlFor="grpName"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                {tx('Nama Kelompok', 'Circle Name')}
              </label>
              <input
                id="grpName"
                type="text"
                required
                minLength={3}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tx('Contoh: TypeScript & UI Design Jam', 'e.g., TypeScript & UI Design Jam')}
                className="mt-1 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="grpFocus"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                {tx('Skill yang Dipertukarkan', 'Exchanged Skills')}
              </label>
              <input
                id="grpFocus"
                type="text"
                required
                minLength={3}
                value={skillFocus}
                onChange={(e) => setSkillFocus(e.target.value)}
                placeholder={tx('Contoh: TypeScript ⇄ Figma', 'e.g., TypeScript ⇄ Figma')}
                className="mt-1 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="grpSchedule"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                {tx('Jadwal Pertemuan', 'Meeting Schedule')}
              </label>
              <input
                id="grpSchedule"
                type="text"
                required
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value)}
                className="mt-1 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="grpLink"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                {tx('Tautan Video Room (Opsional)', 'Video Room Link (Optional)')}
              </label>
              <input
                id="grpLink"
                type="text"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder={tx('Otomatis Jitsi jika kosong', 'Auto-generated Jitsi link if empty')}
                className="mt-1 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="grpDesc"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                {tx('Deskripsi Kelompok', 'Circle Description')}
              </label>
              <textarea
                id="grpDesc"
                required
                minLength={5}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={tx('Jelaskan topik diskusi...', 'Describe discussion topics...')}
                className="mt-1 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#F6C945] px-5 py-3 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                {creating
                  ? tx('Membuat...', 'Creating...')
                  : tx('Buat Kelompok Belajar', 'Create Study Circle')}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}