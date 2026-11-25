import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Star
} from 'lucide-react';
import { REPORT_CATEGORIES } from '@skillloop/shared';
import { api, ApiClientError, ReciprocalMatchDto, UserReputationDto } from '../lib/api';
import { RequestStatusBadge, SkillChip } from '../components/StatusBadge';
import { CharacterPortrait } from '../components/CharacterPortraits';
import { useLanguage } from '../context/LanguageContext';

export function MatchDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { tx } = useLanguage();

  const [match, setMatch] = useState<ReciprocalMatchDto | null>(null);
  const [reputation, setReputation] = useState<UserReputationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offeredSkillId, setOfferedSkillId] = useState('');
  const [requestedSkillId, setRequestedSkillId] = useState('');
  const [targetSessionsCount, setTargetSessionsCount] = useState(4);
  const [learningGoal, setLearningGoal] = useState('');
  const [exchangeExpectation, setExchangeExpectation] = useState(
    'Online 1-on-1 . Praktik & Review Langsung'
  );
  const [introMessage, setIntroMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>(
    REPORT_CATEGORIES[0].value
  );
  const [reportDesc, setReportDesc] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const loadMatchDetail = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [res, repRes] = await Promise.all([
        api.matches.detail(userId),
        api.reputation.getForUser(userId)
      ]);
      setMatch(res.data);
      setReputation(repRes.data);
      if (res.data.explanation.aCanTeachB.length > 0) {
        setOfferedSkillId(res.data.explanation.aCanTeachB[0].skillId);
      }
      if (res.data.explanation.bCanTeachA.length > 0) {
        setRequestedSkillId(res.data.explanation.bCanTeachA[0].skillId);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(tx('Gagal memuat detail kecocokan.', 'Failed to load match details.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchDetail();
  }, [userId]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setSendingRequest(true);
    setActionFeedback(null);

    const agreementSummary = [
      `[Exchange Agreement: ${targetSessionsCount} Sesi . Metode: ${exchangeExpectation}]`,
      learningGoal.trim() ? `Target Belajar: ${learningGoal.trim()}.` : '',
      introMessage.trim()
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 500);

    try {
      await api.requests.create({
        recipientId: match.user.id,
        offeredSkillId: offeredSkillId || null,
        requestedSkillId: requestedSkillId || null,
        introMessage: agreementSummary || null
      });
      await loadMatchDetail();
      setActionFeedback({
        type: 'success',
        message: tx(
          'Permintaan pertukaran & Exchange Agreement berhasil dikirim. Pantau status di menu Permintaan Tukar.',
          'Exchange request & agreement sent successfully. Track its status in Exchange Requests.'
        )
      });
      setIntroMessage('');
      setLearningGoal('');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setActionFeedback({ type: 'error', message: err.message });
      } else {
        setActionFeedback({
          type: 'error',
          message: tx(
            'Gagal mengirim permintaan kolaborasi.',
            'Failed to send collaboration request.'
          )
        });
      }
    } finally {
      setSendingRequest(false);
    }
  };

  const handleBlockUser = async () => {
    if (!match) return;
    const confirmed = window.confirm(
      tx(
        `Blokir ${match.user.displayName}? Anda tidak akan saling melihat di rekomendasi match.`,
        `Block ${match.user.displayName}? You will no longer see each other in match recommendations.`
      )
    );
    if (!confirmed) return;

    try {
      await api.safety.blockUser(match.user.id);
      navigate('/discover');
    } catch {
      setActionFeedback({
        type: 'error',
        message: tx('Gagal memblokir pengguna.', 'Failed to block user.')
      });
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setSubmittingReport(true);
    try {
      await api.safety.reportUser({
        reportedUserId: match.user.id,
        category: reportCategory,
        description: reportDesc
      });
      setReportOpen(false);
      setReportDesc('');
      setActionFeedback({
        type: 'success',
        message: tx(
          'Laporan telah diterima. Identitas pelapor dijaga kerahasiaannya.',
          'Report received. Your identity is kept confidential.'
        )
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setActionFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-[32px] bg-[#F3E7D8]" />
        <div className="h-64 animate-pulse rounded-[32px] bg-[#F3E7D8]" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-base font-extrabold text-[#3D2317]">{error || 'Data match tidak ditemukan'}</p>
        <Link
          to="/discover"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Rekomendasi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#3D2317] shadow-sm hover:bg-[#F6C945] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Rekomendasi</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-[#8C7A70] hover:text-[#3D2317] shadow-sm transition"
          >
            Laporkan
          </button>
          <button
            type="button"
            onClick={handleBlockUser}
            className="rounded-full bg-[#F4979C]/30 px-4 py-2 text-xs font-bold text-[#9E2A32] hover:bg-[#F4979C]/50 transition"
          >
            Blokir
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div
          role="alert"
          className={`rounded-2xl px-5 py-3.5 text-xs font-bold ${
            actionFeedback.type === 'success'
              ? 'bg-[#4EA674]/20 text-[#2B6E48]'
              : 'bg-[#F4979C]/30 text-[#9E2A32]'
          }`}
        >
          {actionFeedback.message}
        </div>
      )}

      {/* User Header Profile in Deep Espresso Brown (#432319) with Built-In Vector Portrait */}
      <div className="rounded-[32px] bg-[#432319] p-6 sm:p-9 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-[#F6C945] pt-2 flex items-end justify-center shadow-md">
              <CharacterPortrait variant={1} className="h-22 w-22" />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
                  Reciprocal Partner
                </span>
                {match.existingRequestStatus && (
                  <RequestStatusBadge status={match.existingRequestStatus} />
                )}
              </div>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                  {match.user.displayName}
                </h1>
                {match.user.username && (
                  <span className="text-sm text-[#F6C945]">
                    @{match.user.username}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/75">
                {match.user.timezone} . Bahasa: {match.user.languages.map((l) => l.toUpperCase()).join(', ')} . Kelengkapan Profil {match.user.profileCompleteness}% . Reputasi {reputation?.averageRating ?? 5.0} ★ ({reputation?.completedSessionsCount ?? 0} sesi selesai)
              </p>
              {match.user.bio && (
                <p className="pt-1 text-xs leading-relaxed text-white/85 max-w-xl">
                  {match.user.bio}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0 rounded-[24px] bg-[#EE7838] p-5 text-center text-white sm:min-w-[175px] shadow-md">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Overall Match Score
            </span>
            <p className="mt-1 text-4xl font-black">
              {match.score.overallScore}%
            </p>
            <p className="mt-1 text-[10px] font-bold opacity-90">
              A→B: {match.score.aToBScore} . B→A: {match.score.bToAScore}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-white/15 pt-4 text-[11px] text-white/75">
          Formula algoritma v{match.score.algorithmVersion}:{' '}
          <code className="text-[#F6C945] font-bold">0.65 × min(AtoB, BtoA) + 0.35 × avg(AtoB, BtoA)</code>
        </div>
      </div>

      {/* Compatibility & Skills Breakdown */}
      <div className="rounded-[32px] bg-white p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <span className="inline-block rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
            Analisis Kompatibilitas
          </span>
          <h2 className="text-2xl font-extrabold text-[#3D2317] mt-2">
            Penjelasan Reciprocal Match
          </h2>
        </div>

        <div className="space-y-1.5 rounded-2xl bg-[#FAF1E6] p-4 text-xs text-[#3D2317]">
          {match.explanation.reasons.map((r, idx) => (
            <div key={idx} className="flex items-baseline gap-2">
              <span className="font-extrabold text-[#4EA674] shrink-0">•</span>
              <span className="font-medium">{r}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-[#FAF1E6]/70 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#3D2317]/8">
              <span className="font-extrabold uppercase tracking-wider text-[#4EA674]">
                Kamu Ajarkan
              </span>
              <span className="font-bold text-[#8C7A70]">LevelFit</span>
            </div>
            <div className="space-y-2.5">
              {match.explanation.aCanTeachB.map((pair) => (
                <div
                  key={pair.skillId}
                  className="rounded-2xl bg-white p-4 space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <SkillChip
                      name={pair.skillName}
                      role="TEACH"
                      level={pair.teacherLevel}
                    />
                    <span className="text-xs font-bold text-[#3D2317]">
                      Fit: {pair.levelFit}
                    </span>
                  </div>
                  {pair.teacherDescription && (
                    <p className="text-xs text-[#8C7A70]">
                      <strong>Pengalaman & Portofoliomu:</strong> {pair.teacherDescription}
                    </p>
                  )}
                  {pair.learnerDescription && (
                    <p className="text-xs text-[#8C7A70]">
                      <strong>Tujuan partner:</strong> {pair.learnerDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#FAF1E6]/70 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-[#3D2317]/8">
              <span className="font-extrabold uppercase tracking-wider text-[#EE7838]">
                Mereka Ajarkan
              </span>
              <span className="font-bold text-[#8C7A70]">LevelFit</span>
            </div>
            <div className="space-y-2.5">
              {match.explanation.bCanTeachA.map((pair) => (
                <div
                  key={pair.skillId}
                  className="rounded-2xl bg-white p-4 space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <SkillChip
                      name={pair.skillName}
                      role="LEARN"
                      level={pair.teacherLevel}
                    />
                    <span className="text-xs font-bold text-[#3D2317]">
                      Fit: {pair.levelFit}
                    </span>
                  </div>
                  {pair.teacherDescription && (
                    <p className="text-xs text-[#8C7A70]">
                      <strong>Pengalaman & Portofolio partner:</strong> {pair.teacherDescription}
                    </p>
                  )}
                  {pair.learnerDescription && (
                    <p className="text-xs text-[#8C7A70]">
                      <strong>Tujuanmu:</strong> {pair.learnerDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Community Reputation & Exchange History */}
      {reputation && (
        <div className="rounded-[32px] bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#3D2317]/8 pb-4">
            <div>
              <span className="inline-block rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
                Community Reputation & History
              </span>
              <h2 className="mt-2 text-xl font-extrabold text-[#3D2317]">
                Reputasi & Riwayat Pertukaran {match.user.displayName}
              </h2>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs">
              <div>
                <span className="block text-[10px] font-bold text-[#8C7A70]">
                  RATING KOMUNITAS
                </span>
                <span className="text-base font-extrabold text-[#3D2317]">
                  {reputation.averageRating} ★ ({reputation.totalReviews} ulasan)
                </span>
              </div>
              <div className="border-l border-[#3D2317]/15 pl-4">
                <span className="block text-[10px] font-bold text-[#8C7A70]">
                  EXCHANGE SELESAI
                </span>
                <span className="text-base font-extrabold text-[#4EA674]">
                  {reputation.completedSessionsCount} Sesi
                </span>
              </div>
            </div>
          </div>

          {reputation.reviews.length === 0 ? (
            <p className="text-xs text-[#8C7A70]">
              Partner ini memiliki reputasi awal 5.0 ★ dan siap memulai sesi pertukaran pertama denganmu.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {reputation.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-2xl bg-[#FAF1E6]/70 p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#3D2317]">
                      {rev.reviewerName}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F6C945] px-2.5 py-0.5 text-[10px] font-extrabold text-[#3D2317]">
                      <Star className="h-3 w-3 fill-current" />
                      <span>{rev.rating}/5</span>
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#4EA674]">
                    Sesi: {rev.sessionTopic}
                  </p>
                  {rev.comment && (
                    <p className="text-xs text-[#8C7A70] leading-relaxed">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send Request & Exchange Agreement Section */}
      <div className="rounded-[32px] bg-white p-6 sm:p-8 shadow-sm">
        <span className="inline-block rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
          Exchange Agreement
        </span>
        <h2 className="mt-2 text-xl font-extrabold text-[#3D2317]">
          Ajukan Permintaan & Kesepakatan Pertukaran
        </h2>

        {match.existingRequestStatus === 'PENDING' ||
        match.existingRequestStatus === 'ACCEPTED' ? (
          <div className="mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#FAF1E6] p-5 sm:flex-row sm:items-center">
            <span className="text-xs text-[#8C7A70]">
              Status pertukaran saat ini:{' '}
              <strong className="text-[#3D2317] font-extrabold">{match.existingRequestStatus}</strong>
            </span>
            <Link
              to="/requests"
              className="inline-flex items-center gap-2 rounded-full bg-[#F6C945] text-[#3D2317] font-extrabold px-6 py-2.5 text-xs"
            >
              <span>Buka Halaman Permintaan Tukar</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSendRequest} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="offeredSkill"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Skill yang Kamu Ajarkan (Teacher Role)
                </label>
                <select
                  id="offeredSkill"
                  value={offeredSkillId}
                  onChange={(e) => setOfferedSkillId(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  {match.explanation.aCanTeachB.map((s) => (
                    <option key={s.skillId} value={s.skillId}>
                      {s.skillName} ({s.teacherLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="requestedSkill"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Skill yang Ingin Dipelajari (Learner Role)
                </label>
                <select
                  id="requestedSkill"
                  value={requestedSkillId}
                  onChange={(e) => setRequestedSkillId(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  {match.explanation.bCanTeachA.map((s) => (
                    <option key={s.skillId} value={s.skillId}>
                      {s.skillName} ({s.teacherLevel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="targetSessionsCount"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Target Jumlah Sesi
                </label>
                <select
                  id="targetSessionsCount"
                  value={targetSessionsCount}
                  onChange={(e) => setTargetSessionsCount(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  <option value={2}>2 Sesi (1x Teach + 1x Learn)</option>
                  <option value={4}>4 Sesi (2x Teach + 2x Learn)</option>
                  <option value={6}>6 Sesi (3x Teach + 3x Learn)</option>
                  <option value={8}>8 Sesi (Program Intensif)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="exchangeExpectation"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Metode Pertukaran
                </label>
                <select
                  id="exchangeExpectation"
                  value={exchangeExpectation}
                  onChange={(e) => setExchangeExpectation(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  <option value="Online 1-on-1 . Praktik & Review Langsung">
                    Online 1-on-1 . Praktik & Review Langsung
                  </option>
                  <option value="Pair Programming / Co-Design Live">
                    Pair Programming / Co-Design Live
                  </option>
                  <option value="Diskusi Konsep & Bedah Portofolio">
                    Diskusi Konsep & Bedah Portofolio
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="learningGoal"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                Tujuan Pembelajaran
              </label>
              <input
                id="learningGoal"
                type="text"
                maxLength={200}
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder="Contoh: Membuat prototype design system..."
                className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="introMessage"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                Pesan Pengantar
              </label>
              <textarea
                id="introMessage"
                rows={2}
                maxLength={300}
                value={introMessage}
                onChange={(e) => setIntroMessage(e.target.value)}
                placeholder={`Halo ${match.user.displayName}, mari bertukar skill...`}
                className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sendingRequest}
              className="inline-flex items-center gap-3 rounded-full bg-[#F6C945] pl-6 pr-2.5 py-2.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white disabled:opacity-50 transition shadow-md"
            >
              <span>{sendingRequest ? 'Mengirim...' : 'Kirim Exchange Request & Agreement'}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                <BookOpen className="h-3 w-3" />
              </span>
            </button>
          </form>
        )}
      </div>

      {/* Report Modal */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3D2317]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-7 shadow-2xl">
            <h3 className="text-lg font-extrabold text-[#3D2317]">
              Laporkan Profil
            </h3>
            <form onSubmit={handleSubmitReport} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="reportCategory"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Kategori
                </label>
                <select
                  id="reportCategory"
                  value={reportCategory}
                  onChange={(e) => setReportCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-3.5 py-2.5 text-xs font-bold text-[#3D2317]"
                >
                  {REPORT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="reportDesc"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Keterangan
                </label>
                <textarea
                  id="reportDesc"
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={3}
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  placeholder="Jelaskan alasan pelaporan..."
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-3.5 py-2.5 text-xs font-medium text-[#3D2317]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="rounded-full bg-[#FAF1E6] px-5 py-2 text-xs font-bold text-[#3D2317]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="rounded-full bg-[#EE7838] px-5 py-2 text-xs font-bold text-white"
                >
                  {submittingReport ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
