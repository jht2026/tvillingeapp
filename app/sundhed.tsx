import { useState } from "react";
import { Alert, Dimensions, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useApp } from "./context";
import { TEMA } from "./store";

const SCREEN_W = Dimensions.get('window').width - 64;

// ─── Linjegraf ─────────────────────────────────────────────────────────────────

function Linjegraf({ punkter, farve, min, max, width, height }: {
  punkter: { x: number; y: number }[];
  farve: string; min: number; max: number; width: number; height: number;
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
          <View key={i} style={{ position: 'absolute', left: x1, top: y1, width: len, height: 2, backgroundColor: farve, transform: [{ rotate: angle + 'deg' }], transformOrigin: '0 50%' } as any} />
        );
      })}
      {punkter.map((p, i) => (
        <View key={'d' + i} style={{ position: 'absolute', left: toX(i) - 5, top: toY(p.y) - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: farve }} />
      ))}
    </>
  );
}

// ─── Graf komponent ────────────────────────────────────────────────────────────

function SundhedsGraf({ barn }: { barn: 'a' | 'b' }) {
  const { data } = useApp();
  const [visType, setVisType] = useState<'vægt' | 'længde' | 'temperatur'>('vægt');
  const log = [...(data.børn[barn].sundhedslog ?? [])].sort((a, b) => {
    const da = a.dato + 'T' + a.tidspunkt;
    const db = b.dato + 'T' + b.tidspunkt;
    return da.localeCompare(db);
  });

  const barnData = data.børn[barn];
  const fødselsPoint = barnData.fødselsdag ? {
    dato: barnData.fødselsdag,
    tidspunkt: '00:00',
    vægt: barnData.fødselsvægt,
    længde: barnData.fødselslængde,
    temperatur: undefined as number | undefined,
    label: 'Fødsel',
  } : null;

  const allePunkter = [
    ...(fødselsPoint ? [fødselsPoint] : []),
    ...log.map(l => ({ ...l, label: l.dato.slice(5).replace('-', '/') + ' ' + l.tidspunkt })),
  ].filter(p => p[visType] != null);

  const farveMap = { vægt: '#8B5E3C', længde: '#6B8F71', temperatur: '#C4848A' };
  const farve = farveMap[visType];
  const H = 90, W = SCREEN_W - 32;

  if (allePunkter.length < 2) return (
    <View style={styles.grafTom}>
      <Text style={styles.grafTomTekst}>Tilføj mindst 2 målinger med {visType} for at se kurve</Text>
    </View>
  );

  const værdier = allePunkter.map(p => p[visType] as number);
  const min = Math.min(...værdier);
  const max = Math.max(...værdier);
  const punkter = allePunkter.map((_, i) => ({ x: i, y: allePunkter[i][visType] as number }));

  return (
    <View style={styles.grafWrapper}>
      <View style={styles.grafToggle}>
        {(['vægt', 'længde', 'temperatur'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.toggleKnap, visType === t && { backgroundColor: farveMap[t], borderColor: farveMap[t] }]} onPress={() => setVisType(t)}>
            <Text style={[styles.toggleTekst, visType === t && styles.toggleTekstAktiv]}>
              {t === 'vægt' ? '⚖️' : t === 'længde' ? '📏' : '🌡️'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ height: H + 30, position: 'relative', marginTop: 8 }}>
        <Text style={[styles.grafYLabel, { top: 0 }]}>
          {visType === 'vægt' ? (max / 1000).toFixed(1) + 'kg' : visType === 'længde' ? max + 'cm' : max.toFixed(1) + '°'}
        </Text>
        <Text style={[styles.grafYLabel, { bottom: 22 }]}>
          {visType === 'vægt' ? (min / 1000).toFixed(1) + 'kg' : visType === 'længde' ? min + 'cm' : min.toFixed(1) + '°'}
        </Text>
        <View style={{ position: 'absolute', left: 36, right: 0, top: 8, height: H }}>
          <Linjegraf punkter={punkter} farve={farve} min={min} max={max} width={W - 36} height={H} />
        </View>
        <View style={{ position: 'absolute', left: 36, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
          {allePunkter.map((p, i) => <Text key={i} style={styles.grafXLabel}>{p.label}</Text>)}
        </View>
      </View>
    </View>
  );
}

// ─── Ny måling form ────────────────────────────────────────────────────────────

function NyMålingForm({ barn, onGem }: { barn: 'a' | 'b'; onGem: () => void }) {
  const { tilføjSundhedslog } = useApp();
  const nu = new Date();
  const [dato, setDato] = useState(nu.toISOString().slice(0, 10));
  const [tidspunkt, setTidspunkt] = useState(nu.getHours().toString().padStart(2, '0') + ':' + nu.getMinutes().toString().padStart(2, '0'));
  const [vægt, setVægt] = useState('');
  const [længde, setLængde] = useState('');
  const [temperatur, setTemperatur] = useState('');

  function gem() {
    if (!dato || !tidspunkt) return;
    if (!vægt && !længde && !temperatur) return;
    tilføjSundhedslog(barn, {
      dato,
      tidspunkt,
      vægt: vægt ? parseInt(vægt) : undefined,
      længde: længde ? parseFloat(længde) : undefined,
      temperatur: temperatur ? parseFloat(temperatur.replace(',', '.')) : undefined,
    });
    setVægt(''); setLængde(''); setTemperatur('');
    onGem();
  }

  return (
    <View style={styles.formWrapper}>
      <Text style={styles.formTitel}>Ny måling</Text>
      <View style={styles.toKolonner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLbl}>Dato</Text>
          <TextInput style={styles.input} value={dato} onChangeText={setDato} placeholder="ÅÅÅÅ-MM-DD" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numbers-and-punctuation" maxLength={10} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.inputLbl}>Tidspunkt</Text>
          <TextInput style={styles.input} value={tidspunkt} onChangeText={setTidspunkt} placeholder="HH:MM" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numbers-and-punctuation" maxLength={5} />
        </View>
      </View>

      <View style={styles.toKolonner}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLbl, { marginTop: 10 }]}>⚖️ Vægt (g)</Text>
          <TextInput style={styles.input} value={vægt} onChangeText={setVægt} placeholder="f.eks. 3335" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numeric" maxLength={5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLbl, { marginTop: 10 }]}>📏 Længde (cm)</Text>
          <TextInput style={styles.input} value={længde} onChangeText={setLængde} placeholder="f.eks. 51" placeholderTextColor={TEMA.tekstSekundær} keyboardType="decimal-pad" maxLength={5} />
        </View>
      </View>

      <Text style={[styles.inputLbl, { marginTop: 10 }]}>🌡️ Temperatur (°C)</Text>
      <TextInput style={[styles.input, { width: '50%' }]} value={temperatur} onChangeText={setTemperatur} placeholder="f.eks. 37,5" placeholderTextColor={TEMA.tekstSekundær} keyboardType="decimal-pad" maxLength={5} />

      <TouchableOpacity style={styles.gemKnap} onPress={gem}>
        <Text style={styles.gemKnapTekst}>Gem måling</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Rediger måling modal ─────────────────────────────────────────────────────

function RedigerSundhedsModal({ item, onLuk, onGem, onSlet }: {
  item: import('./store').SundhedsItem;
  onLuk: () => void;
  onGem: (opdateret: Partial<import('./store').SundhedsItem>) => void;
  onSlet: () => void;
}) {
  const [dato, setDato] = useState(item.dato);
  const [tidspunkt, setTidspunkt] = useState(item.tidspunkt);
  const [vægt, setVægt] = useState(item.vægt ? String(item.vægt) : '');
  const [længde, setLængde] = useState(item.længde ? String(item.længde) : '');
  const [temperatur, setTemperatur] = useState(item.temperatur ? String(item.temperatur).replace('.', ',') : '');

  function gem() {
    onGem({
      dato,
      tidspunkt,
      vægt: vægt ? parseInt(vægt) : undefined,
      længde: længde ? parseFloat(længde) : undefined,
      temperatur: temperatur ? parseFloat(temperatur.replace(',', '.')) : undefined,
    });
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalBag}>
        <View style={[styles.modal, { width: 320 }]}>
          <Text style={styles.modalTitel}>Rediger måling</Text>

          <View style={styles.toKolonner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLbl}>Dato</Text>
              <TextInput style={styles.input} value={dato} onChangeText={setDato} placeholder="ÅÅÅÅ-MM-DD" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numbers-and-punctuation" maxLength={10} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLbl}>Tidspunkt</Text>
              <TextInput style={styles.input} value={tidspunkt} onChangeText={setTidspunkt} placeholder="HH:MM" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numbers-and-punctuation" maxLength={5} />
            </View>
          </View>

          <View style={styles.toKolonner}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLbl, { marginTop: 8 }]}>⚖️ Vægt (g)</Text>
              <TextInput style={styles.input} value={vægt} onChangeText={setVægt} placeholder="f.eks. 3335" placeholderTextColor={TEMA.tekstSekundær} keyboardType="numeric" maxLength={5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLbl, { marginTop: 8 }]}>📏 Længde (cm)</Text>
              <TextInput style={styles.input} value={længde} onChangeText={setLængde} placeholder="f.eks. 51" placeholderTextColor={TEMA.tekstSekundær} keyboardType="decimal-pad" maxLength={5} />
            </View>
          </View>

          <Text style={[styles.inputLbl, { marginTop: 8 }]}>🌡️ Temperatur (°C)</Text>
          <TextInput style={[styles.input, { width: '50%' }]} value={temperatur} onChangeText={setTemperatur} placeholder="f.eks. 37,5" placeholderTextColor={TEMA.tekstSekundær} keyboardType="decimal-pad" maxLength={5} />

          <View style={[styles.modalKnapper, { marginTop: 16 }]}>
            <TouchableOpacity style={[styles.modalAnnuller, { borderColor: '#C4848A' }]} onPress={onSlet}>
              <Text style={[styles.modalAnnullerTekst, { color: '#C4848A' }]}>Slet</Text>
            </TouchableOpacity>
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

