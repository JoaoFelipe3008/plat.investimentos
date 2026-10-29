export type WidgetKind = "juros-compostos" | "inflacao" | "risco-retorno" | "reserva" | "ir-regressivo" | "volatilidade" | "diversificacao";

export interface LessonCard {
  title: string;
  body: string;
  widget?: WidgetKind;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  cards: LessonCard[];
  quiz: QuizQuestion[];
}

export interface Module {
  id: string;
  number: number;
  title: string;
  description: string;
  lessons: Lesson[];
}

export const MODULES: Module[] = [
  {
    id: "primeiros-passos",
    number: 1,
    title: "Primeiros passos",
    description: "Os conceitos que sustentam qualquer decisão de investimento.",
    lessons: [
      {
        id: "o-que-sao-investimentos",
        title: "O que são investimentos?",
        minutes: 4,
        summary: "Investir é abrir mão de consumir hoje para ter mais recursos no futuro.",
        cards: [
          {
            title: "Guardar não é investir",
            body: "Quando o dinheiro fica parado na conta, ele perde valor com a inflação. Investir é colocar esse dinheiro para trabalhar: emprestando ao governo, a um banco ou virando sócio de uma empresa, em troca de uma remuneração.",
          },
          {
            title: "Três perguntas antes de qualquer aplicação",
            body: "Quanto posso ganhar (rentabilidade)? Qual a chance de perder (risco)? Em quanto tempo consigo o dinheiro de volta (liquidez)? Nenhum investimento é ótimo nos três ao mesmo tempo.",
          },
          {
            title: "Renda fixa e renda variável",
            body: "Na renda fixa, as regras do rendimento são definidas na aplicação, como no Tesouro Direto e no CDB. Na renda variável, como ações e fundos imobiliários, o retorno depende do mercado e não é conhecido de antemão.",
          },
        ],
        quiz: [
          {
            q: "Qual combinação descreve as três dimensões de um investimento?",
            options: ["Preço, marca e prazo", "Rentabilidade, risco e liquidez", "Banco, corretora e aplicativo"],
            correct: 1,
            explain: "Todo investimento equilibra quanto rende, quanto pode oscilar ou perder e quão rápido vira dinheiro.",
          },
          {
            q: "Dinheiro parado na conta corrente…",
            options: ["Mantém o poder de compra", "Perde poder de compra com a inflação", "Rende igual à Selic"],
            correct: 1,
            explain: "Sem rendimento, a inflação reduz o que você consegue comprar com o mesmo valor.",
          },
        ],
      },
      {
        id: "juros-compostos",
        title: "Como funcionam os juros compostos",
        minutes: 5,
        summary: "Juros sobre juros: o tempo é o ingrediente mais importante.",
        cards: [
          {
            title: "Juros sobre juros",
            body: "Nos juros compostos, o rendimento de cada mês é somado ao saldo, e no mês seguinte você recebe juros também sobre esse rendimento. No início a diferença é pequena; com os anos, ela se torna a maior parte do patrimônio.",
          },
          {
            title: "Experimente",
            body: "Ajuste o valor mensal, a taxa e o prazo. Observe como, em prazos longos, a parcela de rendimentos passa a superar o total depositado. Os valores são hipotéticos.",
            widget: "juros-compostos",
          },
        ],
        quiz: [
          {
            q: "O que mais aumenta o efeito dos juros compostos?",
            options: ["Tempo investido", "Trocar de banco", "Resgatar com frequência"],
            correct: 0,
            explain: "Quanto mais tempo o dinheiro permanece aplicado, mais juros incidem sobre juros anteriores.",
          },
          {
            q: "Resgatar os rendimentos todo mês…",
            options: ["Acelera os juros compostos", "Interrompe o efeito dos juros sobre juros", "Não muda nada"],
            correct: 1,
            explain: "Ao retirar o rendimento, ele deixa de render no período seguinte.",
          },
        ],
      },
      {
        id: "inflacao",
        title: "Inflação e poder de compra",
        minutes: 4,
        summary: "O ganho que importa é o ganho real, acima da inflação.",
        cards: [
          {
            title: "O que é inflação",
            body: "É o aumento geral dos preços. O índice oficial no Brasil é o IPCA, calculado pelo IBGE. Se a inflação foi de 5% em um ano, você precisa de 5% a mais de dinheiro para comprar as mesmas coisas.",
          },
          {
            title: "Rendimento nominal × real",
            body: "Se um investimento rendeu 10% no ano e a inflação foi 5%, o ganho real foi de aproximadamente 4,8% — não 5%, porque o cálculo é (1,10 ÷ 1,05) − 1.",
            widget: "inflacao",
          },
        ],
        quiz: [
          {
            q: "Um investimento rendeu 6% e a inflação foi 6%. O ganho real foi:",
            options: ["6%", "Zero", "12%"],
            correct: 1,
            explain: "O rendimento apenas repôs a inflação; o poder de compra ficou igual.",
          },
          {
            q: "Qual índice mede a inflação oficial no Brasil?",
            options: ["CDI", "IPCA", "Ibovespa"],
            correct: 1,
            explain: "O IPCA, do IBGE, é a referência usada inclusive para a meta de inflação.",
          },
        ],
      },
      {
        id: "risco-retorno",
        title: "Risco e retorno",
        minutes: 5,
        summary: "Retornos maiores vêm acompanhados de incerteza maior.",
        cards: [
          {
            title: "Não existe almoço grátis",
            body: "Investimentos que podem render mais costumam oscilar mais e ter maior chance de perda. Promessas de retorno alto e garantido são o principal sinal de golpe.",
          },
          {
            title: "Tipos de risco",
            body: "Risco de mercado (o preço oscila), de crédito (quem recebeu o dinheiro não paga), de liquidez (não conseguir vender rápido) e cambial (variação do dólar). Cada produto combina esses riscos de forma diferente.",
            widget: "risco-retorno",
          },
        ],
        quiz: [
          {
            q: "Uma oferta promete 5% ao mês garantidos, sem risco. O mais prudente é:",
            options: ["Investir tudo rapidamente", "Desconfiar: retorno alto e garantido é sinal clássico de golpe", "Pedir para um amigo investir"],
            correct: 1,
            explain: "Retornos muito acima da Selic, com garantia, não condizem com o funcionamento do mercado.",
          },
          {
            q: "O risco de o emissor de um título não pagar é chamado de:",
            options: ["Risco de crédito", "Risco cambial", "Risco de liquidez"],
            correct: 0,
            explain: "É o risco de calote do devedor — banco, empresa ou governo.",
          },
        ],
      },
      {
        id: "reserva-emergencia",
        title: "Reserva de emergência",
        minutes: 4,
        summary: "A base que impede você de vender investimentos na hora errada.",
        cards: [
          {
            title: "Por que vem primeiro",
            body: "Imprevistos acontecem: perda de emprego, saúde, conserto do carro. Sem uma reserva, você pode ser obrigado a vender investimentos em queda ou recorrer a empréstimos caros.",
          },
          {
            title: "Quanto e onde",
            body: "Uma referência comum é de 3 a 12 meses do seu custo de vida, conforme a estabilidade da sua renda. A reserva deve ficar em aplicações de baixo risco e resgate rápido, como Tesouro Selic ou CDBs com liquidez diária de bancos sólidos.",
            widget: "reserva",
          },
        ],
        quiz: [
          {
            q: "Qual característica é essencial para a reserva de emergência?",
            options: ["Alta rentabilidade", "Liquidez e baixo risco", "Isenção de imposto"],
            correct: 1,
            explain: "A reserva precisa estar disponível rapidamente e sem perdas relevantes.",
          },
          {
            q: "Ações são adequadas para a reserva de emergência?",
            options: ["Sim, porque rendem mais", "Não, porque podem estar em queda quando você precisar do dinheiro", "Só ações de bancos"],
            correct: 1,
            explain: "A volatilidade das ações conflita com a necessidade de valor estável a qualquer momento.",
          },
        ],
      },
    ],
  },
  {
    id: "renda-fixa",
    number: 2,
    title: "Renda fixa",
    description: "Emprestar dinheiro com regras claras de remuneração.",
    lessons: [
      {
        id: "tesouro-direto",
        title: "Tesouro Direto",
        minutes: 5,
        summary: "Títulos públicos acessíveis a partir de poucos reais.",
        cards: [
          {
            title: "Você empresta ao governo",
            body: "No Tesouro Direto, você compra títulos emitidos pelo Tesouro Nacional. É considerado o investimento de menor risco de crédito do país.",
          },
          {
            title: "Os três tipos",
            body: "Tesouro Selic acompanha a taxa básica de juros e oscila pouco. Tesouro IPCA+ paga inflação mais uma taxa fixa, bom para longo prazo. Tesouro Prefixado tem taxa definida na compra.",
          },
          {
            title: "Marcação a mercado",
            body: "Os preços dos títulos mudam todos os dias. Quem leva até o vencimento recebe a taxa contratada; quem vende antes recebe o preço do dia, que pode ser maior ou menor. O Tesouro Selic é o menos afetado.",
          },
        ],
        quiz: [
          {
            q: "Qual título é mais usado para reserva de emergência?",
            options: ["Tesouro IPCA+ 2045", "Tesouro Selic", "Tesouro Prefixado 2035"],
            correct: 1,
            explain: "Ele acompanha a Selic e sofre pouca marcação a mercado.",
          },
          {
            q: "Vender um Tesouro IPCA+ antes do vencimento pode gerar:",
            options: ["Somente ganho", "Ganho ou perda, conforme o preço do dia", "Multa fixa"],
            correct: 1,
            explain: "Pela marcação a mercado, o preço de venda depende das taxas vigentes.",
          },
        ],
      },
      {
        id: "cdb",
        title: "CDB",
        minutes: 4,
        summary: "Empréstimo a bancos, com proteção do FGC.",
        cards: [
          {
            title: "Como funciona",
            body: "Ao investir em um CDB, você empresta dinheiro a um banco. A remuneração mais comum é um percentual do CDI: 100% do CDI acompanha a taxa; 110% paga 10% a mais.",
          },
          {
            title: "FGC",
            body: "O Fundo Garantidor de Créditos cobre até R$ 250 mil por CPF por instituição financeira, com teto global de R$ 1 milhão a cada 4 anos. A proteção existe, mas a análise do banco continua importante.",
          },
        ],
        quiz: [
          {
            q: "Um CDB que paga 100% do CDI rende:",
            options: ["Exatamente a inflação", "Aproximadamente a taxa CDI", "Sempre 1% ao mês"],
            correct: 1,
            explain: "O CDI é a referência; o percentual indica quanto dele você recebe.",
          },
          {
            q: "O FGC protege CDBs até qual limite por CPF por instituição?",
            options: ["R$ 50 mil", "R$ 250 mil", "Ilimitado"],
            correct: 1,
            explain: "O limite é de R$ 250 mil por CPF por instituição, com teto global.",
          },
        ],
      },
      {
        id: "lci-lca",
        title: "LCI e LCA",
        minutes: 4,
        summary: "Renda fixa isenta de IR para pessoa física.",
        cards: [
          {
            title: "Para que servem",
            body: "Os recursos das LCIs financiam o setor imobiliário e os das LCAs, o agronegócio. Para estimular esses setores, o rendimento é isento de Imposto de Renda para pessoas físicas.",
          },
          {
            title: "Compare de forma justa",
            body: "Uma LCI de 90% do CDI pode render mais que um CDB de 105% do CDI, dependendo do prazo e da alíquota de IR. Compare sempre o rendimento líquido. Atenção à carência mínima definida pelo CMN.",
          },
        ],
        quiz: [
          {
            q: "Qual a principal vantagem da LCI/LCA para pessoa física?",
            options: ["Liquidez diária garantida", "Isenção de Imposto de Renda", "Rentabilidade sempre maior que a do CDB"],
            correct: 1,
            explain: "A isenção é a característica que as diferencia.",
          },
        ],
      },
      {
        id: "liquidez",
        title: "Liquidez",
        minutes: 3,
        summary: "Quando você consegue o dinheiro de volta.",
        cards: [
          {
            title: "D+0, D+1, no vencimento",
            body: "D+0 significa receber no mesmo dia útil do resgate; D+1, no dia útil seguinte. Alguns títulos só podem ser resgatados no vencimento — geralmente pagam mais por isso.",
          },
          {
            title: "Combine prazo e objetivo",
            body: "Dinheiro para uma viagem daqui a dois anos pode ficar em um título com vencimento próximo dessa data. Dinheiro de emergência precisa de liquidez diária.",
          },
        ],
        quiz: [
          {
            q: "Um CDB com liquidez 'no vencimento' é adequado para reserva de emergência?",
            options: ["Sim", "Não, porque o dinheiro fica preso até a data final", "Só se pagar mais de 120% do CDI"],
            correct: 1,
            explain: "A reserva precisa estar disponível a qualquer momento.",
          },
        ],
      },
      {
        id: "rentabilidade-tributacao",
        title: "Rentabilidade e tributação",
        minutes: 5,
        summary: "Tabela regressiva de IR e IOF na renda fixa.",
        cards: [
          {
            title: "Tabela regressiva",
            body: "Na maior parte da renda fixa (Tesouro, CDB), o IR incide apenas sobre o rendimento e diminui com o tempo: 22,5% até 180 dias, 20% até 360, 17,5% até 720 e 15% acima de 720 dias. Também há IOF regressivo em resgates com menos de 30 dias.",
            widget: "ir-regressivo",
          },
          {
            title: "Custos importam",
            body: "Taxas de custódia e de administração reduzem o rendimento todos os anos. Em longos prazos, diferenças pequenas de custo viram diferenças grandes de patrimônio.",
          },
        ],
        quiz: [
          {
            q: "Qual alíquota de IR se aplica a um CDB resgatado após 800 dias?",
            options: ["22,5%", "17,5%", "15%"],
            correct: 2,
            explain: "Acima de 720 dias, a alíquota é de 15% sobre o rendimento.",
          },
          {
            q: "O IR na renda fixa incide sobre:",
            options: ["O valor total resgatado", "Somente o rendimento", "O valor aplicado"],
            correct: 1,
            explain: "O imposto é cobrado apenas sobre o ganho.",
          },
        ],
      },
    ],
  },
  {
    id: "bolsa",
    number: 3,
    title: "Bolsa de valores",
    description: "Como funcionam ações, ETFs e fundos imobiliários.",
    lessons: [
      {
        id: "b3",
        title: "O que é a B3?",
        minutes: 3,
        summary: "A infraestrutura onde investidores negociam ativos.",
        cards: [
          {
            title: "O ambiente de negociação",
            body: "A B3 é a bolsa do Brasil. Ela organiza as negociações, registra quem é dono de cada ativo (custódia) e garante a liquidação das operações. Você acessa a bolsa por meio de uma corretora.",
          },
          {
            title: "Horários e códigos",
            body: "Cada ativo tem um código (ticker). Ações ON terminam em 3, PN em 4, units e ETFs/FIIs costumam terminar em 11. O pregão regular acontece em dias úteis.",
          },
        ],
        quiz: [
          {
            q: "Para investir na bolsa, uma pessoa física precisa:",
            options: ["Ir pessoalmente à B3", "Abrir conta em uma corretora", "Ser sócio de uma empresa"],
            correct: 1,
            explain: "A corretora é a intermediária autorizada entre você e a bolsa.",
          },
        ],
      },
      {
        id: "acoes",
        title: "Como funcionam as ações",
        minutes: 5,
        summary: "Ser sócio de uma empresa e participar de lucros e riscos.",
        cards: [
          {
            title: "Sócio, não credor",
            body: "Ao comprar uma ação, você se torna dono de uma pequena parte da empresa. Se ela cresce e lucra, a ação tende a se valorizar no longo prazo; se vai mal, pode cair — inclusive muito.",
          },
          {
            title: "O preço é definido pelo mercado",
            body: "No curto prazo, notícias, juros e humor dos investidores movem os preços. No longo prazo, os resultados da empresa tendem a pesar mais. Indicadores como P/L ajudam a comparar preço e lucro.",
          },
        ],
        quiz: [
          {
            q: "Quem compra ações de uma empresa se torna:",
            options: ["Credor da empresa", "Sócio da empresa", "Funcionário da empresa"],
            correct: 1,
            explain: "A ação representa uma fração do capital social.",
          },
          {
            q: "No curto prazo, o preço de uma ação:",
            options: ["Segue apenas o lucro trimestral", "Pode oscilar por muitos motivos, inclusive notícias e juros", "Não muda"],
            correct: 1,
            explain: "O curto prazo é influenciado por expectativas e fluxo de investidores.",
          },
        ],
      },
      {
        id: "dividendos",
        title: "Dividendos",
        minutes: 4,
        summary: "Parte do lucro distribuída aos acionistas.",
        cards: [
          {
            title: "Dividendos e JCP",
            body: "Empresas lucrativas podem distribuir parte do lucro como dividendos ou juros sobre capital próprio (JCP). No JCP há retenção de 15% de IR na fonte. As regras tributárias podem mudar; acompanhe a legislação vigente.",
          },
          {
            title: "Dividend yield não é promessa",
            body: "O dividend yield mostra quanto foi pago nos últimos 12 meses em relação ao preço atual. Pagamentos passados não garantem pagamentos futuros.",
          },
        ],
        quiz: [
          {
            q: "Um dividend yield alto no último ano garante dividendos altos no próximo?",
            options: ["Sim", "Não", "Somente em bancos"],
            correct: 1,
            explain: "Dividendos dependem de lucros futuros e de decisões da empresa.",
          },
        ],
      },
      {
        id: "etfs",
        title: "ETFs",
        minutes: 4,
        summary: "Uma cesta de ativos em uma única cota.",
        cards: [
          {
            title: "Diversificação simplificada",
            body: "Um ETF replica um índice. Ao comprar uma cota do BOVA11, por exemplo, você investe nas ações do Ibovespa, na proporção do índice, pagando uma taxa de administração.",
          },
          {
            title: "Tributação",
            body: "Em ETFs de ações, o lucro na venda é tributado em 15% e não há a isenção de vendas até R$ 20 mil por mês que existe para ações.",
          },
        ],
        quiz: [
          {
            q: "Um ETF de índice busca:",
            options: ["Superar o índice com apostas", "Replicar o desempenho do índice", "Garantir rendimento fixo"],
            correct: 1,
            explain: "ETFs passivos acompanham o índice de referência.",
          },
        ],
      },
      {
        id: "fiis",
        title: "Fundos imobiliários",
        minutes: 5,
        summary: "Renda de aluguéis sem comprar um imóvel inteiro.",
        cards: [
          {
            title: "Tijolo e papel",
            body: "Fundos de tijolo possuem imóveis (galpões, shoppings, escritórios) e recebem aluguéis. Fundos de papel investem em títulos de dívida do setor, como CRIs.",
          },
          {
            title: "Rendimentos e riscos",
            body: "Os FIIs costumam distribuir rendimentos mensais, isentos de IR para pessoa física nas condições da lei. Vacância, inadimplência e oscilação das cotas são riscos reais.",
          },
        ],
        quiz: [
          {
            q: "Um FII de papel investe principalmente em:",
            options: ["Imóveis físicos", "Títulos de dívida imobiliária", "Ações de construtoras"],
            correct: 1,
            explain: "Fundos de papel compram recebíveis como CRIs.",
          },
        ],
      },
      {
        id: "volatilidade",
        title: "Volatilidade",
        minutes: 4,
        summary: "Oscilar faz parte; entender ajuda a não agir por impulso.",
        cards: [
          {
            title: "O caminho não é uma linha reta",
            body: "Mesmo ativos que se valorizam no longo prazo passam por quedas fortes no caminho. Volatilidade mede a intensidade dessas oscilações.",
            widget: "volatilidade",
          },
          {
            title: "Horizonte e comportamento",
            body: "Quem precisa do dinheiro em pouco tempo não deve depender de ativos voláteis. Vender em pânico durante uma queda transforma uma perda temporária em perda definitiva.",
          },
        ],
        quiz: [
          {
            q: "Para um objetivo em 6 meses, ativos muito voláteis são:",
            options: ["Ideais", "Pouco adequados, pois podem estar em queda na data necessária", "Indiferentes"],
            correct: 1,
            explain: "Prazos curtos pedem previsibilidade.",
          },
        ],
      },
    ],
  },
  {
    id: "cripto",
    number: 4,
    title: "Criptomoedas",
    description: "Tecnologia, custódia e os riscos de um mercado 24/7.",
    lessons: [
      {
        id: "bitcoin",
        title: "Bitcoin",
        minutes: 4,
        summary: "A primeira moeda digital descentralizada.",
        cards: [
          {
            title: "O que é",
            body: "O bitcoin é um ativo digital que funciona sem banco central ou empresa controladora. A oferta máxima é de 21 milhões de unidades, definida no protocolo.",
          },
          {
            title: "Por que oscila tanto",
            body: "Não há lucro, aluguel ou juros por trás do preço: ele depende da oferta e da demanda. Quedas acima de 50% já aconteceram várias vezes.",
          },
        ],
        quiz: [
          {
            q: "O que define o preço do bitcoin?",
            options: ["O Banco Central", "Oferta e demanda no mercado", "O lucro de uma empresa"],
            correct: 1,
            explain: "Não há emissor central nem fluxo de caixa associado.",
          },
        ],
      },
      {
        id: "ethereum",
        title: "Ethereum",
        minutes: 3,
        summary: "Uma plataforma para contratos inteligentes.",
        cards: [
          {
            title: "Mais que uma moeda",
            body: "O Ethereum permite criar contratos inteligentes: programas que executam regras automaticamente na blockchain. O ether (ETH) paga as taxas da rede.",
          },
        ],
        quiz: [
          {
            q: "Para que serve o ether (ETH) na rede Ethereum?",
            options: ["Pagar as taxas das transações", "Garantir depósitos pelo FGC", "Emitir ações"],
            correct: 0,
            explain: "O ETH remunera quem valida as transações.",
          },
        ],
      },
      {
        id: "blockchain",
        title: "Blockchain",
        minutes: 3,
        summary: "Um registro público e difícil de alterar.",
        cards: [
          {
            title: "Um livro-razão compartilhado",
            body: "A blockchain é uma sequência de blocos de transações, replicada em milhares de computadores. Alterar um registro antigo exigiria refazer todos os blocos seguintes, o que é muito caro.",
          },
        ],
        quiz: [
          {
            q: "Por que é difícil alterar transações antigas em uma blockchain?",
            options: ["Porque uma empresa proíbe", "Porque seria preciso refazer todos os blocos seguintes em uma rede distribuída", "Porque os dados são apagados"],
            correct: 1,
            explain: "A segurança vem da distribuição e do encadeamento dos blocos.",
          },
        ],
      },
      {
        id: "custodia-carteiras",
        title: "Custódia e carteiras digitais",
        minutes: 4,
        summary: "Quem guarda as chaves controla os ativos.",
        cards: [
          {
            title: "Corretora ou autocustódia",
            body: "Na corretora, ela guarda os ativos por você — prático, mas há risco de falha da empresa. Na autocustódia, você guarda as chaves privadas — mais controle, mas perder a frase de recuperação significa perder tudo.",
          },
          {
            title: "Regra de ouro",
            body: "Nunca compartilhe sua frase de recuperação ou chave privada com ninguém, nem com o suporte de qualquer empresa.",
          },
        ],
        quiz: [
          {
            q: "Alguém do 'suporte' pede sua frase de recuperação. Você deve:",
            options: ["Enviar para resolver o problema", "Nunca compartilhar: é tentativa de golpe", "Enviar só metade"],
            correct: 1,
            explain: "Quem tem a frase controla os seus ativos.",
          },
        ],
      },
      {
        id: "riscos-golpes",
        title: "Riscos, golpes e volatilidade",
        minutes: 4,
        summary: "Como reconhecer as armadilhas mais comuns.",
        cards: [
          {
            title: "Sinais de alerta",
            body: "Promessa de retorno garantido, pressão para decidir rápido, ganhos por indicação de novos participantes e pedidos de senha ou chave privada são sinais típicos de pirâmide ou golpe.",
          },
          {
            title: "Tamanho da posição",
            body: "Pela alta volatilidade, muitos educadores sugerem que cripto, se fizer parte da carteira, seja uma parcela pequena e que você aceite perder integralmente.",
          },
        ],
        quiz: [
          {
            q: "Qual destes é sinal típico de pirâmide financeira?",
            options: ["Ganhos que dependem de trazer novos participantes", "Taxa de custódia", "Cotação que oscila"],
            correct: 0,
            explain: "Pirâmides pagam os antigos com o dinheiro dos novos.",
          },
        ],
      },
    ],
  },
  {
    id: "carteira",
    number: 5,
    title: "Construindo uma carteira",
    description: "Organizar objetivos, prazos e disciplina.",
    lessons: [
      {
        id: "diversificacao",
        title: "Diversificação",
        minutes: 5,
        summary: "Não colocar todos os ovos na mesma cesta.",
        cards: [
          {
            title: "Por que diversificar",
            body: "Ativos diferentes reagem de formas diferentes aos mesmos eventos. Combiná-los reduz o impacto de um problema específico sobre o total da carteira.",
            widget: "diversificacao",
          },
          {
            title: "Diversificar não é ter muitos ativos iguais",
            body: "Dez ações do mesmo setor diversificam pouco. Diversificação real envolve classes, setores, emissores e, eventualmente, moedas diferentes.",
          },
        ],
        quiz: [
          {
            q: "Qual carteira é mais diversificada?",
            options: ["5 ações de bancos", "Tesouro Selic, ETF de ações e FII", "3 criptomoedas"],
            correct: 1,
            explain: "Classes diferentes respondem de forma diferente aos eventos.",
          },
        ],
      },
      {
        id: "objetivos",
        title: "Objetivos de curto e longo prazo",
        minutes: 4,
        summary: "Cada objetivo pede um tipo de investimento.",
        cards: [
          {
            title: "Separe por objetivo",
            body: "Reserva de emergência, viagem em 1 ano, entrada de um imóvel em 5 anos e aposentadoria em 30 anos têm prazos e tolerâncias diferentes. Tratar tudo como um único bolo leva a escolhas inadequadas.",
          },
          {
            title: "Prazo define o risco possível",
            body: "Quanto mais curto o prazo, menor deve ser a exposição a ativos voláteis. Prazos longos permitem atravessar oscilações.",
          },
        ],
        quiz: [
          {
            q: "Para a entrada de um carro em 8 meses, o mais coerente é:",
            options: ["Renda fixa com vencimento ou liquidez compatível", "Ações de crescimento", "Criptomoedas"],
            correct: 0,
            explain: "Prazo curto pede previsibilidade.",
          },
        ],
      },
      {
        id: "aportes",
        title: "Aportes recorrentes",
        minutes: 3,
        summary: "Constância vence o timing.",
        cards: [
          {
            title: "O hábito importa mais que o momento",
            body: "Tentar acertar o melhor dia para comprar é difícil até para profissionais. Investir um valor todo mês cria disciplina e dilui o preço médio ao longo do tempo.",
          },
        ],
        quiz: [
          {
            q: "Aportes mensais regulares ajudam a:",
            options: ["Garantir lucro", "Criar disciplina e diluir o preço médio", "Eliminar o risco"],
            correct: 1,
            explain: "Não eliminam risco, mas reduzem a dependência de um único momento de compra.",
          },
        ],
      },
      {
        id: "rebalanceamento",
        title: "Rebalanceamento",
        minutes: 4,
        summary: "Voltar à distribuição planejada.",
        cards: [
          {
            title: "Como funciona",
            body: "Se você planejou 70% em renda fixa e 30% em ações, e as ações subiram até virar 40%, rebalancear é direcionar novos aportes (ou vender parte) para voltar à proporção original.",
          },
          {
            title: "Com que frequência",
            body: "Muitas pessoas revisam a cada 6 ou 12 meses, ou quando uma classe se afasta muito do alvo. Considere custos e impostos antes de vender.",
          },
        ],
        quiz: [
          {
            q: "Rebalancear normalmente significa:",
            options: ["Comprar mais do que mais subiu", "Ajustar a carteira para a proporção planejada", "Vender tudo uma vez por ano"],
            correct: 1,
            explain: "O objetivo é manter o nível de risco escolhido.",
          },
        ],
      },
      {
        id: "custos-impostos",
        title: "Custos e impostos",
        minutes: 4,
        summary: "O que sai do seu rendimento todos os anos.",
        cards: [
          {
            title: "Custos invisíveis",
            body: "Taxa de administração, taxa de performance, custódia e corretagem reduzem o rendimento líquido. Compare sempre produtos pelo retorno após custos e impostos.",
          },
          {
            title: "Impostos na bolsa",
            body: "Em ações, vendas de até R$ 20 mil por mês têm isenção de IR sobre o lucro em operações comuns; acima disso, 15%. Day trade tem regras próprias (20%). Rendimentos de FIIs são isentos nas condições da lei. As regras podem mudar: confirme a legislação vigente.",
          },
        ],
        quiz: [
          {
            q: "Qual é a forma correta de comparar dois investimentos?",
            options: ["Pela rentabilidade bruta", "Pelo rendimento líquido de custos e impostos", "Pela popularidade"],
            correct: 1,
            explain: "O que importa é o que efetivamente fica com você.",
          },
        ],
      },
    ],
  },
];

export const ALL_LESSONS = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title, moduleNumber: m.number })));

export function findLesson(moduleId: string, lessonId: string) {
  const m = MODULES.find((x) => x.id === moduleId);
  const l = m?.lessons.find((x) => x.id === lessonId);
  return m && l ? { module: m, lesson: l } : null;
}
