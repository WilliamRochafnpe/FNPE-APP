
export const MUNICIPIOS_POR_UF: Record<string, string[]> = {
  AC: ["Rio Branco", "Cruzeiro do Sul", "Sena Madureira", "Tarauacá", "Feijó", "Brasileia", "Senador Guiomard", "Epitaciolândia", "Xapuri"],
  AM: ["Manaus", "Parintins", "Itacoatiara", "Manacapuru", "Coari", "Tabatinga", "Maués", "Tefé", "Manicoré", "Humaitá", "Iranduba", "Lábrea", "São Gabriel da Cachoeira", "Benjamin Constant", "Borba", "Autazes"],
  AP: ["Macapá", "Santana", "Laranjal do Jari", "Oiapoque", "Porto Grande", "Mazagão", "Vitória do Jari", "Tartarugalzinho", "Amapá", "Ferreira Gomes"],
  PA: ["Belém", "Ananindeua", "Santarém", "Marabá", "Parauapebas", "Castanhal", "Abaetetuba", "Cametá", "Marituba", "Bragança", "Barcarena", "Altamira", "Tucuruí", "Paragominas", "Tailândia", "Breves", "Itaituba"],
  RO: ["Porto Velho", "Ji-Paraná", "Ariquemes", "Vilhena", "Cacoal", "Guajará-Mirim", "Jaru", "Rolim de Moura", "Pimenta Bueno"],
  RR: ["Boa Vista", "Rorainópolis", "Caracaraí", "Pacaraima", "Cantá", "Mucajaí", "Alto Alegre"],
  TO: ["Palmas", "Araguaína", "Gurupi", "Porto Nacional", "Paraíso do Tocantins", "Araguatins", "Colinas do Tocantins", "Guaraí"],
  SP: ["São Paulo", "Campinas", "Guarulhos", "São Bernardo do Campo", "Santo André", "São José dos Campos", "Ribeirão Preto", "Sorocaba", "Santos"],
  RJ: ["Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "Campos dos Goytacazes", "São João de Meriti"],
  MG: ["Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba"],
  DF: ["Brasília"],
  // Adicionar outros sob demanda ou via API IBGE no futuro
};

// Fallback para outros estados não detalhados acima
BR_STATES_LIST_ALL: {
  // Para estados não listados no MVP, poderíamos carregar via fetch ou manter uma lista reduzida
}
