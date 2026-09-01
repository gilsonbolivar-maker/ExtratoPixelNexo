import React, { useState } from 'react';
import { Target, AlertTriangle, CheckCircle2, TrendingUp, Edit3, DollarSign, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Transaction, Budget, CategoryKey } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { usePrivacy } from '../context/PrivacyContext';

interface BudgetPlannerProps {
  transactions: Transaction[];
  budgets: Budget[];
  onUpdateBudget: (category: CategoryKey, limit: number) => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  transactions,
  budgets,
  onUpdateBudget,
}) => {
  const { hideValues } = usePrivacy();
  const [editingCategory, setEditingCategory] = useState<CategoryKey | null>(null);
  const [tempLimit, setTempLimit] = useState<string>('');

  // Calculate actual spending per category
  const spendingByCategory: Record<CategoryKey, number> = {} as any;
  let totalSpent = 0;

  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      const amt = Math.abs(t.amount);
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + amt;
      totalSpent += amt;
    });

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.limit, 0);
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const handleStartEdit = (category: CategoryKey, currentLimit: number) => {
    setEditingCategory(category);
    setTempLimit(currentLimit.toString());
  };

  const handleSaveEdit = (category: CategoryKey) => {
    const parsed = parseFloat(tempLimit);
    if (!isNaN(parsed) && parsed >= 0) {
      onUpdateBudget(category, parsed);
    }
    setEditingCategory(null);
  };

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Overall Budget Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Planejamento & Tetos de Gastos</h3>
            </div>
            <p className="text-xs text-slate-500">
              Acompanhe em tempo real se seus gastos estão dentro do planejado para o mês
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-slate-50 px-3.5 py-2 rounded-lg border border-slate-200">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Gasto / Orçado</p>
              <p className="text-sm font-bold text-slate-800 font-mono">
                {formatCurrency(totalSpent, hideValues)} / <span className="text-slate-400">{formatCurrency(totalBudgeted, hideValues)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Utilizado</p>
              <p
                className={`text-sm font-bold ${
                  overallPercentage > 100
                    ? 'text-rose-600'
                    : overallPercentage > 80
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {formatPercent(overallPercentage)}
              </p>
            </div>
          </div>
        </div>

        {/* General Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage > 100
                  ? 'bg-rose-500'
                  : overallPercentage > 80
                  ? 'bg-amber-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const catInfo = CATEGORIES[b.category] || CATEGORIES.outros;
          const spent = spendingByCategory[b.category] || 0;
          const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
          const isOver = spent > b.limit;
          const isNear = percentage >= 80 && !isOver;
          const isEditing = editingCategory === b.category;

          return (
            <div
              key={b.category}
              className={`bg-white border rounded-xl p-4 shadow-xs transition relative overflow-hidden flex flex-col justify-between ${
                isOver
                  ? 'border-rose-300 bg-rose-50/20'
                  : isNear
                  ? 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: catInfo.color }}
                    />
                    <span className="font-bold text-xs sm:text-sm text-slate-800 truncate">{catInfo.label}</span>
                  </div>

                  {/* Status Tag */}
                  {isOver ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Estourou
                    </span>
                  ) : isNear ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                      Alerta ({formatPercent(percentage)})
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Em dia
                    </span>
                  )}
                </div>

                {/* Amounts */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Gasto Atual</span>
                    <span className={`text-sm sm:text-base font-bold font-mono ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatCurrency(spent, hideValues)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-medium block">Teto Definido</span>
                    {isEditing ? (
                      <div className="flex items-center space-x-1 mt-0.5">
                        <input
                          type="number"
                          value={tempLimit}
                          onChange={(e) => setTempLimit(e.target.value)}
                          className="w-20 py-0.5 px-1.5 bg-white border border-indigo-500 rounded text-xs text-right text-slate-900 font-bold focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(b.category);
                            if (e.key === 'Escape') setEditingCategory(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(b.category)}
                          className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartEdit(b.category, b.limit)}
                        className="text-xs font-semibold text-slate-600 hover:text-indigo-600 transition inline-flex items-center gap-1 group font-mono"
                        title="Clique para editar teto"
                      >
                        <span>{formatCurrency(b.limit, hideValues)}</span>
                        <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>

              {/* Card Footer Balance */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{b.limit - spent >= 0 ? 'Restante:' : 'Ultrapassou:'}</span>
                <span
                  className={`font-semibold font-mono ${
                    b.limit - spent >= 0 ? 'text-emerald-600' : 'text-rose-600 font-bold'
                  }`}
                >
                  {formatCurrency(Math.abs(b.limit - spent), hideValues)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
