import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { COMMON_TIMEZONES, SUPPORTED_LANGUAGES } from '@skillloop/shared';
import { api, ApiClientError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const DEMO_ACCOUNTS = [
  {
    name: 'Raka Pratama (Admin)',
    email: 'raka@demo.skillloop.id',
    roleDesc: 'Hak Akses: Admin & Moderasi . Teach: JS & HTML/CSS ⇄ Learn: UI/UX & Figma',
    badgeColor: 'bg-[#EE7838] text-white'
  },
  {
    name: 'Naya Putri',
    email: 'naya@demo.skillloop.id',
    roleDesc: 'Hak Akses: Member . Teach: UI/UX & Figma ⇄ Learn: JS & HTML/CSS',
    badgeColor: 'bg-[#4EA674] text-white'
  },
  {
    name: 'Dimas Aditya',
    email: 'dimas@demo.skillloop.id',
    roleDesc: 'Hak Akses: Member . Teach: HTML/CSS & Pitching ⇄ Learn: Figma',
    badgeColor: 'bg-[#F6C945] text-[#3D2317]'
  },
  {
    name: 'Alya Rahma',
    email: 'alya@demo.skillloop.id',
    roleDesc: 'Hak Akses: Member . Teach: Python & SQL ⇄ Learn: React & JS',
    badgeColor: 'bg-[#F4979C] text-[#3D2317]'
  },
  {
    name: 'Farhan Akbar',
    email: 'farhan@demo.skillloop.id',
    roleDesc: 'Hak Akses: Member . Teach: React & TS ⇄ Learn: Python & SQL',
    badgeColor: 'bg-[#74A8F2] text-white'
  }
];

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { tx } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [selectedLangs, setSelectedLangs] = useState<string[]>(['id']);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleLanguage = (code: string) => {
    setSelectedLangs((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((c) => c !== code)
          : prev
        : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMessage(
        tx(
          'Konfirmasi password tidak cocok dengan password yang dimasukkan.',
          'Password confirmation does not match the entered password.'
        )
      );
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'login') {
        await api.auth.login({ email: email.trim(), password });
        await refreshUser();
        navigate('/dashboard');
      } else {
        await api.auth.register({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          timezone,
          languages: selectedLangs
        });
        await refreshUser();
        navigate('/skills');
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        const detailMsg = err.details?.[0]?.message;
        setErrorMessage(detailMsg ? `${err.message} (${detailMsg})` : err.message);
      } else {
        setErrorMessage(
          tx('Gagal memproses autentikasi.', 'Failed to process authentication.')
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await api.auth.login({
        email: demoEmail,
        password: 'DemoSkillLoop123!'
      });
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          tx('Gagal masuk dengan akun demo.', 'Failed to sign in with demo account.')
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-4">
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Main Clean White Auth Card */}
        <div className="lg:col-span-7 rounded-[32px] bg-white p-7 sm:p-10 shadow-sm">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F6C945] px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
              <span>SkillLoop Account</span>
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#3D2317]">
              {mode === 'login' ? 'Masuk ke SkillLoop' : 'Buat Akun Pertukaran Baru'}
            </h1>
            <p className="mt-1 text-xs text-[#8C7A70]">
              {mode === 'login'
                ? 'Kelola pertukaran skill dua arah dan jadwal sesi belajar Anda.'
                : 'Daftarkan keahlian yang ingin Anda ajarkan dan pelajari.'}
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="mt-5 rounded-2xl bg-[#F4979C]/25 p-4 text-xs font-bold text-[#9E2A32]"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Nama Tampilan
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none focus:ring-2 focus:ring-[#F6C945]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none focus:ring-2 focus:ring-[#F6C945]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={mode === 'register' ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minimal 8 karakter' : 'Password Anda'}
                  className="w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 pr-11 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none focus:ring-2 focus:ring-[#F6C945]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  className="absolute right-3.5 top-2.5 rounded-lg p-1 text-[#8C7A70] hover:text-[#3D2317]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                >
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-medium text-[#3D2317] placeholder-[#8C7A70] focus:outline-none focus:ring-2 focus:ring-[#F6C945]"
                />
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]"
                  >
                    Zona Waktu (IANA)
                  </label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-1.5 w-full rounded-2xl bg-[#FAF1E6] px-4 py-3 text-xs font-medium text-[#3D2317] focus:outline-none"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-[11px] font-extrabold uppercase tracking-wider text-[#3D2317]">
                    Bahasa Komunikasi
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const active = selectedLangs.includes(lang.code);
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => toggleLanguage(lang.code)}
                          className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'bg-[#3D2317] text-[#F6C945]'
                              : 'bg-[#FAF1E6] text-[#8C7A70]'
                          }`}
                        >
                          {lang.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full inline-flex items-center justify-center gap-3 rounded-full bg-[#F6C945] px-6 py-3 text-xs font-extrabold text-[#3D2317] hover:bg-[#EE7838] hover:text-white disabled:opacity-50 transition shadow-md"
            >
              <span>
                {submitting
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk Sekarang'
                  : 'Daftar Akun'}
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#3D2317]">
                <BookOpen className="h-3 w-3" />
              </span>
            </button>
          </form>

          <div className="mt-6 border-t border-[#3D2317]/10 pt-4 text-center text-xs text-[#8C7A70]">
            {mode === 'login' ? (
              <>
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="font-extrabold text-[#EE7838] hover:underline"
                >
                  Daftar di sini
                </Link>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <Link
                  to="/login"
                  className="font-extrabold text-[#EE7838] hover:underline"
                >
                  Masuk di sini
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Right Espresso Card: 1-Click Demo Personas */}
        <div className="lg:col-span-5 rounded-[32px] bg-[#432319] p-7 sm:p-8 text-white shadow-xl space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F6C945] px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#3D2317]">
              <BookOpen className="h-3 w-3" />
              <span>Demo Persona . 1-Klik</span>
            </div>
            <h2 className="mt-2.5 text-xl font-extrabold text-white">
              Uji Langsung Reciprocal Match
            </h2>
            <p className="mt-1 text-xs text-white/75 leading-relaxed">
              Pilih salah satu akun simulasi di bawah untuk langsung masuk tanpa mengetik password.
            </p>
          </div>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={submitting}
                onClick={() => handleDemoLogin(acc.email)}
                className="w-full rounded-2xl bg-white/10 p-3.5 text-left transition hover:bg-white hover:text-[#3D2317] disabled:opacity-50 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold">{acc.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${acc.badgeColor}`}
                  >
                    Masuk 1-Klik
                  </span>
                </div>
                <p className="mt-1 text-[11px] opacity-80">{acc.roleDesc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
