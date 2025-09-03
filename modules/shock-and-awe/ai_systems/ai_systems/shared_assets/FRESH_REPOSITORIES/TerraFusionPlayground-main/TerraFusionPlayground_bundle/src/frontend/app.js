class TerraFusionApp {
  constructor() {
    this.apiUrl = 'http://localhost:3000/api';
    this.statusCheckInterval = 5000;
    this.metricsUpdateInterval = 2000;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.lastProcessedData = null;
    this.undoStack = [];
    this.redoStack = [];
    this.isProcessing = false;
    this.rateLimiter = {
      lastRequest: 0,
      minInterval: 1000
    };
    this.settings = {
      theme: 'light',
      fontSize: 16,
      editorTheme: 'default',
      updateInterval: 2000,
      maxResults: 50,
      cacheSize: 100,
      autoFormat: true,
      enableLogging: true,
      enableAnalytics: true,
      enableNotifications: true
    };
    this.metricHistory = {
      cpuUsage: [],
      memoryUsage: [],
      responseTime: [],
      securityStatus: []
    };
    this.charts = {};
    this.commands = {
      'process': { icon: 'play', shortcut: 'Ctrl+Enter', action: () => this.processData() },
      'format': { icon: 'code', shortcut: 'Ctrl+Shift+F', action: () => this.formatInput() },
      'clear': { icon: 'trash', shortcut: 'Ctrl+Delete', action: () => this.clearInput() },
      'save': { icon: 'save', shortcut: 'Ctrl+S', action: () => this.saveToFile() },
      'load': { icon: 'folder-open', shortcut: 'Ctrl+O', action: () => this.loadFromFile() },
      'undo': { icon: 'undo', shortcut: 'Ctrl+Z', action: () => this.undo() },
      'redo': { icon: 'redo', shortcut: 'Ctrl+Shift+Z', action: () => this.redo() },
      'settings': { icon: 'cog', shortcut: 'Ctrl+,', action: () => this.toggleSettings() },
      'theme': { icon: 'moon', shortcut: 'Ctrl+T', action: () => this.toggleTheme() },
      'help': { icon: 'question-circle', shortcut: 'F1', action: () => this.showHelp() }
    };

    this.pluginManager = new PluginManager();
    this.collaborationManager = new CollaborationManager();
    this.visualizationManager = new VisualizationManager();
    this.initialize();
  }

  async initialize() {
    this.initializeElements();
    this.setupEventListeners();
    this.setupErrorBoundary();
    this.loadSettings();
    await this.initializePlugins();
    this.setupCollaboration();
    this.initializeCharts();
    this.checkApiStatus();
    this.startMetricsPolling();
    this.setupCommandPalette();
    this.initializeVisualizations();
  }

  initializeElements() {
    this.elements = {
      systemStatus: document.getElementById('systemStatus'),
      inputData: document.getElementById('inputData'),
      processButton: document.getElementById('processButton'),
      loadingSpinner: document.getElementById('loadingSpinner'),
      resultsContainer: document.getElementById('resultsContainer'),
      errorBoundary: document.getElementById('errorBoundary'),
      offlineNotice: document.getElementById('offlineNotice'),
      commandPalette: document.getElementById('commandPalette'),
      commandInput: document.getElementById('commandInput'),
      commandList: document.getElementById('commandList'),
      settingsPanel: document.getElementById('settingsPanel'),
      templatesPanel: document.getElementById('templatesPanel'),
      historyPanel: document.getElementById('historyPanel'),
      themeToggle: document.getElementById('themeToggle'),
      inputType: document.getElementById('inputType'),
      resultView: document.getElementById('resultView'),
      editorOverlay: document.getElementById('editorOverlay'),
      input: document.getElementById('input'),
      output: document.getElementById('output'),
      settingsButton: document.getElementById('settings-button'),
      collaborationButton: document.getElementById('collaboration-button'),
      visualizationButton: document.getElementById('visualization-button'),
      pluginButton: document.getElementById('plugin-button'),
      collaborationPanel: document.getElementById('collaboration-panel'),
      visualizationPanel: document.getElementById('visualization-panel'),
      pluginPanel: document.getElementById('plugin-panel'),
      userList: document.getElementById('user-list'),
      metrics: document.getElementById('metrics')
    };
    this.initializeCodeMirror();
  }

  initializeCodeMirror() {
    this.editor = CodeMirror.fromTextArea(this.elements.inputData, {
      mode: 'javascript',
      theme: this.settings.editorTheme,
      lineNumbers: true,
      autoCloseBrackets: true,
      matchBrackets: true,
      indentUnit: 4,
      tabSize: 4,
      lineWrapping: true,
      foldGutter: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Ctrl-Enter': () => this.processData(),
        'Ctrl-S': (cm) => {
          cm.save();
          this.saveToFile();
        },
        'Ctrl-Z': (cm) => {
          cm.undo();
          this.undo();
        },
        'Ctrl-Y': (cm) => {
          cm.redo();
          this.redo();
        }
      }
    });
    this.editor.on('change', () => this.handleInputChange());
  }

  setupEventListeners() {
    this.elements.processButton.addEventListener('click', () => this.processData());
    this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.elements.settingsButton.addEventListener('click', () => this.toggleSettings());
    this.elements.collaborationButton.addEventListener('click', () => this.toggleCollaboration());
    this.elements.visualizationButton.addEventListener('click', () => this.toggleVisualization());
    this.elements.pluginButton.addEventListener('click', () => this.togglePlugins());
    document.getElementById('formatButton').addEventListener('click', () => this.formatInput());
    document.getElementById('clearButton').addEventListener('click', () => this.clearInput());
    document.getElementById('saveTemplateButton').addEventListener('click', () => this.saveTemplate());
    document.getElementById('exportButton').addEventListener('click', () => this.exportResults());
    document.getElementById('compareButton').addEventListener('click', () => this.compareResults());
    document.getElementById('historyButton').addEventListener('click', () => this.toggleHistory());
    document.getElementById('transformButton').addEventListener('click', () => this.transformData());
    document.getElementById('validateButton').addEventListener('click', () => this.validateData());
    document.getElementById('analyzeButton').addEventListener('click', () => this.analyzeData());
    this.elements.inputType.addEventListener('change', () => this.updateEditorMode());
    this.elements.resultView.addEventListener('change', () => this.updateResultView());
    window.addEventListener('online', () => this.handleOnlineStatus());
    window.addEventListener('offline', () => this.handleOfflineStatus());
    window.addEventListener('keydown', (e) => this.handleKeyboardShortcut(e));
  }

  setupCommandPalette() {
    this.elements.commandInput.addEventListener('input', () => this.filterCommands());
    this.elements.commandInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggleCommandPalette();
      } else if (e.key === 'Enter') {
        const selectedCommand = this.elements.commandList.querySelector('.selected');
        if (selectedCommand) {
          selectedCommand.click();
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.navigateCommands(e.key === 'ArrowDown' ? 1 : -1);
      }
    });
  }

  filterCommands() {
    const query = this.elements.commandInput.value.toLowerCase();
    const filteredCommands = Object.entries(this.commands).filter(([key, cmd]) => 
      key.toLowerCase().includes(query) || cmd.shortcut.toLowerCase().includes(query)
    );
    this.renderCommandList(filteredCommands);
  }

  renderCommandList(commands) {
    this.elements.commandList.innerHTML = commands.map(([key, cmd], index) => `
      <div class="command-item ${index === 0 ? 'selected' : ''}" data-command="${key}">
        <i class="fas fa-${cmd.icon}" aria-hidden="true"></i>
        <span>${key}</span>
        <span class="command-shortcut">${cmd.shortcut}</span>
      </div>
    `).join('');
    this.elements.commandList.querySelectorAll('.command-item').forEach(item => {
      item.addEventListener('click', () => {
        const command = this.commands[item.dataset.command];
        if (command) {
          command.action();
          this.toggleCommandPalette();
        }
      });
    });
  }

  navigateCommands(direction) {
    const items = this.elements.commandList.querySelectorAll('.command-item');
    const currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
    const newIndex = (currentIndex + direction + items.length) % items.length;
    items[currentIndex]?.classList.remove('selected');
    items[newIndex]?.classList.add('selected');
    items[newIndex]?.scrollIntoView({ block: 'nearest' });
  }

  toggleCommandPalette() {
    this.elements.commandPalette.classList.toggle('active');
    if (this.elements.commandPalette.classList.contains('active')) {
      this.elements.commandInput.value = '';
      this.renderCommandList(Object.entries(this.commands));
      this.elements.commandInput.focus();
    }
  }

  handleKeyboardShortcut(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'enter':
          e.preventDefault();
          this.processData();
          break;
        case 's':
          e.preventDefault();
          this.saveToFile();
          break;
        case 'o':
          e.preventDefault();
          this.loadFromFile();
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            this.redo();
          } else {
            this.undo();
          }
          break;
        case ',':
          e.preventDefault();
          this.toggleSettings();
          break;
        case 't':
          e.preventDefault();
          this.toggleTheme();
          break;
      }
    } else if (e.key === 'F1') {
      e.preventDefault();
      this.showHelp();
    }
  }

  setupErrorBoundary() {
    window.addEventListener('error', (e) => this.handleGlobalError(e));
    window.addEventListener('unhandledrejection', (e) => this.handlePromiseError(e));
  }

  handleGlobalError(error) {
    console.error('Global error:', error);
    this.showError('An unexpected error occurred. Please try again.');
  }

  handlePromiseError(error) {
    console.error('Promise error:', error);
    this.showError('An error occurred while processing your request.');
  }

  showError(message) {
    this.elements.errorBoundary.classList.add('active');
    this.elements.errorBoundary.querySelector('#errorMessage').textContent = message;
  }

  checkApiStatus() {
    fetch(`${this.apiUrl}/status`)
      .then(response => response.json())
      .then(data => {
        this.elements.systemStatus.textContent = data.status;
        this.elements.systemStatus.parentElement.dataset.status = data.status;
      })
      .catch(error => {
        console.error('API status check failed:', error);
        this.elements.systemStatus.textContent = 'Disconnected';
        this.elements.systemStatus.parentElement.dataset.status = 'error';
      });
  }

  startMetricsPolling() {
    setInterval(() => this.updateMetrics(), this.settings.updateInterval);
  }

  updateMetrics() {
    fetch(`${this.apiUrl}/metrics`)
      .then(response => response.json())
      .then(data => {
        this.updateMetricDisplay('cpuUsage', data.cpuUsage);
        this.updateMetricDisplay('memoryUsage', data.memoryUsage);
        this.updateMetricDisplay('responseTime', data.responseTime);
        this.updateMetricDisplay('securityStatus', data.securityStatus);
        this.updateCharts(data);
      })
      .catch(error => {
        console.error('Metrics update failed:', error);
      });
  }

  updateMetricDisplay(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = this.formatMetricValue(id, value);
      element.dataset.status = this.getMetricStatus(id, value);
    }
  }

  formatMetricValue(id, value) {
    switch (id) {
      case 'cpuUsage':
      case 'memoryUsage':
        return `${value}%`;
      case 'responseTime':
        return `${value}ms`;
      case 'securityStatus':
        return value;
      default:
        return value;
    }
  }

  getMetricStatus(id, value) {
    switch (id) {
      case 'cpuUsage':
        return value > 90 ? 'critical' : value > 70 ? 'warning' : 'normal';
      case 'memoryUsage':
        return value > 85 ? 'critical' : value > 65 ? 'warning' : 'normal';
      case 'responseTime':
        return value > 1000 ? 'critical' : value > 500 ? 'warning' : 'normal';
      case 'securityStatus':
        return value === 'secure' ? 'normal' : 'critical';
      default:
        return 'normal';
    }
  }

  initializeCharts() {
    const chartConfigs = {
      cpuUsage: { label: 'CPU Usage', color: '#3b82f6' },
      memoryUsage: { label: 'Memory Usage', color: '#10b981' },
      responseTime: { label: 'Response Time', color: '#f59e0b' },
      securityStatus: { label: 'Security Status', color: '#ef4444' }
    };

    Object.entries(chartConfigs).forEach(([id, config]) => {
      const ctx = document.getElementById(`${id}Chart`).getContext('2d');
      this.charts[id] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: config.label,
            data: [],
            borderColor: config.color,
            tension: 0.4,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    });
  }

  updateCharts(data) {
    Object.entries(this.charts).forEach(([id, chart]) => {
      const value = data[id];
      const timestamp = new Date().toLocaleTimeString();

      chart.data.labels.push(timestamp);
      chart.data.datasets[0].data.push(value);

      if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }

      chart.update();
    });
  }

  async processData() {
    if (this.isProcessing) return;

    const input = this.editor.getValue();
    if (!input.trim()) {
      this.showError('Please enter some data to process.');
      return;
    }

    this.isProcessing = true;
    this.showLoading(true);
    this.saveToHistory(input);

    try {
      const now = Date.now();
      if (now - this.rateLimiter.lastRequest < this.rateLimiter.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.rateLimiter.minInterval - (now - this.rateLimiter.lastRequest))
        );
      }

      const processedInput = await this.pluginManager.executeHook('beforeProcess', input);

      const response = await this.makeApiRequest('/process', {
        method: 'POST',
        body: JSON.stringify({
          data: processedInput,
          type: this.elements.inputType.value
        })
      });

      this.rateLimiter.lastRequest = Date.now();
      this.lastProcessedData = response;
      this.displayResults(response);
      this.updateMetrics();
    } catch (error) {
      console.error('Processing error:', error);
      this.showError('Failed to process data. Please try again.');
    } finally {
      this.isProcessing = false;
      this.showLoading(false);
    }
  }

  async makeApiRequest(endpoint, options = {}) {
    let attempts = 0;
    while (attempts < this.retryAttempts) {
      try {
        const response = await fetch(`${this.apiUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        attempts++;
        if (attempts === this.retryAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempts));
      }
    }
  }

  displayResults(data) {
    const view = this.elements.resultView.value;
    let content = '';

    switch (view) {
      case 'raw':
        content = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        break;
      case 'formatted':
        content = this.formatResults(data);
        break;
      case 'tree':
        content = this.createTreeView(data);
        break;
      case 'table':
        content = this.createTableView(data);
        break;
      case 'graph':
        content = this.createGraphView(data);
        break;
    }

    this.elements.resultsContainer.innerHTML = content;
  }

  formatResults(data) {
    if (typeof data === 'object') {
      return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
    return `<pre>${data}</pre>`;
  }

  createTreeView(data) {
    const createNode = (obj, level = 0) => {
      if (typeof obj !== 'object' || obj === null) {
        return `<span class="tree-value">${obj}</span>`;
      }

      const items = Object.entries(obj).map(([key, value]) => `
        <div class="tree-item" style="margin-left: ${level * 20}px">
          <span class="tree-key">${key}:</span>
          ${createNode(value, level + 1)}
        </div>
      `).join('');

      return `<div class="tree-container">${items}</div>`;
    };

    return createNode(data);
  }

  createTableView(data) {
    if (!Array.isArray(data)) {
      return this.formatResults(data);
    }

    const headers = Object.keys(data[0] || {});
    const rows = data.map(item => 
      `<tr>${headers.map(header => `<td>${item[header]}</td>`).join('')}</tr>`
    ).join('');

    return `
      <table class="data-table">
        <thead>
          <tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  createGraphView(data) {
    if (typeof data !== 'object' || data === null) {
      return this.formatResults(data);
    }

    const ctx = document.createElement('canvas');
    this.elements.resultsContainer.innerHTML = '';
    this.elements.resultsContainer.appendChild(ctx);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Values',
          data: Object.values(data),
          backgroundColor: '#3b82f6'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  showLoading(show) {
    this.elements.loadingSpinner.style.display = show ? 'flex' : 'none';
    this.elements.processButton.disabled = show;
  }

  handleInputChange() {
    const input = this.editor.getValue();
    this.elements.processButton.disabled = !input.trim();
    if (this.settings.autoFormat) {
      this.formatInput();
    }
  }

  formatInput() {
    const input = this.editor.getValue();
    try {
      const formatted = JSON.stringify(JSON.parse(input), null, 2);
      this.editor.setValue(formatted);
    } catch (error) {
      console.warn('Formatting failed:', error);
    }
  }

  clearInput() {
    this.editor.setValue('');
    this.elements.processButton.disabled = true;
  }

  saveToFile() {
    const input = this.editor.getValue();
    if (!input.trim()) return;

    const blob = new Blob([input], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terrafusion-data.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  loadFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.json,.xml,.yaml,.csv,.sql';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          this.editor.setValue(event.target.result);
          this.updateEditorMode();
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  saveTemplate() {
    const input = this.editor.getValue();
    if (!input.trim()) return;

    const name = prompt('Enter template name:');
    if (!name) return;

    const templates = JSON.parse(localStorage.getItem('templates') || '{}');
    templates[name] = {
      content: input,
      type: this.elements.inputType.value,
      timestamp: Date.now()
    };
    localStorage.setItem('templates', JSON.stringify(templates));
  }

  loadTemplate(name) {
    const templates = JSON.parse(localStorage.getItem('templates') || '{}');
    const template = templates[name];
    if (template) {
      this.editor.setValue(template.content);
      this.elements.inputType.value = template.type;
      this.updateEditorMode();
    }
  }

  saveToHistory(input) {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    history.unshift({
      input,
      timestamp: Date.now()
    });
    if (history.length > 50) {
      history.pop();
    }
    localStorage.setItem('history', JSON.stringify(history));
  }

  toggleSettings() {
    this.elements.settingsPanel.classList.toggle('active');
  }

  toggleHistory() {
    this.elements.historyPanel.classList.toggle('active');
    this.renderHistory();
  }

  renderHistory() {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = history.map(item => `
      <div class="history-item" data-timestamp="${item.timestamp}">
        <div class="history-content">${item.input.substring(0, 100)}${item.input.length > 100 ? '...' : ''}</div>
        <div class="history-meta">
          <span>${new Date(item.timestamp).toLocaleString()}</span>
          <button class="toolbar-button" onclick="app.loadFromHistory(${item.timestamp})">
            <i class="fas fa-history" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  loadFromHistory(timestamp) {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    const item = history.find(h => h.timestamp === timestamp);
    if (item) {
      this.editor.setValue(item.input);
      this.toggleHistory();
    }
  }

  toggleTheme() {
    const isDark = document.body.dataset.theme === 'dark';
    document.body.dataset.theme = isDark ? 'light' : 'dark';
    this.settings.theme = isDark ? 'light' : 'dark';
    this.saveSettings();
    this.elements.themeToggle.querySelector('i').className = 
      `fas fa-${isDark ? 'moon' : 'sun'}`;
  }

  updateEditorMode() {
    const mode = this.elements.inputType.value;
    this.editor.setOption('mode', mode);
  }

  updateResultView() {
    if (this.lastProcessedData) {
      this.displayResults(this.lastProcessedData);
    }
  }

  handleOnlineStatus() {
    this.elements.offlineNotice.classList.remove('active');
    this.checkApiStatus();
  }

  handleOfflineStatus() {
    this.elements.offlineNotice.classList.add('active');
    this.elements.systemStatus.textContent = 'Offline';
    this.elements.systemStatus.parentElement.dataset.status = 'error';
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('settings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      this.applySettings();
    }
  }

  saveSettings() {
    localStorage.setItem('settings', JSON.stringify(this.settings));
    this.applySettings();
  }

  applySettings() {
    document.body.dataset.theme = this.settings.theme;
    document.documentElement.style.fontSize = `${this.settings.fontSize}px`;
    this.editor.setOption('theme', this.settings.editorTheme);
    this.settings.updateInterval = parseInt(document.getElementById('updateInterval').value);
    this.settings.maxResults = parseInt(document.getElementById('maxResults').value);
    this.settings.cacheSize = parseInt(document.getElementById('cacheSize').value);
    this.settings.autoFormat = document.getElementById('autoFormat').checked;
    this.settings.enableLogging = document.getElementById('enableLogging').checked;
    this.settings.enableAnalytics = document.getElementById('enableAnalytics').checked;
    this.settings.enableNotifications = document.getElementById('enableNotifications').checked;
  }

  showHelp() {
    const helpContent = `
      <h3>Keyboard Shortcuts</h3>
      <ul>
        ${Object.entries(this.commands).map(([key, cmd]) => `
          <li><strong>${cmd.shortcut}</strong> - ${key}</li>
        `).join('')}
      </ul>
      <h3>Features</h3>
      <ul>
        <li>Process data with real-time validation</li>
        <li>Multiple view modes for results</li>
        <li>Save and load templates</li>
        <li>Command palette for quick access</li>
        <li>Real-time system metrics</li>
        <li>Dark/light theme support</li>
        <li>Offline support</li>
      </ul>
    `;
    this.elements.resultsContainer.innerHTML = helpContent;
  }

  transformData() {
    const input = this.editor.getValue();
    if (!input.trim()) return;

    const transformations = {
      json: {
        to: {
          yaml: (data) => jsYaml.dump(JSON.parse(data)),
          xml: (data) => json2xml(JSON.parse(data)),
          csv: (data) => this.jsonToCsv(JSON.parse(data))
        }
      },
      yaml: {
        to: {
          json: (data) => JSON.stringify(jsYaml.load(data), null, 2),
          xml: (data) => json2xml(jsYaml.load(data)),
          csv: (data) => this.jsonToCsv(jsYaml.load(data))
        }
      },
      xml: {
        to: {
          json: (data) => JSON.stringify(xml2json(data), null, 2),
          yaml: (data) => jsYaml.dump(xml2json(data)),
          csv: (data) => this.jsonToCsv(xml2json(data))
        }
      },
      csv: {
        to: {
          json: (data) => JSON.stringify(this.csvToJson(data), null, 2),
          yaml: (data) => jsYaml.dump(this.csvToJson(data)),
          xml: (data) => json2xml(this.csvToJson(data))
        }
      }
    };

    const currentType = this.elements.inputType.value;
    const targetType = prompt('Enter target format (json, yaml, xml, csv):').toLowerCase();

    if (transformations[currentType]?.to[targetType]) {
      try {
        const transformed = transformations[currentType].to[targetType](input);
        this.editor.setValue(transformed);
        this.elements.inputType.value = targetType;
        this.updateEditorMode();
      } catch (error) {
        this.showError('Transformation failed: ' + error.message);
      }
    } else {
      this.showError('Unsupported transformation');
    }
  }

  validateData() {
    const input = this.editor.getValue();
    if (!input.trim()) return;

    const type = this.elements.inputType.value;
    let isValid = false;
    let error = null;

    try {
      switch (type) {
        case 'json':
          JSON.parse(input);
          isValid = true;
          break;
        case 'yaml':
          jsYaml.load(input);
          isValid = true;
          break;
        case 'xml':
          new DOMParser().parseFromString(input, 'text/xml');
          isValid = true;
          break;
        case 'csv':
          this.csvToJson(input);
          isValid = true;
          break;
        case 'sql':
          // Basic SQL validation
          isValid = /^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(input);
          break;
      }
    } catch (e) {
      error = e.message;
    }

    if (isValid) {
      this.showNotification('Validation successful', 'success');
    } else {
      this.showError('Validation failed: ' + (error || 'Invalid format'));
    }
  }

  analyzeData() {
    const input = this.editor.getValue();
    if (!input.trim()) return;

    try {
      const data = JSON.parse(input);
      const analysis = {
        type: typeof data,
        size: new Blob([input]).size,
        properties: Object.keys(data).length,
        depth: this.getObjectDepth(data),
        hasArrays: Array.isArray(data) || Object.values(data).some(v => Array.isArray(v)),
        hasObjects: typeof data === 'object' && data !== null,
        hasNulls: Object.values(data).some(v => v === null),
        hasUndefined: Object.values(data).some(v => v === undefined)
      };

      this.elements.resultsContainer.innerHTML = `
        <h3>Data Analysis</h3>
        <ul>
          ${Object.entries(analysis).map(([key, value]) => `
            <li><strong>${key}:</strong> ${value}</li>
          `).join('')}
        </ul>
      `;
    } catch (error) {
      this.showError('Analysis failed: ' + error.message);
    }
  }

  getObjectDepth(obj) {
    if (typeof obj !== 'object' || obj === null) return 0;
    return 1 + Math.max(...Object.values(obj).map(v => this.getObjectDepth(v)));
  }

  showNotification(message, type = 'info') {
    if (!this.settings.enableNotifications) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  jsonToCsv(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => obj[header]));
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  csvToJson(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index];
        return obj;
      }, {});
    });
  }

  async initializePlugins() {
    try {
      const plugins = await this.loadPlugins();
      for (const plugin of plugins) {
        await this.pluginManager.loadPlugin(plugin.id, plugin.module);
      }
    } catch (error) {
      console.error('Failed to initialize plugins:', error);
    }
  }

  async loadPlugins() {
    // Load plugins from the plugins directory
    const pluginFiles = [
      'data-transform.js',
      'data-validate.js',
      'data-analyze.js'
    ];

    const plugins = [];
    for (const file of pluginFiles) {
      try {
        const module = await import(`./plugins/${file}`);
        plugins.push({
          id: file.replace('.js', ''),
          module: module.default
        });
      } catch (error) {
        console.error(`Failed to load plugin ${file}:`, error);
      }
    }

    return plugins;
  }

  setupCollaboration() {
    const roomId = new URLSearchParams(window.location.search).get('room');
    if (roomId) {
      const userId = localStorage.getItem('userId') || this.generateUserId();
      const username = localStorage.getItem('username') || 'Anonymous';
      
      this.collaborationManager.connect(roomId, userId, username);
    }
  }

  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  initializeVisualizations() {
    this.visualizationManager.initialize();
  }

  toggleCollaboration() {
    this.elements.collaborationPanel.classList.toggle('active');
  }

  toggleVisualization() {
    this.elements.visualizationPanel.classList.toggle('active');
  }

  togglePlugins() {
    this.elements.pluginPanel.classList.toggle('active');
  }
}

// Initialize the application
const app = new TerraFusionApp(); 