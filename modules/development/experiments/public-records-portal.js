// Terrafusion Public Records Portal Plugin
// Public-facing portal for FOIA requests, document search, and transparency compliance
// Integrates with Land Recording plugin for document access

// ============================================
// DATABASE SCHEMA (PostgreSQL)
// ============================================

const SCHEMA_SQL = `
-- Public records portal schema
CREATE SCHEMA IF NOT EXISTS public_portal;

-- FOIA/Public Records Request tracking
CREATE TABLE public_portal.records_requests (
  id BIGSERIAL PRIMARY KEY,
  request_number VARCHAR(30) UNIQUE NOT NULL, -- Format: FOIA-YYYY-NNNNN
  
  -- Requester information
  requester_name VARCHAR(200) NOT NULL,
  requester_email VARCHAR(200),
  requester_phone VARCHAR(20),
  requester_address TEXT,
  requester_organization VARCHAR(200),
  requester_type VARCHAR(30), -- individual, media, commercial, nonprofit
  
  -- Request details
  request_date TIMESTAMPTZ DEFAULT NOW(),
  request_method VARCHAR(30), -- online, email, mail, phone, in-person
  request_text TEXT NOT NULL,
  request_category VARCHAR(50), -- contracts, emails, reports, meeting_minutes, etc.
  
  -- Departments/scope
  assigned_departments TEXT[], -- Array of department codes
  date_range_start DATE,
  date_range_end DATE,
  keywords TEXT[],
  
  -- Processing
  status VARCHAR(30) DEFAULT 'received', -- received, assigned, processing, review, completed, denied, withdrawn
  priority VARCHAR(20) DEFAULT 'normal', -- expedited, normal, complex
  assigned_to VARCHAR(100),
  assigned_date TIMESTAMPTZ,
  
  -- Deadlines (configurable per state law)
  response_deadline DATE, -- Calculated based on state law
  extended_deadline DATE, -- If extension requested
  actual_response_date TIMESTAMPTZ,
  
  -- Response
  response_type VARCHAR(30), -- fulfilled, partial, denied, withdrawn
  denial_reasons TEXT[],
  exemptions_cited TEXT[], -- Legal exemptions cited
  
  -- Documents
  estimated_pages INTEGER,
  actual_pages INTEGER,
  redacted_pages INTEGER,
  
  -- Fees
  search_fee DECIMAL(10,2) DEFAULT 0,
  duplication_fee DECIMAL(10,2) DEFAULT 0,
  review_fee DECIMAL(10,2) DEFAULT 0,
  other_fees JSONB,
  total_fee DECIMAL(10,2) DEFAULT 0,
  fee_waived BOOLEAN DEFAULT false,
  fee_waiver_reason TEXT,
  payment_received DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  
  -- Notes & correspondence
  internal_notes TEXT,
  correspondence JSONB, -- Array of {date, type, subject, content}
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(100),
  
  -- Analytics
  time_to_complete INTEGER, -- Business days
  staff_hours_spent DECIMAL(10,2),
  customer_satisfaction INTEGER -- 1-5 rating
);

-- Documents attached to requests
CREATE TABLE public_portal.request_documents (
  id SERIAL PRIMARY KEY,
  request_id BIGINT REFERENCES public_portal.records_requests(id),
  document_name VARCHAR(500),
  document_type VARCHAR(100),
  file_path VARCHAR(500),
  file_size_bytes BIGINT,
  page_count INTEGER,
  
  -- Redaction tracking
  is_redacted BOOLEAN DEFAULT false,
  redaction_notes TEXT,
  original_path VARCHAR(500), -- Unredacted version (staff only)
  
  -- Access control
  is_public BOOLEAN DEFAULT true,
  embargo_until DATE,
  download_count INTEGER DEFAULT 0,
  
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by VARCHAR(100)
);

-- Public document search (published documents)
CREATE TABLE public_portal.published_documents (
  id BIGSERIAL PRIMARY KEY,
  
  -- Document metadata
  title VARCHAR(500) NOT NULL,
  description TEXT,
  document_type VARCHAR(100), -- agenda, minutes, report, contract, policy, etc.
  department VARCHAR(100),
  
  -- Categorization
  categories TEXT[],
  tags TEXT[],
  
  -- Dates
  document_date DATE,
  publish_date TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- File info
  file_path VARCHAR(500) NOT NULL,
  file_size_bytes BIGINT,
  file_format VARCHAR(20), -- pdf, docx, xlsx, etc.
  page_count INTEGER,
  
  -- Search
  full_text TEXT, -- Extracted text for search
  search_vector tsvector,
  
  -- Governance
  retention_date DATE, -- When it can be removed
  approval_status VARCHAR(30) DEFAULT 'approved',
  approved_by VARCHAR(100),
  approved_date TIMESTAMPTZ,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Integration
  source_system VARCHAR(50), -- land_records, meeting_mgmt, etc.
  source_id VARCHAR(100), -- ID in source system
  
  active BOOLEAN DEFAULT true
);

-- Meeting materials (agendas, minutes, packets)
CREATE TABLE public_portal.meetings (
  id SERIAL PRIMARY KEY,
  meeting_type VARCHAR(100), -- council, planning, zoning, etc.
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  location VARCHAR(200),
  
  -- Documents
  agenda_doc_id BIGINT REFERENCES public_portal.published_documents(id),
  minutes_doc_id BIGINT REFERENCES public_portal.published_documents(id),
  packet_doc_id BIGINT REFERENCES public_portal.published_documents(id),
  
  -- Media
  video_url VARCHAR(500),
  audio_url VARCHAR(500),
  
  -- Status
  status VARCHAR(30) DEFAULT 'scheduled', -- scheduled, cancelled, completed
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription/alert system
CREATE TABLE public_portal.subscriptions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(200) NOT NULL,
  
  -- What to subscribe to
  subscription_type VARCHAR(30), -- meeting_agendas, new_documents, request_updates
  categories TEXT[], -- Specific categories to watch
  keywords TEXT[], -- Keywords to match
  
  -- Delivery
  frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly
  last_sent TIMESTAMPTZ,
  
  -- Management
  verification_token VARCHAR(100),
  verified BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics/metrics
CREATE TABLE public_portal.access_log (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- What was accessed
  resource_type VARCHAR(30), -- document, request, search, meeting
  resource_id VARCHAR(100),
  action VARCHAR(30), -- view, download, search
  
  -- Search analytics
  search_query TEXT,
  search_results_count INTEGER,
  
  -- Performance
  response_time_ms INTEGER
);

-- Indexes
CREATE INDEX idx_request_number ON public_portal.records_requests(request_number);
CREATE INDEX idx_request_status ON public_portal.records_requests(status);
CREATE INDEX idx_request_date ON public_portal.records_requests(request_date DESC);
CREATE INDEX idx_request_deadline ON public_portal.records_requests(response_deadline);

CREATE INDEX idx_published_search ON public_portal.published_documents USING gin(search_vector);
CREATE INDEX idx_published_date ON public_portal.published_documents(document_date DESC);
CREATE INDEX idx_published_type ON public_portal.published_documents(document_type);
CREATE INDEX idx_published_categories ON public_portal.published_documents USING gin(categories);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION public_portal.update_document_search()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.full_text, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_search_vector
  BEFORE INSERT OR UPDATE ON public_portal.published_documents
  FOR EACH ROW EXECUTE FUNCTION public_portal.update_document_search();
`;

