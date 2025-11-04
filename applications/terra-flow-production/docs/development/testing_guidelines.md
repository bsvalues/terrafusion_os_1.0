# Testing Guidelines for GeoAssessmentPro

This document outlines the testing standards and practices for the GeoAssessmentPro platform.

## Testing Philosophy

The GeoAssessmentPro testing strategy follows these key principles:

1. **Test-Driven Development**: Write tests before implementing features when possible
2. **Comprehensive Coverage**: Aim for high test coverage across all modules
3. **Automated Testing**: Prioritize automated tests that can run in CI/CD pipelines
4. **Real Data Testing**: Use realistic (but anonymized) data samples for testing
5. **Security Testing**: Include security-focused tests for all new features

## Types of Tests

### Unit Tests

Unit tests verify the correctness of individual components in isolation.

**Location**: `tests/unit/`

**Naming Convention**: `test_<module_name>.py` with test functions named `test_<function_name>`

**Framework**: pytest

**Examples**:
- Testing individual utility functions
- Testing model validations
- Testing individual route functions with mocked dependencies

```python
# Example unit test for a utility function
def test_calculate_property_value():
    # Setup
    property_data = {
        "lot_size": 5000,
        "property_type": "residential",
        "year_built": 2010,
        "location_factor": 1.2
    }
    
    # Exercise
    result = calculate_property_value(property_data)
    
    # Verify
    assert result > 0
    assert isinstance(result, float)
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

**Location**: `tests/integration/`

**Naming Convention**: `test_<feature_name>_integration.py`

**Framework**: pytest with Flask test client

**Examples**:
- Testing API endpoints with database interactions
- Testing authentication flow
- Testing data processing pipelines

```python
# Example integration test for an API endpoint
def test_property_creation_endpoint(client, auth_token, test_property_data):
    # Setup
    headers = {"Authorization": f"Bearer {auth_token}"}
    
    # Exercise
    response = client.post('/api/properties', 
                          headers=headers,
                          json=test_property_data)
    
    # Verify
    assert response.status_code == 201
    assert "id" in response.json
    
    # Cleanup - verify property was created in database
    property_id = response.json["id"]
    property_in_db = Property.query.get(property_id)
    assert property_in_db is not None
    assert property_in_db.address == test_property_data["address"]
```

### End-to-End Tests

End-to-end tests verify entire user workflows across the application.

**Location**: `tests/e2e/`

**Naming Convention**: `test_<workflow_name>_e2e.py`

**Framework**: pytest with Selenium or Playwright

**Examples**:
- Testing property assessment workflow
- Testing data import and validation process
- Testing map visualization and interaction

```python
# Example E2E test for property assessment workflow
def test_complete_property_assessment(browser, auth):
    # Login
    auth.login()
    
    # Navigate to property list
    browser.visit('/properties')
    
    # Select a property
    browser.click_link('Test Property')
    
    # Add assessment data
    browser.fill('land_value', '100000')
    browser.fill('improvement_value', '150000')
    browser.select('valuation_method', 'market')
    browser.click_button('Save Assessment')
    
    # Verify success message
    assert browser.is_text_present('Assessment saved successfully')
    
    # Verify database update
    property_id = browser.find_by_css('.property-id').text
    assessment = Assessment.query.filter_by(property_id=property_id).first()
    assert assessment is not None
    assert assessment.land_value == 100000
    assert assessment.improvement_value == 150000
```

### Performance Tests

Performance tests verify that the application meets performance requirements.

**Location**: `tests/performance/`

**Naming Convention**: `test_<feature_name>_performance.py`

**Framework**: pytest with locust or custom timing decorators

**Examples**:
- API endpoint response times
- Database query performance
- Map rendering performance

```python
# Example performance test for property search API
def test_property_search_performance():
    start_time = time.time()
    
    # Perform a search with common filters
    response = client.get('/api/properties?city=Kennewick&property_type=residential')
    
    # Verify performance
    end_time = time.time()
    duration = end_time - start_time
    
    assert response.status_code == 200
    assert duration < 0.5  # Response should be under 500ms
    assert len(response.json['properties']) > 0
```

### Security Tests

Security tests verify that the application is protected against common vulnerabilities.

**Location**: `tests/security/`

**Naming Convention**: `test_<security_aspect>.py`

**Framework**: pytest with security testing libraries

**Examples**:
- Testing for SQL injection
- Testing authorization controls
- Testing for XSS vulnerabilities

```python
# Example security test for authorization
def test_unauthorized_access_prevention(client):
    # Attempt to access admin endpoint without authentication
    response = client.get('/api/admin/users')
    assert response.status_code == 401
    
    # Attempt to access admin endpoint with non-admin user
    headers = {"Authorization": f"Bearer {regular_user_token}"}
    response = client.get('/api/admin/users', headers=headers)
    assert response.status_code == 403
```

## Test Fixtures

Test fixtures provide reusable components for tests.

**Location**: `tests/conftest.py`

**Examples**:
- Database fixtures
- Authentication fixtures
- Test client fixtures
- Test data generators

```python
# Example fixture for authenticated client
@pytest.fixture
def authenticated_client(app, test_user):
    with app.test_client() as client:
        with client.session_transaction() as session:
            session['user_id'] = test_user.id
        yield client
```

## Mocking External Services

For tests involving external services, use mock objects to isolate testing:

```python
# Example of mocking Supabase service
@pytest.fixture
def mock_supabase(monkeypatch):
    class MockSupabaseClient:
        def from_table(self, table_name):
            return self
            
        def select(self, *fields):
            return self
            
        def execute(self):
            return {
                "data": [{"id": 1, "name": "Test Data"}],
                "error": None
            }
    
    monkeypatch.setattr("supabase_client.get_client", lambda: MockSupabaseClient())
```

## Test Coverage

Use pytest-cov to monitor test coverage:

```bash
pytest --cov=app tests/
```

Aim for at least 80% code coverage across the application, with higher coverage for critical modules.

## Continuous Integration

Tests will run automatically on:
- Pull requests to main branch
- Daily scheduled runs
- Manual trigger in CI/CD pipeline

Failed tests will block deployments to production environments.

## Test Data Management

- Use factory pattern for generating test data
- Store test data fixtures in `tests/fixtures/`
- Never use production data in tests
- Use realistic but anonymized data

## Adding New Tests

When adding new features, follow this process:

1. Write unit tests for new components
2. Write integration tests for feature interactions
3. Update or add E2E tests for affected workflows
4. Run the full test suite to ensure no regressions
5. Document any new test fixtures or patterns used