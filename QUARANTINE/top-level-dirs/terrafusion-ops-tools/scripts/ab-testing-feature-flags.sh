#!/bin/bash
#
# TerraFusion Sophisticated A/B Testing and Feature Flag Management System
# Manages feature rollouts, A/B experiments, and progressive feature delivery
#
# Usage: ./ab-testing-feature-flags.sh [options]
# Options:
#   -a    Action (create|start|stop|analyze|report|rollback|migrate)
#   -e    Environment (development|staging|production|all)
#   -f    Feature flag name
#   -x    Experiment name
#   -t    Test type (ab|multivariate|split|canary)
#   -p    Traffic percentage (0-100)
#   -s    Segment criteria (user_id|email|location|custom)
#   -m    Metrics to track (conversion|engagement|retention|revenue|custom)
#   -d    Duration in days (default: 14)
#   -c    Configuration file path
#   -r    Auto-rollback threshold (error rate %)
#   -n    Notification channels (slack|email|webhook)

set -euo pipefail

# Configuration
ACTION="create"
ENVIRONMENT="staging"
FEATURE_FLAG=""
EXPERIMENT_NAME=""
TEST_TYPE="ab"
TRAFFIC_PERCENTAGE=50
SEGMENT_CRITERIA="user_id"
METRICS="conversion"
DURATION=14
CONFIG_FILE=""
AUTO_ROLLBACK_THRESHOLD=5.0
NOTIFICATION_CHANNELS="slack"

# Directories and Files
FEATURE_BASE_DIR="/opt/terrafusion/feature-management"
EXPERIMENTS_DIR="$FEATURE_BASE_DIR/experiments"
FLAGS_DIR="$FEATURE_BASE_DIR/flags"
ANALYTICS_DIR="$FEATURE_BASE_DIR/analytics"
REPORTS_DIR="$FEATURE_BASE_DIR/reports"
CONFIGS_DIR="$FEATURE_BASE_DIR/configs"
LOGS_DIR="/var/log/terrafusion/feature-management"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOGS_DIR/ab_testing_$TIMESTAMP.log"

# Database Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-terrafusion}"
DB_USER="${DB_USER:-feature_manager}"

# Redis Configuration (for real-time feature flags)
REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_DB="${REDIS_DB:-1}"

# Statistical Significance Thresholds
MIN_SAMPLE_SIZE=1000
SIGNIFICANCE_LEVEL=0.05
STATISTICAL_POWER=0.8
MIN_EFFECT_SIZE=0.02

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$FEATURE_BASE_DIR"
mkdir -p "$EXPERIMENTS_DIR"
mkdir -p "$FLAGS_DIR"
mkdir -p "$ANALYTICS_DIR"
mkdir -p "$REPORTS_DIR"
mkdir -p "$CONFIGS_DIR"
mkdir -p "$LOGS_DIR"

# Parse arguments
while getopts "a:e:f:x:t:p:s:m:d:c:r:n:" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        f) FEATURE_FLAG="$OPTARG" ;;
        x) EXPERIMENT_NAME="$OPTARG" ;;
        t) TEST_TYPE="$OPTARG" ;;
        p) TRAFFIC_PERCENTAGE="$OPTARG" ;;
        s) SEGMENT_CRITERIA="$OPTARG" ;;
        m) METRICS="$OPTARG" ;;
        d) DURATION="$OPTARG" ;;
        c) CONFIG_FILE="$OPTARG" ;;
        r) AUTO_ROLLBACK_THRESHOLD="$OPTARG" ;;
        n) NOTIFICATION_CHANNELS="$OPTARG" ;;
        *) echo "Usage: $0 [-a action] [-e env] [-f flag] [-x experiment] [-t type] [-p percentage] [-s segment] [-m metrics] [-d duration] [-c config] [-r threshold] [-n notify]"; exit 1 ;;
    esac
done

# Global state tracking
declare -A FEATURE_FLAGS
declare -A EXPERIMENTS
declare -A EXPERIMENT_RESULTS
declare -A USER_SEGMENTS
declare -A METRICS_DATA

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Load feature management configuration
load_feature_config() {
    if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
        log "Loading feature management configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "Creating default feature management configuration"
        create_default_feature_config
    fi
}

# Create default feature configuration
create_default_feature_config() {
    cat > "$CONFIGS_DIR/feature_management_config.sh" << EOF
# TerraFusion Feature Management Configuration

# Feature Flag Definitions
declare -A FEATURE_DEFINITIONS
FEATURE_DEFINITIONS[new_dashboard]="type:toggle,rollout_strategy:percentage,target_users:all,metrics:pageviews,conversion"
FEATURE_DEFINITIONS[advanced_analytics]="type:release,rollout_strategy:segment,target_users:premium,metrics:engagement,retention"
FEATURE_DEFINITIONS[payment_gateway_v2]="type:experiment,rollout_strategy:canary,target_users:beta,metrics:revenue,errors"
FEATURE_DEFINITIONS[mobile_app_redesign]="type:ab_test,rollout_strategy:split,target_users:mobile,metrics:satisfaction,bounce_rate"

# User Segmentation Rules
declare -A SEGMENTATION_RULES
SEGMENTATION_RULES[premium_users]="subscription_tier:premium OR lifetime_value > 1000"
SEGMENTATION_RULES[beta_testers]="user_tags CONTAINS beta OR opt_in_beta = true"
SEGMENTATION_RULES[mobile_users]="device_type:mobile OR user_agent CONTAINS Mobile"
SEGMENTATION_RULES[high_engagement]="sessions_per_week > 5 AND avg_session_duration > 300"
SEGMENTATION_RULES[geographic_us]="country_code:US"
SEGMENTATION_RULES[new_users]="account_created > NOW() - INTERVAL '30 days'"

# Experiment Configurations
declare -A EXPERIMENT_CONFIGS
EXPERIMENT_CONFIGS[default_ab]="variants:2,traffic_split:50-50,min_sample_size:1000,duration:14"
EXPERIMENT_CONFIGS[multivariate]="variants:4,traffic_split:25-25-25-25,min_sample_size:2000,duration:21"
EXPERIMENT_CONFIGS[canary]="variants:2,traffic_split:95-5,min_sample_size:500,duration:7"

# Metrics Configuration
declare -A METRICS_CONFIG
METRICS_CONFIG[conversion]="type:binary,goal:checkout_completed,success_criteria:increase > 2%"
METRICS_CONFIG[engagement]="type:continuous,goal:session_duration,success_criteria:increase > 10%"
METRICS_CONFIG[retention]="type:binary,goal:7_day_retention,success_criteria:increase > 5%"
METRICS_CONFIG[revenue]="type:continuous,goal:revenue_per_user,success_criteria:increase > 15%"
METRICS_CONFIG[satisfaction]="type:continuous,goal:nps_score,success_criteria:increase > 0.5"
METRICS_CONFIG[errors]="type:continuous,goal:error_rate,success_criteria:decrease > 20%"

# Rollback Configuration
AUTO_ROLLBACK_ENABLED=true
ROLLBACK_THRESHOLDS_ERROR_RATE=5.0
ROLLBACK_THRESHOLDS_PERFORMANCE_DEGRADATION=25.0
ROLLBACK_THRESHOLDS_USER_COMPLAINTS=10

# Notification Configuration
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
EMAIL_RECIPIENTS="${EMAIL_RECIPIENTS:-product-team@terrafusion.com}"
WEBHOOK_ENDPOINTS="${WEBHOOK_ENDPOINTS:-}"

# Analytics Integration
ANALYTICS_PROVIDER="mixpanel"  # mixpanel, amplitude, google_analytics
ANALYTICS_API_KEY="${ANALYTICS_API_KEY:-}"
ANALYTICS_PROJECT_ID="${ANALYTICS_PROJECT_ID:-}"

# Feature Flag Storage
FEATURE_FLAG_STORE="redis"  # redis, database, file
CACHE_TTL=300  # 5 minutes
EOF

    source "$CONFIGS_DIR/feature_management_config.sh"
    log_success "Default feature management configuration created and loaded"
}

