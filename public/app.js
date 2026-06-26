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

  // Tab elements
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

  // V2 Filter Elements
  const filterYear = document.getElementById('filter-year');
  const filterMonth = document.getElementById('filter-month');
  const filterCategory = document.getElementById('filter-category');

  // V2 Budget Modal Elements
  const btnNewBudget = document.getElementById('btn-new-budget');
  const budgetModal = document.getElementById('budget-modal');
  const closeBudgetModal = document.getElementById('close-budget-modal');
  const btnCancelBudget = document.getElementById('btn-cancel-budget');
  const btnSaveBudget = document.getElementById('btn-save-budget');
  const budgetCategoryVal = document.getElementById('budget-category-val');
  const budgetLimitVal = document.getElementById('budget-limit-val');
  const budgetList = document.getElementById('budget-list');

  // V2 Goal Modal Elements
  const btnNewGoal = document.getElementById('btn-new-goal');
  const goalModal = document.getElementById('goal-modal');
  const closeGoalModal = document.getElementById('close-goal-modal');
  const btnCancelGoal = document.getElementById('btn-cancel-goal');
  const btnSaveGoal = document.getElementById('btn-save-goal');
  const goalIdVal = document.getElementById('goal-id-val');
  const goalNameVal = document.getElementById('goal-name-val');
  const goalTargetVal = document.getElementById('goal-target-val');
  const goalDateVal = document.getElementById('goal-date-val');
  const goalsList = document.getElementById('goals-list');

  // V2 Recurring Modal Elements
  const btnNewRecurring = document.getElementById('btn-new-recurring');
  const recurringModal = document.getElementById('recurring-modal');
  const closeRecurringModal = document.getElementById('close-recurring-modal');
  const btnCancelRecurring = document.getElementById('btn-cancel-recurring');
  const btnSaveRecurring = document.getElementById('btn-save-recurring');
  const recurringDescVal = document.getElementById('recurring-desc-val');
  const recurringAmountVal = document.getElementById('recurring-amount-val');
  const recurringDayVal = document.getElementById('recurring-day-val');
  const recurringTypeVal = document.getElementById('recurring-type-val');
  const forecastTimeline = document.getElementById('forecast-timeline');

  // Top Merchants Element
  const topMerchantsList = document.getElementById('top-merchants-list');
  
  // State
  let loadedTransactions = [];
  let loadedGoals = [];
  let loadedBudgets = [];
  let loadedRecurring = [];
  let expensesChart = null;

  // V2 Tab Manager
  const views = document.querySelectorAll('.view-section');
  const menuItems = document.querySelectorAll('.menu-item');
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  const mainTitle = document.getElementById('main-title');
  const pageSubtitle = mainTitle ? mainTitle.nextElementSibling : null;

  const tabTitles = {
    'section-dashboard': {
      title: 'Visão Geral',
      desc: 'Monitore e gerencie seus gastos usando inteligência artificial agêntica.'
    },
    'section-transactions': {
      title: 'Extrato & Importação',
      desc: 'Importe extratos bancários e visualize lançamentos detalhados.'
    },
    'section-planning': {
      title: 'Planejamento Financeiro',
      desc: 'Defina metas de economia (caixinhas) e gerencie limites de gastos.'
    },
    'section-cashflow': {
      title: 'Fluxo de Caixa Previsto',
      desc: 'Visualize a projeção do seu saldo para os próximos 30 dias.'
    }
  };

  function switchTab(targetId) {
    views.forEach(v => {
      v.style.display = 'none';
      v.classList.remove('active');
    });

    const activeSection = document.getElementById(targetId);
    if (activeSection) {
      activeSection.style.display = 'flex';
      activeSection.classList.add('active');
    }

    menuItems.forEach(item => {
      if (item.getAttribute('data-target') === targetId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    bottomNavItems.forEach(item => {
      if (item.getAttribute('data-target') === targetId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (tabTitles[targetId]) {
      if (mainTitle) mainTitle.textContent = tabTitles[targetId].title;
      if (pageSubtitle) pageSubtitle.textContent = tabTitles[targetId].desc;
    }
  }

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      if (target) switchTab(target);
    });
  });

  bottomNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      if (target) switchTab(target);
    });
  });

  // Set default view on load
  switchTab('section-dashboard');

  const CATEGORIES = [
    'Alimentação',
    'Transporte',
    'Assinaturas & Serviços',
    'Supermercado',
    'Compras',
    'Combustível',
    'Saúde',
    'Receitas',
    'Transferências',
    'Lazer & Entretenimento',
    'Outros'
  ];

  // Startup fetches
  loadSettings();
  loadSavedTransactions();
  loadGoals();
  loadBudgets();
  loadRecurring();

  // Fetch functions
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

  async function loadGoals() {
    try {
      const response = await fetch('/api/goals');
      if (response.ok) {
        loadedGoals = await response.json();
        renderGoals();
        updateDashboard();
      }
    } catch (err) {
      console.error('Erro ao carregar caixinhas:', err);
    }
  }

  async function loadBudgets() {
    try {
      const response = await fetch('/api/budgets');
      if (response.ok) {
        loadedBudgets = await response.json();
        updateDashboard();
      }
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
    }
  }

  async function loadRecurring() {
    try {
      const response = await fetch('/api/recurring');
      if (response.ok) {
        loadedRecurring = await response.json();
        updateDashboard();
      }
    } catch (err) {
      console.error('Erro ao carregar contas recorrentes:', err);
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

  // Filter Listeners
  if (filterYear) filterYear.addEventListener('change', updateDashboard);
  if (filterMonth) filterMonth.addEventListener('change', updateDashboard);
  if (filterCategory) filterCategory.addEventListener('change', renderTable);

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
      
      // Clear table
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-table">Nenhuma transação carregada. Clique em "Usar Dados de Demonstração" acima.</td>
        </tr>
      `;
      
      // Reset KPIs
      resetKPIs();
      updateDashboard();
      
      addLog('[SISTEMA] Sucesso! Todas as transações foram limpas do banco de dados.', 'success-line');
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

  // Budget Modal Control
  btnNewBudget.addEventListener('click', () => {
    budgetLimitVal.value = '';
    budgetModal.style.display = 'flex';
  });

  const closeBudget = () => budgetModal.style.display = 'none';
  closeBudgetModal.addEventListener('click', closeBudget);
  btnCancelBudget.addEventListener('click', closeBudget);

  btnSaveBudget.addEventListener('click', async () => {
    const category = budgetCategoryVal.value;
    const limit = parseFloat(budgetLimitVal.value);

    if (isNaN(limit) || limit <= 0) {
      alert('Por favor, defina um valor de limite válido.');
      return;
    }

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, limit_amount: limit })
      });
      if (response.ok) {
        loadedBudgets = await response.json();
        updateDashboard();
        closeBudget();
      }
    } catch (err) {
      console.error(err);
    }
  });

  async function deleteBudget(id) {
    try {
      const response = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadedBudgets = await response.json();
        updateDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Goal Modal Control
  btnNewGoal.addEventListener('click', () => {
    goalIdVal.value = '';
    goalNameVal.value = '';
    goalTargetVal.value = '';
    goalDateVal.value = '';
    document.getElementById('goal-modal-title').textContent = 'Nova Caixinha / Objetivo';
    goalModal.style.display = 'flex';
  });

  const closeGoal = () => goalModal.style.display = 'none';
  closeGoalModal.addEventListener('click', closeGoal);
  btnCancelGoal.addEventListener('click', closeGoal);

  btnSaveGoal.addEventListener('click', async () => {
    const name = goalNameVal.value.trim();
    const target = parseFloat(goalTargetVal.value);
    const date = goalDateVal.value;
    const id = goalIdVal.value;

    if (!name || isNaN(target) || target <= 0) {
      alert('Preencha os campos obrigatórios com valores válidos.');
      return;
    }

    try {
      const method = id ? 'PUT' : 'POST';
      const url = id ? `/api/goals/${id}` : '/api/goals';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, target_amount: target, target_date: date })
      });
      if (response.ok) {
        loadedGoals = await response.json();
        renderGoals();
        updateDashboard();
        closeGoal();
      }
    } catch (err) {
      console.error(err);
    }
  });

  async function deleteGoal(id) {
    try {
      const response = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadedGoals = await response.json();
        renderGoals();
        updateDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function updateGoalSavings(id, current_amount) {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_amount })
      });
      if (response.ok) {
        loadedGoals = await response.json();
        renderGoals();
        updateDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Recurring Modal Control
  btnNewRecurring.addEventListener('click', () => {
    recurringDescVal.value = '';
    recurringAmountVal.value = '';
    recurringDayVal.value = '';
    recurringModal.style.display = 'flex';
  });

  const closeRecurring = () => recurringModal.style.display = 'none';
  closeRecurringModal.addEventListener('click', closeRecurring);
  btnCancelRecurring.addEventListener('click', closeRecurring);

  btnSaveRecurring.addEventListener('click', async () => {
    const desc = recurringDescVal.value.trim();
    const amount = parseFloat(recurringAmountVal.value);
    const day = parseInt(recurringDayVal.value);
    const type = recurringTypeVal.value;

    if (!desc || isNaN(amount) || amount <= 0 || isNaN(day) || day < 1 || day > 31) {
      alert('Por favor, preencha todos os campos corretamente. O dia deve ser de 1 a 31.');
      return;
    }

    try {
      const response = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, amount, due_day: day, type })
      });
      if (response.ok) {
        loadedRecurring = await response.json();
        updateDashboard();
        closeRecurring();
      }
    } catch (err) {
      console.error(err);
    }
  });

  async function deleteRecurring(id) {
    try {
      const response = await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadedRecurring = await response.json();
        updateDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Tab Switching
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

  // Unified Agèntic Parser with Gemini
  async function parseTextAgently(text, sourceFormat = 'extrato') {
    const geminiKey = localStorage.getItem('key_gemini') || '';
    if (!geminiKey) {
      alert('Por favor, configure sua Gemini API Key nas Configurações (ícone de engrenagem) para habilitar o processador agêntico do extrato.');
      btnSettings.click();
      return;
    }
    
    addLog(`🛸 [AGENTE GEMINI] Iniciando processamento agêntico do seu extrato (${sourceFormat})...`);
    
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
      addLog(`🛸 [AGENTE GEMINI] Sucesso! ${loadedTransactions.length} transações identificadas e persistidas.`, 'success-line');
      
      updateDropZoneSuccess(loadedTransactions.length);
      updateDashboard();
      
      // Auto-trigger categorization
      addLog('🛸 [AGENTE GEMINI] Iniciando categorização automática...');
      btnCategorize.click();
    } catch (err) {
      addLog(`[ERRO AGENTE] Falha no processador: ${err.message}`, 'error-line');
      alert(`Falha no processador agêntico: ${err.message}`);
      
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

  // Drag and Drop File Parser (CSV, OFX, PDF)
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
            
            const linesMap = {};
            items.forEach(item => {
              if (!item.str.trim()) return;
              const y = Math.round(item.transform[5] * 2) / 2;
              
              let foundY = Object.keys(linesMap).find(existingY => Math.abs(parseFloat(existingY) - y) < 5);
              
              if (foundY) {
                linesMap[foundY].push(item);
              } else {
                linesMap[y] = [item];
              }
            });
            
            const sortedYs = Object.keys(linesMap).sort((a, b) => parseFloat(b) - parseFloat(a));
            
            let pageText = '';
            sortedYs.forEach(y => {
              const lineItems = linesMap[y];
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

  // Recategorize helper
  async function recategorizeTransaction(id, category) {
    try {
      const response = await fetch(`/api/transactions/${id}/category`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      });
      if (response.ok) {
        const data = await response.json();
        loadedTransactions = sanitizeTransactions(data);
        updateDashboard();
        addLog(`[SISTEMA] Transação #${id} recategorizada para "${category}".`, 'success-line');
      } else {
        alert('Erro ao atualizar categoria no servidor.');
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Get filtered transaction list based on global year/month filters
  function getFilteredTransactions() {
    const selectedYear = filterYear.value;
    const selectedMonth = filterMonth.value;

    return loadedTransactions.filter(tx => {
      if (!tx.date) return false;
      const parts = tx.date.split('-');
      const txYear = parts[0];
      const txMonth = parts[1];

      const matchesYear = selectedYear === 'Todos' || txYear === selectedYear;
      const matchesMonth = selectedMonth === 'Todos' || txMonth === selectedMonth;

      return matchesYear && matchesMonth;
    });
  }

  // Render table
  function renderTable() {
    tableBody.innerHTML = '';
    const filteredTxs = getFilteredTransactions();
    const selectedCat = filterCategory.value;

    const displayedTxs = filteredTxs.filter(tx => {
      const category = tx.status === 'Processado' ? (tx.actual_category || 'Outros') : (tx.expected_category || 'Outros');
      return selectedCat === 'Todas' || category === selectedCat;
    });

    if (displayedTxs.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-table">Nenhuma transação atende aos filtros atuais.</td>
        </tr>
      `;
      return;
    }

    displayedTxs.forEach(tx => {
      const row = document.createElement('tr');
      const category = tx.status === 'Processado' ? (tx.actual_category || 'Outros') : (tx.expected_category || 'Outros');
      
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

      // Generate select dropdown for inline categorization
      const selectHtml = `
        <select class="select-input table-cat-select" data-tx-id="${tx.id}" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); color: #fff; padding: 4px 8px; border-radius: 8px; font-size: 12px; outline: none; cursor: pointer;">
          ${CATEGORIES.map(cat => `<option value="${cat}" ${cat === category ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
      `;

      row.innerHTML = `
        <td>${formatDate(tx.date)}</td>
        <td>
          ${tx.description}
          ${tx.search_log ? `<span class="search-hint">🔍 Google: ${tx.search_log}</span>` : ''}
        </td>
        <td class="${tx.amount < 0 ? 'text-expense' : 'text-income'}" style="color: ${tx.amount < 0 ? '#ec4899' : '#10b981'}; font-weight: 600;">
          ${formatCurrency(tx.amount)}
        </td>
        <td>${selectHtml}</td>
        <td>${statusHtml}</td>
      `;

      // Bind in-table recategorization change
      row.querySelector('.table-cat-select').addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-tx-id');
        const newCategory = e.target.value;
        recategorizeTransaction(id, newCategory);
      });

      tableBody.appendChild(row);
    });
  }

  function resetKPIs() {
    kpiIncome.textContent = 'R$ 0,00';
    kpiExpenses.textContent = 'R$ 0,00';
    kpiBalance.textContent = 'R$ 0,00';
    kpiSavings.textContent = '0%';
  }

  // Process Categorization (Triggered by AI Button)
  btnCategorize.addEventListener('click', async () => {
    if (loadedTransactions.length === 0) return;
    
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

  // Update Dashboard KPIs, Graphs, Budgets, and Forecasts
  function updateDashboard() {
    const filteredTxs = getFilteredTransactions();

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    filteredTxs.forEach(tx => {
      if (tx.amount > 0) {
        monthlyIncome += tx.amount;
      } else {
        monthlyExpenses += Math.abs(tx.amount);
      }
    });

    // Balance calculation: all-time income - all-time expenses - total goals current amount
    let totalAllTimeIncome = 0;
    let totalAllTimeExpenses = 0;
    loadedTransactions.forEach(tx => {
      if (tx.amount > 0) {
        totalAllTimeIncome += tx.amount;
      } else {
        totalAllTimeExpenses += Math.abs(tx.amount);
      }
    });

    const totalGoalsSaved = loadedGoals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
    const balance = totalAllTimeIncome - totalAllTimeExpenses - totalGoalsSaved;

    const savingsRate = monthlyIncome > 0 ? (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(0) : 0;

    kpiIncome.textContent = formatCurrency(monthlyIncome);
    kpiExpenses.textContent = formatCurrency(monthlyExpenses);
    kpiBalance.textContent = formatCurrency(balance);
    kpiSavings.textContent = `${savingsRate}%`;

    // Render table
    renderTable();

    // Render chart
    renderChart(filteredTxs);

    // Render Top Merchants
    renderTopMerchants(filteredTxs);

    // Render Budgets
    renderBudgets(filteredTxs);

    // Render Forecast / cash flow
    renderForecast(balance);
  }

  // Render Expense Distribution Chart
  function renderChart(transactionsList) {
    const categoriesMap = {};
    transactionsList.forEach(tx => {
      const category = tx.status === 'Processado' ? (tx.actual_category || 'Outros') : (tx.expected_category || 'Outros');
      if (tx.amount < 0) {
        categoriesMap[category] = (categoriesMap[category] || 0) + Math.abs(tx.amount);
      }
    });

    const labels = Object.keys(categoriesMap);
    const data = Object.values(categoriesMap);

    if (labels.length === 0) {
      chartPlaceholder.classList.remove('hidden');
      if (expensesChart) {
        expensesChart.destroy();
        expensesChart = null;
      }
      return;
    }

    chartPlaceholder.classList.add('hidden');

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

  // Render Top Merchants List (Top 5)
  function renderTopMerchants(transactionsList) {
    topMerchantsList.innerHTML = '';
    const merchants = {};
    let totalExpense = 0;

    transactionsList.forEach(tx => {
      if (tx.amount < 0) {
        const desc = tx.description.toUpperCase().trim();
        merchants[desc] = (merchants[desc] || 0) + Math.abs(tx.amount);
        totalExpense += Math.abs(tx.amount);
      }
    });

    const sorted = Object.entries(merchants)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    if (sorted.length === 0) {
      topMerchantsList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 12px 0;">Importe dados para visualizar a análise</p>`;
      return;
    }

    sorted.forEach(m => {
      const pct = totalExpense > 0 ? ((m.amount / totalExpense) * 100).toFixed(0) : 0;
      const mItem = document.createElement('div');
      mItem.style.display = 'flex';
      mItem.style.justifyContent = 'space-between';
      mItem.style.alignItems = 'center';
      mItem.innerHTML = `
        <div>
          <span style="font-weight: 500; font-size: 13px; color: #ffffff;">${m.name}</span>
          <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">${pct}%</span>
        </div>
        <span style="font-weight: 600; font-size: 13px; color: var(--accent-pink);">${formatCurrency(m.amount)}</span>
      `;
      topMerchantsList.appendChild(mItem);
    });
  }

  // Render Category Budget Limits compared to real spending
  function renderBudgets(transactionsList) {
    budgetList.innerHTML = '';
    const spentByCategory = {};

    transactionsList.forEach(tx => {
      if (tx.amount < 0) {
        const cat = tx.status === 'Processado' ? (tx.actual_category || 'Outros') : (tx.expected_category || 'Outros');
        spentByCategory[cat] = (spentByCategory[cat] || 0) + Math.abs(tx.amount);
      }
    });

    if (loadedBudgets.length === 0) {
      budgetList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 20px 0;">Nenhum orçamento definido para este mês.</p>`;
      return;
    }

    loadedBudgets.forEach(b => {
      const limit = parseFloat(b.limit_amount);
      const spent = spentByCategory[b.category] || 0;
      const isOver = spent > limit;
      const pct = Math.min((spent / limit) * 100, 100);
      const barColor = isOver ? '#ef4444' : '#10b981';
      const glow = isOver ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';

      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.gap = '6px';
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px;">
          <span style="font-weight: 600; color: #ffffff;">${b.category}</span>
          <span style="color: var(--text-muted); font-size: 12px;">
            ${formatCurrency(spent)} / ${formatCurrency(limit)}
            ${isOver ? '<span style="color: #ef4444; font-weight: 700; margin-left: 6px;">🔴</span>' : ''}
          </span>
        </div>
        <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; display: flex; align-items: center;">
          <div style="width: ${pct}%; height: 100%; background: ${barColor}; box-shadow: 0 0 8px ${glow}; border-radius: 4px; transition: width 0.5s ease-in-out;"></div>
        </div>
        <div style="display: flex; justify-content: flex-end;">
          <button class="btn-delete-budget" data-id="${b.id}" style="background: none; border: none; color: var(--text-dark); cursor: pointer; font-size: 11px; padding: 2px 4px; transition: var(--transition);">Remover Limite</button>
        </div>
      `;

      item.querySelector('.btn-delete-budget').addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm('Deseja remover o limite de orçamento desta categoria?')) {
          await deleteBudget(id);
        }
      });

      budgetList.appendChild(item);
    });
  }

  // Render Goals List
  function renderGoals() {
    goalsList.innerHTML = '';

    if (loadedGoals.length === 0) {
      goalsList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 12px 0;">Nenhum objetivo cadastrado.</p>`;
      return;
    }

    loadedGoals.forEach(g => {
      const current = parseFloat(g.current_amount || 0);
      const target = parseFloat(g.target_amount);
      const pct = Math.min((current / target) * 100, 100);
      const dateHtml = g.target_date ? `<span style="font-size: 11px; color: var(--text-muted);">Meta: ${formatDate(g.target_date)}</span>` : '';

      const item = document.createElement('div');
      item.style.background = 'rgba(255, 255, 255, 0.02)';
      item.style.border = '1px solid var(--border-color)';
      item.style.borderRadius = '12px';
      item.style.padding = '14px';
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.gap = '8px';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h4 style="font-size: 14px; font-weight: 600; color: #ffffff;">${g.name}</h4>
            ${dateHtml}
          </div>
          <span style="font-size: 13px; font-weight: 600; color: var(--accent-emerald);">
            ${formatCurrency(current)} / ${formatCurrency(target)}
          </span>
        </div>
        <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
          <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--accent-purple), var(--accent-emerald)); border-radius: 3px;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-save-goal-cash" style="padding: 4px 8px; font-size: 11px;">+ Poupar</button>
            <button class="btn btn-secondary btn-sm btn-withdraw-goal-cash" style="padding: 4px 8px; font-size: 11px;">- Resgatar</button>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn-edit-goal" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 11px;">Editar</button>
            <button class="btn-delete-goal" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 11px;">Excluir</button>
          </div>
        </div>
      `;

      // Goal interactions listeners
      item.querySelector('.btn-save-goal-cash').addEventListener('click', () => {
        const val = parseFloat(prompt(`Quanto deseja poupar na caixinha "${g.name}"?`));
        if (!isNaN(val) && val > 0) {
          updateGoalSavings(g.id, current + val);
        }
      });

      item.querySelector('.btn-withdraw-goal-cash').addEventListener('click', () => {
        const val = parseFloat(prompt(`Quanto deseja resgatar da caixinha "${g.name}"?`));
        if (!isNaN(val) && val > 0) {
          if (current - val < 0) {
            alert('Saldo insuficiente na caixinha!');
          } else {
            updateGoalSavings(g.id, current - val);
          }
        }
      });

      item.querySelector('.btn-edit-goal').addEventListener('click', () => {
        goalIdVal.value = g.id;
        goalNameVal.value = g.name;
        goalTargetVal.value = g.target_amount;
        goalDateVal.value = g.target_date || '';
        document.getElementById('goal-modal-title').textContent = 'Editar Caixinha';
        goalModal.style.display = 'flex';
      });

      item.querySelector('.btn-delete-goal').addEventListener('click', () => {
        if (confirm(`Tem certeza de que deseja excluir a caixinha "${g.name}"? Todo o saldo poupado voltará ao saldo disponível.`)) {
          deleteGoal(g.id);
        }
      });

      goalsList.appendChild(item);
    });
  }

  // Render Forecast Cash Flow Timeline
  function renderForecast(currentBalance) {
    forecastTimeline.innerHTML = '';
    
    // Calculate running cash flow events over the next 30 days
    const events = [];
    const today = new Date();
    
    // Sort recurring config
    const recurringList = [...loadedRecurring].sort((a,b) => a.due_day - b.due_day);

    let projectedBalance = currentBalance;

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const projectionDate = new Date(today);
      projectionDate.setDate(today.getDate() + dayOffset);
      const currentDay = projectionDate.getDate();

      // Check if there are recurring bills scheduled for this day
      recurringList.forEach(rec => {
        if (rec.due_day === currentDay) {
          const val = parseFloat(rec.amount);
          if (rec.type === 'Receita') {
            projectedBalance += val;
          } else {
            projectedBalance -= val;
          }

          events.push({
            dateStr: projectionDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
            description: rec.description,
            amount: val,
            type: rec.type,
            balance: projectedBalance
          });
        }
      });
    }

    if (events.length === 0) {
      forecastTimeline.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 12px 0;">Sem lançamentos recorrentes projetados para os próximos 30 dias.</p>`;
    } else {
      events.forEach(e => {
        const evItem = document.createElement('div');
        evItem.style.display = 'flex';
        evItem.style.justifyContent = 'space-between';
        evItem.style.alignItems = 'center';
        evItem.style.padding = '8px 12px';
        evItem.style.background = 'rgba(255, 255, 255, 0.01)';
        evItem.style.borderRadius = '8px';
        evItem.style.borderLeft = `3px solid ${e.type === 'Receita' ? '#10b981' : '#ec4899'}`;
        
        evItem.innerHTML = `
          <div>
            <span style="font-size: 11px; color: var(--text-muted); display: block;">${e.dateStr}</span>
            <span style="font-size: 13px; font-weight: 500; color: #ffffff;">${e.description}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-size: 13px; font-weight: 600; color: ${e.type === 'Receita' ? '#10b981' : '#ec4899'}; display: block;">
              ${e.type === 'Receita' ? '+' : '-'}${formatCurrency(e.amount)}
            </span>
            <span style="font-size: 11px; color: var(--text-muted);">Previsto: ${formatCurrency(e.balance)}</span>
          </div>
        `;
        forecastTimeline.appendChild(evItem);
      });
    }

    // Append configured recurring bills list below the forecast timeline
    const recHeader = document.createElement('h4');
    recHeader.style.fontFamily = 'var(--font-title)';
    recHeader.style.fontSize = '13px';
    recHeader.style.color = '#ffffff';
    recHeader.style.marginTop = '20px';
    recHeader.style.marginBottom = '8px';
    recHeader.style.display = 'flex';
    recHeader.style.alignItems = 'center';
    recHeader.style.gap = '6px';
    recHeader.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
      Lançamentos Recorrentes Configurados
    `;
    forecastTimeline.appendChild(recHeader);

    if (loadedRecurring.length === 0) {
      const emptyRec = document.createElement('p');
      emptyRec.style.fontSize = '12px';
      emptyRec.style.color = 'var(--text-muted)';
      emptyRec.style.textAlign = 'center';
      emptyRec.style.margin = '10px 0';
      emptyRec.textContent = 'Nenhum lançamento recorrente cadastrado.';
      forecastTimeline.appendChild(emptyRec);
      return;
    }

    const recContainer = document.createElement('div');
    recContainer.style.display = 'flex';
    recContainer.style.flexDirection = 'column';
    recContainer.style.gap = '8px';

    loadedRecurring.forEach(rec => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.fontSize = '12px';
      item.style.background = 'rgba(255,255,255,0.02)';
      item.style.padding = '6px 10px';
      item.style.borderRadius = '6px';
      item.style.border = '1px solid var(--border-color)';
      
      item.innerHTML = `
        <span>${rec.description} (Dia ${rec.due_day})</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 600; color: ${rec.type === 'Receita' ? '#10b981' : '#ec4899'}">
            ${rec.type === 'Receita' ? '+' : '-'}${formatCurrency(rec.amount)}
          </span>
          <button class="btn-delete-recurring" data-id="${rec.id}" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; padding: 2px 6px;">&times;</button>
        </div>
      `;
      
      item.querySelector('.btn-delete-recurring').addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm(`Excluir lançamento recorrente "${rec.description}"?`)) {
          await deleteRecurring(id);
        }
      });

      recContainer.appendChild(item);
    });

    forecastTimeline.appendChild(recContainer);
  }

  // Format Helper Utilities
  function formatDate(dateStr) {
    if (!dateStr) return '';
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
