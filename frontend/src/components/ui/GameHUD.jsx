import { Volume2, VolumeX, RotateCcw, Palette } from "lucide-react";
import { useGameStore } from "../../store/gameStore";
import { moveBus } from "../../game/moveBus";
import { getSkin } from "../../game/skins";

const FACE_LABELS = { U: "Topo", D: "Base", F: "Frente", B: "Trás", L: "Esq.", R: "Dir." };
const ORDER = ["U", "D", "F", "B", "L", "R"];
const MOVES = ["R", "L", "U", "D", "F", "B"];

export default function GameHUD() {
  const moves = useGameStore((s) => s.moves);
  const soundEnabled = useGameStore((s) => s.soundEnabled);
  const toggleSound = useGameStore((s) => s.toggleSound);
  const completedFaces = useGameStore((s) => s.completedFaces);
  const skinId = useGameStore((s) => s.skinId);
  const cycleSkin = useGameStore((s) => s.cycleSkin);
  const ready = useGameStore((s) => s.ready);
  const skin = getSkin(skinId);

  return (
    <div className="hud" data-testid="game-hud">
      <div className="hud-top">
        <div className="hud-stat" data-testid="moves-counter">
          <span className="hud-num">{moves}</span>
          <span className="hud-label">movimentos</span>
        </div>

        <div className="hud-faces" data-testid="faces-progress">
          {ORDER.map((f) => (
            <div
              key={f}
              className={`face-dot ${completedFaces.includes(f) ? "done" : ""}`}
              data-testid={`face-dot-${f}`}
              title={FACE_LABELS[f]}
            >
              {FACE_LABELS[f]}
            </div>
          ))}
        </div>

        <button
          className="hud-icon"
          onClick={toggleSound}
          data-testid="sound-toggle"
          aria-label="Alternar som"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </div>

      <div className="hud-right">
        <button
          className="skin-cycle"
          onClick={cycleSkin}
          data-testid="skin-cycle"
          aria-label="Trocar estilo do cubo"
        >
          <Palette size={16} />
          <span>{skin.name}</span>
        </button>
      </div>

      <div className="hud-bottom">
        <div className="move-pad" data-testid="move-pad">
          {MOVES.map((m) => (
            <div key={m} className="move-col">
              <button
                className="move-btn"
                data-testid={`move-${m}`}
                onClick={() => moveBus.emit(m)}
              >
                {m}
              </button>
              <button
                className="move-btn prime"
                data-testid={`move-${m}-prime`}
                onClick={() => moveBus.emit(m + "'")}
              >
                {m}
                <RotateCcw size={11} strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
        <p className="hud-tip">
          {ready
            ? "Arraste uma camada para girar · arraste o fundo para orbitar"
            : "Embaralhando o cubo…"}
        </p>
      </div>
    </div>
  );
}
