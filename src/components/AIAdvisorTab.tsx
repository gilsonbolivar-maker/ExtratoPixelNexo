import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Send,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  ShieldAlert,
  Flame,
  ArrowRight,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { Transaction, FinancialHealthScore, ChatMessage, Budget, CategoryKey } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { usePrivacy } from '../context/PrivacyContext';
import { apiUrl } from '../utils/api';

interface AIAdvisorTabProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const AIAdvisorTab: React.FC<AIAdvisorTabProps> = ({ transactions, budgets }) => {
  const { hideValues } = usePrivacy();
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);
  const [isLoadingDiagnosis, setIsLoadingDiagnosis] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Olá! Sou seu Consultor Financeiro Inteligente. Analisei seu extrato bancário e estou pronto para responder qualquer dúvida sobre seus gastos, encontrar onde economizar ou simular cenários.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'Quanto gastei com delivery e restaurantes?',
        'Quais são minhas assinaturas recorrentes?',
        'Como posso economizar R$ 500 no próximo mês?',
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Calculate high-level metrics for diagnosis
  const metrics = React.useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = Math.abs(
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    const categoryTotals: Record<string, number> = {};
    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
      });

    return { totalIncome, totalExpense, netBalance, savingsRate, categoryTotals };
  }, [transactions]);

  // Run AI Financial Diagnosis
  const runDiagnosis = async () => {
    if (transactions.length === 0) return;
    setIsLoadingDiagnosis(true);
    setDiagnosisError(null);

    try {
      const response = await fetch(apiUrl('/api/analyze-finances'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, metrics, budgets }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar diagnóstico inteligente.');
      }

      const data: FinancialHealthScore = await response.json();
      setHealthScore(data);
    } catch (err: any) {
      console.error('Diagnosis error:', err);
      // Fallback local rule-based score calculation if offline or no key
      calculateFallbackScore();
      setDiagnosisError('Modo offline / simplificado ativado.');
    } finally {
      setIsLoadingDiagnosis(false);
    }
  };

  // Fallback heuristic scoring
  const calculateFallbackScore = () => {
    let essentialAmt = 0;
    let wantsAmt = 0;

    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const cat = CATEGORIES[t.category];
        if (cat?.isEssential) {
          essentialAmt += Math.abs(t.amount);
        } else {
          wantsAmt += Math.abs(t.amount);
        }
      });

    const income = metrics.totalIncome || (metrics.totalExpense > 0 ? metrics.totalExpense * 1.1 : 1);
    const savingsAmt = Math.max(0, income - (essentialAmt + wantsAmt));

    const essentialPct = (essentialAmt / income) * 100;
    const wantsPct = (wantsAmt / income) * 100;
    const savingsPct = (savingsAmt / income) * 100;

    let score = 75;
    if (savingsPct >= 20) score += 15;
    else if (savingsPct < 5) score -= 20;

    if (essentialPct > 65) score -= 15;
    if (wantsPct > 40) score -= 10;
    score = Math.max(20, Math.min(98, Math.round(score)));

    const grade = score >= 85 ? 'Excelente' : score >= 70 ? 'Bom' : score >= 50 ? 'Atenção' : 'Crítico';

    setHealthScore({
      score,
      grade,
      summary: `Você possui um saldo líquido de ${formatCurrency(metrics.netBalance)} e taxa de poupança de ${metrics.savingsRate.toFixed(1)}%. Mantenha os gastos essenciais controlados.`,
      rule503020: {
        essentialPercentage: essentialPct,
        wantsPercentage: wantsPct,
        savingsPercentage: savingsPct,
        essentialAmount: essentialAmt,
        wantsAmount: wantsAmt,
        savingsAmount: savingsAmt,
      },
      insights: [
        {
          type: metrics.netBalance >= 0 ? 'success' : 'alert',
          title: metrics.netBalance >= 0 ? 'Saldo Positivo' : 'Gastos Superando Receitas',
          description: metrics.netBalance >= 0
            ? 'Suas entradas cobriram todas as despesas do período com folga.'
            : 'As despesas deste mês superaram suas entradas registradas.',
        },
        {
          type: 'tip',
          title: 'Oportunidade de Reserva',
          description: 'Direcione 15% do saldo excedente para um investimento de liquidez diária (CDB ou Tesouro Selic).',
        },
      ],
      spendingLeaks: [
        {
          title: 'Assinaturas & Delivery',
          category: 'Alimentação & Assinaturas',
          amount: (metrics.categoryTotals.alimentacao || 0) * 0.25,
          recommendation: 'Reduzir 1 a 2 pedidos semanais em aplicativos pode gerar mais de R$ 300 de economia mensal.',
        },
      ],
    });
  };

  useEffect(() => {
    if (transactions.length > 0 && !healthScore) {
      runDiagnosis();
    }
  }, [transactions]);

  // Handle Send Chat Message
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isSendingMessage) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsSendingMessage(true);

    try {
      const response = await fetch(apiUrl('/api/chat-advisor'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          transactions,
          metrics,
          history: messages.slice(-6),
        }),
      });

      if (!response.ok) throw new Error('Erro na resposta do assistente.');

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: data.suggestedActions,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      // Fallback response
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: `Com base no seu extrato, você teve ${formatCurrency(metrics.totalIncome)} de entradas e ${formatCurrency(metrics.totalExpense)} de despesas. A maior categoria de gasto foi ${
          Object.keys(metrics.categoryTotals)[0] || 'Alimentação'
        }. Para economizar, sugerimos estabelecer um teto orçamentário na aba de Metas.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-xs">
        <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-semibold text-slate-800">Nenhum extrato carregado ainda.</p>
        <p className="text-xs text-slate-400 mt-1">Importe um extrato bancário para receber diagnósticos e conversar com a IA.</p>
      </div>
    );
  }

  const scoreColor =
    (healthScore?.score || 0) >= 80
      ? '#10b981'
      : (healthScore?.score || 0) >= 60
      ? '#4f46e5'
      : (healthScore?.score || 0) >= 45
      ? '#f59e0b'
      : '#f43f5e';

  return (
    <div className="space-y-6">
      {/* SECTION 1: Health Score & 50/30/20 Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Score Card (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Saúde Financeira</h3>
              </div>
              <button
                onClick={runDiagnosis}
                disabled={isLoadingDiagnosis}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Atualizar diagnóstico"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingDiagnosis ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingDiagnosis ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Calculando indicadores financeiros com IA...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-5">
                  {/* Circular Score Badge */}
                  <div
                    className="relative w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shadow-xs flex-shrink-0 bg-slate-50"
                    style={{ borderColor: scoreColor }}
                  >
                    <span className="text-2xl font-bold text-slate-900">{healthScore?.score || 75}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">/ 100</span>
                  </div>

                  <div>
                    <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1" style={{ backgroundColor: `${scoreColor}18`, color: scoreColor }}>
                      Classificação: {healthScore?.grade || 'Bom'}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-medium">
                      {healthScore?.summary || 'Seu perfil financeiro está equilibrado, com capacidade de poupança positiva.'}
                    </p>
                  </div>
                </div>

                {/* 50/30/20 Rule Progress Bars */}
                {healthScore?.rule503020 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <p className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Análise da Regra 50 / 30 / 20:</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Essenciais • Desejos • Reserva</span>
                    </p>

                    {/* Essential 50% */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Essenciais (Meta ≤ 50%):</span>
                        <span className="font-bold text-blue-600">
                          {formatPercent(healthScore.rule503020.essentialPercentage)}{' '}
                          <span className="text-slate-400 font-normal">({formatCurrency(healthScore.rule503020.essentialAmount, hideValues)})</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, healthScore.rule503020.essentialPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Wants 30% */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Desejos & Lazer (Meta ≤ 30%):</span>
                        <span className="font-bold text-purple-600">
                          {formatPercent(healthScore.rule503020.wantsPercentage)}{' '}
                          <span className="text-slate-400 font-normal">({formatCurrency(healthScore.rule503020.wantsAmount, hideValues)})</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, healthScore.rule503020.wantsPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Savings 20% */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Poupança / Reserva (Meta ≥ 20%):</span>
                        <span className="font-bold text-emerald-600">
                          {formatPercent(healthScore.rule503020.savingsPercentage)}{' '}
                          <span className="text-slate-400 font-normal">({formatCurrency(healthScore.rule503020.savingsAmount, hideValues)})</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, healthScore.rule503020.savingsPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Insights & Spending Leaks (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Spending Leaks / Onde Você Pode Economizar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <Flame className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Vazamentos Financeiros Detectados</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(healthScore?.spendingLeaks || []).map((leak, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-amber-50/40 border border-amber-200/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{leak.title}</span>
                    <span className="text-xs font-bold text-amber-700">{formatCurrency(leak.amount, hideValues)}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{leak.recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic Insights */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Lightbulb className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Recomendações Estratégicas da IA</h4>
            </div>

            <div className="space-y-2">
              {(healthScore?.insights || []).map((ins, idx) => {
                const icon =
                  ins.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : ins.type === 'alert' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Lightbulb className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  );

                return (
                  <div key={idx} className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    {icon}
                    <div>
                      <span className="font-bold text-slate-800 mr-1">{ins.title}:</span>
                      <span className="text-slate-600">{ins.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Interactive AI Financial Assistant Chat */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col h-[480px]">
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Assistente Financeiro Pessoal
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider">
                  Online
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Faça perguntas diretas sobre as movimentações do seu extrato</p>
            </div>
          </div>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F8FAFC]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
                <span
                  className={`block text-[10px] text-right mt-1 font-medium ${
                    msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {/* Suggested Action Pills */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[85%]">
                  {msg.suggestedActions.map((action, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => handleSendMessage(action)}
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-[11px] text-indigo-700 font-medium transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                    >
                      <span>{action}</span>
                      <ArrowRight className="w-3 h-3 text-indigo-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isSendingMessage && (
            <div className="flex items-center space-x-2 text-slate-500 text-xs py-2 bg-white px-3 py-2 rounded-lg border border-slate-200 inline-flex shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Consultando extrato com IA...</span>
            </div>
          )}
        </div>

        {/* Chat Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-3.5 bg-white border-t border-slate-200 flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Pergunte algo sobre seu extrato (ex: 'Quanto gastei em alimentação?', 'Qual meu maior gasto?')..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSendingMessage}
            className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition flex items-center gap-1.5 shadow-xs text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};
