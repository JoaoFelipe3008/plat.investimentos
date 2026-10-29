import type { AssetCategory, Unit } from "@/lib/types";

/**
 * Catálogo de ativos acompanhados. Contém apenas metadados educacionais e
 * características estruturais do produto. Preços, variações e históricos
 * vêm sempre de um provedor (ver src/lib/providers).
 */
export type ProviderRef =
  | { kind: "brapi"; ticker: string; free?: boolean }
  | { kind: "coingecko"; id: string }
  | { kind: "bcb"; series: number; label: string }
  | { kind: "finnhub"; ticker: string; proxyNote?: string }
  | { kind: "benchmark"; of: "SELIC" | "CDI" | "IPCA" };

export interface Asset {
  symbol: string;
  name: string;
  category: AssetCategory;
  unit: Unit;
  provider: ProviderRef;
  description: string;
  beginner: string;
  risks: string[];
  facts?: { label: string; value: string }[];
  keywords: string[];
  sector?: string;
}

export const CATEGORY_LABEL: Record<AssetCategory, string> = {
  "acoes-br": "Ações brasileiras",
  "acoes-int": "Ações internacionais",
  etf: "ETFs",
  fii: "Fundos imobiliários",
  tesouro: "Tesouro Direto",
  "renda-fixa": "Renda fixa",
  cripto: "Criptomoedas",
  indice: "Índices",
  cambio: "Câmbio",
  macro: "Indicadores",
};

export const EXPLORE_CATEGORIES: AssetCategory[] = [
  "acoes-br",
  "acoes-int",
  "etf",
  "fii",
  "tesouro",
  "renda-fixa",
  "cripto",
];

const STOCK_RISKS = [
  "O preço oscila todos os dias e pode ficar abaixo do valor pago por longos períodos.",
  "Resultados da empresa, setor e economia afetam diretamente a cotação.",
  "Dividendos não são garantidos e podem ser reduzidos ou suspensos.",
];

const FII_RISKS = [
  "Vacância (imóveis desocupados) e inadimplência reduzem os rendimentos.",
  "As cotas oscilam na bolsa e podem ser negociadas abaixo do valor patrimonial.",
  "A liquidez varia muito entre fundos; alguns têm poucos negócios por dia.",
];

const CRYPTO_RISKS = [
  "Volatilidade muito alta: quedas superiores a 50% já ocorreram várias vezes.",
  "Não há garantia do FGC nem de qualquer órgão público.",
  "Golpes, perda de chaves privadas e falhas de corretoras podem causar perda total.",
];

const FIXED_IR = {
  label: "Imposto de Renda",
  value: "Tabela regressiva: 22,5% (até 180 dias), 20% (até 360), 17,5% (até 720), 15% (acima de 720 dias) sobre o rendimento",
};

