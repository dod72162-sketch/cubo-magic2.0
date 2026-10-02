import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useGameStore } from "../../store/gameStore";

const COLORS = ["#e11d48", "#f59e0b", "#10b981", "#3b82f6", "#fb7185", "#ffffff"];

export default function Confetti() {
  const phase = useGameStore((s) => s.phase);
  const canvasRef = useRef(null);
  const started = useRef(false);
  const stop = useRef(false);

  useEffect(() => {
    const active = phase === "celebrating" || phase === "completed";
    if (!active || started.current) return;
    started.current = true;

    const fire = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: false,
    });

    // big celebratory bursts that cover the whole screen
    const burst = () => {
      fire({ particleCount: 140, spread: 110, startVelocity: 55, origin: { x: 0.5, y: 0.5 }, colors: COLORS });
      fire({ particleCount: 90, spread: 100, startVelocity: 45, origin: { x: 0.25, y: 0.4 }, colors: COLORS });
      fire({ particleCount: 90, spread: 100, startVelocity: 45, origin: { x: 0.75, y: 0.4 }, colors: COLORS });
    };
    burst();
    setTimeout(burst, 300);
    setTimeout(burst, 650);
    setTimeout(() => {
      fire({ particleCount: 120, angle: 60, spread: 85, startVelocity: 65, origin: { x: 0, y: 0.7 }, colors: COLORS });
      fire({ particleCount: 120, angle: 120, spread: 85, startVelocity: 65, origin: { x: 1, y: 0.7 }, colors: COLORS });
    }, 450);

    // gentle rain across the full width
    const end = Date.now() + 1000 * 120;
    const rain = () => {
      if (stop.current) return;
      fire({
        particleCount: 5,
        startVelocity: 0,
        ticks: 340,
        gravity: 0.55,
        origin: { x: Math.random(), y: -0.1 },
        colors: COLORS,
        scalar: 1.1,
      });
      if (Date.now() < end) setTimeout(rain, 120);
    };
    rain();

    return () => {
      stop.current = true;
    };
  }, [phase]);

  return <canvas ref={canvasRef} className="confetti-canvas" />;
}
