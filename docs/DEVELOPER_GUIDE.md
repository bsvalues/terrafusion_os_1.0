# Terrafusion OS 1.0 - Developer Guide

## 👨‍💻 **Developer Onboarding**

Welcome to the Terrafusion OS 1.0 development team! This guide will help you get
up to speed with our codebase, development practices, and contribution
workflows.

---

## 🚀 **Development Environment Setup**

### **Prerequisites**

- **Node.js**: Version 18.0+ (LTS recommended)
- **.NET SDK**: Version 8.0+
- **Docker**: Latest stable version
- **Git**: Version 2.0+
- **Visual Studio Code**: Latest version (recommended)
- **PostgreSQL**: Version 14+ (for local development)

### **IDE Extensions (VS Code)**

Install these essential extensions:

```json
{
  "recommendations": [
    "ms-dotnettools.csharp",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-python.python",
    "ms-vscode-remote.remote-containers",
    "github.copilot"
  ]
}
```

### **Local Development Setup**

1. **Clone the Repository**

   ```bash
   git clone https://github.com/terrafusion/os-1.0.git
   cd os-1.0
   ```

2. **Install Dependencies**

   ```bash
   # Root dependencies
   npm install

   # Backend dependencies
   cd backend
   dotnet restore

   # Frontend dependencies
   cd ../frontend
   npm install

   # Return to root
   cd ..
   ```

3. **Environment Configuration**

   ```bash
   # Copy environment templates
   cp .env.example .env
   cp backend/appsettings.example.json backend/appsettings.Development.json
   cp frontend/.env.example frontend/.env.local
   ```

4. **Database Setup**

   ```bash
   # Start PostgreSQL (Docker)
   docker run -d \
     --name terrafusion-postgres \
     -e POSTGRES_DB=terrafusion_dev \
     -e POSTGRES_USER=dev \
     -e POSTGRES_PASSWORD=dev123 \
     -p 5432:5432 \
     postgres:14

   # Run migrations
   cd backend
   dotnet ef database update
   dotnet run --seed-data
   ```

5. **Start Development Services**

   ```bash
   # Start all services (recommended)
   npm run dev

   # Or start individually
   npm run dev:backend    # .NET API (port \${{TF_API_PORT:-5000}})
   npm run dev:frontend   # React PWA (port \${{TF_API_PORT:-5000}})
   npm run dev:electron   # Electron shell
   npm run dev:ai-swarm   # AI services (port \${{TF_API_PORT:-5000}})
   ```

---

## 🏗️ **Project Structure**

### **Root Directory**

```
terrafusion-os-1.0/
├── backend/                 # .NET 8.0 Web API
├── frontend/               # React 18 PWA + Electron
├── ai-models/              # AI/ML models and training
├── data/                   # Sample data and migrations
├── docs/                   # Documentation
├── devops/                 # DevOps configurations
├── infrastructure/         # Terraform and Kubernetes
├── tests/                  # Integration and E2E tests
├── .github/                # GitHub Actions workflows
├── docker-compose.yml      # Local development stack
├── package.json           # Root package configuration
└── README.md              # Project overview
```

### **Backend Structure (.NET)**

```
backend/
├── Terrafusion.API/        # Web API controllers and startup
├── Terrafusion.Core/       # Business logic and entities
├── Terrafusion.Data/       # Data access and EF Context
├── Terrafusion.AI/         # AI services and models
├── Terrafusion.Tests/      # Unit and integration tests
└── Terrafusion.sln        # Visual Studio solution
```

### **Frontend Structure (React)**

```
frontend/
├── src/
│   ├── components/         # Reusable React components
│   ├── pages/             # Page-level components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API clients and utilities
│   ├── store/             # State management (Redux)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions
├── electron/              # Electron main process
├── public/                # Static assets
├── package.json          # Frontend dependencies
└── vite.config.ts        # Vite configuration
```

---

## 🔧 **Development Workflow**

### **Git Workflow**

We follow **GitFlow** with the following branches:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature development branches
- `release/*`: Release preparation branches
- `hotfix/*`: Critical bug fixes

### **Branch Naming Convention**

```bash
# Features
feature/property-assessment-api
feature/ai-swarm-optimization

# Bug fixes
bugfix/database-connection-timeout
bugfix/ui-responsive-layout

# Hotfixes
hotfix/security-vulnerability-fix
hotfix/performance-critical-issue
```

### **Commit Message Format**

Follow **Conventional Commits** specification:

```bash
# Format
<type>[optional scope]: <description>

# Examples
feat(api): add property assessment endpoint
fix(ui): resolve responsive layout issues
docs(readme): update installation instructions
perf(ai): optimize swarm task distribution
test(api): add integration tests for property service
```

### **Pull Request Process**

1. **Create Feature Branch**

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Development and Testing**

   ```bash
   # Make your changes
   # Run tests
   npm run test
   npm run test:integration

   # Run linting and formatting
   npm run lint
   npm run format
   ```

