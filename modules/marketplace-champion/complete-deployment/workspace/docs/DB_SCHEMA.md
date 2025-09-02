# Terrafusion Database Schema

## Database Overview
Terrafusion uses PostgreSQL as the primary database with Redis for caching and session management. The schema is designed for government-grade data integrity and scalability.

## Core Tables

### Users & Authentication

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    county_id UUID REFERENCES counties(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_county ON users(county_id);
CREATE INDEX idx_users_role ON users(role);
```

#### user_sessions
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

### Government Entities

#### counties
```sql
CREATE TABLE counties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    state_code VARCHAR(2) NOT NULL,
    fips_code VARCHAR(5) UNIQUE NOT NULL,
    population INTEGER,
    area_sq_miles DECIMAL(10,2),
    established_date DATE,
    website_url VARCHAR(255),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_counties_fips ON counties(fips_code);
CREATE INDEX idx_counties_state ON counties(state_code);
```

#### municipalities
```sql
CREATE TABLE municipalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id UUID NOT NULL REFERENCES counties(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- city, town, village, etc.
    population INTEGER,
    incorporation_date DATE,
    mayor VARCHAR(255),
    website_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_municipalities_county ON municipalities(county_id);
CREATE INDEX idx_municipalities_type ON municipalities(type);
```

### Property Management

#### properties
```sql
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    county_id UUID NOT NULL REFERENCES counties(id),
    municipality_id UUID REFERENCES municipalities(id),
    owner_name VARCHAR(255),
    property_address TEXT,
    legal_description TEXT,
    property_type VARCHAR(50), -- residential, commercial, industrial, etc.
    land_area DECIMAL(12,2), -- square feet
    building_area DECIMAL(12,2), -- square feet
    year_built INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    assessed_value DECIMAL(12,2),
    market_value DECIMAL(12,2),
    tax_year INTEGER,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_properties_parcel ON properties(parcel_id);
CREATE INDEX idx_properties_county ON properties(county_id);
CREATE INDEX idx_properties_municipality ON properties(municipality_id);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_location ON properties USING GIST (point(longitude, latitude));
```

#### property_assessments
```sql
CREATE TABLE property_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    assessment_year INTEGER NOT NULL,
    land_value DECIMAL(12,2),
    improvement_value DECIMAL(12,2),
    total_assessed_value DECIMAL(12,2),
    assessment_method VARCHAR(100),
    assessor_id UUID REFERENCES users(id),
    assessment_date DATE,
    is_final BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_property ON property_assessments(property_id);
CREATE INDEX idx_assessments_year ON property_assessments(assessment_year);
CREATE INDEX idx_assessments_assessor ON property_assessments(assessor_id);
```

### Tax Management

#### tax_bills
```sql
CREATE TABLE tax_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    tax_year INTEGER NOT NULL,
    total_tax_due DECIMAL(12,2),
    county_tax DECIMAL(12,2),
    municipal_tax DECIMAL(12,2),
    school_tax DECIMAL(12,2),
    special_assessments DECIMAL(12,2),
    due_date DATE,
    penalty_rate DECIMAL(5,4),
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, delinquent, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tax_bills_property ON tax_bills(property_id);
CREATE INDEX idx_tax_bills_year ON tax_bills(tax_year);
CREATE INDEX idx_tax_bills_status ON tax_bills(status);
CREATE INDEX idx_tax_bills_due_date ON tax_bills(due_date);
```

#### tax_payments
```sql
CREATE TABLE tax_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_bill_id UUID NOT NULL REFERENCES tax_bills(id),
    payment_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50), -- check, credit_card, ach, etc.
    transaction_id VARCHAR(255),
    receipt_number VARCHAR(100),
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_tax_bill ON tax_payments(tax_bill_id);
CREATE INDEX idx_payments_date ON tax_payments(payment_date);
CREATE INDEX idx_payments_method ON tax_payments(payment_method);
```

### AI & Analytics

#### ai_models
```sql
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    version VARCHAR(50) NOT NULL,
    model_type VARCHAR(100), -- property_valuation, cost_optimization, etc.
    training_data_hash VARCHAR(255),
    accuracy_score DECIMAL(5,4),
    deployment_status VARCHAR(50) DEFAULT 'development',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP,
    retired_at TIMESTAMP
);

CREATE INDEX idx_models_type ON ai_models(model_type);
CREATE INDEX idx_models_status ON ai_models(deployment_status);
```

#### ai_predictions
```sql
CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL REFERENCES ai_models(id),
    property_id UUID REFERENCES properties(id),
    prediction_type VARCHAR(100),
    input_data JSONB,
    prediction_value DECIMAL(12,2),
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_model ON ai_predictions(model_id);
CREATE INDEX idx_predictions_property ON ai_predictions(property_id);
CREATE INDEX idx_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX idx_predictions_input ON ai_predictions USING GIN (input_data);
```

### Audit & Compliance

#### audit_logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

## Redis Schema

### Session Management
```
Key Pattern: session:{token_hash}
Value: JSON object with user data and session info
TTL: 24 hours (configurable)
```

### API Caching
```
Key Pattern: api_cache:{endpoint}:{params_hash}
Value: JSON response data
TTL: 5-60 minutes (endpoint dependent)
```

### Real-time Data
```
Key Pattern: realtime:{channel}:{user_id}
Value: WebSocket connection data
TTL: Connection lifetime
```

## Data Relationships

### Primary Relationships
- Counties → Municipalities (1:many)
- Counties → Properties (1:many)
- Properties → Assessments (1:many)
- Properties → Tax Bills (1:many)
- Tax Bills → Payments (1:many)
- Users → Counties (many:1)

### Indexes & Performance
- All foreign keys have corresponding indexes
- Geographic data uses PostGIS GIST indexes
- JSONB fields use GIN indexes for efficient queries
- Composite indexes on frequently queried combinations

## Backup & Maintenance

### Backup Strategy
- Full backup: Daily at 2 AM
- Incremental backup: Every 4 hours
- Transaction log backup: Every 15 minutes
- Retention: 30 days full, 7 days incremental

### Maintenance Tasks
- VACUUM ANALYZE: Weekly
- REINDEX: Monthly
- Statistics update: Daily
- Partition maintenance: As needed

---

**Data Integrity**: Government-grade consistency and reliability  
**Performance**: Optimized for high-volume government operations  
**Compliance**: Meets federal and state data requirements
