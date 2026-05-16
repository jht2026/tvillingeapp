import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

export default function Oversigt() {
  const { data } = useApp();
  const navne = data.navne;
  const farver = data.farver;
  const [aktivUge, setAktivUge] = useState(0);

  function fmtMins(m: number) {
    if (m >= 60) return Math.floor(m / 60) + 't ' + (m % 60) + 'm';
    return m + 'm';
  }

  function getUgeData(barn: 'a' | 'b', ugerTilbage: number) {
    const nu = new Date();
    const ugeStart = new Date(nu);
    ugeStart.setDate(nu.getDate() - nu.getDay() + 1 - ugerTilbage * 7);
    ugeStart.setHours(0, 0, 0, 0);
    const ugeSlut = new Date(ugeStart);
    ugeSlut.setDate(ugeStart.getDate() + 7);

    const log = data.børn[barn].log.filter(i => {
      const d = new Date(parseInt(i.id));
      return d >= ugeStart && d < ugeSlut;
    });

    const amninger = log.filter(i => i.type === 'amning').length;
    const flasker = log.filter(i => i.type === 'flaske');
    const flaskeTotal = flasker.reduce((s, i) => s + (i.værdi || 0), 0);
    const flaskeAntal = flasker.length;
    const lure = log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut);
    const lurTotalMins = lure.reduce((s, i) => s + Math.round((i.lurSlut! - i.lurStart!) / 60000), 0);
    const bleer = log.filter(i => i.type === 'ble').length;

    // Søvn per dag
    const dage = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
    const søvnPerDag = dage.map((_, i) => {
      const dagStart = new Date(ugeStart);
      dagStart.setDate(ugeStart.getDate() + i);
      const dagSlut = new Date(dagStart);
      dagSlut.setDate(dagStart.getDate() + 1);
      const dagLure = lure.filter(l => {
        const d = new Date(l.lurStart!);
        return d >= dagStart && d < dagSlut;
      });
      return dagLure.reduce((s, l) => s + Math.round((l.lurSlut! - l.lurStart!) / 60000), 0);
    });

    return { amninger, flaskeTotal, flaskeAntal, lurTotalMins, lurAntal: lure.length, bleer, søvnPerDag };
  }

  const uger = ['Denne uge', 'Forrige uge', '2 uger siden'];
  const ugeA = getUgeData('a', aktivUge);
  const ugeB = getUgeData('b', aktivUge);
  const forrigeA = getUgeData('a', aktivUge + 1);
  const forrigeB = getUgeData('b', aktivUge + 1);

  const gnsA = ugeA.lurAntal > 0 ? Math.round(ugeA.lurTotalMins / 7) : 0;
  const gnsB = ugeB.lurAntal > 0 ? Math.round(ugeB.lurTotalMins / 7) : 0;
  const forrigeGnsA = forrigeA.lurAntal > 0 ? Math.round(forrigeA.lurTotalMins / 7) : 0;
  const forrigeGnsB = forrigeB.lurAntal > 0 ? Math.round(forrigeB.lurTotalMins / 7) : 0;

  const maxSøvn = Math.max(...ugeA.søvnPerDag, ...ugeB.søvnPerDag, 60);
  const dage = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  function pil(nu: number, forrige: number) {
    if (forrige === 0) return '';
    if (nu > forrige) return ' ↑';
    if (nu < forrige) return ' ↓';
    return '';
  }
  function pilFarve(nu: number, forrige: number, højereErBedre: boolean) {
    if (forrige === 0) return TEMA.tekstSekundær;
    if (nu > forrige) return højereErBedre ? '#6B8F71' : '#C4848A';
    if (nu < forrige) return højereErBedre ? '#C4848A' : '#6B8F71';
    return TEMA.tekstSekundær;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>Uge for uge</Text>
        <Text style={styles.titel}>Oversigt</Text>
      </View>

      <View style={styles.ugeRække}>
        {uger.map((u, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.ugeKnap, aktivUge === i && styles.ugeKnapAktiv]}
            onPress={() => setAktivUge(i)}
          >
            <Text style={[styles.ugeKnapTekst, aktivUge === i && styles.ugeKnapTekstAktiv]}>{u}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sektionLabel}>Søvn per dag — timer</Text>
      <View style={styles.kortFull}>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: farver.a }]} /><Text style={styles.legendTekst}>{navne.a}</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: farver.b }]} /><Text style={styles.legendTekst}>{navne.b}</Text></View>
        </View>
        <View style={styles.chartInner}>
          <View style={styles.yAkse}>
            {['16t', '12t', '8t', '4t', '0t'].map(l => (
              <Text key={l} style={styles.yLabel}>{l}</Text>
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.chartBars}>
              {dage.map((dag, i) => {
                const hA = Math.round((ugeA.søvnPerDag[i] / (16 * 60)) * 100);
                const hB = Math.round((ugeB.søvnPerDag[i] / (16 * 60)) * 100);
                return (
                  <View key={dag} style={styles.chartCol}>
                    <View style={styles.barPar}>
                      <View style={[styles.bar, { height: Math.max(hA, 2), backgroundColor: farver.a }]} />
                      <View style={[styles.bar, { height: Math.max(hB, 2), backgroundColor: farver.b }]} />
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={styles.xAkse}>
              {dage.map(dag => (
                <Text key={dag} style={styles.xLabel}>{dag}</Text>
              ))}
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sektionLabel}>Gns. søvn denne uge</Text>
      <View style={styles.toKolonner}>
        {(['a', 'b'] as const).map(barn => {
          const gns = barn === 'a' ? gnsA : gnsB;
          const forrigeGns = barn === 'a' ? forrigeGnsA : forrigeGnsB;
          return (
            <View key={barn} style={[styles.søvnKort, { flex: 1 }]}>
              <View style={[styles.søvnHeader, { backgroundColor: barn === 'a' ? '#2C1810' : '#EDE5DC' }]}>
                <Text style={[styles.søvnHeaderTekst, { color: barn === 'a' ? 'white' : '#2C1810' }]}>{navne[barn]}</Text>
              </View>
              <View style={styles.søvnBody}>
                <Text style={styles.søvnBig}>{fmtMins(gns)}</Text>
                <Text style={styles.søvnLbl}>per dag</Text>
                {forrigeGns > 0 && (
                  <Text style={[styles.søvnSub, { color: pilFarve(gns, forrigeGns, true) }]}>
                    Forrige: {fmtMins(forrigeGns)}{pil(gns, forrigeGns)}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sektionLabel}>Måltider — ugentlig gns.</Text>
      <View style={styles.kortFull}>
        <View style={styles.trendHeader}>
          <View style={{ flex: 1 }} />
          <Text style={[styles.trendNavn, { color: farver.a }]}>{navne.a}</Text>
          <Text style={[styles.trendNavn, { color: farver.b }]}>{navne.b}</Text>
        </View>
        {[
          { lbl: 'Amninger/dag', valA: (ugeA.amninger / 7).toFixed(1), valB: (ugeB.amninger / 7).toFixed(1), forA: forrigeA.amninger, forB: forrigeB.amninger, højere: false },
          { lbl: 'Flaske total', valA: ugeA.flaskeTotal + ' ml', valB: ugeB.flaskeTotal + ' ml', forA: forrigeA.flaskeTotal, forB: forrigeB.flaskeTotal, højere: true },
          { lbl: 'Gns. ml/flaske', valA: ugeA.flaskeAntal > 0 ? Math.round(ugeA.flaskeTotal / ugeA.flaskeAntal) + ' ml' : '-', valB: ugeB.flaskeAntal > 0 ? Math.round(ugeB.flaskeTotal / ugeB.flaskeAntal) + ' ml' : '-', forA: 0, forB: 0, højere: true },
          { lbl: 'Bleskift/dag', valA: (ugeA.bleer / 7).toFixed(1), valB: (ugeB.bleer / 7).toFixed(1), forA: forrigeA.bleer, forB: forrigeB.bleer, højere: false },
        ].map((r, i) => (
          <View key={i} style={styles.trendRad}>
            <Text style={styles.trendLbl}>{r.lbl}</Text>
            <Text style={[styles.trendVal, { color: farver.a }]}>{r.valA}</Text>
            <Text style={[styles.trendVal, { color: farver.b }]}>{r.valB}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TEMA.baggrund },
  topbar: { backgroundColor: TEMA.baggrund, padding: 16, paddingTop: 60, paddingBottom: 12 },
  eyebrow: { fontSize: 11, color: TEMA.tekstSekundær, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  titel: { fontSize: 24, fontWeight: '500', color: TEMA.tekstPrimær, letterSpacing: -0.3 },
  sektionLabel: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.6, marginHorizontal: 16, marginTop: 14, marginBottom: 6 },
  ugeRække: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginBottom: 8 },
  ugeKnap: { flex: 1, backgroundColor: TEMA.kort, borderRadius: 12, padding: 8, alignItems: 'center', borderWidth: 0.5, borderColor: TEMA.border },
  ugeKnapAktiv: { backgroundColor: TEMA.tekstPrimær, borderColor: TEMA.tekstPrimær },
  ugeKnapTekst: { fontSize: 10, color: TEMA.tekstSekundær },
  ugeKnapTekstAktiv: { color: 'white', fontWeight: '500' },
  kortFull: { backgroundColor: TEMA.kort, borderRadius: 18, borderWidth: 0.5, borderColor: TEMA.border, padding: 14, marginHorizontal: 16, marginBottom: 8 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendTekst: { fontSize: 11, fontWeight: '500', color: TEMA.tekstPrimær },
  chartInner: { flexDirection: 'row', gap: 8 },
  yAkse: { justifyContent: 'space-between', paddingBottom: 18, width: 28 },
  yLabel: { fontSize: 9, color: TEMA.tekstSekundær, textAlign: 'right' },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 4, marginBottom: 4 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barPar: { flexDirection: 'row', gap: 2, alignItems: 'flex-end' },
  bar: { width: 8, borderRadius: 3 },
  xAkse: { flexDirection: 'row', gap: 4 },
  xLabel: { flex: 1, fontSize: 9, color: TEMA.tekstSekundær, textAlign: 'center' },
  toKolonner: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  søvnKort: { backgroundColor: TEMA.kort, borderRadius: 16, borderWidth: 0.5, borderColor: TEMA.border, overflow: 'hidden', marginBottom: 8 },
  søvnHeader: { padding: 10, alignItems: 'center' },
  søvnHeaderTekst: { fontSize: 12, fontWeight: '500' },
  søvnBody: { padding: 12 },
  søvnBig: { fontSize: 22, fontWeight: '500', color: TEMA.tekstPrimær },
  søvnLbl: { fontSize: 10, color: TEMA.tekstSekundær, marginTop: 2 },
  søvnSub: { fontSize: 11, marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: TEMA.border },
  trendHeader: { flexDirection: 'row', marginBottom: 8 },
  trendNavn: { fontSize: 11, fontWeight: '500', width: 60, textAlign: 'right' },
  trendRad: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: TEMA.borderLight },
  trendLbl: { flex: 1, fontSize: 12, color: TEMA.tekstSekundær },
  trendVal: { fontSize: 13, fontWeight: '500', width: 60, textAlign: 'right' },
});