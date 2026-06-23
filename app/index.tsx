import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { LogItem, TEMA } from "./store";

// ─── Rediger modal ─────────────────────────────────────────────────────────────

function RedigerModal({ item, onLuk, onGem }: {
  item: LogItem;
  onLuk: () => void;
  onGem: (opdateret: Partial<LogItem>) => void;
}) {
  const { data } = useApp();
  const navne = data.navne;
  const [tid, setTid] = useState(item.tid);
  const [barn, setBarn] = useState<'a' | 'b'>(item.barn);
  const [ml, setMl] = useState(item.værdi ? String(item.værdi) : '');
  const [bryst, setBryst] = useState<'venstre' | 'højre' | undefined>(item.bryst);
  const [bleType, setBleType] = useState<'vaad' | 'beskidt' | 'begge' | undefined>(item.bleType);

  // Parse eksisterende varighed fra tekst fx "Amning — 5m 30s (venstre)" -> "5m 30s"
  function parseVarighed(tekst: string): string {
    const m = tekst.match(/Amning — (.+?)(?:\s*\(|$)/);
    return m ? m[1].trim() : '';
  }
  const [varighed, setVarighed] = useState(item.type === 'amning' ? parseVarighed(item.tekst) : '');

  function gem() {
    const opdateret: Partial<LogItem> = { tid, barn };
    if (item.type === 'flaske') {
      const mlNum = parseInt(ml);
      if (mlNum > 0) {
        opdateret.værdi = mlNum;
        opdateret.tekst = 'Flaske — ' + mlNum + ' ml';
      }
    }
    if (item.type === 'amning') {
      opdateret.bryst = bryst;
      const v = varighed.trim() || parseVarighed(item.tekst);
      if (bryst) {
        opdateret.tekst = 'Amning — ' + v + ' (' + bryst + ')';
      } else {
        opdateret.tekst = 'Amning — ' + v;
      }
    }
    if (item.type === 'ble' && bleType) {
      const labels = { vaad: '💧 Våd', beskidt: '💩 Beskidt', begge: 'Våd + beskidt' };
      opdateret.bleType = bleType;
      opdateret.tekst = 'Bleskift — ' + labels[bleType];
    }
    onGem(opdateret);
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalBag}>
        <View style={styles.modal}>
          <Text style={styles.modalTitel}>Rediger {item.type === 'amning' ? '🤱' : item.type === 'flaske' ? '🍼' : item.type === 'lur' ? '😴' : '👶'}</Text>

          {/* Tidspunkt */}
          <Text style={styles.inputLbl}>Tidspunkt (HH:MM)</Text>
          <TextInput style={styles.input} value={tid} onChangeText={setTid} placeholder="HH:MM" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numbers-and-punctuation" maxLength={5} />

          {/* Flyt til anden tvilling */}
          <Text style={[styles.inputLbl, { marginTop: 8 }]}>Barn</Text>
          <View style={styles.bleKnapper}>
            <TouchableOpacity style={[styles.bleKnap, barn === 'a' && styles.bleKnapAktiv]} onPress={() => setBarn('a')}>
              <Text style={styles.bleKnapTekst}>{navne.a}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.bleKnap, barn === 'b' && styles.bleKnapAktiv]} onPress={() => setBarn('b')}>
              <Text style={styles.bleKnapTekst}>{navne.b}</Text>
            </TouchableOpacity>
          </View>

          {/* Flaske ml */}
          {item.type === 'flaske' && (
            <>
              <Text style={[styles.inputLbl, { marginTop: 8 }]}>Ml</Text>
              <TextInput style={styles.input} value={ml} onChangeText={setMl} placeholder="Antal ml" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numeric" maxLength={4} />
            </>
          )}

          {/* Amning varighed og bryst */}
          {item.type === 'amning' && (
            <>
              <Text style={[styles.inputLbl, { marginTop: 8 }]}>Varighed (fx 5m 30s)</Text>
              <TextInput style={styles.input} value={varighed} onChangeText={setVarighed} placeholder="fx 10m 0s" placeholderTextColor={TEMA.tekstSekundær} maxLength={15} />
              <Text style={[styles.inputLbl, { marginTop: 8 }]}>Bryst</Text>
              <View style={styles.bleKnapper}>
                <TouchableOpacity style={[styles.bleKnap, bryst === 'venstre' && styles.bleKnapAktiv]} onPress={() => setBryst('venstre')}>
                  <Text style={styles.bleKnapTekst}>◀ Venstre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bleKnap, bryst === 'højre' && styles.bleKnapAktiv]} onPress={() => setBryst('højre')}>
                  <Text style={styles.bleKnapTekst}>Højre ▶</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Ble type */}
          {item.type === 'ble' && (
            <>
              <Text style={[styles.inputLbl, { marginTop: 8 }]}>Type</Text>
              <View style={styles.bleKnapper}>
                <TouchableOpacity style={[styles.bleKnap, bleType === 'vaad' && styles.bleKnapAktiv]} onPress={() => setBleType('vaad')}>
                  <Text style={styles.bleKnapTekst}>💧 Våd</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bleKnap, bleType === 'beskidt' && styles.bleKnapAktiv]} onPress={() => setBleType('beskidt')}>
                  <Text style={styles.bleKnapTekst}>💩 Beskidt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bleKnap, bleType === 'begge' && styles.bleKnapAktiv]} onPress={() => setBleType('begge')}>
                  <Text style={styles.bleKnapTekst}>Begge</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={[styles.modalKnapper, { marginTop: 16 }]}>
            <TouchableOpacity style={styles.modalAnnuller} onPress={onLuk}>
              <Text style={styles.modalAnnullerTekst}>Annuller</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalGem} onPress={gem}>
              <Text style={styles.modalGemTekst}>Gem</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Log item med swipe ────────────────────────────────────────────────────────

