import { useState } from "react";
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

const SCREEN_W = Dimensions.get('window').width - 64; // padding

// ─── Simpel View-baseret linjegraf ────────────────────────────────────────────

function Linjegraf({ punkter, farve, min, max, width, height }: {
  punkter: { x: number; y: number }[];
  farve: string;
  min: number; max: number;
  width: number; height: number;
}) {
  if (punkter.length < 2) return null;
  const range = max - min || 1;
  const toX = (v: number) => (v / (punkter.length - 1)) * width;
  const toY = (v: number) => height - ((v - min) / range) * height;

  return (
    <>
      {punkter.slice(1).map((p, i) => {
        const x1 = toX(i), y1 = toY(punkter[i].y);
        const x2 = toX(i + 1), y2 = toY(p.y);
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        return (
          <View key={i} style={{
            position: 'absolute',
            left: x1, top: y1,
            width: len, height: 2,
            backgroundColor: farve,
            transform: [{ rotate: `${angle}deg` }],
            transformOrigin: '0 50%',
          } as any} />
        );
      })}
      {punkter.map((p, i) => (
        <View key={`dot-${i}`} style={{
          position: 'absolute',
          left: toX(i) - 5,
          top: toY(p.y) - 5,
          width: 10, height: 10,
          borderRadius: 5,
          backgroundColor: farve,
        }} />
      ))}
    </>
  );
}

