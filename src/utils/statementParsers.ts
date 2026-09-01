import { Transaction, StatementSummary, CategoryKey, PaymentMethod } from '../types';
import { autoCategorizeDescription } from './categories';

// Generate unique ID
function uid(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Format date YYYY-MM-DD
function normalizeDateStr(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];

  // OFX date format: YYYYMMDD or YYYYMMDDHHMMSS
  const ofxMatch = rawDate.match(/^(\d{4})(\d{2})(\d{2})/);
  if (ofxMatch) {
    return `${ofxMatch[1]}-${ofxMatch[2]}-${ofxMatch[3]}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = rawDate.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    let year = brMatch[3];
    if (year.length === 2) year = '20' + year;
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD
  const isoMatch = rawDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().split('T')[0];
}

// Parse Brazilian number string e.g. "-1.250,50" or "1250.50" or "(50,00)"
export function parseFinancialAmount(valStr: string): number {
  if (typeof valStr === 'number') return valStr;
  if (!valStr) return 0;

  let clean = valStr.trim();
  const isNegativeParenthesis = clean.startsWith('(') && clean.endsWith(')');
  if (isNegativeParenthesis) {
    clean = clean.replace(/[()]/g, '');
  }

  // Remove currency signs e.g. R$, $, EUR
  clean = clean.replace(/[R$€£\s]/g, '');

  const hasComma = clean.includes(',');
  const hasDot = clean.includes('.');

  if (hasComma && hasDot) {
    // Check if dot is thousand separator: e.g. 1.250,50 vs 1,250.50
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      clean = clean.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    clean = clean.replace(',', '.');
  }

  let num = parseFloat(clean);
  if (isNaN(num)) return 0;
  if (isNegativeParenthesis && num > 0) {
    num = -num;
  }
  return num;
}

/**
 * Robust OFX (Open Financial Exchange) Parser
 */
export function parseOFXContent(ofxText: string): { transactions: Transaction[]; summary: StatementSummary } {
  const transactions: Transaction[] = [];
  
  // Extract Bank Name / Org
  const orgMatch = ofxText.match(/<ORG>(.*?)<\/?ORG>/i) || ofxText.match(/<ORG>(.*?)(?=\n|\r|<)/i);
  const bankName = orgMatch ? orgMatch[1].trim() : 'Banco';

  // Extract Account ID
  const acctMatch = ofxText.match(/<ACCTID>(.*?)<\/?ACCTID>/i) || ofxText.match(/<ACCTID>(.*?)(?=\n|\r|<)/i);
  const accountNumber = acctMatch ? acctMatch[1].trim() : undefined;

  // Extract Ledger Balance
  const balMatch = ofxText.match(/<BALAMT>(.*?)<\/?BALAMT>/i) || ofxText.match(/<BALAMT>(.*?)(?=\n|\r|<)/i);
  const finalBalance = balMatch ? parseFinancialAmount(balMatch[1].trim()) : undefined;

  // Extract Currency
  const curMatch = ofxText.match(/<CURDEF>(.*?)<\/?CURDEF>/i) || ofxText.match(/<CURDEF>(.*?)(?=\n|\r|<)/i);
  const currency = curMatch ? curMatch[1].trim() : 'BRL';

  // Find all <STMTTRN> blocks
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;
  let rawBlocks: string[] = [];

  while ((match = stmtTrnRegex.exec(ofxText)) !== null) {
    rawBlocks.push(match[1]);
  }

  // If no closing tags, try split
  if (rawBlocks.length === 0 && ofxText.includes('<STMTTRN>')) {
    const parts = ofxText.split(/<STMTTRN>/i);
    parts.shift(); // remove header
    rawBlocks = parts.map((p) => p.split(/<\/BANKTRANLIST>/i)[0]);
  }

  for (const block of rawBlocks) {
    const typeMatch = block.match(/<TRNTYPE>(.*?)<\/?TRNTYPE>/i) || block.match(/<TRNTYPE>(.*?)(?=\n|\r|<)/i);
    const dateMatch = block.match(/<DTPOSTED>(.*?)<\/?DTPOSTED>/i) || block.match(/<DTPOSTED>(.*?)(?=\n|\r|<)/i);
    const amtMatch = block.match(/<TRNAMT>(.*?)<\/?TRNAMT>/i) || block.match(/<TRNAMT>(.*?)(?=\n|\r|<)/i);
    const memoMatch = block.match(/<MEMO>(.*?)<\/?MEMO>/i) || block.match(/<MEMO>(.*?)(?=\n|\r|<)/i);
    const nameMatch = block.match(/<NAME>(.*?)<\/?NAME>/i) || block.match(/<NAME>(.*?)(?=\n|\r|<)/i);

    const rawAmt = amtMatch ? amtMatch[1].trim() : '0';
    const amount = parseFinancialAmount(rawAmt);
    const rawDate = dateMatch ? dateMatch[1].trim() : '';
    const date = normalizeDateStr(rawDate);
    const desc = (nameMatch ? nameMatch[1].trim() : (memoMatch ? memoMatch[1].trim() : 'Transação')).replace(/&amp;/g, '&');
    const memo = memoMatch ? memoMatch[1].trim().replace(/&amp;/g, '&') : undefined;

    const auto = autoCategorizeDescription(`${desc} ${memo || ''}`, amount);

    transactions.push({
      id: uid(),
      date,
      description: desc || 'Transação sem descrição',
      originalDescription: desc,
      amount,
      type: amount >= 0 ? 'income' : 'expense',
      category: auto.category,
      paymentMethod: auto.paymentMethod,
      bankName,
      account: accountNumber,
      memo,
      isRecurring: auto.isRecurring,
    });
  }

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    transactions,
    summary: {
      bankName,
      accountNumber,
      currency,
      finalBalance,
      startDate: transactions.length > 0 ? transactions[transactions.length - 1].date : undefined,
      endDate: transactions.length > 0 ? transactions[0].date : undefined,
    },
  };
}

/**
 * Robust CSV / TSV Parser
 */
export function parseCSVContent(csvText: string, customBankName?: string): { transactions: Transaction[]; summary: StatementSummary } {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { transactions: [], summary: { currency: 'BRL' } };
  }

  // Detect separator: comma, semicolon, tab
  const sample = lines.slice(0, 5).join('\n');
  const commaCount = (sample.match(/,/g) || []).length;
  const semiCount = (sample.match(/;/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;

  let separator = ',';
  if (semiCount > commaCount && semiCount > tabCount) separator = ';';
  if (tabCount > commaCount && tabCount > semiCount) separator = '\t';

  // Split lines into tokens respecting quotes
  function parseLine(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        tokens.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    tokens.push(current.trim().replace(/^["']|["']$/g, ''));
    return tokens;
  }

  // Find header index
  let headerIndex = -1;
  let dateCol = -1;
  let descCol = -1;
  let amountCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let catCol = -1;

  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cols = parseLine(lines[i]).map((c) => c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    
    // Check for date column
    const dIdx = cols.findIndex((c) => c.includes('data') || c.includes('date') || c.includes('dt'));
    // Check for description column
    const descIdx = cols.findIndex((c) => c.includes('historico') || c.includes('descricao') || c.includes('description') || c.includes('estabelecimento') || c.includes('lancamento') || c.includes('titulo') || c.includes('detalhes') || c.includes('item'));
    // Check for value/amount
    const amtIdx = cols.findIndex((c) => (c.includes('valor') || c.includes('amount') || c.includes('quantia')) && !c.includes('saldo'));
    const debIdx = cols.findIndex((c) => c.includes('debito') || c.includes('saida') || c.includes('gasto'));
    const credIdx = cols.findIndex((c) => c.includes('credito') || c.includes('entrada') || c.includes('receb'));
    const cIdx = cols.findIndex((c) => c.includes('categoria') || c.includes('category'));

    if (dIdx !== -1 && (descIdx !== -1 || amtIdx !== -1 || debIdx !== -1)) {
      headerIndex = i;
      dateCol = dIdx;
      descCol = descIdx !== -1 ? descIdx : 1;
      amountCol = amtIdx;
      debitCol = debIdx;
      creditCol = credIdx;
      catCol = cIdx;
      break;
    }
  }

  // Fallback defaults if no header found
  if (headerIndex === -1) {
    headerIndex = 0;
    dateCol = 0;
    descCol = 1;
    amountCol = 2;
  }

  const transactions: Transaction[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    if (cols.length <= 1) continue;

    const rawDate = cols[dateCol] || '';
    const date = normalizeDateStr(rawDate);
    const desc = cols[descCol] || 'Transação';

    let amount = 0;
    if (amountCol !== -1 && cols[amountCol] !== undefined) {
      amount = parseFinancialAmount(cols[amountCol]);
    } else if (debitCol !== -1 || creditCol !== -1) {
      const debit = debitCol !== -1 && cols[debitCol] ? parseFinancialAmount(cols[debitCol]) : 0;
      const credit = creditCol !== -1 && cols[creditCol] ? parseFinancialAmount(cols[creditCol]) : 0;
      if (credit > 0) {
        amount = Math.abs(credit);
      } else if (debit !== 0) {
        amount = -Math.abs(debit);
      }
    }

    if (amount === 0 && !desc) continue;

    const auto = autoCategorizeDescription(desc, amount);
    let category: CategoryKey = auto.category;
    if (catCol !== -1 && cols[catCol]) {
      const manualCat = cols[catCol].toLowerCase();
      if (manualCat.includes('aliment')) category = 'alimentacao';
      else if (manualCat.includes('transp')) category = 'transporte';
      else if (manualCat.includes('morad') || manualCat.includes('casa')) category = 'moradia';
      else if (manualCat.includes('saud')) category = 'saude';
      else if (manualCat.includes('educ')) category = 'educacao';
      else if (manualCat.includes('lazer')) category = 'lazer';
      else if (manualCat.includes('compra')) category = 'compras';
      else if (manualCat.includes('assin')) category = 'assinaturas';
      else if (manualCat.includes('renda') || manualCat.includes('salario')) category = 'renda';
    }

    transactions.push({
      id: uid(),
      date,
      description: desc,
      originalDescription: desc,
      amount,
      type: amount >= 0 ? 'income' : 'expense',
      category,
      paymentMethod: auto.paymentMethod,
      bankName: customBankName || 'Extrato Bancário',
      isRecurring: auto.isRecurring,
    });
  }

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    transactions,
    summary: {
      bankName: customBankName || 'Extrato CSV',
      currency: 'BRL',
      startDate: transactions.length > 0 ? transactions[transactions.length - 1].date : undefined,
      endDate: transactions.length > 0 ? transactions[0].date : undefined,
    },
  };
}

/**
 * Sample / Mock statements for testing instantly
 */
export const SAMPLE_STATEMENTS: { id: string; name: string; bank: string; description: string; getTransactions: () => Transaction[] }[] = [
  {
    id: 'nubank_month',
    name: 'Nubank - Extrato Mensal Completo',
    bank: 'Nubank',
    description: 'Extrato real com salário, compras em mercado, iFood, Uber, Netflix, aluguel e PIX variados.',
    getTransactions: () => [
      { id: 'nb-1', date: '2026-08-05', description: 'Salário Empresa Tech SA', amount: 6850.00, type: 'income', category: 'renda', paymentMethod: 'ted_doc', bankName: 'Nubank', isRecurring: true },
      { id: 'nb-2', date: '2026-08-06', description: 'Transferência PIX Aluguel + Condomínio', amount: -2100.00, type: 'expense', category: 'moradia', paymentMethod: 'pix', bankName: 'Nubank', isRecurring: true },
      { id: 'nb-3', date: '2026-08-06', description: 'Enel Distribuição Energia', amount: -185.40, type: 'expense', category: 'moradia', paymentMethod: 'debito', bankName: 'Nubank', isRecurring: true },
      { id: 'nb-4', date: '2026-08-07', description: 'Comgás Gás Natural', amount: -62.30, type: 'expense', category: 'moradia', paymentMethod: 'debito', bankName: 'Nubank', isRecurring: true },
      { id: 'nb-5', date: '2026-08-08', description: 'Supermercado Pão de Açúcar', amount: -489.90, type: 'expense', category: 'alimentacao', paymentMethod: 'credito', bankName: 'Nubank' },
      { id: 'nb-6', date: '2026-08-09', description: 'Uber *Ride 10492 São Paulo', amount: -28.90, type: 'expense', category: 'transporte', paymentMethod: 'credito', bankName: 'Nubank' },
      { id: 'nb-7', date: '2026-08-10', description: 'iFood *Restaurante Japonês', amount: -112.50, type: 'expense', category: 'alimentacao', paymentMethod: 'pix', bankName: 'Nubank' },
      { id: 'nb-8', date: '2026-08-11', description: 'Drogasil Medicamentos e Vitaminas', amount: -145.80, type: 'expense', category: 'saude', paymentMethod: 'credito', bankName: 'Nubank' },
      { id: 'nb-9', date: '2026-08-12', description: 'Netflix Assinatura Mensal', amount: -55.90, type: 'expense', category: 'assinaturas', paymentMethod: 'credito', bankName: 'Nubank', isRecurring: true },
      { id: 'nb-10', date: '2026-08-12', description: 'Spotify Premium Family', amount: -34.90, type: 'expense', category: 'assinaturas', paymentMethod: 'credito', bankName: 'Nubank', isRecurring: true },
      { id: 'nb-11', date: '2026-08-13', description: 'Posto Shell Combustível Gasolina', amount: -220.00, type: 'expense', category: 'transporte', paymentMethod: 'debito', bankName: 'Nubank' },
      { id: 'nb-12', date: '2026-08-14', description: 'Smart Fit Mensalidade Academia', amount: -129.90, type: 'expense', category: 'assinaturas', paymentMethod: 'credito', bankName: 'Nubank', isRecurring: true },
      { id: 'nb-13', date: '2026-08-15', description: 'Rendimento NuConta Automático', amount: 48.75, type: 'income', category: 'renda', paymentMethod: 'ted_doc', bankName: 'Nubank' },
      { id: 'nb-14', date: '2026-08-16', description: 'Amazon.com.br Livros e Cabos', amount: -189.00, type: 'expense', category: 'compras', paymentMethod: 'credito', bankName: 'Nubank' },
      { id: 'nb-15', date: '2026-08-17', description: 'iFood *Hamburgueria Artesanal', amount: -86.00, type: 'expense', category: 'alimentacao', paymentMethod: 'pix', bankName: 'Nubank' },
      { id: 'nb-16', date: '2026-08-18', description: 'Sem Parar Pedágios Rodovia', amount: -64.80, type: 'expense', category: 'transporte', paymentMethod: 'debito', bankName: 'Nubank' },
      { id: 'nb-17', date: '2026-08-20', description: 'Cinemark Cinema + Pipoca', amount: -94.00, type: 'expense', category: 'lazer', paymentMethod: 'credito', bankName: 'Nubank' },
      { id: 'nb-18', date: '2026-08-22', description: 'Supermercado Carrefour Express', amount: -245.30, type: 'expense', category: 'alimentacao', paymentMethod: 'credito', bankName: 'Nubank' },
      { id: 'nb-19', date: '2026-08-24', description: 'Curso Online Alura Dev', amount: -95.00, type: 'expense', category: 'educacao', paymentMethod: 'credito', bankName: 'Nubank', isRecurring: true },
      { id: 'nb-20', date: '2026-08-26', description: 'Uber *Ride Retorno', amount: -34.50, type: 'expense', category: 'transporte', paymentMethod: 'credito', bankName: 'Nubank' },
      { id: 'nb-21', date: '2026-08-28', description: 'Restaurante Outback Steakhouse', amount: -210.00, type: 'expense', category: 'alimentacao', paymentMethod: 'credito', bankName: 'Nubank' },
      { id: 'nb-22', date: '2026-08-29', description: 'PIX Freelance Design Web', amount: 1200.00, type: 'income', category: 'renda', paymentMethod: 'pix', bankName: 'Nubank' },
      { id: 'nb-23', date: '2026-08-30', description: 'Tarifa IOF Internacional', amount: -14.20, type: 'expense', category: 'financeiro', paymentMethod: 'credito', bankName: 'Nubank' },
    ],
  },
  {
    id: 'c6_corrente',
    name: 'C6 Bank - Conta Corrente & Cartão Carbon',
    bank: 'C6 Bank',
    description: 'Extrato real com salário via portabilidade, compras C6 Carbon, C6 Tag de pedágio, boletos e rendimento CDB.',
    getTransactions: () => [
      { id: 'c6-1', date: '2026-08-01', description: 'TED PORTABILIDADE SALARIO EMPRESA SA', amount: 8200.00, type: 'income', category: 'renda', paymentMethod: 'ted_doc', bankName: 'C6 Bank', isRecurring: true },
      { id: 'c6-2', date: '2026-08-02', description: 'PAG BOLETO CONDOMINIO RESIDENCIAL', amount: -1450.00, type: 'expense', category: 'moradia', paymentMethod: 'boleto', bankName: 'C6 Bank', isRecurring: true },
      { id: 'c6-3', date: '2026-08-05', description: 'PAG BOLETO MENSALIDADE POS GRADUACAO', amount: -980.00, type: 'expense', category: 'educacao', paymentMethod: 'boleto', bankName: 'C6 Bank', isRecurring: true },
      { id: 'c6-4', date: '2026-08-05', description: 'DEB SULAMERICA SAUDE CONVENIO', amount: -650.00, type: 'expense', category: 'saude', paymentMethod: 'debito', bankName: 'C6 Bank', isRecurring: true },
      { id: 'c6-5', date: '2026-08-08', description: 'COMPRA C6 CARBON ASSAI ATACADISTA', amount: -780.40, type: 'expense', category: 'alimentacao', paymentMethod: 'credito', bankName: 'C6 Bank' },
      { id: 'c6-6', date: '2026-08-10', description: 'PIX ENVIADO AUTO MECANICA CARVALHO', amount: -450.00, type: 'expense', category: 'transporte', paymentMethod: 'pix', bankName: 'C6 Bank' },
      { id: 'c6-7', date: '2026-08-12', description: 'DEB AUTOMATICO C6 TAG PEDAGIO VELOX', amount: -68.50, type: 'expense', category: 'transporte', paymentMethod: 'debito', bankName: 'C6 Bank' },
      { id: 'c6-8', date: '2026-08-18', description: 'PAGAMENTO FATURA CARTAO C6 BLACK', amount: -1850.00, type: 'expense', category: 'compras', paymentMethod: 'boleto', bankName: 'C6 Bank' },
      { id: 'c6-9', date: '2026-08-25', description: 'RESGATE RENDIMENTO CDB C6 POS FIXADO', amount: 1500.00, type: 'income', category: 'renda', paymentMethod: 'ted_doc', bankName: 'C6 Bank' },
    ],
  },
  {
    id: 'inter_cartao',
    name: 'Banco Inter - Fatura de Cartão de Crédito',
    bank: 'Banco Inter',
    description: 'Fatura detalhada com compras parceladas, lazer, assinaturas digitais e viagens.',
    getTransactions: () => [
      { id: 'int-1', date: '2026-08-02', description: 'APPLE.COM/BILL SERVICOS', amount: -29.90, type: 'expense', category: 'assinaturas', paymentMethod: 'credito', bankName: 'Banco Inter', isRecurring: true },
      { id: 'int-2', date: '2026-08-04', description: 'AIRBNB HOSPEDAGEM FERIADO', amount: -840.00, type: 'expense', category: 'lazer', paymentMethod: 'credito', bankName: 'Banco Inter' },
      { id: 'int-3', date: '2026-08-06', description: 'ZARA SHOPPING ROUPAS TRABALHO', amount: -390.00, type: 'expense', category: 'compras', paymentMethod: 'credito', bankName: 'Banco Inter' },
      { id: 'int-4', date: '2026-08-10', description: 'RESTAURANTE COCO BAMBU JANTAR', amount: -320.00, type: 'expense', category: 'alimentacao', paymentMethod: 'credito', bankName: 'Banco Inter' },
      { id: 'int-5', date: '2026-08-14', description: 'MERCADOLIVRE ELETRONICOS', amount: -249.90, type: 'expense', category: 'compras', paymentMethod: 'credito', bankName: 'Banco Inter' },
      { id: 'int-6', date: '2026-08-18', description: 'POSTO IPIRANGA ABASTECIMENTO', amount: -195.00, type: 'expense', category: 'transporte', paymentMethod: 'credito', bankName: 'Banco Inter' },
      { id: 'int-7', date: '2026-08-25', description: 'DROGA RAIA COSMETICOS E REMEDIOS', amount: -88.70, type: 'expense', category: 'saude', paymentMethod: 'credito', bankName: 'Banco Inter' },
      { id: 'int-8', date: '2026-08-28', description: 'CASHBACK INTER SHOP RECEBIDO', amount: 35.40, type: 'income', category: 'renda', paymentMethod: 'ted_doc', bankName: 'Banco Inter' },
    ],
  },
];
