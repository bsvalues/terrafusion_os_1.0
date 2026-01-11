# 🌉 TERRAFUSION BRIDGE PROTOCOL (v1.0)
### Sovereign Data Interconnect

> **STATUS:** ONLINE (Hybrid Mode)
> **PORT:** 8000 (Default) / 8001 (Fallback)
> **SERVICE:** `backend/terrafusion-bridge`

---

## 1. MISSION PROFILE
The Bridge acts as the **Diplomat** between the Sovereign Shell (React) and Legacy Iron (SQL Server `pacs_training`). It strictly enforces:
1.  **Read-Only Access:** No write operations to legacy DB.
2.  **Schema Sovereignty:** SQL rows are translated into `SovereignObject` nodes before reaching the UI.
3.  **Offline Resilience:** Automatically degrades to "ProVal Standard" reference data if SQL is unreachable.

## 2. ARCHITECTURE
* **Shell (Frontend):** `src/services/bridgeService.ts`
    * *Action:* `fetch('/v1/parcels/{id}')`
    * *Security:* `x-tf-bridge-key` header.
* **Bridge (Backend):** FastAPI (Python)
    * *Mapper:* `app/translate/mapper.py` (SQL Row $\rightarrow$ JSON Node)
    * *Schema:* `app/translate/schema_map.py` (ProVal Standard)

## 3. THE SCHEMA CONTRACT
The system currently binds to the **ProVal Standard** schema.

| Concept | Standard Table | Standard Column |
| :--- | :--- | :--- |
| **Identity** | `real_prop` | `parcel_no`, `situs_display` |
| **Valuation** | `value_hist` | `mkt_total`, `tax_year` |
| **Taxation** | `tax_receiv` | `tax_total`, `levy_code` |

*To modify for a different county or schema version, edit `app/translate/schema_map.py`.*

## 4. OPERATIONAL COMMANDS

### Boot the Bridge
```bash
# From project root
cd backend/terrafusion-bridge
source .venv/bin/activate
uvicorn app.main:app --reload
```

### Verification
Open `http://localhost:8000/health`.

* **Response:** `{"status": "online", "schema": "ProVal_Standard"}`

---

*Protocol Verified by: Bill Spencer (Elite Architect)*
