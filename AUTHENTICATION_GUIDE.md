# Authentication Implementation Guide

## Overview
This guide explains how to implement JWT-based authentication for the Unreliable Journal app.

## Current State
- Frontend uses hardcoded `USER_ID = '1'` in `config/api.js`
- Backend accepts userId as URL parameter
- No authentication or security

## Full Authentication Flow

### Phase 1: Backend Authentication Setup

#### 1.1 Install Required Dependencies
```bash
cd backend
npm install bcryptjs jsonwebtoken express-validator
```

#### 1.2 Create User Model
**File: `backend/models/User.js`**
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
```

#### 1.3 Create Authentication Controller
**File: `backend/controllers/authController.js`**
```javascript
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = '7d';

// Register new user
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    user = new User({ email, password, name });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, getCurrentUser };
```

#### 1.4 Create Authentication Middleware
**File: `backend/middleware/auth.js`**
```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = auth;
```

#### 1.5 Create Authentication Routes
**File: `backend/routes/auth.js`**
```javascript
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty()
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
```

#### 1.6 Update Notes Routes to Use Auth
**File: `backend/routes/notes.js`**
```javascript
const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Use authenticated user's ID from token (no userId in URL)
router.get('/', notesController.getAllNotes);
router.get('/:noteId', notesController.getNote);
router.post('/', notesController.createNote);
router.put('/:noteId', notesController.updateNote);
router.delete('/:noteId', notesController.deleteNote);

module.exports = router;
```

#### 1.7 Update Notes Controller
**File: `backend/controllers/notesController.js`**
```javascript
const Note = require('../models/Note');
const { handleError, sendNotFound, sendBadRequest } = require('../helpers/responseHelper');

const getAllNotes = async (req, res) => {
  try {
    // Get userId from auth middleware
    const userId = req.userId;
    const notes = await Note.find({ userId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    handleError(res, error, 'Failed to fetch notes');
  }
};

const getNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { noteId } = req.params;
    const note = await Note.findOne({ _id: noteId, userId });

    if (!note) {
      return sendNotFound(res, 'Note not found');
    }

    res.json(note);
  } catch (error) {
    handleError(res, error, 'Failed to fetch note');
  }
};

const createNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, content } = req.body;

    const validation = validateNoteData(title, content);
    if (!validation.valid) {
      return sendBadRequest(res, validation.message);
    }

    const note = new Note({
      userId,
      title,
      content
    });

    await note.save();
    res.status(201).json(note);
  } catch (error) {
    handleError(res, error, 'Failed to create note');
  }
};

const updateNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { noteId } = req.params;
    const { title, content } = req.body;

    const updateData = buildUpdateData(title, content);

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!note) {
      return sendNotFound(res, 'Note not found');
    }

    res.json(note);
  } catch (error) {
    handleError(res, error, 'Failed to update note');
  }
};

const deleteNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { noteId } = req.params;

    const note = await Note.findOneAndDelete({ _id: noteId, userId });

    if (!note) {
      return sendNotFound(res, 'Note not found');
    }

    res.json({ message: 'Note deleted successfully', note });
  } catch (error) {
    handleError(res, error, 'Failed to delete note');
  }
};

module.exports = {
  getAllNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote
};

const validateNoteData = (title, content) => {
  if (!title || !content) {
    return { valid: false, message: 'Title and content are required' };
  }
  return { valid: true };
};

const buildUpdateData = (title, content) => {
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  return updateData;
};
```

#### 1.8 Update Server.js
**File: `backend/server.js`**
```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unreliable-journal';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.name}`);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await mongoose.connection.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});
```

#### 1.9 Update .env
Add to your `.env` file:
```
JWT_SECRET=your-very-secret-key-change-this-in-production
```

---

### Phase 2: Frontend Authentication Setup

#### 2.1 Install Dependencies
```bash
cd frontend
npm install @react-native-async-storage/async-storage
```

#### 2.2 Create Auth Context
**File: `frontend/contexts/AuthContext.js`**
```javascript
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token on app start
  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading token:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await fetch(API.ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(API.ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### 2.3 Update API Config
**File: `frontend/config/api.js`**
```javascript
const API_BASE_URL = 'http://192.168.1.6:3000';

export const API = {
  BASE_URL: API_BASE_URL,

  ENDPOINTS: {
    AUTH: {
      REGISTER: `${API_BASE_URL}/auth/register`,
      LOGIN: `${API_BASE_URL}/auth/login`,
      ME: `${API_BASE_URL}/auth/me`,
    },
    NOTES: {
      GET_ALL: `${API_BASE_URL}/notes`,
      GET_ONE: (noteId) => `${API_BASE_URL}/notes/${noteId}`,
      CREATE: `${API_BASE_URL}/notes`,
      UPDATE: (noteId) => `${API_BASE_URL}/notes/${noteId}`,
      DELETE: (noteId) => `${API_BASE_URL}/notes/${noteId}`,
    }
  }
};

// Helper to add auth header
export const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});
```

#### 2.4 Create Login Screen
**File: `frontend/screens/LoginScreen.js`**
```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>Unreliable Journal</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkTextBold: {
    fontWeight: '600',
    color: '#000',
  },
});
```

#### 2.5 Update App.js to Use Auth
**File: `frontend/App.js`**
```javascript
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
} from 'react-native';
import { API, getAuthHeaders } from './config/api';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { token, logout } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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

  // ... rest of the component remains the same
}
```

## Summary

### Current Simple Flow (No Auth):
1. Frontend uses hardcoded `USER_ID = '1'`
2. All requests include userId in URL
3. No security, anyone can access any user's data

### Authenticated Flow:
1. **User Signs Up/Logs In** → Gets JWT token
2. **Token Stored** → AsyncStorage on device
3. **All API Calls** → Include `Authorization: Bearer <token>` header
4. **Backend Validates** → Middleware extracts userId from token
5. **Data Scoped** → Each user only sees their own notes

### Migration Path:
1. Keep current system working
2. Add auth endpoints and User model
3. Create login/register screens
4. Update App.js to use auth context
5. Test both systems
6. Remove old userId-in-URL system
7. Deploy

This provides complete user isolation and security without changing the core note functionality.
