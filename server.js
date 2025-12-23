
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection Configuration
// These environment variables can be set on platforms like Render, Railway, or Heroku
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'worklog_db',
  port: process.env.DB_PORT || 3306
};

// Create the connection pool (better for performance and stability)
const pool = mysql.createPool(dbConfig);
const db = pool.promise();

// Routes

// 1. Get all entries
app.get('/api/entries', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT DATE_FORMAT(date, '%Y-%m-%d') as date, startTime, endTime, CAST(duration AS DOUBLE) as duration FROM work_entries ORDER BY date DESC");
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Save or Update an entry (Upsert)
app.post('/api/entries', async (req, res) => {
  const { date, startTime, endTime, duration } = req.body;
  const sql = `
    INSERT INTO work_entries (date, startTime, endTime, duration) 
    VALUES (?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE 
    startTime = VALUES(startTime), 
    endTime = VALUES(endTime), 
    duration = VALUES(duration)
  `;
  try {
    await db.query(sql, [date, startTime, endTime, duration]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Delete an entry
app.delete('/api/entries/:date', async (req, res) => {
  try {
    await db.query("DELETE FROM work_entries WHERE date = ?", [req.params.date]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get Hourly Wage
app.get('/api/settings/wage', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'hourly_wage' LIMIT 1");
    const wage = rows.length > 0 ? parseFloat(rows[0].setting_value) : 0;
    res.json({ success: true, data: wage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Save Hourly Wage
app.post('/api/settings/wage', async (req, res) => {
  const { wage } = req.body;
  const sql = `
    INSERT INTO settings (setting_key, setting_value) 
    VALUES ('hourly_wage', ?) 
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
  `;
  try {
    await db.query(sql, [wage.toString()]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