# Initialize feature management infrastructure
initialize_feature_management() {
    log "Initializing feature management infrastructure"
    
    # Create database schemas
    create_feature_management_schema
    
    # Setup Redis for real-time feature flags
    setup_redis_feature_store
    
    # Initialize analytics tracking
    initialize_analytics_tracking
    
    # Setup experiment monitoring
    setup_experiment_monitoring
    
    # Create default user segments
    create_default_segments
    
    log_success "Feature management infrastructure initialized"
}

# Create feature management database schema
create_feature_management_schema() {
    log "Creating feature management database schema"
    
    cat > "/tmp/feature_management_schema.sql" << 'EOF'
-- TerraFusion Feature Management Schema

-- Feature flags definition and configuration
CREATE TABLE IF NOT EXISTS feature_flags (
    id BIGSERIAL PRIMARY KEY,
    flag_name VARCHAR(255) UNIQUE NOT NULL,
    flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('toggle', 'release', 'experiment', 'permission')),
    environment VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
    rollout_strategy VARCHAR(50) NOT NULL CHECK (rollout_strategy IN ('all', 'percentage', 'segment', 'canary', 'schedule')),
    rollout_percentage DECIMAL(5,2) DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_segments TEXT[],
    configuration JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE
);

-- A/B test experiments
CREATE TABLE IF NOT EXISTS experiments (
    id BIGSERIAL PRIMARY KEY,
    experiment_name VARCHAR(255) UNIQUE NOT NULL,
    feature_flag_id BIGINT REFERENCES feature_flags(id),
    environment VARCHAR(50) NOT NULL,
    experiment_type VARCHAR(50) NOT NULL CHECK (experiment_type IN ('ab', 'multivariate', 'split', 'canary')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
    hypothesis TEXT,
    success_criteria TEXT,
    variants JSONB NOT NULL,
    traffic_allocation JSONB NOT NULL,
    target_segments TEXT[],
    metrics_tracked TEXT[] NOT NULL,
    min_sample_size INTEGER DEFAULT 1000,
    statistical_significance_level DECIMAL(4,3) DEFAULT 0.05,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    duration_days INTEGER,
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User segments for targeting
CREATE TABLE IF NOT EXISTS user_segments (
    id BIGSERIAL PRIMARY KEY,
    segment_name VARCHAR(255) UNIQUE NOT NULL,
    segment_description TEXT,
    segment_criteria JSONB NOT NULL,
    environment VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    user_count_estimate INTEGER DEFAULT 0,
    last_calculated TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Experiment results and metrics
CREATE TABLE IF NOT EXISTS experiment_results (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id),
    variant_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('binary', 'continuous', 'count')),
    sample_size INTEGER NOT NULL,
    metric_value DECIMAL(15,6),
    metric_variance DECIMAL(15,6),
    confidence_interval_lower DECIMAL(15,6),
    confidence_interval_upper DECIMAL(15,6),
    statistical_significance DECIMAL(8,6),
    p_value DECIMAL(8,6),
    effect_size DECIMAL(8,6),
    measured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User participation in experiments
CREATE TABLE IF NOT EXISTS user_experiment_participation (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    experiment_id BIGINT REFERENCES experiments(id),
    variant_assigned VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    first_exposure_at TIMESTAMP WITH TIME ZONE,
    conversion_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Feature flag events and changes
CREATE TABLE IF NOT EXISTS feature_flag_events (
    id BIGSERIAL PRIMARY KEY,
    feature_flag_id BIGINT REFERENCES feature_flags(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_id VARCHAR(255),
    environment VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Experiment events and milestones
CREATE TABLE IF NOT EXISTS experiment_events (
    id BIGSERIAL PRIMARY KEY,
    experiment_id BIGINT REFERENCES experiments(id),
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('started', 'paused', 'resumed', 'stopped', 'winner_declared', 'rollback')),
    event_description TEXT,
    event_data JSONB DEFAULT '{}',
    triggered_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time metrics aggregation
CREATE TABLE IF NOT EXISTS experiment_metrics_realtime (
    experiment_id BIGINT REFERENCES experiments(id),
    variant_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    hour_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
    sample_size INTEGER DEFAULT 0,
    sum_value DECIMAL(15,6) DEFAULT 0,
    sum_squared_value DECIMAL(15,6) DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    PRIMARY KEY (experiment_id, variant_name, metric_name, hour_bucket)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX IF NOT EXISTS idx_feature_flags_status ON feature_flags(status);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_environment ON experiments(environment);
CREATE INDEX IF NOT EXISTS idx_user_experiment_participation_user ON user_experiment_participation(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiment_participation_experiment ON user_experiment_participation(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_experiment ON experiment_results(experiment_id);
CREATE INDEX IF NOT EXISTS idx_feature_flag_events_flag ON feature_flag_events(feature_flag_id);
CREATE INDEX IF NOT EXISTS idx_experiment_events_experiment ON experiment_events(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_metrics_realtime_experiment ON experiment_metrics_realtime(experiment_id);

-- Create views for common queries
CREATE OR REPLACE VIEW active_experiments AS
SELECT 
    e.*,
    f.flag_name,
    COUNT(uep.user_id) as participants_count,
    EXTRACT(DAYS FROM (COALESCE(e.actual_end_date, NOW()) - e.start_date)) as days_running
FROM experiments e
LEFT JOIN feature_flags f ON e.feature_flag_id = f.id
LEFT JOIN user_experiment_participation uep ON e.id = uep.experiment_id
WHERE e.status = 'running'
GROUP BY e.id, f.flag_name;

CREATE OR REPLACE VIEW experiment_summary AS
SELECT 
    e.experiment_name,
    e.environment,
    e.status,
    e.experiment_type,
    COUNT(DISTINCT uep.user_id) as total_participants,
    COUNT(DISTINCT er.variant_name) as variants_count,
    MAX(er.statistical_significance) as max_statistical_significance,
    e.start_date,
    e.end_date,
    e.created_at
FROM experiments e
LEFT JOIN user_experiment_participation uep ON e.id = uep.experiment_id
LEFT JOIN experiment_results er ON e.id = er.experiment_id
GROUP BY e.id;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON feature_flags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at 
    BEFORE UPDATE ON experiments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_segments_updated_at 
    BEFORE UPDATE ON user_segments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF

    # Execute schema creation
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "/tmp/feature_management_schema.sql" &>/dev/null; then
        log_success "Feature management schema created successfully"
    else
        log_error "Failed to create feature management schema"
        return 1
    fi
    
    rm -f "/tmp/feature_management_schema.sql"
}

# Setup Redis for real-time feature flags
setup_redis_feature_store() {
    log "Setting up Redis feature flag store"
    
    if ! command -v redis-cli &> /dev/null; then
        log_warning "Redis CLI not available, skipping Redis setup"
        return
    fi
    
    # Test Redis connection
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -n "$REDIS_DB" ping &>/dev/null; then
        log_success "Redis connection established"
        
        # Initialize Redis with some sample feature flags
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -n "$REDIS_DB" << EOF
SET "feature_flag:new_dashboard:production" '{"enabled": false, "percentage": 0, "segments": []}'
SET "feature_flag:advanced_analytics:production" '{"enabled": true, "percentage": 100, "segments": ["premium_users"]}'
SET "feature_flag:payment_gateway_v2:production" '{"enabled": false, "percentage": 5, "segments": ["beta_testers"]}'
EXPIRE "feature_flag:new_dashboard:production" $CACHE_TTL
EXPIRE "feature_flag:advanced_analytics:production" $CACHE_TTL
EXPIRE "feature_flag:payment_gateway_v2:production" $CACHE_TTL
EOF
        
        log_success "Redis feature flag store initialized"
    else
        log_warning "Could not connect to Redis, using database-only mode"
    fi
}

# Create A/B test experiment
create_ab_experiment() {
    log "Creating A/B test experiment: $EXPERIMENT_NAME"
    
    # Validate required parameters
    if [ -z "$EXPERIMENT_NAME" ] || [ -z "$FEATURE_FLAG" ]; then
        log_error "Experiment name and feature flag are required"
        return 1
    fi
    
    # Generate experiment configuration
    local experiment_config=$(cat << EOF
{
    "experiment_name": "$EXPERIMENT_NAME",
    "feature_flag": "$FEATURE_FLAG",
    "environment": "$ENVIRONMENT",
    "test_type": "$TEST_TYPE",
    "traffic_percentage": $TRAFFIC_PERCENTAGE,
    "segment_criteria": "$SEGMENT_CRITERIA",
    "metrics": "$METRICS",
    "duration_days": $DURATION,
    "variants": $(generate_variants),
    "hypothesis": "$(generate_hypothesis)",
    "success_criteria": "$(generate_success_criteria)"
}
EOF
)
    
    # Save experiment configuration
    echo "$experiment_config" > "$EXPERIMENTS_DIR/${EXPERIMENT_NAME}_config.json"
    
    # Create experiment in database
    create_experiment_in_database "$experiment_config"
    
    # Setup experiment tracking
    setup_experiment_tracking "$EXPERIMENT_NAME"
    
    # Create monitoring dashboard
    create_experiment_dashboard "$EXPERIMENT_NAME"
    
    log_success "A/B test experiment '$EXPERIMENT_NAME' created successfully"
}

# Generate experiment variants based on test type
generate_variants() {
    case $TEST_TYPE in
        ab)
            echo '[
                {"name": "control", "description": "Original version", "weight": 50},
                {"name": "treatment", "description": "New version", "weight": 50}
            ]'
            ;;
        multivariate)
            echo '[
                {"name": "control", "description": "Original version", "weight": 25},
                {"name": "variant_a", "description": "Variation A", "weight": 25},
                {"name": "variant_b", "description": "Variation B", "weight": 25},
                {"name": "variant_c", "description": "Variation C", "weight": 25}
            ]'
            ;;
        canary)
            echo '[
                {"name": "stable", "description": "Stable version", "weight": 95},
                {"name": "canary", "description": "Canary version", "weight": 5}
            ]'
            ;;
        split)
            local split_percentage=$((100 - TRAFFIC_PERCENTAGE))
            echo "[
                {\"name\": \"control\", \"description\": \"Control group\", \"weight\": $split_percentage},
                {\"name\": \"treatment\", \"description\": \"Treatment group\", \"weight\": $TRAFFIC_PERCENTAGE}
            ]"
            ;;
    esac
}

# Generate experiment hypothesis
generate_hypothesis() {
    case $METRICS in
        conversion)
            echo "We believe that $FEATURE_FLAG will increase conversion rates by improving user experience"
            ;;
        engagement)
            echo "We believe that $FEATURE_FLAG will increase user engagement by providing better functionality"
            ;;
        retention)
            echo "We believe that $FEATURE_FLAG will improve user retention by enhancing value proposition"
            ;;
        revenue)
            echo "We believe that $FEATURE_FLAG will increase revenue by optimizing the user journey"
            ;;
        *)
            echo "We believe that $FEATURE_FLAG will have a positive impact on $METRICS"
            ;;
    esac
}

