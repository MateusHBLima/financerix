require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

let pool = null;
let useDbFallback = true;
let inMemoryTransactions = [];
let dbInitPromise = null;

// Try to initialize PostgreSQL pool if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });
    
    useDbFallback = false;
    
    // Create a promise for table verification to prevent race conditions in serverless functions
    dbInitPromise = (async () => {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            date VARCHAR(10) NOT NULL,
            description VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            expected_category VARCHAR(100) NOT NULL,
            actual_category VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Pendente'
          );

          CREATE TABLE IF NOT EXISTS goals (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            target_amount DECIMAL(10, 2) NOT NULL,
            current_amount DECIMAL(10, 2) DEFAULT 0.00,
            target_date VARCHAR(10)
          );

          CREATE TABLE IF NOT EXISTS budgets (
            id SERIAL PRIMARY KEY,
            category VARCHAR(100) NOT NULL UNIQUE,
            limit_amount DECIMAL(10, 2) NOT NULL
          );

          CREATE TABLE IF NOT EXISTS recurring_bills (
            id SERIAL PRIMARY KEY,
            description VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            due_day INT NOT NULL,
            type VARCHAR(50) NOT NULL
          );
        `);
        console.log('Tables "transactions", "goals", "budgets" and "recurring_bills" ensured in PostgreSQL database.');
      } catch (err) {
        console.error('Error creating/verifying database tables:', err.message);
        useDbFallback = true; // Fallback if table creation failed
      }
    })();
  } catch (error) {
    console.warn('Warning: Failed to initialize PostgreSQL Pool. Falling back to in-memory storage.', error.message);
    useDbFallback = true;
  }
} else {
  console.warn('Warning: DATABASE_URL not configured. Falling back to in-memory storage.');
  useDbFallback = true;
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Helper to make HTTPS requests using native Node.js
function requestHttps(url, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Call Gemini 2.5 API
async function callGemini(apiKey, prompt, systemInstruction = null) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const headers = { 'Content-Type': 'application/json' };
  
  const contents = [{ parts: [{ text: prompt }] }];
  const body = {
    contents,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };
  
  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const res = await requestHttps(url, 'POST', headers, body);
  if (res.statusCode !== 200) {
    throw new Error(`Gemini API error (Status ${res.statusCode}): ${res.body}`);
  }
  
  const parsed = JSON.parse(res.body);
  const text = parsed.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

// Call Gemini 2.5 API with Google Search grounding
async function callGeminiWithSearch(apiKey, prompt, systemInstruction = null) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const headers = { 'Content-Type': 'application/json' };
  
  const contents = [{ parts: [{ text: prompt }] }];
  const body = {
    contents,
    generationConfig: {
      temperature: 0.1
    },
    tools: [
      {
        google_search: {}
      }
    ]
  };
  
  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const res = await requestHttps(url, 'POST', headers, body);
  if (res.statusCode !== 200) {
    throw new Error(`Gemini API error (Status ${res.statusCode}): ${res.body}`);
  }
  
  const parsed = JSON.parse(res.body);
  const text = parsed.candidates[0].content.parts[0].text;
  
  // Extract search queries if available in groundingMetadata
  let searchQueries = [];
  try {
    if (parsed.candidates[0].groundingMetadata && parsed.candidates[0].groundingMetadata.webSearchQueries) {
      searchQueries = parsed.candidates[0].groundingMetadata.webSearchQueries;
    }
  } catch (e) {}

  // Parse JSON manually from the text since responseMimeType is not json
  let results = null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      results = JSON.parse(jsonMatch[0]);
    } else {
      results = JSON.parse(text);
    }
  } catch (err) {
    throw new Error("Failed to parse JSON from Gemini Search Grounding response: " + err.message + "\nRaw response: " + text);
  }

  return {
    results: results,
    searchQueries: searchQueries
  };
}

// Call OpenAI Chat Completion API
async function callOpenAI(apiKey, prompt, systemPrompt = null) {
  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });
  
  const body = {
    model: 'gpt-4o-mini',
    messages: messages,
    temperature: 0.1,
    response_format: { type: "json_object" }
  };

  const res = await requestHttps(url, 'POST', headers, body);
  if (res.statusCode !== 200) {
    throw new Error(`OpenAI API error (Status ${res.statusCode}): ${res.body}`);
  }
  
  const parsed = JSON.parse(res.body);
  const text = parsed.choices[0].message.content;
  return JSON.parse(text);
}

// Call Anthropic Messages API
async function callAnthropic(apiKey, prompt, systemPrompt = null) {
  const url = 'https://api.anthropic.com/v1/messages';
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01'
  };
  
  const body = {
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1
  };
  
  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const res = await requestHttps(url, 'POST', headers, body);
  if (res.statusCode !== 200) {
    throw new Error(`Anthropic API error (Status ${res.statusCode}): ${res.body}`);
  }
  
  const parsed = JSON.parse(res.body);
  const text = parsed.content[0].text;
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error("Failed to parse JSON from Claude response");
}

// Search web using SerpAPI
async function searchWeb(apiKey, query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://serpapi.com/search.json?q=${encodedQuery}&api_key=${apiKey}&engine=google&num=3`;
  
  const res = await requestHttps(url, 'GET', {}, null);
  if (res.statusCode !== 200) {
    throw new Error(`SerpAPI error (Status ${res.statusCode}): ${res.body}`);
  }
  
  const parsed = JSON.parse(res.body);
  const results = parsed.organic_results || [];
  
  const snippets = results.map((r, i) => `${i+1}. Title: ${r.title}. Snippet: ${r.snippet}`).join('\n');
  return snippets || 'Nenhum resultado de pesquisa encontrado no Google.';
}

