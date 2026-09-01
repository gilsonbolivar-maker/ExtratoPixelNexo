import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with generous limit for images/PDFs base64
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy get Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

/**
 * Endpoint: Parse Statement using Gemini (Text, PDF, Images/Screenshots)
 */
app.post('/api/parse-statement', async (req: Request, res: Response) => {
  try {
    const { textContent, base64Data, mimeType, bankHint } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'Chave do Gemini API não configurada. Use importação OFX/CSV ou adicione a chave no painel de configurações.',
      });
    }

    const contents: any[] = [];

    if (base64Data && mimeType) {
      // Extract raw base64 if data URI prefix exists
      const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: mimeType === 'application/pdf' ? 'application/pdf' : mimeType,
          data: cleanBase64,
        },
      });
    }

    const promptText = `
Você é um especialista financeiro bancário brasileiro de alto nível.
Sua tarefa é ler atentamente o extrato bancário, fatura de cartão de crédito ou comprovante financeiro fornecido (em anexo ou texto) e extrair TODAS as transações individuais de forma precisa e estruturada.

Texto/Dica do Usuário: ${textContent || 'Analise o documento/imagem anexado.'}
Banco informado (se houver): ${bankHint || 'Detectar automaticamente'}

Diretrizes Críticas:
1. Extraia cada movimentação individual (data, descrição limpa, valor numérico, tipo, categoria, método de pagamento).
2. Valoração: Despesas/Gastos/Débitos DEVEM ser números NEGATIVOS (ex: -45.90, -1200.00). Entradas/Salários/TED recebidas/Cashback DEVEM ser números POSITIVOS (ex: 5000.00, 35.50).
3. Data: Formate sempre como 'YYYY-MM-DD'. Se faltar o ano, assuma 2026.
4. Categorias permitidas:
   - 'moradia' (aluguel, condomínio, luz, água, gás, internet fixa)
   - 'alimentacao' (supermercado, ifood, restaurantes, padaria, delivery)
   - 'transporte' (uber, combustível, metrô, ônibus, estacionamento, pedágio)
   - 'saude' (farmácia, consultas, exames, dentista, plano de saúde)
   - 'educacao' (cursos, faculdade, livros, mensalidade escolar)
   - 'lazer' (cinema, viagens, passeios, shows, hospedagem)
   - 'compras' (roupas, eletrônicos, compras online, shoppings)
   - 'assinaturas' (netflix, spotify, gympass, icloud, streaming, academias)
   - 'financeiro' (tarifas de conta, juros, IOF, investimentos, seguros)
   - 'renda' (salário, freelance, pró-labore, rendimentos, dividendos)
   - 'outros' (diversos que não se enquadram)
5. Métodos de pagamento permitidos: 'pix', 'credito', 'debito', 'boleto', 'ted_doc', 'dinheiro', 'outro'.
6. Detecte se a transação tem padrão recorrente (isRecurring: boolean).
7. Extraia também informações do extrato: nome do banco (bankName), moeda (currency: "BRL"), saldo final se constar.
`;

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bankName: { type: Type.STRING, description: 'Nome do banco detectado' },
            accountNumber: { type: Type.STRING, description: 'Número da conta ou últimos dígitos do cartão' },
            period: { type: Type.STRING, description: 'Período do extrato (ex: Agosto 2026)' },
            finalBalance: { type: Type.NUMBER, description: 'Saldo final ou total da fatura se constar' },
            currency: { type: Type.STRING, description: 'Moeda (geralmente BRL)' },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD' },
                  description: { type: Type.STRING, description: 'Descrição tratada e legível' },
                  originalDescription: { type: Type.STRING, description: 'Descrição original do extrato' },
                  amount: { type: Type.NUMBER, description: 'Valor em BRL (negativo para gasto, positivo para entrada)' },
                  type: { type: Type.STRING, enum: ['expense', 'income', 'transfer'], description: 'Tipo da transação' },
                  category: {
                    type: Type.STRING,
                    enum: [
                      'moradia',
                      'alimentacao',
                      'transporte',
                      'saude',
                      'educacao',
                      'lazer',
                      'compras',
                      'assinaturas',
                      'financeiro',
                      'renda',
                      'outros',
                    ],
                  },
                  paymentMethod: {
                    type: Type.STRING,
                    enum: ['pix', 'credito', 'debito', 'boleto', 'ted_doc', 'dinheiro', 'outro'],
                  },
                  isRecurring: { type: Type.BOOLEAN, description: 'Indica se é recorrente' },
                  memo: { type: Type.STRING, description: 'Observações adicionais ou identificador' },
                },
                required: ['date', 'description', 'amount', 'type', 'category', 'paymentMethod'],
              },
            },
          },
          required: ['transactions'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    
    // Add unique IDs to transactions
    if (Array.isArray(parsedJson.transactions)) {
      parsedJson.transactions = parsedJson.transactions.map((t: any, index: number) => ({
        ...t,
        id: `ai-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        bankName: t.bankName || parsedJson.bankName || 'Extrato Bancário',
      }));
    }

    return res.json(parsedJson);
  } catch (error: any) {
    console.error('Error parsing statement with Gemini:', error);
    return res.status(500).json({
      error: 'Falha ao processar o extrato com IA. Tente novamente ou use formato OFX/CSV.',
      details: error.message,
    });
  }
});

/**
 * Endpoint: Generate Financial Health & Spending Diagnosis
 */
app.post('/api/analyze-finances', async (req: Request, res: Response) => {
  try {
    const { transactions, metrics, budgets } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'Chave do Gemini API não configurada.' });
    }

    const prompt = `
Você é um consultor financeiro CFP® renomado e empático.
Analise detalhadamente o perfil financeiro baseado nas seguintes transações e métricas reais:

Métricas Gerais:
- Total de Entradas (Receitas): R$ ${metrics?.totalIncome?.toFixed(2) || 0}
- Total de Saídas (Despesas): R$ ${metrics?.totalExpense?.toFixed(2) || 0}
- Saldo Líquido: R$ ${metrics?.netBalance?.toFixed(2) || 0}
- Taxa de Poupança Atual: ${metrics?.savingsRate?.toFixed(1) || 0}%

Distribuição por Categoria:
${JSON.stringify(metrics?.categoryTotals || {}, null, 2)}

Lista das Principais Transações (Amostra de até 40 itens):
${JSON.stringify((transactions || []).slice(0, 40), null, 2)}

Orçamentos Definidos pelo Usuário:
${JSON.stringify(budgets || [], null, 2)}

Por favor, forneça um diagnóstico financeiro inteligente e acionável em português brasileiro:
1. Nota de Saúde Financeira de 0 a 100 e classificação ('Excelente' [85-100], 'Bom' [70-84], 'Atenção' [50-69], 'Crítico' [<50]).
2. Resumo executivo claro e direto sobre o momento financeiro.
3. Análise da Regra 50/30/20 (Gastos Essenciais recomendados 50%, Gastos com Desejos 30%, Poupança/Investimentos 20%). Calcule os valores e percentuais reais.
4. Insights estratégicos com tipo ('success', 'warning', 'tip', 'alert'), título conciso, explicação e impacto financeiro estimado em R$.
5. "Vazamentos Financeiros" (spendingLeaks): pequenos gastos recorrentes ou excessivos que passam despercebidos (ex: delivery diário, tarifas bancárias, assinaturas duplicadas) com recomendação prática.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: 'Pontuação de 0 a 100' },
            grade: { type: Type.STRING, enum: ['Excelente', 'Bom', 'Atenção', 'Crítico'] },
            summary: { type: Type.STRING, description: 'Resumo executivo do diagnóstico' },
            rule503020: {
              type: Type.OBJECT,
              properties: {
                essentialPercentage: { type: Type.NUMBER },
                wantsPercentage: { type: Type.NUMBER },
                savingsPercentage: { type: Type.NUMBER },
                essentialAmount: { type: Type.NUMBER },
                wantsAmount: { type: Type.NUMBER },
                savingsAmount: { type: Type.NUMBER },
              },
              required: ['essentialPercentage', 'wantsPercentage', 'savingsPercentage', 'essentialAmount', 'wantsAmount', 'savingsAmount'],
            },
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['success', 'warning', 'tip', 'alert'] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impactEstimate: { type: Type.NUMBER, description: 'Economia estimada em R$' },
                },
                required: ['type', 'title', 'description'],
              },
            },
            spendingLeaks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  recommendation: { type: Type.STRING },
                },
                required: ['title', 'category', 'amount', 'recommendation'],
              },
            },
          },
          required: ['score', 'grade', 'summary', 'rule503020', 'insights', 'spendingLeaks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating financial analysis:', error);
    return res.status(500).json({ error: 'Erro ao gerar análise financeira com IA.', details: error.message });
  }
});