3. **Commit and Push**

   ```bash
   git add .
   git commit -m "feat(scope): your feature description"
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Use the PR template
   - Link related issues
   - Add reviewers
   - Ensure CI passes

### **Code Review Guidelines**

**For Authors:**

- Keep PRs small and focused (< 400 lines)
- Write clear descriptions and test instructions
- Respond to feedback promptly
- Update documentation if needed

**For Reviewers:**

- Review within 24 hours
- Focus on logic, security, and performance
- Be constructive and specific
- Test the changes locally if needed

---

## 🧪 **Testing Strategy**

### **Test Types**

1. **Unit Tests**: Test individual functions/methods
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete user workflows
4. **Performance Tests**: Test system performance
5. **Security Tests**: Test for vulnerabilities

### **Backend Testing (.NET)**

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test project
dotnet test Terrafusion.Tests.Unit
dotnet test Terrafusion.Tests.Integration
```

### **Frontend Testing (React)**

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run visual regression tests
npm run test:visual
```

### **Test Writing Guidelines**

**Unit Test Example (.NET)**

```csharp
[Test]
public async Task AssessProperty_ValidInput_ReturnsAssessment()
{
    // Arrange
    var propertyId = Guid.NewGuid();
    var mockRepo = new Mock<IPropertyRepository>();
    var service = new PropertyAssessmentService(mockRepo.Object);

    // Act
    var result = await service.AssessPropertyAsync(propertyId);

    // Assert
    Assert.That(result.IsSuccess, Is.True);
    Assert.That(result.Value.AssessedValue, Is.GreaterThan(0));
}
```

**React Component Test Example**

```typescript
describe('PropertyCard', () => {
  it('displays property information correctly', () => {
    const mockProperty = {
      id: '123',
      address: '123 Main St',
      assessedValue: 500000
    };

    render(<PropertyCard property={mockProperty} />);

    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('$500,000')).toBeInTheDocument();
  });
});
```

---

## 📊 **Performance Guidelines**

### **Backend Performance**

**API Response Times**

- Property queries: < 100ms
- Assessment calculations: < 500ms
- Bulk operations: < 2s
- Health checks: < 50ms

**Database Optimization**

```csharp
// Use async/await for all database operations
public async Task<Property> GetPropertyAsync(Guid id)
{
    return await _context.Properties
        .Include(p => p.Assessments)
        .FirstOrDefaultAsync(p => p.Id == id);
}

// Use pagination for large datasets
public async Task<PagedResult<Property>> GetPropertiesAsync(
    int page, int pageSize)
{
    var query = _context.Properties.AsQueryable();
    var total = await query.CountAsync();
    var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    return new PagedResult<Property>(items, total, page, pageSize);
}
```

### **Frontend Performance**

**React Optimization**

```typescript
// Use React.memo for expensive components
export const PropertyCard = React.memo(({ property }: Props) => {
  return (
    <div className="property-card">
      {/* Component content */}
    </div>
  );
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);

// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  onPropertySelect(id);
}, [onPropertySelect]);
```

**Bundle Optimization**

```typescript
// Use dynamic imports for code splitting
const PropertyDetails = lazy(() => import('./PropertyDetails'));

// Use React.Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <PropertyDetails propertyId={id} />
</Suspense>
```

---

## 🔒 **Security Guidelines**

### **Authentication & Authorization**

**JWT Token Handling**

```typescript
// Store tokens securely
const tokenService = {
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  removeToken: () => {
    localStorage.removeItem('auth_token');
  },
};

// Add auth headers to API requests
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    Authorization: `Bearer ${tokenService.getToken()}`,
  },
});
```

**Input Validation**

```csharp
// Backend validation with FluentValidation
public class CreatePropertyValidator : AbstractValidator<CreatePropertyRequest>
{
    public CreatePropertyValidator()
    {
        RuleFor(x => x.Address)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.AssessedValue)
            .GreaterThan(0)
            .LessThan(100_000_000);
    }
}
```

### **Data Protection**

**Sensitive Data Handling**

```csharp
// Encrypt sensitive data at rest
[JsonIgnore]
public string SocialSecurityNumber { get; set; }

// Use data annotations for PII
[PersonalData]
public string OwnerName { get; set; }

// Implement audit logging
public class AuditableEntity
{
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string UpdatedBy { get; set; }
}
```

---

## 🤖 **AI/ML Development**

### **AI Swarm Architecture**

**Agent Implementation**

```python
class PropertyAssessmentAgent:
    def __init__(self, agent_id: str, specialization: str):
        self.agent_id = agent_id
        self.specialization = specialization
        self.model = self.load_model()

    async def process_task(self, task: AssessmentTask) -> AssessmentResult:
        # Implement agent-specific logic
        prediction = await self.model.predict(task.property_data)
        return AssessmentResult(
            agent_id=self.agent_id,
            confidence=prediction.confidence,
            assessment_value=prediction.value
        )
```

**Model Training Pipeline**

```python
# Training script example
def train_assessment_model():
    # Load and preprocess data
    data = load_property_data()
    X_train, X_test, y_train, y_test = train_test_split(data)

    # Train model
    model = create_neural_network()
    model.fit(X_train, y_train, validation_data=(X_test, y_test))

    # Evaluate and save
    accuracy = model.evaluate(X_test, y_test)
    model.save('models/property_assessment_v1.h5')

    return accuracy