function VækstGraf({ barn }: { barn: 'a' | 'b' }) {
  const { data } = useApp();
  const [visType, setVisType] = useState<'vægt' | 'længde'>('vægt');
  const besøg = data.børn[barn].sundhedsbesøg ?? [];
  const barnData = data.børn[barn];

  const allebesøg = [
    ...(barnData.fødselsdag ? [{
      dato: barnData.fødselsdag,
      vægt: barnData.fødselsvægt,
      længde: barnData.fødselslængde,
      label: 'Fødsel',
    }] : []),
    ...besøg.map(b => ({
      dato: b.dato,
      vægt: b.vægt,
      længde: b.længde,
      label: new Date(b.dato).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }),
    })),
  ].filter(p => p.dato).sort((a, b) => new Date(a.dato).getTime() - new Date(b.dato).getTime());

  const aktivePunkter = allebesøg.filter(p => p[visType] != null);
  if (aktivePunkter.length < 2) return (
    <View style={styles.grafTom}>
      <Text style={styles.grafTomTekst}>Tilføj mindst 2 besøg med {visType === 'vægt' ? 'vægt' : 'længde'} for at se kurve</Text>
    </View>
  );

  const værdier = aktivePunkter.map(p => p[visType]!);
  const min = Math.min(...værdier);
  const max = Math.max(...værdier);
  const H = 100;
  const W = SCREEN_W - 32;

  const punkter = aktivePunkter.map((_, i) => ({ x: i, y: aktivePunkter[i][visType]! }));

  return (
    <View style={styles.grafWrapper}>
      {/* Toggle vægt/længde */}
      <View style={styles.grafToggle}>
        <TouchableOpacity
          style={[styles.toggleKnap, visType === 'vægt' && styles.toggleAktiv]}
          onPress={() => setVisType('vægt')}
        >
          <Text style={[styles.toggleTekst, visType === 'vægt' && styles.toggleTekstAktiv]}>⚖️ Vægt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleKnap, visType === 'længde' && styles.toggleAktiv]}
          onPress={() => setVisType('længde')}
        >
          <Text style={[styles.toggleTekst, visType === 'længde' && styles.toggleTekstAktiv]}>📏 Længde</Text>
        </TouchableOpacity>
      </View>

      {/* Graf */}
      <View style={{ height: H + 30, position: 'relative', marginTop: 8 }}>
        {/* Y-akse labels */}
        <Text style={[styles.grafYLabel, { top: 0 }]}>{visType === 'vægt' ? `${(max/1000).toFixed(1)}kg` : `${max}cm`}</Text>
        <Text style={[styles.grafYLabel, { bottom: 22 }]}>{visType === 'vægt' ? `${(min/1000).toFixed(1)}kg` : `${min}cm`}</Text>

        {/* Linjegraf */}
        <View style={{ position: 'absolute', left: 36, right: 0, top: 8, height: H }}>
          <Linjegraf
            punkter={punkter}
            farve="#8B5E3C"
            min={min} max={max}
            width={W - 36}
            height={H}
          />
        </View>

        {/* X-akse labels */}
        <View style={{ position: 'absolute', left: 36, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
          {aktivePunkter.map((p, i) => (
            <Text key={i} style={styles.grafXLabel}>{p.label}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Nyt besøg form ────────────────────────────────────────────────────────────

function NytBesøgForm({ barn, onGem }: { barn: 'a' | 'b'; onGem: () => void }) {
  const { tilføjSundhedsbesøg } = useApp();
  const [dato, setDato] = useState(new Date().toISOString().slice(0, 10));
  const [vægt, setVægt] = useState('');
  const [længde, setLængde] = useState('');

  function gem() {
    if (!dato) return;
    tilføjSundhedsbesøg(barn, {
      dato,
      vægt: vægt ? parseInt(vægt) : undefined,
      længde: længde ? parseFloat(længde) : undefined,
    });
    setVægt(''); setLængde('');
    onGem();
  }

  return (
    <View style={styles.formWrapper}>
      <Text style={styles.formTitel}>Nyt besøg</Text>

      <Text style={styles.inputLbl}>Dato</Text>
      <TextInput style={styles.input} value={dato} onChangeText={setDato} placeholder="ÅÅÅÅ-MM-DD" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numbers-and-punctuation" maxLength={10} />

      <View style={styles.toKolonner}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLbl, { marginTop: 10 }]}>Vægt (g)</Text>
          <TextInput style={styles.input} value={vægt} onChangeText={setVægt} placeholder="f.eks. 4200" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numeric" maxLength={5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLbl, { marginTop: 10 }]}>Længde (cm)</Text>
          <TextInput style={styles.input} value={længde} onChangeText={setLængde} placeholder="f.eks. 54" placeholderTextColor={TEMA.tekstSekundær} keyboardType="decimal-pad" maxLength={5} />
        </View>
      </View>

      <TouchableOpacity style={styles.gemKnap} onPress={gem}>
        <Text style={styles.gemKnapTekst}>Gem besøg</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Hoved-komponent ───────────────────────────────────────────────────────────

export default function Sundhed() {
  const { data, sletSundhedsbesøg } = useApp();
  const [visForm, setVisForm] = useState<'a' | 'b' | null>(null);

  function fmtDato(iso: string) {
    try { return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return iso; }
  }

  function fmtVægt(g: number) {
    return g >= 1000 ? `${(g / 1000).toFixed(2).replace('.', ',')} kg` : `${g} g`;
  }

  function bekræftSlet(barn: 'a' | 'b', id: string, dato: string) {
    Alert.alert('Slet besøg', `Slet besøg d. ${fmtDato(dato)}?`, [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Slet', style: 'destructive', onPress: () => sletSundhedsbesøg(barn, id) },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>Vækst og helbred</Text>
        <Text style={styles.titel}>Sundhedsplejerske</Text>
      </View>

      {(['a', 'b'] as const).map(barn => {
        const erA = barn === 'a';
        const besøg = [...(data.børn[barn].sundhedsbesøg ?? [])].sort((a, b) => new Date(b.dato).getTime() - new Date(a.dato).getTime());

        return (
          <View key={barn} style={styles.barnKort}>
            <View style={[styles.barnHeader, { backgroundColor: erA ? '#2C1810' : '#EDE5DC' }]}>
              <Text style={[styles.barnNavn, { color: erA ? '#FDF8F3' : '#2C1810' }]}>{data.navne[barn]}</Text>
            </View>

            <View style={styles.kortBody}>
              {/* Fødselinfo */}
              {(data.børn[barn].fødselsvægt || data.børn[barn].fødselslængde || data.børn[barn].fødselsdag) && (
                <View style={styles.fødselRad}>
                  <Text style={styles.sektionLabel}>Fødsel</Text>
                  <View style={styles.fødselChips}>
                    {data.børn[barn].fødselsdag && <View style={styles.chip}><Text style={styles.chipTekst}>🎂 {fmtDato(data.børn[barn].fødselsdag!)}</Text></View>}
                    {data.børn[barn].fødselsvægt && <View style={styles.chip}><Text style={styles.chipTekst}>⚖️ {fmtVægt(data.børn[barn].fødselsvægt!)}</Text></View>}
                    {data.børn[barn].fødselslængde && <View style={styles.chip}><Text style={styles.chipTekst}>📏 {data.børn[barn].fødselslængde} cm</Text></View>}
                  </View>
                </View>
              )}

              {/* Graf */}
              <VækstGraf barn={barn} />

              {/* Besøgsliste */}
              {besøg.length > 0 && (
                <View style={styles.besøgListe}>
                  <Text style={styles.sektionLabel}>Besøg</Text>
                  {besøg.map(b => {
                    const sorteret = [...(data.børn[barn].sundhedsbesøg ?? [])].sort((a, x) => new Date(a.dato).getTime() - new Date(x.dato).getTime());
                    const idx = sorteret.findIndex(x => x.id === b.id);
                    const forrige = idx > 0 ? sorteret[idx - 1] : null;
                    const diffVægt = (forrige?.vægt && b.vægt) ? b.vægt - forrige.vægt : null;

                    return (
                      <TouchableOpacity key={b.id} style={styles.besøgRad} onLongPress={() => bekræftSlet(barn, b.id, b.dato)}>
                        <View style={styles.besøgVenstre}>
                          <Text style={styles.besøgDato}>{fmtDato(b.dato)}</Text>
                          <View style={styles.besøgChips}>
                            {b.vægt && <Text style={styles.besøgChip}>⚖️ {fmtVægt(b.vægt)}</Text>}
                            {b.længde && <Text style={styles.besøgChip}>📏 {b.længde} cm</Text>}
                          </View>
                        </View>
                        {diffVægt !== null && (
                          <Text style={[styles.diff, { color: diffVægt >= 0 ? '#6B8F71' : '#C4848A' }]}>
                            {diffVægt >= 0 ? '+' : ''}{diffVægt} g
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Nyt besøg */}
              {visForm === barn ? (
                <NytBesøgForm barn={barn} onGem={() => setVisForm(null)} />
              ) : (
                <TouchableOpacity style={styles.tilføjKnap} onPress={() => setVisForm(barn)}>
                  <Text style={styles.tilføjTekst}>+ Tilføj besøg</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TEMA.baggrund },
  topbar: { padding: 16, paddingTop: 60, paddingBottom: 12 },
  eyebrow: { fontSize: 11, color: TEMA.tekstSekundær, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  titel: { fontSize: 24, fontWeight: '500', color: TEMA.tekstPrimær, letterSpacing: -0.3 },
  barnKort: { marginHorizontal: 16, marginBottom: 16, backgroundColor: TEMA.kort, borderRadius: 18, borderWidth: 0.5, borderColor: TEMA.border, overflow: 'hidden' },
  barnHeader: { padding: 14, alignItems: 'center' },
  barnNavn: { fontSize: 14, fontWeight: '500' },
  kortBody: { padding: 16 },
  fødselRad: { marginBottom: 12 },
  sektionLabel: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  fødselChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: TEMA.baggrund, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: TEMA.border },
  chipTekst: { fontSize: 12, color: TEMA.tekstPrimær },
  grafWrapper: { marginBottom: 16, padding: 12, backgroundColor: TEMA.baggrund, borderRadius: 14, borderWidth: 0.5, borderColor: TEMA.border },
  grafTom: { padding: 16, alignItems: 'center' },
  grafTomTekst: { fontSize: 12, color: TEMA.tekstSekundær, textAlign: 'center' },
  grafToggle: { flexDirection: 'row', gap: 8 },
  toggleKnap: { flex: 1, padding: 8, borderRadius: 10, backgroundColor: TEMA.kort, borderWidth: 0.5, borderColor: TEMA.border, alignItems: 'center' },
  toggleAktiv: { backgroundColor: '#8B5E3C', borderColor: '#8B5E3C' },
  toggleTekst: { fontSize: 12, color: TEMA.tekstSekundær },
  toggleTekstAktiv: { color: 'white', fontWeight: '500' },
  grafYLabel: { position: 'absolute', left: 0, fontSize: 9, color: TEMA.tekstSekundær, width: 34, textAlign: 'right' },
  grafXLabel: { fontSize: 8, color: TEMA.tekstSekundær, textAlign: 'center' },
  besøgListe: { marginBottom: 12 },
  besøgRad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: TEMA.borderLight },
  besøgVenstre: { flex: 1 },
  besøgDato: { fontSize: 13, fontWeight: '500', color: TEMA.tekstPrimær, marginBottom: 3 },
  besøgChips: { flexDirection: 'row', gap: 8 },
  besøgChip: { fontSize: 11, color: TEMA.tekstSekundær },
  diff: { fontSize: 13, fontWeight: '500' },
  tilføjKnap: { backgroundColor: TEMA.baggrund, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: TEMA.border, borderStyle: 'dashed' },
  tilføjTekst: { fontSize: 13, color: TEMA.tekstSekundær },
  formWrapper: { marginTop: 8, padding: 14, backgroundColor: TEMA.baggrund, borderRadius: 14, borderWidth: 0.5, borderColor: TEMA.border },
  formTitel: { fontSize: 13, fontWeight: '500', color: TEMA.tekstPrimær, marginBottom: 12 },
  inputLbl: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { fontSize: 15, color: TEMA.tekstPrimær, padding: 12, borderWidth: 0.5, borderColor: TEMA.border, borderRadius: 12, backgroundColor: TEMA.kort },
  toKolonner: { flexDirection: 'row', gap: 10 },
  gemKnap: { backgroundColor: '#8B5E3C', borderRadius: 12, padding: 12, marginTop: 14, alignItems: 'center' },
  gemKnapTekst: { color: 'white', fontSize: 14, fontWeight: '500' },
});