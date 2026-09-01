import React, { useEffect, useRef, useState } from 'react';
import { Wallet, UploadCloud, ShieldCheck, Trash2, Download, Plus, FileText, CheckCircle2, ChevronDown, Eye, EyeOff, MoreVertical, Landmark, User } from 'lucide-react';
import { BankAccount } from '../types';
import { usePrivacy } from '../context/PrivacyContext';
import { ThemeSelector } from './ThemeSelector';

interface HeaderProps {
  banks: BankAccount[];
  selectedBank: string | null;
  onSelectBank: (bank: string | null) => void;
  transactionCount: number;
  onOpenUpload: () => void;
  onOpenAddModal: () => void;
  onClearBank: (bank: string) => void;
  onReset: () => void;
  onExportJSON: () => void;
  activeTab: 'dashboard' | 'transactions' | 'budget';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'budget') => void;
}

export const Header: React.FC<HeaderProps> = ({
  banks,
  selectedBank,
  onSelectBank,
  transactionCount,
  onOpenUpload,
  onOpenAddModal,
  onClearBank,
  onReset,
  onExportJSON,
  activeTab,
  setActiveTab,
}) => {
  const { hideValues, toggleHideValues } = usePrivacy();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora
  useEffect(() => {
    if (!isMenuOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isMenuOpen]);

  const scopeLabel = selectedBank ?? 'Meu consolidado';
  const totalCount = banks.reduce((sum, bank) => sum + bank.count, 0);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-18 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm flex-shrink-0">
              $
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  Extrato<span className="text-indigo-600">PixelNexo</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                  100% offline
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium uppercase tracking-wider truncate">
                {transactionCount > 0 ? (
                  <span className="text-slate-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full inline-block flex-shrink-0"></span>
                    <span className="truncate">{scopeLabel} • {transactionCount} lançamentos</span>
                  </span>
                ) : (
                  'Análise de Extrato Bancário'
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons & Quick Sample Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
            {/* Seletor de conta: consolidado da pessoa ou um banco especifico */}
            {banks.length > 0 && (
              <div className="relative">
                <select
                  id="select-bank-scope"
                  value={selectedBank ?? ''}
                  onChange={(event) => onSelectBank(event.target.value || null)}
                  title="Escolher entre o consolidado pessoal e cada banco"
                  className="appearance-none max-w-[9.5rem] sm:max-w-none text-xs bg-white text-slate-700 border border-slate-200 rounded-lg pl-7 pr-6 py-1.5 font-semibold focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer min-h-[34px] truncate"
                >
                  <option value="">Meu consolidado ({totalCount})</option>
                  {banks.map((bank) => (
                    <option key={bank.name} value={bank.name}>
                      {bank.name} ({bank.count})
                    </option>
                  ))}
                </select>
                {selectedBank ? (
                  <Landmark className="w-3.5 h-3.5 text-indigo-600 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                ) : (
                  <User className="w-3.5 h-3.5 text-indigo-600 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Theme Selector Dropdown */}
            <ThemeSelector />

            {/* Privacy Mode Toggle (Esconder / Mostrar Valores) */}
            <button
              id="btn-toggle-privacy-mode"
              onClick={toggleHideValues}
              title={hideValues ? 'Mostrar valores monetários' : 'Ocultar valores (Modo Privacidade)'}
              aria-label="Modo Privacidade"
              className={`inline-flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer min-h-[34px] min-w-[34px] ${
                hideValues
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              {hideValues ? (
                <EyeOff className="w-4 h-4 text-amber-600 sm:mr-1.5" />
              ) : (
                <Eye className="w-4 h-4 text-slate-500 sm:mr-1.5" />
              )}
              <span className="hidden sm:inline">
                {hideValues ? 'Oculto' : 'Ocultar'}
              </span>
            </button>

            {/* Nova Transação */}
            <button
              id="btn-add-transaction"
              onClick={onOpenAddModal}
              title="Adicionar lançamento manual"
              className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition cursor-pointer min-h-[34px] min-w-[34px]"
            >
              <Plus className="w-4 h-4 text-indigo-600 sm:mr-1" />
              <span className="hidden sm:inline">Lançamento</span>
            </button>

            {/* Importar Extrato (Main CTA) */}
            <button
              id="btn-upload-statement"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95 cursor-pointer min-h-[34px]"
            >
              <UploadCloud className="w-4 h-4 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">Importar</span>
              <span className="hidden sm:inline">Extrato</span>
            </button>

            {/* Menu de dados: exportar e limpar */}
            {transactionCount > 0 && (
              <div className="relative" ref={menuRef}>
                <button
                  id="btn-data-menu"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  title="Exportar ou limpar dados"
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 transition cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-40 animate-fadeIn"
                  >
                    <button
                      role="menuitem"
                      onClick={() => { setIsMenuOpen(false); onExportJSON(); }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      Exportar backup (JSON)
                    </button>

                    {selectedBank && (
                      <button
                        role="menuitem"
                        onClick={() => { setIsMenuOpen(false); onClearBank(selectedBank); }}
                        className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition flex items-center gap-2.5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">Remover "{selectedBank}"</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      role="menuitem"
                      onClick={() => { setIsMenuOpen(false); onReset(); }}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 flex-shrink-0" />
                      Limpar todos os dados
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-slate-100 pt-1.5 pb-2 overflow-x-auto scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer flex-shrink-0 min-h-[36px] ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Visão Geral
          </button>

          <button
            id="nav-tab-transactions"
            onClick={() => setActiveTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer flex-shrink-0 min-h-[36px] ${
              activeTab === 'transactions'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Transações ({transactionCount})
          </button>

          <button
            id="nav-tab-budget"
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer flex-shrink-0 min-h-[36px] ${
              activeTab === 'budget'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>🎯</span>
            Metas & Orçamentos
          </button>
        </div>
      </div>
    </header>
  );
};
