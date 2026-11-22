import React from 'react';

/**
 * Built-in vector character illustrations holding books/notebooks & decorative patterns.
 * Designed to fill cards richly with book/page motifs and serve as selectable custom profile avatars.
 */
export interface AvatarPreset {
  id: string;
  variant: number;
  label: string;
  bgClass: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'avatar:0', variant: 0, label: 'Raka Scholar', bgClass: 'bg-[#F6C945]' },
  { id: 'avatar:1', variant: 1, label: 'Naya Designer', bgClass: 'bg-[#432319]' },
  { id: 'avatar:2', variant: 2, label: 'Evan Specs', bgClass: 'bg-[#4EA674]' },
  { id: 'avatar:3', variant: 3, label: 'Stefy Reader', bgClass: 'bg-[#EE7838]' },
  { id: 'avatar:4', variant: 4, label: 'Sunny Learner', bgClass: 'bg-[#74A8F2]' },
  { id: 'avatar:5', variant: 5, label: 'Mint Coder', bgClass: 'bg-[#F4979C]' },
  { id: 'avatar:6', variant: 6, label: 'Beanie Dev', bgClass: 'bg-[#EE7838]' },
  { id: 'avatar:7', variant: 7, label: 'Hijab Mentor', bgClass: 'bg-[#4EA674]' }
];

export function resolveAvatarVariant(
  avatarUrl?: string | null,
  fallbackVariant = 0
): number {
  if (avatarUrl && avatarUrl.startsWith('avatar:')) {
    const parsed = Number(avatarUrl.slice('avatar:'.length));
    if (!Number.isNaN(parsed) && parsed >= 0) {
      return parsed % AVATAR_PRESETS.length;
    }
  }
  return Math.abs(fallbackVariant) % AVATAR_PRESETS.length;
}

export function resolveAvatarBg(
  avatarUrl?: string | null,
  fallbackBg = 'bg-[#F6C945]'
): string {
  const found = AVATAR_PRESETS.find((p) => p.id === avatarUrl);
  return found ? found.bgClass : fallbackBg;
}

