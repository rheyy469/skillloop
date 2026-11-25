import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, RefreshCw } from 'lucide-react';
import { COMMON_TIMEZONES } from '@skillloop/shared';
import { api, ApiClientError, CollaborationRequestDto } from '../lib/api';
import { RequestStatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function RequestsPage() {
  const { user, refreshNotifications } = useAuth();
  const { tx } = useLanguage();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<CollaborationRequestDto[]>([]);
  const [direction, setDirection] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Counter Proposal Modal State
  const [counterTarget, setCounterTarget] =
    useState<CollaborationRequestDto | null>(null);
  const [counterSessionsCount, setCounterSessionsCount] = useState(4);
  const [counterGoal, setCounterGoal] = useState('');
  const [counterMethod, setCounterMethod] = useState(
    'Online 1-on-1 . Praktik & Review Langsung'
  );
  const [counterNote, setCounterNote] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);

  // Propose Session Modal State
  const [proposeModalReq, setProposeModalReq] =
    useState<CollaborationRequestDto | null>(null);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [dateTimeLocal, setDateTimeLocal] = useState('');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Jakarta');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [submittingSession, setSubmittingSession] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.requests.list({
        direction,
        status: statusFilter || undefined
      });
      setRequests(res.data);
      await refreshNotifications();
    } catch {
      setFeedback({
        type: 'error',
        message: tx(
          'Gagal memuat daftar exchange request.',
          'Failed to load exchange requests.'
        )
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [direction, statusFilter]);

  const handleRequestAction = async (
    requestId: string,
    action: 'ACCEPT' | 'REJECT' | 'CANCEL'
  ) => {
    setFeedback(null);
    try {
      await api.requests.updateStatus(requestId, action);
      await loadRequests();
      setFeedback({
        type: 'success',
        message:
          action === 'ACCEPT'
            ? tx(
                'Exchange Agreement disepakati! Anda sekarang dapat menjadwalkan sesi belajar.',
                'Exchange Agreement accepted! You can now schedule a learning session.'
              )
            : action === 'REJECT'
            ? tx('Permintaan kolaborasi ditolak.', 'Collaboration request rejected.')
            : tx('Permintaan kolaborasi dibatalkan.', 'Collaboration request cancelled.')
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const openCounterModal = (req: CollaborationRequestDto) => {
    setCounterTarget(req);
    setCounterSessionsCount(4);
    setCounterGoal('');
    setCounterMethod('Online 1-on-1 . Praktik & Review Langsung');
    setCounterNote(req.introMessage || '');
  };

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterTarget) return;
    setSubmittingCounter(true);
    setFeedback(null);

    const updatedAgreement = [
      `[Counter Proposal Agreement: ${counterSessionsCount} Sesi . Metode: ${counterMethod}]`,
      counterGoal.trim() ? `Target Belajar: ${counterGoal.trim()}.` : '',
      counterNote.trim()
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 500);

    try {
      await api.requests.updateStatus(counterTarget.id, 'COUNTER', {
        offeredSkillId: counterTarget.offeredSkillId,
        requestedSkillId: counterTarget.requestedSkillId,
        introMessage: updatedAgreement
      });
      setCounterTarget(null);
      await loadRequests();
      setFeedback({
        type: 'success',
        message: tx(
          'Counter Proposal berhasil dikirim ke partner.',
          'Counter Proposal sent to partner successfully.'
        )
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setSubmittingCounter(false);
    }
  };

  const openProposeModal = (req: CollaborationRequestDto) => {
    setProposeModalReq(req);
    const defaultTopic =
      req.offeredSkill && req.requestedSkill
        ? `Pertukaran ${req.offeredSkill.name} ⇄ ${req.requestedSkill.name}`
        : 'Sesi Kolaborasi Pertukaran Skill';
    setTopic(defaultTopic);
    setDescription('');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setMinutes(0, 0, 0);
    const localIso = new Date(
      tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);
    setDateTimeLocal(localIso);
    setTimezone(user?.timezone || 'Asia/Jakarta');
    setDurationMinutes(60);
  };

  const handleProposeSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposeModalReq) return;
    setSubmittingSession(true);
    setFeedback(null);

    try {
      const isoUtc = new Date(dateTimeLocal).toISOString();
      await api.sessions.create({
        requestId: proposeModalReq.id,
        topic,
        description: description.trim() || null,
        startAt: isoUtc,
        timezone,
        durationMinutes
      });
      setProposeModalReq(null);
      navigate('/sessions');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      } else {
        setFeedback({
          type: 'error',
          message: tx(
            'Gagal membuat proposal sesi belajar.',
            'Failed to create learning session proposal.'
          )
        });
      }
    } finally {
      setSubmittingSession(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-block rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
          {tx('Permintaan & Kesepakatan', 'Exchange Requests')}
        </span>
        <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2317]">
          {tx('Permintaan Pertukaran Skill', 'Skill Exchange Requests')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#8C7A70]">
          {tx(
            'Terima, ajukan Counter Proposal, atau jadwalkan sesi belajar bersama partnermu.',
            'Accept, send Counter Proposals, or schedule sessions with your learning partners.'
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

      {/* Tabs & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-full bg-white p-1.5 shadow-sm">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'incoming', label: 'Masuk' },
              { id: 'outgoing', label: 'Keluar' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDirection(tab.id)}
              className={`rounded-full px-5 py-1.5 text-xs font-extrabold transition ${
                direction === tab.id
                  ? 'bg-[#3D2317] text-white'
                  : 'text-[#8C7A70] hover:text-[#3D2317]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter status request"
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#3D2317] shadow-sm focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="PENDING">PENDING</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 animate-pulse rounded-[28px] bg-[#F3E7D8]" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-[32px] bg-white p-12 text-center shadow-sm">
          <p className="text-base font-extrabold text-[#3D2317]">
            Tidak ada permintaan kolaborasi
          </p>
          <p className="mt-1 text-xs text-[#8C7A70]">
            Buka halaman Cari Partner untuk menemukan partner pertukaran baru.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r, idx) => {
            const isIncoming = r.recipientId === user?.id;
            const partner = isIncoming ? r.sender : r.recipient;
            const thumbColors = ['bg-[#4EA674]', 'bg-[#EE7838]', 'bg-[#F4979C]'];

            return (
              <div
                key={r.id}
                className="rounded-[28px] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      thumbColors[idx % thumbColors.length]
                    } text-white font-extrabold text-sm shadow-sm`}
                  >
                    {partner.displayName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#FAF1E6] px-2.5 py-0.5 text-[10px] font-extrabold text-[#3D2317]">
                        {isIncoming ? 'Masuk dari' : 'Keluar ke'}
                      </span>
                      <h2 className="text-base sm:text-lg font-extrabold text-[#3D2317]">
                        {partner.displayName}
                      </h2>
                      <RequestStatusBadge status={r.status} />
                    </div>

                    {(r.offeredSkill || r.requestedSkill) && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {r.offeredSkill && (
                          <span className="rounded-full bg-[#F6C945]/30 px-3 py-0.5 text-[#3D2317] font-bold">
                            Teach: {r.offeredSkill.name}
                          </span>
                        )}
                        {r.requestedSkill && (
                          <span className="rounded-full bg-[#F4979C]/30 px-3 py-0.5 text-[#3D2317] font-bold">
                            Learn: {r.requestedSkill.name}
                          </span>
                        )}
                        <span className="text-xs text-[#8C7A70]">
                          . {r.sessionsCount} Sesi Terjadwal
                        </span>
                      </div>
                    )}

                    {r.introMessage && (
                      <p className="text-xs text-[#8C7A70] leading-relaxed">
                        {r.introMessage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap shrink-0 items-center gap-2">
                  {r.status === 'PENDING' && isIncoming && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRequestAction(r.id, 'ACCEPT')}
                        className="rounded-full bg-[#4EA674] px-5 py-2 text-xs font-extrabold text-white hover:bg-[#3D2317] transition shadow-sm"
                      >
                        Terima
                      </button>
                      <button
                        type="button"
                        onClick={() => openCounterModal(r)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#F6C945] px-4 py-2 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Counter</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestAction(r.id, 'REJECT')}
                        className="rounded-full bg-[#FAF1E6] px-4 py-2 text-xs font-bold text-[#9E2A32]"
                      >
                        Tolak
                      </button>
                    </>
                  )}

                  {r.status === 'PENDING' && !isIncoming && (
                    <>
                      <button
                        type="button"
                        onClick={() => openCounterModal(r)}
                        className="inline-flex items-center gap-1 rounded-full bg-[#FAF1E6] px-4 py-2 text-xs font-bold text-[#3D2317]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Ubah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestAction(r.id, 'CANCEL')}
                        className="rounded-full bg-[#F4979C]/30 px-4 py-2 text-xs font-bold text-[#9E2A32]"
                      >
                        Batalkan
                      </button>
                    </>
                  )}

                  {r.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      onClick={() => openProposeModal(r)}
                      className="inline-flex items-center gap-2.5 rounded-full bg-[#F6C945] pl-5 pr-2 py-2 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-sm"
                    >
                      <span>Ajukan Jadwal Sesi</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                        <BookOpen className="h-3 w-3" />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Counter Proposal Modal */}
      {counterTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D2317]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-7 shadow-2xl">
            <span className="inline-block rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
              Counter Proposal
            </span>
            <h3 className="mt-2 text-xl font-extrabold text-[#3D2317]">
              Ajukan Perubahan Kesepakatan
            </h3>

            <form onSubmit={handleCounterSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="counterSessions"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                  >
                    Usulan Jumlah Sesi
                  </label>
                  <select
                    id="counterSessions"
                    value={counterSessionsCount}
                    onChange={(e) => setCounterSessionsCount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
                  >
                    <option value={2}>2 Sesi</option>
                    <option value={4}>4 Sesi</option>
                    <option value={6}>6 Sesi</option>
                    <option value={8}>8 Sesi</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="counterMethod"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                  >
                    Metode Pertukaran
                  </label>
                  <select
                    id="counterMethod"
                    value={counterMethod}
                    onChange={(e) => setCounterMethod(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
                  >
                    <option value="Online 1-on-1 . Praktik & Review Langsung">
                      Online 1-on-1 . Praktik & Review
                    </option>
                    <option value="Pair Programming / Co-Design Live">
                      Pair Programming / Co-Design
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="counterGoal"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Revisi Target Pembelajaran
                </label>
                <input
                  id="counterGoal"
                  type="text"
                  maxLength={180}
                  value={counterGoal}
                  onChange={(e) => setCounterGoal(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317]"
                />
              </div>

              <div>
                <label
                  htmlFor="counterNote"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Pesan Counter Proposal
                </label>
                <textarea
                  id="counterNote"
                  rows={2}
                  maxLength={300}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCounterTarget(null)}
                  className="rounded-full bg-[#FAF1E6] px-5 py-2 text-xs font-bold text-[#3D2317]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCounter}
                  className="rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317]"
                >
                  {submittingCounter ? 'Mengirim...' : 'Kirim Counter Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Propose Learning Session Modal */}
      {proposeModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D2317]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[32px] bg-white p-7 shadow-2xl">
            <h3 className="text-xl font-extrabold text-[#3D2317]">
              Ajukan Jadwal Sesi Belajar
            </h3>

            <form onSubmit={handleProposeSession} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="sessionTopic"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Topik Sesi
                </label>
                <input
                  id="sessionTopic"
                  type="text"
                  required
                  minLength={3}
                  maxLength={120}
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="sessionStart"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                  >
                    Waktu Mulai
                  </label>
                  <input
                    id="sessionStart"
                    type="datetime-local"
                    required
                    value={dateTimeLocal}
                    onChange={(e) => setDateTimeLocal(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sessionDuration"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                  >
                    Durasi
                  </label>
                  <select
                    id="sessionDuration"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
                  >
                    <option value={30}>30 Menit</option>
                    <option value={45}>45 Menit</option>
                    <option value={60}>60 Menit</option>
                    <option value={90}>90 Menit</option>
                    <option value={120}>120 Menit</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sessionTz"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Zona Waktu Referensi
                </label>
                <select
                  id="sessionTz"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="sessionDesc"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Agenda Singkat (Opsional)
                </label>
                <textarea
                  id="sessionDesc"
                  rows={2}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProposeModalReq(null)}
                  className="rounded-full bg-[#FAF1E6] px-5 py-2 text-xs font-bold text-[#3D2317]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingSession}
                  className="rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317]"
                >
                  {submittingSession ? 'Mengajukan...' : 'Kirim Usulan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}