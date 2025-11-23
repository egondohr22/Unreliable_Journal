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
