function extractAndOpenCatchess(tab, profile = 'balanced') {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    world: "MAIN",
    func: () => {
      try {
        const board = document.querySelector('wc-chess-board') || document.querySelector('chess-board');
        let pgn = null;
        let color = 'white';

        if (board && board.game && typeof board.game.getPGN === 'function') {
          pgn = board.game.getPGN();
        }
        
        if (!pgn && window.chesscom && window.chesscom.game && window.chesscom.game.pgn) {
          pgn = window.chesscom.game.pgn;
        }

        if (!pgn && window.chesscom && window.chesscom.shareData && window.chesscom.shareData.pgn) {
          pgn = window.chesscom.shareData.pgn;
        }

        if (board && board.hasAttribute('flip')) {
            color = 'black';
        } else if (board && board.className && typeof board.className === 'string' && board.className.includes('flipped')) {
            color = 'black';
        } else if (document.querySelector('.board.flipped')) {
            color = 'black';
        } else if (window.chesscom && window.chesscom.game && window.chesscom.game.playingAs === 2) {
            color = 'black';
        }

        if (pgn) return { pgn, color };
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
    
    const data = results && results[0] && results[0].result;
    if (data && data.pgn) {
      let catchessUrl = `https://catchess.org/?pgn=${encodeURIComponent(data.pgn)}&profile=${profile}`;
      if (data.color) {
          catchessUrl += `&color=${data.color}`;
      }
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
