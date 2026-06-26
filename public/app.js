document.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const dropZone = document.getElementById('drop-zone');
  const btnLoadMock = document.getElementById('btn-load-mock');
  const btnClearData = document.getElementById('btn-clear-data');
  const actionBar = document.getElementById('action-bar');
  const txCountText = document.getElementById('tx-count-text');
  const btnCategorize = document.getElementById('btn-categorize');
  const spinCategorize = document.getElementById('spin-categorize');
  
  // Table elements
  const tableBody = document.getElementById('table-body');
  
  // KPI elements
  const kpiIncome = document.getElementById('kpi-income');
  const kpiExpenses = document.getElementById('kpi-expenses');
  const kpiBalance = document.getElementById('kpi-balance');
  const kpiSavings = document.getElementById('kpi-savings');
  
  // Chart elements
  const chartPlaceholder = document.getElementById('chart-placeholder');

  // New Tab elements
  const tabUpload = document.getElementById('tab-upload');
  const tabPaste = document.getElementById('tab-paste');
  const paneUpload = document.getElementById('pane-upload');
  const panePaste = document.getElementById('pane-paste');
  const pasteArea = document.getElementById('paste-area');
  const btnParsePaste = document.getElementById('btn-parse-paste');

  // Settings Modal elements
  const btnSettings = document.getElementById('btn-settings');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettings = document.getElementById('close-settings');
  const btnCancelSettings = document.getElementById('btn-cancel-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  
  const keyGemini = document.getElementById('key-gemini');
  
  // State
  let loadedTransactions = [];
  let expensesChart = null;

  // Load API keys from localStorage
  loadSettings();
  loadSavedTransactions();

  // Load saved transactions on page load
  async function loadSavedTransactions() {
    try {
      addLog('[SISTEMA] Carregando transações salvas do servidor...');
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        loadedTransactions = sanitizeTransactions(data);
        if (loadedTransactions.length > 0) {
          addLog(`[SISTEMA] Sucesso! ${loadedTransactions.length} transações salvas carregadas.`, 'success-line');
          updateDropZoneSuccess(loadedTransactions.length);
          updateDashboard();
        } else {
          addLog('[SISTEMA] Nenhum dado salvo encontrado no servidor.');
        }
      } else {
        addLog('[SISTEMA] Falha ao carregar transações salvas (banco offline).');
      }
    } catch (err) {
      addLog(`[ERRO] Falha ao carregar transações salvas: ${err.message}`, 'error-line');
    }
  }

  // Sanitize transactions (parse string decimals to floats)
  function sanitizeTransactions(txs) {
    if (!Array.isArray(txs)) return [];
    return txs.map(tx => ({
      ...tx,
      amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount
    }));
  }

  // Attach initial listeners for mock and clear buttons
  if (btnLoadMock) {
    btnLoadMock.addEventListener('click', loadMockData);
  }
  if (btnClearData) {
    btnClearData.addEventListener('click', clearData);
  }

  // Reusable drop zone reset
  function resetDropZoneToDefault() {
    dropZone.innerHTML = `
      <div class="drop-zone-icon"></div>
      <span class="drop-zone-text">Solte seu arquivo CSV, OFX ou PDF aqui</span>
      <span class="drop-zone-or">ou</span>
      <div style="display: flex; gap: 8px; justify-content: center; z-index: 10;">
        <button class="btn btn-secondary" id="btn-load-mock">Usar Dados de Demonstração (Sparo)</button>
        <button class="btn btn-secondary" id="btn-clear-data" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: #ef4444;">Limpar Dados</button>
      </div>
    `;
    
    // Re-bind listeners because elements were recreated
    const mockBtn = document.getElementById('btn-load-mock');
    const clearBtn = document.getElementById('btn-clear-data');
    if (mockBtn) mockBtn.addEventListener('click', loadMockData);
    if (clearBtn) clearBtn.addEventListener('click', clearData);
    
    // Hide action bar
    actionBar.classList.add('hidden');
  }

  async function clearData(e) {
    if (e) e.stopPropagation();
    if (!confirm('Tem certeza de que deseja limpar todos os dados das transações?')) {
      return;
    }
    try {
      addLog('[SISTEMA] Solicitando limpeza de transações ao servidor...');
      const response = await fetch('/api/transactions/clear', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Falha ao limpar transações no servidor.');
      }
      
      // Clear local arrays
      loadedTransactions = [];
      if (expensesChart) {
        expensesChart.destroy();
        expensesChart = null;
      }
      
      // Reset drop zone to default view
      resetDropZoneToDefault();
      
      // Clear raw table
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-table">Nenhuma transação carregada. Clique em "Usar Dados de Demonstração" acima.</td>
        </tr>
      `;
      
      // Reset KPIs
      resetKPIs();
      
      addLog('[SISTEMA] Sucesso! Todas as transações foram limpas do banco de dados e do estado da aplicação.', 'success-line');
    } catch (err) {
      addLog(`[ERRO] Falha ao limpar dados: ${err.message}`, 'error-line');
      alert(`Falha ao limpar dados: ${err.message}`);
    }
  }

  // Log function helper
  function addLog(text, type = 'system-line') {
    console.log(text);
  }

  // Settings Modal Control
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
    addLog('[SISTEMA] Configurações de chaves de API salvas localmente.', 'success-line');
    closeModal();
  });

  function loadSettings() {
    keyGemini.value = localStorage.getItem('key_gemini') || '';
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
      
      // Save parsed transactions to the database
      addLog(`🛸 [AGENTE GEMINI] Persistindo ${transactions.length} transações no servidor...`);
      const saveResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactions)
      });
      
      if (!saveResponse.ok) {
        throw new Error('Falha ao persistir transações no banco de dados.');
      }
      
      const persistedTransactions = await saveResponse.json();
      loadedTransactions = sanitizeTransactions(persistedTransactions);
      addLog(`🛸 [AGENTE GEMINI] Sucesso! ${loadedTransactions.length} transações identificadas, limpas de ruídos e persistidas.`, 'success-line');
      
      updateDropZoneSuccess(loadedTransactions.length);
      updateDashboard();
      
      // Auto-trigger categorization
      addLog('🛸 [AGENTE GEMINI] Iniciando categorização automática...');
      btnCategorize.click();
    } catch (err) {
      addLog(`[ERRO AGENTE] Falha no processador: ${err.message}`, 'error-line');
      alert(`Falha no processador agêntico: ${err.message}`);
      
      // Reset drop zone UI on error
      if (isUploadTab) {
        resetDropZoneToDefault();
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
      const response = await fetch('/api/transactions?demo=true');
      loadedTransactions = sanitizeTransactions(await response.json());
      
      addLog(`[SISTEMA] Sucesso! ${loadedTransactions.length} transações de demonstração carregadas.`, 'success-line');
      updateDropZoneSuccess(loadedTransactions.length);
      updateDashboard();
      
      // Auto-trigger categorization
      addLog('[SISTEMA] Iniciando categorização automática...');
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
  function renderTable() {
    tableBody.innerHTML = '';
    loadedTransactions.forEach(tx => {
      const row = document.createElement('tr');
      const category = tx.status === 'Processado' ? (tx.actual_category || 'Outros') : (tx.expected_category || 'Outros');
      const badgeClass = `cat-${category.toLowerCase().split(' ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, "")}`;
      
      let statusHtml = '';
      if (tx.status === 'Processado') {
        statusHtml = `
          <span class="status-badge correct">
            <span class="status-indicator"></span>
            Processado por IA
          </span>
        `;
      } else {
        statusHtml = `
          <span class="status-badge" style="color: var(--accent-amber)">
            <span class="status-indicator" style="background-color: var(--accent-amber)"></span>
            Pendente
          </span>
        `;
      }

      row.innerHTML = `
        <td>${formatDate(tx.date)}</td>
        <td>
          ${tx.description}
          ${tx.search_log ? `<span class="search-hint">🔍 Google: ${tx.search_log}</span>` : ''}
        </td>
        <td class="${tx.amount < 0 ? 'text-expense' : 'text-income'}" style="color: ${tx.amount < 0 ? '#ec4899' : '#10b981'}; font-weight: 600;">
          ${formatCurrency(tx.amount)}
        </td>
        <td><span class="category-badge ${badgeClass}">${category}</span></td>
        <td>${statusHtml}</td>
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

  // 7. Process Categorization
  btnCategorize.addEventListener('click', async () => {
    if (loadedTransactions.length === 0) return;
    
    // UI state
    btnCategorize.disabled = true;
    spinCategorize.classList.remove('hidden');
    addLog('[SISTEMA] Iniciando categorização com Inteligência Artificial...');

    try {
      const geminiKey = localStorage.getItem('key_gemini') || '';

      const headers = { 'Content-Type': 'application/json' };
      if (geminiKey) headers['x-gemini-key'] = geminiKey;

      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ transactions: loadedTransactions })
      });
      
      if (!response.ok) {
        throw new Error('Falha no processamento da categorização no servidor.');
      }
      
      const result = await response.json();
      loadedTransactions = sanitizeTransactions(result);
      
      updateDashboard();
      addLog('[SISTEMA] Categorização concluída com sucesso.', 'success-line');

    } catch (err) {
      addLog(`[ERRO] Ocorreu um erro na categorização: ${err.message}`, 'error-line');
      alert(`Erro na categorização: ${err.message}`);
    } finally {
      btnCategorize.disabled = false;
      spinCategorize.classList.add('hidden');
    }
  });

  // 8. Update Dashboard KPIs and Charts
  function updateDashboard() {
    let income = 0;
    let expenses = 0;

    loadedTransactions.forEach(tx => {
      if (tx.amount > 0) {
        income += tx.amount;
      } else {
        expenses += Math.abs(tx.amount);
      }
    });

    const balance = income - expenses;
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(0) : 0;

    kpiIncome.textContent = formatCurrency(income);
    kpiExpenses.textContent = formatCurrency(expenses);
    kpiBalance.textContent = formatCurrency(balance);
    kpiSavings.textContent = `${savingsRate}%`;

    // Render table and chart
    renderTable();
    renderChart(loadedTransactions);
  }

  // 9. Render Expense Distribution Chart
  function renderChart(transactionsList) {
    chartPlaceholder.classList.add('hidden');
    
    // Group expense data
    const categoriesMap = {};
    transactionsList.forEach(tx => {
      const category = tx.status === 'Processado' ? (tx.actual_category || 'Outros') : (tx.expected_category || 'Outros');
      if (tx.amount < 0) {
        categoriesMap[category] = (categoriesMap[category] || 0) + Math.abs(tx.amount);
      }
    });

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);

    // Destroy existing chart if any
    if (expensesChart) {
      expensesChart.destroy();
    }

    const chartEl = document.getElementById('expensesChart');
    if (!chartEl) return;
    
    const ctx = chartEl.getContext('2d');
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
