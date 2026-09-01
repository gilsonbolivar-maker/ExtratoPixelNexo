import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FinancialKPIs } from './components/FinancialKPIs';
import { ChartsAndAnalytics } from './components/ChartsAndAnalytics';
import { TransactionTable } from './components/TransactionTable';
import { BudgetPlanner } from './components/BudgetPlanner';
import { StatementUploader } from './components/StatementUploader';
import { AddTransactionModal } from './components/AddTransactionModal';
import { PixelNexoFooter } from './components/PixelNexoFooter';
import { Transaction, StatementSummary, BankAccount, Budget, CategoryKey } from './types';
import { formatCurrency } from './utils/formatters';
import { usePrivacy } from './context/PrivacyContext';
import { UploadCloud, Plus, CheckCircle2, ArrowRight } from 'lucide-react';

const SEM_BANCO = 'Sem banco';

/** Chave usada para não importar duas vezes o mesmo lançamento. */
const transactionKey = (t: Transaction) =>
  `${t.bankName || SEM_BANCO}|${t.date}|${t.amount}|${(t.description || '').trim().toLowerCase()}`;

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'moradia', limit: 2500 },
  { category: 'alimentacao', limit: 1200 },
  { category: 'transporte', limit: 600 },
  { category: 'saude', limit: 400 },
  { category: 'educacao', limit: 300 },
  { category: 'lazer', limit: 450 },
  { category: 'compras', limit: 500 },
  { category: 'assinaturas', limit: 250 },
  { category: 'financeiro', limit: 150 },
  { category: 'outros', limit: 200 },
];

