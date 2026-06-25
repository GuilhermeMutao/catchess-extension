let selectedProfile = 'balanced';

const locales = {
  'pt': {
    title: "Perfil da revisão",
    subtitle: "Escolha a profundidade da analise Stockfish.",
    fast: "Rapido",
    balanced: "Balanceado",
    precise: "Maxima precisao",
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
    precise: "Maximum precision",
    cancel: "Cancel",
    confirm: "Confirm",
    errorExtraction: "Could not extract game from this page. Make sure you are in a game or analysis board.",
    errorTab: "Please open a chess.com game first."
  }
};

const userLang = navigator.language || navigator.userLanguage;
const lang = userLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
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
