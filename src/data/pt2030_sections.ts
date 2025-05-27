
/* src/data/pt2030_sections.ts --------------------------------------------- */
export interface PT2030Section {
  code: string;            // identificador curto
  title: string;           // cabeçalho visível
  description: string;     // subtítulo
  charLimit: number;       // limite de caracteres
}

export const PT2030_SECTIONS: PT2030Section[] = [
  /* ----- 4 – Análise de Mercado ---------------------------------------- */
  {
    code: "4.i",
    title: "Descrição da atividade desenvolvida e evolução nos 5 anos anteriores",
    description: "Caracterização da operação anterior à candidatura",
    charLimit: 1500
  },
  {
    code: "4.ii",
    title: "Mercados mais relevantes – Situação atual",
    description: "Principais mercados clientes do beneficiário",
    charLimit: 1500
  },
  {
    code: "4.iii",
    title: "Novos mercados com a realização do projeto",
    description: "Mercados que se pretende captar após o investimento",
    charLimit: 1500
  },
  {
    code: "4.iv",
    title: "Estratégia de captação de mercados (marketing-mix)",
    description: "Plano de marketing e previsão de vendas",
    charLimit: 1500
  },

  /* ----- 6 – Vendas ao exterior indirectas ----------------------------- */
  {
    code: "6.fundamentacao",
    title: "Fundamentação das vendas ao exterior indiretas",
    description: "Justificação e caracterização dos clientes exportadores",
    charLimit: 1500
  },

  /* ----- 7 – Substituição das importações ------------------------------ */
  {
    code: "7.fundamentacao",
    title: "Fundamentação da substituição das importações",
    description: "Explicação de como o projeto reduz importações",
    charLimit: 1500
  },

  /* ----- 9 – Designação do projeto ------------------------------------- */
  {
    code: "9.designacao",
    title: "Designação do projeto",
    description: "Nome, sumário e objectivos gerais",
    charLimit: 9000
  },

  /* ----- 12 – Atividades de inovação ----------------------------------- */
  {
    code: "12.i",
    title: "Justificação do grau de inovação / novidade",
    description: "Correlação com as atividades de inovação propostas",
    charLimit: 4500
  },

  /* ----- 13 – Custos ---------------------------------------------------- */
  {
    code: "13.i",
    title: "Descrição dos procedimentos aquisitivos",
    description: "Evidência da selecção de fornecedores em condições de mercado",
    charLimit: 1500
  },

  /* ----- 19 – Enquadramento Temático ----------------------------------- */
  {
    code: "19.fundamentacao",
    title: "Fundamentação do Enquadramento Temático (EREI)",
    description: "Justificação da linha de acção e domínio diferenciador",
    charLimit: 9000
  },

  /* ----- 20 – Critérios de Selecção ------------------------------------ */
  {
    code: "20.B1",
    title: "Critério B.1 – Coerência e adequação da operação",
    description: "Relação entre diagnóstico, objectivos e plano de investimentos",
    charLimit: 1000
  },
  {
    code: "20.C1",
    title: "Critério C.1 – Capacidade de gestão e implementação",
    description: "Competências da equipa, experiência e meios disponíveis",
    charLimit: 1000
  },
  {
    code: "20.D12",
    title: "Critério D.1.2 – Contributo para o emprego qualificado",
    description: "Impacto em criação e retenção de emprego de valor acrescentado",
    charLimit: 1000
  },
  {
    code: "20.D13",
    title: "Critério D.1.3 – Propensão para mercados internacionais",
    description: "Grau de internacionalização previsto para o projeto",
    charLimit: 1000
  },
  {
    code: "20.D2",
    title: "Critério D.2 – Convergência regional",
    description: "Contributo do investimento para reduzir assimetrias territoriais",
    charLimit: 1000
  }
];
