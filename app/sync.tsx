import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

type Forslag = {
  titel: string;
  tekst: string;
  type: 'god' | 'advarsel' | 'tip';
};

function analyserSøvn(data: ReturnType<typeof useApp>['data']): Forslag[] {
  const forslag: Forslag[] = [];
  const navne = data.navne;
  const iDag = new Date(); iDag.setHours(0, 0, 0, 0);
  const forSyvDage = new Date(iDag.getTime() - 7 * 24 * 60 * 60 * 1000);

  function getLure(barn: 'a' | 'b', kunIdag = false) {
    return data.børn[barn].log.filter(i => {
      if (i.type !== 'lur' || !i.lurStart || !i.lurSlut) return false;
      const d = new Date(i.lurStart);
      if (kunIdag) return d >= iDag;
      return d >= forSyvDage;
    });
  }

  function fmtTid(ts: number) {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  function fmtMins(m: number) {
    if (m >= 60) return Math.floor(m / 60) + 't ' + (m % 60) + 'm';
    return m + 'm';
  }

  const lureA = getLure('a', true);
  const lureB = getLure('b', true);
  const alleLureA = getLure('a');
  const alleLureB = getLure('b');

  // 1. Antal lure
  if (lureA.length > 0 || lureB.length > 0) {
    const diff = Math.abs(lureA.length - lureB.length);
    if (diff >= 2) {
      const mere = lureA.length > lureB.length ? navne.a : navne.b;
      const mindre = lureA.length > lureB.length ? navne.b : navne.a;
      forslag.push({
        titel: 'Ulige antal lure',
        tekst: mere + ' har sovet ' + Math.max(lureA.length, lureB.length) + ' gange mens ' + mindre + ' kun har sovet ' + Math.min(lureA.length, lureB.length) + ' gange. Prøv at matche antallet — væk ' + mindre + ' næste gang ' + mere + ' vågner.',
        type: 'advarsel',
      });
    } else if (lureA.length === lureB.length && lureA.length > 0) {
      forslag.push({
        titel: 'Samme antal lure 👏',
        tekst: 'Begge har sovet ' + lureA.length + ' gang' + (lureA.length > 1 ? 'e' : '') + ' i dag — godt udgangspunkt for synkronisering!',
        type: 'god',
      });
    }
  }

  // 2. Søvntidspunkter
  if (lureA.length > 0 && lureB.length > 0) {
    const sidsteA = lureA[lureA.length - 1];
    const sidsteB = lureB[lureB.length - 1];
    const startDiff = Math.abs(sidsteA.lurStart! - sidsteB.lurStart!) / 60000;
    if (startDiff < 15) {
      forslag.push({
        titel: 'Næsten synkroniserede! 🎉',
        tekst: 'Deres seneste lur startede med kun ' + Math.round(startDiff) + ' minutters forskel (' + navne.a + ': ' + fmtTid(sidsteA.lurStart!) + ', ' + navne.b + ': ' + fmtTid(sidsteB.lurStart!) + '). I er tæt på perfekt synkronisering!',
        type: 'god',
      });
    } else if (startDiff < 45) {
      const sidstStart = sidsteA.lurStart! < sidsteB.lurStart! ? sidsteB.lurStart! : sidsteA.lurStart!;
      const sidst = sidsteA.lurStart! < sidsteB.lurStart! ? navne.b : navne.a;
      const først = sidsteA.lurStart! < sidsteB.lurStart! ? navne.a : navne.b;
      forslag.push({
        titel: Math.round(startDiff) + ' minutters forskel',
        tekst: først + ' faldt i søvn ' + Math.round(startDiff) + ' minutter før ' + sidst + '. Prøv at lægge ' + sidst + ' til at sove lidt tidligere — fx kl. ' + fmtTid(sidstStart - 20 * 60000) + '.',
        type: 'tip',
      });
    } else {
      const først = sidsteA.lurStart! < sidsteB.lurStart! ? navne.a : navne.b;
      const sidst = sidsteA.lurStart! < sidsteB.lurStart! ? navne.b : navne.a;
      forslag.push({
        titel: 'Store tidsforskelle på lure',
        tekst: 'Der er over ' + Math.round(startDiff) + ' minutters forskel. Når ' + først + ' falder i søvn, læg straks ' + sidst + ' til at sove også — selvom ' + sidst + ' ikke virker træt endnu.',
        type: 'advarsel',
      });
    }
  }

  // 3. Total søvn
  const totalA = lureA.reduce((s, l) => s + Math.round((l.lurSlut! - l.lurStart!) / 60000), 0);
  const totalB = lureB.reduce((s, l) => s + Math.round((l.lurSlut! - l.lurStart!) / 60000), 0);
  if (totalA > 0 && totalB > 0) {
    const diffMins = Math.abs(totalA - totalB);
    if (diffMins > 60) {
      const mereSøvn = totalA > totalB ? navne.a : navne.b;
      const mindreS = totalA > totalB ? navne.b : navne.a;
      forslag.push({
        titel: 'Forskel i total søvn',
        tekst: mereSøvn + ' har sovet ' + fmtMins(Math.max(totalA, totalB)) + ' mens ' + mindreS + ' kun har sovet ' + fmtMins(Math.min(totalA, totalB)) + '. ' + mindreS + ' kan være overtræt — hold øje med gnideri øjne og gaben.',
        type: 'advarsel',
      });
    }
  }

  // 4. Søvnvinduer per barn
  (['a', 'b'] as const).forEach(barn => {
    const fødselsdag = data.børn[barn].fødselsdag;
    if (!fødselsdag) return;
    const alderUger = Math.floor((Date.now() - new Date(fødselsdag).getTime()) / (1000 * 60 * 60 * 24 * 7));
    const maxVågenMins = alderUger < 6 ? 60 : alderUger < 12 ? 90 : 120;
    const anbefaling = alderUger < 6 ? '45-60 min (0-6 uger)' : alderUger < 12 ? '60-90 min (6-12 uger)' : '1,5-2,5 timer (3+ mdr)';
    const lureIdag = barn === 'a' ? lureA : lureB;
    if (lureIdag.length >= 2) {
      const sidst = lureIdag[lureIdag.length - 1];
      const næstsidst = lureIdag[lureIdag.length - 2];
      const vågenMins = Math.round((sidst.lurStart! - næstsidst.lurSlut!) / 60000);
      if (vågenMins > maxVågenMins + 15) {
        forslag.push({
          titel: navne[barn] + ' var vågen for længe',
          tekst: navne[barn] + ' var vågen i ' + fmtMins(vågenMins) + ' mellem to lure. Anbefalet max er ' + anbefaling + '. Overtrætte babyer har sværere ved at falde i søvn — læg tidligere næste gang.',
          type: 'advarsel',
        });
      }
    }
  });

  // 5. 7-dages trend
  if (alleLureA.length > 0 && alleLureB.length > 0) {
    const gnsA = alleLureA.reduce((s, l) => s + Math.round((l.lurSlut! - l.lurStart!) / 60000), 0) / 7;
    const gnsB = alleLureB.reduce((s, l) => s + Math.round((l.lurSlut! - l.lurStart!) / 60000), 0) / 7;
    if (Math.abs(gnsA - gnsB) < 30) {
      forslag.push({
        titel: 'God rytme over ugen 📈',
        tekst: 'Over de seneste 7 dage har ' + navne.a + ' sovet gns. ' + fmtMins(Math.round(gnsA)) + ' og ' + navne.b + ' ' + fmtMins(Math.round(gnsB)) + ' per dag. Rytmen er ved at falde på plads!',
        type: 'god',
      });
    }
  }

  // 6. Ingen data
  if (lureA.length === 0 && lureB.length === 0) {
    forslag.push({
      titel: 'Ingen søvn registreret i dag',
      tekst: 'Start med at logge lure for begge tvillinger. Jo mere data, jo bedre forslag.',
      type: 'tip',
    });
  }

  // 7. WHO og Sundhedsstyrelsen baseret på alder
  const fødselsdag = data.børn.a.fødselsdag ?? data.børn.b.fødselsdag;
  if (fødselsdag) {
    const alderDage = Math.floor((Date.now() - new Date(fødselsdag).getTime()) / (1000 * 60 * 60 * 24));
    const alderUger = Math.floor(alderDage / 7);
    const alderMdr = Math.floor(alderDage / 30);
    const alderTekst = alderMdr < 3 ? alderUger + ' uger' : alderMdr + ' måneder';

    let anbefalingTekst = '';
    if (alderUger < 6) {
      anbefalingTekst = 'Søvn (WHO): 14-17 timer i døgnet. Forventer 2-4 timers søvn ad gangen. Mad (SST): Amning på fri basis, 8-12 gange i døgnet er normalt. Tip: Selv 30 minutters overlap i søvn er en sejr i denne periode.';
    } else if (alderUger < 12) {
      anbefalingTekst = 'Søvn (WHO): 14-16 timer i døgnet. Søvnvinduer på 60-90 min begynder at danne sig. Mad (SST): Tandem-amning sparer op til 1,5 time per dag. Tip: Fra 6-8 uger begynder babyer at skelne dag og nat.';
    } else if (alderMdr < 6) {
      anbefalingTekst = 'Søvn (WHO): 12-15 timer i døgnet, 3-4 lure per dag. Mad (SST): Fortsat amning anbefales som primær ernæring til 6 måneder. Tip: Fælles aftenritual hjælper begge til at forstå at natten er til søvn.';
    } else {
      anbefalingTekst = 'Søvn (WHO): 12-14 timer i døgnet, typisk 2 lure per dag. Mad (SST): Fortsat amning ved siden af fast føde. Tip: Ved 6 måneder er mange tvillingepar klar til et fast dagsprogram.';
    }

    forslag.push({
      titel: 'WHO & Sundhedsstyrelsen — ' + alderTekst,
      tekst: anbefalingTekst,
      type: 'tip',
    });
  }

  // 8. Tvillingeforskning
  forslag.push({
    titel: 'Tvillingeforskning',
    tekst: 'Synkroniserede tvillinger giver forældre op til 2 ekstra timers søvn per nat. Væk altid den sovende tvilling når den anden vågner til mad. Tandem-fodring reducerer samlet fodretid med 40-60%. Synkronisering tager typisk 2-4 uger at etablere — vær konsekvent.',
    type: 'tip',
  });

  // 9. Vigtigste råd
  forslag.push({
    titel: 'Det vigtigste råd',
    tekst: 'Tandem-rutine er nøglen: fodring, bleskift og søvn på samme tid. Når én vågner om natten — væk den anden med det samme, selvom det føles synd. Det sparer timer på lang sigt.',
    type: 'tip',
  });

  return forslag;
}

function hvadGørDuNu(data: ReturnType<typeof useApp>['data']): string {
  const navne = data.navne;
  const nu = Date.now();

  function sidsteLur(barn: 'a' | 'b') {
    const lure = data.børn[barn].log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut);
    return lure.length > 0 ? lure[0] : null;
  }

  function sidsteAmningEllerFlaske(barn: 'a' | 'b') {
    const mad = data.børn[barn].log.filter(i => (i.type === 'amning' || i.type === 'flaske') && i.tidspunkt);
    return mad.length > 0 ? mad[0] : null;
  }

  function minSiden(ts: number) {
    return Math.round((nu - ts) / 60000);
  }

  function fmtMins(m: number) {
    if (m >= 60) return Math.floor(m / 60) + 't ' + (m % 60) + 'm';
    return m + 'm';
  }

  // Find alder-baseret søvnvindue
  const fødselsdag = data.børn.a.fødselsdag ?? data.børn.b.fødselsdag;
  let maxVågenMins = 90;
  let næsteLurOm = 60;
  if (fødselsdag) {
    const alderUger = Math.floor((nu - new Date(fødselsdag).getTime()) / (1000 * 60 * 60 * 24 * 7));
    if (alderUger < 6) { maxVågenMins = 60; næsteLurOm = 45; }
    else if (alderUger < 12) { maxVågenMins = 90; næsteLurOm = 75; }
    else { maxVågenMins = 150; næsteLurOm = 120; }
  }

  const lurA = sidsteLur('a');
  const lurB = sidsteLur('b');
  const madA = sidsteAmningEllerFlaske('a');
  const madB = sidsteAmningEllerFlaske('b');

  // Er nogen i gang med at sove lige nu?
  const aSOVER = data.børn.a.lurStart != null;
  const bSOVER = data.børn.b.lurStart != null;

  if (aSOVER && bSOVER) {
    return 'Begge tvillinger sover lige nu — godt gået! Brug tiden til at hvile dig selv. Klar til at fodre begge når de vågner.';
  }

  // Én sover, én er vågen
  if (aSOVER && !bSOVER) {
    const vågenSiden = lurB ? minSiden(lurB.lurSlut!) : null;
    const lurOm = vågenSiden ? Math.max(0, næsteLurOm - vågenSiden) : næsteLurOm;
    const madSiden = madB ? minSiden(new Date(madB.tidspunkt!).getTime()) : null;
    let tekst = navne.a + ' sover. ' + navne.b + ' er vågen';
    if (vågenSiden) tekst += ' — har været vågen i ' + fmtMins(vågenSiden);
    tekst += '. ';
    if (madSiden && madSiden > 120) tekst += 'Det er ' + fmtMins(madSiden) + ' siden ' + navne.b + ' sidst fik mad — overvej at fodre nu. ';
    if (lurOm <= 15) tekst += 'Læg ' + navne.b + ' til at sove nu, så de er synkroniserede når ' + navne.a + ' vågner.';
    else tekst += 'Forsøg at lægge ' + navne.b + ' til at sove om ca. ' + fmtMins(lurOm) + ' — så de er synkroniserede.';
    return tekst;
  }

  if (bSOVER && !aSOVER) {
    const vågenSiden = lurA ? minSiden(lurA.lurSlut!) : null;
    const lurOm = vågenSiden ? Math.max(0, næsteLurOm - vågenSiden) : næsteLurOm;
    const madSiden = madA ? minSiden(new Date(madA.tidspunkt!).getTime()) : null;
    let tekst = navne.b + ' sover. ' + navne.a + ' er vågen';
    if (vågenSiden) tekst += ' — har været vågen i ' + fmtMins(vågenSiden);
    tekst += '. ';
    if (madSiden && madSiden > 120) tekst += 'Det er ' + fmtMins(madSiden) + ' siden ' + navne.a + ' sidst fik mad — overvej at fodre nu. ';
    if (lurOm <= 15) tekst += 'Læg ' + navne.a + ' til at sove nu, så de er synkroniserede når ' + navne.b + ' vågner.';
    else tekst += 'Forsøg at lægge ' + navne.a + ' til at sove om ca. ' + fmtMins(lurOm) + ' — så de er synkroniserede.';
    return tekst;
  }

  // Begge vågne — brug seneste lur til at estimere
  const slutA = lurA?.lurSlut ?? null;
  const slutB = lurB?.lurSlut ?? null;

  if (slutA && slutB) {
    const vågenA = minSiden(slutA);
    const vågenB = minSiden(slutB);
    const lurOmA = Math.max(0, næsteLurOm - vågenA);
    const lurOmB = Math.max(0, næsteLurOm - vågenB);

    if (Math.abs(lurOmA - lurOmB) < 20) {
      return 'Begge er vågne. ' + navne.a + ' har været vågen i ' + fmtMins(vågenA) + ', ' + navne.b + ' i ' + fmtMins(vågenB) + '. Læg begge til at sove om ca. ' + fmtMins(Math.round((lurOmA + lurOmB) / 2)) + ' — det er et godt tidspunkt for en synkroniseret lur.';
    }

    const tidligst = lurOmA < lurOmB ? navne.a : navne.b;
    const senest = lurOmA < lurOmB ? navne.b : navne.a;
    const tidligstOm = Math.min(lurOmA, lurOmB);
    const senestOm = Math.max(lurOmA, lurOmB);

    return 'Begge er vågne. ' + tidligst + ' er klar til at sove om ca. ' + fmtMins(tidligstOm) + ', ' + senest + ' om ca. ' + fmtMins(senestOm) + '. Prøv at lægge ' + tidligst + ' lidt senere og ' + senest + ' lidt tidligere — sigt efter et fælles sovetidspunkt om ca. ' + fmtMins(Math.round((tidligstOm + senestOm) / 2)) + '.';
  }

  return 'Log søvn og mad for begge tvillinger for at få en konkret anbefaling baseret på deres rytme.';
}