// ============================================
// PUBLIC API (No auth required for public endpoints)
// ============================================

const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting for public endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/public', publicLimiter);

// ============================================
// PUBLIC DOCUMENT SEARCH
// ============================================

app.get('/api/public/documents/search', async (req, res) => {
  const {
    q, // Search query
    type, // Document type filter
    department,
    dateFrom, dateTo,
    categories, // Comma-separated
    page = 1,
    limit = 20,
    sort = 'relevance' // relevance, date_desc, date_asc
  } = req.query;
  
  // Log search for analytics
  await pool.query(`
    INSERT INTO public_portal.access_log (ip_address, user_agent, resource_type, action, search_query)
    VALUES ($1, $2, 'document', 'search', $3)
  `, [req.ip, req.get('user-agent'), q]);
  
  let query = `
    SELECT 
      id, title, description, document_type, department,
      categories, tags, document_date, file_format, file_size_bytes,
      page_count, view_count, download_count,
      ts_rank(search_vector, query) AS rank
    FROM public_portal.published_documents,
         plainto_tsquery('english', $1) query
    WHERE active = true
  `;
  
  const params = [q || ''];
  let paramCount = 1;
  
  if (q) {
    query += ` AND search_vector @@ query`;
  }
  
  if (type) {
    params.push(type);
    query += ` AND document_type = $${++paramCount}`;
  }
  
  if (department) {
    params.push(department);
    query += ` AND department = $${++paramCount}`;
  }
  
  if (dateFrom) {
    params.push(dateFrom);
    query += ` AND document_date >= $${++paramCount}`;
  }
  
  if (dateTo) {
    params.push(dateTo);
    query += ` AND document_date <= $${++paramCount}`;
  }
  
  if (categories) {
    params.push(categories.split(','));
    query += ` AND categories && $${++paramCount}`;
  }
  
  // Sorting
  if (sort === 'relevance' && q) {
    query += ` ORDER BY rank DESC, document_date DESC`;
  } else if (sort === 'date_desc') {
    query += ` ORDER BY document_date DESC`;
  } else if (sort === 'date_asc') {
    query += ` ORDER BY document_date ASC`;
  } else {
    query += ` ORDER BY document_date DESC`;
  }
  
  query += ` LIMIT ${parseInt(limit)} OFFSET ${(parseInt(page) - 1) * parseInt(limit)}`;
  
  const { rows } = await pool.query(query, params);
  
  // Get total count for pagination
  const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '');
  const { rows: [{ count }] } = await pool.query(countQuery, params);
  
  res.json({
    documents: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(count),
      pages: Math.ceil(count / limit)
    }
  });
});

