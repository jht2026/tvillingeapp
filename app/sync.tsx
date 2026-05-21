import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

const GEMINI_API_KEY = "AIzaSyA5Rp5wythuu6yJqIv4EiJ0f8cvge7MFH4";

export default function Sync() {
  const { data } = useApp();
  const navne = data.navne;
  const [forslag, setForslag] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fejl, setFejl] = useState('');

  function getStatus(barn: 'a' | 'b') {
    const log = data.børn[barn].log;
    const sidstMad = log.find(i => i.type === 'amning' || i.type === 'flaske');
    const soversNu = data.børn[barn].lurStart !== null;
    const lurAntal = log.filter(i => i.type === 'lur').length;
    const amninger = log.filter(i => i.type === 'amning').length;
    const flasker = log.filter(i => i.type === 'flaske');
    const flaskeTotal = flasker.reduce((s, i) => s + (i.værdi || 0), 0);
    return { sidstMad, soversNu, lurAntal, amninger, flaskeTotal };
  }

  function fmtTid() {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  async function hentForslag() {
    setLoading(true);
    setFejl('');
    setForslag([]);

    const statusA = getStatus('a');
    const statusB = getStatus('b');

    const prompt = `Du er en hjælpsom assistent for forældre til nyfødte tvillinger. 
    
Nuværende tidspunkt: ${fmtTid()}

${navne.a}:
- Sidst ammet/flaske: ${statusA.sidstMad ? statusA.sidstMad.tid + ' (' + statusA.sidstMad.tekst + ')' : 'Ikke logget endnu'}
- Sover nu: ${statusA.soversNu ? 'Ja' : 'Nej'}
- Lure i dag: ${statusA.lurAntal}
- Amninger i dag: ${statusA.amninger}
- Flaske i dag: ${statusA.flaskeTotal} ml

${navne.b}:
- Sidst ammet/flaske: ${statusB.sidstMad ? statusB.sidstMad.tid + ' (' + statusB.sidstMad.tekst + ')' : 'Ikke logget endnu'}
- Sover nu: ${statusB.soversNu ? 'Ja' : 'Nej'}
- Lure i dag: ${statusB.lurAntal}
- Amninger i dag: ${statusB.amninger}
- Flaske i dag: ${statusB.flaskeTotal} ml

Giv 3 konkrete og praktiske forslag til hvordan forældrene kan synkronisere tvillingernes rutiner lige nu og i løbet af dagen. 
Skriv hvert forslag som en kort, handlingsorienteret sætning på dansk. 
Returner kun de 3 forslag som en JSON array med strings, fx: ["Forslag 1", "Forslag 2", "Forslag 3"]
Ingen anden tekst, kun JSON arrayet.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );
      const json = await response.json();
      console.log('Gemini svar:', JSON.stringify(json));
      const tekst = json.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      const renset = tekst.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(renset);
      setForslag(parsed);
    } catch (e) {
      setFejl('Kunne ikke hente forslag. Prøv igen.');
    }
    setLoading(false);
  }

  const statusA = getStatus('a');
  const statusB = getStatus('b');

  const ikoner = ['⏰', '🍼', '😴'];
  const tags = ['Gør det nu', 'Om lidt', 'Plan for i dag'];
  const tagFarver = [
    { bg: '#F5EDE5', tekst: '#8B5E3C' },
    { bg: '#EDF4EE', tekst: '#2E5733' },
    { bg: '#EAF0F5', tekst: '#2C4A5E' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>AI-drevet</Text>
        <Text style={styles.titel}>Synkronisering</Text>
      </View>

      <Text style={styles.sektionLabel}>Status lige nu</Text>
      <View style={styles.statusRad}>
        {(['a', 'b'] as const).map(barn => {
          const s = barn === 'a' ? statusA : statusB;
          return (
            <View key={barn} style={styles.statusKort}>
              <View style={[styles.statusHeader, { backgroundColor: barn === 'a' ? '#2C1810' : '#EDE5DC' }]}>
                <Text style={[styles.statusHeaderTekst, { color: barn === 'a' ? 'white' : '#2C1810' }]}>{navne[barn]}</Text>
              </View>
              <View style={styles.statusBody}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLbl}>Sidst ammet</Text>
                  <Text style={styles.statusVal}>{s.sidstMad ? s.sidstMad.tid : '—'}</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLbl}>Sover</Text>
                  <Text style={styles.statusVal}>{s.soversNu ? 'Ja' : 'Nej'}</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLbl}>Lure i dag</Text>
                  <Text style={styles.statusVal}>{s.lurAntal}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={styles.aiKnap} onPress={hentForslag} disabled={loading}>
        <Text style={styles.aiKnapIkon}>✨</Text>
        <View style={styles.aiKnapTekst}>
          <Text style={styles.aiKnapTitel}>Få synkroniseringsforslag</Text>
          <Text style={styles.aiKnapSub}>AI analyserer jeres log</Text>
        </View>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.aiKnapPil}>→</Text>}
      </TouchableOpacity>

      {fejl !== '' && (
        <Text style={styles.fejl}>{fejl}</Text>
      )}

      {forslag.length > 0 && (
        <>
          <Text style={styles.sektionLabel}>AI forslag</Text>
          {forslag.map((f, i) => (
            <View key={i} style={styles.forslagKort}>
              <View style={styles.forslagHeader}>
                <Text style={styles.forslagIkon}>{ikoner[i] || '💡'}</Text>
                <Text style={styles.forslagTitel}>{tags[i] || 'Forslag'}</Text>
              </View>
              <Text style={styles.forslagTekst}>{f}</Text>
              <View style={[styles.forslagTag, { backgroundColor: tagFarver[i]?.bg || '#F5EDE5' }]}>
                <Text style={[styles.forslagTagTekst, { color: tagFarver[i]?.tekst || '#8B5E3C' }]}>{tags[i] || 'Forslag'}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {!loading && forslag.length === 0 && fejl === '' && (
        <View style={styles.tom}>
          <Text style={styles.tomIkon}>✨</Text>
          <Text style={styles.tomTekst}>Tryk på knappen for at få{'\n'}personlige synkroniseringsforslag</Text>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TEMA.baggrund },
  topbar: { backgroundColor: TEMA.baggrund, padding: 16, paddingTop: 60, paddingBottom: 12 },
  eyebrow: { fontSize: 11, color: TEMA.tekstSekundær, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  titel: { fontSize: 24, fontWeight: '500', color: TEMA.tekstPrimær, letterSpacing: -0.3 },
  sektionLabel: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.6, marginHorizontal: 16, marginTop: 14, marginBottom: 8 },
  statusRad: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  statusKort: { flex: 1, backgroundColor: TEMA.kort, borderRadius: 16, borderWidth: 0.5, borderColor: TEMA.border, overflow: 'hidden' },
  statusHeader: { padding: 10, alignItems: 'center' },
  statusHeaderTekst: { fontSize: 12, fontWeight: '500' },
  statusBody: { padding: 10 },
  statusItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: TEMA.borderLight },
  statusLbl: { fontSize: 10, color: TEMA.tekstSekundær },
  statusVal: { fontSize: 11, fontWeight: '500', color: TEMA.tekstPrimær },
  aiKnap: { marginHorizontal: 16, backgroundColor: TEMA.tekstPrimær, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  aiKnapIkon: { fontSize: 22 },
  aiKnapTekst: { flex: 1 },
  aiKnapTitel: { fontSize: 14, fontWeight: '500', color: 'white' },
  aiKnapSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  aiKnapPil: { fontSize: 16, color: 'rgba(255,255,255,0.5)' },
  forslagKort: { marginHorizontal: 16, backgroundColor: TEMA.kort, borderRadius: 16, borderWidth: 0.5, borderColor: TEMA.border, padding: 16, marginBottom: 10 },
  forslagHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  forslagIkon: { fontSize: 18 },
  forslagTitel: { fontSize: 13, fontWeight: '500', color: TEMA.tekstPrimær },
  forslagTekst: { fontSize: 13, color: TEMA.tekstPrimær, lineHeight: 20 },
  forslagTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  forslagTagTekst: { fontSize: 10, fontWeight: '500' },
  fejl: { marginHorizontal: 16, fontSize: 13, color: '#C4848A', textAlign: 'center', marginTop: 8 },
  tom: { marginHorizontal: 16, marginTop: 40, alignItems: 'center' },
  tomIkon: { fontSize: 36, marginBottom: 12 },
  tomTekst: { fontSize: 13, color: TEMA.tekstSekundær, textAlign: 'center', lineHeight: 20 },
});