export type Location = {
  id: string;
  address: string;
  name: string;
  service: string;
  providerUnits: number | null;
  source: string;
  matchAddress?: string;
  scopeNote?: string;
  image?: string;
};
const programs = 'https://www.woodgreen.org/programs/';
const independent = 'https://www.woodgreen.org/services/independent-living';
const supportive = 'https://www.woodgreen.org/services/supportive-housing';
export const portfolio: Location[] = [
  {
    id: 'logan',
    address: '444 Logan Avenue',
    name: 'Ray McCleary Towers',
    service: 'Independent living',
    providerUnits: 167,
    source: programs + '444-logan',
    matchAddress: '444 LOGAN AVE',
    image:
      'https://www.woodgreen.org/wp-content/uploads/2021/11/444-Logan-Edited-.png',
  },
  {
    id: 'queen1070',
    address: '1070 Queen Street East',
    name: 'Jack Layton Seniors Housing',
    service: 'Assisted living',
    providerUnits: 175,
    source: programs + '1070-queen-street-east',
    matchAddress: '1070 QUEEN ST E',
    scopeNote:
      'WoodGreen lists 175 independent units plus separate cluster housing. City registration covers the building.',
    image:
      'https://www.woodgreen.org/wp-content/uploads/2021/11/1070-Queen-StreetEast-BuildingExteror-Edited.png',
  },
  {
    id: 'laxton',
    address: '2 Laxton Avenue',
    name: 'Laxton Avenue',
    service: 'Independent living',
    providerUnits: 52,
    source: independent,
    matchAddress: '2 LAXTON AVE',
  },
  {
    id: 'jameson',
    address: '182 Jameson Avenue',
    name: 'Jameson Avenue',
    service: 'Independent living',
    providerUnits: 82,
    source: programs + '182-jameson',
    matchAddress: '182 JAMESON AVE',
  },
  {
    id: 'pape',
    address: '55 Pape Avenue',
    name: 'Pape Avenue',
    service: 'Independent living',
    providerUnits: 63,
    source: programs + '55-pape-avenue',
    matchAddress: '55 PAPE AVE',
  },
  {
    id: 'renwick',
    address: '17 Renwick Crescent',
    name: 'Renwick Crescent',
    service: 'Independent living',
    providerUnits: 80,
    source: independent,
    matchAddress: '17 RENWICK CRES',
    scopeNote: 'WoodGreen describes a mix of apartments and townhouses.',
  },
  {
    id: 'heather',
    address: '1119 Gerrard Street East',
    name: 'Heather Terraces',
    service: 'Independent living',
    providerUnits: 29,
    source: independent,
    matchAddress: '1119 GERRARD ST E',
  },
  {
    id: 'sears',
    address: '137 Sears Street',
    name: 'Sears Street',
    service: 'Independent living',
    providerUnits: 17,
    source: independent,
    matchAddress: '137 SEARS ST',
  },
  {
    id: 'eastern',
    address: '802 Eastern Avenue',
    name: 'Eastern Avenue',
    service: 'Independent living',
    providerUnits: 16,
    source: independent,
    matchAddress: '802 EASTERN AVE',
  },
  {
    id: 'coxwell570',
    address: '570 Coxwell Avenue',
    name: 'Coxwell Avenue',
    service: 'Independent living',
    providerUnits: 11,
    source: independent,
    matchAddress: '570 COXWELL AVE',
  },
  {
    id: 'hilda2339',
    address: '2339 Dufferin Street',
    name: "St. Hilda's Seniors Community",
    service: 'Independent living',
    providerUnits: null,
    source: programs + '2339-dufferin-st-hildas',
    matchAddress: '2339 DUFFERIN ST',
  },
  {
    id: 'hilda2353',
    address: '2353 Dufferin Street',
    name: 'Lewis Garnsworthy Residence',
    service: 'Independent living',
    providerUnits: null,
    source: programs + '2353-dufferin-st-hildas',
    matchAddress: '2353 DUFFERIN ST',
  },
  {
    id: 'vaughan',
    address: '800 Vaughan Road',
    name: 'Homes for Good',
    service: 'Supportive housing',
    providerUnits: 78,
    source: programs + 'homes-for-good',
    matchAddress: '800 VAUGHAN RD',
    scopeNote:
      'WoodGreen lists 78 program units. The City record may cover a larger building; these are different scopes.',
  },
  {
    id: 'queen1080',
    address: '1080 Queen Street East',
    name: 'Seniors Cluster Care',
    service: 'Assisted living',
    providerUnits: 9,
    source: 'https://www.woodgreen.org/services/assisted-living',
    matchAddress: '1080 QUEEN ST E',
    scopeNote:
      'Nine program units. No assumption of RentSafeTO registration or exemption.',
  },
  {
    id: 'wellesley',
    address: '490 Sherbourne Street',
    name: 'Wellesley Central Residences',
    service: 'Assisted living',
    providerUnits: 112,
    source: 'https://www.woodgreen.org/services/assisted-living',
    matchAddress: '490 SHERBOURNE ST',
    scopeNote:
      'Partnered operation with Fife House. Building-wide records are not attributed exclusively to WoodGreen.',
  },
  {
    id: 'cedarvale',
    address: '540 Cedarvale Avenue',
    name: 'Cedarvale Supportive Housing',
    service: 'Supportive housing',
    providerUnits: 59,
    source: 'https://www.woodgreen.org/housing-recent-projects',
    matchAddress: '540 CEDARVALE AVE',
    image:
      'https://www.woodgreen.org/wp-content/uploads/2023/04/Blog-banners-1425-%C3%97-392-px-3.png',
  },
  {
    id: 'bathurst-confidential',
    address: 'Address withheld',
    name: 'Bathurst Street program',
    service: 'Supportive housing',
    providerUnits: 18,
    source: supportive,
    scopeNote:
      'WoodGreen designates the location confidential. Excluded from address matching and monitoring totals.',
  },
  {
    id: 'mutual-confidential',
    address: 'Address withheld',
    name: 'Mutual Street program',
    service: 'Supportive housing',
    providerUnits: 20,
    source: supportive,
    scopeNote:
      'WoodGreen designates the location confidential. Excluded from address matching and monitoring totals.',
  },
  {
    id: 'lewis-confidential',
    address: 'Address withheld',
    name: 'Lewis Street program',
    service: 'Supportive housing',
    providerUnits: 15,
    source: supportive,
    scopeNote:
      'WoodGreen designates the location confidential. Excluded from address matching and monitoring totals.',
  },
  {
    id: 'coxwell-confidential',
    address: 'Address withheld',
    name: 'Coxwell Avenue program',
    service: 'Supportive housing',
    providerUnits: 13,
    source: supportive,
    scopeNote:
      'WoodGreen designates the location confidential. Excluded from address matching and monitoring totals.',
  },
  {
    id: 'queen-confidential',
    address: 'Address withheld',
    name: 'Queen Street East program',
    service: 'Supportive housing',
    providerUnits: 36,
    source: supportive,
    scopeNote:
      'WoodGreen designates the location confidential. Excluded from address matching and monitoring totals.',
  },
];
export const CKAN =
  'https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action';
