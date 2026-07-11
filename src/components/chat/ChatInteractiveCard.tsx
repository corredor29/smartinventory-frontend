export type CardKind = 'credito' | 'debito';
export type CardBank = 'nu' | 'bancolombia' | 'falabella' | 'bbva';

export interface CardFormData {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
}

export const CARD_BANKS: {
  id: CardBank;
  label: string;
  accent: string;
  hint: string;
}[] = [
  { id: 'nu', label: 'Nu', accent: '#820AD1', hint: 'Morada' },
  { id: 'bancolombia', label: 'Bancolombia', accent: '#FFDD00', hint: 'Amarilla' },
  { id: 'falabella', label: 'Falabella', accent: '#2E7D32', hint: 'Verde CMR' },
  { id: 'bbva', label: 'BBVA', accent: '#004481', hint: 'Azul' },
];

interface ChatInteractiveCardProps {
  data: CardFormData;
  cardKind: CardKind;
  bank: CardBank;
  flipped: boolean;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCardNumber(raw: string) {
  const digits = onlyDigits(raw).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiry(raw: string) {
  const digits = onlyDigits(raw).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function MastercardLogo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const w = size === 'sm' ? 'w-8 h-5' : 'w-10 h-6';
  return (
    <span className={`relative inline-block ${w}`} aria-hidden>
      <span className="absolute left-0 top-0 w-[58%] h-full rounded-full bg-[#eb001b]" />
      <span className="absolute right-0 top-0 w-[58%] h-full rounded-full bg-[#f79e1b]" />
    </span>
  );
}

function Chip({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`relative w-9 h-7 rounded-[3px] border shrink-0 overflow-hidden ${
        dark ? 'border-black/25' : 'border-black/20'
      }`}
      style={{
        background: 'linear-gradient(145deg, #e8d48b 0%, #c9a227 45%, #f0e0a0 70%, #a67c00 100%)',
      }}
      aria-hidden
    >
      <div className="absolute inset-[3px] grid grid-cols-3 grid-rows-2 gap-px opacity-40">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="bg-black/30 rounded-[1px]" />
        ))}
      </div>
    </div>
  );
}

function Contactless({ color = '#fff' }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 8.5c2.2 1.8 2.2 5.2 0 7" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M11 5.5c3.5 2.8 3.5 10.2 0 13" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14 3c4.8 3.8 4.8 14.2 0 18" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function BancolombiaMark({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="flex flex-col gap-[2px]" aria-hidden>
        <span className="block w-2.5 h-[2.5px] bg-current rounded-sm" />
        <span className="block w-3.5 h-[2.5px] bg-current rounded-sm" />
        <span className="block w-4.5 h-[2.5px] bg-current rounded-sm" />
      </span>
      <span className="font-bold tracking-tight">Bancolombia</span>
    </span>
  );
}

function prettyNumber(number: string) {
  const formatted = formatCardNumber(number);
  if (!formatted) return '•••• •••• •••• ••••';
  const parts = formatted.split(' ');
  while (parts.length < 4) parts.push('••••');
  return parts.map((p) => p.padEnd(4, '•')).join(' ');
}

function NuFront({
  holder,
  number,
  expiry,
  cardKind,
}: {
  holder: string;
  number: string;
  expiry: string;
  cardKind: CardKind;
}) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-white/10"
      style={{
        backfaceVisibility: 'hidden',
        background: 'linear-gradient(160deg, #9B30D9 0%, #820AD1 40%, #6B09A8 100%)',
      }}
    >
      <div className="absolute -right-10 top-8 w-40 h-40 rounded-full bg-white/5" />
      <div className="absolute -left-8 -bottom-10 w-36 h-36 rounded-full bg-black/10" />

      <div className="relative h-full p-3.5 flex flex-col text-white">
        <div className="flex justify-between items-start">
          <span
            className="text-[26px] font-black lowercase leading-none tracking-tighter"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            nu
          </span>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[8px] uppercase tracking-[0.2em] text-white/60">
              {cardKind === 'credito' ? 'Credito' : 'Debito'}
            </span>
            <MastercardLogo />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 mr-1">
          <Contactless />
          <Chip />
        </div>

        <div className="mt-auto">
          <p className="text-[13px] font-mono tracking-[0.16em] tabular-nums">{prettyNumber(number)}</p>
          <div className="flex justify-between items-end mt-2 gap-2">
            <p className="text-[12px] font-semibold tracking-[0.08em] truncate">{holder}</p>
            <p className="text-[11px] font-mono text-white/85 shrink-0">{expiry}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NuBack({ cvv }: { cvv: string }) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-white/10"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: 'linear-gradient(160deg, #9B30D9 0%, #820AD1 50%, #6B09A8 100%)',
      }}
    >
      <div className="relative h-full flex flex-col text-white">
        <div className="px-3 pt-2.5 flex justify-between gap-3">
          <div className="text-[6.5px] text-white/55 leading-relaxed max-w-[58%] space-y-0.5">
            <p>Necesitas ayuda? Abre el chat en la app</p>
            <p>Valida en todo el mundo e intransferible</p>
            <p className="pt-1">Mexico 800 099 1133</p>
            <p>Resto del mundo +1 636 722 7111</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-light tracking-wide mb-2">gold</p>
            <div className="h-7 w-24 bg-white rounded-sm flex items-center justify-end px-2 ml-auto">
              <span className="font-mono text-[12px] text-[#1a1a1a] italic tracking-widest">
                {cvv.padEnd(3, '•').slice(0, 4)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-auto h-10 bg-black w-full" />
      </div>
    </div>
  );
}

