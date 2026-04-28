// TerraFusion Local Agent Cockpit — renderer entrypoint.
//
// Runs with nodeIntegration:false + contextIsolation:true + sandbox:true.
// The only API available is the one exposed by preload.js as
// `window.terrafusion`. No Node APIs, no remote URLs, no raw-html injection
// — every piece of model output is rendered via textContent so the renderer
// is XSS-safe even if an adapter returns hostile bytes.

'use strict';

(function () {
  var api = (typeof window !== 'undefined' && window.terrafusion) || null;

  function $(id) {
    return document.getElementById(id);
  }
  function setText(id, value) {
    var el = $(id);
    if (el) el.textContent = String(value);
  }
  function setStreamState(state) {
    var el = $('stream-state');
    if (!el) return;
    el.textContent = state;
    el.dataset.state = state;
  }
  function setError(message) {
    var el = $('chat-error');
    if (!el) return;
    el.textContent = message ? String(message) : '';
  }

  // ---- Environment panel ------------------------------------------------
  if (api && typeof api.version === 'function') {
    setText('kv-version', api.version());
  }
  if (api && typeof api.platform === 'function') {
    setText('kv-platform', api.platform());
  }

  if (!api) {
    setError('Cockpit bridge unavailable — preload did not load.');
    return;
  }

  // ---- Daemon status ----------------------------------------------------
  function renderDaemonStatus(status) {
    var label = 'unknown';
    if (status && status.running === true) {
      label = 'running (pid ' + (status.pid || '?') + ')';
    } else if (status && status.running === false) {
      label = 'stopped';
    }
    setText('kv-daemon-status', label);
    return status && status.running === true;
  }

  function refreshDaemonStatus() {
    return api.daemonStatus().then(renderDaemonStatus, function (err) {
      setError(err && err.message ? err.message : String(err));
      return false;
    });
  }

  // ---- Adapter list -----------------------------------------------------
  function renderAdapters(list) {
    var select = $('adapter-select');
    if (!select) return;
    while (select.firstChild) select.removeChild(select.firstChild);
    var adapters = (list && list.adapters) || [];
    if (adapters.length === 0) {
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '(no adapters — start daemon)';
      opt.disabled = true;
      opt.selected = true;
      select.appendChild(opt);
      return;
    }
    for (var i = 0; i < adapters.length; i++) {
      var a = adapters[i];
      var o = document.createElement('option');
      o.value = String(a.id || '');
      o.textContent = String(a.id || '(unnamed)');
      select.appendChild(o);
    }
  }

  function refreshAdapters() {
    return api.adapterList().then(renderAdapters, function (err) {
      setError(err && err.message ? err.message : String(err));
    });
  }

  // ---- Daemon controls --------------------------------------------------
  $('btn-daemon-start').addEventListener('click', function () {
    setError('');
    api.daemonStart().then(function () {
      return refreshDaemonStatus();
    }).then(refreshAdapters).catch(function (err) {
      setError(err && err.message ? err.message : String(err));
    });
  });

  $('btn-daemon-stop').addEventListener('click', function () {
    setError('');
    cancelActiveStream();
    api.daemonStop().then(function () {
      return refreshDaemonStatus();
    }).then(refreshAdapters).catch(function (err) {
      setError(err && err.message ? err.message : String(err));
    });
  });

  $('btn-refresh-adapters').addEventListener('click', function () {
    setError('');
    refreshAdapters();
  });

  // ---- Chat surface -----------------------------------------------------
  function appendMessage(role, initialText) {
    var list = $('chat-messages');
    if (!list) return null;
    var li = document.createElement('li');
    li.dataset.role = role;
    var roleEl = document.createElement('span');
    roleEl.className = 'cockpit-msg-role';
    roleEl.textContent = role;
    var bodyEl = document.createElement('span');
    bodyEl.className = 'cockpit-msg-body';
    bodyEl.textContent = initialText || '';
    li.appendChild(roleEl);
    li.appendChild(bodyEl);
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;
    return bodyEl;
  }

  // Conversation memory — kept out of the DOM so we can re-send context.
  var conversation = [];
  var activeStream = null; // { handle, assistantBody }

  function setStreamingUI(streaming) {
    $('btn-chat-send').disabled = streaming;
    $('btn-chat-cancel').disabled = !streaming;
    $('chat-input').disabled = streaming;
    setStreamState(streaming ? 'streaming' : 'idle');
  }

  function cancelActiveStream() {
    if (!activeStream) return Promise.resolve();
    var handle = activeStream.handle;
    activeStream = null;
    setStreamingUI(false);
    if (handle && typeof handle.cancel === 'function') {
      return handle.cancel().catch(function () {
        // Cancel race conditions are non-fatal.
      });
    }
    return Promise.resolve();
  }

  $('btn-chat-cancel').addEventListener('click', function () {
    cancelActiveStream();
  });

  $('chat-form').addEventListener('submit', function (event) {
    event.preventDefault();
    setError('');

    var input = $('chat-input');
    var select = $('adapter-select');
    var adapterId = select && select.value;
    var prompt = (input && input.value) ? input.value.trim() : '';

    if (!prompt) {
      setError('Type a message before sending.');
      return;
    }
    if (!adapterId) {
      setError('No adapter selected. Start the daemon, then refresh adapters.');
      return;
    }

    appendMessage('user', prompt);
    var assistantBody = appendMessage('assistant', '');
    if (input) input.value = '';

    conversation.push({ role: 'user', content: prompt });
    var requestMessages = conversation.slice();

    setStreamingUI(true);
    var assembled = '';

    var handle = api.adapterChat({
      adapterId: adapterId,
      request: { messages: requestMessages },
      onChunk: function (chunk) {
        if (!chunk || typeof chunk.kind !== 'string') return;
        if (chunk.kind === 'text' && typeof chunk.text === 'string') {
          assembled += chunk.text;
          if (assistantBody) assistantBody.textContent = assembled;
          var list = $('chat-messages');
          if (list) list.scrollTop = list.scrollHeight;
        } else if (chunk.kind === 'error' && typeof chunk.text === 'string') {
          setError(chunk.text);
        }
      },
      onEnd: function () {
        if (activeStream && activeStream.handle === handle) activeStream = null;
        setStreamingUI(false);
        if (assembled) {
          conversation.push({ role: 'assistant', content: assembled });
        }
      },
      onError: function (err) {
        if (activeStream && activeStream.handle === handle) activeStream = null;
        setStreamingUI(false);
        setStreamState('error');
        setError(err && err.message ? err.message : String(err));
      },
    });

    activeStream = { handle: handle, assistantBody: assistantBody };
  });

  // ---- Boot -------------------------------------------------------------
  refreshDaemonStatus().then(function (running) {
    if (running) refreshAdapters();
  });
})();