// Initialize inMemoryTransactions
inMemoryTransactions = [];

// Local regex rules for Heuristic classification
const LOCAL_REGEXES = {
  'UBER': 'Transporte',
  '99APP': 'Transporte',
  'CABIFY': 'Transporte',
  'IFOOD': 'Alimentação',
  'RESTAURANTE': 'Alimentação',
  'PADARIA': 'Alimentação',
  'BOULANGERIE': 'Alimentação',
  'NETFLIX': 'Assinaturas & Serviços',
  'SPOTIFY': 'Assinaturas & Serviços',
  'YOUTUBE PREMIUM': 'Assinaturas & Serviços',
  'SUPERMERCADO': 'Supermercado',
  'MERCADO': 'Supermercado',
  'CARREFOUR': 'Supermercado',
  'MERCADOLIVRE': 'Compras',
  'AMZN': 'Compras',
  'AMAZON': 'Compras',
  'POSTO': 'Combustível',
  'AUTO': 'Combustível',
  'GAS': 'Combustível',
  'IPIRANGA': 'Combustível',
  'SHELL': 'Combustível',
  'CLINICA': 'Saúde',
  'DRA': 'Saúde',
  'DR': 'Saúde',
  'CARDIO': 'Saúde',
  'DENTISTA': 'Saúde',
  'FARMACIA': 'Saúde',
  'SALARIO': 'Receitas',
  'CINE': 'Lazer & Entretenimento',
  'CINEMA': 'Lazer & Entretenimento',
  'SHOW': 'Lazer & Entretenimento',
  'PIX': 'Transferências'
};

// Route to get transactions
app.get('/api/transactions', async (req, res) => {
  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      let result = await pool.query('SELECT * FROM transactions ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database query failed. Falling back to in-memory transactions.', err.message);
    }
  }
  
  res.json(inMemoryTransactions);
});

// Route to save transactions (overwrite existing)
app.post('/api/transactions', async (req, res) => {
  const transactions = req.body;
  if (!Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Data must be a JSON array of transactions.' });
  }

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query('DELETE FROM transactions');
      for (const tx of transactions) {
        await pool.query(
          'INSERT INTO transactions (date, description, amount, expected_category, actual_category, status) VALUES ($1, $2, $3, $4, $5, $6)',
          [tx.date, tx.description, tx.amount, tx.expected_category, tx.actual_category || null, tx.status || 'Pendente']
        );
      }
      const result = await pool.query('SELECT * FROM transactions ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Failed to save to database. Falling back to in-memory.', err.message);
    }
  }

  inMemoryTransactions = transactions.map((tx, idx) => ({
    ...tx,
    id: tx.id || (idx + 1),
    status: tx.status || 'Pendente'
  }));
  res.json(inMemoryTransactions);
});

// Route to clear transactions
app.post('/api/transactions/clear', async (req, res) => {
  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query('DELETE FROM transactions');
      return res.json({ message: 'Database transactions cleared successfully.' });
    } catch (err) {
      console.warn('Warning: Database clear failed. Falling back to in-memory.', err.message);
    }
  }

  inMemoryTransactions = [];
  res.json({ message: 'In-memory transactions cleared successfully.' });
});

