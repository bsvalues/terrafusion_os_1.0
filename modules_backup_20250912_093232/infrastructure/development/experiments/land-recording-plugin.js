// Terrafusion Land Recording Plugin
// Full-stack module for Clerk/Recorder offices
// Handles e-recording, indexing, cashiering, and document management

// ============================================
// DATABASE SCHEMA (PostgreSQL + PostGIS)
// ============================================

const SCHEMA_SQL = `
-- Core recording tables
CREATE SCHEMA IF NOT EXISTS land_records;

-- Document types and fee schedules
CREATE TABLE land_records.document_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50), -- 'deed', 'mortgage', 'lien', 'plat', 'misc'
  base_fee DECIMAL(10,2),
  per_page_fee DECIMAL(10,2),
  requires_notary BOOLEAN DEFAULT false,
  requires_legal_desc BOOLEAN DEFAULT false,
  retention_years INTEGER DEFAULT 99,
  active BOOLEAN DEFAULT true
);

-- Main recordings table
CREATE TABLE land_records.recordings (
  id BIGSERIAL PRIMARY KEY,
  recording_number VARCHAR(30) UNIQUE NOT NULL, -- Format: YYYY-NNNNNNN
  legacy_book_page VARCHAR(50), -- For historical reference
  document_type_id INTEGER REFERENCES land_records.document_types(id),
  recording_date TIMESTAMPTZ DEFAULT NOW(),
  recorded_by VARCHAR(100),
  
  -- Parties
  grantor_names TEXT[], -- Array of grantor names
  grantee_names TEXT[], -- Array of grantee names
  
  -- Document details
  consideration_amount DECIMAL(15,2),
  transfer_tax DECIMAL(10,2),
  page_count INTEGER NOT NULL,
  
  -- Property reference
  parcel_ids TEXT[], -- Links to main parcel system
  legal_description TEXT,
  property_address TEXT,
  subdivision VARCHAR(100),
  lot_numbers TEXT[],
  
  -- Location (PostGIS)
  property_geom GEOMETRY(MultiPolygon, 4326),
  
  -- Document storage
  original_filename VARCHAR(255),
  storage_path VARCHAR(500), -- S3 or local path
  file_hash VARCHAR(64), -- SHA-256 for integrity
  file_size_bytes BIGINT,
  
  -- Indexing & search
  ocr_text TEXT, -- Full OCR extracted text
  search_vector tsvector, -- Full-text search
  
  -- Status tracking
  status VARCHAR(30) DEFAULT 'pending', -- pending, recorded, rejected, voided
  rejection_reason TEXT,
  
  -- Fees
  recording_fee DECIMAL(10,2),
  additional_fees JSONB, -- {type: amount} pairs
  total_collected DECIMAL(10,2),
  payment_method VARCHAR(30), -- cash, check, card, ach, erecording
  payment_reference VARCHAR(100),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100),
  
  -- Redaction
  contains_pii BOOLEAN DEFAULT false,
  redacted_version_path VARCHAR(500),
  redaction_notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_recording_number ON land_records.recordings(recording_number);
CREATE INDEX idx_recording_date ON land_records.recordings(recording_date DESC);
CREATE INDEX idx_grantor_gin ON land_records.recordings USING gin(grantor_names);
CREATE INDEX idx_grantee_gin ON land_records.recordings USING gin(grantee_names);
CREATE INDEX idx_parcel_gin ON land_records.recordings USING gin(parcel_ids);
CREATE INDEX idx_search_vector ON land_records.recordings USING gin(search_vector);
CREATE INDEX idx_property_geom ON land_records.recordings USING gist(property_geom);
CREATE INDEX idx_status ON land_records.recordings(status);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION land_records.update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.recording_number, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.grantor_names, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.grantee_names, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.legal_description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.ocr_text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recording_search
  BEFORE INSERT OR UPDATE ON land_records.recordings
  FOR EACH ROW EXECUTE FUNCTION land_records.update_search_vector();

-- e-Recording queue
CREATE TABLE land_records.erecording_queue (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR(100) UNIQUE,
  submitter_company VARCHAR(200),
  submitter_email VARCHAR(200),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  package_status VARCHAR(30) DEFAULT 'received', -- received, processing, completed, rejected
  package_xml TEXT, -- PRIA XML
  documents JSONB, -- Array of document metadata
  total_pages INTEGER,
  total_fees DECIMAL(10,2),
  recording_ids BIGINT[], -- After recording
  response_xml TEXT, -- PRIA response
  processed_at TIMESTAMPTZ,
  processed_by VARCHAR(100)
);

-- Fee calculations audit
CREATE TABLE land_records.fee_calculations (
  id SERIAL PRIMARY KEY,
  recording_id BIGINT REFERENCES land_records.recordings(id),
  calculation_date TIMESTAMPTZ DEFAULT NOW(),
  base_fee DECIMAL(10,2),
  page_fees DECIMAL(10,2),
  transfer_tax DECIMAL(10,2),
  tech_fund_fee DECIMAL(10,2),
  other_fees JSONB,
  total_fee DECIMAL(10,2),
  fee_schedule_version VARCHAR(20),
  calculated_by VARCHAR(100)
);

-- Redaction queue
CREATE TABLE land_records.redaction_queue (
  id SERIAL PRIMARY KEY,
  recording_id BIGINT REFERENCES land_records.recordings(id),
  reason VARCHAR(200),
  patterns_to_redact JSONB, -- SSN, account numbers, etc.
  status VARCHAR(30) DEFAULT 'pending',
  redacted_at TIMESTAMPTZ,
  redacted_by VARCHAR(100)
);

-- Historical book/page references
CREATE TABLE land_records.legacy_books (
  id SERIAL PRIMARY KEY,
  book_type VARCHAR(30), -- deed, mortgage, plat, misc
  book_number VARCHAR(20),
  year_start INTEGER,
  year_end INTEGER,
  first_page INTEGER,
  last_page INTEGER,
  digitized BOOLEAN DEFAULT false,
  digitized_path VARCHAR(500)
);
`;

