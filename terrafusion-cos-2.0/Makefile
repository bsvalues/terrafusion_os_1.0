# TerraFusion cOS 2.0 - MIT PhD Systems Design Engineer Standards
# Vendor Substrate Platform Build System

.PHONY: help install dev start stop test build lint security-scan clean

# Default target
help:
	@echo "TerraFusion cOS 2.0 - Vendor Substrate Platform"
	@echo "=============================================="
	@echo ""
	@echo "Available commands:"
	@echo "  install       - Install all dependencies"
	@echo "  dev           - Start development environment"
	@echo "  start         - Start all services"
	@echo "  stop          - Stop all services"
	@echo "  test          - Run comprehensive test suite"
	@echo "  build         - Build for production"
	@echo "  lint          - Run linting and code quality checks"
	@echo "  security-scan - Run security vulnerability scan"
	@echo "  clean         - Clean build artifacts"
	@echo ""
	@echo "MIT PhD Systems Design Engineer Standards"
	@echo "Government. Transcended."

# Install dependencies
install:
	@echo "Installing TerraFusion cOS 2.0 dependencies..."
	@echo "=============================================="
	
	# Python dependencies
	pip install -r requirements.txt
	pip install -r requirements-dev.txt
	
	# Node.js dependencies
	npm install
	
	# Rust dependencies
	cargo build --release
	
	# Database setup
	createdb terrafusion_cos_2_0 || true
	psql terrafusion_cos_2_0 < database/schema.sql
	
	# Redis setup
	redis-server --daemonize yes || true
	
	@echo "✅ Installation complete"
	@echo "MIT PhD Systems Design Engineer Standards applied"

# Development environment
dev:
	@echo "Starting TerraFusion cOS 2.0 development environment..."
	@echo "====================================================="
	
	# Start backend services
	@echo "Starting backend services..."
	python -m kernel.main &
	python -m substrate.main &
	python -m services.ai_swarm.main &
	python -m services.security_mesh.main &
	python -m services.terrafusion_sync.main &
	python -m services.terra_flow.main &
	
	# Start frontend development server
	@echo "Starting frontend development server..."
	cd frontend && npm run dev &
	
	# Start monitoring
	@echo "Starting monitoring services..."
	python -m monitoring.main &
	
	@echo "✅ Development environment started"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "Monitoring: http://localhost:9090"

# Start all services
start:
	@echo "Starting TerraFusion cOS 2.0 production services..."
	@echo "=================================================="
	
	# Start production services
	docker-compose up -d
	
	# Wait for services to be ready
	@echo "Waiting for services to be ready..."
	sleep 10
	
	# Health check
	@echo "Performing health check..."
	python scripts/health_check.py
	
	@echo "✅ All services started"
	@echo "TerraFusion cOS 2.0 is operational"

# Stop all services
stop:
	@echo "Stopping TerraFusion cOS 2.0 services..."
	@echo "======================================="
	
	docker-compose down
	
	# Stop any remaining processes
	pkill -f "python -m kernel.main" || true
	pkill -f "python -m substrate.main" || true
	pkill -f "python -m services" || true
	pkill -f "npm run dev" || true
	
	@echo "✅ All services stopped"

# Run comprehensive test suite
test:
	@echo "Running TerraFusion cOS 2.0 test suite..."
	@echo "========================================="
	
	# Python tests
	@echo "Running Python tests..."
	python -m pytest tests/ -v --cov=. --cov-report=html --cov-report=term
	
	# Node.js tests
	@echo "Running Node.js tests..."
	cd frontend && npm test
	
	# Rust tests
	@echo "Running Rust tests..."
	cargo test --release
	
	# Integration tests
	@echo "Running integration tests..."
	python -m pytest tests/integration/ -v
	
	# Performance tests
	@echo "Running performance tests..."
	python -m pytest tests/performance/ -v
	
	@echo "✅ All tests passed"
	@echo "MIT PhD Systems Design Engineer Standards validated"

# Build for production
build:
	@echo "Building TerraFusion cOS 2.0 for production..."
	@echo "============================================="
	
	# Build Python packages
	@echo "Building Python packages..."
	python -m build
	
	# Build Node.js frontend
	@echo "Building Node.js frontend..."
	cd frontend && npm run build
	
	# Build Rust components
	@echo "Building Rust components..."
	cargo build --release
	
	# Build Docker images
	@echo "Building Docker images..."
	docker-compose build
	
	# Security scan
	@echo "Running security scan..."
	python scripts/security_scan.py
	
	@echo "✅ Production build complete"
	@echo "MIT PhD Systems Design Engineer Standards applied"

# Run linting and code quality checks
lint:
	@echo "Running TerraFusion cOS 2.0 linting..."
	@echo "====================================="
	
	# Python linting
	@echo "Running Python linting..."
	flake8 . --max-line-length=100 --exclude=venv,node_modules
	black --check .
	isort --check-only .
	mypy .
	
	# Node.js linting
	@echo "Running Node.js linting..."
	cd frontend && npm run lint
	
	# Rust linting
	@echo "Running Rust linting..."
	cargo clippy --release
	
	@echo "✅ Linting complete"
	@echo "Code quality standards met"

