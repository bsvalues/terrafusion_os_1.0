# LEV-109 - Levy Export File Formats

## Purpose

Documents the supported export formats for levy data. No actual data files
are included -- this describes structure and field layouts only.

## Supported Formats

### 1. TXT (Fixed-Width)

- Used for legacy DOR submissions.
- Column positions defined by DOR specification.
- Line terminator: CRLF.
- Character encoding: ASCII.

Key fields: County Code (1-2), Tax Year (3-6), District Code (7-12),
Levy Amount (13-25, right-justified, 2 decimal places).

### 2. XLS (Excel 97-2003)

- Used for county treasurer reports.
- Single worksheet named "Levy Rates".
- Header row in row 1; data starts row 2.
- Columns: District, Tax Code, Rate, AV, Levy Amount.

### 3. XLSX (Excel 2007+)

- Preferred format for modern reporting.
- Same layout as XLS but with OpenXML packaging.
- Supports formatted headers and conditional formatting.

### 4. XML

- Used for inter-system data exchange.
- Root element: `<LevyCertification>`.
- Child elements: `<District>`, `<Rate>`, `<Assessment>`.
- Schema XSD available from DOR website.

## Export API

```
GET /api/levy/export?format={txt|xls|xlsx|xml}&year={taxYear}
Authorization: Bearer <token>
```

Returns the file as a binary download with appropriate Content-Type header.
