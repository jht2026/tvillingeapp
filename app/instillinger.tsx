import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

export default function Indstillinger() {
  const { data, ændreNavn } = useApp();
  const [navnA, setNavnA] = useState('');
  const [navnB, setNavnB] = useState('');
  const [gemt, setGemt] = useState(false);

  function gem() {
    if (navnA.trim()) ændreNavn('a', navnA.trim());
    if (navnB.trim()) ændreNavn('b', navnB.trim());
    setNavnA('');
    setNavnB('');
    setGemt(true);
    setTimeout(() => setGemt(false), 2000);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>Tilpas appen</Text>
        <Text style={styles.titel}>Indstillinger</Text>
      </View>

      {(['a', 'b'] as const).map(barn => (
        <View key={barn}>
          <Text style={styles.sektionLabel}>{barn === 'a' ? data.navne.a : data.navne.b}</Text>
          <View style={styles.kort}>
            <View style={[styles.kortHeader, { backgroundColor: barn === 'a' ? '#2C1810' : '#EDE5DC' }]}>
              <Text style={[styles.kortHeaderTekst, { color: barn === 'a' ? 'white' : '#2C1810' }]}>
                {barn === 'a' ? data.navne.a : data.navne.b}
              </Text>
            </View>
            <View style={styles.kortBody}>
              <Text style={styles.inputLbl}>Navn</Text>
              <TextInput
                style={styles.input}
                value={barn === 'a' ? navnA : navnB}
                onChangeText={barn === 'a' ? setNavnA : setNavnB}
                placeholder={barn === 'a' ? data.navne.a : data.navne.b}
                placeholderTextColor={TEMA.tekstSekundær}
                maxLength={20}
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.gemKnap} onPress={gem}>
        <Text style={styles.gemKnapTekst}>{gemt ? '✓ Gemt!' : 'Gem navne'}</Text>
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
  gemKnap: { backgroundColor: '#8B5E3C', borderRadius: 14, padding: 14, marginHorizontal: 16, marginTop: 16, marginBottom: 40, alignItems: 'center' },
  gemKnapTekst: { color: 'white', fontSize: 15, fontWeight: '500' },
});