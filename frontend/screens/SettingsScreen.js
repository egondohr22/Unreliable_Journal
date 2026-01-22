import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsScreen({ onBack }) {
  const { user, updateUser, fetchUser, logout } = useAuth();
  const { theme, isDark, setIsDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [themeSelection, setThemeSelection] = useState('light');
  const [entryChangeRate, setEntryChangeRate] = useState('medium');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    const result = await fetchUser();
    setLoading(false);

    if (result.success && result.user) {
      setName(result.user.name || '');
      setThemeSelection(result.user.settings?.theme || 'light');
      setEntryChangeRate(result.user.settings?.entryChangeRate || 'medium');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    setLoading(true);
    const result = await updateUser({
      name: name.trim(),
      settings: {
        theme: themeSelection,
        entryChangeRate,
      },
    });
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Settings updated successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to update settings');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  if (loading && !name) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.topPadding} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack}>
          <Text style={[styles.backButton, { color: theme.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
          <Text style={[styles.label, { color: theme.text }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="Your name"
            placeholderTextColor={theme.textTertiary}
            value={name}
            onChangeText={setName}
          />
          <Text style={[styles.emailLabel, { color: theme.textSecondary }]}>Email: {user?.email}</Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          <Text style={[styles.label, { color: theme.text }]}>Theme</Text>
          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                themeSelection === 'light' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => { setThemeSelection('light'); setIsDark(false); }}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.textSecondary },
                  themeSelection === 'light' && { color: theme.primaryText },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                themeSelection === 'dark' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => { setThemeSelection('dark'); setIsDark(true); }}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.textSecondary },
                  themeSelection === 'dark' && { color: theme.primaryText },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Journal Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Journal Settings</Text>
          <Text style={[styles.label, { color: theme.text }]}>Entry Change Rate</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            How much your journal entries will change over time
          </Text>
          <View style={styles.optionGroup}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                entryChangeRate === 'low' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setEntryChangeRate('low')}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.textSecondary },
                  entryChangeRate === 'low' && { color: theme.primaryText },
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                entryChangeRate === 'medium' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setEntryChangeRate('medium')}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.textSecondary },
                  entryChangeRate === 'medium' && { color: theme.primaryText },
                ]}
              >
                Medium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                { backgroundColor: theme.surface, borderColor: theme.border },
                entryChangeRate === 'high' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setEntryChangeRate('high')}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: theme.textSecondary },
                  entryChangeRate === 'high' && { color: theme.primaryText },
                ]}
              >
                High
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.primaryText} />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.primaryText }]}>Save Changes</Text>
          )}
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: theme.danger }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutButtonText, { color: theme.danger }]}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  emailLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  optionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