// ============================================
// BACKEND API (Node.js/Express)
// ============================================

const express = require('express');
const multer = require('multer');
const { Pool } = require('pg');
const pdf = require('pdf-parse');
const sharp = require('sharp');
const tesseract = require('node-tesseract-ocr');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const upload = multer({ dest: '/tmp/uploads/' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json());
app.use(authenticateToken); // Your existing JWT middleware

// ============================================
// RECORDING ENDPOINTS
// ============================================

// Submit new recording
app.post('/api/land-records/recordings', upload.single('document'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate recording number (YYYY-NNNNNNN)
    const year = new Date().getFullYear();
    const {
      rows: [{ next_num }],
    } = await client.query(
      `
      SELECT COALESCE(MAX(CAST(SUBSTRING(recording_number FROM 6) AS INTEGER)), 0) + 1 as next_num
      FROM land_records.recordings
      WHERE recording_number LIKE $1
    `,
      [`${year}-%`]
    );

    const recordingNumber = `${year}-${String(next_num).padStart(7, '0')}`;

    // Process uploaded document
    const fileBuffer = await fs.readFile(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Extract text via OCR
    let ocrText = '';
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdf(fileBuffer);
      ocrText = pdfData.text;
    } else {
      // Convert image to text
      ocrText = await tesseract.recognize(req.file.path, {
        lang: 'eng',
        oem: 1,
        psm: 3,
      });
    }

    // Parse document for standard fields
    const { grantors, grantees, parcelIds, legalDesc } = parseDocument(ocrText);

    // Calculate fees
    const docType = await client.query(
      'SELECT * FROM land_records.document_types WHERE code = $1',
      [req.body.documentType]
    );
    const fees = calculateRecordingFees(docType.rows[0], req.body.pageCount);

    // Insert recording
    const {
      rows: [recording],
    } = await client.query(
      `
      INSERT INTO land_records.recordings (
        recording_number, document_type_id, grantor_names, grantee_names,
        parcel_ids, legal_description, property_address, page_count,
        consideration_amount, recording_fee, total_collected,
        original_filename, file_hash, file_size_bytes, ocr_text,
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `,
      [
        recordingNumber,
        req.body.documentTypeId,
        grantors,
        grantees,
        parcelIds,
        legalDesc,
        req.body.propertyAddress,
        req.body.pageCount,
        req.body.considerationAmount,
        fees.recordingFee,
        fees.total,
        req.file.originalname,
        fileHash,
        req.file.size,
        ocrText,
        'pending',
        req.user.email,
      ]
    );

    // Store document in S3/local storage
    const storagePath = await storeDocument(req.file, recordingNumber);
    await client.query('UPDATE land_records.recordings SET storage_path = $1 WHERE id = $2', [
      storagePath,
      recording.id,
    ]);

    // Queue for redaction if needed
    if (detectPII(ocrText)) {
      await client.query(
        `
        INSERT INTO land_records.redaction_queue (recording_id, reason)
        VALUES ($1, 'PII detected in OCR text')
      `,
        [recording.id]
      );
    }

    await client.query('COMMIT');
    res.json({ recording, fees });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Recording submission error:', error);
    res.status(500).json({ error: 'Recording submission failed' });
  } finally {
    client.release();
  }
});

