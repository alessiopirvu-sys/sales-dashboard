"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { PartyPopper, Volume2, VolumeX } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";

export type SaleCelebrationHandle = {
  celebrate: (sellerName: string, amount: number) => void;
};

type QueueItem = { id: number; sellerName: string; amount: number };

const DISPLAY_MS = 10000;

const CELEBRATION_SOUND_URL = "/sounds/celebration.mp3";

const CONFETTI_COLORS = ["#7C3AED", "#A78BFA", "#F59E0B", "#2563EB", "#ffffff"];
const CONFETTI_PIECE_COUNT = 60;

// Coriandoli in puro CSS/DOM (niente canvas-confetti): il browser TV che
// mostra questa pagina puo' avere un motore JS molto vecchio, meglio
// restare su animazioni CSS di base che funzionano ovunque.
function ConfettiOverlay({ pieceKey }: { pieceKey: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_PIECE_COUNT }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        delay: Math.random() * 0.6,
        duration: 2.6 + Math.random() * 1.6,
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pieceKey]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="absolute top-[-5%] block animate-[confettiFall_var(--confetti-duration)_ease-in_var(--confetti-delay)_1]"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size * 0.6,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate}deg)`,
              "--confetti-duration": `${piece.duration}s`,
              "--confetti-delay": `${piece.delay}s`
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export const SaleCelebration = forwardRef<SaleCelebrationHandle>(function SaleCelebration(_props, ref) {
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const queueRef = useRef<QueueItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    try {
      audioRef.current = new Audio(CELEBRATION_SOUND_URL);
      audioRef.current.preload = "auto";
    } catch {
      // Se l'API Audio non e' disponibile su questo browser, niente suono ma il resto funziona.
    }
  }, []);

  // Il browser blocca l'audio finche' non c'e' un click reale dell'utente:
  // qui e' esplicito (bottone visibile), non un listener "invisibile" che
  // rischia di non scattare mai su una TV che nessuno tocca.
  const enableAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        setIsAudioUnlocked(true);
      })
      .catch(() => {
        setIsAudioUnlocked(false);
      });
  };

  const playNext = () => {
    const next = queueRef.current.shift();
    if (!next) {
      setCurrent(null);
      return;
    }
    setCurrent(next);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {
        // Se l'audio non e' ancora sbloccato non blocchiamo comunque coriandoli/scheda.
      });
    }
    window.setTimeout(() => {
      playNext();
    }, DISPLAY_MS);
  };

  useImperativeHandle(ref, () => ({
    celebrate(sellerName: string, amount: number) {
      const wasEmpty = queueRef.current.length === 0 && !current;
      queueRef.current.push({ id: idRef.current++, sellerName, amount });
      if (wasEmpty) playNext();
    }
  }));

  return (
    <>
      <button
        type="button"
        onClick={enableAudio}
        className="fixed bottom-5 right-5 z-[110] flex items-center gap-2 rounded-full bg-slate-950/80 px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
      >
        {isAudioUnlocked ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-rose-400" />}
        {isAudioUnlocked ? "Audio attivo" : "Attiva audio"}
      </button>

      {current ? (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
          <ConfettiOverlay pieceKey={current.id} />
          <div className="flex h-full items-center justify-center">
            <div className="animate-[celebrationPop_0.4s_ease-out] rounded-[2.5rem] bg-white px-24 py-16 text-center shadow-[0_48px_96px_-24px_rgba(88,28,135,0.5)]">
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
                <PartyPopper className="h-14 w-14 text-primary" />
              </div>
              <p className="mt-6 text-xl font-semibold uppercase tracking-[0.22em] text-slate-500">Nuova vendita!</p>
              <p className="mt-3 font-display text-7xl font-bold tracking-tight text-slate-950">{current.sellerName}</p>
              <p className="mt-5 text-8xl font-bold tracking-[-0.03em] text-primary">{formatCurrency(current.amount)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
});