export default function App() {
  const { hideValues } = usePrivacy();

  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'budget'>('dashboard');
  const [categoryFilterFromChart, setCategoryFilterFromChart] = useState<CategoryKey | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persistent State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('extratowise_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved transactions');
      }
    }
    return [];
  });

  // null = consolidado da pessoa (todos os bancos juntos)
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const [summary, setSummary] = useState<StatementSummary | null>(() => {
    const saved = localStorage.getItem('extratowise_summary');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved summary');
      }
    }
    return null;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('extratowise_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_BUDGETS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('extratowise_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (summary) {
      localStorage.setItem('extratowise_summary', JSON.stringify(summary));
    }
  }, [summary]);

  useEffect(() => {
    localStorage.setItem('extratowise_budgets', JSON.stringify(budgets));
  }, [budgets]);

  // Bancos presentes nos lançamentos, com a contagem de cada um
  const banks: BankAccount[] = React.useMemo(() => {
    const counts = new Map<string, number>();
    transactions.forEach((t) => {
      const name = t.bankName?.trim() || SEM_BANCO;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [transactions]);

  // Se o banco selecionado sumir (foi removido), volta ao consolidado
  useEffect(() => {
    if (selectedBank && !banks.some((b) => b.name === selectedBank)) {
      setSelectedBank(null);
    }
  }, [banks, selectedBank]);

  // O que as telas mostram: um banco só, ou o consolidado da pessoa
  const visibleTransactions = React.useMemo(
    () =>
      selectedBank
        ? transactions.filter((t) => (t.bankName?.trim() || SEM_BANCO) === selectedBank)
        : transactions,
    [transactions, selectedBank]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handlers
  // Importar soma ao que já existe, para a pessoa acumular vários bancos
  const handleImportSuccess = (newTransactions: Transaction[], newSummary: StatementSummary) => {
    const bankName = newSummary.bankName?.trim() || SEM_BANCO;
    const stamped = newTransactions.map((t) => ({
      ...t,
      bankName: t.bankName?.trim() || bankName,
    }));

    setTransactions((prev) => {
      const seen = new Set(prev.map(transactionKey));
      const added = stamped.filter((t) => !seen.has(transactionKey(t)));
      const duplicates = stamped.length - added.length;

      const merged = [...prev, ...added].sort((a, b) => b.date.localeCompare(a.date));
      showToast(
        duplicates > 0
          ? `${added.length} lançamentos de "${bankName}" importados (${duplicates} já existiam).`
          : `${added.length} lançamentos de "${bankName}" importados.`
      );
      return merged;
    });

    setSummary(newSummary);
    setSelectedBank(null);
  };

  const handleUpdateCategory = (id: string, newCategory: CategoryKey) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category: newCategory } : t))
    );
    showToast('Categoria atualizada com sucesso.');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Lançamento removido.');
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const tx: Transaction = {
      ...newTx,
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    setTransactions((prev) => [tx, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    showToast(`Lançamento adicionado em "${tx.bankName || SEM_BANCO}".`);
  };

  const handleUpdateBudget = (category: CategoryKey, limit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, limit } : b))
    );
    showToast('Teto orçamentário atualizado.');
  };

  const handleClearBank = (bank: string) => {
    if (!window.confirm(`Remover todos os lançamentos de "${bank}"?`)) return;
    setTransactions((prev) => prev.filter((t) => (t.bankName?.trim() || SEM_BANCO) !== bank));
    setSelectedBank(null);
    showToast(`Lançamentos de "${bank}" removidos.`);
  };

  const handleResetData = () => {
    if (window.confirm('Deseja realmente limpar todos os dados do extrato?')) {
      setTransactions([]);
      setSummary(null);
      setSelectedBank(null);
      localStorage.removeItem('extratowise_transactions');
      localStorage.removeItem('extratowise_summary');
      showToast('Dados limpos.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ summary, transactions, budgets }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_extrato_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleFilterByCategoryFromChart = (cat: CategoryKey) => {
    setCategoryFilterFromChart(cat);
    setActiveTab('transactions');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-slate-900 flex flex-col antialiased transition-colors duration-200">
      {/* App Header */}
      <Header
        banks={banks}
        selectedBank={selectedBank}
        onSelectBank={setSelectedBank}
        transactionCount={visibleTransactions.length}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onClearBank={handleClearBank}
        onReset={handleResetData}
        onExportJSON={handleExportJSON}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl font-semibold text-xs sm:text-sm flex items-center gap-2 border border-slate-800 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Empty State Banner if no transactions */}
        {transactions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-6 shadow-xs">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Importe seu Extrato Bancário
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Carregue arquivos de qualquer banco brasileiro em <strong className="text-indigo-600 font-semibold">OFX</strong> ou <strong className="text-indigo-600 font-semibold">CSV</strong>, ou <strong className="text-indigo-600 font-semibold">cole as linhas</strong> do extrato. Tudo processado no seu aparelho.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Carregar Meu Extrato</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Lançar à Mão</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Importe de quantos bancos quiser — eles se somam no seu consolidado.
            </p>
          </div>
        ) : (
          <>
            {/* Top KPI Cards (Always visible on Dashboard and Budget) */}
            <FinancialKPIs transactions={visibleTransactions} />

            {/* Tab 1: Dashboard (Visão Geral & Gráficos) */}
            {activeTab === 'dashboard' && (
              <div className="space-y-5">
                <ChartsAndAnalytics
                  transactions={visibleTransactions}
                  onFilterByCategory={handleFilterByCategoryFromChart}
                />

                {/* Quick preview of recent transactions */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Últimos Lançamentos do Extrato</h3>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver todos ({visibleTransactions.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {visibleTransactions.slice(0, 5).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-xs transition"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <span className="text-slate-400 font-mono text-[11px]">{t.date}</span>
                          <span className="font-semibold text-slate-800 truncate">{t.description}</span>
                        </div>
                        <span
                          className={`font-bold font-mono text-xs sm:text-sm ml-2 flex-shrink-0 ${
                            t.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {t.amount > 0 ? '+' : ''}
                          {formatCurrency(t.amount, hideValues)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Detailed Transactions List */}
            {activeTab === 'transactions' && (
              <TransactionTable
                transactions={visibleTransactions}
                onUpdateCategory={handleUpdateCategory}
                onDeleteTransaction={handleDeleteTransaction}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                initialCategoryFilter={categoryFilterFromChart}
              />
            )}

            {/* Tab 3: Budget & Planning */}
            {activeTab === 'budget' && (
              <BudgetPlanner
                transactions={visibleTransactions}
                budgets={budgets}
                onUpdateBudget={handleUpdateBudget}
              />
            )}
          </>
        )}
      </main>

      {/* Upload Statement Modal */}
      <StatementUploader
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Manual Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        banks={banks}
        defaultBank={selectedBank}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 py-3 text-center text-xs text-slate-500 bg-white">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-slate-600">ExtratoPixelNexo • Leitor de Extrato & Gestor Financeiro Inteligente</span>
          <span className="text-slate-400">Privacidade total: arquivos e cálculos processados de ponta a ponta</span>
        </div>
      </footer>

      {/* Pixel Nexo Signature Footer */}
      <PixelNexoFooter />
    </div>
  );
}
