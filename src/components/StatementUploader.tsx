import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Clipboard,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Building2,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Transaction, StatementSummary } from '../types';
import { parseOFXContent, parseCSVContent, SAMPLE_STATEMENTS } from '../utils/statementParsers';

interface StatementUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (transactions: Transaction[], summary: StatementSummary) => void;
}

export const StatementUploader: React.FC<StatementUploaderProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeUploadTab, setActiveUploadTab] = useState<'file' | 'paste' | 'samples'>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [bankHint, setBankHint] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process standard OFX or CSV file client-side
  const handleBankFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage(`Lendo arquivo "${file.name}"...`);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      const text = await file.text();

      if (extension === 'ofx' || text.includes('<OFX>') || text.includes('<STMTTRN>')) {
        setStatusMessage('Decodificando formato OFX (Open Financial Exchange)...');
        const result = parseOFXContent(text);
        if (result.transactions.length === 0) {
          throw new Error('Nenhuma transação encontrada no arquivo OFX. Verifique se o arquivo não está vazio.');
        }
        onImportSuccess(result.transactions, result.summary);
        onClose();
      } else if (extension === 'csv' || extension === 'tsv' || extension === 'txt') {
        setStatusMessage('Processando colunas do arquivo CSV...');
        const result = parseCSVContent(text, bankHint || file.name.replace(/\.[^/.]+$/, ''));
        if (result.transactions.length === 0) {
          throw new Error(
            'Nenhuma transação reconhecida no CSV. Confira se o arquivo tem colunas de data, descrição e valor.'
          );
        }
        onImportSuccess(result.transactions, result.summary);
        onClose();
      } else {
        throw new Error(
          `Formato "${extension || 'desconhecido'}" não suportado. Exporte o extrato em OFX ou CSV, ou use a aba "Colar Texto".`
        );
      }
    } catch (err: any) {
      console.error('Error handling file:', err);
      setErrorMessage(err.message || 'Erro ao processar arquivo. Tente exportar o extrato em OFX ou CSV.');
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  // Handle paste submission
  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Lendo linhas de texto coladas...');

    try {
      const csvResult = parseCSVContent(pastedText, bankHint || 'Extrato Colado');
      if (csvResult.transactions.length < 2) {
        throw new Error(
          'Não foi possível reconhecer as linhas coladas. Use uma linha por transação, com data, descrição e valor.'
        );
      }
      onImportSuccess(csvResult.transactions, csvResult.summary);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao interpretar texto colado.');
    } finally {
      setIsProcessing(false);
      setStatusMessage(null);
    }
  };

  // Load sample statement
  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_STATEMENTS.find((s) => s.id === sampleId);
    if (sample) {
      const txs = sample.getTransactions();
      const summary: StatementSummary = {
        bankName: sample.bank,
        currency: 'BRL',
        startDate: txs[txs.length - 1]?.date,
        endDate: txs[0]?.date,
      };
      onImportSuccess(txs, summary);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Leitura de Extrato Bancário</h2>
              <p className="text-xs text-slate-500">Importe seu extrato em OFX, CSV ou texto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200 flex space-x-2 text-xs sm:text-sm font-medium overflow-x-auto bg-white">
          <button
            onClick={() => { setActiveUploadTab('file'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeUploadTab === 'file'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            OFX & CSV (Bancos)
          </button>

          <button
            onClick={() => { setActiveUploadTab('paste'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeUploadTab === 'paste'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            Colar Texto
          </button>

          <button
            onClick={() => { setActiveUploadTab('samples'); setErrorMessage(null); }}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeUploadTab === 'samples'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            Extratos Prontos
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs sm:text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-800">Não foi possível ler o extrato</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Processing Loading state */}
          {isProcessing ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Analisando movimentações bancárias...</p>
                <p className="text-xs text-slate-500">{statusMessage || 'Aguarde um instante.'}</p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: OFX / CSV */}
              {activeUploadTab === 'file' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.[0]) handleBankFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 ${
                      isDragging
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50 bg-slate-50/50'
                    }`}
                  >
                    <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Arraste seu arquivo <span className="text-indigo-600">.OFX</span> ou <span className="text-indigo-600">.CSV</span> aqui
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ou clique para selecionar no seu computador ou celular
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".ofx,.csv,.tsv,.txt"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleBankFile(e.target.files[0]);
                      }}
                    />
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      Compatível com todos os bancos brasileiros:
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-600">
                      {['Nubank', 'C6 Bank', 'Bradesco', 'Banco do Brasil', 'Santander', 'Inter', 'Caixa', 'BTG Pactual', 'XP Investimentos', 'Sicoob', 'Sicredi'].map(
                        (bank) => (
                          <span key={bank} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-medium shadow-2xs">
                            {bank}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Colar Texto */}
              {activeUploadTab === 'paste' && (
                <form onSubmit={handlePasteSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cole as linhas do seu extrato bancário:
                    </label>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Exemplo:
05/08/2026  Salário Tech SA  R$ 5.000,00
06/08/2026  iFood Restaurante  -R$ 64,90
07/08/2026  Uber *Ride  -R$ 28,50
08/08/2026  Supermercado Pão de Açúcar  -R$ 380,00"
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="text"
                      value={bankHint}
                      onChange={(e) => setBankHint(e.target.value)}
                      placeholder="Nome do Banco (opcional)"
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white max-w-[200px]"
                    />

                    <button
                      type="submit"
                      disabled={!pastedText.trim()}
                      className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Processar Texto</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: Extratos Prontos (Samples) */}
              {activeUploadTab === 'samples' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Teste o aplicativo instantaneamente com extratos reais pré-carregados:
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {SAMPLE_STATEMENTS.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => handleSelectSample(sample.id)}
                        className="text-left p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-300 transition group flex items-center justify-between shadow-2xs cursor-pointer"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition">
                              {sample.name}
                            </span>
                            <span className="px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                              {sample.bank}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">{sample.description}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-white border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white text-slate-500 transition flex-shrink-0 ml-3 shadow-2xs">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Privacidade: Leitura local e segura
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition font-medium cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