export const ASSETS: Asset[] = [
  // ——— Índices e câmbio ———
  {
    symbol: "IBOV",
    name: "Ibovespa",
    category: "indice",
    unit: "PTS",
    provider: { kind: "brapi", ticker: "^BVSP" },
    description: "Principal índice da B3, formado pelas ações mais negociadas da bolsa brasileira.",
    beginner: "Funciona como um termômetro da bolsa: se o Ibovespa sobe, em média as maiores empresas brasileiras se valorizaram.",
    risks: ["Índices não podem ser comprados diretamente; existem ETFs que os replicam."],
    keywords: ["ibovespa", "b3"],
  },
  {
    symbol: "IFIX",
    name: "IFIX",
    category: "indice",
    unit: "PTS",
    provider: { kind: "brapi", ticker: "IFIX.SA" },
    description: "Índice de fundos imobiliários negociados na B3.",
    beginner: "Mostra o desempenho médio dos fundos imobiliários mais negociados.",
    risks: ["É uma média: fundos individuais podem ter desempenho muito diferente."],
    keywords: ["ifix", "fundos imobiliários", "fii"],
  },
  {
    symbol: "SPX",
    name: "S&P 500",
    category: "indice",
    unit: "USD",
    provider: { kind: "finnhub", ticker: "SPY", proxyNote: "Cotação do ETF SPY, que replica o S&P 500" },
    description: "Índice das 500 maiores empresas listadas nos Estados Unidos.",
    beginner: "É a principal referência do mercado de ações americano.",
    risks: ["Investir no exterior adiciona o risco de variação do dólar."],
    keywords: ["s&p 500", "wall street"],
  },
  {
    symbol: "NASDAQ",
    name: "Nasdaq",
    category: "indice",
    unit: "USD",
    provider: { kind: "finnhub", ticker: "QQQ", proxyNote: "Cotação do ETF QQQ (Nasdaq-100), usado como aproximação do Nasdaq Composite" },
    description: "Bolsa americana com forte presença de empresas de tecnologia.",
    beginner: "Costuma refletir o humor do mercado com empresas de tecnologia.",
    risks: ["Concentração em tecnologia aumenta a volatilidade."],
    keywords: ["nasdaq", "big techs"],
  },
  {
    symbol: "USDBRL",
    name: "Dólar comercial (PTAX)",
    category: "cambio",
    unit: "BRL",
    provider: { kind: "bcb", series: 1, label: "PTAX venda — SGS 1" },
    description: "Taxa de câmbio de referência calculada diariamente pelo Banco Central.",
    beginner: "Quanto custa, em reais, comprar um dólar americano. A PTAX é a média oficial do dia.",
    risks: ["O câmbio oscila com juros, fluxo de capitais, política fiscal e cenário global."],
    keywords: ["dólar", "câmbio", "ptax"],
  },
  {
    symbol: "SELIC",
    name: "Taxa Selic (meta)",
    category: "macro",
    unit: "PCT",
    provider: { kind: "bcb", series: 432, label: "Meta Selic — SGS 432" },
    description: "Taxa básica de juros da economia, definida pelo Copom.",
    beginner: "É o 'preço do dinheiro' no Brasil. Influencia empréstimos, financiamentos e o rendimento da renda fixa.",
    risks: [],
    keywords: ["selic", "copom", "juros", "banco central"],
  },
  {
    symbol: "CDI",
    name: "CDI",
    category: "macro",
    unit: "PCT",
    provider: { kind: "bcb", series: 4389, label: "CDI anualizado (base 252) — SGS 4389" },
    description: "Taxa média dos empréstimos entre bancos, muito próxima da Selic.",
    beginner: "É a régua da renda fixa. Quando um CDB paga '100% do CDI', ele acompanha essa taxa.",
    risks: [],
    keywords: ["cdi", "renda fixa", "juros"],
  },
  {
    symbol: "IPCA",
    name: "IPCA (12 meses)",
    category: "macro",
    unit: "PCT",
    provider: { kind: "bcb", series: 13522, label: "IPCA acumulado em 12 meses — SGS 13522" },
    description: "Índice oficial de inflação do Brasil, calculado pelo IBGE.",
    beginner: "Mede quanto os preços subiram. Se seu dinheiro rende menos que o IPCA, você perde poder de compra.",
    risks: [],
    keywords: ["ipca", "inflação"],
  },

  // ——— Ações brasileiras ———
  {
    symbol: "PETR4",
    name: "Petrobras PN",
    category: "acoes-br",
    unit: "BRL",
    sector: "Petróleo e gás",
    provider: { kind: "brapi", ticker: "PETR4", free: true },
    description: "Empresa de energia com foco em exploração, produção e refino de petróleo e gás.",
    beginner: "Ao comprar PETR4 você vira sócio minoritário (ação preferencial) de uma das maiores empresas do país.",
    risks: [...STOCK_RISKS, "Sensível ao preço internacional do petróleo e a decisões do governo como acionista controlador."],
    facts: [{ label: "Setor", value: "Petróleo e gás" }, { label: "Tipo", value: "Ação preferencial (PN)" }],
    keywords: ["petrobras", "petr4"],
  },
  {
    symbol: "VALE3",
    name: "Vale ON",
    category: "acoes-br",
    unit: "BRL",
    sector: "Mineração",
    provider: { kind: "brapi", ticker: "VALE3", free: true },
    description: "Uma das maiores mineradoras do mundo, com destaque para minério de ferro e níquel.",
    beginner: "Os resultados da Vale dependem muito da demanda da China por minério de ferro.",
    risks: [...STOCK_RISKS, "Exposta a preços de commodities e a riscos ambientais."],
    facts: [{ label: "Setor", value: "Mineração" }, { label: "Tipo", value: "Ação ordinária (ON)" }],
    keywords: ["vale3", "mineradora vale", "minério de ferro"],
  },
  {
    symbol: "ITUB4",
    name: "Itaú Unibanco PN",
    category: "acoes-br",
    unit: "BRL",
    sector: "Bancos",
    provider: { kind: "brapi", ticker: "ITUB4", free: true },
    description: "Maior banco privado do Brasil.",
    beginner: "Bancos lucram com crédito e serviços; costumam ser analisados por indicadores como ROE e inadimplência.",
    risks: [...STOCK_RISKS, "Inadimplência e regulação bancária afetam os resultados."],
    facts: [{ label: "Setor", value: "Bancos" }, { label: "Tipo", value: "Ação preferencial (PN)" }],
    keywords: ["itaú", "itau", "itub4"],
  },
  {
    symbol: "MGLU3",
    name: "Magazine Luiza ON",
    category: "acoes-br",
    unit: "BRL",
    sector: "Varejo",
    provider: { kind: "brapi", ticker: "MGLU3", free: true },
    description: "Varejista com operação física e digital.",
    beginner: "Empresas de varejo são sensíveis a juros e renda das famílias, por isso oscilam bastante.",
    risks: [...STOCK_RISKS, "Alta sensibilidade a juros e consumo; histórico de forte volatilidade."],
    facts: [{ label: "Setor", value: "Varejo" }, { label: "Tipo", value: "Ação ordinária (ON)" }],
    keywords: ["magazine luiza", "magalu", "mglu3"],
  },
  {
    symbol: "WEGE3",
    name: "WEG ON",
    category: "acoes-br",
    unit: "BRL",
    sector: "Bens industriais",
    provider: { kind: "brapi", ticker: "WEGE3" },
    description: "Fabricante de motores elétricos, equipamentos de energia e automação.",
    beginner: "É uma empresa industrial com forte presença fora do Brasil.",
    risks: STOCK_RISKS,
    facts: [{ label: "Setor", value: "Bens industriais" }],
    keywords: ["wege3"],
  },
  {
    symbol: "BBAS3",
    name: "Banco do Brasil ON",
    category: "acoes-br",
    unit: "BRL",
    sector: "Bancos",
    provider: { kind: "brapi", ticker: "BBAS3" },
    description: "Banco de economia mista com forte atuação no agronegócio.",
    beginner: "Por ter o governo como controlador, decisões políticas podem influenciar a empresa.",
    risks: [...STOCK_RISKS, "Risco de interferência do acionista controlador."],
    facts: [{ label: "Setor", value: "Bancos" }],
    keywords: ["banco do brasil", "bbas3"],
  },
  {
    symbol: "ABEV3",
    name: "Ambev ON",
    category: "acoes-br",
    unit: "BRL",
    sector: "Bebidas",
    provider: { kind: "brapi", ticker: "ABEV3" },
    description: "Fabricante de cervejas e bebidas com operações nas Américas.",
    beginner: "Empresas de consumo básico costumam ter receitas mais estáveis.",
    risks: STOCK_RISKS,
    facts: [{ label: "Setor", value: "Bebidas" }],
    keywords: ["ambev", "abev3"],
  },

  // ——— Ações internacionais ———
  {
    symbol: "AAPL",
    name: "Apple",
    category: "acoes-int",
    unit: "USD",
    sector: "Tecnologia",
    provider: { kind: "finnhub", ticker: "AAPL" },
    description: "Fabricante do iPhone, Mac e de serviços digitais.",
    beginner: "No Brasil, é possível investir via BDR (AAPL34) ou por corretoras no exterior.",
    risks: [...STOCK_RISKS, "Variação cambial: o valor em reais também muda com o dólar."],
    keywords: ["apple", "aapl", "iphone"],
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    category: "acoes-int",
    unit: "USD",
    sector: "Tecnologia",
    provider: { kind: "finnhub", ticker: "MSFT" },
    description: "Software, nuvem (Azure) e produtos de produtividade.",
    beginner: "Grande parte da receita vem de assinaturas e serviços em nuvem.",
    risks: [...STOCK_RISKS, "Variação cambial."],
    keywords: ["microsoft", "msft", "azure"],
  },
  {
    symbol: "NVDA",
    name: "Nvidia",
    category: "acoes-int",
    unit: "USD",
    sector: "Semicondutores",
    provider: { kind: "finnhub", ticker: "NVDA" },
    description: "Projetista de chips gráficos e de aceleradores para inteligência artificial.",
    beginner: "Ações com crescimento acelerado tendem a ter oscilações maiores.",
    risks: [...STOCK_RISKS, "Variação cambial.", "Valuation elevado aumenta a sensibilidade a notícias."],
    keywords: ["nvidia", "nvda"],
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    category: "acoes-int",
    unit: "USD",
    sector: "Varejo e nuvem",
    provider: { kind: "finnhub", ticker: "AMZN" },
    description: "Comércio eletrônico e computação em nuvem (AWS).",
    beginner: "A AWS, divisão de nuvem, responde por boa parte do lucro.",
    risks: [...STOCK_RISKS, "Variação cambial."],
    keywords: ["amazon", "amzn", "aws"],
  },

  // ——— ETFs ———
  {
    symbol: "BOVA11",
    name: "iShares Ibovespa",
    category: "etf",
    unit: "BRL",
    provider: { kind: "brapi", ticker: "BOVA11" },
    description: "ETF que replica o Ibovespa.",
    beginner: "Com uma única cota você investe em todas as ações do Ibovespa, na proporção do índice.",
    risks: ["Acompanha a bolsa: cai quando o mercado cai.", "Há taxa de administração embutida."],
    facts: [{ label: "Índice de referência", value: "Ibovespa" }, { label: "IR", value: "15% sobre o lucro na venda (sem isenção de R$ 20 mil)" }],
    keywords: ["bova11", "etf", "ibovespa"],
  },
  {
    symbol: "IVVB11",
    name: "iShares S&P 500",
    category: "etf",
    unit: "BRL",
    provider: { kind: "brapi", ticker: "IVVB11" },
    description: "ETF negociado na B3 que replica o S&P 500 em reais.",
    beginner: "Forma simples de ter exposição às maiores empresas americanas sem conta no exterior.",
    risks: ["Oscila com a bolsa americana e com o dólar."],
    facts: [{ label: "Índice de referência", value: "S&P 500" }],
    keywords: ["ivvb11", "s&p 500", "etf"],
  },
  {
    symbol: "SMAL11",
    name: "iShares Small Cap",
    category: "etf",
    unit: "BRL",
    provider: { kind: "brapi", ticker: "SMAL11" },
    description: "ETF que replica o índice de empresas de menor capitalização da B3.",
    beginner: "Empresas menores podem crescer mais, mas também oscilam mais.",
    risks: ["Volatilidade superior à do Ibovespa."],
    facts: [{ label: "Índice de referência", value: "Índice Small Cap (SMLL)" }],
    keywords: ["smal11", "small caps", "etf"],
  },
  {
    symbol: "HASH11",
    name: "Hashdex Nasdaq Crypto",
    category: "etf",
    unit: "BRL",
    provider: { kind: "brapi", ticker: "HASH11" },
    description: "ETF de criptoativos negociado na B3.",
    beginner: "Permite exposição a uma cesta de criptomoedas sem precisar de carteira digital.",
    risks: CRYPTO_RISKS.slice(0, 1),
    keywords: ["hash11"],
  },

  // ——— FIIs ———
  {
    symbol: "HGLG11",
    name: "CSHG Logística",
    category: "fii",
    unit: "BRL",
    sector: "Logística",
    provider: { kind: "brapi", ticker: "HGLG11" },
    description: "Fundo de galpões logísticos.",
    beginner: "Recebe aluguéis de galpões e distribui a maior parte aos cotistas, geralmente todo mês.",
    risks: FII_RISKS,
    facts: [{ label: "Segmento", value: "Logística (tijolo)" }, { label: "IR", value: "Rendimentos mensais isentos para pessoa física, nas condições da lei; ganho de capital tributado em 20%" }],
    keywords: ["hglg11"],
  },
  {
    symbol: "KNRI11",
    name: "Kinea Renda Imobiliária",
    category: "fii",
    unit: "BRL",
    sector: "Híbrido",
    provider: { kind: "brapi", ticker: "KNRI11" },
    description: "Fundo com escritórios e galpões logísticos.",
    beginner: "Fundos híbridos diversificam entre diferentes tipos de imóveis.",
    risks: FII_RISKS,
    facts: [{ label: "Segmento", value: "Híbrido (tijolo)" }],
    keywords: ["knri11", "kinea", "fii"],
  },
  {
    symbol: "MXRF11",
    name: "Maxi Renda",
    category: "fii",
    unit: "BRL",
    sector: "Papel",
    provider: { kind: "brapi", ticker: "MXRF11" },
    description: "Fundo que investe principalmente em títulos de dívida imobiliária (CRIs).",
    beginner: "Fundos de papel emprestam dinheiro ao setor imobiliário em vez de possuir imóveis.",
    risks: [...FII_RISKS.slice(1), "Risco de crédito dos devedores dos CRIs."],
    facts: [{ label: "Segmento", value: "Papel (recebíveis)" }],
    keywords: ["mxrf11", "maxi renda", "cri", "fii"],
  },
  {
    symbol: "XPML11",
    name: "XP Malls",
    category: "fii",
    unit: "BRL",
    sector: "Shoppings",
    provider: { kind: "brapi", ticker: "XPML11" },
    description: "Fundo com participações em shopping centers.",
    beginner: "A renda depende do aluguel e das vendas dos lojistas.",
    risks: FII_RISKS,
    facts: [{ label: "Segmento", value: "Shoppings (tijolo)" }],
    keywords: ["xpml11"],
  },

  // ——— Tesouro Direto ———
  {
    symbol: "TESOURO-SELIC",
    name: "Tesouro Selic",
    category: "tesouro",
    unit: "PCT",
    provider: { kind: "benchmark", of: "SELIC" },
    description: "Título público pós-fixado que acompanha a taxa Selic.",
    beginner: "É o título mais usado para reserva de emergência: rende próximo à Selic e oscila pouco.",
    risks: [
      "Pequenas variações negativas podem ocorrer no curtíssimo prazo.",
      "O rendimento cai quando a Selic é reduzida.",
    ],
    facts: [
      { label: "Rentabilidade", value: "Selic + ágio/deságio definido no momento da compra" },
      { label: "Liquidez", value: "Diária, pelo Tesouro Direto" },
      { label: "Garantia", value: "Tesouro Nacional (risco soberano)" },
      FIXED_IR,
    ],
    keywords: ["tesouro selic", "tesouro direto", "título público"],
  },
  {
    symbol: "TESOURO-IPCA",
    name: "Tesouro IPCA+",
    category: "tesouro",
    unit: "PCT",
    provider: { kind: "benchmark", of: "IPCA" },
    description: "Título público que paga a inflação (IPCA) mais uma taxa fixa.",
    beginner: "Protege o poder de compra no longo prazo. Ideal para objetivos distantes, como aposentadoria.",
    risks: [
      "Se vendido antes do vencimento, o preço pode estar abaixo do valor pago (marcação a mercado).",
      "Quanto mais longo o título, maior a oscilação.",
    ],
    facts: [
      { label: "Rentabilidade", value: "IPCA + taxa fixa contratada na compra" },
      { label: "Liquidez", value: "Diária, a preço de mercado" },
      { label: "Garantia", value: "Tesouro Nacional (risco soberano)" },
      FIXED_IR,
    ],
    keywords: ["tesouro ipca", "ntn-b", "tesouro direto", "inflação"],
  },
  {
    symbol: "TESOURO-PRE",
    name: "Tesouro Prefixado",
    category: "tesouro",
    unit: "PCT",
    provider: { kind: "benchmark", of: "SELIC" },
    description: "Título público com taxa definida no momento da compra.",
    beginner: "Você sabe exatamente quanto receberá se levar até o vencimento.",
    risks: [
      "Se a inflação subir muito, o ganho real pode ser baixo.",
      "Venda antecipada pode gerar perda (marcação a mercado).",
    ],
    facts: [
      { label: "Rentabilidade", value: "Taxa fixa ao ano, contratada na compra" },
      { label: "Liquidez", value: "Diária, a preço de mercado" },
      FIXED_IR,
    ],
    keywords: ["tesouro prefixado", "ltn", "tesouro direto"],
  },

  // ——— Renda fixa bancária ———
  {
    symbol: "CDB",
    name: "CDB",
    category: "renda-fixa",
    unit: "PCT",
    provider: { kind: "benchmark", of: "CDI" },
    description: "Certificado de Depósito Bancário: você empresta dinheiro a um banco.",
    beginner: "A maioria paga um percentual do CDI. Um CDB de 100% do CDI acompanha essa taxa.",
    risks: [
      "Risco de crédito do banco emissor (coberto pelo FGC dentro dos limites).",
      "Alguns CDBs só permitem resgate no vencimento.",
    ],
    facts: [
      { label: "Garantia", value: "FGC: até R$ 250 mil por CPF por instituição, com teto global de R$ 1 milhão a cada 4 anos" },
      { label: "Liquidez", value: "Depende do título: diária ou apenas no vencimento" },
      FIXED_IR,
    ],
    keywords: ["cdb", "renda fixa", "banco", "fgc"],
  },
  {
    symbol: "LCI-LCA",
    name: "LCI e LCA",
    category: "renda-fixa",
    unit: "PCT",
    provider: { kind: "benchmark", of: "CDI" },
    description: "Letras de crédito imobiliário (LCI) e do agronegócio (LCA).",
    beginner: "São isentas de Imposto de Renda para pessoa física, por isso pagam percentuais do CDI menores que um CDB equivalente.",
    risks: ["Possuem prazo mínimo de carência definido pelo CMN.", "Risco de crédito do emissor (com cobertura do FGC)."],
    facts: [
      { label: "Imposto de Renda", value: "Isentas para pessoa física" },
      { label: "Garantia", value: "FGC, nos mesmos limites do CDB" },
      { label: "Carência", value: "Prazo mínimo definido pelo CMN — confirme as regras vigentes na contratação" },
    ],
    keywords: ["lci", "lca"],
  },

  // ——— Cripto ———
  {
    symbol: "BTC",
    name: "Bitcoin",
    category: "cripto",
    unit: "BRL",
    provider: { kind: "coingecko", id: "bitcoin" },
    description: "Primeira criptomoeda, com oferta máxima de 21 milhões de unidades.",
    beginner: "É um ativo digital descentralizado. Seu preço depende da oferta e da demanda, sem lastro em empresa ou governo.",
    risks: CRYPTO_RISKS,
    keywords: ["bitcoin", "btc"],
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    category: "cripto",
    unit: "BRL",
    provider: { kind: "coingecko", id: "ethereum" },
    description: "Plataforma de contratos inteligentes; o ether (ETH) é sua moeda nativa.",
    beginner: "Além de moeda, o Ethereum funciona como base para aplicativos descentralizados.",
    risks: CRYPTO_RISKS,
    keywords: ["ethereum", "ether"],
  },
  {
    symbol: "SOL",
    name: "Solana",
    category: "cripto",
    unit: "BRL",
    provider: { kind: "coingecko", id: "solana" },
    description: "Blockchain focada em alta velocidade de transações.",
    beginner: "Projetos mais novos tendem a ser ainda mais voláteis que o bitcoin.",
    risks: CRYPTO_RISKS,
    keywords: ["solana"],
  },
];

export const ASSET_BY_SYMBOL = new Map(ASSETS.map((a) => [a.symbol, a]));

export function getAsset(symbol: string) {
  return ASSET_BY_SYMBOL.get(symbol.toUpperCase());
}

export const MARKET_INDICATORS = ["IBOV", "IFIX", "SPX", "NASDAQ", "USDBRL", "BTC", "ETH", "SELIC", "CDI", "IPCA"];

/** Ativos com preço negociável (podem entrar na carteira com quantidade × preço). */
export function isPriced(a: Asset) {
  return a.provider.kind !== "benchmark" && a.category !== "macro" && a.category !== "indice";
}
