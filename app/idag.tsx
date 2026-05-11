import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "./context";
import { FARVER } from "./store";

export default function Idag() {
  const { data } = useApp();
  const navne = data.navne;
  const farver = data.farver;

  function getBagfarve(barn: 'a' | 'b') {
    return FARVER.find(f => f.hex === farver[barn])?.bg || '#E1F5EE';
  }
  function getTekstfarve(barn: 'a' | 'b') {
    return FARVER.find(f => f.hex === farver[barn])?.tekst || '#085041';
  }

  function getStats(barn: 'a' | 'b') {
    const log = data.børn[barn].log;
    const amninger = log.filter(i => i.type === 'amning').length;
    const flasker = log.filter(i => i.type === 'flaske');
    const flaskeTotal = flasker.reduce((s, i) => s + (i.værdi || 0), 0);
    const flaskeAntal = flasker.length;
    const lure = log.filter(i => i.type === 'lur');
    const lurAntal = lure.length;
    const lurTotalMins = lure.reduce((s, i) => {
      if (i.lurStart && i.lurSlut) return s + Math.round((i.lurSlut - i.lurStart) / 60000);
      return s;
    }, 0);
    const bleer = log.filter(i => i.type === 'ble');
    const bleVaad = bleer.filter(i => i.bleType === 'vaad').length;
    const bleBeskidt = bleer.filter(i => i.bleType === 'beskidt').length;
    const bleBegge = bleer.filter(i => i.bleType === 'begge').length;
    const bleTotal = bleer.length;
    const sidstMad = log.find(i => i.type === 'amning' || i.type === 'flaske');
    return { amninger, flaskeTotal, flaskeAntal, lurAntal, lurTotalMins, lure, bleVaad, bleBeskidt, bleBegge, bleTotal, sidstMad };
  }

  function fmtMins(m: number) {
    if (m >= 60) return Math.floor(m / 60) + 't ' + (m % 60) + 'm';
    return m + 'm';
  }

  function renderTidslinje(barn: 'a' | 'b') {
    const lure = data.børn[barn].log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut);
    const dagStart = new Date();
    dagStart.setHours(0, 0, 0, 0);
    const dagMins = 24 * 60;

    return (
      <View>
        <View style={styles.tlHours}>
          {['00', '06', '12', '18', '24'].map(h => (
            <Text key={h} style={styles.tlHour}>{h}</Text>
          ))}
        </View>
        <View style={styles.tlBar}>
          {lure.map(lur => {
            const startMins = (lur.lurStart! - dagStart.getTime()) / 60000;
            const durMins = (lur.lurSlut! - lur.lurStart!) / 60000;
            const left = `${Math.max((startMins / dagMins) * 100, 0)}%` as any;
            const width = `${Math.max((durMins / dagMins) * 100, 0.5)}%` as any;
            return (
              <View
                key={lur.id}
                style={[styles.tlSegment, {
                  left: left + '%',
                  width: width + '%',
                  backgroundColor: farver[barn],
                }]}
              />
            );
          })}
        </View>
      </View>
    );
  }

  const statsA = getStats('a');
  const statsB = getStats('b');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.titel}>I dag</Text>
      </View>

      <Text style={styles.sektionLabel}>Dagens tal</Text>
      <View style={styles.toKolonner}>
        {(['a', 'b'] as const).map(barn => {
          const s = barn === 'a' ? statsA : statsB;
          return (
            <View key={barn} style={styles.kolonne}>
              <View style={[styles.barnHeader, { backgroundColor: getBagfarve(barn) }]}>
                <Text style={[styles.barnHeaderTekst, { color: getTekstfarve(barn) }]}>{navne[barn]}</Text>
              </View>
              <View style={styles.statBlok}><Text style={styles.statLbl}>Amninger</Text><Text style={[styles.statVal, { color: farver[barn] }]}>{s.amninger}</Text></View>
              <View style={styles.statBlok}><Text style={styles.statLbl}>Flaske total</Text><Text style={[styles.statVal, { color: '#378ADD' }]}>{s.flaskeTotal} ml</Text></View>
              <View style={styles.statBlok}><Text style={styles.statLbl}>Lure</Text><Text style={[styles.statVal, { color: '#7F77DD' }]}>{s.lurAntal}</Text></View>
              <View style={styles.statBlok}><Text style={styles.statLbl}>Bleskift</Text><Text style={[styles.statVal, { color: '#D85A30' }]}>{s.bleTotal}</Text></View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sektionLabel}>Flaske detaljer</Text>
      <View style={styles.toKolonner}>
        {(['a', 'b'] as const).map(barn => {
          const s = barn === 'a' ? statsA : statsB;
          return (
            <View key={barn} style={[styles.kortFull, { flex: 1 }]}>
              <Text style={[styles.kortHeader, { color: farver[barn] }]}>{navne[barn]}</Text>
              <View style={styles.miniRad}>
                <View style={styles.miniBlok}><Text style={styles.miniVal}>{s.flaskeAntal}</Text><Text style={styles.miniLbl}>Antal</Text></View>
                <View style={styles.miniBlok}><Text style={styles.miniVal}>{s.flaskeAntal > 0 ? Math.round(s.flaskeTotal / s.flaskeAntal) + ' ml' : '-'}</Text><Text style={styles.miniLbl}>Gns.</Text></View>
                <View style={styles.miniBlok}><Text style={styles.miniVal}>{s.flaskeTotal} ml</Text><Text style={styles.miniLbl}>Total</Text></View>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sektionLabel}>Søvnoversigt</Text>
      {(['a', 'b'] as const).map(barn => {
        const s = barn === 'a' ? statsA : statsB;
        return (
          <View key={barn} style={[styles.kortFull, { marginHorizontal: 12, marginBottom: 8 }]}>
            <Text style={[styles.kortHeader, { color: farver[barn] }]}>{navne[barn]}</Text>
            {renderTidslinje(barn)}
            <View style={[styles.miniRad, { marginTop: 8 }]}>
              <View style={styles.miniBlok}><Text style={styles.miniVal}>{s.lurAntal}</Text><Text style={styles.miniLbl}>Lure</Text></View>
              <View style={styles.miniBlok}><Text style={styles.miniVal}>{fmtMins(s.lurTotalMins)}</Text><Text style={styles.miniLbl}>Total søvn</Text></View>
              <View style={styles.miniBlok}><Text style={styles.miniVal}>{s.lurAntal > 0 ? fmtMins(Math.round(s.lurTotalMins / s.lurAntal)) : '-'}</Text><Text style={styles.miniLbl}>Gns.</Text></View>
            </View>
            {data.børn[barn].log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut).map(lur => {
              const start = new Date(lur.lurStart!);
              const slut = new Date(lur.lurSlut!);
              const startStr = start.getHours().toString().padStart(2, '0') + ':' + start.getMinutes().toString().padStart(2, '0');
              const slutStr = slut.getHours().toString().padStart(2, '0') + ':' + slut.getMinutes().toString().padStart(2, '0');
              const mins = Math.round((lur.lurSlut! - lur.lurStart!) / 60000);
              return (
                <View key={lur.id} style={styles.lurRad}>
                  <Text style={styles.lurTid}>{startStr} – {slutStr}</Text>
                  <Text style={[styles.lurVarighed, { color: farver[barn] }]}>{fmtMins(mins)}</Text>
                </View>
              );
            })}
          </View>
        );
      })}

      <Text style={styles.sektionLabel}>Bleer detaljer</Text>
      <View style={styles.toKolonner}>
        {(['a', 'b'] as const).map(barn => {
          const s = barn === 'a' ? statsA : statsB;
          return (
            <View key={barn} style={[styles.kortFull, { flex: 1 }]}>
              <Text style={[styles.kortHeader, { color: farver[barn] }]}>{navne[barn]}</Text>
              <View style={styles.miniRad}>
                <View style={[styles.bleBlok, { backgroundColor: '#FFF5F0' }]}><Text style={[styles.bleVal, { color: '#D35400' }]}>{s.bleVaad}</Text><Text style={styles.miniLbl}>💧 Våde</Text></View>
                <View style={[styles.bleBlok, { backgroundColor: '#FDF0ED' }]}><Text style={[styles.bleVal, { color: '#A33010' }]}>{s.bleBeskidt}</Text><Text style={styles.miniLbl}>💩 Beskidte</Text></View>
                <View style={[styles.bleBlok, { backgroundColor: '#FDE8E0' }]}><Text style={[styles.bleVal, { color: '#7A2010' }]}>{s.bleBegge}</Text><Text style={styles.miniLbl}>Begge</Text></View>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.sektionLabel}>Sidst ammet / flaske</Text>
      <View style={[styles.toKolonner, { marginBottom: 30 }]}>
        {(['a', 'b'] as const).map(barn => {
          const s = barn === 'a' ? statsA : statsB;
          return (
            <View key={barn} style={[styles.kortFull, { flex: 1 }]}>
              <Text style={styles.miniLbl}>{navne[barn]}</Text>
              <Text style={styles.sidstVal}>{s.sidstMad ? s.sidstMad.tekst : 'Ingen endnu'}</Text>
              {s.sidstMad && <Text style={styles.sidstTid}>{s.sidstMad.tid}</Text>}
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
  toKolonner: { flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  kolonne: { flex: 1 },
  barnHeader: { padding: 8, borderRadius: 10, marginBottom: 6, alignItems: 'center' },
  barnHeaderTekst: { fontSize: 13, fontWeight: '500' },
  statBlok: { backgroundColor: 'white', borderRadius: 10, borderWidth: 0.5, borderColor: '#E0E0E0', padding: 9, marginBottom: 6 },
  statLbl: { fontSize: 10, color: '#888', marginBottom: 2 },
  statVal: { fontSize: 15, fontWeight: '500' },
  kortFull: { backgroundColor: 'white', borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0', padding: 12, marginBottom: 8 },
  kortHeader: { fontSize: 11, fontWeight: '500', marginBottom: 8 },
  miniRad: { flexDirection: 'row', gap: 4 },
  miniBlok: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 8, padding: 6, alignItems: 'center' },
  miniVal: { fontSize: 13, fontWeight: '500', color: '#1A1A1A' },
  miniLbl: { fontSize: 9, color: '#888', marginTop: 2 },
  bleBlok: { flex: 1, borderRadius: 8, padding: 6, alignItems: 'center' },
  bleVal: { fontSize: 14, fontWeight: '500' },
  sidstVal: { fontSize: 13, color: '#1A1A1A', marginTop: 4 },
  sidstTid: { fontSize: 11, color: '#888', marginTop: 2 },
  tlHours: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  tlHour: { fontSize: 9, color: '#888' },
  tlBar: { height: 22, backgroundColor: '#F0F0F0', borderRadius: 5, overflow: 'hidden', marginBottom: 8, position: 'relative' },
  tlSegment: { position: 'absolute', top: 0, height: '100%', borderRadius: 2 },
  lurRad: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: '#F0F0F0' },
  lurTid: { fontSize: 12, color: '#888' },
  lurVarighed: { fontSize: 12, fontWeight: '500' },
});