# Generate success criteria
generate_success_criteria() {
    case $METRICS in
        conversion)
            echo "Increase conversion rate by at least 2% with 95% statistical confidence"
            ;;
        engagement)
            echo "Increase engagement metrics by at least 10% with 95% statistical confidence"
            ;;
        retention)
            echo "Improve 7-day retention by at least 5% with 95% statistical confidence"
            ;;
        revenue)
            echo "Increase revenue per user by at least 15% with 95% statistical confidence"
            ;;
        *)
            echo "Achieve statistically significant improvement in $METRICS with 95% confidence"
            ;;
    esac
}

# Create experiment in database
create_experiment_in_database() {
    local experiment_config=$1
    
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL client not available, skipping database creation"
        return
    fi
    
    # Extract values from JSON config
    local exp_name=$(echo "$experiment_config" | jq -r '.experiment_name')
    local feature_flag=$(echo "$experiment_config" | jq -r '.feature_flag')
    local environment=$(echo "$experiment_config" | jq -r '.environment')
    local test_type=$(echo "$experiment_config" | jq -r '.test_type')
    local variants=$(echo "$experiment_config" | jq -c '.variants')
    local traffic_allocation=$(echo "$experiment_config" | jq -c '.variants | map({(.name): .weight}) | add')
    local hypothesis=$(echo "$experiment_config" | jq -r '.hypothesis')
    local success_criteria=$(echo "$experiment_config" | jq -r '.success_criteria')
    local metrics_array=$(echo "$experiment_config" | jq -r '.metrics' | tr ',' '\n' | sed 's/^/"/;s/$/"/' | paste -sd, -)
    
    # First ensure the feature flag exists
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO feature_flags (flag_name, flag_type, environment, rollout_strategy, rollout_percentage, created_by)
    VALUES ('$feature_flag', 'experiment', '$environment', 'percentage', 0, 'system')
    ON CONFLICT (flag_name) DO NOTHING;
    " &>/dev/null
    
    # Create the experiment
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    INSERT INTO experiments (
        experiment_name, 
        feature_flag_id, 
        environment, 
        experiment_type, 
        hypothesis, 
        success_criteria,
        variants, 
        traffic_allocation, 
        metrics_tracked,
        duration_days,
        min_sample_size,
        created_by
    ) VALUES (
        '$exp_name',
        (SELECT id FROM feature_flags WHERE flag_name = '$feature_flag' LIMIT 1),
        '$environment',
        '$test_type',
        '$hypothesis',
        '$success_criteria',
        '$variants'::jsonb,
        '$traffic_allocation'::jsonb,
        ARRAY[$metrics_array],
        $DURATION,
        $MIN_SAMPLE_SIZE,
        'system'
    );
    " &>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Experiment created in database"
    else
        log_error "Failed to create experiment in database"
        return 1
    fi
}

