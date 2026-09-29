require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 9000;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'pa2db';

app.use(cors());
app.use(express.json());

let usersCollection;

async function connectToDatabase() {
  const client = new MongoClient(MONGO_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  const db = client.db(DB_NAME);
  usersCollection = db.collection('users');
  console.log(`Connected to MongoDB database "${DB_NAME}"`);
}

// --- Signup ---
app.post('/api/signup', async (req, res) => {
  try {
    const { f_name, l_name, username, password } = req.body || {};

    if (!f_name || !l_name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, username, and password are all required.',
      });
    }

    const existingUser = await usersCollection.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'That username is already taken. Please choose another.',
      });
    }

    const result = await usersCollection.insertOne({
      f_name,
      l_name,
      username,
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully! You can now log in.',
      userId: result.insertedId,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while creating your account. Please try again later.',
    });
  }
});

// --- Login ---
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are both required.',
      });
    }

    const user = await usersCollection.findOne({ username });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that username.',
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.f_name}!`,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while logging in. Please try again later.',
    });
  }
});

connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
