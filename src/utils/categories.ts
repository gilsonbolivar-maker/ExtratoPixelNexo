import { CategoryInfo, CategoryKey, PaymentMethod, TransactionType } from '../types';

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  moradia: {
    key: 'moradia',
    label: 'Moradia & Contas',
    color: '#3b82f6', // blue-500
    bgLight: 'rgba(59, 130, 246, 0.15)',
    icon: 'Home',
    isEssential: true,
  },
  alimentacao: {
    key: 'alimentacao',
    label: 'Alimentação & Supermercado',
    color: '#f97316', // orange-500
    bgLight: 'rgba(249, 115, 22, 0.15)',
    icon: 'Utensils',
    isEssential: true,
  },
  transporte: {
    key: 'transporte',
    label: 'Transporte & Combustível',
    color: '#06b6d4', // cyan-500
    bgLight: 'rgba(6, 182, 212, 0.15)',
    icon: 'Car',
    isEssential: true,
  },
  saude: {
    key: 'saude',
    label: 'Saúde & Farmácia',
    color: '#ef4444', // red-500
    bgLight: 'rgba(239, 68, 68, 0.15)',
    icon: 'HeartPulse',
    isEssential: true,
  },
  educacao: {
    key: 'educacao',
    label: 'Educação & Cursos',
    color: '#8b5cf6', // violet-500
    bgLight: 'rgba(139, 92, 246, 0.15)',
    icon: 'GraduationCap',
    isEssential: true,
  },
  lazer: {
    key: 'lazer',
    label: 'Lazer & Entretenimento',
    color: '#ec4899', // pink-500
    bgLight: 'rgba(236, 72, 153, 0.15)',
    icon: 'Sparkles',
    isEssential: false,
  },
  compras: {
    key: 'compras',
    label: 'Compras & Vestuário',
    color: '#eab308', // yellow-500
    bgLight: 'rgba(234, 179, 8, 0.15)',
    icon: 'ShoppingBag',
    isEssential: false,
  },
  assinaturas: {
    key: 'assinaturas',
    label: 'Assinaturas & Serviços Digitais',
    color: '#14b8a6', // teal-500
    bgLight: 'rgba(20, 184, 166, 0.15)',
    icon: 'CreditCard',
    isEssential: false,
  },
  financeiro: {
    key: 'financeiro',
    label: 'Taxas, Juros & Investimentos',
    color: '#64748b', // slate-500
    bgLight: 'rgba(100, 116, 139, 0.15)',
    icon: 'Landmark',
    isEssential: false,
  },
  renda: {
    key: 'renda',
    label: 'Salário & Entradas',
    color: '#10b981', // emerald-500
    bgLight: 'rgba(16, 185, 129, 0.15)',
    icon: 'ArrowDownLeft',
    isEssential: false,
  },
  outros: {
    key: 'outros',
    label: 'Outros & Diversos',
    color: '#a855f7', // purple-500
    bgLight: 'rgba(168, 85, 247, 0.15)',
    icon: 'MoreHorizontal',
    isEssential: false,
  },
};

