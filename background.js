function extractAndOpenCatchess(tab, profile = 'balanced') {
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
    if (chrome.runtime.lastError) {
      console.error("Script execution failed:", chrome.runtime.lastError.message);
      return;
    }
    
    const pgn = results && results[0] && results[0].result;
    if (pgn) {
      const catchessUrl = `https://catchess.org/?pgn=${encodeURIComponent(pgn)}&profile=${profile}`;
      chrome.tabs.create({ url: catchessUrl });
    } else {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          alert("Não foi possível extrair a partida desta página. Certifique-se de estar em uma partida ou análise (a página precisa estar carregada por completo).");
        }
      });
    }
  });
}

chrome.action.onClicked.addListener((tab) => {
  // If the extension has a popup, this event won't trigger anymore.
  // Kept here just in case popup is removed.
  if (tab.url && tab.url.includes("chess.com")) {
    extractAndOpenCatchess(tab, 'balanced');
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TRIGGER_CATCHESS" && sender.tab) {
    extractAndOpenCatchess(sender.tab, request.profile || 'balanced');
  }
});