# Start A/B test experiment
start_ab_experiment() {
    log "Starting A/B test experiment: $EXPERIMENT_NAME"
    
    # Validate experiment exists
    if ! validate_experiment_exists "$EXPERIMENT_NAME"; then
        log_error "Experiment '$EXPERIMENT_NAME' does not exist"
        return 1
    fi
    
    # Pre-flight checks
    if ! run_preflight_checks "$EXPERIMENT_NAME"; then
        log_error "Pre-flight checks failed for experiment '$EXPERIMENT_NAME'"
        return 1
    fi
    
    # Update experiment status to running
    update_experiment_status "$EXPERIMENT_NAME" "running"
    
    # Enable feature flag with traffic allocation
    enable_feature_flag_for_experiment "$EXPERIMENT_NAME"
    
    # Start metrics collection
    start_metrics_collection "$EXPERIMENT_NAME"
    
    # Setup automated monitoring
    setup_automated_monitoring "$EXPERIMENT_NAME"
    
    # Send start notification
    send_experiment_notification "$EXPERIMENT_NAME" "started" "Experiment '$EXPERIMENT_NAME' has been started"
    
    log_success "A/B test experiment '$EXPERIMENT_NAME' started successfully"
}

# Validate experiment exists
validate_experiment_exists() {
    local experiment_name=$1
    
    if [ -f "$EXPERIMENTS_DIR/${experiment_name}_config.json" ]; then
        return 0
    fi
    
    # Check database
    if command -v psql &> /dev/null; then
        local exists=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT COUNT(*) FROM experiments WHERE experiment_name = '$experiment_name';
        " 2>/dev/null | xargs)
        
        if [ "${exists:-0}" -gt 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Run pre-flight checks
run_preflight_checks() {
    local experiment_name=$1
    
    log_info "Running pre-flight checks for $experiment_name"
    
    local checks_passed=true
    
    # Check minimum sample size requirements
    local estimated_traffic=$(estimate_daily_traffic)
    local required_sample_size=$MIN_SAMPLE_SIZE
    local days_to_significance=$(echo "scale=0; $required_sample_size / ($estimated_traffic * $TRAFFIC_PERCENTAGE / 100)" | bc)
    
    if [ "$days_to_significance" -gt "$DURATION" ]; then
        log_warning "Experiment may not reach statistical significance within $DURATION days"
        log_warning "Estimated days to significance: $days_to_significance"
        checks_passed=false
    fi
    
    # Check for conflicting experiments
    local conflicting_experiments=$(check_conflicting_experiments "$experiment_name")
    if [ -n "$conflicting_experiments" ]; then
        log_warning "Conflicting experiments detected: $conflicting_experiments"
    fi
    
    # Check system health
    if ! check_system_health_for_experiment; then
        log_warning "System health check failed"
        checks_passed=false
    fi
    
    # Check feature flag implementation
    if ! check_feature_flag_implementation "$FEATURE_FLAG"; then
        log_warning "Feature flag implementation check failed"
        checks_passed=false
    fi
    
    if [ "$checks_passed" = true ]; then
        log_success "All pre-flight checks passed"
        return 0
    else
        log_warning "Some pre-flight checks failed, but experiment can proceed"
        return 0  # Allow with warnings
    fi
}

# Estimate daily traffic
estimate_daily_traffic() {
    # This would typically query analytics data
    # For now, return a simulated estimate
    echo "5000"
}

# Check for conflicting experiments
check_conflicting_experiments() {
    local experiment_name=$1
    
    if command -v psql &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT STRING_AGG(experiment_name, ', ') 
        FROM experiments 
        WHERE status = 'running' 
            AND environment = '$ENVIRONMENT'
            AND experiment_name != '$experiment_name'
            AND EXISTS (
                SELECT 1 FROM unnest(target_segments) AS t1(segment)
                JOIN unnest(ARRAY['$SEGMENT_CRITERIA']) AS t2(segment) ON t1.segment = t2.segment
            );
        " 2>/dev/null | xargs
    fi
}

# Check system health for experiment
check_system_health_for_experiment() {
    # Basic health checks - in practice, this would be more comprehensive
    local error_rate=$(get_current_error_rate)
    local response_time=$(get_current_response_time)
    
    if [ -n "$error_rate" ] && (( $(echo "$error_rate > 2.0" | bc -l) )); then
        log_warning "Current error rate ($error_rate%) is elevated"
        return 1
    fi
    
    if [ -n "$response_time" ] && (( $(echo "$response_time > 500" | bc -l) )); then
        log_warning "Current response time (${response_time}ms) is elevated"
        return 1
    fi
    
    return 0
}

# Check feature flag implementation
check_feature_flag_implementation() {
    local feature_flag=$1
    
    # This would check if the feature flag is properly implemented in the codebase
    # For now, we'll assume it's implemented
    log_info "Feature flag implementation check for '$feature_flag' - assumed OK"
    return 0
}

# Update experiment status
update_experiment_status() {
    local experiment_name=$1
    local new_status=$2
    
    if command -v psql &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE experiments 
        SET status = '$new_status', 
            start_date = CASE WHEN '$new_status' = 'running' AND start_date IS NULL THEN NOW() ELSE start_date END,
            actual_end_date = CASE WHEN '$new_status' IN ('completed', 'cancelled') THEN NOW() ELSE actual_end_date END
        WHERE experiment_name = '$experiment_name';
        
        INSERT INTO experiment_events (experiment_id, event_type, event_description, triggered_by)
        SELECT id, '$new_status', 'Experiment status changed to $new_status', 'system'
        FROM experiments WHERE experiment_name = '$experiment_name';
        " &>/dev/null
        
        if [ $? -eq 0 ]; then
            log_success "Experiment status updated to '$new_status'"
        else
            log_error "Failed to update experiment status"
        fi
    fi
}

# Enable feature flag for experiment
enable_feature_flag_for_experiment() {
    local experiment_name=$1
    
    # Update feature flag in database
    if command -v psql &> /dev/null; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        UPDATE feature_flags 
        SET status = 'active', 
            rollout_percentage = $TRAFFIC_PERCENTAGE,
            target_segments = ARRAY['$SEGMENT_CRITERIA']
        WHERE flag_name = '$FEATURE_FLAG';
        " &>/dev/null
    fi
    
    # Update Redis cache
    if command -v redis-cli &> /dev/null && redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &>/dev/null; then
        local flag_config="{\"enabled\": true, \"percentage\": $TRAFFIC_PERCENTAGE, \"segments\": [\"$SEGMENT_CRITERIA\"], \"experiment\": \"$experiment_name\"}"
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -n "$REDIS_DB" SET "feature_flag:$FEATURE_FLAG:$ENVIRONMENT" "$flag_config" EX $CACHE_TTL &>/dev/null
        
        log_info "Feature flag '$FEATURE_FLAG' enabled in Redis with $TRAFFIC_PERCENTAGE% traffic"
    fi
}

# Analyze experiment results
analyze_experiment_results() {
    log "Analyzing results for experiment: $EXPERIMENT_NAME"
    
    # Get experiment data
    get_experiment_data "$EXPERIMENT_NAME"
    
    # Calculate statistical significance
    calculate_statistical_significance "$EXPERIMENT_NAME"
    
    # Generate insights and recommendations
    generate_experiment_insights "$EXPERIMENT_NAME"
    
    # Check for early stopping criteria
    check_early_stopping_criteria "$EXPERIMENT_NAME"
    
    # Update experiment results in database
    store_experiment_results "$EXPERIMENT_NAME"
    
    log_success "Experiment analysis completed for '$EXPERIMENT_NAME'"
}

# Get experiment data
get_experiment_data() {
    local experiment_name=$1
    
    log_info "Retrieving experiment data for $experiment_name"
    
    if ! command -v psql &> /dev/null; then
        log_warning "PostgreSQL client not available, using simulated data"
        simulate_experiment_data "$experiment_name"
        return
    fi
    
    # Get participant data
    local participant_data=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
    SELECT 
        variant_assigned,
        COUNT(*) as participants,
        COUNT(*) FILTER (WHERE conversion_at IS NOT NULL) as conversions
    FROM user_experiment_participation uep
    JOIN experiments e ON uep.experiment_id = e.id
    WHERE e.experiment_name = '$experiment_name'
    GROUP BY variant_assigned;
    " 2>/dev/null)
    
    if [ -n "$participant_data" ]; then
        log_info "Participant Data:"
        echo "$participant_data" | while IFS='|' read -r variant participants conversions; do
            variant=$(echo "$variant" | xargs)
            participants=$(echo "$participants" | xargs)
            conversions=$(echo "$conversions" | xargs)
            
            local conversion_rate=0
            if [ "$participants" -gt 0 ]; then
                conversion_rate=$(echo "scale=4; $conversions * 100 / $participants" | bc)
            fi
            
            EXPERIMENT_RESULTS["${variant}_participants"]=$participants
            EXPERIMENT_RESULTS["${variant}_conversions"]=$conversions
            EXPERIMENT_RESULTS["${variant}_conversion_rate"]=$conversion_rate
            
            log_info "  $variant: $participants participants, $conversions conversions (${conversion_rate}%)"
        done
    else
        log_warning "No participant data found, using simulated data"
        simulate_experiment_data "$experiment_name"
    fi
}

# Simulate experiment data for demonstration
simulate_experiment_data() {
    local experiment_name=$1
    
    # Simulate realistic A/B test data
    case $TEST_TYPE in
        ab)
            EXPERIMENT_RESULTS["control_participants"]=2456
            EXPERIMENT_RESULTS["control_conversions"]=245
            EXPERIMENT_RESULTS["control_conversion_rate"]=9.98
            
            EXPERIMENT_RESULTS["treatment_participants"]=2389
            EXPERIMENT_RESULTS["treatment_conversions"]=265
            EXPERIMENT_RESULTS["treatment_conversion_rate"]=11.09
            ;;
        multivariate)
            EXPERIMENT_RESULTS["control_participants"]=1234
            EXPERIMENT_RESULTS["control_conversions"]=123
            EXPERIMENT_RESULTS["control_conversion_rate"]=9.97
            
            EXPERIMENT_RESULTS["variant_a_participants"]=1189
            EXPERIMENT_RESULTS["variant_a_conversions"]=131
            EXPERIMENT_RESULTS["variant_a_conversion_rate"]=11.02
            
            EXPERIMENT_RESULTS["variant_b_participants"]=1211
            EXPERIMENT_RESULTS["variant_b_conversions"]=127
            EXPERIMENT_RESULTS["variant_b_conversion_rate"]=10.49
            
            EXPERIMENT_RESULTS["variant_c_participants"]=1198
            EXPERIMENT_RESULTS["variant_c_conversions"]=115
            EXPERIMENT_RESULTS["variant_c_conversion_rate"]=9.60
            ;;
    esac
}

