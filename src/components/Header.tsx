import React from 'react';
import { Wallet, UploadCloud, Sparkles, RefreshCw, Download, Plus, FileText, CheckCircle2, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { StatementSummary } from '../types';
import { usePrivacy } from '../context/PrivacyContext';
import { ThemeSelector } from './ThemeSelector';

interface HeaderProps {
  summary: StatementSummary | null;
  transactionCount: number;
  onOpenUpload: () => void;
  onLoadSample: (sampleId: string) => void;
  onOpenAddModal: () => void;
  onReset: () => void;
  onExportJSON: () => void;
  activeTab: 'dashboard' | 'transactions' | 'ai_advisor' | 'budget';
  setActiveTab: (tab: 'dashboard' | 'transactions' | 'ai_advisor' | 'budget') => void;
}

export const Header: React.FC<HeaderProps> = ({
  summary,
  transactionCount,
  onOpenUpload,
  onLoadSample,
  onOpenAddModal,
  onReset,
  onExportJSON,
  activeTab,
  setActiveTab,
}) => {
  const { hideValues, toggleHideValues } = usePrivacy();

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
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-600" />
                  Processado via IA
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium uppercase tracking-wider truncate">
                {summary?.bankName ? (
                  <span className="text-slate-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full inline-block flex-shrink-0"></span>
                    <span className="truncate">{summary.bankName} • {transactionCount} lançamentos</span>
                  </span>
                ) : (
                  'Análise de Extrato Bancário'
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons & Quick Sample Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 flex-shrink-0">
            {/* Quick Demo Selector for Desktop */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-400 px-2 font-bold text-[10px] uppercase tracking-wider">Exemplos:</span>
              <button
                id="btn-sample-nubank"
                onClick={() => onLoadSample('nubank_month')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 shadow-2xs transition cursor-pointer"
              >
                Nubank
              </button>
              <button
                id="btn-sample-c6"
                onClick={() => onLoadSample('c6_corrente')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 shadow-2xs transition cursor-pointer"
              >
                C6 Bank
              </button>
              <button
                id="btn-sample-inter"
                onClick={() => onLoadSample('inter_cartao')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 shadow-2xs transition cursor-pointer"
              >
                Inter
              </button>
            </div>

            {/* Mobile / Tablet Quick Sample Select */}
            <div className="lg:hidden">
              <select
                id="select-sample-mobile"
                onChange={(e) => {
                  if (e.target.value) {
                    onLoadSample(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="text-xs bg-white text-slate-700 border border-slate-200 rounded-lg px-2 py-1.5 font-medium focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                title="Carregar exemplo de extrato"
              >
                <option value="" disabled>Exemplos ▾</option>
                <option value="nubank_month">Nubank</option>
                <option value="c6_corrente">C6 Bank</option>
                <option value="inter_cartao">Banco Inter</option>
              </select>
            </div>

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

            {/* Export / Reset */}
            {transactionCount > 0 && (
              <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
                <button
                  id="btn-export-data"
                  onClick={onExportJSON}
                  title="Exportar dados como JSON"
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  id="btn-reset-data"
                  onClick={onReset}
                  title="Limpar todos os dados"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
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
            id="nav-tab-advisor"
            onClick={() => setActiveTab('ai_advisor')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer flex-shrink-0 min-h-[36px] ${
              activeTab === 'ai_advisor'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Diagnóstico IA
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
