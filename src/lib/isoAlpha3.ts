/**
 * Mapa ISO 3166-1 numérico → Alpha-3.
 * El TopoJSON mundial (world-atlas countries-110m) identifica cada país por
 * su código numérico en la propiedad `id`; nuestra BD usa Alpha-3 (PER, MEX...).
 */

export const ISO_NUMERIC_TO_ALPHA3: Record<string, string> = {
  '004': 'AFG', '008': 'ALB', '012': 'DZA', '016': 'ASM', '020': 'AND', '024': 'AGO',
  '031': 'AZE', '032': 'ARG', '036': 'AUS', '040': 'AUT', '044': 'BHS', '048': 'BHR',
  '050': 'BGD', '051': 'ARM', '052': 'BRB', '056': 'BEL', '060': 'BMU', '064': 'BTN',
  '068': 'BOL', '070': 'BIH', '072': 'BWA', '076': 'BRA', '084': 'BLZ', '086': 'IOT',
  '090': 'SLB', '092': 'VGB', '096': 'BRN', '100': 'BGR', '104': 'MMR', '108': 'BDI',
  '112': 'BLR', '116': 'KHM', '120': 'CMR', '124': 'CAN', '132': 'CPV', '136': 'CYM',
  '140': 'CAF', '144': 'LKA', '148': 'TCD', '152': 'CHL', '156': 'CHN', '158': 'TWN',
  '162': 'CXR', '166': 'CCK', '170': 'COL', '174': 'COM', '175': 'MYT', '178': 'COG',
  '180': 'COD', '184': 'COK', '188': 'CRI', '191': 'HRV', '192': 'CUB', '196': 'CYP',
  '203': 'CZE', '204': 'BEN', '208': 'DNK', '212': 'DMA', '214': 'DOM', '218': 'ECU',
  '222': 'SLV', '226': 'GNQ', '231': 'ETH', '232': 'ERI', '233': 'EST', '234': 'FRO',
  '238': 'FLK', '239': 'SGS', '242': 'FJI', '246': 'FIN', '248': 'ALA', '250': 'FRA',
  '254': 'GUF', '258': 'PYF', '260': 'ATF', '262': 'DJI', '266': 'GAB', '268': 'GEO',
  '270': 'GMB', '275': 'PSE', '276': 'DEU', '288': 'GHA', '292': 'GIB', '296': 'KIR',
  '300': 'GRC', '304': 'GRL', '308': 'GRD', '312': 'GLP', '316': 'GUM', '320': 'GTM',
  '324': 'GIN', '328': 'GUY', '332': 'HTI', '334': 'HMD', '336': 'VAT', '340': 'HND',
  '344': 'HKG', '348': 'HUN', '352': 'ISL', '356': 'IND', '360': 'IDN', '364': 'IRN',
  '368': 'IRQ', '372': 'IRL', '376': 'ISR', '380': 'ITA', '384': 'CIV', '388': 'JAM',
  '392': 'JPN', '398': 'KAZ', '400': 'JOR', '404': 'KEN', '408': 'PRK', '410': 'KOR',
  '414': 'KWT', '417': 'KGZ', '418': 'LAO', '422': 'LBN', '426': 'LSO', '428': 'LVA',
  '430': 'LBR', '434': 'LBY', '438': 'LIE', '440': 'LTU', '442': 'LUX', '446': 'MAC',
  '450': 'MDG', '454': 'MWI', '458': 'MYS', '462': 'MDV', '466': 'MLI', '470': 'MLT',
  '474': 'MTQ', '478': 'MRT', '480': 'MUS', '484': 'MEX', '492': 'MCO', '496': 'MNG',
  '498': 'MDA', '499': 'MNE', '500': 'MSR', '504': 'MAR', '508': 'MOZ', '512': 'OMN',
  '516': 'NAM', '520': 'NRU', '524': 'NPL', '528': 'NLD', '531': 'CUW', '533': 'ABW',
  '534': 'SXM', '535': 'BES', '540': 'NCL', '548': 'VUT', '554': 'NZL', '558': 'NIC',
  '562': 'NER', '566': 'NGA', '570': 'NIU', '574': 'NFK', '578': 'NOR', '580': 'MNP',
  '583': 'FSM', '584': 'MHL', '585': 'PLW', '586': 'PAK', '591': 'PAN', '598': 'PNG',
  '600': 'PRY', '604': 'PER', '608': 'PHL', '612': 'PCN', '616': 'POL', '620': 'PRT',
  '624': 'GNB', '626': 'TLS', '630': 'PRI', '634': 'QAT', '638': 'REU', '642': 'ROU',
  '643': 'RUS', '646': 'RWA', '652': 'BLM', '654': 'SHN', '659': 'KNA', '660': 'AIA',
  '662': 'LCA', '663': 'MAF', '666': 'SPM', '670': 'VCT', '674': 'SMR', '678': 'STP',
  '682': 'SAU', '686': 'SEN', '688': 'SRB', '690': 'SYC', '694': 'SLE', '702': 'SGP',
  '703': 'SVK', '704': 'VNM', '705': 'SVN', '706': 'SOM', '710': 'ZAF', '716': 'ZWE',
  '724': 'ESP', '728': 'SSD', '729': 'SDN', '732': 'ESH', '740': 'SUR', '744': 'SJM',
  '748': 'SWZ', '752': 'SWE', '756': 'CHE', '760': 'SYR', '762': 'TJK', '764': 'THA',
  '768': 'TGO', '772': 'TKL', '776': 'TON', '780': 'TTO', '784': 'ARE', '788': 'TUN',
  '792': 'TUR', '795': 'TKM', '796': 'TCA', '798': 'TUV', '800': 'UGA', '804': 'UKR',
  '807': 'MKD', '818': 'EGY', '826': 'GBR', '831': 'GGY', '832': 'JEY', '833': 'IMN',
  '834': 'TZA', '840': 'USA', '850': 'VIR', '854': 'BFA', '858': 'URY', '860': 'UZB',
  '862': 'VEN', '876': 'WLF', '882': 'WSM', '887': 'YEM', '894': 'ZMB',
};