// Get document details and download
app.get('/api/public/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { action = 'view' } = req.query; // view or download
  
  const { rows: [doc] } = await pool.query(`
    UPDATE public_portal.published_documents 
    SET ${action === 'download' ? 'download_count' : 'view_count'} = 
        ${action === 'download' ? 'download_count' : 'view_count'} + 1
    WHERE id = $1 AND active = true
    RETURNING *
  `, [id]);
  
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  // Log access
  await pool.query(`
    INSERT INTO public_portal.access_log (ip_address, resource_type, resource_id, action)
    VALUES ($1, 'document', $2, $3)
  `, [req.ip, id, action]);
  
  if (action === 'download') {
    // Serve file
    res.download(doc.file_path, doc.title + '.' + doc.file_format);
  } else {
    res.json(doc);
  }
});

// ============================================
// FOIA REQUEST SUBMISSION
// ============================================

const upload = multer({ dest: '/tmp/uploads/' });

app.post('/api/public/records-request', upload.array('attachments', 5), async (req, res) => {
  const {
    name, email, phone, address, organization,
    requestText, category, departments,
    dateRangeStart, dateRangeEnd, keywords
  } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Generate request number
    const year = new Date().getFullYear();
    const { rows: [{ next_num }] } = await client.query(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(request_number FROM 11) AS INTEGER)), 0) + 1 as next_num
      FROM public_portal.records_requests
      WHERE request_number LIKE $1
    `, [`FOIA-${year}-%`]);
    
    const requestNumber = `FOIA-${year}-${String(next_num).padStart(5, '0')}`;
    
    // Calculate deadline based on state law (example: 5 business days)
    const responseDeadline = calculateBusinessDays(new Date(), 5);
    
    // Insert request
    const { rows: [request] } = await client.query(`
      INSERT INTO public_portal.records_requests (
        request_number, requester_name, requester_email, requester_phone,
        requester_address, requester_organization, request_text,
        request_category, assigned_departments, date_range_start,
        date_range_end, keywords, request_method, response_deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      requestNumber, name, email, phone, address, organization,
      requestText, category, departments?.split(',') || [],
      dateRangeStart, dateRangeEnd, keywords?.split(',') || [],
      'online', responseDeadline
    ]);
    
    // Process attachments if any
    if (req.files?.length > 0) {
      for (const file of req.files) {
        await client.query(`
          INSERT INTO public_portal.request_documents (
            request_id, document_name, document_type, file_path, file_size_bytes
          ) VALUES ($1, $2, $3, $4, $5)
        `, [request.id, file.originalname, file.mimetype, file.path, file.size]);
      }
    }
    
    await client.query('COMMIT');
    
    // Send confirmation email
    await sendRequestConfirmation(email, requestNumber, responseDeadline);
    
    res.json({
      requestNumber,
      responseDeadline,
      message: 'Your request has been submitted successfully'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Request submission error:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  } finally {
    client.release();
  }
});

// Check request status
app.get('/api/public/records-request/:requestNumber', async (req, res) => {
  const { requestNumber } = req.params;
  
  const { rows: [request] } = await pool.query(`
    SELECT 
      request_number, request_date, request_text, status,
      response_deadline, extended_deadline, actual_response_date,
      response_type, denial_reasons, estimated_pages, actual_pages,
      total_fee, payment_received
    FROM public_portal.records_requests
    WHERE request_number = $1
  `, [requestNumber]);
  
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }
  
  // Get associated documents (only public ones)
  const { rows: documents } = await pool.query(`
    SELECT document_name, document_type, file_size_bytes, page_count, uploaded_at
    FROM public_portal.request_documents
    WHERE request_id = (SELECT id FROM public_portal.records_requests WHERE request_number = $1)
      AND is_public = true
    ORDER BY uploaded_at DESC
  `, [requestNumber]);
  
  res.json({ ...request, documents });
});