// ----------------------------------------------------
// V2 ENDPOINTS: RECATEGORIZAÇÃO, GOALS, BUDGETS, RECURRING
// ----------------------------------------------------

// Route to manually recategorize a transaction
app.put('/api/transactions/:id/category', async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;
  
  if (!category) {
    return res.status(400).json({ error: 'Category is required.' });
  }

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query(
        'UPDATE transactions SET actual_category = $1, status = $2 WHERE id = $3',
        [category, 'Processado', id]
      );
      const result = await pool.query('SELECT * FROM transactions ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database update failed. Falling back to in-memory.', err.message);
    }
  }

  // Fallback in-memory
  const tx = inMemoryTransactions.find(t => t.id === parseInt(id));
  if (tx) {
    tx.actual_category = category;
    tx.status = 'Processado';
  }
  res.json(inMemoryTransactions);
});

// --- GOALS (Caixinhas) ---
let inMemoryGoals = [];

app.get('/api/goals', async (req, res) => {
  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      const result = await pool.query('SELECT * FROM goals ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database goals query failed. Falling back to in-memory.', err.message);
    }
  }
  res.json(inMemoryGoals);
});

app.post('/api/goals', async (req, res) => {
  const { name, target_amount, target_date } = req.body;
  if (!name || !target_amount) {
    return res.status(400).json({ error: 'Name and target_amount are required.' });
  }

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query(
        'INSERT INTO goals (name, target_amount, current_amount, target_date) VALUES ($1, $2, 0.00, $3)',
        [name, target_amount, target_date || null]
      );
      const result = await pool.query('SELECT * FROM goals ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database goal insert failed. Falling back to in-memory.', err.message);
    }
  }

  // Fallback in-memory
  const newGoal = {
    id: inMemoryGoals.length > 0 ? Math.max(...inMemoryGoals.map(g => g.id)) + 1 : 1,
    name,
    target_amount: parseFloat(target_amount),
    current_amount: 0.00,
    target_date: target_date || null
  };
  inMemoryGoals.push(newGoal);
  res.json(inMemoryGoals);
});

app.put('/api/goals/:id', async (req, res) => {
  const { id } = req.params;
  const { current_amount, name, target_amount, target_date } = req.body;

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      if (current_amount !== undefined) {
        await pool.query('UPDATE goals SET current_amount = $1 WHERE id = $2', [current_amount, id]);
      } else {
        await pool.query(
          'UPDATE goals SET name = $1, target_amount = $2, target_date = $3 WHERE id = $4',
          [name, target_amount, target_date || null, id]
        );
      }
      const result = await pool.query('SELECT * FROM goals ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database goal update failed. Falling back to in-memory.', err.message);
    }
  }

  // Fallback in-memory
  const goal = inMemoryGoals.find(g => g.id === parseInt(id));
  if (goal) {
    if (current_amount !== undefined) {
      goal.current_amount = parseFloat(current_amount);
    } else {
      if (name) goal.name = name;
      if (target_amount) goal.target_amount = parseFloat(target_amount);
      if (target_date !== undefined) goal.target_date = target_date;
    }
  }
  res.json(inMemoryGoals);
});

app.delete('/api/goals/:id', async (req, res) => {
  const { id } = req.params;

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query('DELETE FROM goals WHERE id = $1', [id]);
      const result = await pool.query('SELECT * FROM goals ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database goal delete failed. Falling back to in-memory.', err.message);
    }
  }

  // Fallback in-memory
  inMemoryGoals = inMemoryGoals.filter(g => g.id !== parseInt(id));
  res.json(inMemoryGoals);
});

// --- BUDGETS (Orçamentos) ---
let inMemoryBudgets = [];

app.get('/api/budgets', async (req, res) => {
  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      const result = await pool.query('SELECT * FROM budgets ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database budgets query failed. Falling back to in-memory.', err.message);
    }
  }
  res.json(inMemoryBudgets);
});