function BancolombiaFront({
  holder,
  number,
  expiry,
  cardKind,
}: {
  holder: string;
  number: string;
  expiry: string;
  cardKind: CardKind;
}) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-black/5"
      style={{ backfaceVisibility: 'hidden', background: '#FFDD00' }}
    >
      {/* Curvas de color estilo Bancolombia */}
      <svg
        className="absolute left-0 top-0 h-full w-[55%] pointer-events-none"
        viewBox="0 0 120 160"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M-10 20 C40 10, 50 50, 20 90 C-5 120, 30 150, 70 160" fill="none" stroke="#00A651" strokeWidth="14" strokeLinecap="round" />
        <path d="M0 35 C45 25, 55 60, 25 95 C5 120, 40 145, 80 155" fill="none" stroke="#7B2D8E" strokeWidth="11" strokeLinecap="round" />
        <path d="M5 55 C40 50, 48 80, 28 110 C12 130, 45 148, 75 152" fill="none" stroke="#00A3E0" strokeWidth="9" strokeLinecap="round" />
        <path d="M15 75 C42 78, 50 100, 40 125 C32 140, 55 150, 70 148" fill="none" stroke="#E85D75" strokeWidth="8" strokeLinecap="round" />
      </svg>

      <div className="relative h-full p-3.5 flex flex-col text-black">
        <div className="flex justify-between items-start">
          <span className="text-[11px] font-medium lowercase">
            {cardKind === 'credito' ? 'credito' : 'debito'}
          </span>
          <BancolombiaMark className="text-[10px]" />
        </div>

        <div className="flex items-center gap-2 mt-6 ml-1 relative z-10">
          <Chip dark />
          <Contactless color="#111" />
        </div>

        <div className="mt-auto relative z-10">
          <p className="text-[12px] font-mono tracking-[0.12em] tabular-nums text-black/90">
            {prettyNumber(number)}
          </p>
          <div className="flex justify-between items-end mt-1.5 gap-2">
            <p className="text-[11px] font-bold tracking-wide truncate">{holder}</p>
            <div className="flex items-center gap-2 shrink-0">
              <p className="text-[10px] font-mono">{expiry}</p>
              <MastercardLogo size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BancolombiaBack({ cvv, number }: { cvv: string; number: string }) {
  const last4 = onlyDigits(number).slice(-4) || '••••';
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-black/5"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: '#FFDD00',
      }}
    >
      <div className="relative h-full flex flex-col text-black">
        <p className="text-[6px] px-2.5 pt-1.5 text-black/50 truncate">
          Colombia 018000912345 · Simulacion SmartInventory
        </p>
        <div className="mt-1 h-8 bg-black w-full" />
        <div className="px-3 mt-3 space-y-2">
          <div className="h-6 bg-white rounded-sm flex items-center justify-between px-2 shadow-sm">
            <span className="font-mono text-[9px] tracking-widest text-black/50">
              {prettyNumber(number)}
            </span>
            <span className="font-mono text-[11px] font-bold">{last4}</span>
          </div>
          <div className="h-6 bg-white rounded-sm flex items-center justify-end px-2 shadow-sm">
            <span className="font-mono text-[12px] italic tracking-widest">
              {cvv.padEnd(3, '•').slice(0, 4)}
            </span>
          </div>
        </div>
        <div className="mt-auto px-3 pb-2.5 flex items-center justify-between">
          <BancolombiaMark className="text-[9px]" />
          <span className="text-[6px] text-black/45 max-w-[45%] text-right leading-tight">
            Hecha de plastico reciclado · simulacion
          </span>
        </div>
      </div>
    </div>
  );
}