/**
 * Endpoint: Financial AI Chat Advisor
 */
app.post('/api/chat-advisor', async (req: Request, res: Response) => {
  try {
    const { message, transactions, metrics, history } = req.body;

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({ error: 'Chave do Gemini API não configurada.' });
    }

    const systemPrompt = `
Você é o Consultor Financeiro Pessoal do usuário no app "Leitor de Extrato & Gestor Financeiro".
Você tem acesso aos dados reais do extrato bancário do usuário.
Responda de forma precisa, calorosa, motivadora e baseada estritamente nos números do extrato.
Sempre formate valores monetários como 'R$ X.XXX,XX'.

Métricas Atuais:
- Total Entradas: R$ ${metrics?.totalIncome?.toFixed(2) || 0}
- Total Despesas: R$ ${metrics?.totalExpense?.toFixed(2) || 0}
- Saldo Líquido: R$ ${metrics?.netBalance?.toFixed(2) || 0}

Amostra de Transações:
${JSON.stringify((transactions || []).slice(0, 50), null, 2)}

Instruções:
- Seja conciso e direto.
- Responda em Português do Brasil.
- Sugira 2 ou 3 perguntas ou ações rápidas de acompanhamento (ex: "Verificar assinaturas ativas", "Como economizar em alimentação?").
`;

    const chatMessagesFormatted = (history || []).map((h: any) => ({
      role: h.sender === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        ...chatMessagesFormatted,
        { role: 'user', parts: [{ text: message }] },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING, description: 'Resposta detalhada do consultor financeiro' },
            suggestedActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 a 3 perguntas de continuação sugeridas para o usuário clicar',
            },
          },
          required: ['answer'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      text: parsed.answer || 'Desculpe, não consegui processar a resposta.',
      suggestedActions: parsed.suggestedActions || [],
    });
  } catch (error: any) {
    console.error('Error in chat advisor:', error);
    return res.status(500).json({ error: 'Erro no assistente financeiro.', details: error.message });
  }
});

/**
 * Vite integration & Static serving
 */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Financial Statement Reader server running on port ${PORT}`);
  });
}

startServer();
