import React from 'react';
import {
  RequestStatus,
  SessionStatus,
  SkillLevel,
  SkillRole
} from '@skillloop/shared';
import { useLanguage } from '../context/LanguageContext';

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const { tx } = useLanguage();
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D2317]/15 bg-[#FFF8E1] px-3 py-0.5 text-xs font-extrabold text-[#3D2317] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#EE7838]" />
          <span>{tx('Menunggu', 'Pending')}</span>
        </span>
      );
    case 'ACCEPTED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2B6E48]/30 bg-[#E8F7EE] px-3 py-0.5 text-xs font-extrabold text-[#14532D] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
          <span>{tx('Disepakati', 'Accepted')}</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9E2A32]/25 bg-[#FFEBEF] px-3 py-0.5 text-xs font-extrabold text-[#881337] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#E11D48]" />
          <span>{tx('Ditolak', 'Rejected')}</span>
        </span>
      );
    case 'CANCELLED':
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D2317]/15 bg-[#F5EFE6] px-3 py-0.5 text-xs font-extrabold text-[#3D2317] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#8C7A70]" />
          <span>
            {status === 'CANCELLED'
              ? tx('Dibatalkan', 'Cancelled')
              : tx('Kedaluwarsa', 'Expired')}
          </span>
        </span>
      );
  }
}

export function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const { tx } = useLanguage();
  switch (status) {
    case 'PROPOSED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D2317]/15 bg-[#FFF8E1] px-3 py-0.5 text-xs font-extrabold text-[#3D2317] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#EE7838]" />
          <span>{tx('Menunggu Konfirmasi', 'Awaiting Confirmation')}</span>
        </span>
      );
    case 'SCHEDULED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#255799]/25 bg-[#EAF3FF] px-3 py-0.5 text-xs font-extrabold text-[#1E3A8A] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
          <span>{tx('Terjadwal', 'Scheduled')}</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2B6E48]/30 bg-[#E8F7EE] px-3 py-0.5 text-xs font-extrabold text-[#14532D] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
          <span>{tx('Selesai', 'Completed')}</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3D2317]/15 bg-[#F5EFE6] px-3 py-0.5 text-xs font-extrabold text-[#3D2317] shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#8C7A70]" />
          <span>{tx('Dibatalkan', 'Cancelled')}</span>
        </span>
      );
  }
}

export function SkillChip({
  name,
  role,
  level
}: {
  name: string;
  role: SkillRole;
  level?: SkillLevel | null;
}) {
  const isTeach = role === 'TEACH';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
        isTeach
          ? 'bg-[#F6C945]/30 text-[#3D2317] hover:bg-[#F6C945]/50'
          : 'bg-[#F4979C]/30 text-[#3D2317] hover:bg-[#F4979C]/45'
      }`}
    >
      <span>{name}</span>
      {level && (
        <span className="rounded-full bg-[#3D2317]/10 px-1.5 py-0.2 text-[9px] uppercase tracking-wider text-[#3D2317]">
          {level.toLowerCase()}
        </span>
      )}
    </span>
  );
}

export function formatDateTimeWithZone(
  isoDateStr: string,
  targetTimezone?: string
): string {
  try {
    const date = new Date(isoDateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: targetTimezone || undefined
    };
    const formatted = new Intl.DateTimeFormat('id-ID', options).format(date);
    return `${formatted} (${targetTimezone || 'Local'})`;
  } catch {
    return isoDateStr;
  }
}
