import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { FARVER, TEMA } from "./store";

function SletbartLogItem({ item, farve, onSlet }: { item: any, farve: string, onSlet: () => void }) {
  const [swiped, setSwiped] = useState(false);
  return (
    <View style={{ marginBottom: 6 }}>
      {swiped && (
        <View style={styles.sletBaggrund}>
          <TouchableOpacity onPress={onSlet} style={styles.sletKnap}>
            <Text style={styles.sletTekst}>Slet</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[styles.logItem, { transform: [{ translateX: swiped ? -80 : 0 }] }]}
        onLongPress={() => setSwiped(!swiped)}
        activeOpacity={0.9}
      >
        <View style={[styles.logDot, { backgroundColor: farve }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.logTekst}>{item.tekst}</Text>
          <Text style={styles.logTid}>{item.tid}</Text>
        </View>
        {!swiped && <Text style={{ fontSize: 9, color: '#DDD' }}>hold</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default function Index() {
  const { data, aktivtBarn, setAktivtBarn, tilføjLog, startAmning, stopAmning, startLur, stopLur, sletLogItem } = useApp();
  const [tik, setTik] = useState(0);
  const [visFlaskeModal, setVisFlaskeModal] = useState(false);
  const [visBleModal, setVisBleModal] = useState(false);
  const [mlInput, setMlInput] = useState('');
  const [valgtBle, setValgtBle] = useState<'vaad' | 'beskidt' | 'begge' | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTik(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function nowStr() {
    const d = new Date();
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }

  function fmtSecs(s: number) {
    const m = Math.floor(s / 60), sec = s % 60;
    if (m >= 60) return Math.floor(m / 60) + 't ' + (m % 60) + 'm';
    if (m > 0) return m + 'm ' + sec + 's';
    return sec + 's';
  }

  function timerTekst(start: Date | null) {
    if (!start) return null;
    return fmtSecs(Math.floor((Date.now() - start.getTime()) / 1000));
  }

  function toggleAmning() {
    if (!data.børn[aktivtBarn].amningStart) startAmning(aktivtBarn);
    else stopAmning(aktivtBarn);
  }

  function toggleLur() {
    if (!data.børn[aktivtBarn].lurStart) startLur(aktivtBarn);
    else stopLur(aktivtBarn);
  }

  function gemFlaske() {
    const ml = parseInt(mlInput);
    if (!ml || ml <= 0) return;
    tilføjLog(aktivtBarn, { type: 'flaske', tekst: 'Flaske — ' + ml + ' ml', tid: nowStr(), værdi: ml });
    setMlInput('');
    setVisFlaskeModal(false);
  }

  function gemBle() {
    if (!valgtBle) return;
    const labels = { vaad: '💧 Våd', beskidt: '💩 Beskidt', begge: 'Våd + beskidt' };
    tilføjLog(aktivtBarn, { type: 'ble', tekst: 'Bleskift — ' + labels[valgtBle], tid: nowStr(), bleType: valgtBle });
    setValgtBle(null);
    setVisBleModal(false);
  }

  const navne = data.navne;
  const farver = data.farver;
  const barn = data.børn[aktivtBarn];
  const amningKører = barn.amningStart !== null;
  const lurKører = barn.lurStart !== null;
  const farveBagA = FARVER.find(f => f.hex === farver.a)?.bg || '#F5EDE5';
  const farveBagB = FARVER.find(f => f.hex === farver.b)?.bg || '#EAF0F5';

  const sidstMadA = data.børn.a.log.find(i => i.type === 'amning' || i.type === 'flaske');
  const sidstMadB = data.børn.b.log.find(i => i.type === 'amning' || i.type === 'flaske');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>{new Date().toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        <Text style={styles.titel}>Tvillingetracker</Text>
      </View>

      <View style={styles.barnVælger}>
        <TouchableOpacity
          style={[styles.barnKnap, aktivtBarn === 'a' && { backgroundColor: farveBagA, borderColor: farver.a }]}
          onPress={() => setAktivtBarn('a')}
        >
          <Text style={[styles.barnKnapNavn, { color: TEMA.tekstPrimær }]}>{navne.a}</Text>
          <Text style={styles.barnKnapTid}>{sidstMadA ? 'Ammet ' + sidstMadA.tid : 'Intet logget'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.barnKnap, aktivtBarn === 'b' && { backgroundColor: farveBagB, borderColor: farver.b }]}
          onPress={() => setAktivtBarn('b')}
        >
          <Text style={[styles.barnKnapNavn, { color: TEMA.tekstPrimær }]}>{navne.b}</Text>
          <Text style={styles.barnKnapTid}>{sidstMadB ? 'Ammet ' + sidstMadB.tid : 'Intet logget'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sektionLabel}>Registrer</Text>
      <View style={styles.aktionRække}>
        <TouchableOpacity
          style={[styles.aktionKnap, amningKører && { backgroundColor: farveBagA }]}
          onPress={toggleAmning}
        >
          <Text style={styles.aktionIkon}>🤱</Text>
          <Text style={styles.aktionLbl}>{amningKører ? timerTekst(barn.amningStart) : 'Amning'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aktionKnap} onPress={() => setVisFlaskeModal(true)}>
          <Text style={styles.aktionIkon}>🍼</Text>
          <Text style={styles.aktionLbl}>Flaske</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.aktionKnap, lurKører && { backgroundColor: '#F2EEF7' }]}
          onPress={toggleLur}
        >
          <Text style={styles.aktionIkon}>😴</Text>
          <Text style={styles.aktionLbl}>{lurKører ? timerTekst(barn.lurStart) : 'Lur'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aktionKnap} onPress={() => setVisBleModal(true)}>
          <Text style={styles.aktionIkon}>👶</Text>
          <Text style={styles.aktionLbl}>Ble</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sektionLabel}>Seneste aktivitet — {navne[aktivtBarn]}</Text>

      <View style={styles.logWrap}>
        {barn.log.length === 0 ? (
          <Text style={styles.logTom}>Ingen aktiviteter endnu</Text>
        ) : (
          barn.log.map(item => (
            <SletbartLogItem
              key={item.id}
              item={item}
              farve={item.type === 'amning' ? farver[item.barn] : item.type === 'lur' ? '#9B8BB0' : item.type === 'flaske' ? '#7B9EB8' : '#C4848A'}
              onSlet={() => sletLogItem(aktivtBarn, item.id)}
            />
          ))
        )}
      </View>

      {/* FLASKE MODAL */}
      <Modal visible={visFlaskeModal} transparent animationType="fade">
        <View style={styles.modalBag}>
          <View style={styles.modal}>
            <Text style={styles.modalTitel}>Flaske — {navne[aktivtBarn]}</Text>
            <TextInput
              style={styles.input}
              placeholder="Antal ml, fx 80"
              placeholderTextColor={TEMA.tekstSekundær}
              keyboardType="numeric"
              value={mlInput}
              onChangeText={setMlInput}
            />
            <View style={styles.modalKnapper}>
              <TouchableOpacity style={styles.modalAnnuller} onPress={() => { setVisFlaskeModal(false); setMlInput(''); }}>
                <Text style={styles.modalAnnullerTekst}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalGem} onPress={gemFlaske}>
                <Text style={styles.modalGemTekst}>Gem</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BLE MODAL */}
      <Modal visible={visBleModal} transparent animationType="fade">
        <View style={styles.modalBag}>
          <View style={styles.modal}>
            <Text style={styles.modalTitel}>Bleskift — {navne[aktivtBarn]}</Text>
            <View style={styles.bleKnapper}>
              <TouchableOpacity style={[styles.bleKnap, valgtBle === 'vaad' && styles.bleKnapAktiv]} onPress={() => setValgtBle('vaad')}>
                <Text style={styles.bleKnapTekst}>💧 Våd</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bleKnap, valgtBle === 'beskidt' && styles.bleKnapAktiv]} onPress={() => setValgtBle('beskidt')}>
                <Text style={styles.bleKnapTekst}>💩 Beskidt</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bleKnap, valgtBle === 'begge' && styles.bleKnapAktiv]} onPress={() => setValgtBle('begge')}>
                <Text style={styles.bleKnapTekst}>Begge</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalKnapper}>
              <TouchableOpacity style={styles.modalAnnuller} onPress={() => { setVisBleModal(false); setValgtBle(null); }}>
                <Text style={styles.modalAnnullerTekst}>Annuller</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalGem} onPress={gemBle}>
                <Text style={styles.modalGemTekst}>Gem</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TEMA.baggrund },
  topbar: { backgroundColor: TEMA.baggrund, padding: 16, paddingTop: 60, paddingBottom: 12 },
  eyebrow: { fontSize: 11, color: TEMA.tekstSekundær, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  titel: { fontSize: 24, fontWeight: '500', color: TEMA.tekstPrimær, letterSpacing: -0.3 },
  barnVælger: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  barnKnap: { flex: 1, padding: 14, borderRadius: 18, borderWidth: 0.5, borderColor: TEMA.border, backgroundColor: TEMA.kort },
  barnKnapNavn: { fontSize: 14, fontWeight: '500', color: TEMA.tekstPrimær },
  barnKnapTid: { fontSize: 11, color: TEMA.tekstSekundær, marginTop: 3 },
  sektionLabel: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.6, marginHorizontal: 16, marginBottom: 8 },
  aktionRække: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 20 },
  aktionKnap: { flex: 1, backgroundColor: TEMA.kort, borderRadius: 14, borderWidth: 0.5, borderColor: TEMA.border, padding: 12, alignItems: 'center' },
  aktionIkon: { fontSize: 20 },
  aktionLbl: { fontSize: 10, color: TEMA.tekstSekundær, marginTop: 5 },
  logWrap: { paddingHorizontal: 16, paddingBottom: 30 },
  logItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: TEMA.kort, borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: TEMA.border },
  logDot: { width: 6, height: 6, borderRadius: 3 },
  logTekst: { fontSize: 13, color: TEMA.tekstPrimær },
  logTid: { fontSize: 11, color: TEMA.tekstSekundær, marginTop: 2 },
  logTom: { fontSize: 13, color: TEMA.tekstSekundær, textAlign: 'center', padding: 20 },
  sletBaggrund: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, backgroundColor: '#C4848A', borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sletKnap: { width: 80, alignItems: 'center', justifyContent: 'center', height: '100%' },
  sletTekst: { color: 'white', fontWeight: '600', fontSize: 13 },
  modalBag: { flex: 1, backgroundColor: 'rgba(44,24,16,0.3)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: TEMA.kort, borderRadius: 20, padding: 20, width: 300, borderWidth: 0.5, borderColor: TEMA.border },
  modalTitel: { fontSize: 16, fontWeight: '500', color: TEMA.tekstPrimær, marginBottom: 16 },
  input: { borderWidth: 0.5, borderColor: TEMA.border, borderRadius: 12, padding: 12, fontSize: 16, color: TEMA.tekstPrimær, backgroundColor: TEMA.baggrund, marginBottom: 12 },
  modalKnapper: { flexDirection: 'row', gap: 8 },
  modalAnnuller: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 0.5, borderColor: TEMA.border, alignItems: 'center' },
  modalAnnullerTekst: { fontSize: 13, color: TEMA.tekstSekundær },
  modalGem: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: TEMA.tekstPrimær, alignItems: 'center' },
  modalGemTekst: { fontSize: 13, color: 'white', fontWeight: '500' },
  bleKnapper: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  bleKnap: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 0.5, borderColor: TEMA.border, backgroundColor: TEMA.baggrund, alignItems: 'center' },
  bleKnapAktiv: { backgroundColor: TEMA.aktiv, borderColor: TEMA.aktivBorder },
  bleKnapTekst: { fontSize: 12, color: TEMA.tekstPrimær },
});