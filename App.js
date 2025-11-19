import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    BackHandler,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// --- API CONFIGURATION ---
const API_URL = 'https://unreliable-journal.onrender.com';
const USER_ID = '1'; 

const { width, height } = Dimensions.get('window');

// --- THEME: DEAD SIGNAL ---
const THEME = {
  bg: '#010101',       
  headerBlue: '#0e1d42', 
  text: '#d9d9d9',     
  textDim: '#555555',  
  selection: '#3b5bf0',
  red: '#b80000',      
};

// --- UTILS ---
const formatDate = (dateString) => {
  if (!dateString) return "UNKNOWN DATE";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString().toUpperCase();
  } catch (e) {
    return "ERR";
  }
};

// --- COMPONENT: RETRO TEXT ---
const RetroText = ({ children, style, size = 16, color = THEME.text }) => (
  <Text style={[
    styles.retroFont, 
    { fontSize: size, color: color },
    style,
    { 
      textShadowColor: 'rgba(0, 0, 255, 0.5)',
      textShadowOffset: { width: 2, height: 0 },
      textShadowRadius: 1
    }
  ]}>
    {children}
  </Text>
);

// --- COMPONENT: JITTER VIEW ---
const JitterView = ({ children, style, intensity = 1 }) => {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = () => {
      Animated.parallel([
        Animated.timing(x, { toValue: (Math.random() - 0.5) * intensity, duration: 50, useNativeDriver: true }),
        Animated.timing(y, { toValue: (Math.random() - 0.5) * intensity, duration: 50, useNativeDriver: true })
      ]).start(() => loop());
    };
    loop();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateX: x }, { translateY: y }] }]}>
      {children}
    </Animated.View>
  );
};

// --- COMPONENT: VHS HEADER ---
const VhsHeader = ({ label }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerBar}>
       <View style={styles.headerGradient} />
       <RetroText style={styles.headerText} size={18}>{label}</RetroText>
    </View>
    <View style={styles.trackingLine} />
  </View>
);

// --- COMPONENT: ITEM ICON ---
const ItemIcon = ({ selected }) => (
  <View style={[styles.itemBox, selected && styles.itemSelected]}>
    <View style={styles.iconPaper}>
       <View style={{height: 2, width: '60%', backgroundColor: '#111', marginBottom: 5}} />
       <View style={{height: 2, width: '80%', backgroundColor: '#111', marginBottom: 5}} />
       <View style={{height: 2, width: '50%', backgroundColor: '#111'}} />
       <View style={styles.iconStamp} />
    </View>
  </View>
);

