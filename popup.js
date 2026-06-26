let selectedProfile = 'balanced';

const locales = {
  'pt': {
    title: "Perfil da revisão",
    subtitle: "Escolha a profundidade da analise Stockfish.",
    fast: "Rápido",
    balanced: "Balanceado",
    precise: "Máxima precisão",
    cancel: "Cancelar",
    confirm: "Confirmar",
    errorExtraction: "Não foi possível extrair a partida desta página. Certifique-se de estar em uma partida ou análise.",
    errorTab: "Por favor, abra uma partida no chess.com primeiro."
  },
  'en': {
    title: "Review Profile",
    subtitle: "Choose the Stockfish analysis depth.",
    fast: "Fast",
    balanced: "Balanced",
    precise: "Maximum Precision",
    cancel: "Cancel",
    confirm: "Confirm",
    errorExtraction: "Could not extract game from this page. Make sure you are in a game or analysis board.",
    errorTab: "Please open a chess.com game first."
  },
  'es': {
    title: "Perfil de revisión",
    subtitle: "Elige la profundidad del análisis Stockfish.",
    fast: "Rápido",
    balanced: "Equilibrado",
    precise: "Máxima precisión",
    cancel: "Cancelar",
    confirm: "Confirmar",
    errorExtraction: "No se pudo extraer la partida de esta página. Asegúrate de estar en una partida o tablero de análisis.",
    errorTab: "Por favor, abre una partida en chess.com primero."
  },
  'fr': {
    title: "Profil d'analyse",
    subtitle: "Choisissez la profondeur d'analyse Stockfish.",
    fast: "Rapide",
    balanced: "Équilibré",
    precise: "Précision maximale",
    cancel: "Annuler",
    confirm: "Confirmer",
    errorExtraction: "Impossible d'extraire la partie de cette page. Assurez-vous d'être sur une partie ou un tableau d'analyse.",
    errorTab: "Veuillez d'abord ouvrir une partie sur chess.com."
  },
  'de': {
    title: "Analyseprofil",
    subtitle: "Wähle die Stockfish-Analysetiefe.",
    fast: "Schnell",
    balanced: "Ausgewogen",
    precise: "Maximale Präzision",
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    errorExtraction: "Das Spiel konnte von dieser Seite nicht extrahiert werden. Stelle sicher, dass du dich auf einer Partie oder Analyseplatte befindest.",
    errorTab: "Bitte öffne zuerst eine Partie auf chess.com."
  }
};

function detectLang() {
  const raw = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  if (raw.startsWith('pt')) return 'pt';
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('de')) return 'de';
  return 'en';
}

const lang = detectLang();
const t = locales[lang];

document.getElementById('t-title').textContent = t.title;
document.getElementById('t-subtitle').textContent = t.subtitle;
document.getElementById('t-fast').textContent = t.fast;
document.getElementById('t-balanced').textContent = t.balanced;
document.getElementById('t-precise').textContent = t.precise;
document.getElementById('t-cancel').textContent = t.cancel;
document.getElementById('t-confirm').textContent = t.confirm;

document.querySelectorAll('.option-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    e.target.classList.add('selected');
    selectedProfile = e.target.getAttribute('data-profile');
  });
});

document.getElementById('t-cancel').addEventListener('click', () => {
  window.close();
});

document.getElementById('t-confirm').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab && tab.url && tab.url.includes("chess.com")) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: () => {
        try {
          const board = document.querySelector('wc-chess-board') || document.querySelector('chess-board');
          if (board && board.game && typeof board.game.getPGN === 'function') {
            const pgn = board.game.getPGN();
            if (pgn) return pgn;
          }
          if (window.chesscom && window.chesscom.game && window.chesscom.game.pgn) {
            return window.chesscom.game.pgn;
          }
          if (window.chesscom && window.chesscom.shareData && window.chesscom.shareData.pgn) {
            return window.chesscom.shareData.pgn;
          }
        } catch (e) {
          console.error("Catchess extraction error:", e);
        }
        return null;
      }
    }, (results) => {
      const pgn = results && results[0] && results[0].result;
      if (pgn) {
        const catchessUrl = `https://catchess.org/?pgn=${encodeURIComponent(pgn)}&profile=${selectedProfile}`;
        chrome.tabs.create({ url: catchessUrl });
        window.close();
      } else {
        alert(t.errorExtraction);
      }
    });
  } else {
    alert(t.errorTab);
  }
});
