# TerraFusion Atlas Tags

**Controlled vocabulary for consistent categorization**

## 🎯 Purpose

Tags enable multi-dimensional classification:
- Search and filter items across registries
- Generate reports (by domain, layer, tech stack)
- Track security requirements
- Identify technical debt
- Plan migrations

## 📚 Tag Categories

### Domain Tags

Application domain or business area:

- `os` - Operating system kernel and core services
- `marketplace` - Marketplace platform and modules
- `ai` - Artificial intelligence and ML
- `gis` - Geographic information systems
- `valuation` - Property valuation
- `analytics` - Data analytics and reporting
- `parcel` - Parcel data and management
- `admin` - Administrative tools
- `billing` - Billing and payments
- `auth` - Authentication and authorization
- `reporting` - Report generation

### Layer Tags

Technical layer in the architecture:

- `kernel` - Core OS kernel
- `api` - API/service layer
- `engine` - Computation engine
- `ui` - User interface
- `data` - Data layer
- `infra` - Infrastructure
- `ops` - Operations and tooling
- `integration` - Integration layer

### Security Tags

Security classification and requirements:

- `public` - Public facing, no auth required
- `internal` - Internal use only
- `confidential` - Sensitive business data
- `restricted` - Highly restricted access
- `pii` - Contains personally identifiable information
- `pci` - PCI-DSS compliance required
- `hipaa` - HIPAA compliance required
- `audit` - Audit logging required

### Language Tags

Primary programming language:

- `rust` - Rust
- `csharp` - C#
- `dotnet` - .NET (any language)
- `typescript` - TypeScript
- `javascript` - JavaScript
- `python` - Python
- `go` - Go
- `sql` - SQL/database
- `shell` - Shell scripts

### Platform Tags

Deployment platform or runtime:

- `k8s` - Kubernetes
- `docker` - Docker containers
- `wasm` - WebAssembly
- `tauri` - Tauri desktop
- `electron` - Electron desktop
- `web` - Web browser
- `node` - Node.js runtime
- `linux` - Linux specific
- `windows` - Windows specific
- `macos` - macOS specific

### Technology Tags

Key technologies and frameworks:

- `react` - React framework
- `vue` - Vue.js framework
- `fastapi` - FastAPI
- `aspnet` - ASP.NET
- `postgres` - PostgreSQL
- `mongodb` - MongoDB
- `redis` - Redis
- `kafka` - Apache Kafka
- `grpc` - gRPC
- `rest` - REST API
- `graphql` - GraphQL
- `helm` - Helm charts
- `terraform` - Terraform IaC

### Feature Tags

Functional capabilities:

- `hot-swap` - Hot-swappable/pluggable
- `real-time` - Real-time processing
- `batch` - Batch processing
- `streaming` - Stream processing
- `ml` - Machine learning
- `llm` - Large language model
- `vector` - Vector/embedding processing
- `geospatial` - Geospatial operations
- `crypto` - Cryptography
- `ffi` - Foreign function interface

### Status Tags

Current status or special conditions:

- `experimental` - Experimental/POC
- `beta` - Beta quality
- `stable` - Stable/production
- `deprecated` - Being phased out
- `critical` - Critical path
- `performance` - Performance sensitive
- `high-load` - High load expected
- `legacy` - Legacy system

### Team Tags

Team or organizational ownership:

- `kernel-team`
- `marketplace-team`
- `frontend-team`
- `ai-team`
- `data-team`
- `ops-team`
- `platform-team`
- `plugins-team`
- `security-team`

## 📖 Usage Guidelines

### Required Tags

Every item should have AT LEAST:
1. One **domain** tag
2. One **layer** tag
3. One **language** or **platform** tag
4. One **security** tag

### Optional Tags

Add additional tags for:
- Technologies used
- Special features
- Status indicators
- Team ownership

### Example Tag Sets

**Backend API Service:**
```json
{
  "tags": ["os", "api", "dotnet", "k8s", "internal", "rest", "postgres", "critical"]
}
```

**Rust Engine:**
```json
{
  "tags": ["valuation", "engine", "rust", "wasm", "ffi", "performance", "critical"]
}
```

**Frontend Module:**
```json
{
  "tags": ["marketplace", "ui", "typescript", "react", "web", "public", "hot-swap"]
}
```

**AI Agent:**
```json
{
  "tags": ["ai", "agent", "python", "k8s", "internal", "llm", "ml", "experimental"]
}
```

**Database:**
```json
{
  "tags": ["parcel", "data", "postgres", "k8s", "confidential", "pii", "geospatial"]
}
```

## 🔍 Querying by Tags

### Find all Kubernetes-deployed services
```bash
jq '.items[] | select(.tags | contains(["k8s"]))' registries/services.json
```

### Find all Rust components
```bash
for reg in registries/*.json; do
  jq -r '.items[] | select(.tags | contains(["rust"])) | .id' "$reg"
done
```

### Find all items with PII
```bash
grep -r "pii" registries/ | jq -r '.id'
```

### Find experimental items
```bash
for reg in registries/*.json; do
  echo "=== $(basename $reg) ==="
  jq -r '.items[] | select(.tags | contains(["experimental"])) | .id' "$reg"
done
```

## 🆕 Adding New Tags

When you need a new tag:

1. **Check if existing tag fits** - Reuse before creating
2. **Propose in PR** - Add to this document
3. **Update ATLAS.json** - Add to appropriate category
4. **Document usage** - Add examples
5. **Migrate existing items** - Apply to relevant items

### Tag Naming Rules

- **Lowercase** - All tags are lowercase
- **Hyphenated** - Use hyphens for multi-word tags (`hot-swap`, not `hot_swap` or `hotSwap`)
- **Descriptive** - Tag meaning should be obvious
- **Consistent** - Follow existing patterns
- **Specific** - Prefer specific over generic

## 🚫 Anti-Patterns

**Don't:**
- Create redundant tags (`k8s` and `kubernetes`)
- Use overly generic tags (`important`, `new`)
- Use version numbers as tags (`v1`, `v2`)
- Use dates as tags (`2025`, `q1`)
- Tag individuals (`john-doe`)
- Use abbreviations without clarity

**Do:**
- Use existing tags when possible
- Be specific and descriptive
- Follow naming conventions
- Document tag purpose
- Apply tags consistently

---

**Maintained by:** Platform Team  
**Last Updated:** 2025-10-05