function FalabellaFront({
  holder,
  number,
  expiry,
  cardKind,
}: {
  holder: string;
  number: string;
  expiry: string;
  cardKind: CardKind;
}) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-white/10"
      style={{
        backfaceVisibility: 'hidden',
        background: 'linear-gradient(180deg, #43A047 0%, #2E7D32 55%, #1B5E20 100%)',
      }}
    >
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%)',
        }}
      />
      <div className="relative h-full p-3 flex flex-col text-white">
        <div className="flex items-center gap-2">
          <Chip />
          <Contactless />
          <span className="ml-auto text-[7px] uppercase tracking-[0.18em] text-white/70">
            {cardKind === 'credito' ? 'Credito' : 'Debito'}
          </span>
        </div>

        <div className="mt-8">
          <p
            className="text-[34px] font-black tracking-tight leading-none"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            CMR
          </p>
          <p className="text-[11px] font-medium mt-1.5 tracking-wide">Banco Falabella</p>
        </div>

        <div className="mt-auto space-y-1.5">
          <p className="text-[10px] font-mono tracking-[0.1em] tabular-nums">{prettyNumber(number)}</p>
          <div className="flex justify-between items-end gap-1">
            <p className="text-[9px] font-semibold truncate tracking-wide">{holder}</p>
            <p className="text-[9px] font-mono shrink-0">{expiry}</p>
          </div>
          <div className="flex justify-center pt-2">
            <MastercardLogo />
          </div>
        </div>
      </div>
    </div>
  );
}

function FalabellaBack({ cvv }: { cvv: string }) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-white/10"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: 'linear-gradient(180deg, #2E7D32 0%, #1B5E20 100%)',
      }}
    >
      <div className="h-full flex flex-col text-white">
        <p className="text-[7px] px-3 pt-2 text-white/45">CMR Banco Falabella · simulacion</p>
        <div className="mt-2 h-8 bg-black w-full" />
        <div className="px-3 mt-4">
          <div className="h-7 bg-white rounded-sm flex items-center justify-end px-2">
            <span className="font-mono text-[12px] text-[#1a1a1a] italic tracking-widest">
              {cvv.padEnd(3, '•').slice(0, 4)}
            </span>
          </div>
          <p className="text-[7px] text-white/40 mt-3 leading-relaxed">
            Vista previa visual. No almacenamos ni cobramos con estos datos.
          </p>
        </div>
        <div className="mt-auto pb-4 flex justify-center">
          <span
            className="text-xl font-black tracking-tight"
            style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}
          >
            CMR
          </span>
        </div>
      </div>
    </div>
  );
}

function BbvaGeoPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 340 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="bbvaBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0A2F5C" />
          <stop offset="55%" stopColor="#004481" />
          <stop offset="100%" stopColor="#072A4A" />
        </linearGradient>
      </defs>
      <rect width="340" height="200" fill="url(#bbvaBase)" />
      <polygon points="0,0 90,0 40,70" fill="#1464A5" opacity="0.55" />
      <polygon points="90,0 170,0 120,55" fill="#0D3B6E" opacity="0.7" />
      <polygon points="170,0 260,0 210,80" fill="#1A6FB0" opacity="0.45" />
      <polygon points="260,0 340,0 340,60 280,40" fill="#0B355F" opacity="0.8" />
      <polygon points="40,70 120,55 160,120 70,130" fill="#155A96" opacity="0.4" />
      <polygon points="120,55 210,80 230,140 160,120" fill="#0E4478" opacity="0.55" />
      <polygon points="210,80 280,40 340,60 340,130 250,150" fill="#1976B8" opacity="0.35" />
      <polygon points="0,90 70,130 50,200 0,200" fill="#0A3A68" opacity="0.65" />
      <polygon points="70,130 160,120 180,200 50,200" fill="#125890" opacity="0.4" />
      <polygon points="160,120 250,150 280,200 180,200" fill="#0C4A7A" opacity="0.5" />
      <polygon points="250,150 340,130 340,200 280,200" fill="#1B6EAD" opacity="0.35" />
      <polygon points="100,20 150,10 140,50" fill="#2A8AD4" opacity="0.35" />
      <polygon points="220,100 270,90 255,140" fill="#2480C4" opacity="0.3" />
    </svg>
  );
}

function Hologram() {
  return (
    <div
      className="w-10 h-10 rounded-sm border border-white/30 shrink-0 overflow-hidden relative"
      style={{
        background:
          'linear-gradient(135deg, #c0c8d4 0%, #e8eef5 25%, #9aa8b8 50%, #d5dde8 75%, #a8b4c4 100%)',
      }}
      aria-hidden
    >
      <div className="absolute inset-1 opacity-40">
        <div className="w-full h-full rounded-sm border border-slate-500/40" />
        <div className="absolute inset-2 rounded-full border border-slate-600/30" />
      </div>
    </div>
  );
}