app.post('/api/budgets', async (req, res) => {
  const { category, limit_amount } = req.body;
  if (!category || limit_amount === undefined) {
    return res.status(400).json({ error: 'Category and limit_amount are required.' });
  }

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query(
        'INSERT INTO budgets (category, limit_amount) VALUES ($1, $2) ON CONFLICT (category) DO UPDATE SET limit_amount = EXCLUDED.limit_amount',
        [category, limit_amount]
      );
      const result = await pool.query('SELECT * FROM budgets ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database budget save failed. Falling back to in-memory.', err.message);
    }
  }

  // Fallback in-memory
  const existing = inMemoryBudgets.find(b => b.category === category);
  if (existing) {
    existing.limit_amount = parseFloat(limit_amount);
  } else {
    inMemoryBudgets.push({
      id: inMemoryBudgets.length > 0 ? Math.max(...inMemoryBudgets.map(b => b.id)) + 1 : 1,
      category,
      limit_amount: parseFloat(limit_amount)
    });
  }
  res.json(inMemoryBudgets);
});

app.delete('/api/budgets/:id', async (req, res) => {
  const { id } = req.params;

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query('DELETE FROM budgets WHERE id = $1', [id]);
      const result = await pool.query('SELECT * FROM budgets ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database budget delete failed. Falling back to in-memory.', err.message);
    }
  }

  // Fallback in-memory
  inMemoryBudgets = inMemoryBudgets.filter(b => b.id !== parseInt(id));
  res.json(inMemoryBudgets);
});

// --- RECURRING BILLS (Contas Recorrentes) ---
let inMemoryRecurring = [];

app.get('/api/recurring', async (req, res) => {
  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      const result = await pool.query('SELECT * FROM recurring_bills ORDER BY due_day ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database recurring bills query failed. Falling back to in-memory.', err.message);
    }
  }
  res.json(inMemoryRecurring);
});

app.post('/api/recurring', async (req, res) => {
  const { description, amount, due_day, type } = req.body;
  if (!description || amount === undefined || !due_day || !type) {
    return res.status(400).json({ error: 'Description, amount, due_day and type are required.' });
  }

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query(
        'INSERT INTO recurring_bills (description, amount, due_day, type) VALUES ($1, $2, $3, $4)',
        [description, amount, due_day, type]
      );
      const result = await pool.query('SELECT * FROM recurring_bills ORDER BY due_day ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database recurring insert failed. Falling back to in-memory.', err.message);
    }
  }

  // Fallback in-memory
  const newRec = {
    id: inMemoryRecurring.length > 0 ? Math.max(...inMemoryRecurring.map(r => r.id)) + 1 : 1,
    description,
    amount: parseFloat(amount),
    due_day: parseInt(due_day),
    type
  };
  inMemoryRecurring.push(newRec);
  res.json(inMemoryRecurring);
});

app.delete('/api/recurring/:id', async (req, res) => {
  const { id } = req.params;

  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      await pool.query('DELETE FROM recurring_bills WHERE id = $1', [id]);
      const result = await pool.query('SELECT * FROM recurring_bills ORDER BY due_day ASC');
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database recurring delete failed. Falling back to in-memory.', err.message);
    }
  }

  // Fallback in-memory
  inMemoryRecurring = inMemoryRecurring.filter(r => r.id !== parseInt(id));
  res.json(inMemoryRecurring);
});

