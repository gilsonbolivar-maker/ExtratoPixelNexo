import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp, CreditCard, ShoppingCart, ArrowRight } from 'lucide-react';
import { Transaction, CategoryKey, PaymentMethod } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency, formatPercent, formatDateShort } from '../utils/formatters';
import { usePrivacy } from '../context/PrivacyContext';

interface ChartsAndAnalyticsProps {
  transactions: Transaction[];
  onFilterByCategory?: (cat: CategoryKey) => void;
}

export const ChartsAndAnalytics: React.FC<ChartsAndAnalyticsProps> = ({
  transactions,
  onFilterByCategory,
}) => {
  const { hideValues } = usePrivacy();
  const [cashflowView, setCashflowView] = useState<'cumulative' | 'daily'>('daily');

  // Group by date for Cashflow Timeline
  const cashflowData = useMemo(() => {
    const dateMap: Record<string, { date: string; income: number; expense: number; net: number }> = {};

    transactions.forEach((t) => {
      if (!dateMap[t.date]) {
        dateMap[t.date] = { date: t.date, income: 0, expense: 0, net: 0 };
      }
      if (t.amount > 0) {
        dateMap[t.date].income += t.amount;
      } else {
        dateMap[t.date].expense += Math.abs(t.amount);
      }
      dateMap[t.date].net = dateMap[t.date].income - dateMap[t.date].expense;
    });

    const sorted = Object.values(dateMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // If cumulative view
    let runningBalance = 0;
    return sorted.map((d) => {
      runningBalance += d.net;
      return {
        ...d,
        dateFormatted: formatDateShort(d.date),
        accumulated: runningBalance,
      };
    });
  }, [transactions]);

  // Group by category for Expenses
  const categoryData = useMemo(() => {
    const catMap: Record<CategoryKey, number> = {} as any;
    let totalExpense = 0;

    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const val = Math.abs(t.amount);
        catMap[t.category] = (catMap[t.category] || 0) + val;
        totalExpense += val;
      });

    return Object.entries(catMap)
      .map(([key, value]) => {
        const catKey = key as CategoryKey;
        const info = CATEGORIES[catKey] || CATEGORIES.outros;
        return {
          key: catKey,
          name: info.label,
          shortName: info.label.split('&')[0].trim(),
          value,
          percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
          color: info.color,
          bgLight: info.bgLight,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Top Merchants / Onde Você Mais Gastou
  const topMerchantsData = useMemo(() => {
    const merchantMap: Record<string, { name: string; total: number; count: number; category: CategoryKey }> = {};

    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        // Clean description for grouping (take first 3 words or clean name)
        let name = t.description.replace(/\*.*$/, '').replace(/\d{4,}/, '').trim();
        if (name.length > 24) name = name.substring(0, 24) + '...';
        if (!name) name = 'Diversos';

        if (!merchantMap[name]) {
          merchantMap[name] = { name, total: 0, count: 0, category: t.category };
        }
        merchantMap[name].total += Math.abs(t.amount);
        merchantMap[name].count += 1;
      });

    return Object.values(merchantMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [transactions]);

  // Group by Payment Method
  const paymentMethodData = useMemo(() => {
    const pmMap: Record<PaymentMethod, number> = {
      pix: 0,
      credito: 0,
      debito: 0,
      boleto: 0,
      ted_doc: 0,
      dinheiro: 0,
      outro: 0,
    };

    const pmLabels: Record<PaymentMethod, { label: string; color: string }> = {
      pix: { label: 'PIX', color: '#10b981' },
      credito: { label: 'Cartão de Crédito', color: '#8b5cf6' },
      debito: { label: 'Cartão de Débito', color: '#3b82f6' },
      boleto: { label: 'Boleto Bancário', color: '#f59e0b' },
      ted_doc: { label: 'TED / Transferência', color: '#06b6d4' },
      dinheiro: { label: 'Dinheiro / Saque', color: '#ec4899' },
      outro: { label: 'Outro', color: '#64748b' },
    };

    let total = 0;
    transactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const amt = Math.abs(t.amount);
        pmMap[t.paymentMethod] = (pmMap[t.paymentMethod] || 0) + amt;
        total += amt;
      });

    return Object.entries(pmMap)
      .filter(([_, val]) => val > 0)
      .map(([key, value]) => ({
        key: key as PaymentMethod,
        name: pmLabels[key as PaymentMethod]?.label || key,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: pmLabels[key as PaymentMethod]?.color || '#64748b',
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* SECTION 1: Cashflow Timeline (Evolução do Fluxo de Caixa) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Evolução do Fluxo de Caixa</h3>
              <p className="text-xs text-slate-500">Entradas vs. Saídas ao longo dos dias do extrato</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setCashflowView('daily')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                cashflowView === 'daily'
                  ? 'bg-white text-slate-800 font-bold shadow-2xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Diário (Entradas / Saídas)
            </button>
            <button
              onClick={() => setCashflowView('cumulative')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                cashflowView === 'cumulative'
                  ? 'bg-white text-indigo-600 font-bold shadow-2xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Saldo Acumulado
            </button>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {cashflowView === 'daily' ? (
              <BarChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dateFormatted" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => hideValues ? '••••' : `R$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1.5 min-w-[160px]">
                          <p className="font-bold text-slate-900">{data.date}</p>
                          <div className="flex items-center justify-between text-emerald-600 font-semibold">
                            <span>Entradas:</span>
                            <span>{formatCurrency(data.income, hideValues)}</span>
                          </div>
                          <div className="flex items-center justify-between text-rose-600 font-semibold">
                            <span>Saídas:</span>
                            <span>{formatCurrency(data.expense, hideValues)}</span>
                          </div>
                          <div className="flex items-center justify-between text-indigo-600 font-bold border-t border-slate-100 pt-1">
                            <span>Saldo do Dia:</span>
                            <span>{formatCurrency(data.net, hideValues)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: '12px' }}
                  formatter={(val) => (val === 'income' ? 'Entradas (Receitas)' : 'Saídas (Despesas)')}
                />
                <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            ) : (
              <AreaChart data={cashflowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accumulatedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="dateFormatted" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => hideValues ? '••••' : `R$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs space-y-1">
                          <p className="font-bold text-slate-800">{data.date}</p>
                          <p className="text-indigo-600 font-bold text-sm">
                            Saldo Acumulado: {formatCurrency(data.accumulated, hideValues)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="accumulated"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#accumulatedGradient)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECTION 2: Category Breakdown & Top Merchants Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Gastos por Categoria</h3>
                  <p className="text-xs text-slate-500">Distribuição percentual das suas despesas</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Donut Chart */}
              <div className="sm:col-span-5 h-48 sm:h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="shortName"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={`cell-${entry.key}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-xs">
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <p className="text-slate-600">
                                {formatCurrency(item.value, hideValues)} ({formatPercent(item.percentage)})
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend with Progress Bars */}
              <div className="sm:col-span-7 space-y-2 max-h-56 overflow-y-auto pr-1">
                {categoryData.slice(0, 6).map((cat) => (
                  <div
                    key={cat.key}
                    onClick={() => onFilterByCategory?.(cat.key)}
                    className="group cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                      <span className="font-bold text-slate-800 flex items-center gap-1">
                        {formatCurrency(cat.value, hideValues)}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">({formatPercent(cat.percentage)})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top Merchants & Payment Methods (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Top Merchants */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center space-x-2.5 mb-3.5">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Maiores Destinos</h3>
                <p className="text-xs text-slate-500">Onde seu dinheiro foi mais concentrado</p>
              </div>
            </div>

            <div className="space-y-2">
              {topMerchantsData.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-xs transition"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-bold text-slate-400 text-xs w-4">#{idx + 1}</span>
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-500">{m.count} transações</p>
                    </div>
                  </div>
                  <span className="font-bold text-rose-600 flex-shrink-0 ml-2">
                    {formatCurrency(m.total, hideValues)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Meios de Pagamento</h3>
                <p className="text-xs text-slate-500">Distribuição das formas de quitação</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {paymentMethodData.map((pm) => (
                <div key={pm.key} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <p className="text-slate-500 text-[11px] truncate font-medium">{pm.name}</p>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{formatCurrency(pm.value, hideValues)}</p>
                  <span className="text-[10px] text-indigo-600 font-bold">{formatPercent(pm.percentage)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
