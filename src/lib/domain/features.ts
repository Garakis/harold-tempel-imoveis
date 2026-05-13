/**
 * Canonical feature catalog used by the admin property form.
 * Order matters (controls render order). Grouped semantically.
 */
export interface FeatureDef {
  slug: string;
  label: string;
}

export interface FeatureGroup {
  group: string;
  items: FeatureDef[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    group: "Infraestrutura",
    items: [
      { slug: "agua", label: "Água" },
      { slug: "energia_eletrica", label: "Energia elétrica" },
      { slug: "esgoto", label: "Esgoto" },
      { slug: "gerador", label: "Gerador" },
      { slug: "pavimentacao", label: "Pavimentação" },
      { slug: "tv_a_cabo", label: "TV a cabo" },
      { slug: "interfone", label: "Interfone" },
      { slug: "portao_eletronico", label: "Portão eletrônico" },
      { slug: "alarme", label: "Alarme" },
      { slug: "ar_condicionado", label: "Ar condicionado" },
      { slug: "aquecimento_solar", label: "Aquecimento solar" },
      { slug: "elevador", label: "Elevador" },
      { slug: "mobiliado", label: "Mobiliado" },
    ],
  },
  {
    group: "Ambientes",
    items: [
      { slug: "cozinha", label: "Cozinha" },
      { slug: "copa", label: "Copa" },
      { slug: "lavabo", label: "Lavabo" },
      { slug: "despensa", label: "Despensa" },
      { slug: "lavanderia", label: "Lavanderia" },
      { slug: "area_de_servico", label: "Área de serviço" },
      { slug: "escritorio", label: "Escritório" },
      { slug: "varanda", label: "Varanda" },
      { slug: "varanda_gourmet", label: "Varanda gourmet" },
      { slug: "sacada", label: "Sacada" },
      { slug: "mezanino", label: "Mezanino" },
      { slug: "edicula", label: "Edícula" },
      { slug: "quintal", label: "Quintal" },
      { slug: "dormitorio_empregada", label: "Dormitório de empregada" },
      { slug: "banheiro_empregada", label: "Banheiro de empregada" },
      { slug: "vestiario", label: "Vestiário" },
    ],
  },
  {
    group: "Armários",
    items: [
      { slug: "armario_cozinha", label: "Armário cozinha" },
      { slug: "armario_quarto", label: "Armário quarto" },
      { slug: "armario_banheiro", label: "Armário banheiro" },
      { slug: "armario_sala", label: "Armário sala" },
      { slug: "armario_closet", label: "Armário closet" },
      { slug: "armario_corredor", label: "Armário corredor" },
      { slug: "armario_escritorio", label: "Armário escritório" },
      { slug: "armario_area_de_servico", label: "Armário área de serviço" },
    ],
  },
  {
    group: "Lazer",
    items: [
      { slug: "piscina", label: "Piscina" },
      { slug: "churrasqueira", label: "Churrasqueira" },
      { slug: "hidromassagem", label: "Hidromassagem" },
      { slug: "solarium", label: "Solarium" },
      { slug: "campo_futebol", label: "Campo de futebol" },
      { slug: "quadra_poliesportiva", label: "Quadra poliesportiva" },
    ],
  },
  {
    group: "Pisos",
    items: [
      { slug: "porcelanato", label: "Porcelanato" },
      { slug: "piso_ceramico", label: "Piso cerâmico" },
      { slug: "piso_granito", label: "Piso granito" },
      { slug: "piso_marmore", label: "Piso mármore" },
      { slug: "piso_ardosia", label: "Piso ardósia" },
      { slug: "taco_madeira", label: "Taco de madeira" },
    ],
  },
  {
    group: "Condomínio",
    items: [
      { slug: "em_condominio_fechado", label: "Em condomínio fechado" },
      { slug: "sem_condominio", label: "Sem condomínio" },
    ],
  },
  {
    group: "Rural",
    items: [
      { slug: "acude", label: "Açude" },
      { slug: "lago", label: "Lago" },
      { slug: "rio", label: "Rio" },
      { slug: "pomar", label: "Pomar" },
      { slug: "pastagem", label: "Pastagem" },
      { slug: "reserva_legal", label: "Reserva legal" },
      { slug: "caseiro", label: "Caseiro" },
      { slug: "curral", label: "Curral" },
      { slug: "cerca", label: "Cerca" },
      { slug: "granja", label: "Granja" },
      { slug: "pecuaria", label: "Pecuária" },
      { slug: "poco_artesiano", label: "Poço artesiano" },
      { slug: "tanque_peixe", label: "Tanque de peixe" },
      { slug: "maquinario", label: "Maquinário" },
    ],
  },
];
