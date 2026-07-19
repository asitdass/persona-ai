(function () {
  'use strict';

  const script = document.currentScript;
  const publicKey = script?.getAttribute('data-assistant');
  const baseUrl = script?.getAttribute('data-url') || script?.src.replace(/\/widget\.js.*$/, '');

  if (!publicKey || !baseUrl) {
    console.error('PersonaAI: Missing data-assistant or data-url attribute');
    return;
  }

  const WIDGET_ID = 'persona-ai-widget';

  if (document.getElementById(WIDGET_ID)) return;

  // Create shadow host
  const host = document.createElement('div');
  host.id = WIDGET_ID;
  host.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;';
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .persona-btn {
      width: 56px; height: 56px; border-radius: 50%;
      background: #6366f1; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .persona-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }
    .persona-btn svg { width: 24px; height: 24px; fill: white; }
    .persona-frame {
      position: absolute; bottom: 70px; right: 0;
      width: 380px; height: 560px; max-height: calc(100vh - 100px);
      border: none; border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      display: none; overflow: hidden;
      background: white;
    }
    .persona-frame.open { display: block; }
    @media (max-width: 420px) {
      .persona-frame {
        width: calc(100vw - 32px); right: -4px;
        height: calc(100vh - 100px);
      }
    }
  `;
  shadow.appendChild(style);

  // Button
  const btn = document.createElement('button');
  btn.className = 'persona-btn';
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';
  btn.setAttribute('aria-label', 'Open chat assistant');
  shadow.appendChild(btn);

  // Iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'persona-frame';
  iframe.src = baseUrl + '/embed/' + publicKey;
  iframe.setAttribute('title', 'PersonaAI Chat');
  iframe.setAttribute('loading', 'lazy');
  shadow.appendChild(iframe);

  let isOpen = false;
  btn.addEventListener('click', function () {
    isOpen = !isOpen;
    iframe.classList.toggle('open', isOpen);
    btn.innerHTML = isOpen
      ? '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>';
  });

  // Fetch theme color
  fetch(baseUrl + '/api/public/assistant?key=' + publicKey)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.themeColor) {
        btn.style.background = data.themeColor;
      }
    })
    .catch(function () {});
})();
