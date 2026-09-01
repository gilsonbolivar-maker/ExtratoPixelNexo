import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Wallet, PiggyBank, Flame, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { Transaction, CategoryKey } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface FinancialKPIsProps {
  transactions: Transaction[];
}

export const FinancialKPIs: React.FC<FinancialKPIsProps> = ({ transactions }) => {
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  // Calculate unique days with transactions for daily average
  const uniqueDays = new Set(transactions.map((t) => t.date)).size || 1;
  const dailyAverageExpense = totalExpense / uniqueDays;

  // Category with highest expense
  const expenseByCategory: Record<CategoryKey, number> = {} as any;
  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + Math.abs(t.amount);
    });

  let topCategoryKey: CategoryKey = 'alimentacao';
  let topCategoryAmount = 0;
  Object.entries(expenseByCategory).forEach(([cat, amt]) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategoryKey = cat as CategoryKey;
    }
  });

  const topCategoryInfo = CATEGORIES[topCategoryKey] || CATEGORIES.outros;
  const topCategoryPercent = totalExpense > 0 ? (topCategoryAmount / totalExpense) * 100 : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Total Entradas */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Entradas / Receitas</span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 tracking-tight">
            {formatCurrency(totalIncome)}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{transactions.filter((t) => t.amount > 0).length}</span>{' '}
            entradas no período
          </p>
        </div>
      </div>

      {/* KPI 2: Total Saídas (Despesas) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Gastos no Mês</span>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold text-rose-600 tracking-tight">
            - {formatCurrency(totalExpense)}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-rose-600 font-semibold">Média: {formatCurrency(dailyAverageExpense)}/dia</span>
          </p>
        </div>
      </div>

      {/* KPI 3: Saldo do Mês / Economia Líquida */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Saldo Total</span>
          <div
            className={`p-2 rounded-lg border ${
              netBalance >= 0
                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              netBalance >= 0 ? 'text-slate-900' : 'text-amber-600'
            }`}
          >
            {formatCurrency(netBalance)}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            {netBalance >= 0 ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Superávit financeiro
              </span>
            ) : (
              <span className="text-xs font-semibold text-rose-600 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                Déficit no período
              </span>
            )}
          </div>
        </div>
      </div>

      {/* KPI 4: Taxa de Poupança & Maior Gasto */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">Taxa de Poupança</span>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-100">
            <PiggyBank className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold text-purple-600 tracking-tight">
            {savingsRate > 0 ? formatPercent(savingsRate) : '0.0%'}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            Maior gasto:{' '}
            <span className="text-slate-800 font-semibold">{topCategoryInfo.label.split('&')[0]}</span> (
            {formatPercent(topCategoryPercent)})
          </p>
        </div>
      </div>
    </div>
  );
};
