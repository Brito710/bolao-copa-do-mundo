// Pre-defined Bolão Ao Vivo rounds for the 2026 World Cup group stage.
// Match IDs are derived from generateGroupMatches() which uses format:
// group-{GROUP}-{team1}-{team2}  (team1/team2 in TEAMS array order within the group)

export interface PredefinedRoundDef {
  id: string; // stable ID so we don't duplicate in Supabase
  name: string;
  dateRange: string;
  matchIds: string[];
}

export const PREDEFINED_GROUP_ROUNDS: PredefinedRoundDef[] = [
  {
    id: 'live-round-1',
    name: 'Rodada 1',
    dateRange: '11-17 Jun',
    matchIds: [
      // Group A
      'group-A-mex-rsa',  // México x África do Sul
      'group-A-kor-cze',  // Coreia do Sul x Rep. Tcheca
      // Group B
      'group-B-can-bih',  // Canadá x Bósnia
      'group-B-qat-sui',  // Catar x Suíça
      // Group C
      'group-C-bra-mar',  // Brasil x Marrocos
      'group-C-hai-sco',  // Haiti x Escócia
      // Group D
      'group-D-usa-par',  // EUA x Paraguai
      'group-D-aus-tur',  // Austrália x Turquia
      // Group E
      'group-E-ger-cur',  // Alemanha x Curaçao
      'group-E-civ-ecu',  // Costa do Marfim x Equador
      // Group F
      'group-F-ned-jpn',  // Holanda x Japão
      'group-F-swe-tun',  // Suécia x Tunísia
      // Group G
      'group-G-bel-egy',  // Bélgica x Egito
      'group-G-irn-nzl',  // Irã x Nova Zelândia
      // Group H
      'group-H-esp-cpv',  // Espanha x Cabo Verde
      'group-H-ksa-uru',  // Arábia Saudita x Uruguai
      // Group I
      'group-I-fra-sen',  // França x Senegal
      'group-I-irq-nor',  // Iraque x Noruega
      // Group J
      'group-J-arg-alg',  // Argentina x Argélia
      'group-J-aut-jor',  // Áustria x Jordânia
      // Group K
      'group-K-por-cod',  // Portugal x RD Congo
      'group-K-uzb-col',  // Uzbequistão x Colômbia
      // Group L
      'group-L-eng-cro',  // Inglaterra x Croácia
      'group-L-gha-pan',  // Gana x Panamá
    ],
  },
  {
    id: 'live-round-2',
    name: 'Rodada 2',
    dateRange: '18-23 Jun',
    matchIds: [
      // Group A
      'group-A-rsa-cze',  // África do Sul x Rep. Tcheca  (rsa before cze in array)
      'group-A-mex-kor',  // México x Coreia do Sul
      // Group B
      'group-B-bih-sui',  // Bósnia x Suíça
      'group-B-can-qat',  // Canadá x Catar
      // Group C
      'group-C-mar-sco',  // Marrocos x Escócia
      'group-C-bra-hai',  // Brasil x Haiti
      // Group D
      'group-D-par-tur',  // Paraguai x Turquia
      'group-D-usa-aus',  // EUA x Austrália
      // Group E
      'group-E-ger-civ',  // Alemanha x Costa do Marfim
      'group-E-cur-ecu',  // Curaçao x Equador
      // Group F
      'group-F-ned-swe',  // Holanda x Suécia
      'group-F-jpn-tun',  // Japão x Tunísia
      // Group G
      'group-G-bel-irn',  // Bélgica x Irã
      'group-G-egy-nzl',  // Egito x Nova Zelândia
      // Group H
      'group-H-esp-ksa',  // Espanha x Arábia Saudita
      'group-H-cpv-uru',  // Cabo Verde x Uruguai
      // Group I
      'group-I-fra-irq',  // França x Iraque
      'group-I-sen-nor',  // Senegal x Noruega
      // Group J
      'group-J-arg-aut',  // Argentina x Áustria
      'group-J-alg-jor',  // Argélia x Jordânia
      // Group K
      'group-K-por-uzb',  // Portugal x Uzbequistão
      'group-K-cod-col',  // RD Congo x Colômbia
      // Group L
      'group-L-eng-gha',  // Inglaterra x Gana
      'group-L-cro-pan',  // Croácia x Panamá
    ],
  },
  {
    id: 'live-round-3',
    name: 'Rodada 3',
    dateRange: '24-27 Jun',
    matchIds: [
      // Group A — simultâneos
      'group-A-rsa-kor',  // África do Sul x Coreia do Sul
      'group-A-mex-cze',  // México x Rep. Tcheca
      // Group B — simultâneos
      'group-B-bih-qat',  // Bósnia x Catar
      'group-B-can-sui',  // Canadá x Suíça
      // Group C — simultâneos
      'group-C-bra-sco',  // Brasil x Escócia
      'group-C-mar-hai',  // Marrocos x Haiti
      // Group D — simultâneos
      'group-D-usa-tur',  // EUA x Turquia
      'group-D-par-aus',  // Paraguai x Austrália
      // Group E — simultâneos
      'group-E-ger-ecu',  // Alemanha x Equador
      'group-E-cur-civ',  // Curaçao x Costa do Marfim
      // Group F — simultâneos
      'group-F-jpn-swe',  // Japão x Suécia
      'group-F-ned-tun',  // Holanda x Tunísia
      // Group G — simultâneos
      'group-G-egy-irn',  // Egito x Irã
      'group-G-bel-nzl',  // Bélgica x Nova Zelândia
      // Group H — simultâneos
      'group-H-cpv-ksa',  // Cabo Verde x Arábia Saudita
      'group-H-esp-uru',  // Espanha x Uruguai
      // Group I — simultâneos
      'group-I-sen-irq',  // Senegal x Iraque
      'group-I-fra-nor',  // França x Noruega
      // Group J — simultâneos
      'group-J-alg-aut',  // Argélia x Áustria
      'group-J-arg-jor',  // Argentina x Jordânia
      // Group K — simultâneos
      'group-K-cod-uzb',  // RD Congo x Uzbequistão
      'group-K-por-col',  // Portugal x Colômbia
      // Group L — simultâneos
      'group-L-cro-gha',  // Croácia x Gana
      'group-L-eng-pan',  // Inglaterra x Panamá
    ],
  },
];

// IDs used for knockout rounds (created dynamically by admin)
export const KNOCKOUT_ROUND_IDS = {
  r32: 'live-round-r32',
  r16: 'live-round-r16',
  qf: 'live-round-qf',
  sf: 'live-round-sf',
  final: 'live-round-final',
};

export const KNOCKOUT_ROUND_NAMES: Record<string, string> = {
  [KNOCKOUT_ROUND_IDS.r32]: '16-avos de Final',
  [KNOCKOUT_ROUND_IDS.r16]: 'Oitavas de Final',
  [KNOCKOUT_ROUND_IDS.qf]: 'Quartas de Final',
  [KNOCKOUT_ROUND_IDS.sf]: 'Semifinais',
  [KNOCKOUT_ROUND_IDS.final]: '3° Lugar & Final',
};