// ============================================
// MEETING MATERIALS
// ============================================

app.get('/api/public/meetings', async (req, res) => {
  const { type, dateFrom, dateTo, page = 1, limit = 20 } = req.query;
  
  let query = `
    SELECT 
      m.*,
      a.title as agenda_title,
      min.title as minutes_title,
      p.title as packet_title
    FROM public_portal.meetings m
    LEFT JOIN public_portal.published_documents a ON m.agenda_doc_id = a.id
    LEFT JOIN public_portal.published_documents min ON m.minutes_doc_id = min.id
    LEFT JOIN public_portal.published_documents p ON m.packet_doc_id = p.id
    WHERE 1=1
  `;
  
  const params = [];
  let paramCount = 0;
  
  if (type) {
    params.push(type);
    query += ` AND m.meeting_type = $${++paramCount}`;
  }
  
  if (dateFrom) {
    params.push(dateFrom);
    query += ` AND m.meeting_date >= $${++paramCount}`;
  }
  
  if (dateTo) {
    params.push(dateTo);
    query += ` AND m.meeting_date <= $${++paramCount}`;
  }
  
  query += ` ORDER BY m.meeting_date DESC`;
  query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
  
  const { rows } = await pool.query(query, params);
  res.json(rows);
});

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

app.post('/api/public/subscribe', async (req, res) => {
  const { email, subscriptionType, categories, keywords } = req.body;
  
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  const { rows: [subscription] } = await pool.query(`
    INSERT INTO public_portal.subscriptions (
      email, subscription_type, categories, keywords, verification_token
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email, subscription_type) 
    DO UPDATE SET categories = $3, keywords = $4, active = true
    RETURNING *
  `, [email, subscriptionType, categories, keywords, verificationToken]);
  
  // Send verification email
  await sendVerificationEmail(email, verificationToken);
  
  res.json({ message: 'Please check your email to verify your subscription' });
});

// ============================================
// FRONTEND COMPONENTS (React)
// ============================================

const PublicPortal = `
import React, { useState, useEffect } from 'react';
import { 
  Search, FileText, Download, Calendar, 
  Clock, Filter, ChevronRight, Mail
} from 'lucide-react';

export default function PublicPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    department: '',
    dateFrom: '',
    dateTo: ''
  });
  const [activeTab, setActiveTab] = useState('documents');
  
  const search = async () => {
    const params = new URLSearchParams({
      q: searchQuery,
      ...filters
    });
    
    const response = await fetch(\`/api/public/documents/search?\${params}\`);
    const data = await response.json();
    setDocuments(data.documents);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Public Records Portal
          </h1>
          <p className="mt-2 text-gray-600">
            Search documents, submit FOIA requests, and access meeting materials
          </p>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['documents', 'foia', 'meetings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={\`py-2 px-1 border-b-2 font-medium text-sm
                  \${activeTab === tab 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'documents' && (
          <DocumentSearch 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            documents={documents}
            filters={filters}
            setFilters={setFilters}
            onSearch={search}
          />
        )}
        
        {activeTab === 'foia' && <FOIARequestForm />}
        
        {activeTab === 'meetings' && <MeetingsList />}
      </div>
    </div>
  );
}

function DocumentSearch({ searchQuery, setSearchQuery, documents, filters, setFilters, onSearch }) {
  return (
    <div>
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search public documents..."
            className="flex-1 px-4 py-2 border rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
          <button 
            onClick={onSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
        
        {/* Filters */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <select 
            className="px-3 py-2 border rounded-lg"
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
          >
            <option value="">All Types</option>
            <option value="agenda">Agendas</option>
            <option value="minutes">Minutes</option>
            <option value="report">Reports</option>
            <option value="contract">Contracts</option>
            <option value="policy">Policies</option>
          </select>
          
          <select 
            className="px-3 py-2 border rounded-lg"
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
          >
            <option value="">All Departments</option>
            <option value="city_council">City Council</option>
            <option value="planning">Planning</option>
            <option value="finance">Finance</option>
            <option value="public_works">Public Works</option>
          </select>
          
          <input
            type="date"
            className="px-3 py-2 border rounded-lg"
            value={filters.dateFrom}
            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
            placeholder="From date"
          />
          
          <input
            type="date"
            className="px-3 py-2 border rounded-lg"
            value={filters.dateTo}
            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
            placeholder="To date"
          />
        </div>
      </div>
      
      {/* Results */}
      <div className="space-y-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {doc.title}
                </h3>
                <p className="mt-1 text-gray-600">{doc.description}</p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(doc.document_date).toLocaleDateString()}
                  </span>
                  <span>{doc.department}</span>
                  <span>{doc.page_count} pages</span>
                  <span>{(doc.file_size_bytes / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                  <FileText className="w-5 h-5" />
                </button>
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FOIARequestForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    requestText: '',
    category: '',
    departments: '',
    dateRangeStart: '',
    dateRangeEnd: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/public/records-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    if (result.requestNumber) {
      alert(\`Request submitted! Your tracking number is: \${result.requestNumber}\`);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Submit a Public Records Request</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Organization
            </label>
            <input
              type="text"
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              value={formData.organization}
              onChange={(e) => setFormData({...formData, organization: e.target.value})}
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Request Description *
          </label>
          <textarea
            required
            rows={4}
            className="mt-1 block w-full px-3 py-2 border rounded-lg"
            placeholder="Please describe the records you are requesting..."
            value={formData.requestText}
            onChange={(e) => setFormData({...formData, requestText: e.target.value})}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date Range Start
            </label>
            <input
              type="date"
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              value={formData.dateRangeStart}
              onChange={(e) => setFormData({...formData, dateRangeStart: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date Range End
            </label>
            <input
              type="date"
              className="mt-1 block w-full px-3 py-2 border rounded-lg"
              value={formData.dateRangeEnd}
              onChange={(e) => setFormData({...formData, dateRangeEnd: e.target.value})}
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            * Required fields. Requests are typically processed within 5 business days.
          </p>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}
`;

