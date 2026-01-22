const Note = require('../models/Note');
const User = require('../models/User');
const { modifyNoteContent } = require('./geminiService');

const timers = new Map();

const activeViews = new Map();

const MODIFICATION_DELAY = 60 * 1000; // 1 minutes in milliseconds

/**
 * Schedule a note modification job
 * @param {string} noteId
 * @param {string} userId
 */
function scheduleNoteModification(noteId, userId) {
  const timestamp = new Date().toISOString();

  if (timers.has(noteId)) {
    clearTimeout(timers.get(noteId));
    console.log(`[TIMER] ${timestamp} - RESUMED timer for note ${noteId} (cleared previous timer)`);
  }

  if (activeViews.get(noteId)) {
    console.log(`[TIMER] ${timestamp} - SKIPPED scheduling for note ${noteId} (note is being viewed)`);
    return;
  }

  const timeoutId = setTimeout(async () => {
    const execTimestamp = new Date().toISOString();
    try {
      console.log(`[TIMER] ${execTimestamp} - EXECUTING modification job for note ${noteId}`);

      const note = await Note.findById(noteId);
      if (!note) {
        console.log(`[TIMER] ${execTimestamp} - Note ${noteId} not found, aborting modification`);
        timers.delete(noteId);
        return;
      }

      const user = await User.findById(userId);
      const changeRate = user?.settings?.entryChangeRate || 'medium';

      console.log(`[TIMER] ${execTimestamp} - Modifying note ${noteId} with change rate: ${changeRate}`);

      const modified = await modifyNoteContent(note.title, note.content, changeRate);

      note.title = modified.title;
      note.content = modified.content;
      await note.save();

      console.log(`[TIMER] ${execTimestamp} - ✓ Note ${noteId} modified successfully with ${changeRate} change rate`);

      timers.delete(noteId);
      console.log(`[TIMER] ${execTimestamp} - DELETED timer for note ${noteId} (job completed)`);
    } catch (error) {
      console.error(`[TIMER] ${execTimestamp} - ✗ Error modifying note ${noteId}:`, error);
      timers.delete(noteId);
      console.log(`[TIMER] ${execTimestamp} - DELETED timer for note ${noteId} (error occurred)`);
    }
  }, MODIFICATION_DELAY);

  timers.set(noteId, timeoutId);
  console.log(`[TIMER] ${timestamp} - CREATED timer for note ${noteId} (will execute in 1 minute)`);
}

/**
 * Cancel a scheduled modification (called when note is being viewed)
 * @param {string} noteId - The note ID
 */
function cancelNoteModification(noteId) {
  const timestamp = new Date().toISOString();
  if (timers.has(noteId)) {
    clearTimeout(timers.get(noteId));
    timers.delete(noteId);
    console.log(`[TIMER] ${timestamp} - DELETED timer for note ${noteId} (cancelled)`);
  }
}

/**
 * Mark a note as being actively viewed
 * @param {string} noteId - The note ID
 */
function markNoteAsViewed(noteId) {
  const timestamp = new Date().toISOString();
  activeViews.set(noteId, true);
  cancelNoteModification(noteId);
  console.log(`[TIMER] ${timestamp} - Note ${noteId} marked as VIEWED (timer stopped)`);
}

/**
 * Mark a note as no longer being viewed (trigger timer restart)
 * @param {string} noteId - The note ID
 * @param {string} userId - The user ID
 */
function markNoteAsNotViewed(noteId, userId) {
  const timestamp = new Date().toISOString();
  activeViews.set(noteId, false);
  console.log(`[TIMER] ${timestamp} - Note ${noteId} marked as NOT VIEWED (restarting timer)`);
  scheduleNoteModification(noteId, userId);
}

/**
 * Handle note activity (edit or update)
 * @param {string} noteId - The note ID
 * @param {string} userId - The user ID
 */
function onNoteActivity(noteId, userId) {
  scheduleNoteModification(noteId, userId);
}

/**
 * Check if a note has an active timer running
 * @param {string} noteId - The note ID
 * @returns {boolean} - True if timer is active
 */
function hasActiveTimer(noteId) {
  return timers.has(noteId);
}

function cleanupAllTimers() {
  const timestamp = new Date().toISOString();
  console.log(`[TIMER] ${timestamp} - Cleaning up all timers (${timers.size} active timers)`);
  for (const [noteId, timeoutId] of timers.entries()) {
    clearTimeout(timeoutId);
    console.log(`[TIMER] ${timestamp} - DELETED timer for note ${noteId} (shutdown cleanup)`);
  }
  timers.clear();
  activeViews.clear();
  console.log(`[TIMER] ${timestamp} - All timers cleaned up`);
}

module.exports = {
  scheduleNoteModification,
  cancelNoteModification,
  markNoteAsViewed,
  markNoteAsNotViewed,
  onNoteActivity,
  cleanupAllTimers,
  hasActiveTimer,
};
