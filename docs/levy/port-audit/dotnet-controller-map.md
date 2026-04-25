### LevyAuditController.cs
Size: 1.8 KB
Routes (4):
  [Route("api/levy/audit")]
  [HttpGet("dashboard")]
  [HttpGet("guidance")]
  [HttpPost("optimization")]

### LevyCalculationController.cs
Size: 39.9 KB
Routes (10):
  [Route("api/levy-calculation")]
  [Route("api/levy/v1")] // Canonical contract route (see docs/levy/api-documentation.md). Legacy route kept for compatibility.
  [HttpPost("calculate-rate")]
  [HttpGet("history")]
  [HttpPost("calculate-batch")]
  [HttpGet("benton/taxing-districts")]
  [HttpGet("statutory-limits")]
  [HttpGet("benton/levy-certification-steps")]
  [HttpPost("highest-lawful-levy")]
  [HttpPost("aggregate-check")]

### LevyCalculatorController.cs
Size: 1.9 KB
Routes (4):
  [Route("api/levy/calculator")]
  [HttpPost("calculate-rate")]
  [HttpPost("bill-impact")]
  [HttpGet("rate-comparison/{districtId}")]

### LevyController.cs
Size: 7.6 KB
Routes (4):
  [Route("api/levy")]
  [HttpGet("rates")]
  [HttpGet("tax-areas")]
  [HttpGet("calculate")]

### LevyDashboardController.cs
Size: 2.5 KB
Routes (4):
  [Route("api/levy/dashboard")]
  [HttpGet("summary")]
  [HttpGet("metrics")]
  [HttpGet("districts-overview")]

### LevyDataManagementController.cs
Size: 2.1 KB
Routes (5):
  [Route("api/levy/data")]
  [HttpPost("import")]
  [HttpGet("export")]
  [HttpGet("districts")]
  [HttpGet("tax-codes")]

### LevyExportController.cs
Size: 1.7 KB
Routes (4):
  [Route("api/levy/export")]
  [HttpPost("upload")]
  [HttpGet("history")]
  [HttpGet("compare")]

### LevyForecastController.cs
Size: 2.2 KB
Routes (5):
  [Route("api/levy/forecast")]
  [HttpPost("generate")]
  [HttpGet("district/{id}")]
  [HttpGet("dashboard")]
  [HttpGet("compare")]

### LevyReferenceController.cs
Size: 18.7 KB
Routes (9):
  [Route("api/levy/v1")]
  [Route("api/levy-calculation")]
  [HttpGet("ipd-rates")]
  [HttpGet("lid-lifts")]
  [HttpGet("state-school-levy")]
  [HttpGet("refund-fund")]
  [HttpGet("tax-code-areas")]
  [HttpPost("attest")]
  [HttpGet("retention-policy")]

### LevyReportController.cs
Size: 1.6 KB
Routes (4):
  [Route("api/levy/reports")]
  [HttpGet("templates")]
  [HttpPost("generate")]
  [HttpGet("scheduled")]

### LevySearchController.cs
Size: 1.8 KB
Routes (4):
  [Route("api/levy/search")]
  [HttpGet("search")]
  [HttpGet("autocomplete")]
  [HttpGet("recent")]

