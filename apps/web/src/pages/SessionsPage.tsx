import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Star,
  CheckCircle2,
  Plus,
  BookOpen,
  Trash2,
  Video
} from 'lucide-react';
import {
  api,
  ApiClientError,
  CollaborationRequestDto,
  LearningMilestoneDto,
  LearningSessionDto,
  SessionFeedbackDto
} from '../lib/api';
import {
  formatDateTimeWithZone,
  SessionStatusBadge
} from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function SessionsPage() {
  const { user, refreshNotifications } = useAuth();
  const { tx } = useLanguage();
  const [sessions, setSessions] = useState<LearningSessionDto[]>([]);
  const [milestones, setMilestones] = useState<LearningMilestoneDto[]>([]);
  const [activeRequests, setActiveRequests] = useState<CollaborationRequestDto[]>([]);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, SessionFeedbackDto[]>>({});
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [rescheduleTarget, setRescheduleTarget] =
    useState<LearningSessionDto | null>(null);
  const [newStartLocal, setNewStartLocal] = useState('');
  const [newDuration, setNewDuration] = useState(60);

  const [reviewTarget, setReviewTarget] = useState<LearningSessionDto | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const [milestoneRequestId, setMilestoneRequestId] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneNotes, setMilestoneNotes] = useState('');
  const [milestoneProgress, setMilestoneProgress] = useState(50);
  const [creatingMilestone, setCreatingMilestone] = useState(false);

  const loadSessionsAndProgress = async () => {
    setLoading(true);
    try {
      const [sessRes, progRes, reqRes] = await Promise.all([
        api.sessions.list(statusFilter || undefined),
        api.progress.list(),
        api.requests.list({ status: 'ACCEPTED' })
      ]);
      setSessions(sessRes.data);
      setMilestones(progRes.data);
      setActiveRequests(reqRes.data);
      if (!milestoneRequestId && reqRes.data.length > 0) {
        setMilestoneRequestId(reqRes.data[0].id);
      }

      const completed = sessRes.data.filter((s) => s.status === 'COMPLETED');
      const fbEntries = await Promise.all(
        completed.map(async (s) => {
          try {
            const r = await api.sessions.listFeedback(s.id);
            return [s.id, r.data] as const;
          } catch {
            return [s.id, []] as const;
          }
        })
      );
      setFeedbackMap(Object.fromEntries(fbEntries));
      await refreshNotifications();
    } catch {
      setFeedback({
        type: 'error',
        message: tx(
          'Gagal memuat daftar sesi belajar dan progress.',
          'Failed to load learning sessions and progress.'
        )
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionsAndProgress();
  }, [statusFilter]);

  const handleSessionAction = async (
    sessionId: string,
    action: 'CONFIRM' | 'COMPLETE' | 'CANCEL'
  ) => {
    setFeedback(null);
    let cancelReason: string | null = null;
    if (action === 'CANCEL') {
      const input = window.prompt(
        tx('Alasan pembatalan sesi (opsional):', 'Reason for cancelling session (optional):'),
        tx('Jadwal bertabrakan, mari atur ulang.', 'Schedule conflict, let us reschedule.')
      );
      if (input === null) return;
      cancelReason = input;
    }

    try {
      await api.sessions.update(sessionId, {
        action,
        ...(cancelReason ? { cancelReason } : {})
      });
      await loadSessionsAndProgress();
      setFeedback({
        type: 'success',
        message:
          action === 'CONFIRM'
            ? tx('Jadwal sesi berhasil dikonfirmasi.', 'Session schedule confirmed.')
            : action === 'COMPLETE'
            ? tx(
                'Selamat! Sesi belajar telah ditandai selesai.',
                'Great! Learning session marked as completed.'
              )
            : tx('Sesi belajar telah dibatalkan.', 'Learning session has been cancelled.')
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setFeedback(null);

    try {
      const isoUtc = new Date(newStartLocal).toISOString();
      await api.sessions.update(rescheduleTarget.id, {
        action: 'RESCHEDULE',
        startAt: isoUtc,
        durationMinutes: newDuration,
        timezone: user?.timezone || rescheduleTarget.timezone
      });
      setRescheduleTarget(null);
      await loadSessionsAndProgress();
      setFeedback({
        type: 'success',
        message: tx(
          'Jadwal baru diusulkan dan menunggu konfirmasi partner.',
          'New schedule proposed and awaiting partner confirmation.'
        )
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;
    setSubmittingReview(true);
    setFeedback(null);

    try {
      await api.sessions.submitFeedback(reviewTarget.id, {
        rating,
        comment
      });
      setReviewTarget(null);
      setComment('');
      setRating(5);
      await loadSessionsAndProgress();
      setFeedback({
        type: 'success',
        message: tx(
          'Feedback & rating berhasil dikirim.',
          'Feedback & rating submitted successfully.'
        )
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetReqId =
      milestoneRequestId || activeRequests[0]?.id || '11111111-1111-4111-8111-111111111101';
    setCreatingMilestone(true);
    setFeedback(null);
    try {
      await api.progress.create({
        requestId: targetReqId,
        title: milestoneTitle,
        notes: milestoneNotes.trim() || null,
        progressPercent: milestoneProgress
      });
      setMilestoneTitle('');
      setMilestoneNotes('');
      setMilestoneProgress(50);
      await loadSessionsAndProgress();
      setFeedback({
        type: 'success',
        message: tx(
          'Milestone & catatan belajar berhasil disimpan.',
          'Milestone & learning notes saved successfully.'
        )
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setCreatingMilestone(false);
    }
  };

  const handleToggleMilestone = async (m: LearningMilestoneDto) => {
    try {
      await api.progress.update(m.id, {
        isCompleted: !m.isCompleted,
        progressPercent: !m.isCompleted ? 100 : 50
      });
      await loadSessionsAndProgress();
    } catch {
      // Ignore
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      await api.progress.delete(id);
      await loadSessionsAndProgress();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="inline-block rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
            {tx('Sesi, Progress & Feedback', 'Sessions & Progress')}
          </span>
          <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2317]">
            {tx('Jadwal Sesi & Milestone Belajar', 'Learning Schedule & Milestones')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#8C7A70]">
            {tx(
              'Kelola jadwal sesi lintas zona waktu, catat milestone, dan berikan ulasan sesi.',
              'Manage cross-timezone sessions, track milestones, and submit session ratings.'
            )}
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter status sesi"
          className="rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#3D2317] shadow-sm focus:outline-none"
        >
          <option value="">{tx('Semua Status Sesi', 'All Session Statuses')}</option>
          <option value="PROPOSED">PROPOSED</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
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

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-36 animate-pulse rounded-[28px] bg-[#F3E7D8]" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-[32px] bg-white p-12 text-center shadow-sm">
          <Clock className="mx-auto h-10 w-10 text-[#EE7838]" />
          <h2 className="mt-3 text-base font-extrabold text-[#3D2317]">
            {tx('Belum ada sesi belajar terjadwal', 'No scheduled learning sessions yet')}
          </h2>
          <Link
            to="/requests"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317]"
          >
            <span>{tx('Buka Permintaan Pertukaran', 'Open Exchange Requests')}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s, idx) => {
            const isSender = s.request.senderId === user?.id;
            const partner = isSender ? s.request.recipient : s.request.sender;
            const isProposedByMe = s.proposedBy === user?.id;
            const sessionFeedbacks = feedbackMap[s.id] || [];
            const myReview = sessionFeedbacks.find((f) => f.reviewerId === user?.id);
            const badgeBgs = ['bg-[#4EA674]', 'bg-[#F4979C]', 'bg-[#EE7838]'];

            return (
              <div
                key={s.id}
                className="rounded-[28px] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4 sm:flex-row sm:items-start"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ${
                      badgeBgs[idx % badgeBgs.length]
                    } text-white font-extrabold text-xs h-12 w-12 shadow-sm`}
                  >
                    {s.durationMinutes}m
                  </div>

                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-extrabold text-[#3D2317]">
                        {s.topic}
                      </h2>
                      <SessionStatusBadge status={s.status} />
                    </div>

                    <p className="text-xs text-[#8C7A70]">
                      Partner: <strong className="text-[#3D2317]">{partner.displayName}</strong> . Diajukan oleh {s.proposer.displayName}
                    </p>

                    <div className="grid gap-2.5 rounded-2xl bg-[#FAF1E6]/70 p-3.5 text-xs sm:grid-cols-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-[#4EA674]">
                          Zona Anda ({user?.timezone}):
                        </span>
                        <p className="font-extrabold text-[#3D2317] mt-0.5">
                          {formatDateTimeWithZone(s.startAt, user?.timezone)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-[#EE7838]">
                          Zona {partner.displayName} ({partner.timezone}):
                        </span>
                        <p className="font-extrabold text-[#3D2317] mt-0.5">
                          {formatDateTimeWithZone(s.startAt, partner.timezone)}
                        </p>
                      </div>
                    </div>

                    {s.status === 'COMPLETED' && sessionFeedbacks.length > 0 && (
                      <div className="space-y-1.5 rounded-2xl bg-[#FAF1E6] p-3">
                        {sessionFeedbacks.map((fb) => (
                          <div key={fb.id} className="text-xs text-[#3D2317]">
                            <span className="font-extrabold">
                              {fb.reviewerName || 'Partner'} ({fb.rating}/5 ★):
                            </span>{' '}
                            <span className="text-[#8C7A70]">{fb.comment}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {s.status === 'PROPOSED' && !isProposedByMe && (
                    <button
                      type="button"
                      onClick={() => handleSessionAction(s.id, 'CONFIRM')}
                      className="rounded-full bg-[#4EA674] px-5 py-2 text-xs font-extrabold text-white shadow-sm"
                    >
                      Setujui Jadwal
                    </button>
                  )}

                  {s.status === 'SCHEDULED' && (
                    <>
                      <a
                        href={`https://meet.jit.si/SkillLoop-Session-${s.id.slice(0, 8)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#F6C945] px-4 py-2 text-xs font-extrabold text-[#3D2317] shadow-sm"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Video Room</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleSessionAction(s.id, 'COMPLETE')}
                        className="rounded-full bg-[#3D2317] px-4 py-2 text-xs font-extrabold text-white"
                      >
                        Tandai Selesai
                      </button>
                    </>
                  )}

                  {s.status === 'COMPLETED' && !myReview && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewTarget(s);
                        setRating(5);
                        setComment('');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#F6C945] px-5 py-2 text-xs font-extrabold text-[#3D2317]"
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span>Beri Rating</span>
                    </button>
                  )}

                  {s.status === 'COMPLETED' && myReview && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#4EA674]/20 px-3.5 py-1.5 text-xs font-extrabold text-[#2B6E48]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Rated {myReview.rating}/5</span>
                    </span>
                  )}

                  {(s.status === 'PROPOSED' || s.status === 'SCHEDULED') && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRescheduleTarget(s);
                          setNewDuration(s.durationMinutes);
                          const dt = new Date(s.startAt);
                          const localIso = new Date(
                            dt.getTime() - dt.getTimezoneOffset() * 60000
                          )
                            .toISOString()
                            .slice(0, 16);
                          setNewStartLocal(localIso);
                        }}
                        className="rounded-full bg-[#FAF1E6] px-4 py-2 text-xs font-bold text-[#3D2317]"
                      >
                        Ubah Jadwal
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSessionAction(s.id, 'CANCEL')}
                        className="rounded-full bg-[#F4979C]/30 px-4 py-2 text-xs font-bold text-[#9E2A32]"
                      >
                        Batalkan
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Milestones & Learning Notes */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-5 rounded-[28px] bg-white p-6 shadow-sm">
          <span className="inline-block rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
            Learning Progress
          </span>
          <h2 className="mt-2 text-lg font-extrabold text-[#3D2317]">
            {tx('Tambah Milestone Belajar', 'Add Learning Milestone')}
          </h2>

          <form onSubmit={handleAddMilestone} className="mt-4 space-y-3.5">
            <div>
              <label
                htmlFor="msTitle"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                {tx('Target Pembelajaran', 'Learning Target')}
              </label>
              <input
                id="msTitle"
                type="text"
                required
                minLength={3}
                maxLength={120}
                value={milestoneTitle}
                onChange={(e) => setMilestoneTitle(e.target.value)}
                placeholder={tx(
                  'Contoh: Auto-Layout & Variants di Figma',
                  'e.g., Auto-Layout & Variants in Figma'
                )}
                className="mt-1 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="msProgress"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                {tx('Persentase Capaian', 'Progress Percentage')} ({milestoneProgress}%)
              </label>
              <input
                id="msProgress"
                type="range"
                min={0}
                max={100}
                step={25}
                value={milestoneProgress}
                onChange={(e) => setMilestoneProgress(Number(e.target.value))}
                className="mt-1.5 w-full accent-[#EE7838]"
              />
            </div>

            <div>
              <label
                htmlFor="msNotes"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                {tx('Catatan Belajar', 'Learning Notes')}
              </label>
              <textarea
                id="msNotes"
                rows={2}
                maxLength={400}
                value={milestoneNotes}
                onChange={(e) => setMilestoneNotes(e.target.value)}
                placeholder={tx(
                  'Ringkasan materi yang sudah dipahami...',
                  'Summary of topics mastered so far...'
                )}
                className="mt-1 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={creatingMilestone}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#F6C945] px-5 py-3 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                {creatingMilestone
                  ? tx('Menyimpan...', 'Saving...')
                  : tx('Simpan Milestone', 'Save Milestone')}
              </span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 rounded-[28px] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#3D2317]/8 pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-[#4EA674]" />
              <h2 className="text-base font-extrabold text-[#3D2317]">
                {tx('Daftar Milestones', 'Milestones List')} ({milestones.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-[#8C7A70]">
              {milestones.filter((m) => m.isCompleted).length} {tx('selesai', 'completed')}
            </span>
          </div>

          {milestones.length === 0 ? (
            <p className="py-8 text-center text-xs text-[#8C7A70]">
              {tx(
                'Belum ada milestone pembelajaran yang dicatat.',
                'No learning milestones recorded yet.'
              )}
            </p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl bg-[#FAF1E6]/70 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`text-sm font-extrabold ${
                          m.isCompleted ? 'line-through text-[#8C7A70]' : 'text-[#3D2317]'
                        }`}
                      >
                        {m.title}
                      </span>
                      {m.notes && (
                        <p className="mt-1 text-xs text-[#8C7A70]">{m.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleMilestone(m)}
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold transition ${
                          m.isCompleted
                            ? 'bg-[#4EA674] text-white'
                            : 'bg-[#F6C945] text-[#3D2317]'
                        }`}
                      >
                        {m.isCompleted ? '100% Done' : 'Tandai 100%'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMilestone(m.id)}
                        className="rounded-full p-1.5 text-[#8C7A70] hover:text-[#EE7838]"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="h-2 w-full overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#4EA674] transition-all"
                      style={{ width: `${m.progressPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D2317]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-extrabold text-[#3D2317]">
              Ubah Jadwal Sesi
            </h3>
            <form onSubmit={handleRescheduleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="reschedStart"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Waktu Baru
                </label>
                <input
                  id="reschedStart"
                  type="datetime-local"
                  required
                  value={newStartLocal}
                  onChange={(e) => setNewStartLocal(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
                />
              </div>

              <div>
                <label
                  htmlFor="reschedDuration"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Durasi
                </label>
                <select
                  id="reschedDuration"
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
                >
                  <option value={30}>30 Menit</option>
                  <option value={45}>45 Menit</option>
                  <option value={60}>60 Menit</option>
                  <option value={90}>90 Menit</option>
                  <option value={120}>120 Menit</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleTarget(null)}
                  className="rounded-full bg-[#FAF1E6] px-5 py-2 text-xs font-bold text-[#3D2317]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317]"
                >
                  Simpan & Ajukan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback & Rating Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D2317]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-extrabold text-[#3D2317]">
              Beri Rating & Ulasan Sesi
            </h3>
            <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-extrabold transition ${
                      rating >= star
                        ? 'bg-[#F6C945] text-[#3D2317]'
                        : 'bg-[#FAF1E6] text-[#8C7A70]'
                    }`}
                  >
                    {star} ★
                  </button>
                ))}
              </div>

              <div>
                <label
                  htmlFor="reviewComment"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Ulasan Pertukaran Skill
                </label>
                <textarea
                  id="reviewComment"
                  required
                  minLength={3}
                  maxLength={500}
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Bagikan pengalaman belajarmu..."
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewTarget(null)}
                  className="rounded-full bg-[#FAF1E6] px-5 py-2 text-xs font-bold text-[#3D2317]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="inline-flex items-center gap-2 rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317]"
                >
                  <span>{submittingReview ? 'Mengirim...' : 'Kirim Feedback'}</span>
                  <BookOpen className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}