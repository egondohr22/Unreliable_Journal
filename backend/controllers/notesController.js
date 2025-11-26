const Note = require('../models/Note');
const { handleError, sendNotFound, sendBadRequest } = require('../helpers/responseHelper');

const getAllNotes = async (req, res) => {
  try {
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

const deleteNoteById = async (req, res) => {
  try {
    const { noteId } = req.params;

    const note = await Note.findByIdAndDelete(noteId);

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
  deleteNote,
  deleteNoteById
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
