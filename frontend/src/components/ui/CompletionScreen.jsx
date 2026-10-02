export default function CompletionScreen() {
  return (
    <div className="overlay completion-overlay" data-testid="completion-screen">
      <div className="completion-inner">
        <div className="photo-frame reveal" style={{ animationDelay: "0.1s" }}>
          <img src="/casal.jpg" alt="Nós dois" data-testid="couple-photo" />
          <span className="photo-heart">❤</span>
        </div>

        <h2 className="completion-title reveal" style={{ animationDelay: "0.45s" }}>
          Feliz aniversário, meu amor. <span className="accent">❤</span>
        </h2>

        <div className="completion-message">
          <p className="reveal" style={{ animationDelay: "0.7s" }}>
            Eu nunca fui muito bom com palavras, mas quero que você saiba que
            você é uma das pessoas mais importantes da minha vida.
          </p>
          <p className="reveal" style={{ animationDelay: "0.95s" }}>
            Sou muito feliz por ter você comigo e por poder viver tantos
            momentos ao seu lado. Te amo tanto quanto a dificuldade de fazer
            isso aqui. Obrigado por ser você, por estar comigo e por fazer
            parte da minha vida.
          </p>
          <p className="reveal strong" style={{ animationDelay: "1.2s" }}>
            Eu te amo muito, Thami. ❤
          </p>
          <p className="reveal" style={{ animationDelay: "1.45s" }}>
            Feliz aniversário. 🥰
          </p>
        </div>

        <button
          className="btn-ghost reveal"
          style={{ animationDelay: "1.7s" }}
          data-testid="replay-button"
          onClick={() => window.location.reload()}
        >
          Jogar de novo
        </button>
      </div>
    </div>
  );
}