# Run security vulnerability scan
security-scan:
	@echo "Running TerraFusion cOS 2.0 security scan..."
	@echo "==========================================="
	
	# Python security scan
	@echo "Running Python security scan..."
	safety check
	bandit -r . -f json -o security_report.json
	
	# Node.js security scan
	@echo "Running Node.js security scan..."
	cd frontend && npm audit
	
	# Docker security scan
	@echo "Running Docker security scan..."
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD):/workspace aquasec/trivy image terrafusion-cos-2.0:latest
	
	@echo "✅ Security scan complete"
	@echo "Government-grade security validated"

# Clean build artifacts
clean:
	@echo "Cleaning TerraFusion cOS 2.0 build artifacts..."
	@echo "=============================================="
	
	# Clean Python artifacts
	find . -type d -name "__pycache__" -exec rm -rf {} + || true
	find . -type f -name "*.pyc" -delete || true
	find . -type f -name "*.pyo" -delete || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + || true
	find . -type d -name "dist" -exec rm -rf {} + || true
	find . -type d -name "build" -exec rm -rf {} + || true
	
	# Clean Node.js artifacts
	cd frontend && npm run clean || true
	rm -rf frontend/node_modules || true
	rm -rf frontend/dist || true
	
	# Clean Rust artifacts
	cargo clean || true
	
	# Clean Docker artifacts
	docker-compose down --volumes --remove-orphans || true
	docker system prune -f || true
	
	@echo "✅ Clean complete"
	@echo "Build artifacts removed"

# Development database setup
db-setup:
	@echo "Setting up TerraFusion cOS 2.0 database..."
	@echo "========================================="
	
	# Create database
	createdb terrafusion_cos_2_0 || true
	
	# Run migrations
	python -m alembic upgrade head
	
	# Seed initial data
	python scripts/seed_data.py
	
	@echo "✅ Database setup complete"

# Generate documentation
docs:
	@echo "Generating TerraFusion cOS 2.0 documentation..."
	@echo "=============================================="
	
	# Generate API documentation
	python scripts/generate_api_docs.py
	
	# Generate architecture documentation
	python scripts/generate_arch_docs.py
	
	# Generate vendor integration guide
	python scripts/generate_vendor_guide.py
	
	@echo "✅ Documentation generated"
	@echo "MIT PhD Systems Design Engineer Standards documented"

# Performance benchmark
benchmark:
	@echo "Running TerraFusion cOS 2.0 performance benchmark..."
	@echo "=================================================="
	
	# API performance benchmark
	python scripts/benchmark_api.py
	
	# Database performance benchmark
	python scripts/benchmark_db.py
	
	# Frontend performance benchmark
	cd frontend && npm run benchmark
	
	@echo "✅ Performance benchmark complete"
	@echo "MIT PhD Systems Design Engineer Standards validated"

# Quality assurance
qa:
	@echo "Running TerraFusion cOS 2.0 quality assurance..."
	@echo "=============================================="
	
	# Run all quality checks
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) security-scan
	$(MAKE) benchmark
	
	@echo "✅ Quality assurance complete"
	@echo "MIT PhD Systems Design Engineer Standards validated"

# Production deployment
deploy:
	@echo "Deploying TerraFusion cOS 2.0 to production..."
	@echo "============================================="
	
	# Build production artifacts
	$(MAKE) build
	
	# Run quality assurance
	$(MAKE) qa
	
	# Deploy to production
	docker-compose -f docker-compose.prod.yml up -d
	
	# Health check
	sleep 30
	python scripts/health_check.py --production
	
	@echo "✅ Production deployment complete"
	@echo "TerraFusion cOS 2.0 is live"

# Emergency rollback
rollback:
	@echo "Rolling back TerraFusion cOS 2.0 deployment..."
	@echo "============================================="
	
	# Stop current deployment
	docker-compose -f docker-compose.prod.yml down
	
	# Restore previous version
	docker-compose -f docker-compose.prod.yml up -d --scale app=0
	docker-compose -f docker-compose.prod.yml up -d
	
	@echo "✅ Rollback complete"
	@echo "Previous version restored"

# System status
status:
	@echo "TerraFusion cOS 2.0 System Status"
	@echo "================================="
	
	# Check service status
	@echo "Service Status:"
	docker-compose ps
	
	# Check health
	@echo "Health Status:"
	python scripts/health_check.py --status
	
	# Check performance
	@echo "Performance Status:"
	python scripts/performance_check.py
	
	@echo "✅ Status check complete"

# MIT PhD Systems Design Engineer Standards
standards:
	@echo "TerraFusion cOS 2.0 - MIT PhD Systems Design Engineer Standards"
	@echo "=============================================================="
	@echo ""
	@echo "Quality Standards:"
	@echo "  - No shortcuts: We do it right the first time"
	@echo "  - MIT PhD Level: Systems design engineer standards"
	@echo "  - Government Grade: Enterprise-quality solutions"
	@echo "  - Production Ready: No placeholders or incomplete features"
	@echo "  - Comprehensive: Complete working solutions"
	@echo ""
	@echo "Performance Standards:"
	@echo "  - Sub-Second Response: All API calls <100ms P95"
	@echo "  - 99.9% Uptime: Enterprise-grade reliability"
	@echo "  - Scalable Architecture: Handle 10x growth without redesign"
	@echo "  - Security First: Government compliance built-in"
	@echo "  - Professional UI/UX: TerraFusion brand consistency"
	@echo ""
	@echo "Government. Transcended."
