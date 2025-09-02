# 🧭 AI AGENT NAVIGATION CENTER

## 🎯 **SINGLE SOURCE OF TRUTH FOR AI AGENTS**

**BOOKMARK THIS FILE** - Always point AI agents here when they need direction.

---

## 🚀 **ONE-COMMAND QUICK START**

### Windows

`AI_START.cmd`

### Unix/macOS

```bash
chmod +x ai-start.sh
./ai-start.sh
```

Runs orientation with verification and full test discovery.

---

## 🚨 **MANDATORY FIRST READS (IN ORDER)**

### 1. **📋 START_HERE.md**

**Purpose:** Mandatory orientation for ALL AI agents  
**When:** First thing any AI agent should read  
**Command:** `cat START_HERE.md`

### 2. **🤖 AI_AGENT_QUICK_START.md**

**Purpose:** Complete AI agent guidance and common mistakes  
**When:** After reading START_HERE.md  
**Command:** `cat AI_AGENT_QUICK_START.md`

### 3. **📖 CLAUDE.md**

**Purpose:** Complete development documentation (MOST IMPORTANT)  
**When:** For any development work  
**Command:** `cat CLAUDE.md`

### 4. **🧪 TEST_REGISTRY.md**

**Purpose:** Complete catalog of ALL 361 test locations  
**When:** For any testing work  
**Command:** `cat TEST_REGISTRY.md`

---

## 🔍 **QUICK DISCOVERY COMMANDS**

### **Find Everything:**

```bash
./scripts/discover-all-tests.sh    # Find ALL 361 tests
cat TEST_REGISTRY.md              # Complete test catalog
ls -la /                          # Root structure
```

### **Key Directories:**

```bash
ls championship/                  # AI testing (3 files)
ls scripts/                      # Production validation (8 files)
ls modules/testing-suite/         # 716 REAL tests (91.9% pass rate)
ls backend/quantum-performance/   # Quantum testing
ls tests/mock_tests/             # Mock tests (separated)
```

---

## 📂 **CRITICAL LOCATIONS**

| Location                            | Purpose                    | Test Count      |
| ----------------------------------- | -------------------------- | --------------- |
| **Root (`/`)**                      | Championship orchestrators | 201 files       |
| **`/modules/testing-suite/`**       | Real module tests          | 716 tests       |
| **`/championship/`**                | AI-powered testing         | 3 files         |
| **`/scripts/`**                     | Production validation      | 8 files         |
| **`/backend/quantum-performance/`** | Quantum testing            | Real validation |
| **`/tests/mock_tests/`**            | Mock tests                 | Separated       |

---

## ⚡ **INSTANT ANSWERS**

### **Q: Where are the tests?**

**A:** Run `./scripts/discover-all-tests.sh` - Tests are in 10+ locations, NOT
just `/tests/`

### **Q: Which tests are real?**

**A:** `/modules/testing-suite/` has 716 real tests. `/tests/mock_tests/` has
mock tests.

### **Q: How do I start development?**

**A:** Read `CLAUDE.md` then run `npm run dev`

### **Q: What commands are available?**

**A:** Check `package.json` or read `CLAUDE.md`

### **Q: How do I understand the system?**

**A:** Read in order: `START_HERE.md` → `AI_AGENT_QUICK_START.md` → `CLAUDE.md`

---

## 🛡️ **PROTECTION RULES**

### **NEVER DELETE:**

- `/championship/` - AI testing infrastructure
- `/scripts/` - Production validation
- `/modules/testing-suite/` - 716 real tests
- Root test orchestrators (`championship-test-runner.ts`, etc.)

### **ALWAYS READ FIRST:**

- `START_HERE.md` - Mandatory orientation
- `CLAUDE.md` - Complete development guide
- `TEST_REGISTRY.md` - All test locations

---

## 🎯 **FOR HUMANS DIRECTING AI AGENTS**

### **Always Say:**

> "Read `START_HERE.md` and `AI_AGENT_QUICK_START.md` first, then check
> `TEST_REGISTRY.md` for test locations."

### **Point Them To:**

- **This file:** `AI_NAVIGATION.md`
- **Orientation:** `START_HERE.md`
- **Development:** `CLAUDE.md`
- **Testing:** `TEST_REGISTRY.md`

### **Make Them Run:**

```bash
./scripts/discover-all-tests.sh    # Find all tests
cat CLAUDE.md                     # Read dev guide
ls modules/testing-suite/         # See real tests
```

---

**🧭 BOOKMARK: `/AI_NAVIGATION.md`**  
**🎯 ALWAYS POINT AI AGENTS HERE FIRST**  
**📋 SINGLE SOURCE OF TRUTH FOR AI GUIDANCE**
