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
            fast: "Rapido",
            balanced: "Balanceado",
            precise: "Maxima precisao",
            cancel: "Cancelar",
            confirm: "Confirmar"
          },
          'en': {
            title: "Review Profile",
            subtitle: "Choose the Stockfish analysis depth.",
            fast: "Fast",
            balanced: "Balanced",
            precise: "Maximum precision",
            cancel: "Cancel",
            confirm: "Confirm"
          }
        };

        const userLang = navigator.language || navigator.userLanguage;
        const lang = userLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
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
