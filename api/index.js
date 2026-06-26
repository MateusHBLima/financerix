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

// Try to initialize PostgreSQL pool if DATABASE_URL is configured
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
    });
    // Test the connection
    pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.warn('Warning: PostgreSQL connection test failed. Falling back to mock data / in-memory storage.', err.message);
        useDbFallback = true;
      } else {
        console.log('PostgreSQL connection test successful. Using database persistence.');
        useDbFallback = false;
      }
    });
  } catch (error) {
    console.warn('Warning: Failed to initialize PostgreSQL Pool. Falling back to mock data / in-memory storage.', error.message);
    useDbFallback = true;
  }
} else {
  console.warn('Warning: DATABASE_URL not configured. Falling back to mock data / in-memory storage.');
  useDbFallback = true;
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));

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

// Helper to load mock transactions
function loadTransactions() {
  const filePath = path.join(__dirname, '../mock_data.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}

// Initialize inMemoryTransactions
inMemoryTransactions = loadTransactions();

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
  const isDemo = req.query.demo === 'true';
  
  if (!useDbFallback && pool) {
    try {
      if (isDemo) {
        console.log('Resetting and seeding database with mock transactions...');
        await pool.query('DELETE FROM transactions');
        const mockData = loadTransactions();
        for (const tx of mockData) {
          await pool.query(
            'INSERT INTO transactions (date, description, amount, expected_category, actual_category, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [tx.date, tx.description, tx.amount, tx.expected_category, tx.actual_category || null, tx.status || 'Pendente']
          );
        }
      }
      
      let result = await pool.query('SELECT * FROM transactions ORDER BY id ASC');
      if (result.rows.length === 0) {
        console.log('Database empty. Seeding mock transactions...');
        const mockData = loadTransactions();
        for (const tx of mockData) {
          await pool.query(
            'INSERT INTO transactions (date, description, amount, expected_category, actual_category, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [tx.date, tx.description, tx.amount, tx.expected_category, tx.actual_category || null, tx.status || 'Pendente']
          );
        }
        result = await pool.query('SELECT * FROM transactions ORDER BY id ASC');
      }
      return res.json(result.rows);
    } catch (err) {
      console.warn('Warning: Database query failed. Falling back to in-memory transactions.', err.message);
    }
  }
  
  if (isDemo || inMemoryTransactions.length === 0) {
    inMemoryTransactions = loadTransactions();
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
      await pool.query('DELETE FROM transactions');
      return res.json({ message: 'Database transactions cleared successfully.' });
    } catch (err) {
      console.warn('Warning: Database clear failed. Falling back to in-memory.', err.message);
    }
  }

  inMemoryTransactions = [];
  res.json({ message: 'In-memory transactions cleared successfully.' });
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
      const matchKey = Object.keys(LOCAL_REGEXES).find(k => 
        new RegExp('\\b' + k, 'i').test(tx.description)
      );
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

app.post('/api/parse-statement', async (req, res) => {
  const { text } = req.body;
  const apiKey = req.headers['x-gemini-key'] || null;

  if (!text) {
    return res.status(400).json({ error: 'Nenhum texto de extrato fornecido.' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'Chave de API do Gemini não configurada. Insira-a nas Configurações (ícone de engrenagem) para ativar o processador agêntico do extrato.' });
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