const KEYWORD_RULES: { keywords: string[]; category: CategoryKey; paymentMethod?: PaymentMethod }[] = [
  // Renda / Entradas
  {
    keywords: ['salario', 'remuneracao', 'ted recebida', 'pix recebido', 'pagamento recebido', 'rendimento', 'pro-labore', 'prolabore', 'deposito', 'resgate', 'dividendos', 'jcp', 'cashback', 'estorno'],
    category: 'renda',
  },
  // Alimentação
  {
    keywords: ['ifood', 'rappi', 'ubereats', 'ze delivery', 'supermercado', 'mercado', 'carrefour', 'pao de acucar', 'extra', 'assai', 'atacadista', 'dia%', 'restaurante', 'bar', 'padaria', 'panificadora', 'lanchonete', 'mcdonald', 'burger king', 'subway', 'outback', 'habibs', 'churrascaria', 'pizzaria', 'acougue', 'hortifruti', 'sacolao', 'cafe', 'starbucks', 'coco bambu'],
    category: 'alimentacao',
  },
  // Moradia & Contas
  {
    keywords: ['aluguel', 'condominio', 'iptu', 'enel', 'eletropaulo', 'cpfl', 'light', 'cemig', 'sabesp', 'sanepar', 'copasa', 'comgas', 'naturgy', 'claro net', 'vivo fibra', 'tim ultra', 'oi fibra', 'energia', 'agua', 'luz', 'gas', 'imovel'],
    category: 'moradia',
  },
  // Transporte
  {
    keywords: ['uber', '99app', '99 app', 'cabify', 'posto', 'gasolina', 'combustivel', 'ipva', 'estacionamento', 'estapar', 'sem parar', 'veloe', 'conectcar', 'pedagio', 'bilhete unico', 'metro', 'onibus', 'oficina', 'mecanica', 'auto posto', 'shell', 'ipiranga', 'br petrobras'],
    category: 'transporte',
  },
  // Saúde & Farmácia
  {
    keywords: ['farmacia', 'drogaria', 'drogasil', 'droga raia', 'pague menos', 'sao paulo', 'panvel', 'consulta', 'medico', 'dentista', 'odont', 'hospital', 'laboratorio', 'fleury', 'lavoisier', 'delboni', 'unimed', 'bradesco saude', 'sulamerica', 'amil', 'psicolog'],
    category: 'saude',
  },
  // Educação
  {
    keywords: ['escola', 'colegio', 'faculdade', 'universidade', 'udemy', 'coursera', 'alura', 'curso', 'livraria', 'leitura', 'saraiva', 'cultura', 'mensalidade escolar', 'idiomas', 'duolingo', 'pos-graduacao'],
    category: 'educacao',
  },
  // Assinaturas & Serviços
  {
    keywords: ['netflix', 'spotify', 'prime video', 'amazon prime', 'disney+', 'hbo max', 'max.com', 'globoplay', 'apple.com', 'icloud', 'google storage', 'youtube premium', 'deezer', 'openai', 'chatgpt', 'gympass', 'totalpass', 'smart fit', 'bluefit', 'game pass', 'playstation', 'steam'],
    category: 'assinaturas',
  },
  // Compras & Vestuário
  {
    keywords: ['amazon', 'mercado livre', 'mercadolivre', 'shopee', 'shein', 'aliexpress', 'magalu', 'magazine luiza', 'americanas', 'casas bahia', 'zara', 'renner', 'c&a', 'riachuelo', 'centauro', 'decathlon', 'nike', 'adidas', 'calcados', 'roupas', 'otica', 'shopping'],
    category: 'compras',
  },
  // Lazer
  {
    keywords: ['cinema', 'cinemark', 'uci', 'kinoplex', 'ingresso', 'show', 'sympla', 'eventim', 'hotel', 'airbnb', 'booking', 'cvc', 'decolar', 'latam', 'gol', 'azul', 'parque', 'teatro', 'viagem', 'passeio'],
    category: 'lazer',
  },
  // Financeiro / Tarifas / Bancos
  {
    keywords: ['tarifa', 'anuidade', 'iof', 'juros', 'multa', 'ted taxa', 'doc taxa', 'taxa manutencao', 'seguro', 'emprestimo', 'financiamento', 'fatura cartao', 'pagto fatura', 'aplicacao', 'tesouro direto', 'cdb', 'fundo de investimento'],
    category: 'financeiro',
  },
];

export function autoCategorizeDescription(description: string, amount: number): { category: CategoryKey; paymentMethod: PaymentMethod; isRecurring: boolean } {
  const descLower = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let paymentMethod: PaymentMethod = 'outro';
  if (descLower.includes('pix')) {
    paymentMethod = 'pix';
  } else if (descLower.includes('cartao') || descLower.includes('compra') || descLower.includes('mastercard') || descLower.includes('visa') || descLower.includes('elo')) {
    paymentMethod = 'credito';
  } else if (descLower.includes('debito') || descLower.includes('deb auto') || descLower.includes('db')) {
    paymentMethod = 'debito';
  } else if (descLower.includes('boleto') || descLower.includes('pagamento titulo') || descLower.includes('bloqueto')) {
    paymentMethod = 'boleto';
  } else if (descLower.includes('ted') || descLower.includes('doc') || descLower.includes('transf')) {
    paymentMethod = 'ted_doc';
  }

  // Check recurring clues
  const isRecurring = /netflix|spotify|prime|gympass|totalpass|smart fit|aluguel|condominio|internet|vivo fibra|claro|enel|sabesp|mensalidade|assinatura/i.test(descLower);

  if (amount > 0) {
    return { category: 'renda', paymentMethod, isRecurring: false };
  }

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => descLower.includes(k))) {
      return { category: rule.category, paymentMethod, isRecurring };
    }
  }

  return { category: 'outros', paymentMethod, isRecurring };
}
