(function() {
  let selectedProfile = 'balanced';

  function checkUrlAndInject() {
    const isGamePage = window.location.pathname.includes('/game/live/');
    
    let container = document.getElementById('catchess-floating-container');

    if (isGamePage) {
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
          
          <div class="logo-container">
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

        const closeAction = () => {
          container.style.display = 'none';
        };

        closeBtn.addEventListener('click', closeAction);
        cancelBtn.addEventListener('click', closeAction);

        confirmBtn.addEventListener('click', () => {
          chrome.runtime.sendMessage({ action: "TRIGGER_CATCHESS", profile: selectedProfile });
          closeAction();
        });
        
        document.body.appendChild(container);
      } else {
        container.style.display = 'block';
      }
    } else {
      if (container) {
        container.style.display = 'none';
      }
    }
  }

  // Initial check
  checkUrlAndInject();

  // Watch for client-side navigation (common in SPAs like chess.com)
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      checkUrlAndInject();
    }
  }).observe(document, {subtree: true, childList: true});
})();