export function CharacterPortrait({
  variant = 0,
  className = 'w-full h-full'
}: {
  variant?: number;
  className?: string;
}) {
  const index = Math.abs(variant) % 8;

  switch (index) {
    case 0:
      // Character 1: Mr. Raka Pratama holding an open book with warm jacket
      return (
        <svg
          viewBox="0 0 260 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          {/* Subtle Halo / Aura behind character to fill card space */}
          <circle cx="130" cy="145" r="98" fill="#FFFFFF" fillOpacity="0.16" />
          <circle cx="130" cy="145" r="76" fill="#F6C945" fillOpacity="0.22" />
          {/* Floating Mini Page Badges */}
          <rect x="24" y="54" width="28" height="34" rx="6" transform="rotate(-12 24 54)" fill="#FFFFFF" fillOpacity="0.85" />
          <path d="M30 64H44M30 71H40" stroke="#EE7838" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="206" y="62" width="28" height="34" rx="6" transform="rotate(14 206 62)" fill="#F6C945" />
          <path d="M213 73H227M213 80H223" stroke="#3D2317" strokeWidth="2.5" strokeLinecap="round" />
          {/* Shoulders / Jacket */}
          <path
            d="M22 270C22 204 64 178 130 178C196 178 238 204 238 270H22Z"
            fill="#3D2317"
          />
          <path
            d="M66 270C66 216 92 192 130 192C168 192 194 216 194 270H66Z"
            fill="#FAF1E6"
          />
          {/* Neck */}
          <rect x="111" y="144" width="38" height="44" rx="18" fill="#C6865C" />
          <path d="M111 158C121 168 139 168 149 158V172H111V158Z" fill="#A96B43" />
          {/* Curly Dark Hair */}
          <circle cx="96" cy="52" r="20" fill="#2A170E" />
          <circle cx="120" cy="44" r="22" fill="#2A170E" />
          <circle cx="144" cy="46" r="21" fill="#2A170E" />
          <circle cx="164" cy="56" r="18" fill="#2A170E" />
          {/* Head */}
          <rect x="82" y="54" width="96" height="108" rx="48" fill="#C6865C" />
          {/* Ears */}
          <circle cx="78" cy="108" r="11" fill="#C6865C" />
          <circle cx="182" cy="108" r="11" fill="#C6865C" />
          {/* Eyes & Brows */}
          <path d="M100 90C105 86 113 86 118 90" stroke="#2A170E" strokeWidth="4" strokeLinecap="round" />
          <path d="M142 90C147 86 155 86 160 90" stroke="#2A170E" strokeWidth="4" strokeLinecap="round" />
          <circle cx="109" cy="102" r="5.5" fill="#2A170E" />
          <circle cx="151" cy="102" r="5.5" fill="#2A170E" />
          <circle cx="111" cy="100" r="2" fill="#FFFFFF" />
          <circle cx="153" cy="100" r="2" fill="#FFFFFF" />
          {/* Nose */}
          <path d="M130 103V119C130 122 134 123 136 122" stroke="#9E603A" strokeWidth="3.5" strokeLinecap="round" />
          {/* Smile */}
          <path d="M106 130C112 144 148 144 154 130H106Z" fill="#FFFFFF" />
          <path d="M106 130C112 144 148 144 154 130" stroke="#2A170E" strokeWidth="3.5" strokeLinecap="round" />
          {/* Open Book Held in Front */}
          <path
            d="M72 224C92 216 116 220 130 228C144 220 168 216 188 224V266C168 258 144 262 130 270C116 262 92 258 72 266V224Z"
            fill="#F6C945"
            stroke="#3D2317"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M130 228V268" stroke="#3D2317" strokeWidth="4" strokeLinecap="round" />
          <path d="M86 238H116M86 248H110M144 238H174M144 248H168" stroke="#3D2317" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 1:
      // Character 2: Nadia Lestary holding design notebook & pen
      return (
        <svg
          viewBox="0 0 260 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          {/* Decorative Halo */}
          <circle cx="130" cy="145" r="96" fill="#FFFFFF" fillOpacity="0.12" />
          <circle cx="130" cy="145" r="72" fill="#F4979C" fillOpacity="0.2" />
          {/* Floating Book Page Icons */}
          <rect x="26" y="58" width="26" height="32" rx="5" transform="rotate(-10 26 58)" fill="#F6C945" />
          <path d="M32 68H45M32 75H42" stroke="#3D2317" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="204" y="54" width="26" height="32" rx="5" transform="rotate(12 204 54)" fill="#4EA674" />
          <path d="M210 65H223M210 72H219" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          {/* Back Hair */}
          <path
            d="M58 92C58 44 88 26 130 26C172 26 202 44 202 92V220H58V92Z"
            fill="#1E130D"
          />
          {/* Shoulders / Red Top */}
          <path
            d="M24 270C24 206 64 182 130 182C196 182 236 206 236 270H24Z"
            fill="#D92B3A"
          />
          <rect x="104" y="166" width="52" height="28" rx="10" fill="#B81D2A" />
          {/* Neck */}
          <rect x="113" y="142" width="34" height="32" rx="14" fill="#F5CBA7" />
          {/* Face */}
          <rect x="84" y="52" width="92" height="106" rx="46" fill="#F5CBA7" />
          {/* Hair Bangs */}
          <path
            d="M82 82C92 52 128 48 146 62C160 72 174 74 178 88C178 52 156 34 130 34C98 34 82 54 82 82Z"
            fill="#1E130D"
          />
          {/* Earrings */}
          <circle cx="80" cy="120" r="5.5" fill="#F6C945" />
          <circle cx="180" cy="120" r="5.5" fill="#F6C945" />
          {/* Eyes */}
          <path d="M101 92C106 89 113 89 117 92" stroke="#1E130D" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M143 92C147 89 154 89 159 92" stroke="#1E130D" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="109" cy="102" r="4.8" fill="#1E130D" />
          <circle cx="151" cy="102" r="4.8" fill="#1E130D" />
          <circle cx="110.5" cy="100.5" r="1.6" fill="#FFFFFF" />
          <circle cx="152.5" cy="100.5" r="1.6" fill="#FFFFFF" />
          {/* Blush */}
          <circle cx="97" cy="115" r="7" fill="#F4979C" fillOpacity="0.55" />
          <circle cx="163" cy="115" r="7" fill="#F4979C" fillOpacity="0.55" />
          {/* Smile */}
          <path
            d="M112 129C118 139 142 139 148 129"
            stroke="#C93B4B"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Open Notebook at Bottom */}
          <path
            d="M74 226C94 218 116 222 130 230C144 222 166 218 186 226V266C166 258 144 262 130 270C116 262 94 258 74 266V226Z"
            fill="#FFFFFF"
            stroke="#3D2317"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M130 230V268" stroke="#3D2317" strokeWidth="4" strokeLinecap="round" />
          <path d="M88 240H116M88 250H110M144 240H172M144 250H166" stroke="#EE7838" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 2:
      // Character 3: Evan Caster Lee with glasses, sweater & open guidebook
      return (
        <svg
          viewBox="0 0 260 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          {/* Decorative Halo */}
          <circle cx="130" cy="145" r="96" fill="#FFFFFF" fillOpacity="0.18" />
          <circle cx="130" cy="145" r="72" fill="#F6C945" fillOpacity="0.25" />
          {/* Floating Page Badges */}
          <rect x="24" y="60" width="26" height="32" rx="5" transform="rotate(-14 24 60)" fill="#FFFFFF" />
          <path d="M30 70H43M30 77H39" stroke="#4EA674" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="206" y="56" width="26" height="32" rx="5" transform="rotate(10 206 56)" fill="#F6C945" />
          <path d="M212 67H225M212 74H221" stroke="#3D2317" strokeWidth="2.5" strokeLinecap="round" />
          {/* Shoulders / Orange Sweater */}
          <path
            d="M24 270C24 205 64 180 130 180C196 180 236 205 236 270H24Z"
            fill="#EE7838"
          />
          <path
            d="M92 184L130 218L168 184"
            stroke="#3D2317"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Neck */}
          <rect x="112" y="144" width="36" height="42" rx="16" fill="#F2C19E" />
          {/* Face */}
          <rect x="84" y="52" width="92" height="106" rx="46" fill="#F2C19E" />
          {/* Styled Hair */}
          <path
            d="M82 86C82 50 102 36 132 36C158 36 178 52 178 84C166 66 148 62 126 64C104 66 90 74 82 86Z"
            fill="#6E3B1E"
          />
          {/* Glasses */}
          <circle cx="109" cy="103" r="15" stroke="#3D2317" strokeWidth="3.8" fill="#FFFFFF" fillOpacity="0.28" />
          <circle cx="151" cy="103" r="15" stroke="#3D2317" strokeWidth="3.8" fill="#FFFFFF" fillOpacity="0.28" />
          <path d="M124 103H136" stroke="#3D2317" strokeWidth="3.8" />
          {/* Eyes */}
          <circle cx="109" cy="103" r="4.2" fill="#3D2317" />
          <circle cx="151" cy="103" r="4.2" fill="#3D2317" />
          {/* Smile */}
          <path
            d="M110 130C116 141 144 141 150 130"
            stroke="#3D2317"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Open Book */}
          <path
            d="M74 226C94 218 116 222 130 230C144 222 166 218 186 226V266C166 258 144 262 130 270C116 262 94 258 74 266V226Z"
            fill="#FAF1E6"
            stroke="#3D2317"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M130 230V268" stroke="#3D2317" strokeWidth="4" strokeLinecap="round" />
          <path d="M88 240H116M88 250H110M144 240H172M144 250H166" stroke="#4EA674" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 3:
      // Character 4: Stefy Catlyna with chestnut hair, white shirt & handbook
      return (
        <svg
          viewBox="0 0 260 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          {/* Decorative Halo */}
          <circle cx="130" cy="145" r="96" fill="#FFFFFF" fillOpacity="0.32" />
          <circle cx="130" cy="145" r="72" fill="#EE7838" fillOpacity="0.16" />
          {/* Floating Page Badges */}
          <rect x="24" y="56" width="26" height="32" rx="5" transform="rotate(-12 24 56)" fill="#3D2317" />
          <path d="M30 66H43M30 73H39" stroke="#F6C945" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="206" y="58" width="26" height="32" rx="5" transform="rotate(12 206 58)" fill="#FFFFFF" />
          <path d="M212 69H225M212 76H221" stroke="#EE7838" strokeWidth="2.5" strokeLinecap="round" />
          {/* Wavy Chestnut Hair Back */}
          <path
            d="M54 98C54 48 86 28 130 28C174 28 206 48 206 98C206 148 196 218 196 218H64C64 218 54 148 54 98Z"
            fill="#5C2E14"
          />
          {/* Shoulders / White Shirt */}
          <path
            d="M26 270C26 206 66 182 130 182C194 182 234 206 234 270H26Z"
            fill="#FFFFFF"
          />
          <path
            d="M104 180L130 212L156 180"
            fill="#FAF1E6"
            stroke="#D8C7B8"
            strokeWidth="3"
          />
          {/* Neck */}
          <rect x="113" y="142" width="34" height="38" rx="15" fill="#F6CFAF" />
          {/* Face */}
          <rect x="84" y="52" width="92" height="104" rx="46" fill="#F6CFAF" />
          {/* Hair Front */}
          <path
            d="M82 86C92 58 116 50 136 52C156 54 172 66 178 88C178 52 158 34 130 34C100 34 82 52 82 86Z"
            fill="#5C2E14"
          />
          {/* Eyes */}
          <circle cx="109" cy="102" r="4.8" fill="#3D2317" />
          <circle cx="151" cy="102" r="4.8" fill="#3D2317" />
          <circle cx="110.5" cy="100.5" r="1.6" fill="#FFFFFF" />
          <circle cx="152.5" cy="100.5" r="1.6" fill="#FFFFFF" />
          {/* Blush */}
          <circle cx="97" cy="115" r="6.8" fill="#F4979C" fillOpacity="0.55" />
          <circle cx="163" cy="115" r="6.8" fill="#F4979C" fillOpacity="0.55" />
          {/* Smile */}
          <path
            d="M111 128C118 138 142 138 149 128"
            stroke="#D45B5B"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Open Book */}
          <path
            d="M74 226C94 218 116 222 130 230C144 222 166 218 186 226V266C166 258 144 262 130 270C116 262 94 258 74 266V226Z"
            fill="#432319"
            stroke="#3D2317"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M130 230V268" stroke="#F6C945" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M88 240H116M88 250H110M144 240H172M144 250H166" stroke="#F6C945" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 4:
      // Character 5: Celebrating learner with notebook
      return (
        <svg
          viewBox="0 0 240 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <circle cx="120" cy="135" r="88" fill="#FFFFFF" fillOpacity="0.14" />
          <path
            d="M56 96C56 52 84 34 120 34C156 34 184 52 184 96V200H56V96Z"
            fill="#23140D"
          />
          <path
            d="M34 260C34 206 68 184 120 184C172 184 206 206 206 260H34Z"
            fill="#F4979C"
          />
          <rect x="78" y="58" width="84" height="98" rx="42" fill="#F5CBA7" />
          <path d="M94 102C98 96 106 96 110 102" stroke="#23140D" strokeWidth="4" strokeLinecap="round" />
          <path d="M130 102C134 96 142 96 146 102" stroke="#23140D" strokeWidth="4" strokeLinecap="round" />
          <path d="M100 124C106 138 134 138 140 124H100Z" fill="#FFFFFF" />
          <path d="M100 124C106 138 134 138 140 124" stroke="#23140D" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 6:
      // Character 7: Cozy Beanie Developer with Hoodie & Open Coding Book
      return (
        <svg
          viewBox="0 0 260 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <circle cx="130" cy="145" r="96" fill="#FFFFFF" fillOpacity="0.18" />
          <circle cx="130" cy="145" r="72" fill="#432319" fillOpacity="0.14" />
          {/* Floating Page Badges */}
          <rect x="24" y="58" width="26" height="32" rx="5" transform="rotate(-12 24 58)" fill="#F6C945" />
          <path d="M30 68H43M30 75H39" stroke="#3D2317" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="206" y="54" width="26" height="32" rx="5" transform="rotate(14 206 54)" fill="#FFFFFF" />
          <path d="M212 65H225M212 72H221" stroke="#4EA674" strokeWidth="2.5" strokeLinecap="round" />
          {/* Hoodie Shoulders */}
          <path
            d="M24 270C24 204 64 178 130 178C196 178 236 204 236 270H24Z"
            fill="#432319"
          />
          <path d="M104 182V225M156 182V225" stroke="#F6C945" strokeWidth="4" strokeLinecap="round" />
          {/* Neck */}
          <rect x="112" y="144" width="36" height="42" rx="16" fill="#E8B896" />
          {/* Head */}
          <rect x="84" y="58" width="92" height="102" rx="46" fill="#E8B896" />
          {/* Beanie Hat */}
          <path
            d="M80 86C80 46 102 28 130 28C158 28 180 46 180 86H80Z"
            fill="#74A8F2"
          />
          <rect x="76" y="74" width="108" height="18" rx="9" fill="#3D2317" />
          {/* Eyes & Brow */}
          <circle cx="109" cy="106" r="4.8" fill="#2A170E" />
          <circle cx="151" cy="106" r="4.8" fill="#2A170E" />
          <circle cx="110.5" cy="104.5" r="1.6" fill="#FFFFFF" />
          <circle cx="152.5" cy="104.5" r="1.6" fill="#FFFFFF" />
          {/* Smile */}
          <path d="M111 130C118 140 142 140 149 130" stroke="#2A170E" strokeWidth="4" strokeLinecap="round" />
          {/* Open Notebook */}
          <path
            d="M74 226C94 218 116 222 130 230C144 222 166 218 186 226V266C166 258 144 262 130 270C116 262 94 258 74 266V226Z"
            fill="#F6C945"
            stroke="#3D2317"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M130 230V268" stroke="#3D2317" strokeWidth="4" strokeLinecap="round" />
          <path d="M88 240H116M88 250H110M144 240H172M144 250H166" stroke="#3D2317" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 7:
      // Character 8: Hijab Scholar Mentor with Pastel Shawl & Open Book
      return (
        <svg
          viewBox="0 0 260 270"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <circle cx="130" cy="145" r="96" fill="#FFFFFF" fillOpacity="0.18" />
          <circle cx="130" cy="145" r="72" fill="#F6C945" fillOpacity="0.24" />
          {/* Floating Page Badges */}
          <rect x="24" y="56" width="26" height="32" rx="5" transform="rotate(-10 24 56)" fill="#FFFFFF" />
          <path d="M30 66H43M30 73H39" stroke="#EE7838" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="206" y="58" width="26" height="32" rx="5" transform="rotate(12 206 58)" fill="#F6C945" />
          <path d="M212 69H225M212 76H221" stroke="#3D2317" strokeWidth="2.5" strokeLinecap="round" />
          {/* Hijab Outer Drape */}
          <path
            d="M52 104C52 46 84 26 130 26C176 26 208 46 208 104V232H52V104Z"
            fill="#F4979C"
          />
          {/* Shoulders / Top */}
          <path
            d="M24 270C24 206 64 182 130 182C196 182 236 206 236 270H24Z"
            fill="#FAF1E6"
          />
          {/* Hijab Inner Wrap over Chest */}
          <path
            d="M66 154C82 198 106 218 130 218C154 218 178 198 194 154V198C178 232 154 244 130 244C106 244 82 232 66 198V154Z"
            fill="#E07B82"
          />
          {/* Face */}
          <rect x="86" y="56" width="88" height="102" rx="44" fill="#F5CBA7" />
          {/* Inner Hijab Frame */}
          <path
            d="M84 96C84 62 104 48 130 48C156 48 176 62 176 96C166 72 150 64 130 64C110 64 94 72 84 96Z"
            fill="#E07B82"
          />
          {/* Eyes & Blush */}
          <circle cx="110" cy="104" r="4.6" fill="#2A170E" />
          <circle cx="150" cy="104" r="4.6" fill="#2A170E" />
          <circle cx="111.5" cy="102.5" r="1.5" fill="#FFFFFF" />
          <circle cx="151.5" cy="102.5" r="1.5" fill="#FFFFFF" />
          <circle cx="99" cy="116" r="6" fill="#F4979C" fillOpacity="0.6" />
          <circle cx="161" cy="116" r="6" fill="#F4979C" fillOpacity="0.6" />
          {/* Smile */}
          <path d="M112 128C118 138 142 138 148 128" stroke="#C93B4B" strokeWidth="3.8" strokeLinecap="round" />
          {/* Open Book */}
          <path
            d="M74 226C94 218 116 222 130 230C144 222 166 218 186 226V266C166 258 144 262 130 270C116 262 94 258 74 266V226Z"
            fill="#FFFFFF"
            stroke="#3D2317"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M130 230V268" stroke="#3D2317" strokeWidth="4" strokeLinecap="round" />
          <path d="M88 240H116M88 250H110M144 240H172M144 250H166" stroke="#4EA674" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 240 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
          aria-hidden="true"
        >
          <circle cx="120" cy="135" r="88" fill="#FFFFFF" fillOpacity="0.18" />
          <path
            d="M30 260C30 205 65 182 120 182C175 182 210 205 210 260H30Z"
            fill="#4EA674"
          />
          <rect x="103" y="148" width="34" height="40" rx="16" fill="#E5B28A" />
          <rect x="76" y="56" width="88" height="104" rx="44" fill="#E5B28A" />
          <path
            d="M74 86C74 52 94 38 120 38C146 38 166 52 166 86C152 68 134 62 114 64C94 66 82 74 74 86Z"
            fill="#2A170E"
          />
          <circle cx="101" cy="105" r="4.5" fill="#2A170E" />
          <circle cx="139" cy="105" r="4.5" fill="#2A170E" />
          <path
            d="M103 130C110 140 130 140 137 130"
            stroke="#2A170E"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
