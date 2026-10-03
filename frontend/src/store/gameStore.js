import { create } from "zustand";
import { SKINS } from "../game/skins";

export const useGameStore = create((set) => ({
  phase: "intro", // intro | playing | celebrating | completed
  moves: 0,
  soundEnabled: true,
  completedFaces: [],
  skinId: "classic",
  ready: false,
  flipped: false,

  start: () => set({ phase: "playing", moves: 0, completedFaces: [], ready: false, flipped: false }),
  toggleFlip: () => set((s) => ({ flipped: !s.flipped })),
  setReady: (ready) => set({ ready }),
  setPhase: (phase) => set({ phase }),
  incMoves: () => set((s) => ({ moves: s.moves + 1 })),
  setCompletedFaces: (completedFaces) => set({ completedFaces }),
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  setSkin: (skinId) => set({ skinId }),
  cycleSkin: () =>
    set((s) => {
      const i = SKINS.findIndex((k) => k.id === s.skinId);
      return { skinId: SKINS[(i + 1) % SKINS.length].id };
    }),
  reset: () => set({ phase: "intro", moves: 0, completedFaces: [], flipped: false }),
}));

if (typeof window !== "undefined") window.__gameStore = useGameStore;
