const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

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
      temperature: 0.1,
      responseMimeType: "application/json"
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

  return {
    results: JSON.parse(text),
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
  const filePath = path.join(__dirname, 'mock_data.json');
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  return [];
}

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
app.get('/api/transactions', (req, res) => {
  const transactions = loadTransactions();
  res.json(transactions);
});

// Route to run categorization benchmark
app.post('/api/categorize', async (req, res) => {
  const { transactions } = req.body;
  if (!transactions || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Lista de transações inválida.' });
  }

  // Get keys from request headers
  const keys = {
    gemini: req.headers['x-gemini-key'] || null,
    serpapi: req.headers['x-serpapi-key'] || null,
    openai: req.headers['x-openai-key'] || null,
    anthropic: req.headers['x-anthropic-key'] || null
  };

  const isRealAiMode = !!keys.gemini;

  // Prompts for classification
  const categoriesList = '[Alimentação, Transporte, Assinaturas & Serviços, Supermercado, Compras, Combustível, Saúde, Receitas, Transferências, Lazer & Entretenimento, Outros]';
  const getPrompt = (txs) => `
    Você é um assistente financeiro de IA especializado na categorização de extratos de cartões de crédito e extratos bancários no mercado brasileiro.
    Analise a descrição de cada transação abaixo e atribua a categoria correta estritamente dentre as seguintes opções:
    ${categoriesList}

    Transações:
    ${JSON.stringify(txs.map(t => ({ id: t.id, description: t.description })))}

    Responda EXCLUSIVAMENTE em formato JSON puro, contendo um objeto com a chave "results", que é uma lista de objetos contendo "id" e "category". Exemplo de saída:
    {
      "results": [
        { "id": 1, "category": "Transporte" }
      ]
    }
  `;

  const runAgent = async (agentKey) => {
    const results = [];
    const logs = [];
    let correctCount = 0;
    let executionTimeMs = 0;
    let totalCost = 0;
    const start = Date.now();

    // A. Local Code Heuristic (Regex) - Always runs locally
    if (agentKey === 'local') {
      logs.push(`[Subagente Local Code] Iniciando varredura Heurística com Regex...`);
      transactions.forEach(tx => {
        let category = 'Outros';
        const matchKey = Object.keys(LOCAL_REGEXES).find(k => 
          new RegExp('\\b' + k, 'i').test(tx.description)
        );
        if (matchKey) {
          category = LOCAL_REGEXES[matchKey];
        } else {
          logs.push(`[Local Code] Falha no regex para: "${tx.description}". Definido como "Outros".`);
        }
        
        const isCorrect = category === tx.expected_category;
        if (isCorrect) correctCount++;
        results.push({ id: tx.id, description: tx.description, category, isCorrect, expected: tx.expected_category });
      });
      executionTimeMs = Date.now() - start;
      totalCost = transactions.length * 0.00001;
      const accuracy = parseFloat(((correctCount / transactions.length) * 100).toFixed(1));
      logs.push(`[Subagente Local Code] Concluído em ${executionTimeMs}ms. Acurácia: ${accuracy}%. Custo: $${totalCost.toFixed(5)}`);
      return { agentKey, name: 'Subagente Local Code (Regex)', executionTimeMs, accuracy, totalCost, results, logs };
    }

    // B. If not in real AI mode (No Gemini Key provided), fallback to mock simulation
    if (!isRealAiMode) {
      const mockProfiles = {
        claude: { name: 'Subagente Claude (Semântica)', speedMin: 400, speedMax: 700, cost: 0.0015, accuracy: 85.7 },
        gemini: { name: 'Subagente Gemini (Contexto)', speedMin: 300, speedMax: 500, cost: 0.0005, accuracy: 85.7 },
        chatgpt: { name: 'Subagente ChatGPT (Estruturado)', speedMin: 500, speedMax: 800, cost: 0.0010, accuracy: 85.7 },
        serpapi: { name: 'Subagente SerpAPI (Web Search)', speedMin: 1200, speedMax: 1800, cost: 0.0030, accuracy: 100.0 }
      };
      const profile = mockProfiles[agentKey];
      const delay = Math.floor(Math.random() * (profile.speedMax - profile.speedMin)) + profile.speedMin;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      logs.push(`[${profile.name}] (MODO DEMO) Iniciando análise com base em regras simuladas...`);
      
      // Load mock classifications
      const rules = {
        'UBER *TRIP BR': 'Transporte',
        'IFOOD *RESTAURANTE': 'Alimentação',
        'NETFLIX.COM': 'Assinaturas & Serviços',
        'SUPERMERCADO PHOENIX': 'Supermercado',
        'MERCADOLIVRE *COMPRA': 'Compras',
        'POSTO IPIRANGA GNV': 'Combustível',
        'DRA ANA CLINICA': 'Saúde',
        'PIX Recebido SALARIO': 'Receitas',
        'AMZN Mktp Br': 'Compras',
        'PIX Enviado JOAO SILVA': 'Transferências',
        'IFD*MAISSAUDAVEL': agentKey === 'serpapi' || agentKey === 'gemini' ? 'Alimentação' : 'Outros',
        'DM *CARDIOVALE': agentKey === 'serpapi' || agentKey === 'chatgpt' ? 'Saúde' : 'Outros',
        'PG *CINEART BH': agentKey === 'serpapi' || agentKey === 'claude' || agentKey === 'chatgpt' ? 'Lazer & Entretenimento' : 'Outros',
        'BOULANGERIE DU PARC': agentKey === 'serpapi' || agentKey === 'claude' || agentKey === 'gemini' ? 'Alimentação' : 'Outros'
      };

      transactions.forEach(tx => {
        const category = rules[tx.description] || 'Outros';
        let searchLog = null;
        if (agentKey === 'serpapi' && ['IFD*MAISSAUDAVEL', 'DM *CARDIOVALE', 'PG *CINEART BH', 'BOULANGERIE DU PARC'].includes(tx.description)) {
          searchLog = `Buscando na Web por "${tx.description}"... Encontrado resultado: categorizado como "${category}".`;
          logs.push(`[SerpAPI Web Search] 🔍 ${searchLog}`);
        }
        const isCorrect = category === tx.expected_category;
        if (isCorrect) correctCount++;
        results.push({ id: tx.id, description: tx.description, category, isCorrect, expected: tx.expected_category, searchLog });
      });

      executionTimeMs = delay;
      totalCost = transactions.length * profile.cost;
      const accuracy = profile.accuracy;
      logs.push(`[${profile.name}] Concluído em ${executionTimeMs}ms. Acurácia: ${accuracy}%. Custo: $${totalCost.toFixed(5)}`);
      return { agentKey, name: profile.name, executionTimeMs, accuracy, totalCost, results, logs };
    }

    // C. REAL AI MODE (Gemini Key present)
    try {
      if (agentKey === 'gemini') {
        logs.push(`[Subagente Gemini] Enviando ${transactions.length} transações para o Gemini 2.5 Flash...`);
        const sysInstruction = `Você categoriza extratos. Retorne estritamente JSON. Escolha entre: ${categoriesList}`;
        const aiResponse = await callGemini(keys.gemini, getPrompt(transactions), sysInstruction);
        
        const aiMap = {};
        if (aiResponse && aiResponse.results) {
          aiResponse.results.forEach(r => { aiMap[r.id] = r.category; });
        }

        transactions.forEach(tx => {
          const category = aiMap[tx.id] || 'Outros';
          const isCorrect = category === tx.expected_category;
          if (isCorrect) correctCount++;
          results.push({ id: tx.id, description: tx.description, category, isCorrect, expected: tx.expected_category });
        });
        executionTimeMs = Date.now() - start;
        totalCost = transactions.length * 0.00015; // Actual pricing approximation
        const accuracy = parseFloat(((correctCount / transactions.length) * 100).toFixed(1));
        logs.push(`[Subagente Gemini] Concluído em ${executionTimeMs}ms. Acurácia: ${accuracy}%. Custo: $${totalCost.toFixed(5)}`);
        return { agentKey, name: 'Subagente Gemini (Contexto)', executionTimeMs, accuracy, totalCost, results, logs };
      }

      if (agentKey === 'chatgpt') {
        let aiResponse;
        if (keys.openai) {
          logs.push(`[Subagente ChatGPT] Enviando transações para a API da OpenAI (gpt-4o-mini)...`);
          const sysPrompt = `Você categoriza extratos em JSON. Escolha estritamente entre: ${categoriesList}`;
          aiResponse = await callOpenAI(keys.openai, getPrompt(transactions), sysPrompt);
          totalCost = transactions.length * 0.00030;
        } else {
          logs.push(`[Subagente ChatGPT] ℹ️ OpenAI Key indisponível. Simulando abordagem ChatGPT usando o Gemini...`);
          const sysInstruction = `Você é o ChatGPT. Categorize as transações de forma estruturada. Escolha estritamente entre: ${categoriesList}`;
          aiResponse = await callGemini(keys.gemini, getPrompt(transactions), sysInstruction);
          totalCost = transactions.length * 0.00015;
        }
        
        const aiMap = {};
        if (aiResponse && aiResponse.results) {
          aiResponse.results.forEach(r => { aiMap[r.id] = r.category; });
        }

        transactions.forEach(tx => {
          const category = aiMap[tx.id] || 'Outros';
          const isCorrect = category === tx.expected_category;
          if (isCorrect) correctCount++;
          results.push({ id: tx.id, description: tx.description, category, isCorrect, expected: tx.expected_category });
        });
        executionTimeMs = Date.now() - start;
        const accuracy = parseFloat(((correctCount / transactions.length) * 100).toFixed(1));
        logs.push(`[Subagente ChatGPT] Concluído em ${executionTimeMs}ms. Acurácia: ${accuracy}%. Custo: $${totalCost.toFixed(5)}`);
        return { agentKey, name: 'Subagente ChatGPT (Estruturado)', executionTimeMs, accuracy, totalCost, results, logs };
      }

      if (agentKey === 'claude') {
        let aiResponse;
        if (keys.anthropic) {
          logs.push(`[Subagente Claude] Enviando transações para a API da Anthropic (claude-3-5-haiku)...`);
          const sysPrompt = `Você é o Claude. Analise com semântica rigorosa. Categorize e retorne JSON. Escolha estritamente entre: ${categoriesList}`;
          aiResponse = await callAnthropic(keys.anthropic, getPrompt(transactions), sysPrompt);
          totalCost = transactions.length * 0.00080;
        } else {
          logs.push(`[Subagente Claude] ℹ️ Anthropic Key indisponível. Simulando abordagem Claude usando o Gemini...`);
          const sysInstruction = `Você é o Claude 3.5 Sonnet. Categorize com base em lógica semântica rígida. Escolha estritamente entre: ${categoriesList}`;
          aiResponse = await callGemini(keys.gemini, getPrompt(transactions), sysInstruction);
          totalCost = transactions.length * 0.00015;
        }

        const aiMap = {};
        if (aiResponse && aiResponse.results) {
          aiResponse.results.forEach(r => { aiMap[r.id] = r.category; });
        }

        transactions.forEach(tx => {
          const category = aiMap[tx.id] || 'Outros';
          const isCorrect = category === tx.expected_category;
          if (isCorrect) correctCount++;
          results.push({ id: tx.id, description: tx.description, category, isCorrect, expected: tx.expected_category });
        });
        executionTimeMs = Date.now() - start;
        const accuracy = parseFloat(((correctCount / transactions.length) * 100).toFixed(1));
        logs.push(`[Subagente Claude] Concluído em ${executionTimeMs}ms. Acurácia: ${accuracy}%. Custo: $${totalCost.toFixed(5)}`);
        return { agentKey, name: 'Subagente Claude (Semântica)', executionTimeMs, accuracy, totalCost, results, logs };
      }

      if (agentKey === 'serpapi') {
        let name = 'Subagente SerpAPI (Web Search)';
        
        // A. NATIVE GEMINI GOOGLE SEARCH RETRIEVAL (No SerpAPI Key, but Gemini Key present)
        if (!keys.serpapi && keys.gemini) {
          name = 'Subagente Gemini (Busca Web)';
          logs.push(`[Subagente Gemini (Busca Web)] Iniciando processamento com Google Search Grounding nativo...`);
          
          let aiResponse = null;
          let searchQueries = [];
          
          try {
            logs.push(`[Gemini Busca Web] Enviando transações para o Gemini 2.5 Flash com busca web ativa...`);
            const sysInstruction = `Você é um assistente especialista. Categorize cada transação e use a ferramenta de busca do Google para obter o contexto de qualquer estabelecimento desconhecido ou abreviado. Retorne estritamente JSON. Escolha entre: ${categoriesList}`;
            const aiResult = await callGeminiWithSearch(keys.gemini, getPrompt(transactions), sysInstruction);
            aiResponse = aiResult.results;
            searchQueries = aiResult.searchQueries;
            
            if (searchQueries && searchQueries.length > 0) {
              logs.push(`[Gemini Busca Web] 🔍 Realizou buscas no Google por: ${searchQueries.join(', ')}`);
            } else {
              logs.push(`[Gemini Busca Web] Nenhuma busca no Google foi necessária.`);
            }
          } catch (err) {
            logs.push(`[Gemini Busca Web] ⚠️ Falha na chamada da API: ${err.message}`);
            throw err;
          }

          const aiMap = {};
          if (aiResponse && aiResponse.results) {
            aiResponse.results.forEach(r => { aiMap[r.id] = r.category; });
          }

          transactions.forEach(tx => {
            const category = aiMap[tx.id] || 'Outros';
            const isCorrect = category === tx.expected_category;
            if (isCorrect) correctCount++;
            
            let searchLog = null;
            if (searchQueries && searchQueries.length > 0) {
              // Mark searchLog for matched entries
              const lowerDesc = tx.description.toLowerCase();
              if (searchQueries.some(q => lowerDesc.includes(q.toLowerCase()) || q.toLowerCase().includes(lowerDesc))) {
                searchLog = `Buscado via Google Search Grounding nativo.`;
              }
            }

            results.push({ 
              id: tx.id, 
              description: tx.description, 
              category, 
              isCorrect, 
              expected: tx.expected_category,
              searchLog: searchLog
            });
          });

          executionTimeMs = Date.now() - start;
          totalCost = transactions.length * 0.00015;
          const accuracy = parseFloat(((correctCount / transactions.length) * 100).toFixed(1));
          logs.push(`[Subagente Gemini (Busca Web)] Concluído em ${executionTimeMs}ms. Acurácia: ${accuracy}%. Custo: $${totalCost.toFixed(5)}`);
          return { agentKey, name, executionTimeMs, accuracy, totalCost, results, logs };
        }

        // B. STANDARD SERPAPI WEB SEARCH (SerpAPI Key present)
        logs.push(`[Subagente SerpAPI] Iniciando processamento com Busca Web (SerpAPI)...`);
        const searchResultsContext = [];
        
        for (const tx of transactions) {
          let searchLog = null;
          let webContext = '';

          const isCryptic = !Object.keys(LOCAL_REGEXES).some(k => new RegExp('\\b' + k, 'i').test(tx.description));
          
          if (isCryptic && keys.serpapi) {
            try {
              logs.push(`[SerpAPI] 🔍 Buscando no Google por "${tx.description}"...`);
              webContext = await searchWeb(keys.serpapi, tx.description);
              searchLog = `Resultados Google coletados com sucesso.`;
              logs.push(`[SerpAPI] Sucesso! Informações da web extraídas.`);
            } catch (err) {
              logs.push(`[SerpAPI] ⚠️ Falha na busca para "${tx.description}": ${err.message}`);
              webContext = 'Erro na busca.';
            }
          } else if (isCryptic) {
            searchLog = `Simulando busca para: "${tx.description}". (SerpAPI Key ausente)`;
            logs.push(`[SerpAPI] 🔍 ${searchLog}`);
            
            const mockWebSnippets = {
              'IFD*MAISSAUDAVEL': 'iFood - Restaurante Mais Saudável Grelhados e Saladas',
              'DM *CARDIOVALE': 'Cardiovale Clínica Médica e Cardiológica Especializada',
              'PG *CINEART BH': 'Cineart Cinemas Shopping Del Rey Belo Horizonte',
              'BOULANGERIE DU PARC': 'Boulangerie du Parque Padaria e Cafeteria Francesa'
            };
            webContext = mockWebSnippets[tx.description] || 'Estabelecimento comercial no Brasil.';
          }

          searchResultsContext.push({
            id: tx.id,
            description: tx.description,
            webContext: webContext,
            searchLog: searchLog
          });
        }

        const promptWithWeb = `
          Você é um assistente financeiro especialista. Categorize cada transação abaixo.
          Desta vez, além do nome da transação, fornecemos um contexto adicional obtido através de pesquisas no Google para ajudar a identificar estabelecimentos desconhecidos ou abreviados.
          
          Categorias válidas:
          ${categoriesList}

          Transações e Contextos da Web:
          ${JSON.stringify(searchResultsContext.map(t => ({ id: t.id, description: t.description, google_context: t.webContext })))}

          Responda exclusivamente em formato JSON contendo um objeto com a chave "results", que é uma lista contendo "id" e "category". Exemplo:
          {
            "results": [
              { "id": 1, "category": "Alimentação" }
            ]
          }
        `;

        const aiResponse = await callGemini(keys.gemini, promptWithWeb, "Você categoriza transações baseado em buscas web. Retorne JSON.");
        const aiMap = {};
        if (aiResponse && aiResponse.results) {
          aiResponse.results.forEach(r => { aiMap[r.id] = r.category; });
        }

        transactions.forEach(tx => {
          const category = aiMap[tx.id] || 'Outros';
          const sContext = searchResultsContext.find(s => s.id === tx.id);
          const isCorrect = category === tx.expected_category;
          if (isCorrect) correctCount++;
          results.push({ 
            id: tx.id, 
            description: tx.description, 
            category, 
            isCorrect, 
            expected: tx.expected_category,
            searchLog: sContext ? sContext.searchLog : null
          });
        });

        executionTimeMs = Date.now() - start;
        totalCost = transactions.length * (keys.serpapi ? 0.0050 : 0.00030);
        const accuracy = parseFloat(((correctCount / transactions.length) * 100).toFixed(1));
        logs.push(`[Subagente SerpAPI] Concluído em ${executionTimeMs}ms. Acurácia: ${accuracy}%. Custo: $${totalCost.toFixed(5)}`);
        return { agentKey, name, executionTimeMs, accuracy, totalCost, results, logs };
      }
    } catch (e) {
      logs.push(`[ERRO - ${agentKey}] Falha na chamada da API: ${e.message}`);
      return { agentKey, name: agentKey, executionTimeMs: 0, accuracy: 0, totalCost: 0, results: [], logs };
    }
  };

  try {
    // Run all agents concurrently in parallel
    const promises = ['local', 'claude', 'gemini', 'chatgpt', 'serpapi'].map(key => runAgent(key));
    const benchmarkResults = await Promise.all(promises);

    const responseData = {};
    benchmarkResults.forEach(res => {
      responseData[res.agentKey] = res;
    });

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: 'Erro no processamento dos subagentes: ' + error.message });
  }
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
