import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { API, getAuthHeaders } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function NotesScreen({ onNavigateToSettings }) {
  const { token, user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(API.ENDPOINTS.NOTES.GET_ALL, {
        headers: getAuthHeaders(token),
      });
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
      Alert.alert('Error', 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(API.ENDPOINTS.NOTES.GET_ALL, {
        headers: getAuthHeaders(token),
      });
      const data = await response.json();
      setNotes(data);
    } catch (error) {
      console.error('Error refreshing notes:', error);
      Alert.alert('Error', 'Failed to refresh notes');
    } finally {
      setRefreshing(false);
    }
  };

  const createNote = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    try {
      const response = await fetch(API.ENDPOINTS.NOTES.CREATE, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ title, content }),
      });
      const newNote = await response.json();
      setNotes([newNote, ...notes]);
      closeModal();
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note');
    }
  };

  const updateNote = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Title and content are required');
      return;
    }

    try {
      const response = await fetch(
        API.ENDPOINTS.NOTES.UPDATE(selectedNote._id),
        {
          method: 'PUT',
          headers: getAuthHeaders(token),
          body: JSON.stringify({ title, content }),
        }
      );
      const updatedNote = await response.json();
      setNotes(notes.map(note => note._id === updatedNote._id ? updatedNote : note));
      closeModal();
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note');
    }
  };

  const deleteNote = async (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(API.ENDPOINTS.NOTES.DELETE(noteId), {
                method: 'DELETE',
                headers: getAuthHeaders(token),
              });
              setNotes(notes.filter(note => note._id !== noteId));
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const openNewNoteModal = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setModalVisible(true);
  };

  const openEditNoteModal = async (note) => {
    setLoadingNote(true);
    setModalVisible(true);
    try {
      const response = await fetch(API.ENDPOINTS.NOTES.GET_ONE(note._id), {
        headers: getAuthHeaders(token),
      });
      const fullNote = await response.json();
      setSelectedNote(fullNote);
      setTitle(fullNote.title);
      setContent(fullNote.content);
    } catch (error) {
      console.error('Error fetching note:', error);
      Alert.alert('Error', 'Failed to load note');
      setModalVisible(false);
    } finally {
      setLoadingNote(false);
    }
  };

  const closeModal = async () => {
    // Restart timer if we were viewing an existing note
    if (selectedNote?._id) {
      try {
        await fetch(API.ENDPOINTS.NOTES.LEAVE(selectedNote._id), {
          method: 'POST',
          headers: getAuthHeaders(token),
        });
      } catch (error) {
        console.error('Error leaving note:', error);
      }
    }
    setModalVisible(false);
    setSelectedNote(null);
    setTitle('');
    setContent('');
  };

  const handleSave = () => {
    if (selectedNote) {
      updateNote();
    } else {
      createNote();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderNote = ({ item }) => (
    <TouchableOpacity
      style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => openEditNoteModal(item)}
      onLongPress={() => deleteNote(item._id)}
    >
      <Text style={[styles.noteTitle, { color: theme.text }]}>{item.title}</Text>
      <Text style={[styles.noteDate, { color: theme.textTertiary }]}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBar} />

      <View style={styles.topPadding} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notes</Text>
          {user && <Text style={[styles.userName, { color: theme.textSecondary }]}>{user.name}</Text>}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={openNewNoteModal}
          >
            <Text style={[styles.addButtonText, { color: theme.primaryText }]}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={onNavigateToSettings}
          >
            <Text style={[styles.settingsButtonText, { color: theme.text }]}>...</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes List */}
      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No notes yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>Tap + to create your first note</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNote}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.text}
              colors={[theme.text]}
            />
          }
        />
      )}

      {/* Note Editor Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={closeModal}>
                <Text style={[styles.modalButton, { color: theme.accent }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedNote ? 'Edit Note' : 'New Note'}
              </Text>
              <TouchableOpacity onPress={handleSave}>
                <Text style={[styles.modalButton, styles.saveButton, { color: theme.accent }]}>Save</Text>
              </TouchableOpacity>
            </View>

            {/* Note Editor */}
            {loadingNote ? (
              <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.text} />
              </View>
            ) : (
              <View style={styles.editorContainer}>
                <TextInput
                  style={[styles.titleInput, { color: theme.text }]}
                  placeholder="Title"
                  placeholderTextColor={theme.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  autoFocus={!selectedNote}
                />
                <TextInput
                  style={[styles.contentInput, { color: theme.text }]}
                  placeholder="Start writing..."
                  placeholderTextColor={theme.textTertiary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topPadding: {
    height: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    fontSize: 14,
    marginTop: 4,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 28,
    fontWeight: '300',
  },
  listContainer: {
    padding: 20,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalButton: {
    fontSize: 16,
  },
  saveButton: {
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
    padding: 20,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    paddingVertical: 8,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});
