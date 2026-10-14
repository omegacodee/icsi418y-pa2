// ICSI 418Y - PA3: Projects and Project Memberships
// Extends PA2 (Signup/Login) with Projects + ProjectMemberships
// Plain Express + native MongoDB driver (no mongoose)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 9000;
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'pa2db';

app.use(cors());
app.use(express.json());

let usersCollection;
let projectsCollection;
let membershipsCollection;

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
  projectsCollection = db.collection('projects');
  membershipsCollection = db.collection('projectMemberships');
  console.log(`Connected to MongoDB database "${DB_NAME}"`);
}

// Helper: safely turn a string into an ObjectId, or null if invalid
function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch (err) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Signup / Login (from PA2 — unchanged)
// ---------------------------------------------------------------------------

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
      user: {
        _id: user._id,
        f_name: user.f_name,
        l_name: user.l_name,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while logging in. Please try again later.',
    });
  }
});

// ---------------------------------------------------------------------------
// Users (read-only list, needed to populate Project Lead / Member pickers)
// ---------------------------------------------------------------------------

app.get('/api/users', async (req, res) => {
  try {
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .toArray();
    return res.status(200).json({ success: true, users });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while loading users.',
    });
  }
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

// Create a project. The Project Lead is automatically added as a member.
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, status, project_lead_id } = req.body || {};

    if (!name || !description || !status || !project_lead_id) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, status, and project lead are all required.',
      });
    }

    const validStatuses = ['Planning', 'Active', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: Planning, Active, Completed.',
      });
    }

    const leadObjectId = toObjectId(project_lead_id);
    if (!leadObjectId) {
      return res.status(400).json({
        success: false,
        message: 'The selected project lead is not valid.',
      });
    }

    const leadUser = await usersCollection.findOne({ _id: leadObjectId });
    if (!leadUser) {
      return res.status(404).json({
        success: false,
        message: 'The selected project lead does not exist.',
      });
    }

    const result = await projectsCollection.insertOne({
      name,
      description,
      status,
      project_lead_id: leadObjectId,
    });

    // The Project Lead is automatically a member of their own project.
    await membershipsCollection.insertOne({
      project_id: result.insertedId,
      user_id: leadObjectId,
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      projectId: result.insertedId,
    });
  } catch (err) {
    console.error('Create project error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while creating the project. Please try again later.',
    });
  }
});

// List all projects, with the project lead's name/username resolved for display.
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await projectsCollection.find({}).toArray();

    const leadIds = projects.map((p) => p.project_lead_id).filter(Boolean);
    const leads = await usersCollection
      .find({ _id: { $in: leadIds } }, { projection: { password: 0 } })
      .toArray();
    const leadsById = new Map(leads.map((u) => [u._id.toString(), u]));

    const projectsWithLead = projects.map((project) => {
      const lead = leadsById.get(project.project_lead_id?.toString());
      return {
        ...project,
        project_lead: lead
          ? {
              _id: lead._id,
              username: lead.username,
              f_name: lead.f_name,
              l_name: lead.l_name,
            }
          : null,
      };
    });

    return res.status(200).json({ success: true, projects: projectsWithLead });
  } catch (err) {
    console.error('List projects error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while loading projects.',
    });
  }
});

// ---------------------------------------------------------------------------
// Project Memberships
// ---------------------------------------------------------------------------

// List the members of a project, with user info resolved for display.
app.get('/api/projects/:id/members', async (req, res) => {
  try {
    const projectId = toObjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }

    const project = await projectsCollection.findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'That project does not exist.' });
    }

    const memberships = await membershipsCollection.find({ project_id: projectId }).toArray();
    const userIds = memberships.map((m) => m.user_id);
    const users = await usersCollection
      .find({ _id: { $in: userIds } }, { projection: { password: 0 } })
      .toArray();
    const usersById = new Map(users.map((u) => [u._id.toString(), u]));

    const members = memberships.map((m) => {
      const user = usersById.get(m.user_id.toString());
      return {
        membershipId: m._id,
        user_id: m.user_id,
        username: user?.username,
        f_name: user?.f_name,
        l_name: user?.l_name,
        isLead: project.project_lead_id?.toString() === m.user_id.toString(),
      };
    });

    return res.status(200).json({ success: true, members });
  } catch (err) {
    console.error('List members error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while loading project members.',
    });
  }
});

// Add a registered user to a project.
app.post('/api/projects/:id/members', async (req, res) => {
  try {
    const projectId = toObjectId(req.params.id);
    const { user_id } = req.body || {};

    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }
    if (!user_id) {
      return res.status(400).json({ success: false, message: 'A user must be selected.' });
    }

    const userId = toObjectId(user_id);
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const project = await projectsCollection.findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'That project does not exist.' });
    }

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'That user does not exist.' });
    }

    const existingMembership = await membershipsCollection.findOne({
      project_id: projectId,
      user_id: userId,
    });
    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: 'That user is already a member of this project.',
      });
    }

    await membershipsCollection.insertOne({ project_id: projectId, user_id: userId });

    return res.status(201).json({
      success: true,
      message: `${user.f_name} ${user.l_name} was added to the project.`,
    });
  } catch (err) {
    console.error('Add member error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while adding the member. Please try again later.',
    });
  }
});

// Remove a non-lead member from a project.
app.delete('/api/projects/:id/members/:userId', async (req, res) => {
  try {
    const projectId = toObjectId(req.params.id);
    const userId = toObjectId(req.params.userId);

    if (!projectId || !userId) {
      return res.status(400).json({ success: false, message: 'Invalid project or user id.' });
    }

    const project = await projectsCollection.findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ success: false, message: 'That project does not exist.' });
    }

    if (project.project_lead_id?.toString() === userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'The Project Lead cannot be removed from the project.',
      });
    }

    const result = await membershipsCollection.deleteOne({
      project_id: projectId,
      user_id: userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'That user is not a member of this project.',
      });
    }

    return res.status(200).json({ success: true, message: 'Member removed from the project.' });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred while removing the member. Please try again later.',
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