// Route to run categorization benchmark
app.post('/api/categorize', async (req, res) => {
  const { transactions } = req.body;
  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Lista de transações inválida.' });
  }

  // Get key from request headers or process.env
  const geminiKey = req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || null;
  const isRealAiMode = !!geminiKey;

  const categoriesList = '[Alimentação, Transporte, Assinaturas & Serviços, Supermercado, Compras, Combustível, Saúde, Receitas, Transferências, Lazer & Entretenimento, Outros]';
  const prompt = `
    Você é um assistente financeiro de IA especializado na categorização de extratos de cartões de crédito e extratos bancários no mercado brasileiro.
    Analise a descrição de cada transação abaixo e atribua a categoria correta estritamente dentre as seguintes opções:
    ${categoriesList}

    Transações:
    ${JSON.stringify(transactions.map(t => ({ id: t.id, description: t.description })))}

    Responda EXCLUSIVAMENTE em formato JSON puro, contendo um objeto com a chave "results", que é uma lista de objetos contendo "id" e "category". Exemplo de saída:
    {
      "results": [
        { "id": 1, "category": "Transporte" }
      ]
    }
  `;

  const results = [];
  
  if (isRealAiMode) {
    try {
      console.log(`Sending ${transactions.length} transactions to Gemini for categorization...`);
      const sysInstruction = `Você categoriza extratos. Retorne estritamente JSON. Escolha entre: ${categoriesList}`;
      const aiResponse = await callGemini(geminiKey, prompt, sysInstruction);
      
      const aiMap = {};
      if (aiResponse && aiResponse.results) {
        aiResponse.results.forEach(r => { aiMap[r.id] = r.category; });
      }

      transactions.forEach(tx => {
        const category = aiMap[tx.id] || 'Outros';
        results.push({
          ...tx,
          actual_category: category,
          status: 'Processado'
        });
      });
    } catch (e) {
      console.error('Gemini categorization failed, falling back to local heuristic...', e.message);
      // Fallback below
    }
  }

  // If fallback is needed (not in AI mode or AI call failed)
  if (results.length === 0) {
    console.log('Running heuristic regex categorization fallback...');
    transactions.forEach(tx => {
      let category = 'Outros';
      const matchKey = Object.keys(LOCAL_REGEXES)
        .sort((a, b) => b.length - a.length)
        .find(k => new RegExp('\\b' + k, 'i').test(tx.description));
      if (matchKey) {
        category = LOCAL_REGEXES[matchKey];
      }
      
      results.push({
        ...tx,
        actual_category: category,
        status: 'Processado'
      });
    });
  }

  // Persist categorizations in the database
  if (!useDbFallback && pool) {
    try {
      if (dbInitPromise) await dbInitPromise;
      for (const tx of results) {
        await pool.query(
          'UPDATE transactions SET actual_category = $1, status = $2 WHERE id = $3',
          [tx.actual_category, 'Processado', tx.id]
        );
      }
      console.log('Saved categorizations to the database.');
    } catch (err) {
      console.warn('Warning: Failed to save categorizations to database.', err.message);
    }
  }

  // Also update the in-memory array for fallback consistency
  results.forEach(tx => {
    const localTx = inMemoryTransactions.find(t => t.id === tx.id);
    if (localTx) {
      localTx.actual_category = tx.actual_category;
      localTx.status = 'Processado';
    }
  });

  res.json(results);
});

// Heuristic local statement parser
function parseStatementLocally(text) {
  const transactions = [];
  const lines = text.split('\n');
  let currentId = 1;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Match DD/MM/YYYY, DD/MM/YY, DD/MM, DD-MM-YYYY, YYYY-MM-DD
    const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b|\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/;
    const dateMatch = line.match(dateRegex);
    if (!dateMatch) continue;

    let dateStr = "";
    if (dateMatch[4]) {
      const y = dateMatch[4];
      const m = dateMatch[5].padStart(2, '0');
      const d = dateMatch[6].padStart(2, '0');
      dateStr = `${y}-${m}-${d}`;
    } else {
      const d = dateMatch[1].padStart(2, '0');
      const m = dateMatch[2].padStart(2, '0');
      let y = dateMatch[3] || '2026';
      if (y.length === 2) y = '20' + y;
      dateStr = `${y}-${m}-${d}`;
    }

    let remaining = line.replace(dateMatch[0], '').trim();

    // Matches numbers like -1.200,50, -89.50, 5400,00, R$ -42,00, -R$ 79,90, 15,90-
    const amountRegex = /(-?\s*(?:R\$\s*)?-?\d+(?:\.\d{3})*(?:,\d{2})\b)|(-?\s*(?:R\$\s*)?-?\d+(?:\,\d{3})*(?:\.\d{2})\b)|(-?\s*(?:R\$\s*)?-?\d+,\d{2}\b)|(-?\s*(?:R\$\s*)?-?\d+\.\d{2}\b)/g;
    const matches = [...remaining.matchAll(amountRegex)];
    if (matches.length === 0) continue;

    const bestMatch = matches[matches.length - 1][0];
    remaining = remaining.replace(bestMatch, '').trim();

    let cleanAmountStr = bestMatch.replace(/R\$/g, '').replace(/\s/g, '');
    let isNegative = cleanAmountStr.includes('-');
    cleanAmountStr = cleanAmountStr.replace(/-/g, '');

    let amountVal = 0;
    if (cleanAmountStr.includes(',') && cleanAmountStr.includes('.')) {
      if (cleanAmountStr.indexOf('.') < cleanAmountStr.indexOf(',')) {
        cleanAmountStr = cleanAmountStr.replace(/\./g, '').replace(/,/g, '.');
      } else {
        cleanAmountStr = cleanAmountStr.replace(/,/g, '');
      }
    } else if (cleanAmountStr.includes(',')) {
      cleanAmountStr = cleanAmountStr.replace(/,/g, '.');
    }

    amountVal = parseFloat(cleanAmountStr);
    if (isNaN(amountVal)) continue;
    if (isNegative) amountVal = -amountVal;

    let description = remaining
      .replace(/^[\s\-*\:]+/, '')
      .replace(/[\s\-*\:]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!description) {
      description = "Transação Sem Nome";
    }

    let expectedCategory = 'Outros';
    const matchKey = Object.keys(LOCAL_REGEXES)
      .sort((a, b) => b.length - a.length)
      .find(k => new RegExp('\\b' + k, 'i').test(description));
    if (matchKey) {
      expectedCategory = LOCAL_REGEXES[matchKey];
    }

    transactions.push({
      id: currentId++,
      date: dateStr,
      description: description,
      amount: amountVal,
      expected_category: expectedCategory
    });
  }

  return transactions;
}

