import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

export default function Oversigt() {
  const { data } = useApp();
  const navne = data.navne;
  const farver = data.farver;
  const [dagOffset, setDagOffset] = useState(0); // 0 = i dag, 1 = i går, osv.

  function fmtMins(m: number) {
    if (m >= 60) return Math.floor(m / 60) + 't ' + (m % 60) + 'm';
    return m + 'm';
  }

  function getDagStart(offset: number) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getDagData(barn: 'a' | 'b', offset: number) {
    const dagStart = getDagStart(offset);
    const dagSlut = new Date(dagStart);
    dagSlut.setDate(dagStart.getDate() + 1);

    function erIDag(item: { tidspunkt?: string; lurStart?: number }) {
      const ts = item.tidspunkt ? new Date(item.tidspunkt).getTime() : item.lurStart;
      if (!ts) return false;
      const d = new Date(ts);
      return d >= dagStart && d < dagSlut;
    }

    const log = data.børn[barn].log;
    const amninger = log.filter(i => i.type === 'amning' && erIDag(i));
    const flasker = log.filter(i => i.type === 'flaske' && erIDag(i));
    const lure = log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut && erIDag(i));
    const bleer = log.filter(i => i.type === 'ble' && erIDag(i));

    const flaskeTotal = flasker.reduce((s, i) => s + (i.værdi || 0), 0);
    const lurTotalMins = lure.reduce((s, l) => s + Math.round((l.lurSlut! - l.lurStart!) / 60000), 0);
    const venstre = amninger.filter(i => i.bryst === 'venstre').length;
    const højre = amninger.filter(i => i.bryst === 'højre').length;

    // Søvntidslinje — beregn segmenter
    const dagMs = 24 * 60 * 60 * 1000;
    const søvnSegmenter = lure.map(l => ({
      start: Math.max(0, (l.lurStart! - dagStart.getTime()) / dagMs * 100),
      width: Math.max(0.5, (l.lurSlut! - l.lurStart!) / dagMs * 100),
    }));

    return {
      amningAntal: amninger.length, venstre, højre,
      flaskeAntal: flasker.length, flaskeTotal,
      flaskeGns: flasker.length > 0 ? Math.round(flaskeTotal / flasker.length) : 0,
      lurAntal: lure.length, lurTotalMins,
      lurGns: lure.length > 0 ? Math.round(lurTotalMins / lure.length) : 0,
      bleTotal: bleer.length,
      bleVaad: bleer.filter(i => i.bleType === 'vaad').length,
      bleBeskidt: bleer.filter(i => i.bleType === 'beskidt').length,
      bleBegge: bleer.filter(i => i.bleType === 'begge').length,
      søvnSegmenter,
    };
  }

  function fmtDatoLabel(offset: number) {
    if (offset === 0) return 'I dag';
    if (offset === 1) return 'I går';
    const d = getDagStart(offset);
    return d.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  const dataA = getDagData('a', dagOffset);
  const dataB = getDagData('b', dagOffset);

  function StatKort({ label, rækker }: {
    label: string;
    rækker: { lbl: string; valA: string; valB: string }[];
  }) {
    return (
      <View style={styles.statKort}>
        {/* Header med barnnavne */}
        <View style={styles.statHeader}>
          <Text style={styles.statLbl}>{label}</Text>
          <View style={[styles.barnBadge, { backgroundColor: farver.a }]}><Text style={styles.barnBadgeTekst}>{navne.a}</Text></View>
          <View style={[styles.barnBadge, { backgroundColor: farver.b }]}><Text style={styles.barnBadgeTekst}>{navne.b}</Text></View>
        </View>
        {rækker.map((r, i) => (
          <View key={i} style={[styles.statRækkeFull, i === 0 && { borderTopWidth: 0.5, borderTopColor: TEMA.border, marginTop: 8, paddingTop: 8 }]}>
            <Text style={styles.statRækkeLbl}>{r.lbl}</Text>
            <Text style={[styles.statRækkeVal, { color: farver.a }]}>{r.valA}</Text>
            <Text style={[styles.statRækkeVal, { color: farver.b }]}>{r.valB}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>Dag for dag</Text>
        <Text style={styles.titel}>Oversigt</Text>
      </View>

      {/* Dag navigator */}
      <View style={styles.dagNav}>
        <TouchableOpacity style={styles.navKnap} onPress={() => setDagOffset(d => d + 1)}>
          <Text style={styles.navPil}>‹</Text>
        </TouchableOpacity>
        <View style={styles.dagLabelWrap}>
          <Text style={styles.dagLabel}>{fmtDatoLabel(dagOffset)}</Text>
          <Text style={styles.dagDato}>{getDagStart(dagOffset).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <TouchableOpacity style={[styles.navKnap, dagOffset === 0 && styles.navKnapDisabled]} onPress={() => setDagOffset(d => Math.max(0, d - 1))} disabled={dagOffset === 0}>
          <Text style={[styles.navPil, dagOffset === 0 && { color: TEMA.border }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Hurtig dag-vælger */}
      <View style={styles.hurtigNav}>
        {[0, 1, 2, 3, 4, 5, 6].map(i => {
          const d = getDagStart(i);
          const label = i === 0 ? 'I dag' : i === 1 ? 'I går' : d.toLocaleDateString('da-DK', { weekday: 'short' });
          return (
            <TouchableOpacity key={i} style={[styles.hurtigKnap, dagOffset === i && styles.hurtigKnapAktiv]} onPress={() => setDagOffset(i)}>
              <Text style={[styles.hurtigTekst, dagOffset === i && styles.hurtigTekstAktiv]}>{label}</Text>
              <Text style={[styles.hurtigDato, dagOffset === i && styles.hurtigTekstAktiv]}>{d.getDate()}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Søvntidslinjer */}
      <Text style={styles.sektionLabel}>Søvn</Text>
      <View style={styles.kortFull}>
        {(['a', 'b'] as const).map(barn => {
          const d = barn === 'a' ? dataA : dataB;
          return (
            <View key={barn} style={{ marginBottom: barn === 'a' ? 12 : 0 }}>
              <View style={styles.tlRad}>
                <Text style={[styles.tlNavn, { color: farver[barn] }]}>{navne[barn]}</Text>
                <View style={styles.tlBar}>
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#EDE5DC', borderRadius: 6 }]} />
                  {d.søvnSegmenter.map((seg, i) => (
                    <View key={i} style={[styles.tlSegment, { left: seg.start + '%' as any, width: Math.min(seg.width, 100 - seg.start) + '%' as any, backgroundColor: farver[barn] }]} />
                  ))}
                </View>
              </View>
              <View style={styles.tlTider}>
                {['00', '06', '12', '18', '24'].map(t => <Text key={t} style={styles.tlTid}>{t}</Text>)}
              </View>
            </View>
          );
        })}
      </View>

      {/* Stats */}
      <StatKort
        label="🤱 Amning"
        rækker={[
          { lbl: 'Antal', valA: String(dataA.amningAntal), valB: String(dataB.amningAntal) },
          { lbl: 'Venstre bryst', valA: String(dataA.venstre), valB: String(dataB.venstre) },
          { lbl: 'Højre bryst', valA: String(dataA.højre), valB: String(dataB.højre) },
        ]}
      />
      <StatKort
        label="🍼 Flaske"
        rækker={[
          { lbl: 'Antal gange', valA: String(dataA.flaskeAntal), valB: String(dataB.flaskeAntal) },
          { lbl: 'Total ml', valA: dataA.flaskeTotal > 0 ? dataA.flaskeTotal + ' ml' : '-', valB: dataB.flaskeTotal > 0 ? dataB.flaskeTotal + ' ml' : '-' },
          { lbl: 'Gns. ml', valA: dataA.flaskeAntal > 0 ? dataA.flaskeGns + ' ml' : '-', valB: dataB.flaskeAntal > 0 ? dataB.flaskeGns + ' ml' : '-' },
        ]}
      />
      <StatKort
        label="😴 Søvn"
        rækker={[
          { lbl: 'Total søvn', valA: dataA.lurTotalMins > 0 ? fmtMins(dataA.lurTotalMins) : '-', valB: dataB.lurTotalMins > 0 ? fmtMins(dataB.lurTotalMins) : '-' },
          { lbl: 'Antal lure', valA: String(dataA.lurAntal), valB: String(dataB.lurAntal) },
          { lbl: 'Gns. varighed', valA: dataA.lurAntal > 0 ? fmtMins(dataA.lurGns) : '-', valB: dataB.lurAntal > 0 ? fmtMins(dataB.lurGns) : '-' },
        ]}
      />
      <StatKort
        label="👶 Bleskift"
        rækker={[
          { lbl: 'Total', valA: String(dataA.bleTotal), valB: String(dataB.bleTotal) },
          { lbl: '💧 Våde', valA: String(dataA.bleVaad), valB: String(dataB.bleVaad) },
          { lbl: '💩 Afføring', valA: String(dataA.bleBeskidt), valB: String(dataB.bleBeskidt) },
          { lbl: '🔄 Begge', valA: String(dataA.bleBegge), valB: String(dataB.bleBegge) },
        ]}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TEMA.baggrund },
  topbar: { backgroundColor: TEMA.baggrund, padding: 16, paddingTop: 60, paddingBottom: 12 },
  eyebrow: { fontSize: 11, color: TEMA.tekstSekundær, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  titel: { fontSize: 24, fontWeight: '500', color: TEMA.tekstPrimær, letterSpacing: -0.3 },
  sektionLabel: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.6, marginHorizontal: 16, marginTop: 14, marginBottom: 6 },
  dagNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginBottom: 8 },
  navKnap: { padding: 12 },
  navPil: { fontSize: 28, color: TEMA.tekstPrimær, lineHeight: 32 },
  navKnapDisabled: { opacity: 0.3 },
  dagLabelWrap: { flex: 1, alignItems: 'center' },
  dagLabel: { fontSize: 16, fontWeight: '500', color: TEMA.tekstPrimær },
  dagDato: { fontSize: 11, color: TEMA.tekstSekundær, marginTop: 2 },
  hurtigNav: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 4 },
  hurtigKnap: { flex: 1, alignItems: 'center', padding: 6, borderRadius: 10, backgroundColor: TEMA.kort, borderWidth: 0.5, borderColor: TEMA.border },
  hurtigKnapAktiv: { backgroundColor: TEMA.tekstPrimær, borderColor: TEMA.tekstPrimær },
  hurtigTekst: { fontSize: 8, color: TEMA.tekstSekundær },
  hurtigDato: { fontSize: 12, fontWeight: '500', color: TEMA.tekstPrimær, marginTop: 2 },
  hurtigTekstAktiv: { color: 'white' },

  kortFull: { backgroundColor: TEMA.kort, borderRadius: 16, borderWidth: 0.5, borderColor: TEMA.border, padding: 14, marginHorizontal: 16, marginBottom: 8 },
  tlRad: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  tlNavn: { fontSize: 10, fontWeight: '500', width: 60 },
  tlBar: { flex: 1, height: 20, position: 'relative', borderRadius: 6, overflow: 'hidden' },
  tlSegment: { position: 'absolute', top: 0, bottom: 0, borderRadius: 4 },
  tlTider: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 68 },
  tlTid: { fontSize: 8, color: TEMA.tekstSekundær },
  statKort: { backgroundColor: TEMA.kort, borderRadius: 16, borderWidth: 0.5, borderColor: TEMA.border, padding: 14, marginHorizontal: 16, marginBottom: 8 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLbl: { flex: 1, fontSize: 13, fontWeight: '500', color: TEMA.tekstPrimær },
  barnBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  barnBadgeTekst: { fontSize: 11, fontWeight: '500', color: 'white' },
  statRækkeFull: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: TEMA.borderLight },
  statRækkeLbl: { flex: 1, fontSize: 12, color: TEMA.tekstSekundær },
  statRækkeVal: { fontSize: 13, fontWeight: '500', width: 80, textAlign: 'right' },
});