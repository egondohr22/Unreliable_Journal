const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', notesController.getAllNotes);
router.get('/:noteId', notesController.getNote);
router.post('/', notesController.createNote);
router.put('/:noteId', notesController.updateNote);
router.delete('/:noteId', notesController.deleteNote);
router.post('/:noteId/leave', notesController.leaveNote);

module.exports = router;