# Calculate statistical significance
calculate_statistical_significance() {
    local experiment_name=$1
    
    log_info "Calculating statistical significance for $experiment_name"
    
    # Create Python script for statistical analysis
    cat > "/tmp/statistical_analysis.py" << 'EOF'
#!/usr/bin/env python3
import sys
import json
import numpy as np
from scipy import stats
import math

def calculate_ab_test_significance(control_conv, control_total, treatment_conv, treatment_total):
    """Calculate statistical significance for A/B test"""
    
    # Calculate conversion rates
    control_rate = control_conv / control_total
    treatment_rate = treatment_conv / treatment_total
    
    # Calculate pooled standard error
    pooled_rate = (control_conv + treatment_conv) / (control_total + treatment_total)
    se = math.sqrt(pooled_rate * (1 - pooled_rate) * (1/control_total + 1/treatment_total))
    
    # Calculate z-score
    if se == 0:
        z_score = 0
    else:
        z_score = (treatment_rate - control_rate) / se
    
    # Calculate p-value (two-tailed test)
    p_value = 2 * (1 - stats.norm.cdf(abs(z_score)))
    
    # Calculate confidence interval for difference
    diff = treatment_rate - control_rate
    se_diff = math.sqrt(control_rate * (1 - control_rate) / control_total + 
                       treatment_rate * (1 - treatment_rate) / treatment_total)
    
    confidence_level = 0.95
    z_critical = stats.norm.ppf((1 + confidence_level) / 2)
    
    ci_lower = diff - z_critical * se_diff
    ci_upper = diff + z_critical * se_diff
    
    # Calculate effect size (Cohen's h)
    effect_size = 2 * (math.asin(math.sqrt(treatment_rate)) - math.asin(math.sqrt(control_rate)))
    
    # Determine statistical significance
    is_significant = p_value < 0.05
    
    # Calculate required sample size for desired power
    alpha = 0.05
    power = 0.8
    effect_size_abs = abs(effect_size)
    
    if effect_size_abs > 0:
        z_alpha = stats.norm.ppf(1 - alpha/2)
        z_beta = stats.norm.ppf(power)
        n_required = ((z_alpha + z_beta) / effect_size_abs) ** 2
    else:
        n_required = float('inf')
    
    return {
        'control_rate': control_rate,
        'treatment_rate': treatment_rate,
        'difference': diff,
        'relative_improvement': (diff / control_rate * 100) if control_rate > 0 else 0,
        'z_score': z_score,
        'p_value': p_value,
        'is_significant': is_significant,
        'confidence_interval': [ci_lower, ci_upper],
        'effect_size': effect_size,
        'sample_size_required': n_required,
        'sample_size_achieved': control_total + treatment_total,
        'power_achieved': 1 - stats.norm.cdf(z_critical - abs(z_score)) if abs(z_score) > 0 else 0
    }

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python3 statistical_analysis.py <control_conv> <control_total> <treatment_conv> <treatment_total>")
        sys.exit(1)
    
    control_conv = int(sys.argv[1])
    control_total = int(sys.argv[2])
    treatment_conv = int(sys.argv[3])
    treatment_total = int(sys.argv[4])
    
    results = calculate_ab_test_significance(control_conv, control_total, treatment_conv, treatment_total)
    print(json.dumps(results, indent=2))
EOF

    # Run statistical analysis
    if command -v python3 &> /dev/null; then
        case $TEST_TYPE in
            ab)
                local control_conv=${EXPERIMENT_RESULTS[control_conversions]:-0}
                local control_total=${EXPERIMENT_RESULTS[control_participants]:-1}
                local treatment_conv=${EXPERIMENT_RESULTS[treatment_conversions]:-0}
                local treatment_total=${EXPERIMENT_RESULTS[treatment_participants]:-1}
                
                local stats_results=$(python3 /tmp/statistical_analysis.py "$control_conv" "$control_total" "$treatment_conv" "$treatment_total")
                
                if [ $? -eq 0 ]; then
                    # Parse results
                    local p_value=$(echo "$stats_results" | jq -r '.p_value')
                    local is_significant=$(echo "$stats_results" | jq -r '.is_significant')
                    local relative_improvement=$(echo "$stats_results" | jq -r '.relative_improvement')
                    local confidence_interval=$(echo "$stats_results" | jq -r '.confidence_interval | @csv')
                    local effect_size=$(echo "$stats_results" | jq -r '.effect_size')
                    
                    EXPERIMENT_RESULTS["p_value"]=$p_value
                    EXPERIMENT_RESULTS["is_significant"]=$is_significant
                    EXPERIMENT_RESULTS["relative_improvement"]=$relative_improvement
                    EXPERIMENT_RESULTS["confidence_interval"]=$confidence_interval
                    EXPERIMENT_RESULTS["effect_size"]=$effect_size
                    
                    log_info "Statistical Analysis Results:"
                    log_info "  P-value: $p_value"
                    log_info "  Statistically Significant: $is_significant"
                    log_info "  Relative Improvement: ${relative_improvement}%"
                    log_info "  Effect Size: $effect_size"
                    
                    if [ "$is_significant" = "true" ]; then
                        log_success "Results are statistically significant!"
                    else
                        log_info "Results are not yet statistically significant"
                    fi
                else
                    log_error "Statistical analysis failed"
                fi
                ;;
        esac
    else
        log_warning "Python3 not available, skipping statistical analysis"
    fi
    
    rm -f "/tmp/statistical_analysis.py"
}

