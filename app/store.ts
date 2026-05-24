export type LogItem = {
  id: string;
  type: 'amning' | 'flaske' | 'lur' | 'ble';
  tekst: string;
  tid: string;
  tidspunkt?: string;       // ISO-streng, fx new Date().toISOString()
  barn: 'a' | 'b';
  værdi?: number;
  bryst?: 'venstre' | 'højre';
  bleType?: 'vaad' | 'beskidt' | 'begge';
  lurStart?: number;
  lurSlut?: number;
};

export type BarnData = {
  log: LogItem[];
  amningStart: Date | null;
  amningBryst: 'højre' | 'venstre' | null;
  lurStart: Date | null;
};

export type AppData = {
  børn: { a: BarnData; b: BarnData };
  navne: { a: string; b: string };
  farver: { a: string; b: string };
};

export const initialData: AppData = {
  børn: {
    a: { log: [], amningStart: null, amningBryst: null, lurStart: null },
    b: { log: [], amningStart: null, amningBryst: null, lurStart: null },
  },
  navne: { a: 'Barn A', b: 'Barn B' },
  farver: { a: '#2C1810', b: '#7B9EB8' },
};

export const FARVER = [
  { hex: '#2C1810', bg: '#F5EDE5', tekst: '#2C1810' },
  { hex: '#8B5E3C', bg: '#F7EDE3', tekst: '#5C3518' },
  { hex: '#C17D5A', bg: '#FAF0E8', tekst: '#7A3E1E' },
  { hex: '#D4A373', bg: '#FBF3E8', tekst: '#7A5020' },
  { hex: '#6B8F71', bg: '#EDF4EE', tekst: '#2E5733' },
  { hex: '#8B9E6E', bg: '#F0F4E8', tekst: '#3D5020' },
  { hex: '#7B9EB8', bg: '#EAF0F5', tekst: '#2C4A5E' },
  { hex: '#9B8BB0', bg: '#F2EEF7', tekst: '#4A3566' },
  { hex: '#C4848A', bg: '#F7ECEC', tekst: '#6B2830' },
  { hex: '#B5A090', bg: '#F5F0EB', tekst: '#5C4535' },
];

export const TEMA = {
  baggrund: '#FDF8F3',
  kort: '#FFFFFF',
  border: '#EDE5DC',
  borderLight: '#F5EDE5',
  tekstPrimær: '#2C1810',
  tekstSekundær: '#B5A090',
  aktiv: '#FFF3EC',
  aktivBorder: '#F5C4A0',
};