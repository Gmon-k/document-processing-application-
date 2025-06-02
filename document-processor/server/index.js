const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const FormData = require('form-data');

const app = express();
const port = 5009;

// Database connection
const pool = new Pool({
  user: process.env.USER || 'gmonk',
  host: 'localhost',
  database: 'document_processor',
  port: 5432,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// API Endpoints
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { filename, path } = req.file;
    
    // Save to database
    const result = await pool.query(
      'INSERT INTO documents (filename) VALUES ($1) RETURNING *',
      [filename]
    );
    
    res.status(200).json({ 
      message: 'File uploaded successfully',
      document: result.rows[0]
    });
    
    // Clean up file after processing
    fs.unlink(path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Error uploading file',
      details: error.message 
    });
  }
});

app.post('/api/extract', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(req.file.path));

    const extractionResponse = await axios.post(
      'https://plankton-app-qajlk.ondigitalocean.app/extraction_api',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json'
        }
      }
    );

    // Transform response to match your schema
    const items = extractionResponse.data.map((item, index) => ({
      line_number: index + 1,
      product_code: item.product_code || '',
      manufacturer_code: item.manufacturer_code || '',
      description: item.description || '',
      quantity: item.quantity || 0,
      unit_price: item.unit_price || 0,
      unit_type: item.unit_type || 'ea',
      total_price: (item.unit_price || 0) * (item.quantity || 0),
      matched_product_id: ''
    }));

    res.status(200).json({ items });
    
    // Clean up file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
  } catch (error) {
    console.error('Extraction error:', {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Error extracting data',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/match', async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid items format' });
    }

    const matchResponse = await axios.post(
      'https://endeavor-interview-api-gzwki.ondigitalocean.app/match',
      { items }
    );
    
    res.status(200).json(matchResponse.data);
  } catch (error) {
    console.error('Matching error:', error);
    res.status(500).json({ 
      error: 'Error matching items',
      details: error.response?.data || error.message
    });
  }
});

app.post('/api/save', async (req, res) => {
  try {
    const { documentId, items } = req.body;
    
    await pool.query('BEGIN');
    
    for (const item of items) {
      await pool.query(
        `INSERT INTO line_items 
        (document_id, line_number, product_code, manufacturer_code, description, 
         quantity, unit_price, unit_type, total_price, matched_product_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          documentId,
          item.line_number,
          item.product_code,
          item.manufacturer_code,
          item.description,
          item.quantity,
          item.unit_price,
          item.unit_type,
          item.total_price,
          item.matched_product_id
        ]
      );
    }
    
    await pool.query(
      'UPDATE documents SET status = $1 WHERE id = $2',
      ['processed', documentId]
    );
    
    await pool.query('COMMIT');
    res.status(200).json({ message: 'Data saved successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Save error:', error);
    res.status(500).json({ 
      error: 'Error saving data',
      details: error.message
    });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY upload_date DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Documents fetch error:', error);
    res.status(500).json({ error: 'Error fetching documents' });
  }
});

app.get('/api/items/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const result = await pool.query(
      'SELECT * FROM line_items WHERE document_id = $1 ORDER BY line_number',
      [documentId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Items fetch error:', error);
    res.status(500).json({ error: 'Error fetching items' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});