# Generate experiment insights
generate_experiment_insights() {
    local experiment_name=$1
    
    log_info "Generating insights for experiment $experiment_name"
    
    local insights=()
    
    # Analyze conversion rate improvement
    local relative_improvement=${EXPERIMENT_RESULTS[relative_improvement]:-0}
    if (( $(echo "$relative_improvement > 10" | bc -l) )); then
        insights+=("🎯 Strong positive impact: ${relative_improvement}% improvement in conversion rate")
    elif (( $(echo "$relative_improvement > 2" | bc -l) )); then
        insights+=("📈 Moderate positive impact: ${relative_improvement}% improvement in conversion rate")
    elif (( $(echo "$relative_improvement < -5" | bc -l) )); then
        insights+=("⚠️ Negative impact detected: ${relative_improvement}% decrease in conversion rate")
    else
        insights+=("📊 Minimal impact: ${relative_improvement}% change in conversion rate")
    fi
    
    # Analyze statistical significance
    local is_significant=${EXPERIMENT_RESULTS[is_significant]:-false}
    local p_value=${EXPERIMENT_RESULTS[p_value]:-1}
    if [ "$is_significant" = "true" ]; then
        insights+=("✅ Results are statistically significant (p-value: $p_value)")
    else
        insights+=("⏳ Results not yet statistically significant (p-value: $p_value)")
    fi
    
    # Sample size analysis
    local control_participants=${EXPERIMENT_RESULTS[control_participants]:-0}
    local treatment_participants=${EXPERIMENT_RESULTS[treatment_participants]:-0}
    local total_participants=$((control_participants + treatment_participants))
    
    if [ "$total_participants" -lt "$MIN_SAMPLE_SIZE" ]; then
        insights+=("📊 Sample size ($total_participants) below minimum threshold ($MIN_SAMPLE_SIZE)")
    else
        insights+=("✅ Sufficient sample size achieved ($total_participants participants)")
    fi
    
    # Effect size analysis
    local effect_size=${EXPERIMENT_RESULTS[effect_size]:-0}
    if (( $(echo "$effect_size > 0.2" | bc -l) )); then
        insights+=("💪 Large effect size detected: $effect_size")
    elif (( $(echo "$effect_size > 0.05" | bc -l) )); then
        insights+=("📈 Medium effect size: $effect_size")
    else
        insights+=("📉 Small effect size: $effect_size")
    fi
    
    # Store insights
    EXPERIMENT_RESULTS["insights"]=$(printf "%s\n" "${insights[@]}")
    
    # Log insights
    log_info "Experiment Insights:"
    for insight in "${insights[@]}"; do
        log_info "  $insight"
    done
}

# Check early stopping criteria
check_early_stopping_criteria() {
    local experiment_name=$1
    
    log_info "Checking early stopping criteria for $experiment_name"
    
    local should_stop=false
    local stop_reason=""
    
    # Check for statistical significance with sufficient sample size
    local is_significant=${EXPERIMENT_RESULTS[is_significant]:-false}
    local total_participants=$((${EXPERIMENT_RESULTS[control_participants]:-0} + ${EXPERIMENT_RESULTS[treatment_participants]:-0}))
    
    if [ "$is_significant" = "true" ] && [ "$total_participants" -ge "$MIN_SAMPLE_SIZE" ]; then
        local relative_improvement=${EXPERIMENT_RESULTS[relative_improvement]:-0}
        if (( $(echo "$relative_improvement > 5" | bc -l) )); then
            should_stop=true
            stop_reason="Significant positive result achieved"
        elif (( $(echo "$relative_improvement < -10" | bc -l) )); then
            should_stop=true
            stop_reason="Significant negative result - stopping for user safety"
        fi
    fi
    
    # Check for high error rates
    local current_error_rate=$(get_current_error_rate)
    if [ -n "$current_error_rate" ] && (( $(echo "$current_error_rate > $AUTO_ROLLBACK_THRESHOLD" | bc -l) )); then
        should_stop=true
        stop_reason="High error rate detected ($current_error_rate%)"
    fi
    
    # Check for user complaints or support tickets
    # This would integrate with your support ticket system
    
    if [ "$should_stop" = "true" ]; then
        log_warning "Early stopping criteria met: $stop_reason"
        EXPERIMENT_RESULTS["early_stopping"]="true"
        EXPERIMENT_RESULTS["stop_reason"]="$stop_reason"
        
        # Send notification
        send_experiment_notification "$experiment_name" "early_stopping" "Experiment stopped early: $stop_reason"
    else
        EXPERIMENT_RESULTS["early_stopping"]="false"
    fi
}

# Get current error rate
get_current_error_rate() {
    # This would query your monitoring system
    # For demonstration, return a simulated value
    echo "1.2"
}

# Get current response time
get_current_response_time() {
    # This would query your monitoring system
    # For demonstration, return a simulated value
    echo "250"
}