// ============================================
// ADMIN INTERFACE FOR STAFF
// ============================================

const AdminDashboard = `
// Staff dashboard for managing FOIA requests and public documents
import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, AlertCircle, CheckCircle,
  TrendingUp, Calendar, DollarSign, FileText
} from 'lucide-react';

export default function PublicRecordsAdmin() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    const [requestsRes, statsRes] = await Promise.all([
      fetch('/api/admin/records-requests?status=pending,processing'),
      fetch('/api/admin/records-requests/stats')
    ]);
    
    setRequests(await requestsRes.json());
    setStats(await statsRes.json());
  };
  
  return (
    <div className="p-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Requests</p>
              <p className="text-2xl font-bold">{stats.openRequests || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due This Week</p>
              <p className="text-2xl font-bold">{stats.dueThisWeek || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold">{stats.avgResponseDays || 0} days</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed MTD</p>
              <p className="text-2xl font-bold">{stats.completedThisMonth || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>
      
      {/* Request Queue */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Active FOIA Requests</h2>
        </div>
        
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Request #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Requester
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map(request => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.request_number}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium">{request.requester_name}</div>
                    <div className="text-sm text-gray-500">{request.requester_email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {request.request_text}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={\`text-sm \${
                    new Date(request.response_deadline) < new Date() 
                      ? 'text-red-600 font-semibold' 
                      : 'text-gray-900'
                  }\`}>
                    {new Date(request.response_deadline).toLocaleDateString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={\`px-2 py-1 text-xs rounded-full
                    \${request.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'review' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}\`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button 
                    onClick={() => setSelectedRequest(request)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Process
                  </button>
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
// DEPLOYMENT CONFIG
// ============================================

const DOCKER_COMPOSE = `
  public-portal:
    build: ./plugins/public-portal
    environment:
      DATABASE_URL: postgresql://terrafusion:password@postgres:5432/terrafusion
      REDIS_URL: redis://redis:6379
      PUBLIC_URL: https://records.county.gov
      SMTP_HOST: \${SMTP_HOST}
      SMTP_USER: \${SMTP_USER}
      SMTP_PASS: \${SMTP_PASS}
    volumes:
      - ./public-documents:/data/documents
    ports:
      - "8083:8083"
    depends_on:
      - postgres
      - redis
`;

const NGINX_CONFIG = `
# Public portal (no auth required)
location /public-records/ {
    proxy_pass http://public-portal:8083/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
    # Cache static documents
    location ~* \.(pdf|doc|docx|xls|xlsx)$ {
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
}

# Admin interface (requires auth)
location /admin/public-records/ {
    auth_request /auth;
    proxy_pass http://public-portal:8083/admin/;
}
`;

module.exports = {
  SCHEMA_SQL,
  app,
  PublicPortal,
  AdminDashboard,
  DOCKER_COMPOSE,
  NGINX_CONFIG
};