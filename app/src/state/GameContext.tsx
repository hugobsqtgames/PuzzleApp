import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { DemoGame, freshGame, PuzzleKind } from '../content/vesperDemo';
import { finish, LastResult, makePuzzle, Puzzle } from './session';
import { loadDemo, saveDemo } from './demoStorage';
import { todayKey } from './demoSave';

interface GameCtx {
  game: DemoGame;
  puzzle: Puzzle | null;
  last: LastResult | null;
  toast: string | null;
  showToast: (text: string) => void;
  setPuzzle: (p: Puzzle) => void;
  openLantern: (slot: number) => void;
  openDaily: () => void;
  openTutorial: () => void;
  /** Ends the current puzzle; returns false if it was already finished. */
  complete: (p: Puzzle) => boolean;
  spend: (shards: number) => void;
  claimRoomReward: () => void;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [game, setGame] = useState<DemoGame>(() => loadDemo() ?? freshGame());
  const [puzzle, setPuzzleState] = useState<Puzzle | null>(null);
  const [last, setLast] = useState<LastResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors of the latest state, so rapid taps never finish a puzzle twice.
  const gameRef = useRef(game);
  gameRef.current = game;

  // Save after every change of progress (not of the puzzle being played).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    saveDemo(game);
  }, [game]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const open = useCallback((kind: PuzzleKind, extra: Partial<Puzzle> = {}) => {
    setPuzzleState(makePuzzle(kind, extra));
  }, []);

  const openLantern = useCallback((slot: number) => {
    const l = gameRef.current.room[slot];
    open(l.family, { slot, tier: l.tier });
  }, [open]);

  const complete = useCallback((p: Puzzle) => {
    const res = finish(gameRef.current, p, todayKey());
    if (!res) return false;
    gameRef.current = res.game;
    setGame(res.game);
    setPuzzleState(res.puzzle);
    setLast(res.last);
    return true;
  }, []);

  const spend = useCallback((n: number) => {
    setGame((g) => {
      const next = { ...g, shards: Math.max(0, g.shards - n) };
      gameRef.current = next;
      return next;
    });
  }, []);

  const claimRoomReward = useCallback(() => {
    setGame((g) => {
      if (g.roomRewarded) return g;
      const next = { ...g, roomRewarded: true, shards: g.shards + 20 };
      gameRef.current = next;
      return next;
    });
  }, []);

  const value = useMemo<GameCtx>(() => ({
    game, puzzle, last, toast, showToast,
    setPuzzle: setPuzzleState,
    openLantern,
    openDaily: () => open('BA'),
    openTutorial: () => open('TUTO'),
    complete, spend, claimRoomReward,
  }), [game, puzzle, last, toast, showToast, openLantern, open, complete, spend, claimRoomReward]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGame outside GameProvider');
  return v;
}