app.post('/api/parse-statement', async (req, res) => {
  const { text } = req.body;
  const apiKey = req.headers['x-gemini-key'] || null;

  if (!text) {
    return res.status(400).json({ error: 'Nenhum texto de extrato fornecido.' });
  }

  // Fallback to local heuristic parser if no Gemini API Key is configured
  if (!apiKey) {
    console.log('Gemini API key not configured. Processing statement locally using regex heuristics...');
    try {
      const transactions = parseStatementLocally(text);
      if (transactions.length === 0) {
        return res.status(400).json({ error: 'Nenhuma transação foi identificada no texto pelo leitor local.' });
      }
      return res.json(transactions);
    } catch (err) {
      return res.status(500).json({ error: 'Erro no processador local: ' + err.message });
    }
  }

  try {
    const systemInstruction = `
      Você é um assistente financeiro especialista em estruturação de extratos bancários e faturas de cartão de crédito do mercado brasileiro.
      Analise o texto bruto fornecido (que pode vir de PDFs, CSVs ou texto colado) e extraia todas as transações individuais encontradas.
      
      Regras de extração:
      1. data (date): Converta a data da transação para o formato ISO YYYY-MM-DD (use o ano atual 2026 se não for especificado).
      2. descrição (description): Limpe o nome do estabelecimento de forma legível e amigável. Remova marcas de cartão (ex: "•••• 5496", "4321"), códigos de transação, asteriscos e pontilhados. Exemplo: "•••• 5496 Apple.com/Bill" deve virar apenas "Apple.com/Bill".
      3. valor (amount): O valor da transação como um número decimal. Despesas/Débitos devem ser valores NEGATIVOS. Receitas/Créditos/Estornos devem ser valores POSITIVOS.
      4. expected_category: Adicione um palpite de categoria apropriado com base nas opções: [Alimentação, Transporte, Assinaturas & Serviços, Supermercado, Compras, Combustível, Saúde, Receitas, Transferências, Lazer & Entretenimento, Outros].
      
      Ignore linhas que descrevem resumos de faturas, limites de crédito, avisos de cobrança de fatura, ou saldos acumulados.
      
      Retorne estritamente um JSON no seguinte formato:
      {
        "transactions": [
          { "date": "2026-05-25", "description": "Apple.com/Bill", "amount": -5.90, "expected_category": "Assinaturas & Serviços" }
        ]
      }
      Não retorne nenhuma explicação ou texto fora do objeto JSON.
    `;

    const prompt = `Analise o seguinte texto bruto de extrato e extraia as transações:\n\n${text}`;
    const response = await callGemini(apiKey, prompt, systemInstruction);
    
    // Validate response format
    if (response && response.transactions && Array.isArray(response.transactions)) {
      // Map to add incremental IDs
      response.transactions.forEach((tx, idx) => {
        tx.id = idx + 1;
        if (!tx.expected_category) tx.expected_category = 'Outros';
      });
      res.json(response.transactions);
    } else {
      throw new Error("Resposta da IA não contém o formato esperado.");
    }
  } catch (error) {
    res.status(500).json({ error: 'Falha no processador agêntico do Gemini: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor Financerix rodando em http://localhost:${PORT}`);
});

module.exports = app;
