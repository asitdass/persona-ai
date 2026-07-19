(function () {
  'use strict';

  const script = document.currentScript;
  const publicKey = script?.getAttribute('data-assistant') || script?.getAttribute('data-public-key');
  const baseUrl = script?.getAttribute('data-url') || script?.src.replace(/\/widget\.js.*$/, '');

  if (!publicKey || !baseUrl) {
    console.error('PersonaAI: Missing data-assistant or data-url attribute');
    return;
  }

  const WIDGET_ID = 'persona-ai-widget';
  if (document.getElementById(WIDGET_ID)) return;

  const host = document.createElement('div');
  host.id = WIDGET_ID;
  host.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2147483647;pointer-events:none;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
      70% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
      100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }

    .chat-bar-wrapper {
      display: flex;
      justify-content: center;
      padding: 16px 16px 24px;
      pointer-events: auto;
      animation: fadeUp 0.6s ease-out;
    }

    .chat-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(15, 15, 20, 0.85);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50px;
      padding: 10px 12px 10px 20px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      max-width: 480px;
      width: 100%;
      animation: pulse-ring 3s infinite;
    }

    .chat-bar:hover {
      background: rgba(15, 15, 20, 0.95);
      border-color: rgba(99, 102, 241, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.3);
    }

    .chat-bar:hover .ai-icon {
      animation: float 1.5s ease-in-out infinite;
    }

    .ai-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .ai-icon svg {
      width: 18px;
      height: 18px;
      fill: white;
    }

    .chat-bar-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .chat-bar-label {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.95);
      background: linear-gradient(90deg, #e2e8f0, #ffffff, #e2e8f0);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }

    .chat-bar-hint {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
    }

    .chat-arrow {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid rgba(99, 102, 241, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.3s;
    }

    .chat-bar:hover .chat-arrow {
      background: rgba(99, 102, 241, 0.4);
    }

    .chat-arrow svg {
      width: 14px;
      height: 14px;
      fill: rgba(255, 255, 255, 0.8);
    }

    .chat-frame-wrapper {
      display: none;
      justify-content: center;
      padding: 16px;
      pointer-events: auto;
      animation: fadeUp 0.3s ease-out;
    }

    .chat-frame-wrapper.open {
      display: flex;
    }

    .chat-frame-container {
      width: 100%;
      max-width: 500px;
      height: 520px;
      max-height: calc(100vh - 120px);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1);
      position: relative;
    }

    .chat-frame-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .chat-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: background 0.2s;
    }

    .chat-close:hover {
      background: rgba(0, 0, 0, 0.7);
    }

    .chat-close svg {
      width: 14px;
      height: 14px;
      fill: white;
    }

    @media (max-width: 540px) {
      .chat-bar { max-width: calc(100vw - 32px); }
      .chat-frame-container {
        max-width: calc(100vw - 32px);
        height: calc(100vh - 100px);
      }
    }
  `;
  shadow.appendChild(style);

  // Chat bar (visible by default)
  const barWrapper = document.createElement('div');
  barWrapper.className = 'chat-bar-wrapper';
  barWrapper.innerHTML = `
    <div class="chat-bar">
      <div class="ai-icon">
        <svg viewBox="0 0 24 24"><path d="M9.5 2A1.5 1.5 0 0 0 8 3.5v1A1.5 1.5 0 0 0 9.5 6h5A1.5 1.5 0 0 0 16 4.5v-1A1.5 1.5 0 0 0 14.5 2h-5zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-4 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm8 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"/></svg>
      </div>
      <div class="chat-bar-text">
        <span class="chat-bar-label">Ask AI about me</span>
        <span class="chat-bar-hint">Powered by AI — try &ldquo;What are your skills?&rdquo;</span>
      </div>
      <div class="chat-arrow">
        <svg viewBox="0 0 24 24"><path d="M5 12h14m-7-7l7 7-7 7"/><path d="M5 12h14" stroke="white" stroke-width="2" fill="none"/><path d="M13 5l7 7-7 7" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
    </div>
  `;
  shadow.appendChild(barWrapper);

  // Chat frame (hidden by default)
  const frameWrapper = document.createElement('div');
  frameWrapper.className = 'chat-frame-wrapper';
  frameWrapper.innerHTML = `
    <div class="chat-frame-container">
      <button class="chat-close" aria-label="Close chat">
        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      </button>
      <iframe src="${baseUrl}/embed/${publicKey}" title="PersonaAI Chat" loading="lazy"></iframe>
    </div>
  `;
  shadow.appendChild(frameWrapper);

  // Toggle logic
  const bar = barWrapper.querySelector('.chat-bar');
  const closeBtn = frameWrapper.querySelector('.chat-close');

  bar.addEventListener('click', function () {
    barWrapper.style.display = 'none';
    frameWrapper.classList.add('open');
  });

  closeBtn.addEventListener('click', function () {
    frameWrapper.classList.remove('open');
    barWrapper.style.display = 'flex';
  });

  // Fetch theme color and customize
  fetch(baseUrl + '/api/public/assistant?key=' + publicKey)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.themeColor) {
        const icon = shadow.querySelector('.ai-icon');
        if (icon) icon.style.background = 'linear-gradient(135deg, ' + data.themeColor + ', ' + data.themeColor + 'cc)';
      }
      if (data.name) {
        const label = shadow.querySelector('.chat-bar-label');
        if (label) label.textContent = 'Ask ' + data.name + ' anything';
      }
    })
    .catch(function () {});
})();
