import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  Edit2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Download,
  Calendar,
  Check,
  Tag,
  Repeat,
  DollarSign,
  Eye,
  EyeOff
} from 'lucide-react';
import { Transaction, CategoryKey, PaymentMethod, TransactionType } from '../types';
import { CATEGORIES } from '../utils/categories';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { usePrivacy } from '../context/PrivacyContext';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdateCategory: (id: string, newCategory: CategoryKey) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
  onEditTransaction?: (transaction: Transaction) => void;
  initialCategoryFilter?: CategoryKey | null;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onUpdateCategory,
  onDeleteTransaction,
  onOpenAddModal,
  onEditTransaction,
  initialCategoryFilter,
}) => {
  const { hideValues, toggleHideValues } = usePrivacy();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey | 'all'>(
    initialCategoryFilter || 'all'
  );
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Filter & sort
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search term
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const matchesDesc = t.description.toLowerCase().includes(s);
          const matchesBank = t.bankName?.toLowerCase().includes(s);
          const matchesMemo = t.memo?.toLowerCase().includes(s);
          if (!matchesDesc && !matchesBank && !matchesMemo) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

        // Payment method
        if (paymentFilter !== 'all' && t.paymentMethod !== paymentFilter) return false;

        // Recurring only
        if (recurringOnly && !t.isRecurring) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'amount_desc') return Math.abs(b.amount) - Math.abs(a.amount);
        if (sortBy === 'amount_asc') return Math.abs(a.amount) - Math.abs(b.amount);
        return 0;
      });
  }, [transactions, searchTerm, typeFilter, categoryFilter, paymentFilter, recurringOnly, sortBy]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Export filtered transactions to CSV
  const handleExportCSV = () => {
    const headers = ['Data', 'Descricao', 'Valor', 'Tipo', 'Categoria', 'FormaPagamento', 'Banco'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.type,
      CATEGORIES[t.category]?.label || t.category,
      t.paymentMethod,
      t.bankName || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extrato_filtrado_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Lançamentos & Extrato Bancário</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                {filteredTransactions.length} de {transactions.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Gerencie, filtre e categorize suas transações detalhadamente
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
              title="Baixar lista filtrada em CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Lançamento
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por descrição, loja ou banco..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="all">Todos os Tipos</option>
              <option value="expense">Apenas Gastos (Débitos)</option>
              <option value="income">Apenas Entradas (Créditos)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="all">Todas as Categorias</option>
              {Object.values(CATEGORIES).map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white"
            >
              <option value="date_desc">Mais Recentes Primeiro</option>
              <option value="date_asc">Mais Antigos Primeiro</option>
              <option value="amount_desc">Maior Valor (R$)</option>
              <option value="amount_asc">Menor Valor (R$)</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mr-1">Filtros Rápidos:</span>
          <button
            onClick={() => {
              setRecurringOnly(!recurringOnly);
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-md border text-xs transition flex items-center gap-1 ${
              recurringOnly
                ? 'bg-purple-50 text-purple-700 border-purple-200 font-semibold shadow-2xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Repeat className="w-3 h-3" />
            Recorrentes / Assinaturas
          </button>

          {categoryFilter !== 'all' && (
            <button
              onClick={() => setCategoryFilter('all')}
              className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs flex items-center gap-1 font-semibold"
            >
              <span>{CATEGORIES[categoryFilter]?.label}</span>
              <span className="font-bold">✕</span>
            </button>
          )}

          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs flex items-center gap-1 font-semibold"
            >
              <span>"{searchTerm}"</span>
              <span className="font-bold">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Desktop & Tablet Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4">Descrição / Estabelecimento</th>
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Pagamento</th>
              <th className="py-3 px-4 text-right">Valor</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <p className="font-medium text-slate-700">Nenhuma movimentação encontrada com estes filtros.</p>
                  <p className="text-xs text-slate-400 mt-1">Experimente limpar a busca ou os filtros de categoria.</p>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((t) => {
                const cat = CATEGORIES[t.category] || CATEGORIES.outros;
                const isIncome = t.amount > 0;

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                      {formatDateBR(t.date)}
                    </td>

                    {/* Description & metadata */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`p-1.5 rounded-lg flex-shrink-0 ${
                            isIncome
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : 'bg-rose-50 text-rose-600 border border-rose-100'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="truncate max-w-[220px] sm:max-w-xs md:max-w-sm">
                          <p className="font-semibold text-slate-800 truncate">{t.description}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            {t.bankName && <span>{t.bankName}</span>}
                            {t.isRecurring && (
                              <span className="text-purple-600 font-medium flex items-center gap-0.5">
                                <Repeat className="w-3 h-3" />
                                Recorrente
                              </span>
                            )}
                            {t.memo && <span className="italic truncate">"{t.memo}"</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category Dropdown */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={t.category}
                        onChange={(e) => onUpdateCategory(t.id, e.target.value as CategoryKey)}
                        className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md px-2 py-1 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                        style={{ borderLeftColor: cat.color, borderLeftWidth: '3px' }}
                      >
                        {Object.values(CATEGORIES).map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Payment Method Badge */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-xs">
                      <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium text-[11px]">
                        {t.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span
                        className={`font-bold font-mono text-sm ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : ''}
                        {formatCurrency(t.amount, hideValues)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Excluir lançamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< sm screens) */}
      <div className="block sm:hidden divide-y divide-slate-100">
        {paginatedTransactions.length === 0 ? (
          <div className="py-10 px-4 text-center text-slate-400">
            <p className="font-medium text-slate-700">Nenhuma movimentação encontrada.</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste os filtros ou adicione uma transação.</p>
          </div>
        ) : (
          paginatedTransactions.map((t) => {
            const cat = CATEGORIES[t.category] || CATEGORIES.outros;
            const isIncome = t.amount > 0;

            return (
              <div key={t.id} className="p-3.5 space-y-2 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-xs truncate">{t.description}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span>{formatDateBR(t.date)}</span>
                        {t.bankName && <span>• {t.bankName}</span>}
                        {t.isRecurring && (
                          <span className="text-purple-600 font-bold">• Recorrente</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-bold font-mono text-sm block ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : ''}
                      {formatCurrency(t.amount, hideValues)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/60">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <select
                      value={t.category}
                      onChange={(e) => onUpdateCategory(t.id, e.target.value as CategoryKey)}
                      className="text-[11px] bg-slate-50 text-slate-700 border border-slate-200 rounded-md px-2 py-1 font-medium focus:outline-none focus:border-indigo-500 max-w-[150px] truncate"
                      style={{ borderLeftColor: cat.color, borderLeftWidth: '3px' }}
                    >
                      {Object.values(CATEGORIES).map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>

                    <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium truncate">
                      {t.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteTransaction(t.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer min-h-[30px] min-w-[30px] flex items-center justify-center"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <div>
            Página <span className="font-semibold text-slate-800">{page}</span> de{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>

          <div className="flex space-x-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs font-medium"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs font-medium"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
