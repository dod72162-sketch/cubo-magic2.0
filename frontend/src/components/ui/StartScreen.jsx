import { useGameStore } from "../../store/gameStore";
import { unlockAudio } from "../../game/sound";
import { SKINS } from "../../game/skins";

export default function StartScreen() {
  const start = useGameStore((s) => s.start);
  const skinId = useGameStore((s) => s.skinId);
  const setSkin = useGameStore((s) => s.setSkin);

  const handle = () => {
    unlockAudio();
    start();
  };

  return (
    <div className="overlay intro-overlay" data-testid="start-screen">
      <div className="intro-card">
        <div className="intro-eyebrow">
          <span>um presente feito com carinho</span>
        </div>
        <h1 className="intro-title">
          Para você,
          <br />
          <span className="accent">Thami</span>
          <span className="heart"> ❤</span>
        </h1>
        <p className="intro-sub">
          Montei um Cubo Mágico de verdade só pra você. Resolva as seis faces
          e descubra o que preparei no final.
        </p>

        <div className="skin-picker" data-testid="skin-picker">
          <span className="skin-picker-label">Escolha o estilo do cubo</span>
          <div className="skin-row">
            {SKINS.map((sk) => (
              <button
                key={sk.id}
                className={`skin-chip ${skinId === sk.id ? "active" : ""}`}
                data-testid={`skin-${sk.id}`}
                onClick={() => setSkin(sk.id)}
                title={sk.name}
              >
                <span className="skin-swatch">
                  {["U", "R", "F", "D", "L", "B"].map((f) => (
                    <i key={f} style={{ background: sk.faces[f] }} />
                  ))}
                </span>
                <span className="skin-name">{sk.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="btn-primary" data-testid="start-button" onClick={handle}>
          Começar
        </button>
        <p className="intro-hint">
          Arraste as camadas · gire a câmera · use as teclas R L U D F B
        </p>
      </div>
    </div>
  );
}
