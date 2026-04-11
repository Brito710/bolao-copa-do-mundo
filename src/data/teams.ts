import type { Team } from '../types';

export const TEAMS: Team[] = [
  // GROUP A
  { id: 'usa', name: 'Estados Unidos', code: 'USA', flag: '🇺🇸', crest: 'https://flagcdn.com/w40/us.png', strength: 75, group: 'A' },
  { id: 'mex', name: 'México', code: 'MEX', flag: '🇲🇽', crest: 'https://flagcdn.com/w40/mx.png', strength: 72, group: 'A' },
  { id: 'can', name: 'Canadá', code: 'CAN', flag: '🇨🇦', crest: 'https://flagcdn.com/w40/ca.png', strength: 68, group: 'A' },
  { id: 'pan', name: 'Panamá', code: 'PAN', flag: '🇵🇦', crest: 'https://flagcdn.com/w40/pa.png', strength: 55, group: 'A' },

  // GROUP B
  { id: 'bra', name: 'Brasil', code: 'BRA', flag: '🇧🇷', crest: 'https://flagcdn.com/w40/br.png', strength: 90, group: 'B' },
  { id: 'arg', name: 'Argentina', code: 'ARG', flag: '🇦🇷', crest: 'https://flagcdn.com/w40/ar.png', strength: 92, group: 'B' },
  { id: 'col', name: 'Colômbia', code: 'COL', flag: '🇨🇴', crest: 'https://flagcdn.com/w40/co.png', strength: 74, group: 'B' },
  { id: 'bol', name: 'Bolívia', code: 'BOL', flag: '🇧🇴', crest: 'https://flagcdn.com/w40/bo.png', strength: 50, group: 'B' },

  // GROUP C
  { id: 'esp', name: 'Espanha', code: 'ESP', flag: '🇪🇸', crest: 'https://flagcdn.com/w40/es.png', strength: 91, group: 'C' },
  { id: 'por', name: 'Portugal', code: 'POR', flag: '🇵🇹', crest: 'https://flagcdn.com/w40/pt.png', strength: 88, group: 'C' },
  { id: 'mar', name: 'Marrocos', code: 'MAR', flag: '🇲🇦', crest: 'https://flagcdn.com/w40/ma.png', strength: 78, group: 'C' },
  { id: 'sen', name: 'Senegal', code: 'SEN', flag: '🇸🇳', crest: 'https://flagcdn.com/w40/sn.png', strength: 73, group: 'C' },

  // GROUP D
  { id: 'fra', name: 'França', code: 'FRA', flag: '🇫🇷', crest: 'https://flagcdn.com/w40/fr.png', strength: 93, group: 'D' },
  { id: 'ale', name: 'Alemanha', code: 'GER', flag: '🇩🇪', crest: 'https://flagcdn.com/w40/de.png', strength: 87, group: 'D' },
  { id: 'bel', name: 'Bélgica', code: 'BEL', flag: '🇧🇪', crest: 'https://flagcdn.com/w40/be.png', strength: 82, group: 'D' },
  { id: 'tur', name: 'Turquia', code: 'TUR', flag: '🇹🇷', crest: 'https://flagcdn.com/w40/tr.png', strength: 70, group: 'D' },

  // GROUP E
  { id: 'ing', name: 'Inglaterra', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', crest: 'https://flagcdn.com/w40/gb-eng.png', strength: 89, group: 'E' },
  { id: 'hol', name: 'Holanda', code: 'NED', flag: '🇳🇱', crest: 'https://flagcdn.com/w40/nl.png', strength: 86, group: 'E' },
  { id: 'cro', name: 'Croácia', code: 'CRO', flag: '🇭🇷', crest: 'https://flagcdn.com/w40/hr.png', strength: 80, group: 'E' },
  { id: 'pol', name: 'Polônia', code: 'POL', flag: '🇵🇱', crest: 'https://flagcdn.com/w40/pl.png', strength: 68, group: 'E' },

  // GROUP F
  { id: 'ita', name: 'Itália', code: 'ITA', flag: '🇮🇹', crest: 'https://flagcdn.com/w40/it.png', strength: 85, group: 'F' },
  { id: 'sui', name: 'Suíça', code: 'SUI', flag: '🇨🇭', crest: 'https://flagcdn.com/w40/ch.png', strength: 76, group: 'F' },
  { id: 'uru', name: 'Uruguai', code: 'URU', flag: '🇺🇾', crest: 'https://flagcdn.com/w40/uy.png', strength: 78, group: 'F' },
  { id: 'ecu', name: 'Equador', code: 'ECU', flag: '🇪🇨', crest: 'https://flagcdn.com/w40/ec.png', strength: 62, group: 'F' },

  // GROUP G
  { id: 'por2', name: 'Coreia do Sul', code: 'KOR', flag: '🇰🇷', crest: 'https://flagcdn.com/w40/kr.png', strength: 74, group: 'G' },
  { id: 'jap', name: 'Japão', code: 'JPN', flag: '🇯🇵', crest: 'https://flagcdn.com/w40/jp.png', strength: 77, group: 'G' },
  { id: 'aus', name: 'Austrália', code: 'AUS', flag: '🇦🇺', crest: 'https://flagcdn.com/w40/au.png', strength: 65, group: 'G' },
  { id: 'irn', name: 'Irã', code: 'IRN', flag: '🇮🇷', crest: 'https://flagcdn.com/w40/ir.png', strength: 66, group: 'G' },

  // GROUP H
  { id: 'por3', name: 'Egito', code: 'EGY', flag: '🇪🇬', crest: 'https://flagcdn.com/w40/eg.png', strength: 67, group: 'H' },
  { id: 'nig', name: 'Nigéria', code: 'NGA', flag: '🇳🇬', crest: 'https://flagcdn.com/w40/ng.png', strength: 69, group: 'H' },
  { id: 'gha', name: 'Gana', code: 'GHA', flag: '🇬🇭', crest: 'https://flagcdn.com/w40/gh.png', strength: 63, group: 'H' },
  { id: 'cam', name: 'Camarões', code: 'CMR', flag: '🇨🇲', crest: 'https://flagcdn.com/w40/cm.png', strength: 60, group: 'H' },

  // GROUP I
  { id: 'ser', name: 'Sérvia', code: 'SRB', flag: '🇷🇸', crest: 'https://flagcdn.com/w40/rs.png', strength: 72, group: 'I' },
  { id: 'den', name: 'Dinamarca', code: 'DEN', flag: '🇩🇰', crest: 'https://flagcdn.com/w40/dk.png', strength: 78, group: 'I' },
  { id: 'aut', name: 'Áustria', code: 'AUT', flag: '🇦🇹', crest: 'https://flagcdn.com/w40/at.png', strength: 71, group: 'I' },
  { id: 'sco', name: 'Escócia', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', crest: 'https://flagcdn.com/w40/gb-sct.png', strength: 64, group: 'I' },

  // GROUP J
  { id: 'chi', name: 'Chile', code: 'CHI', flag: '🇨🇱', crest: 'https://flagcdn.com/w40/cl.png', strength: 69, group: 'J' },
  { id: 'per', name: 'Peru', code: 'PER', flag: '🇵🇪', crest: 'https://flagcdn.com/w40/pe.png', strength: 65, group: 'J' },
  { id: 'ven', name: 'Venezuela', code: 'VEN', flag: '🇻🇪', crest: 'https://flagcdn.com/w40/ve.png', strength: 58, group: 'J' },
  { id: 'par', name: 'Paraguai', code: 'PAR', flag: '🇵🇾', crest: 'https://flagcdn.com/w40/py.png', strength: 56, group: 'J' },

  // GROUP K
  { id: 'ara', name: 'Arábia Saudita', code: 'KSA', flag: '🇸🇦', crest: 'https://flagcdn.com/w40/sa.png', strength: 64, group: 'K' },
  { id: 'qat', name: 'Qatar', code: 'QAT', flag: '🇶🇦', crest: 'https://flagcdn.com/w40/qa.png', strength: 60, group: 'K' },
  { id: 'uza', name: 'Uzbequistão', code: 'UZB', flag: '🇺🇿', crest: 'https://flagcdn.com/w40/uz.png', strength: 55, group: 'K' },
  { id: 'oma', name: 'Omã', code: 'OMA', flag: '🇴🇲', crest: 'https://flagcdn.com/w40/om.png', strength: 52, group: 'K' },

  // GROUP L
  { id: 'mex2', name: 'Nova Zelândia', code: 'NZL', flag: '🇳🇿', crest: 'https://flagcdn.com/w40/nz.png', strength: 57, group: 'L' },
  { id: 'cos', name: 'Costa Rica', code: 'CRC', flag: '🇨🇷', crest: 'https://flagcdn.com/w40/cr.png', strength: 61, group: 'L' },
  { id: 'jam', name: 'Jamaica', code: 'JAM', flag: '🇯🇲', crest: 'https://flagcdn.com/w40/jm.png', strength: 54, group: 'L' },
  { id: 'hon', name: 'Honduras', code: 'HON', flag: '🇭🇳', crest: 'https://flagcdn.com/w40/hn.png', strength: 53, group: 'L' },
];