function BbvaFront({
  holder,
  number,
  expiry,
  cardKind,
}: {
  holder: string;
  number: string;
  expiry: string;
  cardKind: CardKind;
}) {
  const first4 = onlyDigits(number).slice(0, 4) || '••••';
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-white/10"
      style={{ backfaceVisibility: 'hidden' }}
    >
      <BbvaGeoPattern />
      <div className="relative h-full p-3.5 flex flex-col text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase">BBVA</p>
            <p className="text-[7px] uppercase tracking-widest text-white/50 mt-0.5">
              {cardKind === 'credito' ? 'Credito' : 'Debito'}
            </p>
          </div>
          <MastercardLogo />
        </div>

        <div className="flex items-center justify-between mt-4">
          <Chip />
          <Hologram />
        </div>

        <div className="mt-auto">
          <p className="text-[14px] font-mono tracking-[0.14em] tabular-nums drop-shadow">
            {prettyNumber(number)}
          </p>
          <p className="text-[8px] font-mono text-white/55 mt-0.5 tracking-widest">{first4}</p>
          <div className="flex justify-between items-end mt-2 gap-2">
            <p className="text-[11px] font-semibold tracking-[0.1em] truncate uppercase">{holder}</p>
            <div className="text-right shrink-0">
              <p className="text-[6px] uppercase tracking-wider text-white/45">Expires end</p>
              <p className="text-[11px] font-mono">{expiry}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BbvaBack({ cvv }: { cvv: string }) {
  return (
    <div
      className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl border border-white/10"
      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
    >
      <BbvaGeoPattern />
      <div className="relative h-full flex flex-col text-white">
        <p className="text-[6px] px-3 pt-1.5 text-white/50 truncate">
          Atencion BBVA · Simulacion SmartInventory · no se procesa el pago
        </p>
        <div className="mt-1 h-9 bg-black w-full" />
        <div className="px-3 mt-3">
          <div
            className="h-7 rounded-sm flex items-center justify-end px-2"
            style={{
              background:
                'repeating-linear-gradient(-45deg, #f5f5f5, #f5f5f5 4px, #e0e7ff 4px, #e0e7ff 8px)',
            }}
          >
            <span className="font-mono text-[12px] text-[#1a1a1a] italic tracking-widest bg-white/80 px-1.5 rounded-sm">
              {cvv.padEnd(3, '•').slice(0, 4)}
            </span>
          </div>
          <p className="text-[6.5px] text-white/40 mt-3 leading-relaxed">
            Esta tarjeta es una vista previa visual. Al confirmar solo se registra el metodo de pago
            (Credito/Debito). No se almacena el numero ni el CVV.
          </p>
        </div>
        <div className="mt-auto px-3 pb-2.5 flex justify-between items-end">
          <span className="text-[10px] font-bold tracking-[0.2em]">BBVA</span>
          <MastercardLogo size="sm" />
        </div>
      </div>
    </div>
  );
}

export function ChatInteractiveCard({ data, cardKind, bank, flipped }: ChatInteractiveCardProps) {
  const holder = data.holder.trim().toUpperCase() || 'NOMBRE TITULAR';
  const expiry = data.expiry.trim() || 'MM/YY';
  const cvv = data.cvv.trim() || '•••';
  const isVertical = bank === 'falabella';

  return (
    <div
      className={`relative mx-auto ${isVertical ? 'w-[58%] max-w-[200px]' : 'w-full'}`}
      style={{ perspective: '1000px' }}
    >
      <div
        className="relative w-full transition-transform duration-500 ease-out"
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          aspectRatio: isVertical ? '0.63 / 1' : '1.7 / 1',
        }}
      >
        {bank === 'nu' && (
          <>
            <NuFront holder={holder} number={data.number} expiry={expiry} cardKind={cardKind} />
            <NuBack cvv={cvv} />
          </>
        )}
        {bank === 'bancolombia' && (
          <>
            <BancolombiaFront
              holder={holder}
              number={data.number}
              expiry={expiry}
              cardKind={cardKind}
            />
            <BancolombiaBack cvv={cvv} number={data.number} />
          </>
        )}
        {bank === 'falabella' && (
          <>
            <FalabellaFront
              holder={holder}
              number={data.number}
              expiry={expiry}
              cardKind={cardKind}
            />
            <FalabellaBack cvv={cvv} />
          </>
        )}
        {bank === 'bbva' && (
          <>
            <BbvaFront holder={holder} number={data.number} expiry={expiry} cardKind={cardKind} />
            <BbvaBack cvv={cvv} />
          </>
        )}
      </div>
    </div>
  );
}

export function PaymentSimulationNotice() {
  return (
    <p className="text-[9px] font-mono leading-relaxed text-amber-200/90 bg-amber-500/10 border border-amber-500/30 px-2 py-1.5">
      Simulacion de pago: el numero y CVV son solo visuales. No se envian ni se cobran. Solo se
      registra el metodo (Credito/Debito).
    </p>
  );
}

export default ChatInteractiveCard;