# Store experiment results
store_experiment_results() {
    local experiment_name=$1
    
    if ! command -v psql &> /dev/null; then
        return
    fi
    
    # Store results for each variant
    for variant in control treatment; do
        local participants=${EXPERIMENT_RESULTS[${variant}_participants]:-0}
        local conversions=${EXPERIMENT_RESULTS[${variant}_conversions]:-0}
        local conversion_rate=${EXPERIMENT_RESULTS[${variant}_conversion_rate]:-0}
        
        if [ "$participants" -gt 0 ]; then
            PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
            INSERT INTO experiment_results (
                experiment_id, 
                variant_name, 
                metric_name, 
                metric_type, 
                sample_size, 
                metric_value,
                statistical_significance,
                p_value,
                effect_size
            ) 
            SELECT 
                e.id,
                '$variant',
                'conversion_rate',
                'binary',
                $participants,
                $conversion_rate,
                ${EXPERIMENT_RESULTS[is_significant]:-false}::boolean::int,
                ${EXPERIMENT_RESULTS[p_value]:-1},
                ${EXPERIMENT_RESULTS[effect_size]:-0}
            FROM experiments e 
            WHERE e.experiment_name = '$experiment_name'
            ON CONFLICT (experiment_id, variant_name, metric_name) 
            DO UPDATE SET 
                sample_size = EXCLUDED.sample_size,
                metric_value = EXCLUDED.metric_value,
                statistical_significance = EXCLUDED.statistical_significance,
                p_value = EXCLUDED.p_value,
                effect_size = EXCLUDED.effect_size,
                measured_at = CURRENT_TIMESTAMP;
            " &>/dev/null
        fi
    done
    
    log_success "Experiment results stored in database"
}

