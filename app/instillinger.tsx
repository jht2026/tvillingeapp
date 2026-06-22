import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { Medicin, TEMA } from "./store";

export default function Indstillinger() {
  const { data, gemAlt, tilføjMedicin, sletMedicin } = useApp();

  const [navnA, setNavnA] = useState('');
  const [navnB, setNavnB] = useState('');
  const [fødselsdagA, setFødselsdagA] = useState(data.børn.a.fødselsdag?.slice(0, 10) ?? '');
  const [fødselsvægtA, setFødselsvægtA] = useState(data.børn.a.fødselsvægt ? String(data.børn.a.fødselsvægt) : '');
  const [fødselslængdeA, setFødselslængdeA] = useState(data.børn.a.fødselslængde ? String(data.børn.a.fødselslængde) : '');
  const [fødselsdagB, setFødselsdagB] = useState(data.børn.b.fødselsdag?.slice(0, 10) ?? '');
  const [fødselsvægtB, setFødselsvægtB] = useState(data.børn.b.fødselsvægt ? String(data.børn.b.fødselsvægt) : '');
  const [fødselslængdeB, setFødselslængdeB] = useState(data.børn.b.fødselslængde ? String(data.børn.b.fødselslængde) : '');
  const [gemt, setGemt] = useState(false);

  // Medicin
  const [nytMedicinNavn, setNytMedicinNavn] = useState('');
  const [sletBekræft, setSletBekræft] = useState<string | null>(null);
  const [nytMedicinGange, setNytMedicinGange] = useState('1');
  const [nytMedicinBørn, setNytMedicinBørn] = useState<('a' | 'b')[]>(['a', 'b']);

  function gem() {
    gemAlt(
      navnA.trim() || data.navne.a,
      navnB.trim() || data.navne.b,
      {
        fødselsdag: fødselsdagA || undefined,
        fødselsvægt: fødselsvægtA ? parseInt(fødselsvægtA) : undefined,
        fødselslængde: fødselslængdeA ? parseFloat(fødselslængdeA) : undefined,
      },
      {
        fødselsdag: fødselsdagB || undefined,
        fødselsvægt: fødselsvægtB ? parseInt(fødselsvægtB) : undefined,
        fødselslængde: fødselslængdeB ? parseFloat(fødselslængdeB) : undefined,
      }
    );
    setNavnA(''); setNavnB('');
    setGemt(true);
    setTimeout(() => setGemt(false), 2000);
  }

  function gemMedicin() {
    if (!nytMedicinNavn.trim()) return;
    if (nytMedicinBørn.length === 0) return;
    const gange = parseInt(nytMedicinGange) || 1;
    tilføjMedicin({ navn: nytMedicinNavn.trim(), gangeOmDagen: gange, børn: nytMedicinBørn });
    setNytMedicinNavn('');
    setNytMedicinGange('1');
    setNytMedicinBørn(['a', 'b']);
  }

  function bekræftSletMedicin(m: Medicin) {
    setSletBekræft(m.id);
  }

  const state = {
    a: { navn: navnA, setNavn: setNavnA, fødselsdag: fødselsdagA, setFødselsdag: setFødselsdagA, vægt: fødselsvægtA, setVægt: setFødselsvægtA, længde: fødselslængdeA, setLængde: setFødselslængdeA },
    b: { navn: navnB, setNavn: setNavnB, fødselsdag: fødselsdagB, setFødselsdag: setFødselsdagB, vægt: fødselsvægtB, setVægt: setFødselsvægtB, længde: fødselslængdeB, setLængde: setFødselslængdeB },
  };

  const medicin = data.medicin ?? [];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>Tilpas appen</Text>
        <Text style={styles.titel}>Indstillinger</Text>
      </View>

      {/* Barn-indstillinger */}
      {(['a', 'b'] as const).map(barn => {
        const s = state[barn];
        const erA = barn === 'a';
        return (
          <View key={barn}>
            <Text style={styles.sektionLabel}>{data.navne[barn]}</Text>
            <View style={styles.kort}>
              <View style={[styles.kortHeader, { backgroundColor: erA ? '#2C1810' : '#EDE5DC' }]}>
                <Text style={[styles.kortHeaderTekst, { color: erA ? 'white' : '#2C1810' }]}>{data.navne[barn]}</Text>
              </View>
              <View style={styles.kortBody}>
                <Text style={styles.inputLbl}>Navn</Text>
                <TextInput style={styles.input} value={s.navn} onChangeText={s.setNavn} placeholder={data.navne[barn]} placeholderTextColor={TEMA.tekstSekundær} maxLength={20} />

                <Text style={[styles.inputLbl, { marginTop: 14 }]}>Fødselsdag</Text>
                <TextInput style={styles.input} value={s.fødselsdag} onChangeText={s.setFødselsdag} placeholder="ÅÅÅÅ-MM-DD" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numbers-and-punctuation" maxLength={10} />

                <View style={styles.toKolonner}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLbl, { marginTop: 14 }]}>Fødselsvægt (g)</Text>
                    <TextInput style={styles.input} value={s.vægt} onChangeText={s.setVægt} placeholder={data.børn[barn].fødselsvægt ? String(data.børn[barn].fødselsvægt) : 'f.eks. 3335'} placeholderTextColor={TEMA.tekstSekundær} keyboardType="numeric" maxLength={5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLbl, { marginTop: 14 }]}>Fødselslængde (cm)</Text>
                    <TextInput style={styles.input} value={s.længde} onChangeText={s.setLængde} placeholder={data.børn[barn].fødselslængde ? String(data.børn[barn].fødselslængde) : 'f.eks. 51'} placeholderTextColor={TEMA.tekstSekundær} keyboardType="decimal-pad" maxLength={5} />
                  </View>
                </View>

                {(data.børn[barn].fødselsdag || data.børn[barn].fødselsvægt || data.børn[barn].fødselslængde) && (
                  <View style={styles.gemtInfo}>
                    {data.børn[barn].fødselsdag && <Text style={styles.gemtTekst}>🎂 {new Date(data.børn[barn].fødselsdag!).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>}
                    {data.børn[barn].fødselsvægt && <Text style={styles.gemtTekst}>⚖️ {data.børn[barn].fødselsvægt} g</Text>}
                    {data.børn[barn].fødselslængde && <Text style={styles.gemtTekst}>📏 {data.børn[barn].fødselslængde} cm</Text>}
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.gemKnap} onPress={gem}>
        <Text style={styles.gemKnapTekst}>{gemt ? '✓ Gemt!' : 'Gem indstillinger'}</Text>
      </TouchableOpacity>

      {/* Medicin sektion */}
      <Text style={styles.sektionLabel}>Medicin</Text>
      <View style={styles.kort}>
        <View style={styles.kortBody}>
          <Text style={styles.medicinInfo}>Tilføj medicin der gives dagligt. Antallet af gange bestemmer hvor mange tjekbokse der vises i loggen.</Text>

          {/* Eksisterende medicin */}
          {medicin.length > 0 && (
            <View style={styles.medicinListe}>
              {medicin.map(m => (
                <View key={m.id} style={styles.medicinRad}>
                  <View style={styles.medicinInfo2}>
                    <Text style={styles.medicinNavn}>💊 {m.navn}</Text>
                    <Text style={styles.medicinGange}>{m.gangeOmDagen}x dagligt — {(m.børn ?? ['a', 'b']).map(b => data.navne[b]).join(' & ')}</Text>
                  </View>
                  {sletBekræft === m.id ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity onPress={() => setSletBekræft(null)} style={[styles.sletKnap, { borderColor: TEMA.border }]}>
                        <Text style={[styles.sletTekst, { color: TEMA.tekstSekundær }]}>Nej</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { sletMedicin(m.id); setSletBekræft(null); }} style={[styles.sletKnap, { backgroundColor: '#C4848A', borderColor: '#C4848A' }]}>
                        <Text style={[styles.sletTekst, { color: 'white' }]}>Slet</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => bekræftSletMedicin(m)} style={styles.sletKnap}>
                      <Text style={styles.sletTekst}>Slet</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Tilføj nyt medicin */}
          <Text style={[styles.inputLbl, { marginTop: medicin.length > 0 ? 16 : 0 }]}>Navn</Text>
          <TextInput style={styles.input} value={nytMedicinNavn} onChangeText={setNytMedicinNavn} placeholder="fx Movicol, D-vitamin" placeholderTextColor={TEMA.tekstSekundær} />

          <Text style={[styles.inputLbl, { marginTop: 10 }]}>Antal gange dagligt</Text>
          <View style={styles.gangeRad}>
            {[1, 2, 3, 4].map(n => (
              <TouchableOpacity
                key={n}
                style={[styles.gangeKnap, nytMedicinGange === String(n) && styles.gangeKnapAktiv]}
                onPress={() => setNytMedicinGange(String(n))}
              >
                <Text style={[styles.gangeTekst, nytMedicinGange === String(n) && styles.gangeTekstAktiv]}>{n}x</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.inputLbl, { marginTop: 12 }]}>Til hvem</Text>
          <View style={styles.gangeRad}>
            {(['a', 'b'] as const).map(barn => {
              const valgt = nytMedicinBørn.includes(barn);
              return (
                <TouchableOpacity
                  key={barn}
                  style={[styles.gangeKnap, valgt && styles.gangeKnapAktiv]}
                  onPress={() => setNytMedicinBørn(prev =>
                    valgt ? prev.filter(b => b !== barn) : [...prev, barn]
                  )}
                >
                  <Text style={[styles.gangeTekst, valgt && styles.gangeTekstAktiv]}>{data.navne[barn]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.tilføjKnap} onPress={gemMedicin}>
            <Text style={styles.tilføjTekst}>+ Tilføj medicin</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  kort: { marginHorizontal: 16, backgroundColor: TEMA.kort, borderRadius: 18, borderWidth: 0.5, borderColor: TEMA.border, overflow: 'hidden', marginBottom: 8 },
  kortHeader: { padding: 14, alignItems: 'center' },
  kortHeaderTekst: { fontSize: 14, fontWeight: '500' },
  kortBody: { padding: 16 },
  inputLbl: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { fontSize: 15, color: TEMA.tekstPrimær, padding: 12, borderWidth: 0.5, borderColor: TEMA.border, borderRadius: 12, backgroundColor: TEMA.baggrund },
  toKolonner: { flexDirection: 'row', gap: 10 },
  gemtInfo: { marginTop: 14, padding: 12, backgroundColor: TEMA.baggrund, borderRadius: 12, gap: 4 },
  gemtTekst: { fontSize: 12, color: TEMA.tekstSekundær },
  gemKnap: { backgroundColor: '#8B5E3C', borderRadius: 14, padding: 14, marginHorizontal: 16, marginTop: 16, marginBottom: 8, alignItems: 'center' },
  gemKnapTekst: { color: 'white', fontSize: 15, fontWeight: '500' },
  medicinInfo: { fontSize: 12, color: TEMA.tekstSekundær, marginBottom: 12, lineHeight: 18 },
  medicinListe: { marginBottom: 8 },
  medicinRad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: TEMA.borderLight },
  medicinInfo2: { flex: 1 },
  medicinNavn: { fontSize: 14, fontWeight: '500', color: TEMA.tekstPrimær },
  medicinGange: { fontSize: 11, color: TEMA.tekstSekundær, marginTop: 2 },
  sletKnap: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 0.5, borderColor: '#C4848A' },
  sletTekst: { fontSize: 12, color: '#C4848A' },
  gangeRad: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  gangeKnap: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: TEMA.border, backgroundColor: TEMA.baggrund, alignItems: 'center' },
  gangeKnapAktiv: { backgroundColor: '#2C1810', borderColor: '#2C1810' },
  gangeTekst: { fontSize: 14, color: TEMA.tekstSekundær },
  gangeTekstAktiv: { color: 'white', fontWeight: '500' },
  tilføjKnap: { backgroundColor: TEMA.baggrund, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: TEMA.border, borderStyle: 'dashed' },
  tilføjTekst: { fontSize: 13, color: TEMA.tekstSekundær },
});