export type LogItem = {
  id: string;
  type: 'amning' | 'flaske' | 'lur' | 'ble';
  tekst: string;
  tid: string;
  barn: 'a' | 'b';
  værdi?: number;
  bleType?: 'vaad' | 'beskidt' | 'begge';
  lurStart?: number;
  lurSlut?: number;
};

export type BarnData = {
  log: LogItem[];
  amningStart: Date | null;
  lurStart: Date | null;
};

export type AppData = {
  børn: { a: BarnData; b: BarnData };
  navne: { a: string; b: string };
  farver: { a: string; b: string };
};

export const initialData: AppData = {
  børn: {
    a: { log: [], amningStart: null, lurStart: null },
    b: { log: [], amningStart: null, lurStart: null },
  },
  navne: { a: 'Barn A', b: 'Barn B' },
  farver: { a: '#1D9E75', b: '#378ADD' },
};

export const FARVER = [
  { hex: '#1D9E75', bg: '#E1F5EE', tekst: '#085041' },
  { hex: '#378ADD', bg: '#E6F1FB', tekst: '#042C53' },
  { hex: '#E0507A', bg: '#FDEDF3', tekst: '#5C0A22' },
  { hex: '#F5A623', bg: '#FEF4E0', tekst: '#5C3800' },
  { hex: '#9B59B6', bg: '#F4EDFA', tekst: '#3D1A5C' },
  { hex: '#E74C3C', bg: '#FDECEA', tekst: '#5C0A0A' },
  { hex: '#16A085', bg: '#E0F5F1', tekst: '#084033' },
  { hex: '#2980B9', bg: '#E3F0FB', tekst: '#0A2E4A' },
  { hex: '#D35400', bg: '#FAEEE0', tekst: '#5C1F00' },
  { hex: '#7F8C8D', bg: '#F0F2F2', tekst: '#2C3E50' },
];