export const REG_RESOURCE = '3ad76a8c-0518-4df2-b94e-8c747d62f8c1';
export const EVAL_RESOURCE = '244f7a02-da5c-425b-b55f-fbdd133dd732';
export const ORDER_LAYER =
  'https://services3.arcgis.com/b9WvedVPoizGfvfD/arcgis/rest/services/COT_MLS_Bylaw_Property_Violations/FeatureServer/0';
export const CITY_BASE =
  'https://www.toronto.ca/community-people/housing-shelter/rental-housing-rights-information/housing-property-standards/apartment-building-standards/';
export const evaluationUrl = (rsn: string) =>
  CKAN +
  '/datastore_search?' +
  new URLSearchParams({
    resource_id: EVAL_RESOURCE,
    filters: JSON.stringify({ RSN: rsn }),
    limit: '100',
  });
export const orderUrl = (rsn: string) =>
  ORDER_LAYER +
  '/query?' +
  new URLSearchParams({
    where: `FOLDERRSN_RAI = ${rsn}`,
    outFields: '*',
    returnGeometry: 'false',
    f: 'pjson',
  });
export type Order = {
  id: string;
  type: string;
  bylaw: string;
  opened: string | null;
  deficiencies: number | null;
  primary: boolean;
};
export type Building = Location & {
  rsn: string | null;
  cityAddress: string | null;
  units: number | null;
  storeys: number | null;
  management: string | null;
  ward: string | null;
  score: number | null;
  proactive: number | null;
  reactive: number | null;
  evaluated: string | null;
  lat: number | null;
  lng: number | null;
  history: { date: string; score: number | null }[];
  categories: { name: string; rating: number }[];
  orders: Order[] | null;
};
export type Snapshot = {
  checkedAt: string;
  sourceUpdatedAt: string | null;
  buildings: Building[];
  sourceStatus: string;
};
export type Change = {
  id: string;
  buildingId: string;
  kind: string;
  message: string;
  observedAt: string;
  reviewed: number;
};
