// Tiny pub/sub so 2D UI buttons can request cube moves from the 3D engine
// without coupling React re-renders to the render loop.
const listeners = new Set();

export const moveBus = {
  emit: (key) => listeners.forEach((l) => l(key)),
  on: (l) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};