function ForslagKort({ forslag }: { forslag: Forslag }) {
  const farver = {
    god: { bg: '#F0F7F0', border: '#B8D8B8', ikon: '✅' },
    advarsel: { bg: '#FFF8F0', border: TEMA.aktivBorder, ikon: '💡' },
    tip: { bg: TEMA.aktiv, border: TEMA.aktivBorder, ikon: '💬' },
  };
  const f = farver[forslag.type];
  return (
    <View style={[styles.forslagKort, { backgroundColor: f.bg, borderColor: f.border }]}>
      <Text style={styles.forslagTitel}>{f.ikon} {forslag.titel}</Text>
      <Text style={styles.forslagTekst}>{forslag.tekst}</Text>
    </View>
  );
}

export default function Sync() {
  const { data } = useApp();
  const [forslag, setForslag] = useState<Forslag[] | null>(null);
  const navne = data.navne;

  function getSøvnOverblik(barn: 'a' | 'b') {
    const iDag = new Date(); iDag.setHours(0, 0, 0, 0);
    const lure = data.børn[barn].log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut && new Date(i.lurStart) >= iDag);
    const total = lure.reduce((s, l) => s + Math.round((l.lurSlut! - l.lurStart!) / 60000), 0);
    return { antal: lure.length, total };
  }

  const overblikA = getSøvnOverblik('a');
  const overblikB = getSøvnOverblik('b');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>Søvnanalyse</Text>
        <Text style={styles.titel}>Synkronisering</Text>
      </View>

      <Text style={styles.sektionLabel}>Dagens søvn</Text>
      <View style={styles.toKolonner}>
        {(['a', 'b'] as const).map(barn => {
          const o = barn === 'a' ? overblikA : overblikB;
          const erA = barn === 'a';
          return (
            <View key={barn} style={styles.søvnKort}>
              <View style={[styles.søvnHeader, { backgroundColor: erA ? '#2C1810' : '#EDE5DC' }]}>
                <Text style={[styles.søvnNavn, { color: erA ? '#FDF8F3' : '#2C1810' }]}>{navne[barn]}</Text>
              </View>
              <View style={styles.søvnBody}>
                <Text style={styles.søvnVal}>{o.antal}</Text>
                <Text style={styles.søvnLbl}>lure</Text>
                <Text style={[styles.søvnVal, { marginTop: 8 }]}>{o.total > 0 ? Math.floor(o.total / 60) + 't ' + (o.total % 60) + 'm' : '0m'}</Text>
                <Text style={styles.søvnLbl}>total søvn</Text>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.analyseKnap} onPress={() => setForslag(analyserSøvn(data))} activeOpacity={0.8}>
        <Text style={styles.analyseKnapTekst}>✨ Få synkroniseringsforslag</Text>
      </TouchableOpacity>

      {forslag && (
        <View style={styles.forslagWrapper}>
          <Text style={styles.sektionLabel}>Hvad gør du nu?</Text>
          <View style={styles.nuKort}>
            <Text style={styles.nuTekst}>{hvadGørDuNu(data)}</Text>
          </View>
          <Text style={[styles.sektionLabel, { marginTop: 12 }]}>Analyse og forslag</Text>
          {forslag.map((f, i) => <ForslagKort key={i} forslag={f} />)}
          <TouchableOpacity style={styles.opdaterKnap} onPress={() => setForslag(analyserSøvn(data))}>
            <Text style={styles.opdaterTekst}>↻ Opdater analyse</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TEMA.baggrund },
  topbar: { padding: 16, paddingTop: 60, paddingBottom: 12 },
  eyebrow: { fontSize: 11, color: TEMA.tekstSekundær, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  titel: { fontSize: 24, fontWeight: '500', color: TEMA.tekstPrimær, letterSpacing: -0.3 },
  sektionLabel: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.6, marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  toKolonner: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  søvnKort: { flex: 1, backgroundColor: TEMA.kort, borderRadius: 16, borderWidth: 0.5, borderColor: TEMA.border, overflow: 'hidden' },
  søvnHeader: { padding: 10, alignItems: 'center' },
  søvnNavn: { fontSize: 12, fontWeight: '500' },
  søvnBody: { padding: 14, alignItems: 'center' },
  søvnVal: { fontSize: 22, fontWeight: '500', color: TEMA.tekstPrimær },
  søvnLbl: { fontSize: 10, color: TEMA.tekstSekundær, marginTop: 2 },
  analyseKnap: { marginHorizontal: 16, backgroundColor: '#2C1810', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16 },
  analyseKnapTekst: { color: 'white', fontSize: 15, fontWeight: '500' },
  forslagWrapper: { paddingHorizontal: 16 },
  forslagKort: { borderRadius: 14, borderWidth: 0.5, padding: 14, marginBottom: 10 },
  forslagTitel: { fontSize: 13, fontWeight: '500', color: TEMA.tekstPrimær, marginBottom: 6 },
  forslagTekst: { fontSize: 13, color: TEMA.tekstPrimær, lineHeight: 20 },
  opdaterKnap: { padding: 12, borderRadius: 12, borderWidth: 0.5, borderColor: TEMA.border, alignItems: 'center', marginTop: 4, marginBottom: 16 },
  opdaterTekst: { fontSize: 12, color: TEMA.tekstSekundær },
  nuKort: { backgroundColor: '#2C1810', borderRadius: 14, padding: 16, marginBottom: 10 },
  nuTekst: { fontSize: 14, color: '#FDF8F3', lineHeight: 22 },
});