import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

export default function Indstillinger() {
  const { data, gemAlt } = useApp();

  const [navnA, setNavnA] = useState('');
  const [navnB, setNavnB] = useState('');

  const [fødselsdagA, setFødselsdagA] = useState(data.børn.a.fødselsdag?.slice(0, 10) ?? '');
  const [fødselsvægtA, setFødselsvægtA] = useState(data.børn.a.fødselsvægt ? String(data.børn.a.fødselsvægt) : '');
  const [fødselslængdeA, setFødselslængdeA] = useState(data.børn.a.fødselslængde ? String(data.børn.a.fødselslængde) : '');

  const [fødselsdagB, setFødselsdagB] = useState(data.børn.b.fødselsdag?.slice(0, 10) ?? '');
  const [fødselsvægtB, setFødselsvægtB] = useState(data.børn.b.fødselsvægt ? String(data.børn.b.fødselsvægt) : '');
  const [fødselslængdeB, setFødselslængdeB] = useState(data.børn.b.fødselslængde ? String(data.børn.b.fødselslængde) : '');

  const [gemt, setGemt] = useState(false);

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

  const state = {
    a: { navn: navnA, setNavn: setNavnA, fødselsdag: fødselsdagA, setFødselsdag: setFødselsdagA, vægt: fødselsvægtA, setVægt: setFødselsvægtA, længde: fødselslængdeA, setLængde: setFødselslængdeA },
    b: { navn: navnB, setNavn: setNavnB, fødselsdag: fødselsdagB, setFødselsdag: setFødselsdagB, vægt: fødselsvægtB, setVægt: setFødselsvægtB, længde: fødselslængdeB, setLængde: setFødselslængdeB },
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>Tilpas appen</Text>
        <Text style={styles.titel}>Indstillinger</Text>
      </View>

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
                <TextInput
                  style={styles.input}
                  value={s.navn}
                  onChangeText={s.setNavn}
                  placeholder={data.navne[barn]}
                  placeholderTextColor={TEMA.tekstSekundær}
                  maxLength={20}
                />

                <Text style={[styles.inputLbl, { marginTop: 14 }]}>Fødselsdag</Text>
                <TextInput
                  style={styles.input}
                  value={s.fødselsdag}
                  onChangeText={s.setFødselsdag}
                  placeholder="ÅÅÅÅ-MM-DD"
                  placeholderTextColor={TEMA.tekstSekundær}
                  keyboardType="numbers-and-punctuation"
                  maxLength={10}
                />

                <View style={styles.toKolonner}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLbl, { marginTop: 14 }]}>Fødselsvægt (g)</Text>
                    <TextInput
                      style={styles.input}
                      value={s.vægt}
                      onChangeText={s.setVægt}
                      placeholder={data.børn[barn].fødselsvægt ? String(data.børn[barn].fødselsvægt) : "f.eks. 3200"}
                      placeholderTextColor={TEMA.tekstSekundær}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLbl, { marginTop: 14 }]}>Fødselslængde (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={s.længde}
                      onChangeText={s.setLængde}
                      placeholder={data.børn[barn].fødselslængde ? String(data.børn[barn].fødselslængde) : "f.eks. 51"}
                      placeholderTextColor={TEMA.tekstSekundær}
                      keyboardType="decimal-pad"
                      maxLength={5}
                    />
                  </View>
                </View>

                {/* Vis gemte værdier */}
                {(data.børn[barn].fødselsdag || data.børn[barn].fødselsvægt || data.børn[barn].fødselslængde) && (
                  <View style={styles.gemtInfo}>
                    {data.børn[barn].fødselsdag && (
                      <Text style={styles.gemtTekst}>🎂 {new Date(data.børn[barn].fødselsdag!).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                    )}
                    {data.børn[barn].fødselsvægt && (
                      <Text style={styles.gemtTekst}>⚖️ {(data.børn[barn].fødselsvægt! / 1000).toFixed(2).replace('.', ',')} kg</Text>
                    )}
                    {data.børn[barn].fødselslængde && (
                      <Text style={styles.gemtTekst}>📏 {data.børn[barn].fødselslængde} cm</Text>
                    )}
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
  gemKnap: { backgroundColor: '#8B5E3C', borderRadius: 14, padding: 14, marginHorizontal: 16, marginTop: 16, marginBottom: 40, alignItems: 'center' },
  gemKnapTekst: { color: 'white', fontSize: 15, fontWeight: '500' },
});