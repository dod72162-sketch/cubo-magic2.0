import "@/App.css";
import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import RubiksScene from "@/components/game/RubiksScene";
import StartScreen from "@/components/ui/StartScreen";
import GameHUD from "@/components/ui/GameHUD";
import CompletionScreen from "@/components/ui/CompletionScreen";
import Confetti from "@/components/effects/Confetti";

function App() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    const h = window.location.hash;
    if (h.includes("win")) useGameStore.getState().setPhase("completed");
    else if (h.includes("play")) useGameStore.getState().start();
    if (h.includes("flip")) setTimeout(() => useGameStore.getState().toggleFlip(), 300);
  }, []);

  return (
    <div className="app-root" data-testid="app-root">
      <RubiksScene />
      <div className="vignette" />

      {phase === "intro" && <StartScreen />}
      {phase === "playing" && <GameHUD />}
      {phase === "celebrating" && <div className="flash" data-testid="win-flash" />}
      {(phase === "celebrating" || phase === "completed") && <Confetti />}
      {phase === "completed" && <CompletionScreen />}
    </div>
  );
}

export default App;
