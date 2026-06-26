document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const btnDashboard = document.getElementById('btn-dashboard');
  const btnBenchmark = document.getElementById('btn-benchmark');
  const btnLogs = document.getElementById('btn-logs');
  
  const sectionDashboard = document.getElementById('section-dashboard');
  const sectionBenchmark = document.getElementById('section-benchmark');
  const sectionLogs = document.getElementById('section-logs');
  
  const mainTitle = document.getElementById('main-title');
  
  // Dashboard Action elements
  const dropZone = document.getElementById('drop-zone');
  const btnLoadMock = document.getElementById('btn-load-mock');
  const actionBar = document.getElementById('action-bar');
  const txCountText = document.getElementById('tx-count-text');
  const btnCategorize = document.getElementById('btn-categorize');
  const spinCategorize = document.getElementById('spin-categorize');
  
  // Table and filter elements
  const filterWrapper = document.getElementById('filter-wrapper');
  const tableBody = document.getElementById('table-body');
  const agentSelectorView = document.getElementById('agent-selector-view');
  
  // KPI elements
  const kpiIncome = document.getElementById('kpi-income');
  const kpiExpenses = document.getElementById('kpi-expenses');
  const kpiBalance = document.getElementById('kpi-balance');
  const kpiSavings = document.getElementById('kpi-savings');
  
  // Chart elements
  const chartPlaceholder = document.getElementById('chart-placeholder');
  const benchmarkGrid = document.getElementById('benchmark-grid');
  const consoleBody = document.getElementById('console-body');

  // New Tab elements
  const tabUpload = document.getElementById('tab-upload');
  const tabPaste = document.getElementById('tab-paste');
  const paneUpload = document.getElementById('pane-upload');
  const panePaste = document.getElementById('pane-paste');
  const pasteArea = document.getElementById('paste-area');
  const btnParsePaste = document.getElementById('btn-parse-paste');

  // New Settings Modal elements
  const btnSettings = document.getElementById('btn-settings');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const btnCancelSettings = document.getElementById('btn-cancel-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  
  const keyGemini = document.getElementById('key-gemini');
  const keySerpapi = document.getElementById('key-serpapi');
  const keyOpenai = document.getElementById('key-openai');
  const keyAnthropic = document.getElementById('key-anthropic');
  
  // State
  let loadedTransactions = [];
  let categorizedResults = null;
  let expensesChart = null;

  // Load API keys from localStorage
  loadSettings();

  // 1. Navigation View Toggle
  function switchView(targetSection, targetBtn, title) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
    
    targetSection.classList.add('active');
    targetBtn.classList.add('active');
    mainTitle.textContent = title;
  }

  btnDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(sectionDashboard, btnDashboard, 'Visão Geral');
  });

  btnBenchmark.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(sectionBenchmark, btnBenchmark, 'Benchmark de Sub-Agentes');
  });

  btnLogs.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(sectionLogs, btnLogs, 'Console de Agentes');
  });

  // Log function helper
  function addLog(text, type = 'system-line') {
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    line.textContent = text;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  // 2. Settings Modal Control
  btnSettings.addEventListener('click', () => {
    loadSettings();
    settingsModal.style.display = 'flex';
  });

  function closeModal() {
    settingsModal.style.display = 'none';
  }

  closeSettings.addEventListener('click', closeModal);
  btnCancelSettings.addEventListener('click', closeModal);
  
  btnSaveSettings.addEventListener('click', () => {
    localStorage.setItem('key_gemini', keyGemini.value.trim());
    localStorage.setItem('key_serpapi', keySerpapi.value.trim());
    localStorage.setItem('key_openai', keyOpenai.value.trim());
    localStorage.setItem('key_anthropic', keyAnthropic.value.trim());
    
    addLog('[SISTEMA] Configurações de chaves de API salvas localmente.', 'success-line');
    closeModal();
  });

  function loadSettings() {
    keyGemini.value = localStorage.getItem('key_gemini') || '';
    keySerpapi.value = localStorage.getItem('key_serpapi') || '';
    keyOpenai.value = localStorage.getItem('key_openai') || '';
    keyAnthropic.value = localStorage.getItem('key_anthropic') || '';
  }

  // 3. Tab Switching
  tabUpload.addEventListener('click', () => {
    tabUpload.classList.add('active');
    tabPaste.classList.remove('active');
    paneUpload.classList.add('active');
    panePaste.classList.add('hidden');
    panePaste.classList.remove('active');
  });

  tabPaste.addEventListener('click', () => {
    tabPaste.classList.add('active');
    tabUpload.classList.remove('active');
    panePaste.classList.add('active');
    panePaste.classList.remove('hidden');
    paneUpload.classList.remove('active');
  });

  // 4. Unified Agèntic Parser with Gemini
  async function parseTextAgently(text, sourceFormat = 'extrato') {
    const geminiKey = localStorage.getItem('key_gemini') || '';
    if (!geminiKey) {
      alert('Por favor, configure sua Gemini API Key nas Configurações (ícone de engrenagem) para habilitar o processador agêntico do extrato.');
      btnSettings.click();
      return;
    }
    
    addLog(`🛸 [AGENTE GEMINI] Iniciando processamento agêntico do seu extrato (${sourceFormat})...`);
    
    // Set UI loading state
    const originalBtnText = btnParsePaste.textContent;
    const isUploadTab = tabUpload.classList.contains('active');
    
    if (isUploadTab) {
      dropZone.innerHTML = `
        <div class="drop-zone-icon loading-spin" style="border: 4px solid rgba(59, 130, 246, 0.1); border-left-color: var(--accent-blue); width: 32px; height: 32px; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
        <span class="drop-zone-text" style="color: var(--accent-blue)">Processando com Gemini 2.5...</span>
        <span class="drop-zone-or" style="margin-top: 8px;">A extração agêntica pode levar alguns segundos.</span>
      `;
    } else {
      btnParsePaste.disabled = true;
      btnParsePaste.textContent = 'Processando com Gemini...';
    }
    
    try {
      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-key': geminiKey
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro interno no processamento do servidor.');
      }
      
      const transactions = await response.json();
      if (transactions.length === 0) {
        throw new Error('Nenhuma transação foi identificada pelo agente no texto.');
      }
      
      loadedTransactions = transactions;
      addLog(`🛸 [AGENTE GEMINI] Sucesso! ${loadedTransactions.length} transações identificadas e limpas de ruídos.`, 'success-line');
      
      updateDropZoneSuccess(loadedTransactions.length);
      renderRawTable();
      resetKPIs();
      
      // Auto-trigger parallel categorization benchmark
      addLog('🛸 [AGENTE GEMINI] Iniciando benchmark de categorização automático...');
      btnCategorize.click();
    } catch (err) {
      addLog(`[ERRO AGENTE] Falha no processador: ${err.message}`, 'error-line');
      alert(`Falha no processador agêntico: ${err.message}`);
      
      // Reset drop zone UI on error
      if (isUploadTab) {
        dropZone.innerHTML = `
          <div class="drop-zone-icon"></div>
          <span class="drop-zone-text">Solte seu arquivo CSV, OFX ou PDF aqui</span>
          <span class="drop-zone-or">ou</span>
          <button class="btn btn-secondary" id="btn-load-mock">Usar Dados de Demonstração (Sparo)</button>
        `;
        // Re-attach load mock listener
        document.getElementById('btn-load-mock').addEventListener('click', loadMockData);
      }
    } finally {
      if (!isUploadTab) {
        btnParsePaste.disabled = false;
        btnParsePaste.textContent = originalBtnText;
      }
    }
  }

  // Parser for Paste Text Button click
  btnParsePaste.addEventListener('click', () => {
    const rawText = pasteArea.value.trim();
    if (!rawText) {
      alert('Por favor, cole o texto do extrato primeiro.');
      return;
    }
    parseTextAgently(rawText, 'Texto Colado');
  });

  // Reusable load mock helper
  async function loadMockData(e) {
    if (e) e.stopPropagation();
    try {
      addLog('[SISTEMA] Solicitando transações de demonstração ao backend...');
      const response = await fetch('/api/transactions');
      loadedTransactions = await response.json();
      
      addLog(`[SISTEMA] Sucesso! ${loadedTransactions.length} transações de demonstração carregadas.`, 'success-line');
      updateDropZoneSuccess(loadedTransactions.length);
      renderRawTable();
      resetKPIs();
      
      // Auto-trigger parallel categorization benchmark
      addLog('[SISTEMA] Iniciando benchmark de demonstração automático...');
      btnCategorize.click();
    } catch (err) {
      addLog(`[ERRO] Falha ao carregar transações: ${err.message}`, 'error-line');
    }
  }

  // 5. Drag and Drop File Parser (CSV, OFX, PDF)
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Also support clicking drop zone to select file
  dropZone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt,.ofx,.pdf';
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    };
    input.click();
  });

  // Configure PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  }

  function handleFile(file) {
    const reader = new FileReader();
    
    if (file.name.endsWith('.pdf')) {
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        try {
          addLog('[SISTEMA] Iniciando leitura de arquivo PDF...');
          if (typeof pdfjsLib === 'undefined') {
            throw new Error('Biblioteca PDF.js não está disponível. Recarregue a página.');
          }
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const items = textContent.items;
            
            // Group text items by Y coordinate (vertical position) to reconstruct visual lines
            const linesMap = {};
            items.forEach(item => {
              if (!item.str.trim()) return;
              const y = Math.round(item.transform[5] * 2) / 2; // round to nearest 0.5 coordinate units
              
              // Find if there is a line with close Y coordinate (tolerance of 5 units)
              let foundY = Object.keys(linesMap).find(existingY => Math.abs(parseFloat(existingY) - y) < 5);
              
              if (foundY) {
                linesMap[foundY].push(item);
              } else {
                linesMap[y] = [item];
              }
            });
            
            // Sort lines top-to-bottom
            const sortedYs = Object.keys(linesMap).sort((a, b) => parseFloat(b) - parseFloat(a));
            
            let pageText = '';
            sortedYs.forEach(y => {
              const lineItems = linesMap[y];
              // Sort text blocks left-to-right
              lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
              const lineText = lineItems.map(item => item.str).join(' ');
              pageText += lineText + '\n';
            });
            
            fullText += pageText + '\n';
          }
          
          parseTextAgently(fullText, 'PDF');
        } catch (err) {
          addLog(`[ERRO] Falha ao processar PDF: ${err.message}`, 'error-line');
          alert(`Falha no PDF: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const text = e.target.result;
        const formatName = file.name.endsWith('.csv') ? 'CSV' : (file.name.endsWith('.ofx') ? 'OFX' : 'Texto');
        parseTextAgently(text, formatName);
      };
      reader.readAsText(file, 'utf-8');
    }
  }

  function updateDropZoneSuccess(count) {
    dropZone.innerHTML = `
      <div class="drop-zone-icon" style="background-image: url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"48\" height=\"48\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%2310b981\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"%3E%3Cpath d=\"M22 11.08V12a10 10 0 1 1-5.93-9.14\"%3E%3C/path%3E%3Cpolyline points=\"22 4 12 14.01 9 11.01\"%3E%3C/polyline%3E%3C/svg%3E')"></div>
      <span class="drop-zone-text" style="color: var(--accent-emerald)">Extrato Importado!</span>
      <span class="drop-zone-or" style="margin-top: 8px;">${count} transações prontas para processamento.</span>
    `;

    actionBar.classList.remove('hidden');
    txCountText.textContent = `${count} transações prontas para o Financerix`;
  }
  // Render table
  function renderRawTable() {
    tableBody.innerHTML = '';
    loadedTransactions.forEach(tx => {
      const row = document.createElement('tr');
      const category = tx.expected_category || 'Outros';
      const badgeClass = `cat-${category.toLowerCase().split(' ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, "")}`;
      
      row.innerHTML = `
        <td>${formatDate(tx.date)}</td>
        <td>${tx.description}</td>
        <td class="${tx.amount < 0 ? 'text-expense' : 'text-income'}" style="color: ${tx.amount < 0 ? '#ec4899' : '#10b981'}; font-weight: 600;">
          ${formatCurrency(tx.amount)}
        </td>
        <td><span class="category-badge ${badgeClass}">${category}</span></td>
        <td>
          <span class="status-badge" style="color: var(--accent-blue)">
            <span class="status-indicator" style="background-color: var(--accent-blue)"></span>
            Extraído por Agente
          </span>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  function resetKPIs() {
    kpiIncome.textContent = 'R$ 0,00';
    kpiExpenses.textContent = 'R$ 0,00';
    kpiBalance.textContent = 'R$ 0,00';
    kpiSavings.textContent = '0%';
  }

  // 7. Process Categorization and Run Benchmark
  btnCategorize.addEventListener('click', async () => {
    if (loadedTransactions.length === 0) return;
    
    // UI state
    btnCategorize.disabled = true;
    spinCategorize.classList.remove('hidden');
    addLog('[SISTEMA] Inicializando orquestrador Antigravity 2.0...');
    addLog('[SISTEMA] Disparando execução paralela dos 5 subagentes de IA: Local Code, Claude, Gemini, ChatGPT, SerpAPI...');

    // Switch to logs view to let user watch the simulation
    setTimeout(() => {
      switchView(sectionLogs, btnLogs, 'Console de Agentes');
    }, 500);

    try {
      // Gather keys from localStorage to send in headers
      const geminiKey = localStorage.getItem('key_gemini') || '';
      const serpapiKey = localStorage.getItem('key_serpapi') || '';
      const openaiKey = localStorage.getItem('key_openai') || '';
      const anthropicKey = localStorage.getItem('key_anthropic') || '';

      const headers = { 'Content-Type': 'application/json' };
      if (geminiKey) headers['x-gemini-key'] = geminiKey;
      if (serpapiKey) headers['x-serpapi-key'] = serpapiKey;
      if (openaiKey) headers['x-openai-key'] = openaiKey;
      if (anthropicKey) headers['x-anthropic-key'] = anthropicKey;

      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ transactions: loadedTransactions })
      });
      
      categorizedResults = await response.json();
      
      // Simulate live parallel log printing on the frontend console
      await simulateConsoleLogs();

      // Show filter, configure default winner view, update graphs and benchmark cards
      filterWrapper.classList.remove('hidden');
      updateDashboardData('winner');
      renderBenchmarkScorecard();
      
      // Switch back to dashboard view with results ready
      switchView(sectionDashboard, btnDashboard, 'Visão Geral');
      addLog('[SISTEMA] Processo concluído com sucesso. Exibindo resultados no painel.', 'success-line');

    } catch (err) {
      addLog(`[ERRO] Ocorreu um erro na execução dos subagentes: ${err.message}`, 'error-line');
    } finally {
      btnCategorize.disabled = false;
      spinCategorize.classList.add('hidden');
    }
  });

  // Simulated live parallel log stream
  async function simulateConsoleLogs() {
    consoleBody.innerHTML = '';
    addLog('🛸 [ANTIGRAVITY 2.0] Inicializando subagentes agênticos em paralelo...', 'system-line');
    
    // Sort logs by time order of agents
    const agents = Object.keys(categorizedResults);
    const allAgentLogs = [];
    
    agents.forEach(key => {
      const agentData = categorizedResults[key];
      const logLines = agentData.logs;
      const timePerLine = agentData.executionTimeMs / logLines.length;
      
      logLines.forEach((line, idx) => {
        allAgentLogs.push({
          text: line,
          time: (idx + 1) * timePerLine,
          type: key === 'local' ? 'warn-line' : key === 'serpapi' ? 'success-line' : 'agent-line'
        });
      });
    });

    // Sort logs by their simulated trigger time
    allAgentLogs.sort((a, b) => a.time - b.time);

    // Stream logs to console
    for (let i = 0; i < allAgentLogs.length; i++) {
      const log = allAgentLogs[i];
      const prevTime = i > 0 ? allAgentLogs[i - 1].time : 0;
      const delay = Math.max(0, log.time - prevTime);
      await new Promise(resolve => setTimeout(resolve, delay * 1.5)); // slight slow-down for readability
      addLog(log.text, log.type);
    }
    
    addLog('🎉 [ANTIGRAVITY 2.0] Execução paralela de todos os subagentes finalizada!', 'success-line');
  }

  // 8. Update Dashboard view based on selected agent
  function updateDashboardData(agentKey) {
    if (!categorizedResults) return;

    let selectedAgentKey = agentKey;
    if (agentKey === 'winner') {
      // Find agent with the highest accuracy
      let bestAccuracy = -1;
      let winnerKey = 'serpapi';
      Object.keys(categorizedResults).forEach(key => {
        if (categorizedResults[key].accuracy > bestAccuracy) {
          bestAccuracy = categorizedResults[key].accuracy;
          winnerKey = key;
        }
      });
      selectedAgentKey = winnerKey;
    }

    const agentData = categorizedResults[selectedAgentKey];
    const results = agentData.results;

    // A. Update KPIs using the selected agent's results
    let income = 0;
    let expenses = 0;

    results.forEach(tx => {
      // find original transaction to get amount
      const origTx = loadedTransactions.find(t => t.id === tx.id);
      if (origTx) {
        if (origTx.amount > 0) {
          income += origTx.amount;
        } else {
          expenses += Math.abs(origTx.amount);
        }
      }
    });

    const balance = income - expenses;
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;

    kpiIncome.textContent = formatCurrency(income);
    kpiExpenses.textContent = formatCurrency(expenses);
    kpiBalance.textContent = formatCurrency(balance);
    kpiSavings.textContent = `${savingsRate}%`;

    // B. Render Table
    tableBody.innerHTML = '';
    results.forEach(tx => {
      const origTx = loadedTransactions.find(t => t.id === tx.id);
      const row = document.createElement('tr');
      
      const badgeClass = `cat-${tx.category.toLowerCase().split(' ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, "")}`;
      
      row.innerHTML = `
        <td>${formatDate(origTx.date)}</td>
        <td>
          ${tx.description}
          ${tx.searchLog ? `<span class="search-hint">🔍 SerpAPI: ${tx.searchLog}</span>` : ''}
        </td>
        <td style="color: ${origTx.amount < 0 ? '#ec4899' : '#10b981'}; font-weight: 600;">
          ${formatCurrency(origTx.amount)}
        </td>
        <td><span class="category-badge ${badgeClass}">${tx.category}</span></td>
        <td>
          <span class="status-badge ${tx.isCorrect ? 'correct' : 'incorrect'}">
            <span class="status-indicator"></span>
            ${tx.isCorrect ? 'Correto' : `Incorreto (Esperado: ${tx.expected})`}
          </span>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // C. Render Chart
    renderChart(results);
  }

  // Handle agent view filter changes
  agentSelectorView.addEventListener('change', (e) => {
    updateDashboardData(e.target.value);
  });

  // 9. Render Expense Distribution Chart
  function renderChart(results) {
    chartPlaceholder.classList.add('hidden');
    
    // Group expense data
    const categoriesMap = {};
    results.forEach(tx => {
      const origTx = loadedTransactions.find(t => t.id === tx.id);
      if (origTx && origTx.amount < 0) {
        categoriesMap[tx.category] = (categoriesMap[tx.category] || 0) + Math.abs(origTx.amount);
      }
    });

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);

    // Destroy existing chart if any
    if (expensesChart) {
      expensesChart.destroy();
    }

    const ctx = document.getElementById('expensesChart').getContext('2d');
    expensesChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#10b981', // green
            '#3b82f6', // blue
            '#8247e5', // purple
            '#f59e0b', // amber
            '#ec4899', // pink
            '#06b6d4', // cyan
            '#ef4444'  // red
          ],
          borderColor: '#0d1017',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#8e9aaf',
              font: {
                family: 'Inter',
                size: 11
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  // 10. Render Benchmark Scorecard View
  function renderBenchmarkScorecard() {
    if (!categorizedResults) return;

    benchmarkGrid.innerHTML = '';

    // Find winner key
    let bestAccuracy = -1;
    let winnerKey = '';
    Object.keys(categorizedResults).forEach(key => {
      if (categorizedResults[key].accuracy > bestAccuracy) {
        bestAccuracy = categorizedResults[key].accuracy;
        winnerKey = key;
      }
    });

    Object.keys(categorizedResults).forEach(key => {
      const data = categorizedResults[key];
      const isWinner = key === winnerKey;
      
      const card = document.createElement('div');
      card.className = `benchmark-card ${isWinner ? 'winner' : ''}`;
      
      card.innerHTML = `
        <h4 class="agent-title">${data.name}</h4>
        
        <div class="metric-row">
          <span class="metric-label">Acurácia:</span>
          <span class="metric-value" style="color: ${isWinner ? 'var(--accent-emerald)' : 'var(--text-main)'}; font-weight: 700;">
            ${data.accuracy}%
          </span>
        </div>
        
        <div class="accuracy-bar-container">
          <div class="accuracy-bar bar-${key}" style="width: ${data.accuracy}%"></div>
        </div>
        
        <div class="metric-row">
          <span class="metric-label">Tempo de Resposta:</span>
          <span class="metric-value">${data.executionTimeMs} ms</span>
        </div>
        
        <div class="metric-row">
          <span class="metric-label">Custo Estimado:</span>
          <span class="metric-value">$${data.totalCost.toFixed(5)}</span>
        </div>

        <div class="metric-row" style="font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 10px;">
          <span>Observação técnica:</span>
          <span style="font-style: italic;">
            ${key === 'local' ? 'Ultra-rápido, mas falha em nomes complexos.' : ''}
            ${key === 'claude' ? 'Lógica robusta, preço premium.' : ''}
            ${key === 'gemini' ? 'Excelente velocidade, custo muito baixo.' : ''}
            ${key === 'chatgpt' ? 'Estrutura JSON sólida, tempo médio.' : ''}
            ${key === 'serpapi' ? 'Acurácia máxima. Resolve enigmas via Google.' : ''}
          </span>
        </div>
      `;
      benchmarkGrid.appendChild(card);
    });
  }

  // Format Helper Utilities
  function formatDate(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // Currency helper
  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
});