// ─── Hoved-komponent ───────────────────────────────────────────────────────────

export default function Sundhed() {
  const { data, sletSundhedslog, redigerSundhedslog } = useApp();
  const [visForm, setVisForm] = useState<'a' | 'b' | null>(null);
  const [redigerItem, setRedigerItem] = useState<import('./store').SundhedsItem | null>(null);
  const [redigerBarn, setRedigerBarn] = useState<'a' | 'b'>('a');

  function fmtDato(iso: string) {
    try { return new Date(iso).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return iso; }
  }

  function fmtVægt(g: number) {
    if (g >= 1000) return g + ' g (' + (g / 1000).toFixed(2).replace('.', ',') + ' kg)';
    return g + ' g';
  }

  function erFeber(t: number) { return t >= 38.0; }

  function bekræftSlet(barn: 'a' | 'b', id: string) {
    Alert.alert('Slet måling', 'Vil du slette denne måling?', [
      { text: 'Annuller', style: 'cancel' },
      { text: 'Slet', style: 'destructive', onPress: () => sletSundhedslog(barn, id) },
    ]);
  }

  function gemRedigering(opdateret: Partial<import('./store').SundhedsItem>) {
    if (!redigerItem) return;
    redigerSundhedslog(redigerBarn, redigerItem.id, opdateret);
    setRedigerItem(null);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topbar}>
        <Text style={styles.eyebrow}>Vækst og helbred</Text>
        <Text style={styles.titel}>Sundhedslog</Text>
      </View>

      {(['a', 'b'] as const).map(barn => {
        const erA = barn === 'a';
        const log = [...(data.børn[barn].sundhedslog ?? [])].sort((a, b) => {
          const da = a.dato + 'T' + a.tidspunkt;
          const db = b.dato + 'T' + b.tidspunkt;
          return db.localeCompare(da); // nyeste først
        });

        return (
          <View key={barn} style={styles.barnKort}>
            <View style={[styles.barnHeader, { backgroundColor: erA ? '#2C1810' : '#EDE5DC' }]}>
              <Text style={[styles.barnNavn, { color: erA ? '#FDF8F3' : '#2C1810' }]}>{data.navne[barn]}</Text>
            </View>

            <View style={styles.kortBody}>
              {/* Fødselsinfo */}
              {(data.børn[barn].fødselsvægt || data.børn[barn].fødselslængde || data.børn[barn].fødselsdag) && (
                <View style={styles.fødselRad}>
                  <Text style={styles.sektionLabel}>Fødsel</Text>
                  <View style={styles.chips}>
                    {data.børn[barn].fødselsdag && <View style={styles.chip}><Text style={styles.chipTekst}>🎂 {fmtDato(data.børn[barn].fødselsdag!)}</Text></View>}
                    {data.børn[barn].fødselsvægt && <View style={styles.chip}><Text style={styles.chipTekst}>⚖️ {fmtVægt(data.børn[barn].fødselsvægt!)}</Text></View>}
                    {data.børn[barn].fødselslængde && <View style={styles.chip}><Text style={styles.chipTekst}>📏 {data.børn[barn].fødselslængde} cm</Text></View>}
                  </View>
                </View>
              )}

              {/* Graf */}
              <SundhedsGraf barn={barn} />

              {/* Log liste */}
              {log.length > 0 && (
                <View style={styles.logListe}>
                  <Text style={styles.sektionLabel}>Målinger</Text>
                  {log.map((item, idx) => {
                    // Vægtforskel til forrige måling med vægt
                    const forrige = log.slice(idx + 1).find(l => l.vægt);
                    const diffVægt = (item.vægt && forrige?.vægt) ? item.vægt - forrige.vægt : null;

                    return (
                      <TouchableOpacity key={item.id} style={styles.logRad} onLongPress={() => { setRedigerItem(item); setRedigerBarn(barn); }}>
                        <View style={styles.logVenstre}>
                          <Text style={styles.logDato}>{fmtDato(item.dato)} {item.tidspunkt}</Text>
                          <View style={styles.logChips}>
                            {item.vægt && <Text style={styles.logChip}>⚖️ {fmtVægt(item.vægt)}</Text>}
                            {item.længde && <Text style={styles.logChip}>📏 {item.længde} cm</Text>}
                            {item.temperatur != null && (
                              <Text style={[styles.logChip, erFeber(item.temperatur) && styles.feber]}>
                                🌡️ {item.temperatur.toFixed(1).replace('.', ',')}°{erFeber(item.temperatur) ? ' 🔴' : ''}
                              </Text>
                            )}
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

              {/* Tilføj form */}
              {visForm === barn ? (
                <NyMålingForm barn={barn} onGem={() => setVisForm(null)} />
              ) : (
                <TouchableOpacity style={styles.tilføjKnap} onPress={() => setVisForm(barn)}>
                  <Text style={styles.tilføjTekst}>+ Tilføj måling</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}

      <View style={{ height: 40 }} />

      {/* REDIGER SUNDHEDSLOG MODAL */}
      {redigerItem && (
        <RedigerSundhedsModal
          item={redigerItem}
          onLuk={() => setRedigerItem(null)}
          onGem={gemRedigering}
          onSlet={() => { sletSundhedslog(redigerBarn, redigerItem.id); setRedigerItem(null); }}
        />
      )}
    </ScrollView>
  );
}

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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: TEMA.baggrund, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 0.5, borderColor: TEMA.border },
  chipTekst: { fontSize: 12, color: TEMA.tekstPrimær },
  grafWrapper: { marginBottom: 16, padding: 12, backgroundColor: TEMA.baggrund, borderRadius: 14, borderWidth: 0.5, borderColor: TEMA.border },
  grafTom: { padding: 12, alignItems: 'center', marginBottom: 12 },
  grafTomTekst: { fontSize: 12, color: TEMA.tekstSekundær, textAlign: 'center' },
  grafToggle: { flexDirection: 'row', gap: 6 },
  toggleKnap: { flex: 1, padding: 7, borderRadius: 10, backgroundColor: TEMA.kort, borderWidth: 0.5, borderColor: TEMA.border, alignItems: 'center' },
  toggleTekst: { fontSize: 11, color: TEMA.tekstSekundær },
  toggleTekstAktiv: { color: 'white', fontWeight: '500' },
  grafYLabel: { position: 'absolute', left: 0, fontSize: 9, color: TEMA.tekstSekundær, width: 34, textAlign: 'right' },
  grafXLabel: { fontSize: 8, color: TEMA.tekstSekundær, textAlign: 'center' },
  logListe: { marginBottom: 12 },
  logRad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: TEMA.borderLight },
  logVenstre: { flex: 1 },
  logDato: { fontSize: 13, fontWeight: '500', color: TEMA.tekstPrimær, marginBottom: 3 },
  logChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logChip: { fontSize: 11, color: TEMA.tekstSekundær },
  feber: { color: '#C4848A', fontWeight: '500' },
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
  modalBag: { flex: 1, backgroundColor: 'rgba(44,24,16,0.3)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: TEMA.kort, borderRadius: 20, padding: 20, width: 300, borderWidth: 0.5, borderColor: TEMA.border },
  modalTitel: { fontSize: 16, fontWeight: '500', color: TEMA.tekstPrimær, marginBottom: 16 },
  modalKnapper: { flexDirection: 'row', gap: 8 },
  modalAnnuller: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 0.5, borderColor: TEMA.border, alignItems: 'center' },
  modalAnnullerTekst: { fontSize: 13, color: TEMA.tekstSekundær },
  modalGem: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: TEMA.tekstPrimær, alignItems: 'center' },
  modalGemTekst: { fontSize: 13, color: 'white', fontWeight: '500' },
});