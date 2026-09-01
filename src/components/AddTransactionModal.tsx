import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, Tag, CreditCard, Building2 } from 'lucide-react';
import { Transaction, CategoryKey, PaymentMethod, TransactionType } from '../types';
import { CATEGORIES } from '../utils/categories';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
}) => {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<CategoryKey>('alimentacao');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bankName, setBankName] = useState('Manual');
  const [isRecurring, setIsRecurring] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(rawVal) || rawVal <= 0 || !description.trim()) return;

    const finalAmount = type === 'expense' ? -Math.abs(rawVal) : Math.abs(rawVal);

    onAddTransaction({
      description: description.trim(),
      amount: finalAmount,
      type,
      category,
      paymentMethod,
      date,
      bankName,
      isRecurring,
    });

    // Reset & close
    setDescription('');
    setAmountStr('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Novo Lançamento Manual</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Type Toggle (Gasto vs Entrada) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (category === 'renda') setCategory('alimentacao');
              }}
              className={`py-1.5 rounded-md font-bold text-xs transition ${
                type === 'expense'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Despesa / Gasto (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('renda');
              }}
              className={`py-1.5 rounded-md font-bold text-xs transition ${
                type === 'income'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Receita / Entrada (+)
            </button>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado Pão de Açúcar, Uber, Salário..."
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs sm:text-sm"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono font-bold text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
              >
                {Object.values(CATEGORIES).map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-xs">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
              >
                <option value="pix">PIX</option>
                <option value="credito">Cartão de Crédito</option>
                <option value="debito">Cartão de Débito</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="ted_doc">TED / Transferência</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          {/* Recurring checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="chk-recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="chk-recurring" className="text-xs text-slate-600 cursor-pointer">
              Gasto recorrente / Mensalidade (ex: Netflix, Aluguel, Academia)
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-xs text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Salvar Lançamento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
