document.addEventListener('DOMContentLoaded', () => {
  // UI elements
  const dropZone = document.getElementById('drop-zone');
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

  // Spec 1.0 Selectors
  const scoreValue = document.getElementById('score-value');
  const scoreBadge = document.getElementById('score-badge');
  const scoreText = document.getElementById('score-text');
  const scoreGauge = document.getElementById('score-gauge');
  const scoreCenterText = document.getElementById('score-center-text');

  const budget50Value = document.getElementById('budget-50-value');
  const budget50Pct = document.getElementById('budget-50-pct');
  const budget50Bar = document.getElementById('budget-50-bar');
  const budget50TargetPct = document.getElementById('budget-50-target-pct');
  const budget30Value = document.getElementById('budget-30-value');
  const budget30Pct = document.getElementById('budget-30-pct');
  const budget30Bar = document.getElementById('budget-30-bar');
  const budget30TargetPct = document.getElementById('budget-30-target-pct');
  const budget20Value = document.getElementById('budget-20-value');
  const budget20Pct = document.getElementById('budget-20-pct');
  const budget20Bar = document.getElementById('budget-20-bar');
  const budget20TargetPct = document.getElementById('budget-20-target-pct');
  const budgetMethodLabel = document.getElementById('budget-method-label');

  const emergencySavedValue = document.getElementById('emergency-saved-value');
  const emergencyTargetValue = document.getElementById('emergency-target-value');
  const emergencyProgressBar = document.getElementById('emergency-progress-bar');
  const emergencyMonthsCovered = document.getElementById('emergency-months-covered');
  const emergencyPctLabel = document.getElementById('emergency-pct-label');
  const emergencyEssentialExpenses = document.getElementById('emergency-essential-expenses');
  const emergencyMonths = document.getElementById('emergency-months');
  const emergencySuggestedLabel = document.getElementById('emergency-suggested-label');
  const btnUseAutoExpenses = document.getElementById('btn-use-auto-expenses');
  const btnDepositEmergency = document.getElementById('btn-deposit-emergency');

  const debtsList = document.getElementById('debts-list');
  const debtExtraBudget = document.getElementById('debt-extra-budget');
  const debtCalculatedExtraLabel = document.getElementById('debt-calculated-extra-label');
  const debtSimulationResults = document.getElementById('debt-simulation-results');
  const btnNewDebt = document.getElementById('btn-new-debt');

  const debtModal = document.getElementById('debt-modal');
  const closeDebtModal = document.getElementById('close-debt-modal');
  const btnCancelDebt = document.getElementById('btn-cancel-debt');
  const btnSaveDebt = document.getElementById('btn-save-debt');
  const debtIdVal = document.getElementById('debt-id-val');
  const debtName = document.getElementById('debt-name');
  const debtBalance = document.getElementById('debt-balance');
  const debtRate = document.getElementById('debt-rate');
  const debtPayment = document.getElementById('debt-payment');

  const profileStartingBalance = document.getElementById('profile-starting-balance');
  const profileMonthlyIncome = document.getElementById('profile-monthly-income');
  const profileWork = document.getElementById('profile-work');
  
  // State
  let loadedTransactions = [];
  let loadedGoals = [];
  let loadedBudgets = [];
  let loadedRecurring = [];
  let loadedDebts = [];
  let userProfile = {
    monthly_income: 0.00,
    starting_balance: 0.00,
    work_profile: 'CLT',
    budget_method: '50-30-20'
  };
  let expensesChart = null;

  const categoryToBlockMap = {
    'Moradia': 'Necessidade',
    'Alimentação': 'Necessidade',
    'Transporte': 'Necessidade',
    'Saúde': 'Necessidade',
    'Educação': 'Necessidade',
    'Contas Fixas': 'Necessidade',
    'Lazer': 'Desejo',
    'Vestuário': 'Desejo',
    'Delivery / Comer fora': 'Desejo',
    'Assinaturas': 'Desejo',
    'Compras Online': 'Desejo',
    'Investimentos': 'Meta',
    'Reserva': 'Meta',
    'Poupança': 'Meta',
    'Assinaturas & Serviços': 'Desejo',
    'Supermercado': 'Necessidade',
    'Compras': 'Desejo',
    'Combustível': 'Necessidade',
    'Lazer & Entretenimento': 'Desejo',
    'Outros': 'Desejo'
  };

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

  // Planning Sub Tabs Toggle
  const subTabBtns = document.querySelectorAll('.sub-tab-btn');
  const subViews = document.querySelectorAll('.sub-view-section, .sub-view-content');

  subTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSub = btn.getAttribute('data-sub');
      
      subTabBtns.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      subViews.forEach(v => {
        if (v.id === `sub-${targetSub}`) {
          v.style.display = 'block';
        } else {
          v.style.display = 'none';
        }
      });
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
  loadUserProfile();
  loadSavedTransactions();
  loadGoals();
  loadBudgets();
  loadRecurring();
  loadDebts();

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
          autoSetFiltersToMostRecent();
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

  async function loadUserProfile() {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        userProfile = await response.json();
        if (profileStartingBalance) profileStartingBalance.value = userProfile.starting_balance || 0;
        if (profileMonthlyIncome) profileMonthlyIncome.value = userProfile.monthly_income || 0;
        if (profileWork) profileWork.value = userProfile.work_profile || 'CLT';
        updateDashboard();
      }
    } catch (err) {
      console.error('Erro ao carregar perfil do usuário:', err);
    }
  }

  async function loadDebts() {
    try {
      const response = await fetch('/api/debts');
      if (response.ok) {
        loadedDebts = await response.json();
        renderDebts();
        updateDashboard();
      }
    } catch (err) {
      console.error('Erro ao carregar dívidas:', err);
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

  function autoSetFiltersToMostRecent() {
    if (loadedTransactions.length === 0) return;
    
    let mostRecentDate = null;
    loadedTransactions.forEach(tx => {
      if (!tx.date) return;
      if (!mostRecentDate || tx.date > mostRecentDate) {
        mostRecentDate = tx.date;
      }
    });

    if (mostRecentDate) {
      const parts = mostRecentDate.split('-');
      if (parts.length >= 2) {
        const txYear = parts[0];
        const txMonth = parts[1];
        
        if (filterYear) filterYear.value = txYear;
        if (filterMonth) filterMonth.value = txMonth;
      }
    }
  }

  // Attach initial listeners for clear button
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
        <button class="btn btn-secondary" id="btn-clear-data" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); color: #ef4444;">Limpar Dados</button>
      </div>
    `;
    
    // Re-bind listeners because elements were recreated
    const clearBtn = document.getElementById('btn-clear-data');
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
          <td colspan="5" class="empty-table">Nenhuma transação carregada. Importe um extrato para começar.</td>
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
  
  btnSaveSettings.addEventListener('click', async () => {
    localStorage.setItem('key_gemini', keyGemini.value.trim());
    
    const payload = {
      starting_balance: parseFloat(profileStartingBalance.value) || 0,
      monthly_income: parseFloat(profileMonthlyIncome.value) || 0,
      work_profile: profileWork.value || 'CLT',
      budget_method: '50-30-20'
    };

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        userProfile = await response.json();
        addLog('[SISTEMA] Perfil financeiro e chaves de API salvos com sucesso.', 'success-line');
      } else {
        throw new Error('Falha ao salvar perfil no servidor.');
      }
    } catch (err) {
      console.error('Falha ao persistir perfil:', err);
      userProfile = payload;
      addLog('[SISTEMA] Configurações salvas localmente (banco offline).', 'success-line');
    }

    updateDashboard();
    closeModal();
  });

  function loadSettings() {
    keyGemini.value = localStorage.getItem('key_gemini') || '';
    if (profileStartingBalance) profileStartingBalance.value = userProfile.starting_balance || 0;
    if (profileMonthlyIncome) profileMonthlyIncome.value = userProfile.monthly_income || 0;
    if (profileWork) profileWork.value = userProfile.work_profile || 'CLT';
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

  // --- DEBT MODAL & INPUT CONTROLS ---
  if (btnNewDebt) {
    btnNewDebt.addEventListener('click', () => {
      debtIdVal.value = '';
      debtName.value = '';
      debtBalance.value = '';
      debtRate.value = '';
      debtPayment.value = '';
      if (document.getElementById('debt-modal-title')) {
        document.getElementById('debt-modal-title').textContent = 'Nova Dívida';
      }
      debtModal.style.display = 'flex';
    });
  }

  const closeDebt = () => {
    if (debtModal) debtModal.style.display = 'none';
  };
  if (closeDebtModal) closeDebtModal.addEventListener('click', closeDebt);
  if (btnCancelDebt) btnCancelDebt.addEventListener('click', closeDebt);

  if (btnSaveDebt) {
    btnSaveDebt.addEventListener('click', async () => {
      const name = debtName.value.trim();
      const balanceVal = parseFloat(debtBalance.value);
      const interestVal = parseFloat(debtRate.value);
      const paymentVal = parseFloat(debtPayment.value);
      const id = debtIdVal.value;

      if (!name || isNaN(balanceVal) || balanceVal <= 0 || isNaN(interestVal) || isNaN(paymentVal)) {
        alert('Por favor, preencha todos os campos obrigatórios corretamente.');
        return;
      }

      const payload = {
        name,
        balance: balanceVal,
        interest_rate: interestVal,
        minimum_payment: paymentVal
      };

      try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/debts/${id}` : '/api/debts';
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          loadedDebts = await response.json();
          renderDebts();
          updateDashboard();
          closeDebt();
        } else {
          alert('Erro ao salvar dívida no servidor.');
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Extra debt payoff input trigger
  if (debtExtraBudget) {
    debtExtraBudget.addEventListener('input', () => {
      calculateDebtSimulations();
    });
  }

  // --- EMERGENCY FUND INPUTS CONTROLS ---
  if (emergencyEssentialExpenses) {
    emergencyEssentialExpenses.addEventListener('input', () => {
      calculateEmergencyFund();
    });
  }
  if (emergencyMonths) {
    emergencyMonths.addEventListener('input', () => {
      calculateEmergencyFund();
    });
  }

  if (btnUseAutoExpenses) {
    btnUseAutoExpenses.addEventListener('click', () => {
      // Find Needs sum
      const filteredTxs = getFilteredTransactions();
      let autoNeeds = 0;
      filteredTxs.forEach(tx => {
        const block = tx.budget_block || categoryToBlockMap[tx.actual_category || tx.expected_category] || 'Necessidade';
        if (block === 'Necessidade' && tx.amount < 0 && !tx.exclude_from_dash && !isTransferOrCardPayment(tx)) {
          autoNeeds += Math.abs(tx.amount);
        }
      });
      emergencyEssentialExpenses.value = autoNeeds.toFixed(2);
      calculateEmergencyFund();
    });
  }

  if (btnDepositEmergency) {
    btnDepositEmergency.addEventListener('click', () => {
      // Open goal modal pre-filled
      goalIdVal.value = '';
      goalNameVal.value = 'Reserva de Emergência';
      
      const essentialExpenses = parseFloat(emergencyEssentialExpenses.value) || 0;
      const monthsOfCover = parseFloat(emergencyMonths.value) || 6;
      const targetVal = essentialExpenses * monthsOfCover;
      goalTargetVal.value = targetVal.toFixed(2);
      
      // Target date in 1 year
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      goalDateVal.value = nextYear.toISOString().substring(0, 10);

      if (document.getElementById('goal-modal-title')) {
        document.getElementById('goal-modal-title').textContent = 'Criar Caixinha de Reserva';
      }
      goalModal.style.display = 'flex';
    });
  }

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
      autoSetFiltersToMostRecent();
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
      handleFiles(files);
    }
  });

  dropZone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.csv,.txt,.ofx,.pdf';
    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    };
    input.click();
  });

  // Configure PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
  }

  function readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      if (file.name.endsWith('.pdf')) {
        reader.onload = async (e) => {
          const arrayBuffer = e.target.result;
          try {
            if (typeof pdfjsLib === 'undefined') {
              return reject(new Error('Biblioteca PDF.js não está disponível. Recarregue a página.'));
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
            resolve(fullText);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file, 'utf-8');
      }
    });
  }

  async function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    addLog(`[SISTEMA] Iniciando leitura de ${files.length} arquivos...`);
    let allTexts = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await readFileContent(file);
        allTexts.push({ text, name: file.name });
      } catch (err) {
        addLog(`[ERRO] Falha ao ler o arquivo ${file.name}: ${err.message}`, 'error-line');
      }
    }

    if (allTexts.length === 0) {
      alert('Nenhum dos arquivos pôde ser lido com sucesso.');
      return;
    }

    // Process all texts together
    addLog(`[SISTEMA] Processando conteúdo de ${allTexts.length} arquivos...`);
    parseMultipleTextsAgently(allTexts);
  }

  async function parseMultipleTextsAgently(allTexts) {
    const geminiKey = localStorage.getItem('key_gemini') || '';
    
    // Show loading in drop zone
    dropZone.innerHTML = `
      <div class="drop-zone-icon loading-spin" style="border: 4px solid rgba(59, 130, 246, 0.1); border-left-color: var(--accent-blue); width: 32px; height: 32px; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 12px;"></div>
      <span class="drop-zone-text" style="color: var(--accent-blue)">Processando ${allTexts.length} arquivos...</span>
      <span class="drop-zone-or" style="margin-top: 8px;">A extração pode levar alguns segundos.</span>
    `;

    let allTransactions = [];
    let errors = [];

    for (const fileData of allTexts) {
      addLog(`🛸 [PARSER] Enviando arquivo "${fileData.name}" para análise...`);
      try {
        const response = await fetch('/api/parse-statement', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': geminiKey
          },
          body: JSON.stringify({ text: fileData.text })
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Erro no servidor.');
        }
        
        const transactions = await response.json();
        if (transactions.length > 0) {
          addLog(`🛸 [PARSER] Sucesso: ${transactions.length} transações encontradas em "${fileData.name}".`, 'success-line');
          allTransactions = allTransactions.concat(transactions);
        } else {
          addLog(`🛸 [PARSER] Nenhuma transação encontrada em "${fileData.name}".`);
        }
      } catch (err) {
        addLog(`🛸 [ERRO] Falha ao processar "${fileData.name}": ${err.message}`, 'error-line');
        errors.push(`${fileData.name}: ${err.message}`);
      }
    }

    if (allTransactions.length === 0) {
      alert(`Falha ao processar arquivos:\n${errors.join('\n')}`);
      resetDropZoneToDefault();
      return;
    }

    // Assign unique IDs to all combined transactions
    allTransactions.forEach((tx, idx) => {
      tx.id = idx + 1;
    });

    try {
      addLog(`🛸 [PARSER] Persistindo total de ${allTransactions.length} transações no servidor...`);
      const saveResponse = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(allTransactions)
      });
      
      if (!saveResponse.ok) {
        throw new Error('Falha ao persistir transações no banco de dados.');
      }
      
      const persistedTransactions = await saveResponse.json();
      loadedTransactions = sanitizeTransactions(persistedTransactions);
      addLog(`🛸 [PARSER] Sucesso! Total de ${loadedTransactions.length} transações importadas e persistidas.`, 'success-line');
      autoSetFiltersToMostRecent();
      updateDropZoneSuccess(loadedTransactions.length);
      updateDashboard();
      
      // Auto-trigger categorization
      addLog('🛸 [PARSER] Iniciando categorização automática...');
      btnCategorize.click();

      if (errors.length > 0) {
        alert(`Processamento concluído com alguns avisos:\nImportadas: ${loadedTransactions.length} transações.\n\nErros em alguns arquivos:\n${errors.join('\n')}`);
      }
    } catch (err) {
      addLog(`[ERRO] Falha ao salvar transações: ${err.message}`, 'error-line');
      alert(`Falha ao salvar transações: ${err.message}`);
      resetDropZoneToDefault();
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
      if (tx.exclude_from_dash) {
        row.classList.add('tx-row-excluded');
      }
      
      const category = tx.status === 'Processado' ? (tx.actual_category || 'Outros') : (tx.expected_category || 'Outros');

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
        <td style="text-align: center;">
          <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted);">
            <input type="checkbox" class="tx-exclude-chk" data-tx-id="${tx.id}" ${tx.exclude_from_dash ? 'checked' : ''} style="cursor: pointer;">
            <span>Ignorar</span>
          </label>
        </td>
      `;

      // Bind in-table recategorization change
      row.querySelector('.table-cat-select').addEventListener('change', (e) => {
        const id = e.target.getAttribute('data-tx-id');
        const newCategory = e.target.value;
        recategorizeTransaction(id, newCategory);
      });

      // Bind exclude toggle checkbox
      row.querySelector('.tx-exclude-chk').addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-tx-id');
        const checked = e.target.checked;
        try {
          const res = await fetch(`/api/transactions/${id}/exclude`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exclude_from_dash: checked })
          });
          if (res.ok) {
            const updated = await res.json();
            loadedTransactions = sanitizeTransactions(updated);
            renderTable();
            updateDashboard();
          }
        } catch (err) {
          console.error('Erro ao atualizar exclusão da transação:', err);
        }
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

  function isTransferOrCardPayment(tx) {
    const category = tx.status === 'Processado' ? (tx.actual_category || 'Outros') : (tx.expected_category || 'Outros');
    if (category === 'Transferências') {
      return true;
    }
    const desc = (tx.description || '').toUpperCase();
    return (
      desc.includes('PAGAMENTO DE FATURA') || 
      desc.includes('PAGTO FATURA') || 
      desc.includes('PAG.FATURA') || 
      desc.includes('PAGAMENTO CARTAO') || 
      desc.includes('PAGTO CARTAO') || 
      desc.includes('LIQUIDACAO FATURA') ||
      desc.includes('PAGAMENTO DE BOLETO') ||
      desc.includes('PAGAMENTO BOLETO') ||
      desc.includes('PAGTO BOLETO') ||
      desc.includes('PAGAMENTO TITULO') ||
      desc.includes('PAGTO TITULO')
    );
  }

  // Update Dashboard KPIs, Graphs, Budgets, and Forecasts
  function updateDashboard() {
    const filteredTxs = getFilteredTransactions();

    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    filteredTxs.forEach(tx => {
      if (isTransferOrCardPayment(tx) || tx.exclude_from_dash) return;
      
      if (tx.amount > 0) {
        monthlyIncome += tx.amount;
      } else {
        monthlyExpenses += Math.abs(tx.amount);
      }
    });

    const kpiBalanceLabel = document.getElementById('kpi-balance-label');
    const selectedMonth = filterMonth ? filterMonth.value : 'Todos';

    let balance = 0;
    if (selectedMonth === 'Todos') {
      if (kpiBalanceLabel) kpiBalanceLabel.textContent = 'Saldo Total';
      
      let totalAllTimeIncome = 0;
      let totalAllTimeExpenses = 0;
      loadedTransactions.forEach(tx => {
        if (tx.exclude_from_dash) return; // Skip excluded transactions for balance
        if (tx.amount > 0) {
          totalAllTimeIncome += tx.amount;
        } else {
          totalAllTimeExpenses += Math.abs(tx.amount);
        }
      });
      const totalGoalsSaved = loadedGoals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);
      balance = (parseFloat(userProfile.starting_balance) || 0) + totalAllTimeIncome - totalAllTimeExpenses - totalGoalsSaved;
    } else {
      if (kpiBalanceLabel) kpiBalanceLabel.textContent = 'Saldo do Mês';
      balance = monthlyIncome - monthlyExpenses;
    }

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

    // Render 50-30-20 budget progress bars
    render503020Budget(filteredTxs, monthlyIncome);

    // Render Health Score (0-100)
    calculateHealthScore(monthlyIncome, monthlyExpenses, filteredTxs);

    // Spec 1.0 Additions
    calculateEmergencyFund();
    renderDebts();
  }

  // Helper to render 50-30-20 budget bars
  function render503020Budget(filteredTxs, monthlyIncome) {
    const income = parseFloat(userProfile.monthly_income) || monthlyIncome || 0;
    
    let needsSum = 0;
    let wantsSum = 0;
    let metasSum = 0;

    filteredTxs.forEach(tx => {
      if (tx.amount < 0 && !tx.exclude_from_dash && !isTransferOrCardPayment(tx)) {
        const block = tx.budget_block || categoryToBlockMap[tx.actual_category || tx.expected_category] || 'Necessidade';
        if (block === 'Necessidade') {
          needsSum += Math.abs(tx.amount);
        } else if (block === 'Desejo') {
          wantsSum += Math.abs(tx.amount);
        } else if (block === 'Meta') {
          metasSum += Math.abs(tx.amount);
        }
      }
    });

    if (budgetMethodLabel) {
      budgetMethodLabel.textContent = `Perfil: ${userProfile.work_profile || 'CLT'} (Renda Ref: ${formatCurrency(income)})`;
    }

    const needsLimit = income * 0.5;
    const wantsLimit = income * 0.3;
    const metasLimit = income * 0.2;

    if (budget50Value) budget50Value.textContent = `${formatCurrency(needsSum)} / ${formatCurrency(needsLimit)}`;
    if (budget30Value) budget30Value.textContent = `${formatCurrency(wantsSum)} / ${formatCurrency(wantsLimit)}`;
    if (budget20Value) budget20Value.textContent = `${formatCurrency(metasSum)} / ${formatCurrency(metasLimit)}`;

    const needsPctVal = needsLimit > 0 ? Math.min((needsSum / needsLimit) * 100, 200) : 0;
    const wantsPctVal = wantsLimit > 0 ? Math.min((wantsSum / wantsLimit) * 100, 200) : 0;
    const metasPctVal = metasLimit > 0 ? Math.min((metasSum / metasLimit) * 100, 200) : 0;

    if (budget50Pct) budget50Pct.textContent = `(${needsPctVal.toFixed(0)}%)`;
    if (budget30Pct) budget30Pct.textContent = `(${wantsPctVal.toFixed(0)}%)`;
    if (budget20Pct) budget20Pct.textContent = `(${metasPctVal.toFixed(0)}%)`;

    if (budget50Bar) {
      budget50Bar.style.width = `${Math.min(needsPctVal, 100)}%`;
      budget50Bar.style.backgroundColor = needsPctVal > 100 ? '#ef4444' : 'var(--accent-indigo)';
    }
    if (budget30Bar) {
      budget30Bar.style.width = `${Math.min(wantsPctVal, 100)}%`;
      budget30Bar.style.backgroundColor = wantsPctVal > 100 ? '#ef4444' : 'var(--accent-pink)';
    }
    if (budget20Bar) {
      budget20Bar.style.width = `${Math.min(metasPctVal, 100)}%`;
      budget20Bar.style.backgroundColor = metasPctVal > 100 ? '#ef4444' : 'var(--accent-emerald)';
    }
  }

  // Render Expense Distribution Chart
  function renderChart(transactionsList) {
    const categoriesMap = {};
    transactionsList.forEach(tx => {
      if (isTransferOrCardPayment(tx) || tx.exclude_from_dash) return;
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
      if (isTransferOrCardPayment(tx) || tx.exclude_from_dash) return;
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
      if (tx.amount < 0 && !tx.exclude_from_dash && !isTransferOrCardPayment(tx)) {
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

  // --- HEALTH SCORE CALCULATION ENGINE ---
  function calculateHealthScore(monthlyIncome, monthlyExpenses, filteredTxs) {
    const income = parseFloat(userProfile.monthly_income) || monthlyIncome || 0;
    
    // 1. GASTAR (30%)
    let gastarScore = 100;
    let essentialExpenses = 0;
    let wantExpenses = 0;
    let goalExpenses = 0;
    
    filteredTxs.forEach(tx => {
      if (tx.amount < 0 && !tx.exclude_from_dash && !isTransferOrCardPayment(tx)) {
        const block = tx.budget_block || categoryToBlockMap[tx.actual_category || tx.expected_category] || 'Necessidade';
        if (block === 'Necessidade') essentialExpenses += Math.abs(tx.amount);
        else if (block === 'Desejo') wantExpenses += Math.abs(tx.amount);
        else if (block === 'Meta') goalExpenses += Math.abs(tx.amount);
      }
    });

    const totalSpent = essentialExpenses + wantExpenses + goalExpenses;
    const burnRate = income > 0 ? (essentialExpenses / income) * 100 : (totalSpent > 0 ? 100 : 0);
    
    if (burnRate > 60) {
      gastarScore -= Math.min(40, (burnRate - 60) * 1.5);
    } else if (burnRate > 50) {
      gastarScore -= (burnRate - 50) * 0.5;
    }
    
    if (totalSpent > 0) {
      const needPct = (essentialExpenses / totalSpent) * 100;
      const wantPct = (wantExpenses / totalSpent) * 100;
      if (needPct > 60) gastarScore -= 10;
      if (wantPct > 40) gastarScore -= 10;
    } else {
      gastarScore = 50;
    }
    gastarScore = Math.max(0, Math.min(100, gastarScore));

    // 2. POUPAR (30%)
    let pouparScore = 0;
    const savingsRate = income > 0 ? (((income - totalSpent) / income) * 100) : 0;
    
    if (savingsRate >= 20) pouparScore += 50;
    else if (savingsRate > 0) pouparScore += (savingsRate / 20) * 50;

    let reserveTarget = 0;
    let reserveSaved = 0;
    let profileWorkVal = userProfile.work_profile || 'CLT';
    let suggestedMonths = 6;
    if (profileWorkVal === 'Autonomo') suggestedMonths = 12;
    else if (profileWorkVal === 'Publico') suggestedMonths = 4;
    
    const targetMonths = parseFloat(emergencyMonths.value) || suggestedMonths;
    const monthlyNeeds = parseFloat(emergencyEssentialExpenses.value) || essentialExpenses;
    reserveTarget = monthlyNeeds * targetMonths;
    
    loadedGoals.forEach(g => {
      const name = g.name.toUpperCase();
      if (name.includes('RESERVA') || name.includes('EMERGÊNCIA') || name.includes('EMERGENCIA') || name.includes('SEGURANÇA') || name.includes('SEGURANCA')) {
        reserveSaved += parseFloat(g.current_amount || 0);
      }
    });

    if (reserveTarget > 0) {
      pouparScore += Math.min(50, (reserveSaved / reserveTarget) * 50);
    } else {
      pouparScore += 25;
    }
    pouparScore = Math.max(0, Math.min(100, pouparScore));

    // 3. DEVER (20%)
    let deverScore = 100;
    if (loadedDebts.length > 0) {
      let totalMinimums = 0;
      let totalDebtBalance = 0;
      loadedDebts.forEach(d => {
        totalMinimums += parseFloat(d.minimum_payment || 0);
        totalDebtBalance += parseFloat(d.balance || 0);
      });
      
      const dti = income > 0 ? (totalMinimums / income) * 100 : 50;
      if (dti >= 36) {
        deverScore = 20;
      } else if (dti > 15) {
        deverScore = 100 - ((dti - 15) * 3);
      }
      if (income > 0) {
        const debtToIncomeRatio = totalDebtBalance / income;
        if (debtToIncomeRatio > 3) deverScore -= 20;
      }
    }
    deverScore = Math.max(0, Math.min(100, deverScore));

    // 4. PLANEJAR (20%)
    let planejarScore = 20;
    if (loadedGoals.length > 0) {
      planejarScore += 30;
      let totalProgress = 0;
      loadedGoals.forEach(g => {
        const target = parseFloat(g.target_amount) || 1;
        const current = parseFloat(g.current_amount) || 0;
        totalProgress += Math.min(100, (current / target) * 100);
      });
      planejarScore += (totalProgress / loadedGoals.length) * 0.5;
    }
    planejarScore = Math.max(0, Math.min(100, planejarScore));

    const finalScore = Math.round(
      (gastarScore * 0.3) + 
      (pouparScore * 0.3) + 
      (deverScore * 0.2) + 
      (planejarScore * 0.2)
    );

    if (scoreValue) scoreValue.textContent = `${finalScore}/100`;
    if (scoreCenterText) scoreCenterText.textContent = finalScore;

    if (scoreGauge) {
      const offset = 188.4 - (finalScore / 100) * 188.4;
      scoreGauge.style.strokeDashoffset = offset;
    }

    let status = 'Estável';
    let color = 'var(--accent-amber)';
    let descText = 'Sua saúde financeira está estável, mas possui margem para melhoria. Comece a criar mais metas e reduza desejos.';
    
    if (finalScore >= 80) {
      status = 'Saudável';
      color = 'var(--accent-emerald)';
      descText = 'Parabéns! Suas finanças estão sob controle. Você mantém um baixo Burn Rate e economiza regularmente.';
    } else if (finalScore >= 60) {
      status = 'Estável';
      color = 'var(--accent-amber)';
      descText = 'Sua situação é estável. Cuidado com despesas acessórias e garanta a quitação regular de dívidas se houver.';
    } else if (finalScore >= 40) {
      status = 'Atenção';
      color = 'var(--accent-orange)';
      descText = 'Atenção: seus custos fixos ou dívidas estão consumindo grande parte da sua renda. Evite novos gastos.';
    } else {
      status = 'Crítico';
      color = 'var(--accent-pink)';
      descText = 'Alerta: situação financeira crítica. Recomendamos rever todos os seus custos de desejos e acelerar a quitação de dívidas.';
    }

    if (scoreBadge) {
      scoreBadge.textContent = status;
      scoreBadge.style.backgroundColor = color;
    }
    if (scoreText) scoreText.textContent = descText;
  }

  // --- EMERGENCY FUND ---
  function calculateEmergencyFund() {
    const profileWorkVal = userProfile.work_profile || 'CLT';
    let suggestedMonths = 6;
    if (profileWorkVal === 'Autonomo') suggestedMonths = 12;
    else if (profileWorkVal === 'Publico') suggestedMonths = 4;

    if (emergencySuggestedLabel) {
      emergencySuggestedLabel.textContent = `Sugerido: ${suggestedMonths} meses (${profileWorkVal})`;
    }

    const filteredTxs = getFilteredTransactions();
    let autoEssentialSum = 0;
    filteredTxs.forEach(tx => {
      const block = tx.budget_block || categoryToBlockMap[tx.actual_category || tx.expected_category] || 'Necessidade';
      if (block === 'Necessidade' && tx.amount < 0 && !tx.exclude_from_dash && !isTransferOrCardPayment(tx)) {
        autoEssentialSum += Math.abs(tx.amount);
      }
    });

    if (emergencyEssentialExpenses && !emergencyEssentialExpenses.value) {
      emergencyEssentialExpenses.value = autoEssentialSum.toFixed(2);
    }

    const essentialExpenses = parseFloat(emergencyEssentialExpenses ? emergencyEssentialExpenses.value : 0) || 0;
    const monthsOfCover = parseFloat(emergencyMonths ? emergencyMonths.value : suggestedMonths) || suggestedMonths;
    const targetValue = essentialExpenses * monthsOfCover;
    if (emergencyTargetValue) emergencyTargetValue.textContent = formatCurrency(targetValue);

    let savedValue = 0;
    loadedGoals.forEach(g => {
      const name = g.name.toUpperCase();
      if (name.includes('RESERVA') || name.includes('EMERGÊNCIA') || name.includes('EMERGENCIA') || name.includes('SEGURANÇA') || name.includes('SEGURANCA')) {
        savedValue += parseFloat(g.current_amount || 0);
      }
    });

    if (emergencySavedValue) emergencySavedValue.textContent = formatCurrency(savedValue);

    const pct = targetValue > 0 ? Math.min((savedValue / targetValue) * 100, 100) : 0;
    if (emergencyProgressBar) emergencyProgressBar.style.width = `${pct}%`;
    if (emergencyPctLabel) emergencyPctLabel.textContent = `${pct.toFixed(0)}% concluído`;

    const monthsCovered = essentialExpenses > 0 ? (savedValue / essentialExpenses).toFixed(1) : '0.0';
    if (emergencyMonthsCovered) emergencyMonthsCovered.textContent = `${monthsCovered} de ${monthsOfCover} meses cobertos`;
  }

  // --- DEBTS MANAGEMENT & SIMULATION ---
  function renderDebts() {
    if (!debtsList) return;
    debtsList.innerHTML = '';
    if (loadedDebts.length === 0) {
      debtsList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 20px 0;">Nenhuma dívida cadastrada. Clique em "+ Adicionar Dívida" acima.</p>`;
      calculateDebtSimulations();
      return;
    }

    loadedDebts.forEach(d => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.flexDirection = 'column';
      item.style.gap = '8px';
      item.style.background = 'rgba(255, 255, 255, 0.02)';
      item.style.padding = '16px';
      item.style.borderRadius = '12px';
      item.style.border = '1px solid var(--border-color)';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #ffffff; font-size: 14px;">${d.name}</strong>
            <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">Juros: ${d.interest_rate}% a.m.</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-edit-debt btn btn-secondary btn-sm" data-id="${d.id}" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Editar</button>
            <button class="btn-delete-debt btn btn-danger btn-sm" data-id="${d.id}" style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.25); color: #ef4444; cursor: pointer;">Excluir</button>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-top: 4px;">
          <span style="color: var(--text-muted);">Devedor: <strong style="color: #ffffff;">${formatCurrency(d.balance)}</strong></span>
          <span style="color: var(--text-muted);">Mínimo: <strong style="color: #ffffff;">${formatCurrency(d.minimum_payment)}</strong></span>
        </div>
      `;

      item.querySelector('.btn-edit-debt').addEventListener('click', () => {
        debtIdVal.value = d.id;
        debtName.value = d.name;
        debtBalance.value = d.balance;
        debtRate.value = d.interest_rate;
        debtPayment.value = d.minimum_payment;
        if (document.getElementById('debt-modal-title')) {
          document.getElementById('debt-modal-title').textContent = 'Editar Dívida';
        }
        debtModal.style.display = 'flex';
      });

      item.querySelector('.btn-delete-debt').addEventListener('click', async () => {
        if (confirm(`Deseja excluir a dívida "${d.name}"?`)) {
          try {
            const res = await fetch(`/api/debts/${d.id}`, { method: 'DELETE' });
            if (res.ok) {
              loadedDebts = await res.json();
              renderDebts();
            }
          } catch (err) {
            console.error(err);
          }
        }
      });

      debtsList.appendChild(item);
    });

    calculateDebtSimulations();
  }

  function calculateDebtSimulations() {
    if (!debtSimulationResults) return;
    if (loadedDebts.length === 0) {
      debtSimulationResults.innerHTML = `<p style="font-size: 12px; color: var(--text-muted); text-align: center; margin: 30px 0;">Cadastre suas dívidas para ver a simulação das estratégias.</p>`;
      return;
    }

    const extra = parseFloat(debtExtraBudget ? debtExtraBudget.value : 0) || 0;
    
    // Avalanche
    const avalancheDebts = loadedDebts.map(d => ({ ...d })).sort((a, b) => b.interest_rate - a.interest_rate);
    const avalancheResult = simulatePayoff(avalancheDebts, extra);

    // Snowball
    const snowballDebts = loadedDebts.map(d => ({ ...d })).sort((a, b) => a.balance - b.balance);
    const snowballResult = simulatePayoff(snowballDebts, extra);

    const interestSaved = Math.max(0, snowballResult.totalInterest - avalancheResult.totalInterest);
    const monthsSaved = Math.max(0, snowballResult.months - avalancheResult.months);

    let comparisonHtml = '';
    if (avalancheResult.impossible || snowballResult.impossible) {
      comparisonHtml = `
        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 12px; padding: 16px; font-size: 12px; color: var(--accent-pink); line-height: 1.5;">
          <strong>Aviso:</strong> O pagamento extra mensal mais as parcelas mínimas não são suficientes para cobrir os juros acumulados das dívidas. Aumente o valor extra mensal para simular com sucesso.
        </div>
      `;
    } else {
      comparisonHtml = `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--accent-indigo); font-size: 13px;">Método Avalanche (Foco em Juros)</strong>
            <span style="font-size: 10px; background: rgba(99, 102, 241, 0.1); color: var(--accent-indigo); padding: 2px 6px; border-radius: 4px; font-weight: 700;">ECONÔMICO</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; margin-top: 4px;">
            <div>
              <span style="color: var(--text-muted); display: block;">Tempo de Quitação:</span>
              <strong style="color: #ffffff; font-size: 16px;">${avalancheResult.months} meses</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block;">Total Pago em Juros:</span>
              <strong style="color: var(--accent-pink); font-size: 16px;">${formatCurrency(avalancheResult.totalInterest)}</strong>
            </div>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; border-top: 1px solid var(--border-color); padding-top: 8px;">
            Ordem de Foco: ${avalancheResult.order.join(' → ')}
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: var(--accent-pink); font-size: 13px;">Método Bola de Neve (Foco em Motivação)</strong>
            <span style="font-size: 10px; background: rgba(236, 72, 153, 0.1); color: var(--accent-pink); padding: 2px 6px; border-radius: 4px; font-weight: 700;">VITÓRIAS RÁPIDAS</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px; margin-top: 4px;">
            <div>
              <span style="color: var(--text-muted); display: block;">Tempo de Quitação:</span>
              <strong style="color: #ffffff; font-size: 16px;">${snowballResult.months} meses</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block;">Total Pago em Juros:</span>
              <strong style="color: var(--accent-pink); font-size: 16px;">${formatCurrency(snowballResult.totalInterest)}</strong>
            </div>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; border-top: 1px solid var(--border-color); padding-top: 8px;">
            Ordem de Foco: ${snowballResult.order.join(' → ')}
          </div>
        </div>

        <div style="background: rgba(34, 197, 94, 0.03); border: 1px solid rgba(34, 197, 94, 0.15); border-radius: 12px; padding: 14px; font-size: 12px; line-height: 1.4; color: var(--accent-emerald);">
          <strong>💡 Análise Comparativa:</strong><br>
          ${
            interestSaved > 0 
            ? `O método <strong>Avalanche</strong> economiza <strong>${formatCurrency(interestSaved)}</strong> em juros acumulados e quita as dívidas <strong>${monthsSaved} meses</strong> antes que o método Bola de Neve.`
            : `Ambos os métodos possuem desempenhos parecidos devido ao perfil das dívidas. Escolha Bola de Neve se precisar de motivação inicial!`
          }
        </div>
      `;
    }

    debtSimulationResults.innerHTML = comparisonHtml;
  }

  function simulatePayoff(sortedDebts, extraBudget) {
    let currentDebts = sortedDebts.map(d => ({ ...d, currentBalance: d.balance }));
    let months = 0;
    let totalInterest = 0;
    const order = sortedDebts.map(d => d.name);
    
    let impossible = false;

    while (currentDebts.some(d => d.currentBalance > 0)) {
      months++;
      if (months > 240) {
        impossible = true;
        break;
      }

      let monthlyExtraPool = extraBudget;
      
      for (let i = 0; i < currentDebts.length; i++) {
        const d = currentDebts[i];
        if (d.currentBalance <= 0) continue;

        const interest = d.currentBalance * (d.interest_rate / 100);
        totalInterest += interest;
        d.currentBalance += interest;

        const payAmount = Math.min(d.currentBalance, d.minimum_payment);
        d.currentBalance -= payAmount;
        
        if (interest > d.minimum_payment && d.currentBalance > d.balance * 2) {
          impossible = true;
        }
      }

      if (impossible) break;

      for (let i = 0; i < currentDebts.length; i++) {
        const d = currentDebts[i];
        if (d.currentBalance <= 0) continue;

        const extraPay = Math.min(d.currentBalance, monthlyExtraPool);
        d.currentBalance -= extraPay;
        monthlyExtraPool -= extraPay;

        if (monthlyExtraPool <= 0) break;
      }
    }

    return {
      months,
      totalInterest,
      order,
      impossible
    };
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
