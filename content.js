async function extractPGN() {
    // 1. Try to fetch directly from chess.com callback API if URL matches
    const match = window.location.pathname.match(/\/(?:analysis\/)?game\/(live|daily)\/(\d+)/);
    if (match) {
        const gameType = match[1];
        const gameId = match[2];
        try {
            const response = await fetch(`https://www.chess.com/callback/${gameType}/game/${gameId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.game && data.game.pgn) {
                    return data.game.pgn;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch PGN from callback", e);
        }
    }
    
    // 2. Try to get it from the page DOM using an injected script
    return new Promise((resolve) => {
      const listener = (event) => {
        if (event.source !== window || !event.data || event.data.type !== "CATCHESS_PGN_EXTRACTED") {
          return;
        }
        window.removeEventListener("message", listener);
        resolve(event.data.pgn);
      };
      window.addEventListener("message", listener);

      const script = document.createElement('script');
      script.textContent = `
        (function() {
          try {
              let pgn = "";
              const board = document.querySelector('wc-chess-board');
              if (board && board.game && typeof board.game.getPGN === 'function') {
                  pgn = board.game.getPGN();
              }
              // Fallback for some chess.com views
              if (!pgn && window.chesscom && window.chesscom.game && window.chesscom.game.pgn) {
                  pgn = window.chesscom.game.pgn;
              }
              window.postMessage({ type: "CATCHESS_PGN_EXTRACTED", pgn: pgn }, "*");
          } catch (e) {
              window.postMessage({ type: "CATCHESS_PGN_EXTRACTED", pgn: null, error: e.toString() }, "*");
          }
        })();
      `;
      document.head.appendChild(script);
      script.remove();
      
      // Fallback timeout in case script fails to execute or post message
      setTimeout(() => {
          window.removeEventListener("message", listener);
          resolve(null);
      }, 2000);
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXTRACT_PGN") {
    extractPGN().then(pgn => {
      sendResponse({ pgn: pgn });
    });
    return true; // Keep the message channel open for the async response
  }
});
