import type { Team } from '../types';

export const TEAMS: Team[] = [
  // GRUPO A
  { id: 'mex', name: 'México', code: 'MEX', flag: '🇲🇽', crest: 'https://flagcdn.com/w40/mx.png', strength: 72, group: 'A' },
  { id: 'rsa', name: 'África do Sul', code: 'RSA', flag: '🇿🇦', crest: 'https://flagcdn.com/w40/za.png', strength: 58, group: 'A' },
  { id: 'kor', name: 'Coreia do Sul', code: 'KOR', flag: '🇰🇷', crest: 'https://flagcdn.com/w40/kr.png', strength: 74, group: 'A' },
  { id: 'cze', name: 'República Tcheca', code: 'CZE', flag: '🇨🇿', crest: 'https://flagcdn.com/w40/cz.png', strength: 68, group: 'A' },

  // GRUPO B
  { id: 'can', name: 'Canadá', code: 'CAN', flag: '🇨🇦', crest: 'https://flagcdn.com/w40/ca.png', strength: 68, group: 'B' },
  { id: 'bih', name: 'Bósnia e Herzegovina', code: 'BIH', flag: '🇧🇦', crest: 'https://flagcdn.com/w40/ba.png', strength: 65, group: 'B' },
  { id: 'qat', name: 'Catar', code: 'QAT', flag: '🇶🇦', crest: 'https://flagcdn.com/w40/qa.png', strength: 60, group: 'B' },
  { id: 'sui', name: 'Suíça', code: 'SUI', flag: '🇨🇭', crest: 'https://flagcdn.com/w40/ch.png', strength: 76, group: 'B' },

  // GRUPO C
  { id: 'bra', name: 'Brasil', code: 'BRA', flag: '🇧🇷', crest: 'https://flagcdn.com/w40/br.png', strength: 90, group: 'C' },
  { id: 'mar', name: 'Marrocos', code: 'MAR', flag: '🇲🇦', crest: 'https://flagcdn.com/w40/ma.png', strength: 78, group: 'C' },
  { id: 'hai', name: 'Haiti', code: 'HAI', flag: '🇭🇹', crest: 'https://flagcdn.com/w40/ht.png', strength: 45, group: 'C' },
  { id: 'sco', name: 'Escócia', code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', crest: 'https://flagcdn.com/w40/gb-sct.png', strength: 64, group: 'C' },

  // GRUPO D
  { id: 'usa', name: 'Estados Unidos', code: 'USA', flag: '🇺🇸', crest: 'https://flagcdn.com/w40/us.png', strength: 75, group: 'D' },
  { id: 'par', name: 'Paraguai', code: 'PAR', flag: '🇵🇾', crest: 'https://flagcdn.com/w40/py.png', strength: 56, group: 'D' },
  { id: 'aus', name: 'Austrália', code: 'AUS', flag: '🇦🇺', crest: 'https://flagcdn.com/w40/au.png', strength: 65, group: 'D' },
  { id: 'tur', name: 'Turquia', code: 'TUR', flag: '🇹🇷', crest: 'https://flagcdn.com/w40/tr.png', strength: 70, group: 'D' },

  // GRUPO E
  { id: 'ger', name: 'Alemanha', code: 'GER', flag: '🇩🇪', crest: 'https://flagcdn.com/w40/de.png', strength: 87, group: 'E' },
  { id: 'cur', name: 'Curaçao', code: 'CUW', flag: '🇨🇼', crest: 'https://flagcdn.com/w40/cw.png', strength: 48, group: 'E' },
  { id: 'civ', name: 'Costa do Marfim', code: 'CIV', flag: '🇨🇮', crest: 'https://flagcdn.com/w40/ci.png', strength: 68, group: 'E' },
  { id: 'ecu', name: 'Equador', code: 'ECU', flag: '🇪🇨', crest: 'https://flagcdn.com/w40/ec.png', strength: 62, group: 'E' },

  // GRUPO F
  { id: 'ned', name: 'Holanda', code: 'NED', flag: '🇳🇱', crest: 'https://flagcdn.com/w40/nl.png', strength: 86, group: 'F' },
  { id: 'jpn', name: 'Japão', code: 'JPN', flag: '🇯🇵', crest: 'https://flagcdn.com/w40/jp.png', strength: 77, group: 'F' },
  { id: 'swe', name: 'Suécia', code: 'SWE', flag: '🇸🇪', crest: 'https://flagcdn.com/w40/se.png', strength: 73, group: 'F' },
  { id: 'tun', name: 'Tunísia', code: 'TUN', flag: '🇹🇳', crest: 'https://flagcdn.com/w40/tn.png', strength: 62, group: 'F' },

  // GRUPO G
  { id: 'bel', name: 'Bélgica', code: 'BEL', flag: '🇧🇪', crest: 'https://flagcdn.com/w40/be.png', strength: 82, group: 'G' },
  { id: 'egy', name: 'Egito', code: 'EGY', flag: '🇪🇬', crest: 'https://flagcdn.com/w40/eg.png', strength: 67, group: 'G' },
  { id: 'irn', name: 'Irã', code: 'IRN', flag: '🇮🇷', crest: 'https://flagcdn.com/w40/ir.png', strength: 66, group: 'G' },
  { id: 'nzl', name: 'Nova Zelândia', code: 'NZL', flag: '🇳🇿', crest: 'https://flagcdn.com/w40/nz.png', strength: 57, group: 'G' },

  // GRUPO H
  { id: 'esp', name: 'Espanha', code: 'ESP', flag: '🇪🇸', crest: 'https://flagcdn.com/w40/es.png', strength: 91, group: 'H' },
  { id: 'cpv', name: 'Cabo Verde', code: 'CPV', flag: '🇨🇻', crest: 'https://flagcdn.com/w40/cv.png', strength: 52, group: 'H' },
  { id: 'ksa', name: 'Arábia Saudita', code: 'KSA', flag: '🇸🇦', crest: 'https://flagcdn.com/w40/sa.png', strength: 64, group: 'H' },
  { id: 'uru', name: 'Uruguai', code: 'URU', flag: '🇺🇾', crest: 'https://flagcdn.com/w40/uy.png', strength: 78, group: 'H' },

  // GRUPO I
  { id: 'fra', name: 'França', code: 'FRA', flag: '🇫🇷', crest: 'https://flagcdn.com/w40/fr.png', strength: 93, group: 'I' },
  { id: 'sen', name: 'Senegal', code: 'SEN', flag: '🇸🇳', crest: 'https://flagcdn.com/w40/sn.png', strength: 73, group: 'I' },
  { id: 'irq', name: 'Iraque', code: 'IRQ', flag: '🇮🇶', crest: 'https://flagcdn.com/w40/iq.png', strength: 55, group: 'I' },
  { id: 'nor', name: 'Noruega', code: 'NOR', flag: '🇳🇴', crest: 'https://flagcdn.com/w40/no.png', strength: 72, group: 'I' },

  // GRUPO J
  { id: 'arg', name: 'Argentina', code: 'ARG', flag: '🇦🇷', crest: 'https://flagcdn.com/w40/ar.png', strength: 92, group: 'J' },
  { id: 'alg', name: 'Argélia', code: 'ALG', flag: '🇩🇿', crest: 'https://flagcdn.com/w40/dz.png', strength: 66, group: 'J' },
  { id: 'aut', name: 'Áustria', code: 'AUT', flag: '🇦🇹', crest: 'https://flagcdn.com/w40/at.png', strength: 71, group: 'J' },
  { id: 'jor', name: 'Jordânia', code: 'JOR', flag: '🇯🇴', crest: 'https://flagcdn.com/w40/jo.png', strength: 52, group: 'J' },

  // GRUPO K
  { id: 'por', name: 'Portugal', code: 'POR', flag: '🇵🇹', crest: 'https://flagcdn.com/w40/pt.png', strength: 88, group: 'K' },
  { id: 'cod', name: 'RD Congo', code: 'COD', flag: '🇨🇩', crest: 'https://flagcdn.com/w40/cd.png', strength: 58, group: 'K' },
  { id: 'uzb', name: 'Uzbequistão', code: 'UZB', flag: '🇺🇿', crest: 'https://flagcdn.com/w40/uz.png', strength: 55, group: 'K' },
  { id: 'col', name: 'Colômbia', code: 'COL', flag: '🇨🇴', crest: 'https://flagcdn.com/w40/co.png', strength: 74, group: 'K' },

  // GRUPO L
  { id: 'eng', name: 'Inglaterra', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', crest: 'https://flagcdn.com/w40/gb-eng.png', strength: 89, group: 'L' },
  { id: 'cro', name: 'Croácia', code: 'CRO', flag: '🇭🇷', crest: 'https://flagcdn.com/w40/hr.png', strength: 80, group: 'L' },
  { id: 'gha', name: 'Gana', code: 'GHA', flag: '🇬🇭', crest: 'https://flagcdn.com/w40/gh.png', strength: 63, group: 'L' },
  { id: 'pan', name: 'Panamá', code: 'PAN', flag: '🇵🇦', crest: 'https://flagcdn.com/w40/pa.png', strength: 55, group: 'L' },
];