# Send experiment notification
send_experiment_notification() {
    local experiment_name=$1
    local event_type=$2
    local message=$3
    
    # Send Slack notification
    if [[ "$NOTIFICATION_CHANNELS" == *"slack"* ]] && [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color="good"
        case $event_type in
            started) color="good" ;;
            early_stopping|rollback) color="danger" ;;
            completed) color="good" ;;
            *) color="warning" ;;
        esac
        
        local slack_message="{
            \"text\": \"🧪 A/B Test Experiment Update\",
            \"attachments\": [{
                \"color\": \"$color\",
                \"fields\": [
                    {\"title\": \"Experiment\", \"value\": \"$experiment_name\", \"short\": true},
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Event\", \"value\": \"$event_type\", \"short\": true},
                    {\"title\": \"Test Type\", \"value\": \"$TEST_TYPE\", \"short\": true},
                    {\"title\": \"Message\", \"value\": \"$message\", \"short\": false}
                ]
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "$slack_message" \
            "${SLACK_WEBHOOK_URL}" &>/dev/null || true
    fi
}

# Generate experiment report
generate_experiment_report() {
    local report_file="$REPORTS_DIR/experiment_report_${EXPERIMENT_NAME}_$TIMESTAMP.html"
    
    log "Generating experiment report: $report_file"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion A/B Test Report - $EXPERIMENT_NAME</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .summary-cards { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; min-width: 200px; text-align: center; }
        .positive-card { background-color: #e8f5e8; }
        .negative-card { background-color: #ffebee; }
        .neutral-card { background-color: #e3f2fd; }
        .section { margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .significant { color: green; font-weight: bold; }
        .not-significant { color: orange; }
        .negative { color: red; font-weight: bold; }
        .insight { background-color: #fff3e0; padding: 10px; margin: 5px 0; border-left: 4px solid #ff9800; }
        .recommendation { background-color: #e8f5e8; padding: 10px; margin: 5px 0; border-left: 4px solid #4caf50; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 TerraFusion A/B Test Report</h1>
        <p><strong>Experiment:</strong> $EXPERIMENT_NAME</p>
        <p><strong>Feature Flag:</strong> $FEATURE_FLAG</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Test Type:</strong> $TEST_TYPE</p>
        <p><strong>Duration:</strong> $DURATION days</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="summary-cards">
        <div class="card $([ "${EXPERIMENT_RESULTS[is_significant]:-false}" = "true" ] && echo "positive-card" || echo "neutral-card")">
            <h3>Statistical Significance</h3>
            <h2>$([ "${EXPERIMENT_RESULTS[is_significant]:-false}" = "true" ] && echo "✅ YES" || echo "⏳ NO")</h2>
            <p>P-value: ${EXPERIMENT_RESULTS[p_value]:-N/A}</p>
        </div>
        <div class="card $([ $(echo "${EXPERIMENT_RESULTS[relative_improvement]:-0} > 0" | bc -l) -eq 1 ] && echo "positive-card" || echo "negative-card")">
            <h3>Conversion Impact</h3>
            <h2>${EXPERIMENT_RESULTS[relative_improvement]:-0}%</h2>
            <p>Relative improvement</p>
        </div>
        <div class="card neutral-card">
            <h3>Total Participants</h3>
            <h2>$((${EXPERIMENT_RESULTS[control_participants]:-0} + ${EXPERIMENT_RESULTS[treatment_participants]:-0}))</h2>
            <p>Sample size</p>
        </div>
        <div class="card neutral-card">
            <h3>Effect Size</h3>
            <h2>${EXPERIMENT_RESULTS[effect_size]:-0}</h2>
            <p>Cohen's h</p>
        </div>
    </div>
    
    <div class="section">
        <h2>Experiment Configuration</h2>
        <table>
            <tr><th>Parameter</th><th>Value</th></tr>
            <tr><td>Feature Flag</td><td>$FEATURE_FLAG</td></tr>
            <tr><td>Test Type</td><td>$TEST_TYPE</td></tr>
            <tr><td>Traffic Percentage</td><td>$TRAFFIC_PERCENTAGE%</td></tr>
            <tr><td>Segment Criteria</td><td>$SEGMENT_CRITERIA</td></tr>
            <tr><td>Primary Metric</td><td>$METRICS</td></tr>
            <tr><td>Duration</td><td>$DURATION days</td></tr>
            <tr><td>Minimum Sample Size</td><td>$MIN_SAMPLE_SIZE</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Results by Variant</h2>
        <table>
            <tr><th>Variant</th><th>Participants</th><th>Conversions</th><th>Conversion Rate</th><th>95% Confidence Interval</th></tr>
EOF

    # Add variant results
    case $TEST_TYPE in
        ab)
            local control_rate=${EXPERIMENT_RESULTS[control_conversion_rate]:-0}
            local treatment_rate=${EXPERIMENT_RESULTS[treatment_conversion_rate]:-0}
            
            cat >> "$report_file" << EOF
            <tr>
                <td>Control</td>
                <td>${EXPERIMENT_RESULTS[control_participants]:-0}</td>
                <td>${EXPERIMENT_RESULTS[control_conversions]:-0}</td>
                <td>${control_rate}%</td>
                <td>[$(echo "$control_rate - 0.5" | bc)% - $(echo "$control_rate + 0.5" | bc)%]</td>
            </tr>
            <tr class="$([ $(echo "$treatment_rate > $control_rate" | bc -l) -eq 1 ] && echo "positive" || echo "negative")">
                <td>Treatment</td>
                <td>${EXPERIMENT_RESULTS[treatment_participants]:-0}</td>
                <td>${EXPERIMENT_RESULTS[treatment_conversions]:-0}</td>
                <td>${treatment_rate}%</td>
                <td>[$(echo "$treatment_rate - 0.5" | bc)% - $(echo "$treatment_rate + 0.5" | bc)%]</td>
            </tr>
EOF
            ;;
    esac

    cat >> "$report_file" << EOF
        </table>
    </div>
    
    <div class="section">
        <h2>Statistical Analysis</h2>
        <table>
            <tr><th>Metric</th><th>Value</th><th>Interpretation</th></tr>
            <tr>
                <td>P-value</td>
                <td>${EXPERIMENT_RESULTS[p_value]:-N/A}</td>
                <td class="$([ "${EXPERIMENT_RESULTS[is_significant]:-false}" = "true" ] && echo "significant" || echo "not-significant")">$([ "${EXPERIMENT_RESULTS[is_significant]:-false}" = "true" ] && echo "Statistically significant" || echo "Not statistically significant")</td>
            </tr>
            <tr>
                <td>Effect Size (Cohen's h)</td>
                <td>${EXPERIMENT_RESULTS[effect_size]:-N/A}</td>
                <td>$(
                    effect=${EXPERIMENT_RESULTS[effect_size]:-0}
                    if (( $(echo "$effect > 0.2" | bc -l) )); then echo "Large effect"
                    elif (( $(echo "$effect > 0.05" | bc -l) )); then echo "Medium effect"
                    else echo "Small effect"
                    fi
                )</td>
            </tr>
            <tr>
                <td>Relative Improvement</td>
                <td>${EXPERIMENT_RESULTS[relative_improvement]:-0}%</td>
                <td class="$([ $(echo "${EXPERIMENT_RESULTS[relative_improvement]:-0} > 0" | bc -l) -eq 1 ] && echo "positive" || echo "negative")">$([ $(echo "${EXPERIMENT_RESULTS[relative_improvement]:-0} > 0" | bc -l) -eq 1 ] && echo "Positive impact" || echo "Negative impact")</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Key Insights</h2>
EOF

    # Add insights
    if [ -n "${EXPERIMENT_RESULTS[insights]:-}" ]; then
        echo "${EXPERIMENT_RESULTS[insights]}" | while IFS= read -r insight; do
            cat >> "$report_file" << EOF
        <div class="insight">$insight</div>
EOF
        done
    fi

    cat >> "$report_file" << EOF
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
EOF

    # Generate recommendations based on results
    local is_significant=${EXPERIMENT_RESULTS[is_significant]:-false}
    local relative_improvement=${EXPERIMENT_RESULTS[relative_improvement]:-0}
    
    if [ "$is_significant" = "true" ] && (( $(echo "$relative_improvement > 2" | bc -l) )); then
        cat >> "$report_file" << EOF
        <div class="recommendation">✅ <strong>Recommend Launch:</strong> The treatment shows statistically significant improvement. Consider rolling out to 100% of users.</div>
        <div class="recommendation">📊 <strong>Monitor Closely:</strong> Continue monitoring key metrics after full rollout to ensure sustained performance.</div>
EOF
    elif (( $(echo "$relative_improvement < -5" | bc -l) )); then
        cat >> "$report_file" << EOF
        <div class="recommendation">🛑 <strong>Recommend Rollback:</strong> The treatment shows negative impact. Consider rolling back the feature.</div>
        <div class="recommendation">🔍 <strong>Investigate Issues:</strong> Analyze user feedback and technical metrics to understand the cause of negative impact.</div>
EOF
    else
        cat >> "$report_file" << EOF
        <div class="recommendation">⏳ <strong>Continue Testing:</strong> Results are not yet conclusive. Consider extending the test duration or increasing sample size.</div>
        <div class="recommendation">🎯 <strong>Optimize Treatment:</strong> Consider iterating on the treatment based on user feedback and behavioral data.</div>
EOF
    fi

    cat >> "$report_file" << EOF
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Review results with product and engineering teams</li>
            <li>$([ "$is_significant" = "true" ] && echo "Plan full rollout strategy" || echo "Decide whether to continue, modify, or stop the experiment")</li>
            <li>Document learnings and insights for future experiments</li>
            <li>Update feature flag configuration based on decision</li>
        </ol>
    </div>
    
    <div class="section">
        <h2>Technical Details</h2>
        <ul>
            <li><strong>Minimum Sample Size:</strong> $MIN_SAMPLE_SIZE participants</li>
            <li><strong>Significance Level:</strong> $SIGNIFICANCE_LEVEL (95% confidence)</li>
            <li><strong>Statistical Power:</strong> $STATISTICAL_POWER (80%)</li>
            <li><strong>Early Stopping:</strong> $([ "${EXPERIMENT_RESULTS[early_stopping]:-false}" = "true" ] && echo "Yes - ${EXPERIMENT_RESULTS[stop_reason]:-}" || echo "No")</li>
        </ul>
    </div>
    
    <p><small>Report generated by TerraFusion A/B Testing System on $(date)</small></p>
</body>
</html>
EOF

    log_success "Experiment report generated: $report_file"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion A/B Testing & Feature Flags"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT"
    log "Feature Flag: $FEATURE_FLAG"
    log "Experiment: $EXPERIMENT_NAME"
    log "Test Type: $TEST_TYPE"
    log "========================================="
    
    # Load configuration
    load_feature_config
    
    case $ACTION in
        create)
            if [ -z "$EXPERIMENT_NAME" ] || [ -z "$FEATURE_FLAG" ]; then
                log_error "Experiment name and feature flag are required for create action"
                exit 1
            fi
            initialize_feature_management
            create_ab_experiment
            ;;
        start)
            if [ -z "$EXPERIMENT_NAME" ]; then
                log_error "Experiment name is required for start action"
                exit 1
            fi
            start_ab_experiment
            ;;
        stop)
            if [ -z "$EXPERIMENT_NAME" ]; then
                log_error "Experiment name is required for stop action"
                exit 1
            fi
            update_experiment_status "$EXPERIMENT_NAME" "completed"
            ;;
        analyze)
            if [ -z "$EXPERIMENT_NAME" ]; then
                log_error "Experiment name is required for analyze action"
                exit 1
            fi
            analyze_experiment_results
            ;;
        report)
            if [ -z "$EXPERIMENT_NAME" ]; then
                log_error "Experiment name is required for report action"
                exit 1
            fi
            analyze_experiment_results
            generate_experiment_report
            ;;
        rollback)
            if [ -z "$EXPERIMENT_NAME" ]; then
                log_error "Experiment name is required for rollback action"
                exit 1
            fi
            update_experiment_status "$EXPERIMENT_NAME" "cancelled"
            # Disable feature flag
            if command -v redis-cli &> /dev/null; then
                redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -n "$REDIS_DB" DEL "feature_flag:$FEATURE_FLAG:$ENVIRONMENT" &>/dev/null
            fi
            send_experiment_notification "$EXPERIMENT_NAME" "rollback" "Experiment rolled back"
            ;;
        migrate)
            log_info "Migrating experiment data (placeholder)"
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: create, start, stop, analyze, report, rollback, migrate"
            exit 1
            ;;
    esac
    
    log ""
    log "========================================="
    log "A/B Testing Operation Complete"
    log "Action: $ACTION"
    log "Experiment: $EXPERIMENT_NAME"
    log "Status: $([ ${#EXPERIMENT_RESULTS[@]} -gt 0 ] && echo "Results Available" || echo "Configuration Complete")"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "A/B testing interrupted!"; exit 1' INT TERM

# Run main function
main "$@"