// Search recordings
app.get('/api/land-records/search', async (req, res) => {
  const {
    q, // Full-text search
    grantor,
    grantee,
    parcelId,
    dateFrom,
    dateTo,
    documentType,
    status,
    page = 1,
    limit = 50,
  } = req.query;

  let query = `
    SELECT r.*, dt.name as document_type_name
    FROM land_records.recordings r
    JOIN land_records.document_types dt ON r.document_type_id = dt.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 0;

  if (q) {
    params.push(q);
    query += ` AND r.search_vector @@ plainto_tsquery('english', $${++paramCount})`;
  }

  if (grantor) {
    params.push(grantor);
    query += ` AND $${++paramCount} = ANY(r.grantor_names)`;
  }

  if (grantee) {
    params.push(grantee);
    query += ` AND $${++paramCount} = ANY(r.grantee_names)`;
  }

  if (parcelId) {
    params.push(parcelId);
    query += ` AND $${++paramCount} = ANY(r.parcel_ids)`;
  }

  if (dateFrom) {
    params.push(dateFrom);
    query += ` AND r.recording_date >= $${++paramCount}`;
  }

  if (dateTo) {
    params.push(dateTo);
    query += ` AND r.recording_date <= $${++paramCount}`;
  }

  query += ` ORDER BY r.recording_date DESC`;
  query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// ============================================
// E-RECORDING INTEGRATION
// ============================================

// Receive e-recording package (PRIA 3.0 XML standard)
app.post(
  '/api/land-records/erecording/submit',
  express.text({ type: 'application/xml' }),
  async (req, res) => {
    const xml = req.body;
    const parsed = await parseXML(xml); // Parse PRIA XML

    const {
      rows: [queue],
    } = await pool.query(
      `
    INSERT INTO land_records.erecording_queue (
      submission_id, submitter_company, submitter_email,
      package_xml, documents, total_pages
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `,
      [
        parsed.submissionId,
        parsed.submitter.company,
        parsed.submitter.email,
        xml,
        JSON.stringify(parsed.documents),
        parsed.totalPages,
      ]
    );

    // Send to processing queue
    processErecordingPackage(queue.id);

    // Return PRIA acknowledgment
    res.type('application/xml');
    res.send(buildPRIAResponse(queue.submission_id, 'received'));
  }
);

// ============================================
// FEE CALCULATION ENGINE
// ============================================

function calculateRecordingFees(docType, pageCount, consideration = 0) {
  const fees = {
    baseFee: docType.base_fee || 0,
    pageFees: (pageCount - 1) * (docType.per_page_fee || 0),
    transferTax: 0,
    techFund: 5.0, // State technology fund
    archiveFee: 2.0,
    total: 0,
  };

  // Transfer tax calculation (varies by state/county)
  if (docType.category === 'deed' && consideration > 0) {
    fees.transferTax = Math.ceil(consideration / 500) * 0.55; // Example: $0.55 per $500
  }

  fees.total = Object.values(fees).reduce((sum, fee) => sum + fee, 0);
  return fees;
}

// ============================================
// OCR & DOCUMENT PARSING
// ============================================

function parseDocument(text) {
  const grantors = [];
  const grantees = [];
  const parcelIds = [];
  let legalDesc = '';

  // Extract grantor/grantee (common patterns)
  const grantorMatch = text.match(/GRANTOR[S]?:(.*?)GRANTEE/is);
  if (grantorMatch) {
    const names = grantorMatch[1].split(/,|AND/i).map(n => n.trim());
    grantors.push(...names.filter(n => n.length > 2));
  }

  const granteeMatch = text.match(/GRANTEE[S]?:(.*?)(?:WITNESSETH|PROPERTY|CONSIDERATION)/is);
  if (granteeMatch) {
    const names = granteeMatch[1].split(/,|AND/i).map(n => n.trim());
    grantees.push(...names.filter(n => n.length > 2));
  }

  // Extract parcel IDs (common formats)
  const parcelMatches = text.matchAll(/\b\d{2}-\d{2}-\d{2}-\d{3}-\d{3}\b/g);
  for (const match of parcelMatches) {
    parcelIds.push(match[0]);
  }

  // Extract legal description
  const legalMatch = text.match(/LEGAL DESCRIPTION:(.*?)(?:SUBJECT TO|TOGETHER WITH|$)/is);
  if (legalMatch) {
    legalDesc = legalMatch[1].trim().substring(0, 2000);
  }

  return { grantors, grantees, parcelIds, legalDesc };
}

// ============================================
// PII DETECTION & REDACTION
// ============================================

function detectPII(text) {
  const patterns = [
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{9}\b/, // SSN without dashes
    /\b(?:\d{4}[\s-]?){3}\d{4}\b/, // Credit card
    /\b\d{2}\/\d{2}\/\d{4}\b/, // Birth dates
  ];

  return patterns.some(pattern => pattern.test(text));
}

async function redactDocument(recordingId) {
  // Implementation for automated redaction
  // Uses ImageMagick or similar to black out PII regions
}

// ============================================
// CASHIERING & PAYMENT
// ============================================

app.post('/api/land-records/payments/session', async (req, res) => {
  const { recordingIds, paymentMethod } = req.body;

  // Calculate total fees
  const { rows: recordings } = await pool.query(
    'SELECT * FROM land_records.recordings WHERE id = ANY($1)',
    [recordingIds]
  );

  const totalAmount = recordings.reduce((sum, r) => sum + Number(r.total_collected), 0);

  // Create payment session (integrate with your Terrafusion Collections)
  const session = await createPaymentSession({
    amount: totalAmount * 100, // cents
    description: `Recording fees for ${recordings.map(r => r.recording_number).join(', ')}`,
    metadata: { recordingIds: recordingIds.join(',') },
  });

  res.json({ sessionUrl: session.url });
});

// ============================================
// REPORTING & ANALYTICS
// ============================================

app.get('/api/land-records/reports/daily-summary', async (req, res) => {
  const { date = new Date().toISOString().split('T')[0] } = req.query;

  const { rows } = await pool.query(
    `
    SELECT 
      COUNT(*) as total_recordings,
      COUNT(DISTINCT document_type_id) as document_types,
      SUM(page_count) as total_pages,
      SUM(total_collected) as total_revenue,
      
      COUNT(*) FILTER (WHERE payment_method = 'cash') as cash_count,
      SUM(total_collected) FILTER (WHERE payment_method = 'cash') as cash_total,
      
      COUNT(*) FILTER (WHERE payment_method = 'check') as check_count,
      SUM(total_collected) FILTER (WHERE payment_method = 'check') as check_total,
      
      COUNT(*) FILTER (WHERE payment_method = 'card') as card_count,
      SUM(total_collected) FILTER (WHERE payment_method = 'card') as card_total,
      
      COUNT(*) FILTER (WHERE payment_method = 'erecording') as erecording_count,
      SUM(total_collected) FILTER (WHERE payment_method = 'erecording') as erecording_total
      
    FROM land_records.recordings
    WHERE DATE(recording_date) = $1
  `,
    [date]
  );

  res.json(rows[0]);
});

// ============================================
// FRONTEND COMPONENTS (React)
// ============================================

const RecordingDashboard = `
import React, { useState, useEffect } from 'react';
import { 
  Search, FileText, DollarSign, Calendar,
  Users, MapPin, AlertCircle, Check
} from 'lucide-react';

export default function RecordingDashboard() {
  const [stats, setStats] = useState({});
  const [recentRecordings, setRecentRecordings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real-time stats
  useEffect(() => {
    const ws = new WebSocket('wss://your-domain/ws/recordings');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_recording') {
        setRecentRecordings(prev => [data.recording, ...prev.slice(0, 9)]);
      }
    };
    return () => ws.close();
  }, []);
  
  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="Today's Recordings"
          value={stats.todayCount || 0}
          icon={<FileText />}
          trend="+12%"
        />
        <StatsCard 
          title="Revenue Today"
          value={\`$\${stats.todayRevenue || 0}\`}
          icon={<DollarSign />}
          trend="+8%"
        />
        <StatsCard 
          title="E-Recordings"
          value={stats.erecordingCount || 0}
          icon={<Check />}
          trend="+25%"
        />
        <StatsCard 
          title="Pending Redaction"
          value={stats.pendingRedaction || 0}
          icon={<AlertCircle />}
          trend="-5%"
        />
      </div>
      
      {/* Quick Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by name, parcel, recording number..."
            className="flex-1 px-4 py-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg">
            Search
          </button>
        </div>
      </div>
      
      {/* Recent Recordings Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Recordings</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Recording #</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Grantor</th>
              <th className="px-6 py-3 text-left">Grantee</th>
              <th className="px-6 py-3 text-left">Fee</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentRecordings.map(rec => (
              <tr key={rec.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{rec.recording_number}</td>
                <td className="px-6 py-4">{rec.document_type_name}</td>
                <td className="px-6 py-4">{rec.grantor_names?.[0]}</td>
                <td className="px-6 py-4">{rec.grantee_names?.[0]}</td>
                <td className="px-6 py-4">\${rec.total_collected}</td>
                <td className="px-6 py-4">
                  <span className={\`px-2 py-1 rounded-full text-xs 
                    \${rec.status === 'recorded' ? 'bg-green-100 text-green-800' : 
                      rec.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}\`}>
                    {rec.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;

// ============================================
// DEPLOYMENT (Docker Compose addition)
// ============================================

const DOCKER_COMPOSE = `
  land-recording:
    build: ./plugins/land-recording
    environment:
      DATABASE_URL: postgresql://terrafusion:password@postgres:5432/terrafusion
      REDIS_URL: redis://redis:6379
      S3_BUCKET: \${S3_BUCKET}
      AWS_ACCESS_KEY_ID: \${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: \${AWS_SECRET_ACCESS_KEY}
    volumes:
      - ./recordings:/data/recordings
    ports:
      - "8082:8082"
    depends_on:
      - postgres
      - redis
`;

module.exports = {
  SCHEMA_SQL,
  app,
  RecordingDashboard,
  DOCKER_COMPOSE,
};
