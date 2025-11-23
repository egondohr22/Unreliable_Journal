require('dotenv').config();
const mongoose = require('mongoose');
const repl = require('repl');

// Import models
const User = require('./models/User');
const Note = require('./models/Note');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unreliable-journal';

console.log('Connecting to MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log('\nAvailable models:');
    console.log('  - User');
    console.log('  - Note');
    console.log('\nExample usage:');
    console.log('  User.find().then(console.log)');
    console.log('  Note.countDocuments().then(console.log)');
    console.log('  User.findOne({ email: "test@example.com" }).then(console.log)');
    console.log('\nType .exit to quit\n');

    // Start REPL
    const replServer = repl.start({
      prompt: 'unreliable-journal> ',
      useColors: true
    });

    // Add models to REPL context
    replServer.context.User = User;
    replServer.context.Note = Note;
    replServer.context.mongoose = mongoose;

    // Handle exit gracefully
    replServer.on('exit', async () => {
      console.log('\nClosing database connection...');
      await mongoose.connection.close();
      console.log('Goodbye!');
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Handle Ctrl+C
process.on('SIGINT', async () => {
  console.log('\nClosing database connection...');
  await mongoose.connection.close();
  console.log('Goodbye!');
  process.exit(0);
});
