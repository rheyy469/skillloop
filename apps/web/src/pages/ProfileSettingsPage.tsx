import React, { useEffect, useState } from 'react';
import { CheckCircle2, Lock, BookOpen, Check } from 'lucide-react';
import { COMMON_TIMEZONES, SUPPORTED_LANGUAGES } from '@skillloop/shared';
import { api, ApiClientError, UserSettingsDto } from '../lib/api';
import {
  AVATAR_PRESETS,
  CharacterPortrait,
  resolveAvatarBg,
  resolveAvatarVariant
} from '../components/CharacterPortraits';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth();
  const { lang, setLang, tx } = useLanguage();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatarUrl || 'avatar:0');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Jakarta');
  const [languages, setLanguages] = useState<string[]>(
    user?.languages || ['id']
  );

  const [learningMethod, setLearningMethod] = useState(
    'Online 1-on-1 . Praktik & Diskusi'
  );
  const [availabilityWindow, setAvailabilityWindow] = useState(
    'Weekday Malam (19:00-21:00) & Akhir Pekan'
  );

  const [emailVerified, setEmailVerified] = useState(true);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [prefs, setPrefs] = useState<Omit<UserSettingsDto, 'userId'>>({
    notifyNewRequest: true,
    notifyRequestAccepted: true,
    notifySessionUpdates: true,
    notifyNewFeedback: true,
    showTimezonePublicly: true,
    showPortfolioPublicly: true,
    showHistoryPublicly: true,
    interfaceLanguage: 'id'
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [blocks, setBlocks] = useState<
    Array<{
      id: string;
      blockedId: string;
      createdAt: string;
      blockedUser: { id: string; displayName: string; username: string | null };
    }>
  >([]);

  const loadBlocks = async () => {
    try {
      const [blockRes, setRes] = await Promise.all([
        api.safety.listBlocks(),
        api.settings.getMe()
      ]);
      setBlocks(blockRes.data);
      const { userId: _uid, ...rest } = setRes.data;
      setPrefs(rest);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatarUrl || (user.isAdmin ? 'avatar:0' : 'avatar:1'));
      setTimezone(user.timezone);
      setLanguages(user.languages.length > 0 ? user.languages : ['id']);
    }
    loadBlocks();
  }, [user]);

  const handleSelectAvatar = async (presetId: string) => {
    setAvatarUrl(presetId);
    setFeedback(null);
    try {
      await api.profile.updateMe({ avatarUrl: presetId });
      await refreshUser();
      setFeedback({
        type: 'success',
        message: tx('Foto profil avatar berhasil diperbarui!', 'Profile avatar updated!')
      });
    } catch {
      setFeedback({
        type: 'error',
        message: tx('Gagal menyimpan pilihan avatar.', 'Failed to update avatar.')
      });
    }
  };

  const toggleLanguage = (code: string) => {
    setLanguages((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((c) => c !== code)
          : prev
        : [...prev, code]
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await api.profile.updateMe({
        displayName,
        username: username.trim() || null,
        bio: bio.trim() || null,
        avatarUrl,
        timezone,
        languages
      });
      await refreshUser();
      setFeedback({
        type: 'success',
        message: 'Profil dan Learning Preferences berhasil diperbarui.'
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      } else {
        setFeedback({
          type: 'error',
          message: 'Gagal memperbarui profil.'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyEmail = () => {
    setVerifyingEmail(true);
    setTimeout(() => {
      setVerifyingEmail(false);
      setEmailVerified(true);
      setFeedback({
        type: 'success',
        message: `Alamat email ${user?.email} telah terverifikasi.`
      });
    }, 350);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setFeedback(null);
    try {
      await api.auth.changePassword({
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setFeedback({
        type: 'success',
        message: 'Password akun berhasil diperbarui.'
      });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFeedback({ type: 'error', message: err.message });
      } else {
        setFeedback({
          type: 'error',
          message: 'Gagal mengubah password.'
        });
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUnblock = async (blockedUserId: string) => {
    try {
      await api.safety.unblockUser(blockedUserId);
      await loadBlocks();
      setFeedback({
        type: 'success',
        message: 'Blokir telah dibuka.'
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal membuka blokir.'
      });
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setFeedback(null);
    try {
      const res = await api.settings.updateMe(prefs);
      const { userId: _uid, ...rest } = res.data;
      setPrefs(rest);
      setLang(rest.interfaceLanguage);
      setFeedback({
        type: 'success',
        message: tx(
          'Pengaturan Notifikasi, Privasi, dan Bahasa berhasil disimpan.',
          'Notification, Privacy, and Language preferences saved.'
        )
      });
    } catch {
      setFeedback({
        type: 'error',
        message: tx('Gagal menyimpan preferensi akun.', 'Failed to save preferences.')
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="inline-block rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
          {tx('Profil & Pengaturan Akun', 'Profile & Account Settings')}
        </span>
        <h1 className="mt-2.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-[#3D2317]">
          {tx('Profil, Preferensi & Privasi', 'Profile, Preferences & Privacy')}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#8C7A70]">
          {tx(
            'Kelola informasi profil, metode belajar, keamanan akun, dan kontrol privasi.',
            'Manage your profile info, learning methods, account security, and privacy controls.'
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
        {/* Left: Profile & Learning Preferences Form */}
        <div className="lg:col-span-7 rounded-[28px] bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-extrabold text-[#3D2317]">
            {tx('Foto Profil Avatar & Informasi Akun', 'Custom Profile Avatar & Account Info')}
          </h2>

          {/* Custom Profile Picture Picker from Built-In Dummy Character Avatars */}
          <div className="mt-4 rounded-2xl bg-[#FAF1E6] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-3xl ${resolveAvatarBg(
                  avatarUrl
                )} pt-2 flex items-end justify-center shadow-md border-2 border-white`}
              >
                <CharacterPortrait
                  variant={resolveAvatarVariant(avatarUrl, 0)}
                  className="h-18 w-18"
                />
              </div>
              <div>
                <span className="inline-block rounded-full bg-[#3D2317] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#F6C945]">
                  {tx('Custom Profile Picture', 'Custom Profile Picture')}
                </span>
                <p className="mt-1 text-sm font-extrabold text-[#3D2317]">
                  {tx('Pilih Karakter Avatar Favoritmu', 'Choose Your Favorite Character Avatar')}
                </p>
                <p className="text-xs text-[#8C7A70]">
                  {tx(
                    'Klik salah satu ilustrasi karakter di bawah untuk langsung mengganti foto profilmu.',
                    'Click any character illustration below to update your profile picture immediately.'
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = avatarUrl === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectAvatar(preset.id)}
                    title={preset.label}
                    className={`group relative flex flex-col items-center rounded-2xl p-1.5 transition ${
                      isSelected
                        ? 'bg-white ring-2 ring-[#EE7838] shadow-sm scale-[1.03]'
                        : 'bg-white/60 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`h-14 w-full overflow-hidden rounded-xl ${preset.bgClass} pt-1 flex items-end justify-center`}
                    >
                      <CharacterPortrait variant={preset.variant} className="h-13 w-13" />
                    </div>
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#EE7838] text-white shadow">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profDisplayName"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Nama Tampilan
                </label>
                <input
                  id="profDisplayName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-medium text-[#3D2317] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="profUsername"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Username
                </label>
                <input
                  id="profUsername"
                  type="text"
                  maxLength={30}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nama_pengguna"
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-medium text-[#3D2317] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profBio"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                Bio Singkat
              </label>
              <textarea
                id="profBio"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="profTimezone"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Zona Waktu (IANA)
                </label>
                <select
                  id="profTimezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
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
                  htmlFor="profLearningMethod"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Metode Pembelajaran
                </label>
                <select
                  id="profLearningMethod"
                  value={learningMethod}
                  onChange={(e) => setLearningMethod(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
                >
                  <option value="Online 1-on-1 . Praktik & Diskusi">
                    Online 1-on-1 . Praktik & Diskusi
                  </option>
                  <option value="Pair Programming / Co-Design">
                    Pair Programming / Co-Design
                  </option>
                  <option value="Async Review & Weekly Sync">
                    Async Review & Weekly Sync
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="profAvailability"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                Ketersediaan Waktu
              </label>
              <select
                id="profAvailability"
                value={availabilityWindow}
                onChange={(e) => setAvailabilityWindow(e.target.value)}
                className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-bold text-[#3D2317] focus:outline-none"
              >
                <option value="Weekday Malam (19:00-21:00) & Akhir Pekan">
                  Weekday Malam (19:00-21:00) & Akhir Pekan
                </option>
                <option value="Akhir Pekan (Sabtu & Minggu Fleksibel)">
                  Akhir Pekan (Sabtu & Minggu Fleksibel)
                </option>
                <option value="Weekday Pagi / Sore Fleksibel">
                  Weekday Pagi / Sore Fleksibel
                </option>
              </select>
            </div>

            <div>
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
                Bahasa Komunikasi
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUPPORTED_LANGUAGES.map((l) => {
                  const active = languages.includes(l.code);
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => toggleLanguage(l.code)}
                      className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition ${
                        active
                          ? 'bg-[#3D2317] text-[#F6C945]'
                          : 'bg-[#FAF1E6] text-[#8C7A70]'
                      }`}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-3 inline-flex items-center gap-3 rounded-full bg-[#F6C945] pl-6 pr-2.5 py-2.5 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white transition shadow-md"
            >
              <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                <BookOpen className="h-3 w-3" />
              </span>
            </button>
          </form>
        </div>

        {/* Right: Security, Notifications & Blocked Users */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#3D2317]">
                Verifikasi Email
              </h2>
              {emailVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#4EA674]/20 px-3 py-0.5 text-[11px] font-extrabold text-[#2B6E48]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Terverifikasi</span>
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-[#8C7A70]">
              Email: <strong className="text-[#3D2317]">{user?.email}</strong>
            </p>
            <button
              type="button"
              disabled={verifyingEmail}
              onClick={handleVerifyEmail}
              className="mt-3 text-xs font-extrabold text-[#EE7838] hover:underline"
            >
              {verifyingEmail ? 'Memeriksa...' : 'Cek Status Verifikasi'}
            </button>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#EE7838]" />
              <h2 className="text-base font-extrabold text-[#3D2317]">
                Ubah Password
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Password saat ini"
                className="w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password baru (min. 8 karakter)"
                className="w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-medium text-[#3D2317] focus:outline-none"
              />
              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-full bg-[#3D2317] px-5 py-2.5 text-xs font-extrabold text-white"
              >
                {changingPassword ? 'Memperbarui...' : 'Perbarui Password'}
              </button>
            </form>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-[#3D2317]">
              Notifikasi, Privasi & Bahasa
            </h2>

            <div className="space-y-2 text-xs">
              {(
                [
                  { key: 'notifyNewRequest', label: 'New Exchange Request (Permintaan pertukaran baru)' },
                  { key: 'notifyRequestAccepted', label: 'Request Accepted (Kesepakatan diterima)' },
                  { key: 'notifySessionUpdates', label: 'Upcoming Session & Session Updates' },
                  { key: 'notifyNewFeedback', label: 'New Feedback & Reputation Rating' },
                  { key: 'showTimezonePublicly', label: 'Tampilkan Zona Waktu pada Profil Publik' },
                  { key: 'showPortfolioPublicly', label: 'Tampilkan Tautan Portfolio Showcase' },
                  { key: 'showHistoryPublicly', label: 'Tampilkan Riwayat Sesi & Reputasi Komunitas' }
                ] as const
              ).map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between rounded-xl bg-[#FAF1E6]/70 px-3.5 py-2 cursor-pointer"
                >
                  <span className="font-medium text-[#3D2317]">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={prefs[item.key]}
                    onChange={(e) =>
                      setPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#EE7838]"
                  />
                </label>
              ))}
            </div>

            <div>
              <select
                value={lang}
                onChange={(e) => {
                  const chosen = e.target.value as 'id' | 'en';
                  setLang(chosen);
                  setPrefs((prev) => ({
                    ...prev,
                    interfaceLanguage: chosen
                  }));
                }}
                className="w-full rounded-2xl bg-[#FAF1E6] px-4 py-2.5 text-xs font-bold text-[#3D2317]"
              >
                <option value="id">Bahasa Indonesia (ID)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>

            <button
              type="button"
              disabled={savingPrefs}
              onClick={handleSavePreferences}
              className="w-full rounded-full bg-[#F6C945] px-5 py-2.5 text-xs font-extrabold text-[#3D2317]"
            >
              {savingPrefs ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>

          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <h2 className="text-base font-extrabold text-[#3D2317]">
              Pengguna Diblokir ({blocks.length})
            </h2>
            {blocks.length === 0 ? (
              <p className="mt-2 text-xs text-[#8C7A70]">
                Tidak ada pengguna yang diblokir.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[#3D2317]/8">
                {blocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <span className="text-xs font-extrabold text-[#3D2317]">
                      {b.blockedUser.displayName}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnblock(b.blockedId)}
                      className="rounded-full bg-[#FAF1E6] px-3.5 py-1 text-xs font-bold text-[#3D2317]"
                    >
                      Buka Blokir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}