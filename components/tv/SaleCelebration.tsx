"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { PartyPopper, Volume2, VolumeX } from "lucide-react";

import { formatCurrency } from "@/lib/formatters";

export type SaleCelebrationHandle = {
  celebrate: (sellerName: string, amount: number) => void;
};

type QueueItem = { id: number; sellerName: string; amount: number };

const DISPLAY_MS = 10000;

const CELEBRATION_SOUND_URL = "/sounds/celebration.mp3";

function fireConfetti() {
  const colors = ["#7C3AED", "#A78BFA", "#F59E0B", "#2563EB", "#ffffff"];
  const end = Date.now() + 1400;

  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.4 }, colors, startVelocity: 55 });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.4 }, colors, startVelocity: 55 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, colors, startVelocity: 45, ticks: 200 });
}

export const SaleCelebration = forwardRef<SaleCelebrationHandle>(function SaleCelebration(_props, ref) {
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const queueRef = useRef<QueueItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idRef = useRef(0);

  const enableAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = false;
    audio.volume = 1;
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
    fireConfetti();
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
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
      <audio ref={audioRef} src={CELEBRATION_SOUND_URL} preload="auto" playsInline />

      <button
        type="button"
        onClick={enableAudio}
        className="fixed bottom-5 right-5 z-[110] flex items-center gap-2 rounded-full bg-slate-950/80 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-sm"
      >
        {isAudioUnlocked ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-rose-400" />}
        {isAudioUnlocked ? "Audio attivo" : "Attiva audio"}
      </button>

      {current ? (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
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
