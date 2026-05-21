import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { db } from './firebase';
import { AppData, LogItem, initialData } from './store';

type AppContextType = {
  data: AppData;
  aktivtBarn: 'a' | 'b';
  setAktivtBarn: (barn: 'a' | 'b') => void;
  tilføjLog: (barn: 'a' | 'b', item: Omit<LogItem, 'id' | 'barn'>) => void;
  startAmning: (barn: 'a' | 'b', bryst?: 'højre' | 'venstre') => void;
  stopAmning: (barn: 'a' | 'b') => void;
  startLur: (barn: 'a' | 'b') => void;
  stopLur: (barn: 'a' | 'b') => void;
  ændreNavn: (barn: 'a' | 'b', navn: string) => void;
  ændreFarve: (barn: 'a' | 'b', farve: string) => void;
  sletLogItem: (barn: 'a' | 'b', id: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);
const DOC_ID = 'familie';

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [aktivtBarn, setAktivtBarn] = useState<'a' | 'b'>('a');
  const [klar, setKlar] = useState(false);

  // Lyt til ændringer i Firestore i realtid
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'familie', DOC_ID), (snap) => {
      if (snap.exists()) {
        const d = snap.data() as AppData;
        d.farver.a = '#2C1810';
        d.farver.b = '#8B5E3C';
        if (d.børn.a.amningStart) d.børn.a.amningStart = new Date(d.børn.a.amningStart);
        if (d.børn.b.amningStart) d.børn.b.amningStart = new Date(d.børn.b.amningStart);
        if (d.børn.a.lurStart) d.børn.a.lurStart = new Date(d.børn.a.lurStart);
        if (d.børn.b.lurStart) d.børn.b.lurStart = new Date(d.børn.b.lurStart);
        setData(d);
      }
      setKlar(true);
    });
    return () => unsub();
  }, []);

  // Gem data til Firestore
  async function gemData(nyData: AppData) {
    try {
      await setDoc(doc(db, 'familie', DOC_ID), JSON.parse(JSON.stringify(nyData)));
    } catch (e) {
      console.log('Fejl ved gemning:', e);
    }
  }

  function opdaterOgGem(nyData: AppData) {
    setData(nyData);
    gemData(nyData);
  }

  function tilføjLog(barn: 'a' | 'b', item: Omit<LogItem, 'id' | 'barn'>) {
    const nyData = {
      ...data,
      børn: {
        ...data.børn,
        [barn]: {
          ...data.børn[barn],
          log: [{ ...item, id: Date.now().toString(), barn }, ...data.børn[barn].log],
        }
      }
    };
    opdaterOgGem(nyData);
  }

 function startAmning(barn: 'a' | 'b', bryst?: 'højre' | 'venstre') {
    setData(prev => ({ ...prev, børn: { ...prev.børn, [barn]: { ...prev.børn[barn], amningStart: new Date(), amningBryst: bryst || null } } }));
  }

  function stopAmning(barn: 'a' | 'b') {
    const start = data.børn[barn].amningStart;
    if (!start) return;
    console.log('amningBryst:', data.børn[barn].amningBryst);
    const dur = Math.floor((Date.now() - start.getTime()) / 1000);
    const m = Math.floor(dur / 60), s = dur % 60;
    const bryst = data.børn[barn].amningBryst;
    const brystTekst = bryst ? ` (${bryst})` : '';
    const tekst = m >= 60 ? `Amning — ${Math.floor(m/60)}t ${m%60}m${brystTekst}` : m > 0 ? `Amning — ${m}m ${s}s${brystTekst}` : `Amning — ${s}s${brystTekst}`;
    const nyData = { ...data, børn: { ...data.børn, [barn]: { ...data.børn[barn], amningStart: null } } };
    setData(nyData);
    const medLog = {
      ...nyData,
      børn: {
        ...nyData.børn,
        [barn]: {
          ...nyData.børn[barn],
          log: [{ type: 'amning' as const, tekst, tid: nowStr(), id: Date.now().toString(), barn }, ...nyData.børn[barn].log],
        }
      }
    };
    opdaterOgGem(medLog);
  }

  function startLur(barn: 'a' | 'b') {
    opdaterOgGem({ ...data, børn: { ...data.børn, [barn]: { ...data.børn[barn], lurStart: new Date() } } });
  }

  function stopLur(barn: 'a' | 'b') {
    const start = data.børn[barn].lurStart;
    if (!start) return;
    const slut = new Date();
    const dur = Math.floor((slut.getTime() - start.getTime()) / 1000);
    const m = Math.floor(dur / 60), s = dur % 60;
    const tekst = m >= 60 ? `Lur — ${Math.floor(m/60)}t ${m%60}m` : m > 0 ? `Lur — ${m}m ${s}s` : `Lur — ${s}s`;
    const nyData = { ...data, børn: { ...data.børn, [barn]: { ...data.børn[barn], lurStart: null } } };
    const medLog = {
      ...nyData,
      børn: {
        ...nyData.børn,
        [barn]: {
          ...nyData.børn[barn],
          log: [{ type: 'lur' as const, tekst, tid: nowStr(), id: Date.now().toString(), barn, lurStart: start.getTime(), lurSlut: slut.getTime() }, ...nyData.børn[barn].log],
        }
      }
    };
    opdaterOgGem(medLog);
  }
  function sletLogItem(barn: 'a' | 'b', id: string) {
  const nyData = {
    ...data,
    børn: {
      ...data.børn,
      [barn]: {
        ...data.børn[barn],
        log: data.børn[barn].log.filter(item => item.id !== id),
      }
    }
  };
  opdaterOgGem(nyData);
}

  function ændreNavn(barn: 'a' | 'b', navn: string) {
    opdaterOgGem({ ...data, navne: { ...data.navne, [barn]: navn } });
  }

  function ændreFarve(barn: 'a' | 'b', farve: string) {
    opdaterOgGem({ ...data, farver: { ...data.farver, [barn]: farve } });
  }

  function nowStr() {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  return (
     <AppContext.Provider value={{ data, aktivtBarn, setAktivtBarn, tilføjLog, startAmning, stopAmning, startLur, stopLur, ændreNavn, ændreFarve, sletLogItem }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp skal bruges inden i AppProvider');
  return ctx;
}