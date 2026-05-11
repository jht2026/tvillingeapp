import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { FARVER } from "./store";

export default function Oversigt() {
  const { data } = useApp();
  const navne = data.navne;
  const farver = data.farver;
  const [aktivUge, setAktivUge] = useState(0);

  function getBagfarve(barn: 'a' | 'b') {
    return FARVER.find(f => f.hex === farver[barn])?.bg || '#E1F5EE';
  }

  function fmtMins(m: number) {
    if (m >= 60) return Math.floor(m / 60) + 't ' + (m % 60) + 'm';
    return m + 'm';
  }

  // Gruppér log per uge
  function getUgeData(barn: 'a' | 'b', ugerTilbage: number) {
    const nu = new Date();
    const ugeStart = new Date(nu);
    ugeStart.setDate(nu.getDate() - nu.getDay() + 1 - ugerTilbage * 7);
    ugeStart.setHours(0, 0, 0, 0);
    const ugeSlut = new Date(ugeStart);
    ugeSlut.setDate(ugeStart.getDate() + 7);

    const log = data.børn[barn].log.filter(i => {
      const d = new Date(i.id.length === 13 ? parseInt(i.id) : Date.now());
      return d >= ugeStart && d < ugeSlut;
    });

    const amninger = log.filter(i => i.type === 'amning').length;
    const flasker = log.filter(i => i.type === 'flaske');
    const flaskeTotal = flasker.reduce((s, i) => s + (i.værdi || 0), 0);
    const flaskeAntal = flasker.length;
    const lure = log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut);
    const lurTotalMins = lure.reduce((s, i) => s + Math.round((i.lurSlut! - i.lurStart!) / 60000), 0);
    const bleer = log.filter(i => i.type === 'ble').length;

    return { amninger, flaskeTotal, flaskeAntal, lurTotalMins, lurAntal: lure.length, bleer };
  }

  const uger = ['Denne uge', 'Forrige uge', '2 uger siden'];

  const ugeA = getUgeData('a', aktivUge);
  const ugeB = getUgeData('b', aktivUge);
  const forrigeA = getUgeData('a', aktivUge + 1);
  const forrigeB = getUgeData('b', aktivUge + 1);

  function pil(nu: number, forrige: number) {
    if (forrige === 0) return '';
    if (nu > forrige) return ' ↑';
    if (nu < forrige) return ' ↓';
    return ' →';
  }

  function pilFarve(nu: number, forrige: number, højereErBedre: boolean) {
    if (forrige === 0) return '#888';
    if (nu > forrige) return højereErBedre ? '#1D9E75' : '#D85A30';
    if (nu < forrige) return højereErBedre ? '#D85A30' : '#1D9E75';
    return '#888';
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.titel}>Oversigt</Text>
      </View>

      <View style={styles.ugeVælger}>
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

      <Text style={styles.sektionLabel}>Søvn</Text>
      <View style={styles.toKolonner}>
        {(['a', 'b'] as const).map(barn => {
          const s = barn === 'a' ? ugeA : ugeB;
          const f = barn === 'a' ? forrigeA : forrigeB;
          const gns = s.lurAntal > 0 ? Math.round(s.lurTotalMins / 7) : 0;
          const forrigeGns = f.lurAntal > 0 ? Math.round(f.lurTotalMins / 7) : 0;
          return (
            <View key={barn} style={[styles.kortFull, { flex: 1 }]}>
              <View style={[styles.barnHeader, { backgroundColor: getBagfarve(barn) }]}>
                <Text style={[styles.barnHeaderTekst, { color: farver[barn] }]}>{navne[barn]}</Text>
              </View>
              <View style={styles.statRad}>
                <Text style={styles.statLbl}>Lure i alt</Text>
                <Text style={[styles.statVal, { color: farver[barn] }]}>{s.lurAntal}<Text style={[styles.pil, { color: pilFarve(s.lurAntal, f.lurAntal, true) }]}>{pil(s.lurAntal, f.lurAntal)}</Text></Text>
              </View>
              <View style={styles.statRad}>
                <Text style={styles.statLbl}>Gns. søvn/dag</Text>
                <Text style={[styles.statVal, { color: farver[barn] }]}>{fmtMins(gns)}<Text style={[styles.pil, { color: pilFarve(gns, forrigeGns, true) }]}>{pil(gns, forrigeGns)}</Text></Text>
              </View>
              <View style={styles.statRad}>
                <Text style={styles.statLbl}>Total søvn</Text>
                <Text style={[styles.statVal, { color: farver[barn] }]}>{fmtMins(s.lurTotalMins)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sektionLabel}>Måltider</Text>
      <View style={styles.toKolonner}>
        {(['a', 'b'] as const).map(barn => {
          const s = barn === 'a' ? ugeA : ugeB;
          const f = barn === 'a' ? forrigeA : forrigeB;
          const gnsAm = Math.round(s.amninger / 7 * 10) / 10;
          const forrigeGnsAm = Math.round(f.amninger / 7 * 10) / 10;
          const gnsMl = s.flaskeAntal > 0 ? Math.round(s.flaskeTotal / s.flaskeAntal) : 0;
          const forrigeGnsMl = f.flaskeAntal > 0 ? Math.round(f.flaskeTotal / f.flaskeAntal) : 0;
          return (
            <View key={barn} style={[styles.kortFull, { flex: 1 }]}>
              <View style={[styles.barnHeader, { backgroundColor: getBagfarve(barn) }]}>
                <Text style={[styles.barnHeaderTekst, { color: farver[barn] }]}>{navne[barn]}</Text>
              </View>
              <View style={styles.statRad}>
                <Text style={styles.statLbl}>Amninger/dag</Text>
                <Text style={[styles.statVal, { color: farver[barn] }]}>{gnsAm}<Text style={[styles.pil, { color: pilFarve(gnsAm, forrigeGnsAm, false) }]}>{pil(gnsAm, forrigeGnsAm)}</Text></Text>
              </View>
              <View style={styles.statRad}>
                <Text style={styles.statLbl}>Flaske total</Text>
                <Text style={[styles.statVal, { color: farver[barn] }]}>{s.flaskeTotal} ml</Text>
              </View>
              <View style={styles.statRad}>
                <Text style={styles.statLbl}>Gns. ml/flaske</Text>
                <Text style={[styles.statVal, { color: farver[barn] }]}>{gnsMl > 0 ? gnsMl + ' ml' : '-'}<Text style={[styles.pil, { color: pilFarve(gnsMl, forrigeGnsMl, true) }]}>{gnsMl > 0 ? pil(gnsMl, forrigeGnsMl) : ''}</Text></Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sektionLabel}>Bleer</Text>
      <View style={[styles.toKolonner, { marginBottom: 30 }]}>
        {(['a', 'b'] as const).map(barn => {
          const s = barn === 'a' ? ugeA : ugeB;
          const f = barn === 'a' ? forrigeA : forrigeB;
          const gns = Math.round(s.bleer / 7 * 10) / 10;
          const forrigeGns = Math.round(f.bleer / 7 * 10) / 10;
          return (
            <View key={barn} style={[styles.kortFull, { flex: 1 }]}>
              <View style={[styles.barnHeader, { backgroundColor: getBagfarve(barn) }]}>
                <Text style={[styles.barnHeaderTekst, { color: farver[barn] }]}>{navne[barn]}</Text>
              </View>
              <View style={styles.statRad}>
                <Text style={styles.statLbl}>Bleer i alt</Text>
                <Text style={[styles.statVal, { color: farver[barn] }]}>{s.bleer}</Text>
              </View>
              <View style={styles.statRad}>
                <Text style={styles.statLbl}>Gns. per dag</Text>
                <Text style={[styles.statVal, { color: farver[barn] }]}>{gns}<Text style={[styles.pil, { color: pilFarve(gns, forrigeGns, false) }]}>{pil(gns, forrigeGns)}</Text></Text>
              </View>
            </View>
          );
        })}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  topbar: { backgroundColor: 'white', padding: 16, paddingTop: 60, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  titel: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  sektionLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 12, marginTop: 14, marginBottom: 6 },
  ugeVælger: { flexDirection: 'row', gap: 6, padding: 12 },
  ugeKnap: { flex: 1, padding: 8, borderRadius: 10, borderWidth: 0.5, borderColor: '#E0E0E0', backgroundColor: 'white', alignItems: 'center' },
  ugeKnapAktiv: { backgroundColor: '#EEEDFE', borderColor: '#AFA9EC' },
  ugeKnapTekst: { fontSize: 11, color: '#888' },
  ugeKnapTekstAktiv: { color: '#534AB7', fontWeight: '500' },
  toKolonner: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  kortFull: { backgroundColor: 'white', borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0', padding: 12, marginBottom: 8 },
  barnHeader: { padding: 6, borderRadius: 8, marginBottom: 8, alignItems: 'center' },
  barnHeaderTekst: { fontSize: 12, fontWeight: '500' },
  statRad: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  statLbl: { fontSize: 10, color: '#888' },
  statVal: { fontSize: 13, fontWeight: '500' },
  pil: { fontSize: 11, fontWeight: '400' },
});