```

### **Model Deployment**

**Model Serving API**

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class PropertyData(BaseModel):
    square_footage: int
    bedrooms: int
    bathrooms: int
    year_built: int
    location: str

@app.post("/assess")
async def assess_property(data: PropertyData):
    # Load model and make prediction
    model = load_model()
    prediction = model.predict(data.dict())

    return {
        "assessed_value": prediction.value,
        "confidence": prediction.confidence,
        "processing_time": prediction.time_ms
    }
```

---

## 📱 **Frontend Development**

### **Component Architecture**

**Component Structure**

```typescript
// Component template
interface Props {
  // Define props with TypeScript
}

export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks at the top
  const [state, setState] = useState<StateType>(initialState);
  const dispatch = useAppDispatch();

  // Event handlers
  const handleEvent = useCallback(() => {
    // Handle event
  }, [dependencies]);

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Render
  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
};
```

### **State Management**

**Redux Toolkit Setup**

```typescript
// Store configuration
export const store = configureStore({
  reducer: {
    properties: propertiesSlice.reducer,
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Slice example
const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setProperties: (state, action) => {
      state.items = action.payload;
    },
    addProperty: (state, action) => {
      state.items.push(action.payload);
    },
  },
});
```

---

## 🚀 **Deployment & DevOps**

### **Docker Development**

**Development Docker Compose**

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - '5000:5000'
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=terrafusion_dev;Username=dev;Password=dev123
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - '3000:3000'
    volumes:
      - ./frontend:/app
      - /app/node_modules

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: terrafusion_dev
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123
    ports:
      - '5432:5432'
```

### **CI/CD Pipeline**

**GitHub Actions Workflow**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: 8.0.x

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Run backend tests
        run: |
          cd backend
          dotnet test --configuration Release

      - name: Run frontend tests
        run: |
          cd frontend
          npm ci
          npm run test:ci
```

---

## 📚 **API Development**

### **Controller Structure**

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PropertiesController : ControllerBase
{
    private readonly IPropertyService _propertyService;
    private readonly ILogger<PropertiesController> _logger;

    public PropertiesController(
        IPropertyService propertyService,
        ILogger<PropertiesController> logger)
    {
        _propertyService = propertyService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<PropertyDto>>> GetProperties(
        [FromQuery] PropertyQueryParameters parameters)
    {
        try
        {
            var result = await _propertyService.GetPropertiesAsync(parameters);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving properties");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost]
    public async Task<ActionResult<PropertyDto>> CreateProperty(
        [FromBody] CreatePropertyRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _propertyService.CreatePropertyAsync(request);
        return CreatedAtAction(nameof(GetProperty),
            new { id = result.Id }, result);
    }
}
```

### **API Documentation**

Use **Swagger/OpenAPI** for documentation:

```csharp
// In Program.cs
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Terrafusion API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });
});
```

---

## 🔍 **Debugging & Troubleshooting**

### **Common Issues**

**Database Connection Issues**

```bash
# Check PostgreSQL status
docker ps | grep postgres

# View database logs
docker logs terrafusion-postgres

# Test connection
psql -h localhost -U dev -d terrafusion_dev
```

**Frontend Build Issues**

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
npm run dev -- --force

# Check for TypeScript errors
npm run type-check
```

**Performance Issues**

```bash
# Profile .NET application
dotnet-trace collect -p <process-id>

# Analyze React performance
# Use React DevTools Profiler

# Monitor database queries
# Enable EF Core logging in appsettings.json
```

### **Logging & Monitoring**

**Backend Logging**

```csharp
public class PropertyService : IPropertyService
{
    private readonly ILogger<PropertyService> _logger;

    public async Task<Property> GetPropertyAsync(Guid id)
    {
        _logger.LogInformation("Retrieving property {PropertyId}", id);

        try
        {
            var property = await _repository.GetByIdAsync(id);
            _logger.LogInformation("Property {PropertyId} retrieved successfully", id);
            return property;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving property {PropertyId}", id);
            throw;
        }
    }
}
```

**Frontend Error Tracking**

```typescript
// Error boundary for React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

---

## 📞 **Support & Resources**

### **Getting Help**

- **Team Chat**: Slack #terrafusion-dev
- **Code Reviews**: GitHub Pull Requests
- **Architecture Questions**: #architecture channel
- **Bug Reports**: GitHub Issues
- **Documentation**: Confluence Wiki

### **Learning Resources**

- **.NET Documentation**: https://docs.microsoft.com/dotnet
- **React Documentation**: https://reactjs.org/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Entity Framework**: https://docs.microsoft.com/ef
- **Docker Documentation**: https://docs.docker.com

### **Code Quality Tools**

- **SonarQube**: Code quality analysis
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks
- **CodeQL**: Security analysis

---

**Developer Guide Version**: 1.0.0  
**Last Updated**: August 17, 2025  
**Next Review**: September 17, 2025

🚀 **Happy Coding! Welcome to the Terrafusion OS Development Team!**
