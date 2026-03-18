# LEV-118 - REST API Endpoints Reference

## Base URL

```
/api/levy/v1
```

## Authentication

All endpoints require a valid Bearer token with `levy:read` or `levy:write` scope.

## Endpoints

### Districts

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/districts`                  | List all taxing districts       |
| GET    | `/districts/{id}`             | Get district details            |
| POST   | `/districts`                  | Create a district               |
| PUT    | `/districts/{id}`             | Update a district               |

### Levy Rates

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/rates?year={year}`          | List rates for a tax year       |
| GET    | `/rates/{districtId}/{year}`  | Get rate for district + year    |
| POST   | `/rates/compute`              | Compute rates from levy amounts |

### Tax Code Areas

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/tax-codes`                  | List all TCAs                   |
| GET    | `/tax-codes/{code}`           | Get TCA composition             |
| GET    | `/tax-codes/{code}/rate`      | Get aggregate rate for a TCA    |

### Certification

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| POST   | `/certification/compute`      | Run full certification cycle    |
| GET    | `/certification/{year}/status`| Get certification status        |
| POST   | `/certification/{year}/lock`  | Lock certification (admin)      |

### Compliance

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/compliance/1pct?year={year}`| Run 1% constitutional check     |
| GET    | `/compliance/hll/{districtId}`| Get HLL for a district          |
| GET    | `/compliance/flags?year={year}`| List all compliance flags       |

### Import / Export

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| POST   | `/import/csv`                 | Bulk CSV import                 |
| GET    | `/export?format={fmt}&year={y}` | Export levy data              |

### Reports

| Method | Path                          | Description                     |
|--------|-------------------------------|---------------------------------|
| GET    | `/reports/calc-summary?year={y}`| Calculation summary            |
| GET    | `/reports/rate-spread?year={y}` | Rate spread report             |
| GET    | `/reports/dor-certification`    | DOR certification report       |

## Error Responses

All errors return JSON: `{ "error": "code", "message": "description" }`.

| Status | Meaning                                    |
|--------|--------------------------------------------|
| 400    | Invalid request parameters                 |
| 401    | Missing or invalid authentication          |
| 403    | Insufficient permissions                   |
| 404    | Resource not found                         |
| 409    | Conflict (e.g., certification already locked)|
| 500    | Internal server error                      |