/** Devuelve el código Alpha-3 de un id numérico del TopoJSON (o null). */
export function alpha3FromNumericId(id?: string): string | null {
  if (!id) return null;
  return ISO_NUMERIC_TO_ALPHA3[id] ?? null;
}

/** Alpha-3 → ISO 2 letras (para la estructura Country de Joshua Project). */
export const ALPHA3_TO_ALPHA2: Record<string, string> = {
  AFG: 'AF', ALB: 'AL', DZA: 'DZ', ASM: 'AS', AND: 'AD', AGO: 'AO', AZE: 'AZ',
  ARG: 'AR', AUS: 'AU', AUT: 'AT', BHS: 'BS', BHR: 'BH', BGD: 'BD', ARM: 'AM',
  BRB: 'BB', BEL: 'BE', BMU: 'BM', BTN: 'BT', BOL: 'BO', BIH: 'BA', BWA: 'BW',
  BRA: 'BR', BLZ: 'BZ', SLB: 'SB', BRN: 'BN', BGR: 'BG', MMR: 'MM', BDI: 'BI',
  BLR: 'BY', KHM: 'KH', CMR: 'CM', CAN: 'CA', CPV: 'CV', CAF: 'CF', LKA: 'LK',
  TCD: 'TD', CHL: 'CL', CHN: 'CN', TWN: 'TW', COL: 'CO', COM: 'KM', COG: 'CG',
  COD: 'CD', CRI: 'CR', HRV: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', BEN: 'BJ',
  DNK: 'DK', DMA: 'DM', DOM: 'DO', ECU: 'EC', SLV: 'SV', GNQ: 'GQ', ETH: 'ET',
  ERI: 'ER', EST: 'EE', FRO: 'FO', FLK: 'FK', FJI: 'FJ', FIN: 'FI', FRA: 'FR',
  GUF: 'GF', PYF: 'PF', DJI: 'DJ', GAB: 'GA', GEO: 'GE', GMB: 'GM', DEU: 'DE',
  GHA: 'GH', GIB: 'GI', KIR: 'KI', GRC: 'GR', GRL: 'GL', GRD: 'GD', GLP: 'GP',
  GUM: 'GU', GTM: 'GT', GIN: 'GN', GUY: 'GY', HTI: 'HT', HND: 'HN', HKG: 'HK',
  HUN: 'HU', ISL: 'IS', IND: 'IN', IDN: 'ID', IRN: 'IR', IRQ: 'IQ', IRL: 'IE',
  ISR: 'IL', ITA: 'IT', CIV: 'CI', JAM: 'JM', JPN: 'JP', KAZ: 'KZ', JOR: 'JO',
  KEN: 'KE', PRK: 'KP', KOR: 'KR', KWT: 'KW', KGZ: 'KG', LAO: 'LA', LBN: 'LB',
  LSO: 'LS', LVA: 'LV', LBR: 'LR', LBY: 'LY', LIE: 'LI', LTU: 'LT', LUX: 'LU',
  MDG: 'MG', MWI: 'MW', MYS: 'MY', MDV: 'MV', MLI: 'ML', MLT: 'MT', MRT: 'MR',
  MUS: 'MU', MEX: 'MX', MCO: 'MC', MNG: 'MN', MDA: 'MD', MNE: 'ME', MSR: 'MS',
  MAR: 'MA', MOZ: 'MZ', OMN: 'OM', NAM: 'NA', NPL: 'NP', NLD: 'NL', CUW: 'CW',
  ABW: 'AW', SXM: 'SX', NCL: 'NC', VUT: 'VU', NZL: 'NZ', NIC: 'NI', NER: 'NE',
  NGA: 'NG', NIU: 'NU', NFK: 'NF', NOR: 'NO', MNP: 'MP', FSM: 'FM', MHL: 'MH',
  PLW: 'PW', PAK: 'PK', PAN: 'PA', PNG: 'PG', PRY: 'PY', PER: 'PE', PHL: 'PH',
  PCN: 'PN', POL: 'PL', PRT: 'PT', GNB: 'GW', TLS: 'TL', PRI: 'PR', QAT: 'QA',
  ROU: 'RO', RUS: 'RU', RWA: 'RW', SHN: 'SH', KNA: 'KN', AIA: 'AI', LCA: 'LC',
  VCT: 'VC', SMR: 'SM', STP: 'ST', SAU: 'SA', SEN: 'SN', SRB: 'RS', SYC: 'SC',
  SLE: 'SL', SGP: 'SG', SVK: 'SK', VNM: 'VN', SVN: 'SI', SOM: 'SO', ZAF: 'ZA',
  ZWE: 'ZW', ESP: 'ES', SSD: 'SS', SDN: 'SD', SUR: 'SR', SJM: 'SJ', SWZ: 'SZ',
  SWE: 'SE', CHE: 'CH', SYR: 'SY', TJK: 'TJ', THA: 'TH', TGO: 'TG', TKL: 'TK',
  TON: 'TO', TTO: 'TT', ARE: 'AE', TUN: 'TN', TUR: 'TR', TKM: 'TM', TUV: 'TV',
  UGA: 'UG', UKR: 'UA', MKD: 'MK', EGY: 'EG', GBR: 'GB', GGY: 'GG', JEY: 'JE',
  IMN: 'IM', TZA: 'TZ', USA: 'US', VIR: 'VI', BFA: 'BF', URY: 'UY', UZB: 'UZ',
  VEN: 'VE', WLF: 'WF', WSM: 'WS', YEM: 'YE', ZMB: 'ZM',
};

/** Convierte Alpha-3 (PER) a ISO 2 (PE); devuelve el input si no hay mapeo. */
export function alpha2FromAlpha3(alpha3?: string): string | undefined {
  if (!alpha3) return undefined;
  return ALPHA3_TO_ALPHA2[alpha3.toUpperCase()] ?? alpha3.toUpperCase();
}

/** ISO-2 → Alpha-3 (inverso del mapa anterior, ej. PE → PER). */
const ALPHA2_TO_ALPHA3: Record<string, string> = Object.fromEntries(
  Object.entries(ALPHA3_TO_ALPHA2).map(([alpha3, alpha2]) => [alpha2, alpha3])
);

/** Convierte ISO-2 (PE) a Alpha-3 (PER); devuelve el input si no hay mapeo. */
export function alpha3FromAlpha2(alpha2?: string): string | undefined {
  if (!alpha2) return undefined;
  return ALPHA2_TO_ALPHA3[alpha2.toUpperCase()] ?? alpha2.toUpperCase();
}