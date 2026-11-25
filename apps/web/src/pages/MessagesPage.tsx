import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Link2,
  CheckCheck,
  Flag,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { api, ApiClientError, MessageThreadDto } from '../lib/api';
import { RequestStatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function MessagesPage() {
  const { user, refreshNotifications } = useAuth();
  const { tx } = useLanguage();
  const [threads, setThreads] = useState<MessageThreadDto[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [messageBody, setMessageBody] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const res = await api.messages.listThreads();
      setThreads(res.data);
      if (!selectedRequestId && res.data.length > 0) {
        setSelectedRequestId(res.data[0].request.id);
      }
      await refreshNotifications();
    } catch {
      setFeedback({
        type: 'error',
        message: tx(
          'Gagal memuat percakapan pertukaran skill.',
          'Failed to load skill exchange conversations.'
        )
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const activeThread = threads.find((t) => t.request.id === selectedRequestId);

  useEffect(() => {
    if (activeThread && activeThread.unreadCount > 0) {
      api.messages
        .markThreadRead(activeThread.request.id)
        .then(() => loadThreads())
        .catch(() => {});
    }
  }, [selectedRequestId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !messageBody.trim()) return;
    setSending(true);
    setFeedback(null);

    try {
      await api.messages.send({
        requestId: activeThread.request.id,
        body: messageBody.trim(),
        resourceUrl: resourceUrl.trim() || null
      });
      setMessageBody('');
      setResourceUrl('');
      await loadThreads();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    } finally {
      setSending(false);
    }
  };

  const handleReportMessage = async (messageId: string) => {
    const reason = window.prompt(
      tx(
        'Alasan melaporkan pesan ini ke tim moderasi:',
        'Reason for reporting this message to the moderation team:'
      ),
      tx(
        'Konten pesan tidak sesuai dengan etika belajar komunitas.',
        'Message content violates community learning guidelines.'
      )
    );
    if (reason === null) return;
    try {
      await api.messages.reportMessage(messageId, reason);
      await loadThreads();
      setFeedback({
        type: 'success',
        message: tx(
          'Pesan telah dilaporkan ke Admin Moderation Dashboard.',
          'Message has been reported to the Admin Moderation Dashboard.'
        )
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-block rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
          {tx('Pesan Pribadi & Materi', 'Messages & Resource Sharing')}
        </span>
        <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2317]">
          {tx('Pesan & Berbagi Materi', 'Private Messages & Resources')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#8C7A70]">
          {tx(
            'Diskusikan agenda belajar dan bagikan tautan referensi langsung bersama partnermu.',
            'Discuss learning agendas and share study links directly with your partner.'
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

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 h-96 animate-pulse rounded-[28px] bg-[#F3E7D8]" />
          <div className="lg:col-span-8 h-96 animate-pulse rounded-[28px] bg-[#F3E7D8]" />
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-[32px] bg-white p-12 text-center shadow-sm">
          <MessageSquare className="mx-auto h-10 w-10 text-[#EE7838]" />
          <h2 className="mt-3 text-base font-extrabold text-[#3D2317]">
            {tx('Belum ada ruang pesan pertukaran aktif', 'No active exchange message threads yet')}
          </h2>
          <Link
            to="/discover"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317]"
          >
            <span>{tx('Cari Partner', 'Discover Partners')}</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left: Thread List */}
          <div className="lg:col-span-4 rounded-[28px] bg-white p-4 shadow-sm space-y-2">
            <h2 className="px-2 py-1 text-xs font-extrabold uppercase tracking-wider text-[#8C7A70]">
              Partner Channels ({threads.length})
            </h2>

            {threads.map((t) => {
              const isSelected = t.request.id === selectedRequestId;
              const lastMsg = t.messages[t.messages.length - 1];
              return (
                <button
                  key={t.request.id}
                  type="button"
                  onClick={() => setSelectedRequestId(t.request.id)}
                  className={`w-full rounded-2xl p-3.5 text-left transition ${
                    isSelected
                      ? 'bg-[#432319] text-white shadow-sm'
                      : 'bg-[#FAF1E6]/70 text-[#3D2317] hover:bg-[#FAF1E6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold truncate">
                      {t.partner.displayName}
                    </span>
                    {t.unreadCount > 0 && (
                      <span className="rounded-full bg-[#EE7838] px-2 py-0.5 text-[10px] font-extrabold text-white">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-1 text-[11px] truncate font-bold ${
                      isSelected ? 'text-[#F6C945]' : 'text-[#EE7838]'
                    }`}
                  >
                    {t.request.offeredSkill?.name || 'Skill'} ⇄{' '}
                    {t.request.requestedSkill?.name || 'Skill'}
                  </p>
                  <p
                    className={`mt-1 text-[11px] truncate ${
                      isSelected ? 'text-white/75' : 'text-[#8C7A70]'
                    }`}
                  >
                    {lastMsg ? lastMsg.body : 'Mulai percakapan...'}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: Active Conversation */}
          {activeThread && (
            <div className="lg:col-span-8 rounded-[28px] bg-white p-5 sm:p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3D2317]/8 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-extrabold text-[#3D2317]">
                      {activeThread.partner.displayName}
                    </h2>
                    <RequestStatusBadge status={activeThread.request.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-[#8C7A70]">
                    {activeThread.partner.timezone} .{' '}
                    <strong className="text-[#3D2317]">
                      {activeThread.request.offeredSkill?.name || 'Teach'} ⇄{' '}
                      {activeThread.request.requestedSkill?.name || 'Learn'}
                    </strong>
                  </p>
                </div>

                <Link
                  to="/sessions"
                  className="rounded-full bg-[#FAF1E6] px-4 py-1.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#F6C945] transition"
                >
                  Jadwal Sesi →
                </Link>
              </div>

              <div className="my-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                {activeThread.messages.length === 0 ? (
                  <div className="rounded-2xl bg-[#FAF1E6] p-6 text-center text-xs text-[#8C7A70]">
                    Belum ada pesan. Kirim pesan pertama atau bagikan tautan materi!
                  </div>
                ) : (
                  activeThread.messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isMine ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-lg rounded-2xl p-4 text-xs shadow-sm ${
                            isMine
                              ? 'bg-[#432319] text-white'
                              : 'bg-[#FAF1E6] text-[#3D2317]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 pb-1">
                            <span className="font-extrabold">
                              {isMine ? 'Anda' : m.senderName}
                            </span>
                            {!isMine && (
                              <button
                                type="button"
                                onClick={() => handleReportMessage(m.id)}
                                title="Laporkan pesan"
                                className="text-[#8C7A70] hover:text-[#EE7838]"
                              >
                                <Flag className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="leading-relaxed">{m.body}</p>

                          {m.resourceUrl && (
                            <a
                              href={
                                m.resourceUrl.startsWith('http')
                                  ? m.resourceUrl
                                  : `https://${m.resourceUrl}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[#F6C945] px-3 py-1.5 text-[11px] font-extrabold text-[#3D2317]"
                            >
                              <Link2 className="h-3 w-3" />
                              <span className="truncate max-w-xs">{m.resourceUrl}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}

                          <div
                            className={`mt-2 flex items-center justify-end gap-1.5 text-[10px] ${
                              isMine ? 'text-white/70' : 'text-[#8C7A70]'
                            }`}
                          >
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isMine && (
                              <span className="inline-flex items-center gap-0.5">
                                <CheckCheck className="h-3 w-3 text-[#F6C945]" />
                                <span>{m.readAt ? 'Dibaca' : 'Terkirim'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                onSubmit={handleSendMessage}
                className="border-t border-[#3D2317]/8 pt-4 space-y-3"
              >
                <div className="grid gap-2.5 sm:grid-cols-12">
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      required
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      placeholder={`Kirim pesan ke ${activeThread.partner.displayName}...`}
                      className="w-full rounded-full bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      placeholder="Tautan materi / Figma / GitHub (opsional)"
                      className="w-full rounded-full bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2 rounded-full bg-[#F6C945] px-6 py-2.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-sm"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{sending ? 'Mengirim...' : 'Kirim Pesan'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}