function LogItemKort({ item, farve, onSlet, onRediger }: {
  item: LogItem; farve: string; onSlet: () => void; onRediger: () => void;
}) {
  const [swiped, setSwiped] = useState(false);

  return (
    <View style={{ marginBottom: 6 }}>
      {swiped && (
        <View style={styles.handlingerBaggrund}>
          <TouchableOpacity onPress={onRediger} style={styles.redigerKnap}>
            <Text style={styles.redigerTekst}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSlet} style={styles.sletKnap}>
            <Text style={styles.sletTekst}>Slet</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[styles.logItem, { transform: [{ translateX: swiped ? -120 : 0 }] }]}
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

// ─── Hoved-komponent ───────────────────────────────────────────────────────────

export default function Index() {
  const { data, aktivtBarn, setAktivtBarn, tilføjLog, redigerLogItem, startAmning, stopAmning, startLur, stopLur, sletLogItem } = useApp();
  const [tik, setTik] = useState(0);
  const [visFlaskeModal, setVisFlaskeModal] = useState(false);
  const [visBleModal, setVisBleModal] = useState(false);
  const [mlInput, setMlInput] = useState('');
  const [valgtBle, setValgtBle] = useState<'vaad' | 'beskidt' | 'begge' | null>(null);
  const [visAmningModal, setVisAmningModal] = useState(false);
  const [valgtBryst, setValgtBryst] = useState<'højre' | 'venstre' | null>(null);
  const [dDråbeGivet, setDDråbeGivet] = useState<{ a: boolean; b: boolean }>({ a: false, b: false });
  const [medicinGivet, setMedicinGivet] = useState<Record<string, boolean[]>>({});
  const [redigerItem, setRedigerItem] = useState<LogItem | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTik(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  function toggleMedicin(medicinId: string, dosisnr: number) {
    setMedicinGivet(prev => {
      const nuværende = prev[medicinId + '_' + aktivtBarn] ?? [];
      const ny = [...nuværende];
      ny[dosisnr] = !ny[dosisnr];
      return { ...prev, [medicinId + '_' + aktivtBarn]: ny };
    });
  }

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
    if (!data.børn[aktivtBarn].amningStart) setVisAmningModal(true);
    else stopAmning(aktivtBarn);
  }

  function startAmningMedBryst(bryst: 'højre' | 'venstre') {
    setValgtBryst(bryst);
    setVisAmningModal(false);
    startAmning(aktivtBarn, bryst);
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

  function gemRedigering(opdateret: Partial<LogItem>) {
    if (!redigerItem) return;
    redigerLogItem(redigerItem.barn, redigerItem.id, opdateret);
    setRedigerItem(null);
  }

  const navne = data.navne;
  const farver = data.farver;
  const barn = data.børn[aktivtBarn];
  const amningKører = barn.amningStart !== null;
  const lurKører = barn.lurStart !== null;

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
          style={[styles.barnKnap, aktivtBarn === 'a' && { backgroundColor: '#2C1810', borderColor: '#2C1810' }]}
          onPress={() => setAktivtBarn('a')}
        >
          <Text style={[styles.barnKnapNavn, { color: aktivtBarn === 'a' ? 'white' : TEMA.tekstPrimær }]}>{navne.a}</Text>
          <Text style={styles.barnKnapTid}>
            {sidstMadA
              ? sidstMadA.type === 'amning'
                ? 'Ammet ' + sidstMadA.tid + (sidstMadA.tekst.includes('venstre') ? ' · V' : sidstMadA.tekst.includes('højre') ? ' · H' : '')
                : 'Flaske ' + sidstMadA.tid
              : 'Intet logget'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.barnKnap, aktivtBarn === 'b' && { backgroundColor: '#EDE5DC', borderColor: '#EDE5DC' }]}
          onPress={() => setAktivtBarn('b')}
        >
          <Text style={[styles.barnKnapNavn, { color: aktivtBarn === 'b' ? '#2C1810' : TEMA.tekstPrimær }]}>{navne.b}</Text>
          <Text style={styles.barnKnapTid}>
            {sidstMadB
              ? sidstMadB.type === 'amning'
                ? 'Ammet ' + sidstMadB.tid + (sidstMadB.tekst.includes('venstre') ? ' · V' : sidstMadB.tekst.includes('højre') ? ' · H' : '')
                : 'Flaske ' + sidstMadB.tid
              : 'Intet logget'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dDråbeWrap}>
        <TouchableOpacity
          style={styles.dDråbeRad}
          onPress={() => setDDråbeGivet(prev => ({ ...prev, [aktivtBarn]: !prev[aktivtBarn] }))}
        >
          <View style={[styles.dDråbeCheckbox, dDråbeGivet[aktivtBarn] && styles.dDråbeCheckboxAktiv]}>
            {dDråbeGivet[aktivtBarn] && <Text style={styles.dDråbeTjek}>✓</Text>}
          </View>
          <View style={styles.dDråbeTekstWrap}>
            <Text style={styles.dDråbeTitel}>D-dråber — {navne[aktivtBarn]}</Text>
            <Text style={styles.dDråbeSub}>{dDråbeGivet[aktivtBarn] ? 'Givet i dag ✓' : 'Ikke givet endnu'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* MEDICIN TJEKBOKSE */}
      {(data.medicin ?? []).filter(m => (m.børn ?? ['a', 'b']).includes(aktivtBarn)).map(m => {
        const bokse = Array.from({ length: m.gangeOmDagen }, (_, i) => i);
        const givet = medicinGivet[m.id + '_' + aktivtBarn] ?? [];
        return (
          <View key={m.id} style={styles.dDråbeWrap}>
            <View style={styles.dDråbeRad}>
              <View style={styles.dDråbeTekstWrap}>
                <Text style={styles.dDråbeTitel}>💊 {m.navn} — {navne[aktivtBarn]}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {bokse.map(i => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.dDråbeCheckbox, givet[i] && styles.dDråbeCheckboxAktiv]}
                      onPress={() => toggleMedicin(m.id, i)}
                    >
                      {givet[i] && <Text style={styles.dDråbeTjek}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                  <Text style={[styles.dDråbeSub, { alignSelf: 'center' }]}>
                    {givet.filter(Boolean).length}/{m.gangeOmDagen} givet
                  </Text>
                </View>
              </View>
            </View>
          </View>
        );
      })}

      <Text style={styles.sektionLabel}>Registrer</Text>
      <View style={styles.aktionRække}>
        <TouchableOpacity style={[styles.aktionKnap, amningKører && { backgroundColor: '#2C1810' }]} onPress={toggleAmning}>
          <Text style={styles.aktionIkon}>🤱</Text>
          <Text style={styles.aktionLbl}>{amningKører ? timerTekst(barn.amningStart) : 'Amning'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aktionKnap} onPress={() => setVisFlaskeModal(true)}>
          <Text style={styles.aktionIkon}>🍼</Text>
          <Text style={styles.aktionLbl}>Flaske</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.aktionKnap, lurKører && { backgroundColor: '#F2EEF7' }]} onPress={toggleLur}>
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
            <LogItemKort
              key={item.id}
              item={item}
              farve={item.type === 'amning' ? farver[item.barn] : item.type === 'lur' ? '#9B8BB0' : item.type === 'flaske' ? '#7B9EB8' : '#C4848A'}
              onSlet={() => sletLogItem(aktivtBarn, item.id)}
              onRediger={() => setRedigerItem(item)}
            />
          ))
        )}
      </View>

      {/* REDIGER MODAL */}
      {redigerItem && (
        <RedigerModal
          item={redigerItem}
          onLuk={() => setRedigerItem(null)}
          onGem={gemRedigering}
        />
      )}

      {/* AMNING MODAL */}
      <Modal visible={visAmningModal} transparent animationType="fade">
        <View style={styles.modalBag}>
          <View style={styles.modal}>
            <Text style={styles.modalTitel}>Amning — {navne[aktivtBarn]}</Text>
            <Text style={[styles.modalTitel, { fontSize: 13, fontWeight: '400', color: TEMA.tekstSekundær, marginBottom: 16 }]}>Hvilket bryst?</Text>
            <View style={styles.bleKnapper}>
              <TouchableOpacity style={[styles.bleKnap, valgtBryst === 'venstre' && styles.bleKnapAktiv]} onPress={() => startAmningMedBryst('venstre')}>
                <Text style={styles.bleKnapTekst}>◀ Venstre</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bleKnap, valgtBryst === 'højre' && styles.bleKnapAktiv]} onPress={() => startAmningMedBryst('højre')}>
                <Text style={styles.bleKnapTekst}>Højre ▶</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalKnapper}>
              <TouchableOpacity style={styles.modalAnnuller} onPress={() => setVisAmningModal(false)}>
                <Text style={styles.modalAnnullerTekst}>Annuller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FLASKE MODAL */}
      <Modal visible={visFlaskeModal} transparent animationType="fade">
        <View style={styles.modalBag}>
          <View style={styles.modal}>
            <Text style={styles.modalTitel}>Flaske — {navne[aktivtBarn]}</Text>
            <TextInput style={styles.input} placeholder="Antal ml, fx 80" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numeric" value={mlInput} onChangeText={setMlInput} />
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
  handlingerBaggrund: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 120, flexDirection: 'row', borderRadius: 14, overflow: 'hidden' },
  redigerKnap: { width: 50, backgroundColor: '#7B9EB8', alignItems: 'center', justifyContent: 'center' },
  redigerTekst: { fontSize: 18 },
  sletKnap: { width: 70, backgroundColor: '#C4848A', alignItems: 'center', justifyContent: 'center' },
  sletTekst: { color: 'white', fontWeight: '600', fontSize: 13 },
  modalBag: { flex: 1, backgroundColor: 'rgba(44,24,16,0.3)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: TEMA.kort, borderRadius: 20, padding: 20, width: 300, borderWidth: 0.5, borderColor: TEMA.border },
  modalTitel: { fontSize: 16, fontWeight: '500', color: TEMA.tekstPrimær, marginBottom: 16 },
  inputLbl: { fontSize: 10, color: TEMA.tekstSekundær, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
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
  dDråbeWrap: { marginHorizontal: 16, marginBottom: 30 },
  dDråbeRad: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: TEMA.kort, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: TEMA.border },
  dDråbeCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: TEMA.border, alignItems: 'center', justifyContent: 'center' },
  dDråbeCheckboxAktiv: { backgroundColor: '#6B8F71', borderColor: '#6B8F71' },
  dDråbeTjek: { color: 'white', fontSize: 14, fontWeight: '600' },
  dDråbeTekstWrap: { flex: 1 },
  dDråbeTitel: { fontSize: 13, fontWeight: '500', color: TEMA.tekstPrimær },
  dDråbeSub: { fontSize: 11, color: TEMA.tekstSekundær, marginTop: 2 },
});