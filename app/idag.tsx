import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

// ─── Ikoner ────────────────────────────────────────────────────────────────────

function IkonFlaske({ size = 14 }: { farve?: string; size?: number }) {
  return <Text style={{ fontSize: size, lineHeight: size + 4 }}>🍼</Text>;
}

function IkonAmning({ size = 14 }: { farve?: string; size?: number }) {
  return <Text style={{ fontSize: size, lineHeight: size + 4 }}>🤱</Text>;
}

// ─── Tidslinje ─────────────────────────────────────────────────────────────────

function Tidslinje({ barn, farve }: { barn: 'a' | 'b'; farve: string }) {
  const { data } = useApp();
  const log = data.børn[barn].log;
  const dagStart = new Date();
  dagStart.setHours(0, 0, 0, 0);
  const dagMs = 24 * 60 * 60 * 1000;

  const lure = log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut);
  const madItems = log.filter(i => i.type === 'amning' || i.type === 'flaske');

  const tidPct = (ts: number) => Math.max(0, Math.min(99, ((ts - dagStart.getTime()) / dagMs) * 100));

  return (
    <View style={styles.tlWrapper}>
      <View style={[styles.tlBar, { height: 52 }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#EDE5DC', borderRadius: 10 }]} />
        {lure.map(lur => {
          const left = tidPct(lur.lurStart!);
          const width = tidPct(lur.lurSlut!) - left;
          return (
            <View key={lur.id} style={[styles.tlSovn, { left: `${left}%` as any, width: `${Math.max(width, 0.8)}%` as any, backgroundColor: farve }]} />
          );
        })}
        {madItems.map(item => {
          const ts = item.tidspunkt ? new Date(item.tidspunkt).getTime() : null;
          if (ts === null) return null;
          const pct = tidPct(ts);
          const erISovn = lure.some(l => ts >= l.lurStart! && ts <= l.lurSlut!);
          const ikonFarve = erISovn ? '#FDF8F3' : '#2C1810';
          return (
            <View key={item.id} style={[styles.tlIkon, { left: `${pct}%` as any }]}>
              {item.type === 'flaske'
                ? <IkonFlaske size={14} />
                : <IkonAmning size={14} />
              }
            </View>
          );
        })}
      </View>
      <View style={styles.tlTider}>
        {['00', '06', '12', '18', '24'].map(h => (
          <Text key={h} style={styles.tlTidTekst}>{h}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Stats kort ────────────────────────────────────────────────────────────────

function StatKort({ label, value, farve, detaljer }: {
  label: string; value: string; farve: string; detaljer: React.ReactNode;
}) {
  const [åben, setÅben] = useState(false);
  return (
    <TouchableOpacity
      style={[styles.statKort, åben && { borderColor: TEMA.aktivBorder }]}
      onPress={() => setÅben(v => !v)}
      activeOpacity={0.75}
    >
      <Text style={[styles.statKortVal, { color: farve }]}>{value}</Text>
      <Text style={styles.statKortLbl}>{label}</Text>
      <Text style={styles.statKortPil}>{åben ? '▲' : '▼'}</Text>
      {åben && <View style={styles.statDetaljer}>{detaljer}</View>}
    </TouchableOpacity>
  );
}

function DetaljeRad({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detaljeRad}>
      <Text style={styles.detaljeLbl}>{label}</Text>
      <Text style={styles.detaljeVal}>{value}</Text>
    </View>
  );
}

// ─── Hoved-komponent ───────────────────────────────────────────────────────────

export default function Idag() {
  const { data } = useApp();
  const navne = data.navne;
  const farver = data.farver;

  function fmtMins(m: number) {
    if (m >= 60) return Math.floor(m / 60) + 't ' + (m % 60) + 'm';
    return m + 'm';
  }

  function fmtSek(s: number) {
    if (s >= 3600) return `${Math.floor(s / 3600)}t ${Math.floor((s % 3600) / 60)}m`;
    if (s >= 60) return `${Math.floor(s / 60)}m ${s % 60}s`;
    return `${s}s`;
  }

  function parseVarighed(tekst: string): number {
    let sek = 0;
    const t = tekst.match(/(\d+)t/); if (t) sek += parseInt(t[1]) * 3600;
    const m = tekst.match(/(\d+)m/); if (m) sek += parseInt(m[1]) * 60;
    const s = tekst.match(/(\d+)s/); if (s) sek += parseInt(s[1]);
    return sek;
  }

  function getStats(barn: 'a' | 'b') {
    const dagStart = new Date(); dagStart.setHours(0, 0, 0, 0);
    const dagSlut = new Date(); dagSlut.setHours(23, 59, 59, 999);

    function erIdag(item: { tidspunkt?: string }): boolean {
      // gamle items uden tidspunkt kan vi ikke datere — ekskluder dem
      if (!item.tidspunkt) return false;
      const d = new Date(item.tidspunkt);
      return d >= dagStart && d <= dagSlut;
    }

    const log = data.børn[barn].log;
    const amninger = log.filter(i => i.type === 'amning' && erIdag(i));
    const flasker = log.filter(i => i.type === 'flaske' && erIdag(i));
    const lure = log.filter(i => i.type === 'lur' && i.lurStart && i.lurSlut && erIdag(i));
    const bleer = log.filter(i => i.type === 'ble' && erIdag(i));

    const flaskeTotal = flasker.reduce((s, i) => s + (i.værdi || 0), 0);
    const lurTotalMins = lure.reduce((s, i) => s + Math.round((i.lurSlut! - i.lurStart!) / 60000), 0);

    const venstre = amninger.filter(i => i.bryst === 'venstre').length;
    const højre = amninger.filter(i => i.bryst === 'højre').length;

    const amningTotalSek = amninger.reduce((s, i) => s + parseVarighed(i.tekst), 0);
    const amningGns = amninger.length > 0 ? fmtSek(Math.round(amningTotalSek / amninger.length)) : '-';

    const flaskeGns = flasker.length > 0 ? `${Math.round(flaskeTotal / flasker.length)}ml` : '-';

    const lurGns = lure.length > 0 ? fmtMins(Math.round(lurTotalMins / lure.length)) : '-';

    return {
      amningAntal: amninger.length, venstre, højre, amningGns,
      flaskeAntal: flasker.length, flaskeTotal, flaskeGns,
      lurAntal: lure.length, lurTotalMins, lurGns,
      bleTotal: bleer.length,
      bleVaad: bleer.filter(i => i.bleType === 'vaad').length,
      bleBeskidt: bleer.filter(i => i.bleType === 'beskidt').length,
      bleBegge: bleer.filter(i => i.bleType === 'begge').length,
    };
  }

  const dato = new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>{dato}</Text>
        <Text style={styles.titel}>Døgnoverblik — i dag</Text>
      </View>

      {(['a', 'b'] as const).map(barn => {
        const s = getStats(barn);
        const erA = barn === 'a';

        return (
          <View key={barn} style={styles.barnKort}>
            <View style={[styles.barnHeader, { backgroundColor: erA ? '#2C1810' : '#EDE5DC' }]}>
              <Text style={[styles.barnNavn, { color: erA ? '#FDF8F3' : '#2C1810' }]}>{navne[barn]}</Text>
            </View>

            <View style={styles.tidslinjePad}>
              <Tidslinje barn={barn} farve={farver[barn]} />
            </View>

            <View style={styles.statsRad}>

              {/* Amning */}
              <StatKort
                label="AMNINGER"
                value={String(s.amningAntal)}
                farve={TEMA.tekstPrimær}
                detaljer={<>
                  <DetaljeRad label="Venstre" value={String(s.venstre)} />
                  <DetaljeRad label="Højre" value={String(s.højre)} />
                  <DetaljeRad label="Gns. varighed" value={s.amningGns} />
                </>}
              />

              {/* Flaske */}
              <StatKort
                label="FLASKE"
                value={`${s.flaskeTotal}ml`}
                farve="#7B9EB8"
                detaljer={<>
                  <DetaljeRad label="Antal" value={String(s.flaskeAntal)} />
                  <DetaljeRad label="Gns. per gang" value={s.flaskeGns} />
                </>}
              />

              {/* Søvn */}
              <StatKort
                label="SØVN"
                value={s.lurTotalMins > 0 ? fmtMins(s.lurTotalMins) : '0m'}
                farve={TEMA.tekstPrimær}
                detaljer={<>
                  <DetaljeRad label="Antal lure" value={String(s.lurAntal)} />
                  <DetaljeRad label="Gns. varighed" value={s.lurGns} />
                </>}
              />

              {/* Bleskift */}
              <StatKort
                label="BLESKIFT"
                value={String(s.bleTotal)}
                farve="#C4848A"
                detaljer={<>
                  <DetaljeRad label="💧 Våde" value={String(s.bleVaad)} />
                  <DetaljeRad label="💩 Beskidte" value={String(s.bleBeskidt)} />
                  <DetaljeRad label="Begge" value={String(s.bleBegge)} />
                </>}
              />

            </View>
          </View>
        );
      })}

      {/* Legende */}
      <View style={styles.legende}>
        <View style={styles.legendeItem}>
          <View style={{ width: 12, height: 12, backgroundColor: '#2C1810', borderRadius: 3 }} />
          <Text style={styles.legendeTekst}>Søvn</Text>
        </View>
        <View style={styles.legendeItem}>
          <IkonAmning size={12} />
          <Text style={styles.legendeTekst}>Amning</Text>
        </View>
        <View style={styles.legendeItem}>
          <IkonFlaske size={12} />
          <Text style={styles.legendeTekst}>Flaske</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TEMA.baggrund },
  topbar: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 12 },
  eyebrow: { fontSize: 11, color: TEMA.tekstSekundær, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  titel: { fontSize: 18, fontWeight: '500', color: TEMA.tekstPrimær, letterSpacing: -0.2 },
  barnKort: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: TEMA.kort, borderRadius: 16,
    borderWidth: 0.5, borderColor: TEMA.border, overflow: 'hidden',
  },
  barnHeader: { paddingVertical: 10, paddingHorizontal: 14 },
  barnNavn: { fontSize: 13, fontWeight: '500' },
  tidslinjePad: { paddingHorizontal: 12, paddingTop: 10 },
  tlWrapper: { marginBottom: 0 },
  tlBar: { position: 'relative', borderRadius: 10, overflow: 'hidden' },
  tlSovn: { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#2C1810', borderRadius: 6 },
  tlIkon: { position: 'absolute', top: '50%', marginTop: -11, marginLeft: -7, alignItems: 'center', justifyContent: 'center' },
  tlTider: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 2 },
  tlTidTekst: { fontSize: 9, color: TEMA.tekstSekundær },
  statsRad: { flexDirection: 'row', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 8, gap: 6 },
  statKort: {
    flex: 1, backgroundColor: TEMA.baggrund, borderRadius: 12,
    borderWidth: 0.5, borderColor: TEMA.border, padding: 8, alignItems: 'center', minHeight: 72,
  },
  statKortVal: { fontSize: 16, fontWeight: '500', marginBottom: 2 },
  statKortLbl: { fontSize: 8, color: TEMA.tekstSekundær, letterSpacing: 0.4, textAlign: 'center' },
  statKortPil: { fontSize: 8, color: TEMA.tekstSekundær, marginTop: 4 },
  statDetaljer: { marginTop: 8, width: '100%', borderTopWidth: 0.5, borderTopColor: TEMA.border, paddingTop: 6 },
  detaljeRad: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  detaljeLbl: { fontSize: 9, color: TEMA.tekstSekundær, flex: 1 },
  detaljeVal: { fontSize: 9, fontWeight: '500', color: TEMA.tekstPrimær },
  legende: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginTop: 4, alignItems: 'center' },
  legendeItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendeTekst: { fontSize: 10, color: TEMA.tekstSekundær },
});