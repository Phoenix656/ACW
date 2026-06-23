const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Database ----------
const pool = require('./db');

// ---------- Auth helpers ----------
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function generateToken(user) {
  const payload = { user_id: user.user_id, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // { user_id, role }
    next();
  });
}

// ---------- File upload ----------
const upload = multer({ dest: 'uploads/' });

// ---------- Email & SMS transports ----------
let mailTransport = null;
if (process.env.SMTP_HOST) {
  mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ---------- Helper functions ----------
function getDaysUntilExpiration(expirationDate) {
  const today = new Date();
  const exp = new Date(expirationDate);
  return Math.floor((exp - today) / (1000 * 60 * 60 * 24));
}

function getNotificationType(daysUntilExp, renewalDueDays) {
  if (daysUntilExp <= 0) return 'urgent';
  if (Array.isArray(renewalDueDays)) {
    return renewalDueDays.includes(daysUntilExp) ? 'alert' : 'reminder';
  }
  return daysUntilExp <= renewalDueDays ? 'alert' : 'reminder';
}

// ---------- Auth routes ----------
app.post('/api/register', async (req, res) => {
  const { username, password, email, phone, role = 'user' } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'username, password and email required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING user_id, username, email, phone, role`,
      [username, email, phone, hash, role]
    );
    const user = result.rows[0];
    const token = generateToken(user);
    res.json({ token, user });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateToken(user);
    res.json({ token, user: { user_id: user.user_id, username: user.username, email: user.email, phone: user.phone, role: user.role } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protect all routes below
app.use(authenticateToken);

// ---------- Document routes ----------
app.get('/api/documents', async (req, res) => {
  try {
    let query = 'SELECT * FROM documents';
    const params = [];
    if (req.user.role !== 'master') {
      query += ' WHERE user_id = $1';
      params.push(req.user.user_id);
    }
    const result = await pool.query(query, params);
    const docs = result.rows.map(d => {
      const days = getDaysUntilExpiration(d.expiration_date);
      return { ...d, days_until_expiration: days, notification_type: getNotificationType(days, d.renewal_due_days) };
    });
    res.json(docs);
  } catch (e) {
    console.error('Fetch documents error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM documents WHERE doc_id = $1', [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Get document error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const { name, type, category, expiration_date, renewal_due_days = 30, file_path } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(
      `INSERT INTO documents (user_id, name, type, category, issue_date, expiration_date, renewal_due_days, file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.user_id, name, type, category, today, expiration_date, renewal_due_days, file_path]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Create document error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { renewal_status } = req.body;
    const result = await pool.query(
      'UPDATE documents SET renewal_status = $1, updated_at = CURRENT_TIMESTAMP WHERE doc_id = $2 RETURNING *',
      [renewal_status, id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Document not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update document error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- File upload ----------
app.post('/api/documents/:id/upload', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const docRes = await pool.query('SELECT user_id FROM documents WHERE doc_id = $1', [id]);
    if (!docRes.rowCount) return res.status(404).json({ error: 'Document not found' });
    const doc = docRes.rows[0];
    if (req.user.role !== 'master' && doc.user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const filePath = req.file.path;
    await pool.query('UPDATE documents SET file_path = $1 WHERE doc_id = $2', [filePath, id]);
    res.json({ success: true, file_path: filePath });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- Notification routes ----------
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, d.name AS document_name, u.username
       FROM notifications n
       JOIN documents d ON n.doc_id = d.doc_id
       JOIN users u ON n.user_id = u.user_id
       WHERE n.sent = FALSE
       ORDER BY n.scheduled_date ASC`
    );
    res.json(result.rows);
  } catch (e) {
    console.error('Fetch notifications error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { doc_id, user_id, message, notification_type, scheduled_date } = req.body;
    const result = await pool.query(
      `INSERT INTO notifications (doc_id, user_id, message, notification_type, scheduled_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [doc_id, user_id, message, notification_type, scheduled_date]
    );
    const notif = result.rows[0];
    // Send email & SMS if configured
    const userRes = await pool.query('SELECT email, phone FROM users WHERE user_id = $1', [user_id]);
    const user = userRes.rows[0];
    if (mailTransport && user.email) {
      await mailTransport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: `Alert: ${notification_type}`,
        text: message,
      });
    }
    if (twilioClient && user.phone) {
      await twilioClient.messages.create({
        body: `${notification_type}: ${message}`,
        from: process.env.TWILIO_FROM_NUMBER,
        to: user.phone,
      });
    }
    res.json(notif);
  } catch (e) {
    console.error('Create notification error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { sent = true } = req.body;
    const result = await pool.query(
      'UPDATE notifications SET sent = $1, sent_at = CURRENT_TIMESTAMP WHERE notification_id = $2 RETURNING *',
      [sent, id]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update notification error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM notifications WHERE notification_id = $1', [id]);
    res.sendStatus(204);
  } catch (e) {
    console.error('Delete notification error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- Users endpoint (master view) ----------
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, username, role FROM users ORDER BY username');
    res.json(result.rows);
  } catch (e) {
    console.error('Fetch users error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- Alert stats ----------
app.get('/api/alert-stats', async (req, res) => {
  try {
    const stats = {};
    const urgent = await pool.query(
      `SELECT COUNT(*) FROM documents WHERE renewal_status = 'expired' OR expiration_date < CURRENT_DATE`
    );
    stats.urgent_count = parseInt(urgent.rows[0].count, 10);
    const alert = await pool.query(
      `SELECT COUNT(*) FROM documents WHERE renewal_status = 'pending' AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`
    );
    stats.alert_count = parseInt(alert.rows[0].count, 10);
    const total = await pool.query('SELECT COUNT(*) FROM documents');
    stats.total_documents = parseInt(total.rows[0].count, 10);
    res.json(stats);
  } catch (e) {
    console.error('Alert stats error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------- Notification scheduler ----------
// Runs hourly, creates notifications for any document that matches its reminder thresholds
cron.schedule('0 * * * *', async () => {
  try {
    const docs = await pool.query('SELECT * FROM documents WHERE renewal_status != $1', ['renewed']);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    for (const doc of docs.rows) {
      const days = getDaysUntilExpiration(doc.expiration_date);
      if (days < 0) continue;
      const thresholds = Array.isArray(doc.renewal_due_days) ? doc.renewal_due_days : [doc.renewal_due_days];
      if (thresholds.includes(days)) {
        const type = getNotificationType(days, thresholds);
        const message = `Document "${doc.name}" expires in ${days} day(s)`;
        const exists = await pool.query(
          'SELECT 1 FROM notifications WHERE doc_id = $1 AND scheduled_date = $2',
          [doc.doc_id, todayStr]
        );
        if (!exists.rowCount) {
          await pool.query(
            `INSERT INTO notifications (doc_id, user_id, message, notification_type, scheduled_date)
             VALUES ($1, $2, $3, $4, $5)`,
            [doc.doc_id, doc.user_id, message, type, todayStr]
          );
        }
      }
    }
  } catch (e) {
    console.error('Scheduler error:', e);
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;