# Unreliable Journal - Backend API

Backend API for the Unreliable Journal mobile app, built with Node.js, Express, MongoDB, and Mongoose.

## Project Structure

```
backend/
├── controllers/          # Business logic
│   └── notesController.js
├── models/              # Mongoose schemas
│   └── Note.js
├── routes/              # API routes
│   └── notes.js
├── server.js            # Express app entry point
├── package.json
├── .env.example         # Environment variables template
└── .gitignore
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` and update the MongoDB connection string:

```env
MONGODB_URI=mongodb://localhost:27017/unreliable-journal
PORT=3000
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running locally, or use a cloud service like MongoDB Atlas.

**Local MongoDB:**
```bash
mongod
```

**MongoDB Atlas:**
Update `MONGODB_URI` in `.env` with your Atlas connection string.

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /health` - Check if API is running
- `GET /` - API information and available endpoints

### Notes CRUD

#### Get all notes for a user
```
GET /notes/:userId
```

#### Get a specific note
```
GET /notes/:userId/:noteId
GET /notes/:noteId (fallback)
```

#### Create a new note
```
POST /notes/:userId
Content-Type: application/json

{
  "title": "My Journal Entry",
  "content": "Today I learned something new..."
}
```

#### Update a note
```
PUT /notes/:userId/:noteId
PUT /notes/:noteId (fallback)
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### Delete a note
```
DELETE /notes/:userId/:noteId
DELETE /notes/:noteId (fallback)
```

## Database Schema

### Note Model

```javascript
{
  userId: String (required, indexed),
  title: String (required),
  content: String (required),
  date: Date (default: now),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

## Testing with curl

```bash
# Create a note
curl -X POST http://localhost:3000/notes/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Note","content":"This is a test"}'

# Get all notes for user
curl http://localhost:3000/notes/1

# Get specific note
curl http://localhost:3000/notes/1/{noteId}

# Update note
curl -X PUT http://localhost:3000/notes/1/{noteId} \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated","content":"New content"}'

# Delete note
curl -X DELETE http://localhost:3000/notes/1/{noteId}
```

## Development

The backend uses:
- **Express** - Web framework
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration
- **nodemon** - Development auto-reload

## Deployment

For production deployment (e.g., Render, Heroku):

1. Set environment variables on your platform
2. Ensure MongoDB is accessible (use MongoDB Atlas for cloud)
3. The app will use `process.env.PORT` automatically

## License

ISC
