(function() {
  const STORAGE_KEY = 'catchess-dismissed-game-prompts';
  let selectedProfile = 'balanced';
  let currentGameKey = null;

  function loadDismissedGameKeys() {
    try {
      const rawDismissed = window.sessionStorage.getItem(STORAGE_KEY);
      const dismissed = JSON.parse(rawDismissed || '[]');
      return Array.isArray(dismissed) ? new Set(dismissed) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function saveDismissedGameKeys(dismissedGameKeys) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissedGameKeys]));
    } catch (e) {
      // Ignore storage failures. The in-memory Set still prevents repeated prompts while the page is open.
    }
  }

  const dismissedGameKeys = loadDismissedGameKeys();

  function getCurrentGameKey() {
    const match = window.location.pathname.match(/\/(?:analysis\/)?game\/(live|daily)\/(\d+)/);

    if (!match) {
      return null;
    }

    return `${match[1]}:${match[2]}`;
  }

  function hideContainer(container) {
    if (container) {
      container.style.setProperty('display', 'none', 'important');
    }
  }

  function showContainer(container) {
    if (container) {
      container.style.setProperty('display', 'flex', 'important');
    }
  }

  function markCurrentGameAsDismissed() {
    if (!currentGameKey) {
      return;
    }

    dismissedGameKeys.add(currentGameKey);
    saveDismissedGameKeys(dismissedGameKeys);
  }

  function checkUrlAndInject() {
    const gameKey = getCurrentGameKey();
    const isGamePage = Boolean(gameKey);
    let container = document.getElementById('catchess-floating-container');

    if (!isGamePage) {
      currentGameKey = null;
      hideContainer(container);
      return;
    }

    currentGameKey = gameKey;

    if (dismissedGameKeys.has(gameKey)) {
      hideContainer(container);
      return;
    }

    if (!container) {
      container = document.createElement('div');
      container.id = 'catchess-floating-container';

      const logoUrl = chrome.runtime.getURL('icon192.png');

      const locales = {
        'pt': {
          title: "Perfil da revisão",
          subtitle: "Escolha a profundidade da analise Stockfish.",
          fast: "Rápido",
          balanced: "Balanceado",
          precise: "Máxima precisão",
          cancel: "Cancelar",
          confirm: "Confirmar"
        },
        'en': {
          title: "Review Profile",
          subtitle: "Choose the Stockfish analysis depth.",
          fast: "Fast",
          balanced: "Balanced",
          precise: "Maximum Precision",
          cancel: "Cancel",
          confirm: "Confirm"
        },
        'es': {
          title: "Perfil de revisión",
          subtitle: "Elige la profundidad del análisis Stockfish.",
          fast: "Rápido",
          balanced: "Equilibrado",
          precise: "Máxima precisión",
          cancel: "Cancelar",
          confirm: "Confirmar"
        },
        'fr': {
          title: "Profil d'analyse",
          subtitle: "Choisissez la profondeur d'analyse Stockfish.",
          fast: "Rapide",
          balanced: "Équilibré",
          precise: "Précision maximale",
          cancel: "Annuler",
          confirm: "Confirmer"
        },
        'de': {
          title: "Analyseprofil",
          subtitle: "Wähle die Stockfish-Analysetiefe.",
          fast: "Schnell",
          balanced: "Ausgewogen",
          precise: "Maximale Präzision",
          cancel: "Abbrechen",
          confirm: "Bestätigen"
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

      container.innerHTML = `
        <button id="catchess-floating-close" title="${t.cancel}">✕</button>

        <div class="logo-container" id="catchess-logo-link" style="cursor: pointer;" title="Abrir Catchess.org">
          <img src="${logoUrl}" alt="Catchess Logo" class="logo-img" />
          <span class="logo-text">Catchess.org</span>
        </div>
        <h2>${t.title}</h2>
        <p class="subtitle">${t.subtitle}</p>

        <div class="options-container">
          <button class="option-btn" data-profile="fast">${t.fast}</button>
          <button class="option-btn selected" data-profile="balanced">${t.balanced}</button>
          <button class="option-btn" data-profile="precise">${t.precise}</button>
        </div>

        <div class="actions-container">
          <button class="btn-cancel" id="catchess-btn-cancel">${t.cancel}</button>
          <button class="btn-confirm" id="catchess-btn-confirm">${t.confirm}</button>
        </div>
      `;

      container.querySelectorAll('button.option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          container.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
          e.target.classList.add('selected');
          selectedProfile = e.target.getAttribute('data-profile');
        });
      });

      const closeBtn = container.querySelector('#catchess-floating-close');
      const cancelBtn = container.querySelector('#catchess-btn-cancel');
      const confirmBtn = container.querySelector('#catchess-btn-confirm');
      const logoLink = container.querySelector('#catchess-logo-link');

      const closeAction = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        markCurrentGameAsDismissed();
        hideContainer(container);
      };

      logoLink.addEventListener('click', () => {
        window.open('https://catchess.org/', '_blank');
      });

      closeBtn.addEventListener('click', closeAction);
      cancelBtn.addEventListener('click', closeAction);

      confirmBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "TRIGGER_CATCHESS", profile: selectedProfile });
        closeAction();
      });

      document.body.appendChild(container);
    }

    showContainer(container);
  }

  // Initial check
  checkUrlAndInject();

  // Watch for client-side navigation (common in SPAs like chess.com)
  let lastUrl = location.href;
  let navigationCheckTimeout = null;

  new MutationObserver(() => {
    const url = location.href;

    if (url !== lastUrl) {
      lastUrl = url;
      window.clearTimeout(navigationCheckTimeout);
      navigationCheckTimeout = window.setTimeout(checkUrlAndInject, 100);
    }
  }).observe(document, {subtree: true, childList: true});
})();