// --- MAIN APP ---
export default function App() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState('boot'); 
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentEntry, setCurrentEntry] = useState(null);
  
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  
  // Tracking editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  // --- NAVIGATION ---
  useEffect(() => {
    const backAction = () => {
      if (view !== 'home') {
        setView('home');
        return true;
      }
      return false; 
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [view]);

  // --- API CALLS ---
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/notes/${USER_ID}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.notes || []);
      setEntries(list);
      if (selectedIndex >= list.length && list.length > 0) setSelectedIndex(0);
    } catch (error) {
      console.log("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  // Open for Reading
  const openEntry = async () => {
    if (entries.length === 0) return;
    setLoading(true);
    
    const noteId = entries[selectedIndex].id || entries[selectedIndex]._id;
    
    try {
      // Try getting content
      let response = await fetch(`${API_URL}/notes/${USER_ID}/${noteId}`);
      if (!response.ok) response = await fetch(`${API_URL}/notes/${noteId}`);

      if (response.ok) {
        const data = await response.json();
        setCurrentEntry(data);
        setView('reader');
      } else {
        throw new Error();
      }
    } catch (error) {
      // Fallback to list data if detail fetch fails
      setCurrentEntry(entries[selectedIndex]); 
      setView('reader');
    } finally {
      setLoading(false);
    }
  };

  // Save (Create or Update)
  const saveNote = async () => {
    if (!editorContent.trim()) return;
    setLoading(true);
    
    try {
      const payload = {
        title: editorTitle || `Tape ${entries.length + 1}`,
        content: editorContent
      };

      let response;
      
      if (isEditing && editId) {
        // --- UPDATE MODE ---
        console.log("Updating ID:", editId);
        response = await fetch(`${API_URL}/notes/${USER_ID}/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        // If PUT fails (404), try alt route
        if (!response.ok) {
           response = await fetch(`${API_URL}/notes/${editId}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(payload),
           });
        }
      } else {
        // --- CREATE MODE ---
        response = await fetch(`${API_URL}/notes/${USER_ID}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error();

      await fetchNotes(); 
      setView('home');
      
    } catch (error) {
      Alert.alert("ERROR", "WRITE FAILED. Server might not support edits.");
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = () => {
    if (entries.length === 0) return;
    const noteId = entries[selectedIndex].id || entries[selectedIndex]._id;

    Alert.alert("ERASE?", "Destroy this tape?", [
      { text: "NO" },
      { text: "YES", onPress: async () => {
          setLoading(true);
          try {
            let response = await fetch(`${API_URL}/notes/${USER_ID}/${noteId}`, { method: 'DELETE' });
            if (!response.ok) response = await fetch(`${API_URL}/notes/${noteId}`, { method: 'DELETE' });

            if (response.ok) {
              const newEntries = entries.filter((_, i) => i !== selectedIndex);
              setEntries(newEntries);
              if (selectedIndex >= newEntries.length) setSelectedIndex(Math.max(0, newEntries.length - 1));
              Alert.alert("DELETED", "Tape destroyed.");
            } else {
              throw new Error();
            }
          } catch (error) {
            Alert.alert("ERROR", "Delete failed.");
          } finally {
            setLoading(false);
          }
      }}
    ]);
  };

  // --- MODE SWITCHING ---
  const startCreating = () => {
    setEditorTitle('');
    setEditorContent('');
    setIsEditing(false);
    setEditId(null);
    setView('editor');
  };

  const startEditing = () => {
    if (currentEntry) {
      setEditorTitle(currentEntry.title);
      setEditorContent(currentEntry.content);
      setIsEditing(true);
      setEditId(currentEntry.id || currentEntry._id);
      setView('editor');
    }
  };

  // --- BOOT ---
  useEffect(() => {
    if (view === 'boot') {
      setTimeout(() => {
        setView('home');
        fetchNotes();
      }, 2000);
    }
  }, []);

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />
      
      {/* GLOBAL SCANLINES */}
      <View style={styles.scanlineLayer} pointerEvents="none">
         {Array.from({ length: height / 8 }).map((_, i) => (
           <View key={i} style={styles.scanlineRow} />
         ))}
         <View style={styles.vignette} />
      </View>

      {/* BOOT SCREEN */}
      {view === 'boot' && (
        <View style={styles.centerContainer}>
          <JitterView intensity={2}>
            <RetroText size={24} style={{letterSpacing: 6}}>NO SIGNAL</RetroText>
          </JitterView>
        </View>
      )}

      {/* MAIN UI */}
      {view !== 'boot' && (
        <View style={styles.uiLayer}>
          
          {/* === HOME VIEW === */}
          {view === 'home' && (
            <View style={{flex: 1}}>
               {/* HEADERS */}
               <View style={styles.headerRow}>
                  <View style={{flex: 2, marginRight: 10}}><VhsHeader label="JOURNAL" /></View>
                  <View style={{flex: 1}}><VhsHeader label="ACTION" /></View>
               </View>

               <View style={{flex: 1, flexDirection: 'row'}}>
                  {/* LEFT: CAROUSEL */}
                  <View style={styles.colJournal}>
                     <JitterView intensity={1} style={styles.carouselContainer}>
                        <TouchableOpacity onPress={() => {if(selectedIndex > 0) setSelectedIndex(s=>s-1)}} style={styles.navArrow}>
                          <RetroText size={24} color={selectedIndex > 0 ? THEME.text : '#222'}>{'<'}</RetroText>
                        </TouchableOpacity>

                        <View style={{alignItems: 'center'}}>
                          {entries.length > 0 ? (
                              <ItemIcon selected={true} />
                          ) : (
                              <View style={[styles.itemBox, {borderWidth: 0}]}>
                                <RetroText size={12} color="#333">NO TAPE</RetroText>
                              </View>
                          )}
                          {entries.length > 0 && (
                              <RetroText size={14} color={THEME.selection} style={{marginTop: 15}}>
                                {selectedIndex + 1} / {entries.length}
                              </RetroText>
                          )}
                        </View>

                        <TouchableOpacity onPress={() => {if(selectedIndex < entries.length-1) setSelectedIndex(s=>s+1)}} style={styles.navArrow}>
                          <RetroText size={24} color={selectedIndex < entries.length-1 ? THEME.text : '#222'}>{'>'}</RetroText>
                        </TouchableOpacity>
                     </JitterView>
                  </View>

                  {/* RIGHT: ACTIONS */}
                  <View style={styles.colAction}>
                     <TouchableOpacity onPress={openEntry}>
                        <RetroText style={styles.cmdText} color={entries.length > 0 ? THEME.text : '#333'}>READ</RetroText>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={startCreating}>
                        <RetroText style={styles.cmdText}>CREATE</RetroText>
                     </TouchableOpacity>
                     <TouchableOpacity onPress={deleteNote}>
                        <RetroText style={styles.cmdText} color={entries.length > 0 ? THEME.text : '#333'}>ERASE</RetroText>
                     </TouchableOpacity>
                  </View>
               </View>

               {/* BOTTOM PREVIEW */}
               <View style={styles.descBox}>
                  <RetroText size={20} color={THEME.selection} style={{marginBottom: 5}}>
                      {entries[selectedIndex]?.title || "NO SIGNAL"}
                  </RetroText>
                  {entries.length > 0 ? (
                    <View>
                        <View style={styles.divider} />
                        <RetroText size={12} color="#666">DATE: {formatDate(entries[selectedIndex]?.date)}</RetroText>
                        <RetroText size={14} color="#aaa" style={{marginTop: 20}}>
                            [ ENCRYPTED CONTENT ]
                        </RetroText>
                    </View>
                  ) : (
                    <RetroText size={14} color="#444" style={{marginTop: 20}}>
                        TAPE IS BLANK.
                    </RetroText>
                  )}
               </View>
            </View>
          )}

          {/* === EDITOR VIEW (FULL SCREEN FOCUS) === */}
          {view === 'editor' && (
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
               <View style={styles.headerRow}>
                  <View style={{flex: 1}}><VhsHeader label={isEditing ? "EDITING..." : "RECORDING..."} /></View>
               </View>
               
               <View style={styles.editorContainer}>
                  <TextInput 
                     style={styles.inputLine} 
                     placeholder="TITLE..." 
                     placeholderTextColor="#444"
                     value={editorTitle}
                     onChangeText={setEditorTitle}
                  />
                  <ScrollView style={styles.editorScroll}>
                    <TextInput 
                       style={styles.inputBlock} 
                       placeholder="TYPE ENTRY HERE..." 
                       placeholderTextColor="#444"
                       multiline
                       scrollEnabled={false} // Let ScrollView handle it
                       value={editorContent}
                       onChangeText={setEditorContent}
                    />
                  </ScrollView>
               </View>

               <View style={styles.footerActions}>
                  <TouchableOpacity onPress={() => setView('home')}>
                     <RetroText style={styles.cmdText} color={THEME.textDim}>CANCEL</RetroText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveNote}>
                     <RetroText style={styles.cmdText} color={THEME.selection}>SAVE</RetroText>
                  </TouchableOpacity>
               </View>
            </KeyboardAvoidingView>
          )}

          {/* === READER VIEW (FULL SCREEN FOCUS) === */}
          {view === 'reader' && currentEntry && (
             <View style={{flex: 1}}>
                <View style={styles.headerRow}>
                  <View style={{flex: 1}}><VhsHeader label="PLAYBACK" /></View>
                </View>
                
                <ScrollView style={styles.readerContainer}>
                   <RetroText size={24} color={THEME.selection} style={{marginBottom: 10}}>
                      {currentEntry.title}
                   </RetroText>
                   <View style={[styles.divider, {backgroundColor: THEME.selection}]} />
                   <RetroText size={18} color="#fff" style={{lineHeight: 28}}>
                      {currentEntry.content}
                   </RetroText>
                </ScrollView>

                <View style={styles.footerActions}>
                   <TouchableOpacity onPress={() => setView('home')}>
                      <RetroText style={styles.cmdText}>BACK</RetroText>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={startEditing}>
                      <RetroText style={styles.cmdText} color={THEME.selection}>EDIT</RetroText>
                   </TouchableOpacity>
                </View>
             </View>
          )}

        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // UI PADDING
  uiLayer: { 
    flex: 1, 
    padding: 20, 
    paddingTop: Platform.OS === 'android' ? 50 : 60 
  },

  // VHS FX
  scanlineLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99, opacity: 0.15 },
  scanlineRow: { width: '100%', height: 2, backgroundColor: '#000', marginBottom: 4 },
  vignette: { 
    position: 'absolute', width: '100%', height: '100%', 
    borderWidth: 50, borderColor: 'rgba(0,0,0,0.7)', borderRadius: 30 
  },

  // FONT
  retroFont: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },

  // HEADER
  headerRow: { flexDirection: 'row', height: 30, marginBottom: 20 },
  headerContainer: { flex: 1 },
  headerBar: { flex: 1, justifyContent: 'center', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#333' },
  headerGradient: { 
    position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', 
    backgroundColor: THEME.headerBlue, opacity: 0.9 
  },
  headerText: { textAlign: 'center', zIndex: 10, letterSpacing: 2 },
  trackingLine: { height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 2 },

  // HOME CONTENT
  colJournal: { flex: 2, justifyContent: 'center', marginRight: 15, borderRightWidth: 1, borderColor: '#222' },
  carouselContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  
  itemBox: {
    width: 100, height: 100, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'transparent'
  },
  itemSelected: {
    borderWidth: 3, borderColor: THEME.selection, 
    backgroundColor: 'rgba(59, 91, 240, 0.1)',
    shadowColor: THEME.selection, shadowRadius: 10, shadowOpacity: 0.5
  },
  iconPaper: {
    width: 60, height: 75, backgroundColor: '#b0b0b0',
    borderWidth: 1, borderColor: '#000', padding: 8
  },
  iconStamp: { 
    position: 'absolute', bottom: 5, right: 5, width: 20, height: 20, 
    borderRadius: 10, borderWidth: 2, borderColor: THEME.red, opacity: 0.6 
  },
  navArrow: { padding: 10 },

  colAction: { flex: 1, paddingLeft: 5, justifyContent: 'flex-start', paddingTop: 20 }, 
  cmdText: { fontSize: 20, marginBottom: 25, letterSpacing: 1 },

  descBox: {
    flex: 1, marginTop: 0, 
    borderTopWidth: 3, borderTopColor: THEME.headerBlue,
    backgroundColor: 'rgba(10,10,20,0.3)', padding: 15
  },
  divider: { height: 1, width: '100%', backgroundColor: '#444', marginBottom: 10 },

  // EDITOR STYLES
  editorContainer: { flex: 1, backgroundColor: 'rgba(20,20,20,0.5)', padding: 10, borderLeftWidth: 2, borderLeftColor: '#333' },
  editorScroll: { flex: 1 },
  inputLine: {
    color: '#fff', borderBottomWidth: 1, borderBottomColor: '#444',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 22, marginBottom: 20, paddingVertical: 5
  },
  inputBlock: {
    color: '#fff', fontSize: 18, lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footerActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingHorizontal: 20 },

  // READER STYLES
  readerContainer: { flex: 1, padding: 10 }
});