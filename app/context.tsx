import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { AppData, LogItem, initialData } from './store';

type AppContextType = {
  data: AppData;
  aktivtBarn: 'a' | 'b';
  setAktivtBarn: (barn: 'a' | 'b') => void;
  tilføjLog: (barn: 'a' | 'b', item: Omit<LogItem, 'id' | 'barn'>) => void;
  startAmning: (barn: 'a' | 'b') => void;
  stopAmning: (barn: 'a' | 'b') => void;
  startLur: (barn: 'a' | 'b') => void;
  stopLur: (barn: 'a' | 'b') => void;
  ændreNavn: (barn: 'a' | 'b', navn: string) => void;
  ændreFarve: (barn: 'a' | 'b', farve: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [aktivtBarn, setAktivtBarn] = useState<'a' | 'b'>('a');
  const [indlæst, setIndlæst] = useState(false);

  // Indlæs data når appen starter
// Indlæs data når appen starter
  useEffect(() => {
    async function indlæsData() {
      try {
        let gemt = null;
        try {
          gemt = await AsyncStorage.getItem('tvillingeapp-data');
        } catch {
          gemt = localStorage.getItem('tvillingeapp-data');
        }
        if (gemt) {
          const parsed = JSON.parse(gemt);
          if (parsed.børn.a.amningStart) parsed.børn.a.amningStart = new Date(parsed.børn.a.amningStart);
          if (parsed.børn.b.amningStart) parsed.børn.b.amningStart = new Date(parsed.børn.b.amningStart);
          if (parsed.børn.a.lurStart) parsed.børn.a.lurStart = new Date(parsed.børn.a.lurStart);
          if (parsed.børn.b.lurStart) parsed.børn.b.lurStart = new Date(parsed.børn.b.lurStart);
          setData(parsed);
        }
      } catch (e) {
        console.log('Fejl ved indlæsning:', e);
      }
      setIndlæst(true);
    }
    indlæsData();
  }, []);

  // Gem data hver gang det ændres
  useEffect(() => {
    if (!indlæst) return;
    async function gemData() {
      try {
        await AsyncStorage.setItem('tvillingeapp-data', JSON.stringify(data));
      } catch {
        localStorage.setItem('tvillingeapp-data', JSON.stringify(data));
      }
    }
    gemData();
  }, [data, indlæst]);

  function tilføjLog(barn: 'a' | 'b', item: Omit<LogItem, 'id' | 'barn'>) {
    setData(prev => ({
      ...prev,
      børn: {
        ...prev.børn,
        [barn]: {
          ...prev.børn[barn],
          log: [{ ...item, id: Date.now().toString(), barn }, ...prev.børn[barn].log],
        }
      }
    }));
  }

  function startAmning(barn: 'a' | 'b') {
    setData(prev => ({ ...prev, børn: { ...prev.børn, [barn]: { ...prev.børn[barn], amningStart: new Date() } } }));
  }

  function stopAmning(barn: 'a' | 'b') {
    const start = data.børn[barn].amningStart;
    if (!start) return;
    const dur = Math.floor((Date.now() - start.getTime()) / 1000);
    const m = Math.floor(dur / 60), s = dur % 60;
    const tekst = m >= 60 ? `Amning — ${Math.floor(m/60)}t ${m%60}m` : m > 0 ? `Amning — ${m}m ${s}s` : `Amning — ${s}s`;
    setData(prev => ({ ...prev, børn: { ...prev.børn, [barn]: { ...prev.børn[barn], amningStart: null } } }));
    tilføjLog(barn, { type: 'amning', tekst, tid: nowStr() });
  }

  function startLur(barn: 'a' | 'b') {
    setData(prev => ({ ...prev, børn: { ...prev.børn, [barn]: { ...prev.børn[barn], lurStart: new Date() } } }));
  }

  function stopLur(barn: 'a' | 'b') {
    const start = data.børn[barn].lurStart;
    if (!start) return;
    const slut = new Date();
    const dur = Math.floor((slut.getTime() - start.getTime()) / 1000);
    const m = Math.floor(dur / 60), s = dur % 60;
    const tekst = m >= 60 ? `Lur — ${Math.floor(m/60)}t ${m%60}m` : m > 0 ? `Lur — ${m}m ${s}s` : `Lur — ${s}s`;
    setData(prev => ({ ...prev, børn: { ...prev.børn, [barn]: { ...prev.børn[barn], lurStart: null } } }));
    tilføjLog(barn, { type: 'lur', tekst, tid: nowStr(), lurStart: start.getTime(), lurSlut: slut.getTime() });
  }

  function ændreNavn(barn: 'a' | 'b', navn: string) {
    setData(prev => ({ ...prev, navne: { ...prev.navne, [barn]: navn } }));
  }

  function ændreFarve(barn: 'a' | 'b', farve: string) {
    setData(prev => ({ ...prev, farver: { ...prev.farver, [barn]: farve } }));
  }

  function nowStr() {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  return (
    <AppContext.Provider value={{ data, aktivtBarn, setAktivtBarn, tilføjLog, startAmning, stopAmning, startLur, stopLur, ændreNavn, ændreFarve }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp skal bruges inden i AppProvider');
  return ctx;
}