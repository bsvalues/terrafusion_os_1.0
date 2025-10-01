-- TerraFusion Government OS - County Database Schema
-- Standard schema for all county workspaces

-- Properties management
CREATE TABLE IF NOT EXISTS properties (
    parcel_id TEXT PRIMARY KEY,
    owner_name TEXT NOT NULL,
    owner_address TEXT,
    property_address TEXT NOT NULL,
    legal_description TEXT,
    assessed_value DECIMAL(12,2) DEFAULT 0.00,
    market_value DECIMAL(12,2) DEFAULT 0.00,
    tax_due DECIMAL(10,2) DEFAULT 0.00,
    property_type TEXT DEFAULT 'RESIDENTIAL', -- RESIDENTIAL, COMMERCIAL, INDUSTRIAL, AGRICULTURAL
    square_footage INTEGER DEFAULT 0,
    lot_size DECIMAL(10,2) DEFAULT 0.00,
    year_built INTEGER,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    zoning TEXT,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permits and applications
CREATE TABLE IF NOT EXISTS permits (
    permit_id TEXT PRIMARY KEY,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT,
    applicant_phone TEXT,
    property_address TEXT,
    parcel_id TEXT,
    permit_type TEXT NOT NULL, -- BUILDING, ELECTRICAL, PLUMBING, FENCE, DECK, etc.
    description TEXT,
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    permit_fee DECIMAL(8,2) DEFAULT 0.00,
    status TEXT DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, APPROVED, DENIED, COMPLETED
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_date TIMESTAMP,
    approved_date TIMESTAMP,
    inspector_notes TEXT,
    ai_analysis TEXT, -- JSON AI assessment
    FOREIGN KEY (parcel_id) REFERENCES properties(parcel_id)
);

-- Citizens and businesses registry
CREATE TABLE IF NOT EXISTS citizens (
    citizen_id TEXT PRIMARY KEY,
    citizen_type TEXT DEFAULT 'INDIVIDUAL', -- INDIVIDUAL, BUSINESS, ORGANIZATION
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    business_license TEXT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'ACTIVE',
    notes TEXT
);

-- Public records
CREATE TABLE IF NOT EXISTS public_records (
    record_id TEXT PRIMARY KEY,
    record_type TEXT NOT NULL, -- DEED, LIEN, MARRIAGE, BIRTH, DEATH, BUSINESS_LICENSE
    title TEXT NOT NULL,
    description TEXT,
    parties_involved TEXT, -- JSON array of involved parties
    document_path TEXT,
    document_hash TEXT, -- For integrity verification
    recorded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    effective_date TIMESTAMP,
    expiration_date TIMESTAMP,
    status TEXT DEFAULT 'ACTIVE',
    access_level TEXT DEFAULT 'PUBLIC', -- PUBLIC, RESTRICTED, CONFIDENTIAL
    fees_paid DECIMAL(8,2) DEFAULT 0.00
);

-- Tax assessments and payments
CREATE TABLE IF NOT EXISTS tax_assessments (
    assessment_id TEXT PRIMARY KEY,
    parcel_id TEXT NOT NULL,
    tax_year INTEGER NOT NULL,
    assessed_value DECIMAL(12,2) NOT NULL,
    tax_rate DECIMAL(6,4) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    exemptions DECIMAL(10,2) DEFAULT 0.00,
    penalties DECIMAL(8,2) DEFAULT 0.00,
    interest DECIMAL(8,2) DEFAULT 0.00,
    total_due DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'UNPAID', -- UNPAID, PARTIAL, PAID, DELINQUENT
    due_date TIMESTAMP,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ai_validation TEXT, -- JSON AI assessment validation
    FOREIGN KEY (parcel_id) REFERENCES properties(parcel_id)
);

-- Service requests (311-style)
CREATE TABLE IF NOT EXISTS service_requests (
    request_id TEXT PRIMARY KEY,
    citizen_id TEXT,
    request_type TEXT NOT NULL, -- POTHOLE, STREETLIGHT, NOISE_COMPLAINT, etc.
    description TEXT NOT NULL,
    location TEXT,
    coordinates TEXT, -- JSON lat/lng
    priority TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    status TEXT DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    assigned_to TEXT,
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP,
    resolution_notes TEXT,
    citizen_satisfaction INTEGER, -- 1-5 rating
    FOREIGN KEY (citizen_id) REFERENCES citizens(citizen_id)
);

-- Module usage tracking for billing
CREATE TABLE IF NOT EXISTS module_usage (
    usage_id TEXT PRIMARY KEY,
    module_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id TEXT,
    session_id TEXT,
    execution_time_ms INTEGER DEFAULT 0,
    ai_assistance_used BOOLEAN DEFAULT FALSE,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    input_data_size INTEGER DEFAULT 0,
    output_data_size INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GIS and mapping data
CREATE TABLE IF NOT EXISTS gis_layers (
    layer_id TEXT PRIMARY KEY,
    layer_name TEXT NOT NULL,
    layer_type TEXT NOT NULL, -- PARCELS, ROADS, ZONING, UTILITIES, etc.
    data_source TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    feature_count INTEGER DEFAULT 0,
    geometry_type TEXT, -- POINT, LINE, POLYGON
    projection TEXT DEFAULT 'EPSG:4326',
    metadata TEXT -- JSON layer metadata
);

-- AI analysis results
CREATE TABLE IF NOT EXISTS ai_analysis (
    analysis_id TEXT PRIMARY KEY,
    analysis_type TEXT NOT NULL, -- PROPERTY_ASSESSMENT, PERMIT_REVIEW, RISK_ANALYSIS
    subject_id TEXT NOT NULL, -- parcel_id, permit_id, etc.
    ai_model TEXT,
    confidence_score DECIMAL(4,3), -- 0.000 to 1.000
    analysis_results TEXT NOT NULL, -- JSON results
    recommendations TEXT, -- JSON recommendations
    human_verified BOOLEAN DEFAULT FALSE,
    verified_by TEXT,
    verified_date TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_name);
CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(property_address);
CREATE INDEX IF NOT EXISTS idx_permits_status ON permits(status);
CREATE INDEX IF NOT EXISTS idx_permits_type ON permits(permit_type);
CREATE INDEX IF NOT EXISTS idx_permits_date ON permits(applied_date);
CREATE INDEX IF NOT EXISTS idx_tax_year ON tax_assessments(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_status ON tax_assessments(payment_status);
CREATE INDEX IF NOT EXISTS idx_service_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_type ON service_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_usage_module ON module_usage(module_name);
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON module_usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_type ON ai_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_subject ON ai_analysis(subject_id);
