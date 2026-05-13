import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { FARVER } from "./store";

export default function Indstillinger() {
  const { data, ændreNavn, ændreFarve } = useApp();
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
        <Text style={styles.titel}>Indstillinger</Text>
      </View>

      <Text style={styles.sektionLabel}>Navne og farver</Text>

      {(['a', 'b'] as const).map(barn => (
        <View key={barn} style={styles.kort}>
          <View style={styles.kortHeader}>
            <View style={[styles.farvePlet, { backgroundColor: data.farver[barn] }]} />
            <Text style={styles.kortTitel}>Barn {barn.toUpperCase()}</Text>
          </View>

          <Text style={styles.inputLbl}>Navn</Text>
          <TextInput
            style={styles.input}
            value={barn === 'a' ? navnA : navnB}
            onChangeText={barn === 'a' ? setNavnA : setNavnB}
            placeholder={barn === 'a' ? 'fx Emma' : 'fx Oliver'}
            maxLength={20}
          />

          <Text style={styles.inputLbl}>Farve</Text>
          <View style={styles.farveRad}>
            {FARVER.map(f => (
              <TouchableOpacity
                key={f.hex}
                style={[
                  styles.farveCirkel,
                  { backgroundColor: f.hex },
                  data.farver[barn] === f.hex && styles.farveCirkelValgt
                ]}
                onPress={() => ændreFarve(barn, f.hex)}
              />
            ))}
          </View>

          <View style={[styles.preview, { backgroundColor: FARVER.find(f => f.hex === data.farver[barn])?.bg || '#E1F5EE' }]}>
            <Text style={[styles.previewTekst, { color: FARVER.find(f => f.hex === data.farver[barn])?.tekst || '#085041' }]}>
              {barn === 'a' ? navnA : navnB}
            </Text>
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  topbar: { backgroundColor: 'white', padding: 16, paddingTop: 60, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  titel: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  sektionLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 12, marginTop: 14, marginBottom: 6 },
  kort: { backgroundColor: 'white', borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0', marginHorizontal: 12, padding: 16, marginBottom: 10 },
  kortHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  farvePlet: { width: 14, height: 14, borderRadius: 7 },
  kortTitel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  inputLbl: { fontSize: 11, color: '#888', marginBottom: 6, marginTop: 4 },
  input: { fontSize: 16, color: '#1A1A1A', padding: 10, borderWidth: 0.5, borderColor: '#E0E0E0', borderRadius: 10, backgroundColor: '#F9F9F9', marginBottom: 12 },
  farveRad: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  farveCirkel: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  farveCirkelValgt: { borderColor: '#1A1A1A', transform: [{ scale: 1.15 }] },
  preview: { padding: 10, borderRadius: 10, alignItems: 'center' },
  previewTekst: { fontSize: 14, fontWeight: '500' },
  gemKnap: { backgroundColor: '#534AB7', borderRadius: 12, padding: 14, marginHorizontal: 12, marginTop: 4, marginBottom: 30, alignItems: 'center' },
  gemKnapTekst: { color: 'white', fontSize: 15, fontWeight: '600' },
});