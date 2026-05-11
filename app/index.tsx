import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { FARVER } from "./store";

export default function Index() {
  const { data, aktivtBarn, setAktivtBarn, tilføjLog, startAmning, stopAmning, startLur, stopLur } = useApp();
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
  const farveBagA = FARVER.find(f => f.hex === farver.a)?.bg || '#E1F5EE';
  const farveBagB = FARVER.find(f => f.hex === farver.b)?.bg || '#E6F1FB';

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.titel}>Tvillingetracker</Text>
      </View>

      <View style={styles.barnVælger}>
        <TouchableOpacity
          style={[styles.barnKnap, aktivtBarn === 'a' && { backgroundColor: farveBagA, borderColor: farver.a }]}
          onPress={() => setAktivtBarn('a')}
        >
          <Text style={styles.barnKnapTekst}>{navne.a}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.barnKnap, aktivtBarn === 'b' && { backgroundColor: farveBagB, borderColor: farver.b }]}
          onPress={() => setAktivtBarn('b')}
        >
          <Text style={styles.barnKnapTekst}>{navne.b}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sektionLabel}>Registrer</Text>

      <View style={styles.knapGrid}>
        <TouchableOpacity
          style={[styles.kort, { borderLeftColor: farver.a }, amningKører && { backgroundColor: farveBagA }]}
          onPress={toggleAmning}
        >
          <Text style={styles.kortIkon}>🤱</Text>
          <Text style={styles.kortTitel}>{amningKører ? 'Stop amning' : 'Start amning'}</Text>
          <Text style={styles.kortSub}>{amningKører ? timerTekst(barn.amningStart) : 'Tryk for at starte'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kort, styles.kortFlaske]}
          onPress={() => setVisFlaskeModal(true)}
        >
          <Text style={styles.kortIkon}>🍼</Text>
          <Text style={styles.kortTitel}>Flaske</Text>
          <Text style={styles.kortSub}>Tryk for at logge ml</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kort, styles.kortLur, lurKører && styles.kortLurAktiv]}
          onPress={toggleLur}
        >
          <Text style={styles.kortIkon}>😴</Text>
          <Text style={styles.kortTitel}>{lurKører ? 'Stop lur' : 'Start lur'}</Text>
          <Text style={styles.kortSub}>{lurKører ? timerTekst(barn.lurStart) : 'Tryk for at starte'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kort, styles.kortBle]}
          onPress={() => setVisBleModal(true)}
        >
          <Text style={styles.kortIkon}>👶</Text>
          <Text style={styles.kortTitel}>Bleskift</Text>
          <Text style={styles.kortSub}>Våd / beskidt</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sektionLabel}>Seneste aktivitet — {navne[aktivtBarn]}</Text>

      {barn.log.length === 0 ? (
        <View style={styles.logItem}>
          <Text style={styles.logTom}>Ingen aktiviteter endnu</Text>
        </View>
      ) : (
        barn.log.map(item => (
          <View key={item.id} style={styles.logItem}>
            <View style={[styles.logDot, {
              backgroundColor:
                item.type === 'amning' ? farver[item.barn] :
                item.type === 'lur' ? '#7F77DD' :
                item.type === 'flaske' ? '#378ADD' :
                '#D85A30'
            }]} />
            <View>
              <Text style={styles.logTekst}>{item.tekst}</Text>
              <Text style={styles.logTid}>{item.tid}</Text>
            </View>
          </View>
        ))
      )}

      {/* FLASKE MODAL */}
      <Modal visible={visFlaskeModal} transparent animationType="fade">
        <View style={styles.modalBag}>
          <View style={styles.modal}>
            <Text style={styles.modalTitel}>Flaske — {navne[aktivtBarn]}</Text>
            <TextInput
              style={styles.input}
              placeholder="Antal ml, fx 80"
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
              <TouchableOpacity
                style={[styles.bleKnap, valgtBle === 'vaad' && styles.bleKnapAktiv]}
                onPress={() => setValgtBle('vaad')}
              >
                <Text style={styles.bleKnapTekst}>💧 Våd</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bleKnap, valgtBle === 'beskidt' && styles.bleKnapAktiv]}
                onPress={() => setValgtBle('beskidt')}
              >
                <Text style={styles.bleKnapTekst}>💩 Beskidt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bleKnap, valgtBle === 'begge' && styles.bleKnapAktiv]}
                onPress={() => setValgtBle('begge')}
              >
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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  topbar: { backgroundColor: 'white', padding: 16, paddingTop: 60, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  titel: { fontSize: 20, fontWeight: '600', color: '#1A1A1A' },
  barnVælger: { flexDirection: 'row', gap: 8, padding: 12 },
  barnKnap: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0', backgroundColor: 'white', alignItems: 'center' },
  barnKnapTekst: { fontSize: 13, fontWeight: '500' },
  sektionLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 12, marginTop: 8, marginBottom: 6 },
  knapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 12 },
  kort: { width: '47%', backgroundColor: 'white', borderRadius: 12, borderWidth: 0.5, borderColor: '#E0E0E0', padding: 14, borderLeftWidth: 3 },
  kortFlaske: { borderLeftColor: '#378ADD' },
  kortLur: { borderLeftColor: '#7F77DD' },
  kortBle: { borderLeftColor: '#D85A30' },
  kortLurAktiv: { backgroundColor: '#EEEDFE', borderColor: '#AFA9EC' },
  kortIkon: { fontSize: 22, marginBottom: 6 },
  kortTitel: { fontSize: 13, fontWeight: '500', color: '#1A1A1A', marginBottom: 2 },
  kortSub: { fontSize: 11, color: '#888' },
  logItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, marginBottom: 8, backgroundColor: 'white', borderRadius: 10, padding: 12, borderWidth: 0.5, borderColor: '#E0E0E0' },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logTekst: { fontSize: 13, color: '#1A1A1A' },
  logTid: { fontSize: 11, color: '#888', marginTop: 2 },
  logTom: { fontSize: 13, color: '#888', textAlign: 'center', padding: 8 },
  modalBag: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: 'white', borderRadius: 16, padding: 20, width: 300 },
  modalTitel: { fontSize: 16, fontWeight: '500', color: '#1A1A1A', marginBottom: 16 },
  input: { borderWidth: 0.5, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 12 },
  modalKnapper: { flexDirection: 'row', gap: 8 },
  modalAnnuller: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: '#E0E0E0', alignItems: 'center' },
  modalAnnullerTekst: { fontSize: 13, color: '#1A1A1A' },
  modalGem: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#534AB7', alignItems: 'center' },
  modalGemTekst: { fontSize: 13, color: 'white', fontWeight: '500' },
  bleKnapper: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  bleKnap: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 0.5, borderColor: '#E0E0E0', backgroundColor: '#F5F5F5', alignItems: 'center' },
  bleKnapAktiv: { backgroundColor: '#EEEDFE', borderColor: '#AFA9EC' },
  bleKnapTekst: { fontSize: 12 },
});