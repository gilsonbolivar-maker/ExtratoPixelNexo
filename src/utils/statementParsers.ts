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

  // Sem cabeçalho reconhecido: assume data / descrição / valor e lê desde a
  // primeira linha (headerIndex fica em -1, então o laço começa no índice 0).
  if (headerIndex === -1) {
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
