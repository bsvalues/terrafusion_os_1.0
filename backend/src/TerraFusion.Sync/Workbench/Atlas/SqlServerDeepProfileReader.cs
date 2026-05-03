using System.Globalization;
using System.Text;
using System.Text.Json;
using Microsoft.Data.SqlClient;

namespace TerraFusion.Sync.Workbench.Atlas;

/// <summary>
/// SQL Server implementation of <see cref="IDeepProfileReader"/> for Slice B2.2.
///
/// Per-table profile flow:
///   1. Resolve a <see cref="DeepProfileSamplingPlan"/> from the row-count
///      estimate (sys.partitions for large tables; exact COUNT(*) when small).
///   2. Materialize the sample into a temp table — once per profile call —
///      so per-column aggregates run against the same row set without
///      re-sampling.
///   3. Per column: aggregate <c>null_count</c>, <c>distinct_count</c>,
///      <c>min</c>, <c>max</c> via UNION ALL over the temp table. Sample
///      values (10 random rows) and top-N frequency rows for code candidates
///      are read in follow-up reads against the same temp table.
///   4. Drop the temp table.
///   5. Run the code-candidate heuristic over the produced column stats
///      (pure C#, no SQL).
///
/// Identifier safety: schema, table, and column names are bracket-quoted
/// using <see cref="QuoteIdentifier"/>. Inputs that contain a literal closing
/// bracket are rejected — the reader's caller is the structural atlas, which
/// derives names from <c>sys.*</c> catalogs, so a closing bracket would be a
/// genuine schema corruption signal worth surfacing rather than silently
/// escaping.
///
/// SQL composition is exposed via <c>public static</c> methods so unit tests
/// can verify shape without a live SQL Server. End-to-end execution is
/// verified by the Slice B2.6 Docker integration tests (mirrors B1.6).
/// </summary>
public sealed class SqlServerDeepProfileReader : IDeepProfileReader
{
    /// <summary>Tables at or below this row count are profiled in FULL.</summary>
    public const long FullThresholdRowCount = 100_000;

    /// <summary>Approximate target sample size for BernoulliSample tables.</summary>
    public const int TargetSampleRowCount = 10_000;

    /// <summary>Distinct-count clamp; values past this are reported as inexact.</summary>
    public const int DistinctCountClamp = 1_000;

    /// <summary>Code-candidate distinct-count cap.</summary>
    public const int CodeCandidateMaxDistinct = 100;

    /// <summary>Code-candidate distinct-ratio cap (distinct / sample &lt; this).</summary>
    public const decimal CodeCandidateMaxDistinctRatio = 0.05m;

    /// <summary>Top-N entries kept for both <c>TopValuesJson</c> and <c>CandidateCodesJson</c>.</summary>
    public const int TopValuesKept = 100;

    /// <summary>Number of random sample values surfaced per column.</summary>
    public const int SampleValuesPerColumn = 10;

    private readonly SqlConnection _connection;
    private readonly DeepProfileTimeoutBudget _timeoutBudget;

    public SqlServerDeepProfileReader(SqlConnection connection)
        : this(connection, DeepProfileTimeoutBudget.Default)
    {
    }

    /// <summary>
    /// Construct with an explicit timeout budget (FIX-B2.7E). The budget
    /// is split per command class — short ceilings for metadata/cleanup,
    /// long ceilings for sample materialization and per-column aggregation.
    /// See <see cref="DeepProfileTimeoutBudget"/>.
    /// </summary>
    public SqlServerDeepProfileReader(SqlConnection connection, DeepProfileTimeoutBudget timeoutBudget)
    {
        ArgumentNullException.ThrowIfNull(connection);
        ArgumentNullException.ThrowIfNull(timeoutBudget);
        _connection = connection;
        _timeoutBudget = timeoutBudget.Validate();
    }

    // ── Sampling plan (B2.0 decision) ────────────────────────────────────

    /// <summary>
    /// Pure function that selects the sampling strategy from a row-count
    /// estimate. Encodes the B2.0 decision: tables ≤ <see cref="FullThresholdRowCount"/>
    /// run in FULL; larger tables sample via BernoulliSample at a percentage
    /// chosen to land near <see cref="TargetSampleRowCount"/>.
    /// </summary>
    public static DeepProfileSamplingPlan PlanSampling(long rowCountEstimate, bool estimateIsExact)
    {
        if (rowCountEstimate < 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(rowCountEstimate),
                "Row count estimate cannot be negative.");
        }

        if (rowCountEstimate <= FullThresholdRowCount)
        {
            return new DeepProfileSamplingPlan(
                Method:          "Full",
                TargetRowCount:  (int)rowCountEstimate,
                BernoulliPct:    null,
                RowCountIsExact: true);
        }

        // Pick the percentage that lands near the target sample size. Bernoulli
        // sampling is independent-coin-flip per row, so the actual sample size
        // is binomially distributed; we don't try to hit exactly 10K, just land
        // close enough to be representative without scanning the whole table.
        var pct = decimal.Round(
            (decimal)TargetSampleRowCount / rowCountEstimate * 100m,
            4,
            MidpointRounding.AwayFromZero);

        // Floor at 0.0001% — Bernoulli rejects 0 and SQL Server rejects values
        // that round to 0 at the engine level. Below this, the sample has
        // expected size < 1 and we should profile differently anyway.
        if (pct < 0.0001m) pct = 0.0001m;

        return new DeepProfileSamplingPlan(
            Method:          "BernoulliSample",
            TargetRowCount:  TargetSampleRowCount,
            BernoulliPct:    pct,
            RowCountIsExact: estimateIsExact);
    }

    // ── SQL builders (public static, unit-testable) ──────────────────────

    /// <summary>
    /// Estimated row count from <c>sys.partitions</c> for the heap or
    /// clustered index. Used as the sampling-plan input for tables that
    /// might be too large for a full <c>COUNT(*)</c>.
    /// </summary>
    public static string BuildRowCountEstimateSql(string schemaName, string tableName)
    {
        ValidateIdent(schemaName, nameof(schemaName));
        ValidateIdent(tableName, nameof(tableName));

        return
            $"""
            SELECT ISNULL(SUM(p.rows), 0)
            FROM sys.partitions AS p
            INNER JOIN sys.tables AS t ON p.object_id = t.object_id
            INNER JOIN sys.schemas AS s ON t.schema_id = s.schema_id
            WHERE s.name = N'{Escape(schemaName)}'
              AND t.name = N'{Escape(tableName)}'
              AND p.index_id IN (0, 1);
            """;
    }

    /// <summary>Exact <c>COUNT(*)</c> against the table itself.</summary>
    public static string BuildExactRowCountSql(string schemaName, string tableName)
    {
        ValidateIdent(schemaName, nameof(schemaName));
        ValidateIdent(tableName, nameof(tableName));
        return $"SELECT COUNT_BIG(*) FROM {QuoteIdentifier(schemaName)}.{QuoteIdentifier(tableName)};";
    }

    /// <summary>
    /// Materializes the profile sample into a session-local temp table named
    /// <c>#tf_deep_profile_sample</c>. For Full plans, copies every row;
    /// for BernoulliSample, applies <c>TABLESAMPLE SYSTEM (n PERCENT)</c>.
    ///
    /// The temp table strategy is intentional: per-column aggregations run
    /// against a single materialized sample, so the random sample is
    /// consistent across columns rather than being re-rolled per query.
    ///
    /// <para><b>FIX-B2.7D — TABLESAMPLE dialect.</b> SQL Server's
    /// <c>TABLESAMPLE</c> only supports the <c>SYSTEM</c> method (page-based
    /// sampling); it does NOT accept the SQL:2003 <c>BERNOULLI</c> keyword,
    /// even though the strategy is conceptually a Bernoulli per-row coin
    /// flip. PostgreSQL supports both methods and the original B2.0 builder
    /// emitted <c>TABLESAMPLE BERNOULLI</c>, which crashed every business
    /// table > <see cref="FullThresholdRowCount"/> rows on T-SQL with
    /// <i>"Incorrect syntax near 'BERNOULLI'"</i>. Discovered in B2.7-OLTP
    /// against the 8 large pacs_oltp tables.</para>
    ///
    /// <para>The C# strategy name <c>"BernoulliSample"</c> is preserved on
    /// <see cref="DeepProfileSamplingPlan.Method"/> — it documents the
    /// intent (independent-coin-flip per row, target sample size) and
    /// matches what the persistence layer wrote in prior batches. Only the
    /// emitted T-SQL keyword swaps. The statistical compromise — SQL
    /// Server's SYSTEM is page-clustered, so adjacent rows in the same
    /// page are correlated rather than independently selected — is
    /// acceptable for the workbench: the alternative (a full-scan
    /// <c>ORDER BY NEWID() OFFSET n ROWS FETCH NEXT m</c>) would scan and
    /// sort the whole table just to draw a sample, which is the opposite
    /// of what we want for tables with millions of rows.</para>
    /// </summary>
    public static string BuildSampleMaterializationSql(
        string schemaName,
        string tableName,
        DeepProfileSamplingPlan plan)
    {
        ValidateIdent(schemaName, nameof(schemaName));
        ValidateIdent(tableName, nameof(tableName));
        ArgumentNullException.ThrowIfNull(plan);

        var fullName = $"{QuoteIdentifier(schemaName)}.{QuoteIdentifier(tableName)}";

        if (plan.Method == "Full")
        {
            return $"SELECT * INTO #tf_deep_profile_sample FROM {fullName};";
        }

        if (plan.Method == "BernoulliSample")
        {
            if (plan.BernoulliPct is null)
            {
                throw new InvalidOperationException(
                    "BernoulliSample plan must include BernoulliPct.");
            }

            var pct = plan.BernoulliPct.Value.ToString(CultureInfo.InvariantCulture);
            // FIX-B2.7D: SYSTEM (page-based), NOT BERNOULLI. SQL Server
            // rejects the BERNOULLI keyword; the strategy name on the C#
            // side stays "BernoulliSample" because that's the intent.
            return
                $"""
                SELECT * INTO #tf_deep_profile_sample
                FROM {fullName}
                TABLESAMPLE SYSTEM ({pct} PERCENT) REPEATABLE (42);
                """;
        }

        throw new NotSupportedException($"Unknown sampling method '{plan.Method}'.");
    }

    /// <summary>
    /// Builds a single-result-set UNION ALL query that returns one row per
    /// supplied column with NullCount, DistinctCount, MinValue, MaxValue.
    /// Reads from the <c>#tf_deep_profile_sample</c> temp table populated
    /// by <see cref="BuildSampleMaterializationSql"/>.
    ///
    /// MIN/MAX coerce to NVARCHAR(MAX) so the result set has a uniform shape;
    /// the orchestrator can then re-cast for typed comparisons. Distinct count
    /// is clamped via <c>SELECT TOP (DistinctCountClamp + 1) DISTINCT col</c>
    /// inline so we know whether the value is exact (≤ clamp) or saturated.
    ///
    /// <para>BIT-column handling (FIX-B2.7A): SQL Server rejects
    /// <c>MIN([bit_col])</c> / <c>MAX([bit_col])</c> with "Operand data type
    /// bit is invalid for min operator." PACS routinely flags rows with BIT
    /// columns, so a naive emission failed every PACS table that had one.
    /// The fix promotes BIT to <c>tinyint</c> inside the aggregate
    /// (<c>MIN(CAST([bit_col] AS tinyint))</c>) — preserves the 0/1 domain,
    /// keeps min/max meaningful, and avoids data loss vs. silently skipping
    /// the column. Discovered by B2.7-SMOKE against real PACS_Training; see
    /// <c>BuildMinMaxOperand</c> for the type-aware helper.</para>
    /// </summary>
    public static string BuildColumnAggregationSql(IReadOnlyList<ColumnRef> columns)
    {
        ArgumentNullException.ThrowIfNull(columns);
        if (columns.Count == 0)
        {
            throw new ArgumentException("Must supply at least one column.", nameof(columns));
        }

        var sb = new StringBuilder();
        for (var i = 0; i < columns.Count; i++)
        {
            var col = columns[i];
            ValidateIdent(col.Name, nameof(col.Name));

            var quoted      = QuoteIdentifier(col.Name);
            var minMaxOp    = BuildMinMaxOperand(quoted, col.DataType);
            var literalName = $"N'{Escape(col.Name)}'";

            if (i > 0)
            {
                sb.AppendLine("UNION ALL");
            }

            // The clamped distinct: SELECT COUNT(DISTINCT x) FROM the same
            // temp table inside a derived table, with a TOP guard so that
            // saturated columns short-circuit at the clamp.
            //
            // T-SQL syntax requires DISTINCT to come BEFORE TOP, not after
            // (SELECT [ALL | DISTINCT] [TOP (n) ...] ...). The reverse order
            // raises "Incorrect syntax near the keyword 'DISTINCT'" against
            // a live engine — caught by the Slice B2.6 Docker integration
            // tests (the unit tests' "contains TOP (1001)" assertion passes
            // regardless of order, which is why this didn't surface earlier).
            // NullCount is BIGINT — COUNT()/COUNT_BIG() differ on return type
            // (INT vs BIGINT). The reader binds to .GetInt64() so the SQL
            // must emit BIGINT, otherwise the live engine throws
            // InvalidCastException ("Unable to cast Int32 to Int64") even
            // when the value would fit in an int. Caught by the Slice B2.6
            // Docker integration test.
            sb.Append("SELECT ")
              .Append(literalName).Append(" AS ColumnName, ")
              .Append("COUNT_BIG(*) - COUNT_BIG(").Append(quoted).Append(") AS NullCount, ")
              .Append("(SELECT COUNT(*) FROM (SELECT DISTINCT TOP (").Append(DistinctCountClamp + 1).Append(") ")
              .Append(quoted).Append(" FROM #tf_deep_profile_sample) AS d) AS DistinctCount, ")
              .Append("CONVERT(NVARCHAR(MAX), MIN(").Append(minMaxOp).Append(")) AS MinValue, ")
              .Append("CONVERT(NVARCHAR(MAX), MAX(").Append(minMaxOp).Append(")) AS MaxValue ")
              .AppendLine("FROM #tf_deep_profile_sample");
        }
        sb.Append(';');
        return sb.ToString();
    }

    /// <summary>
    /// Returns the operand to wrap in <c>MIN()</c> / <c>MAX()</c> for a column.
    /// For SQL types that aggregate natively, returns the bracket-quoted
    /// column reference unchanged. For BIT columns — which SQL Server rejects
    /// with "Operand data type bit is invalid for min operator" — returns
    /// <c>CAST([col] AS tinyint)</c>. The 0/1 domain is preserved end-to-end
    /// because the outer <c>CONVERT(NVARCHAR(MAX), …)</c> serializes the
    /// promoted tinyint as <c>"0"</c>/<c>"1"</c>, identical to what the BIT
    /// would have produced if it had aggregated.
    ///
    /// Comparison vs. silently skipping BIT columns: the workbench needs
    /// MinValue/MaxValue rows for every column the structural atlas saw —
    /// downstream Slice C (Mapping Workbook) keys off the row existing.
    /// Skipping would leave gaps that look like "this column wasn't profiled"
    /// instead of "this column has values 0 and/or 1."
    /// </summary>
    public static string BuildMinMaxOperand(string quotedColumnName, string sqlType)
    {
        ArgumentNullException.ThrowIfNull(quotedColumnName);
        ArgumentNullException.ThrowIfNull(sqlType);

        return string.Equals(sqlType, "bit", StringComparison.OrdinalIgnoreCase)
            ? $"CAST({quotedColumnName} AS tinyint)"
            : quotedColumnName;
    }

    /// <summary>
    /// True when <paramref name="sqlType"/> is a SQL Server spatial type
    /// (<c>geometry</c> or <c>geography</c>, case-insensitive).
    ///
    /// <para><b>FIX-B2.7B architectural decision (PACS spatial-skip policy).</b>
    /// Benton County GIS truth is external to PACS — it lands in TerraAtlas
    /// from SHP files, geodatabases, or the ArcGIS API. PACS-side spatial
    /// columns (e.g. <c>__AAPARCEL_</c> heritage tables that carry a
    /// <c>geometry</c> shape) are NOT authoritative; treating them as such
    /// would create mapping pressure from valuation data into operational GIS
    /// truth, which inverts the suite boundary.</para>
    ///
    /// <para>Concretely the deep profiler must not run <c>DISTINCT</c>,
    /// <c>GROUP BY</c>, or <c>MIN</c>/<c>MAX</c> over spatial values — SQL
    /// Server rejects all three with errors like <i>"the geometry data type
    /// cannot be selected as DISTINCT because it is not comparable."</i> The
    /// reader filters spatial columns out of the per-table column list at the
    /// top of <see cref="ProfileTableAsync"/>, so they never appear in any
    /// aggregation, sample, top-N, or code-candidate query.</para>
    ///
    /// <para>Out-of-band signal: the structural atlas (Slice B1) already
    /// records that the column exists, with its declared type. Downstream
    /// observability can detect "the structural pass saw geometry, the deep
    /// pass produced no column-stats row" → policy skip, not a profile
    /// failure.</para>
    /// </summary>
    public static bool IsSpatialType(string sqlType)
    {
        ArgumentNullException.ThrowIfNull(sqlType);

        return string.Equals(sqlType, "geometry",  StringComparison.OrdinalIgnoreCase)
            || string.Equals(sqlType, "geography", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// True when <paramref name="sqlType"/> is a SQL Server optimistic-
    /// concurrency rowversion type (<c>rowversion</c> or its legacy
    /// synonym <c>timestamp</c>, case-insensitive).
    ///
    /// <para><b>FIX-B2.7C architectural decision (rowversion-skip policy).</b>
    /// PACS routinely carries a <c>tsRowVersion</c> / <c>timestamp</c> column
    /// on every business table — it is an opaque 8-byte binary token used by
    /// SQL Server for optimistic-concurrency checks, NOT business data. The
    /// engine actively rejects converting it to text:</para>
    /// <code>
    ///     Explicit conversion from data type timestamp to nvarchar(max)
    ///     is not allowed.
    /// </code>
    /// <para>The deep profiler's MIN/MAX/CONVERT path therefore breaks every
    /// business table (property_val, imprv, imprv_detail, land_detail, …)
    /// — exactly the tables Slice C (Mapping Workbook) keys off. Two paths
    /// were considered:
    /// <list type="bullet">
    /// <item><b>Hex-coerce</b> via <c>CONVERT(VARBINARY(MAX), col)</c> →
    ///   would yield meaningless 0xfeed-style strings the workbench would
    ///   never use.</item>
    /// <item><b>Skip</b> at the deep-profile level. The structural atlas
    ///   (Slice B1) already records the column with its declared type;
    ///   downstream observability still sees "this table has a rowversion
    ///   token" without needing distinct/min/max stats over it.</item>
    /// </list>
    /// Skip wins on the same "kind of data is this?" axis as the spatial
    /// policy: a concurrency token is not data the workbench will ever map,
    /// rank, or present to the assessor.</para>
    ///
    /// <para>Out-of-band signal: same as spatial — structural saw the column,
    /// deep stats absent, classify as policy skip rather than profile
    /// failure.</para>
    /// </summary>
    public static bool IsConcurrencyType(string sqlType)
    {
        ArgumentNullException.ThrowIfNull(sqlType);

        // SQL Server treats `timestamp` and `rowversion` as the same type;
        // sys.types reports both names against the same system_type_id (189),
        // and which one shows up depends on how the column was declared
        // historically. Both PACS-era schemas use `timestamp`, but new code
        // emits `rowversion` — accept either.
        return string.Equals(sqlType, "rowversion", StringComparison.OrdinalIgnoreCase)
            || string.Equals(sqlType, "timestamp",  StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Returns the subset of <paramref name="columns"/> that are eligible for
    /// deep profiling. Currently the filter combines two skip policies, both
    /// "this column is not the kind of data the workbench cares about, and
    /// the engine rejects our coercion path over it":
    /// <list type="bullet">
    /// <item>Spatial types (<see cref="IsSpatialType"/>) — FIX-B2.7B,
    ///   GIS truth lives in TerraAtlas, not PACS.</item>
    /// <item>Concurrency tokens (<see cref="IsConcurrencyType"/>) —
    ///   FIX-B2.7C, rowversion / timestamp is an opaque 8-byte binary
    ///   token, not business data.</item>
    /// </list>
    /// The helper is named for the policy intent rather than the type so
    /// future skip rules (e.g. encrypted columns, computed columns of
    /// unsupported provenance) extend in one place.
    ///
    /// Returns a <see cref="List{ColumnRef}"/> rather than an
    /// <c>IEnumerable</c> because the caller indexes the result alongside
    /// <c>columnStats[i]</c> from the aggregation reader, so a stable random-
    /// access list is part of the contract.
    /// </summary>
    public static List<ColumnRef> FilterProfilableColumns(IReadOnlyList<ColumnRef> columns)
    {
        ArgumentNullException.ThrowIfNull(columns);

        var result = new List<ColumnRef>(columns.Count);
        foreach (var col in columns)
        {
            if (IsSpatialType(col.DataType))
            {
                continue;
            }

            if (IsConcurrencyType(col.DataType))
            {
                continue;
            }

            result.Add(col);
        }
        return result;
    }

    /// <summary>
    /// Builds the random-sample-values query for a single column: returns up
    /// to <see cref="SampleValuesPerColumn"/> rows from the materialized
    /// sample, ordered by NEWID() so the orchestrator can take the first 10
    /// without bias toward physical row order.
    /// </summary>
    public static string BuildSampleValuesSql(string columnName)
    {
        ValidateIdent(columnName, nameof(columnName));
        return
            $"""
            SELECT TOP ({SampleValuesPerColumn}) CONVERT(NVARCHAR(MAX), {QuoteIdentifier(columnName)}) AS Value
            FROM #tf_deep_profile_sample
            ORDER BY NEWID();
            """;
    }

    /// <summary>
    /// Builds the top-N frequency query for a single column. Ordered by count
    /// descending; ties broken by value ascending so the result is
    /// deterministic across repeat profile runs of the same sample.
    /// </summary>
    public static string BuildTopValuesSql(string columnName)
    {
        ValidateIdent(columnName, nameof(columnName));
        var quoted = QuoteIdentifier(columnName);
        return
            $"""
            SELECT TOP ({TopValuesKept})
                   CONVERT(NVARCHAR(MAX), {quoted}) AS Value,
                   COUNT(*) AS Count
            FROM #tf_deep_profile_sample
            WHERE {quoted} IS NOT NULL
            GROUP BY {quoted}
            ORDER BY Count DESC, {quoted} ASC;
            """;
    }

    // ── Code-candidate heuristic (pure, unit-testable) ───────────────────

    /// <summary>
    /// Decides whether a column qualifies as a code-table candidate per the
    /// B2.0 heuristic. Pure function — no I/O, deterministic on inputs.
    ///
    /// Returns null when the column does NOT qualify; returns a populated
    /// record (without <c>CandidateCodesJson</c>) when it does. The caller
    /// is responsible for running <see cref="BuildTopValuesSql"/> against the
    /// candidate column and stuffing the JSON in afterward.
    /// </summary>
    public static CodeCandidateRecord? DetectCodeCandidate(
        ColumnStatsRecord stats,
        string dataType,
        int sampleSize)
    {
        ArgumentNullException.ThrowIfNull(stats);
        ArgumentNullException.ThrowIfNull(dataType);

        if (sampleSize <= 0) return null;
        if (!stats.DistinctCountIsExact) return null;
        if (stats.DistinctCount <= 0) return null;
        if (stats.DistinctCount > CodeCandidateMaxDistinct) return null;
        if (!IsCodeCandidateType(dataType)) return null;

        var ratio = decimal.Round(
            (decimal)stats.DistinctCount / sampleSize,
            4,
            MidpointRounding.AwayFromZero);

        if (ratio >= CodeCandidateMaxDistinctRatio) return null;

        return new CodeCandidateRecord(
            SchemaName:         stats.SchemaName,
            TableName:          stats.TableName,
            ColumnName:         stats.ColumnName,
            DistinctCount:      stats.DistinctCount,
            SampleSize:         sampleSize,
            DistinctRatio:      ratio,
            Reason:             ChooseReason(dataType),
            CandidateCodesJson: null);
    }

    private static bool IsCodeCandidateType(string sqlServerType)
    {
        return sqlServerType.ToLowerInvariant() switch
        {
            "varchar"   => true,
            "nvarchar"  => true,
            "char"      => true,
            "nchar"     => true,
            "tinyint"   => true,
            "smallint"  => true,
            _           => false,
        };
    }

    private static string ChooseReason(string sqlServerType)
    {
        var lower = sqlServerType.ToLowerInvariant();
        return lower is "tinyint" or "smallint"
            ? "low_cardinality_smallint"
            : "low_cardinality_string";
    }

    // ── Identifier safety ────────────────────────────────────────────────

    /// <summary>Bracket-quote a SQL Server identifier.</summary>
    public static string QuoteIdentifier(string ident)
    {
        ValidateIdent(ident, nameof(ident));
        return $"[{ident}]";
    }

    /// <summary>Escape a string literal (double single quotes).</summary>
    public static string Escape(string literal)
    {
        ArgumentNullException.ThrowIfNull(literal);
        return literal.Replace("'", "''");
    }

    private static void ValidateIdent(string ident, string paramName)
    {
        ArgumentNullException.ThrowIfNull(ident, paramName);
        if (string.IsNullOrWhiteSpace(ident))
        {
            throw new ArgumentException("Identifier cannot be blank.", paramName);
        }

        // Closing bracket inside an identifier would let an attacker (or
        // catalog corruption) break out of [bracket] quoting. The structural
        // atlas catalog won't produce these legitimately, so reject loudly
        // rather than silently double-bracket.
        if (ident.Contains(']'))
        {
            throw new ArgumentException(
                $"Identifier '{ident}' contains a closing bracket — refusing to compose SQL.",
                paramName);
        }
    }

    // ── End-to-end profile call ──────────────────────────────────────────

    /// <summary>
    /// Profile a single table end-to-end. Pulls a row-count estimate, picks
    /// a sampling plan, materializes the sample, runs the column aggregation,
    /// pulls sample values + top-N for code candidates, and runs the
    /// code-candidate heuristic.
    ///
    /// Implementation calls into ADO.NET directly using the connection passed
    /// to the constructor. The Slice B2.6 Docker integration tests verify the
    /// end-to-end execution path against a live <c>azure-sql-edge</c> container.
    /// </summary>
    public async Task<DeepProfileResult> ProfileTableAsync(
        string schemaName,
        string tableName,
        IReadOnlyList<ColumnRef> columns,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(columns);

        // Skip policies — see FilterProfilableColumns. Two filters today:
        //   FIX-B2.7B (spatial)     — geometry / geography. Benton GIS
        //                             truth lives in TerraAtlas, not PACS.
        //   FIX-B2.7C (concurrency) — rowversion / timestamp. Opaque
        //                             8-byte binary token, not business
        //                             data. Engine also rejects
        //                             CONVERT(NVARCHAR(MAX), MIN(rowversion))
        //                             with "Explicit conversion from data
        //                             type timestamp to nvarchar(max) is
        //                             not allowed." Discovered in
        //                             B2.7-TARGETED against property_val,
        //                             imprv, imprv_detail, land_detail.
        // Filtering at the top means the reader never asks the engine to
        // aggregate over these columns. The structural atlas (B1) already
        // records that they exist with their declared type — downstream
        // observability can detect "structural saw it, deep stats absent"
        // as a policy skip rather than a profile failure.
        var profilableColumns = FilterProfilableColumns(columns);

        if (profilableColumns.Count == 0)
        {
            // Empty-column or all-skipped table: persist a stats row and
            // return. Matches the structural atlas behavior when a table
            // has no columns visible (rare, possible with permission-
            // restricted accounts) — and the all-policy-skipped case where
            // every column is filtered (e.g. a PACS heritage table that
            // holds only a parcel-id + geometry, or a join table that's
            // just a rowversion + a couple of FKs all of which the caller
            // chose to omit).
            var emptyTable = await ReadRowCountAsync(schemaName, tableName, ct);
            return new DeepProfileResult(
                Table:          new TableStatsRecord(schemaName, tableName, emptyTable.Count, emptyTable.IsExact, 0, "Full"),
                Columns:        Array.Empty<ColumnStatsRecord>(),
                CodeCandidates: Array.Empty<CodeCandidateRecord>());
        }

        // 1. Plan the sampling strategy.
        var (rowCount, isExact) = await ReadRowCountAsync(schemaName, tableName, ct);
        var plan = PlanSampling(rowCount, isExact);

        // 2. Materialize sample to temp table; capture actual sample size.
        //    The materialization SELECT * INTO copies every column including
        //    spatial ones — that's fine, T-SQL doesn't object to copying
        //    geometry into a temp table; it only objects to aggregating it.
        //    Filtering at the column-aggregation level is sufficient.
        //
        //    FIX-B2.7E: this is THE expensive command (full-row copy +
        //    TABLESAMPLE scan against potentially millions of rows). Use the
        //    Materialization budget; everything else stays on the short
        //    Metadata budget.
        await ExecuteNonQueryAsync(
            BuildSampleMaterializationSql(schemaName, tableName, plan),
            _timeoutBudget.MaterializationSeconds,
            ct);
        var sampleSize = await ScalarIntAsync(
            "SELECT COUNT_BIG(*) FROM #tf_deep_profile_sample;",
            _timeoutBudget.MetadataSeconds,
            ct);

        try
        {
            // 3. Per-column aggregation in a single round trip — over the
            //    spatial-filtered column set only.
            var columnStats = await ReadColumnAggregationAsync(schemaName, tableName, profilableColumns, sampleSize, ct);

            // 4. Top-N + sample-values for code candidates only (avoid running
            //    these expensive scans for every column).
            var augmented = new List<ColumnStatsRecord>(columnStats.Count);
            var candidates = new List<CodeCandidateRecord>();
            for (var i = 0; i < columnStats.Count; i++)
            {
                var stats = columnStats[i];
                var col   = profilableColumns[i];

                var sampleValuesJson = await ReadSampleValuesJsonAsync(col.Name, ct);
                var withSamples      = stats with { SampleValuesJson = sampleValuesJson };

                var candidate = DetectCodeCandidate(withSamples, col.DataType, (int)sampleSize);
                string? topValuesJson = null;

                if (candidate is not null)
                {
                    topValuesJson = await ReadTopValuesJsonAsync(col.Name, ct);
                    candidates.Add(candidate with { CandidateCodesJson = topValuesJson });
                }

                augmented.Add(withSamples with { TopValuesJson = topValuesJson });
            }

            // 5. Compose the table stats row.
            var tableStats = new TableStatsRecord(
                SchemaName:      schemaName,
                TableName:       tableName,
                RowCount:        rowCount,
                RowCountIsExact: plan.RowCountIsExact,
                SampleRowCount:  (int)sampleSize,
                SamplingMethod:  plan.Method);

            return new DeepProfileResult(tableStats, augmented, candidates);
        }
        finally
        {
            // 6. Drop the temp table — even if a downstream step threw.
            //    Session-local temps auto-drop on disconnect, but in a long-
            //    lived connection the orchestrator may profile many tables
            //    in sequence.
            //
            //    FIX-B2.7E: cleanup is metadata-cheap; short timeout. If the
            //    enclosing materialization or aggregation already broke the
            //    connection, this DROP TABLE may itself throw — but the
            //    finally is still the right place for it because session-
            //    local temps auto-drop on connection close, so a failure
            //    here is benign in the per-table session world (the session
            //    is about to be disposed anyway).
            try
            {
                await ExecuteNonQueryAsync(
                    "DROP TABLE IF EXISTS #tf_deep_profile_sample;",
                    _timeoutBudget.MetadataSeconds,
                    ct);
            }
            catch (Exception cleanupEx) when (cleanupEx is not OperationCanceledException)
            {
                // Swallow: the per-table session is about to be disposed
                // (orchestrator opens a new session per table — see
                // FIX-B2.7E). The temp table dies with the connection.
            }
        }
    }

    // ── ADO.NET helpers ──────────────────────────────────────────────────

    private async Task<(long Count, bool IsExact)> ReadRowCountAsync(
        string schemaName, string tableName, CancellationToken ct)
    {
        // Always fetch the estimate first — it's cheap and tells us whether
        // we can afford an exact COUNT(*). Both reads are metadata-class.
        var estimate = await ScalarLongAsync(
            BuildRowCountEstimateSql(schemaName, tableName),
            _timeoutBudget.MetadataSeconds,
            ct);

        if (estimate <= FullThresholdRowCount)
        {
            var exact = await ScalarLongAsync(
                BuildExactRowCountSql(schemaName, tableName),
                _timeoutBudget.MetadataSeconds,
                ct);
            return (exact, IsExact: true);
        }

        return (estimate, IsExact: false);
    }

    private async Task<IReadOnlyList<ColumnStatsRecord>> ReadColumnAggregationAsync(
        string schemaName,
        string tableName,
        IReadOnlyList<ColumnRef> columns,
        long sampleSize,
        CancellationToken ct)
    {
        // FIX-B2.7E: per-column UNION ALL aggregation runs against the
        // materialized sample (≤ 10K rows for big tables) but a wide column
        // list still produces a long plan. Aggregation budget.
        var sql = BuildColumnAggregationSql(columns);
        await using var cmd = new SqlCommand(sql, _connection)
        {
            CommandTimeout = _timeoutBudget.AggregationSeconds,
        };
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        var records = new List<ColumnStatsRecord>(columns.Count);
        while (await reader.ReadAsync(ct))
        {
            var columnName     = reader.GetString(0);
            var nullCount      = reader.GetInt64(1);
            var distinctRaw    = reader.GetInt32(2);
            var minValue       = reader.IsDBNull(3) ? null : reader.GetString(3);
            var maxValue       = reader.IsDBNull(4) ? null : reader.GetString(4);

            var distinctIsExact = distinctRaw <= DistinctCountClamp;
            var distinctCount   = distinctIsExact ? distinctRaw : DistinctCountClamp;

            var nullPct = sampleSize == 0
                ? 0m
                : decimal.Round((decimal)nullCount / sampleSize * 100m, 4, MidpointRounding.AwayFromZero);

            records.Add(new ColumnStatsRecord(
                SchemaName:           schemaName,
                TableName:            tableName,
                ColumnName:           columnName,
                ParentRowCount:       (int)sampleSize,
                NullCount:            nullCount,
                NullPct:              nullPct,
                DistinctCount:        distinctCount,
                DistinctCountIsExact: distinctIsExact,
                MinValue:             minValue,
                MaxValue:             maxValue,
                SampleValuesJson:     null,
                TopValuesJson:        null));
        }
        return records;
    }

    private async Task<string?> ReadSampleValuesJsonAsync(string columnName, CancellationToken ct)
    {
        // FIX-B2.7E: aggregation-class — runs against the materialized temp
        // sample, ORDER BY NEWID() can be moderately expensive.
        await using var cmd = new SqlCommand(BuildSampleValuesSql(columnName), _connection)
        {
            CommandTimeout = _timeoutBudget.AggregationSeconds,
        };
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        var values = new List<string?>(SampleValuesPerColumn);
        while (await reader.ReadAsync(ct))
        {
            values.Add(reader.IsDBNull(0) ? null : reader.GetString(0));
        }
        return values.Count == 0 ? null : JsonSerializer.Serialize(values);
    }

    private async Task<string?> ReadTopValuesJsonAsync(string columnName, CancellationToken ct)
    {
        // FIX-B2.7E: aggregation-class — GROUP BY + ORDER BY against the
        // sample temp table.
        await using var cmd = new SqlCommand(BuildTopValuesSql(columnName), _connection)
        {
            CommandTimeout = _timeoutBudget.AggregationSeconds,
        };
        await using var reader = await cmd.ExecuteReaderAsync(ct);

        var rows = new List<TopValueRow>(TopValuesKept);
        while (await reader.ReadAsync(ct))
        {
            rows.Add(new TopValueRow(
                Value: reader.IsDBNull(0) ? null : reader.GetString(0),
                Count: reader.GetInt32(1)));
        }
        return rows.Count == 0 ? null : JsonSerializer.Serialize(rows);
    }

    private async Task ExecuteNonQueryAsync(string sql, int timeoutSeconds, CancellationToken ct)
    {
        await using var cmd = new SqlCommand(sql, _connection)
        {
            CommandTimeout = timeoutSeconds,
        };
        await cmd.ExecuteNonQueryAsync(ct);
    }

    private async Task<long> ScalarLongAsync(string sql, int timeoutSeconds, CancellationToken ct)
    {
        await using var cmd = new SqlCommand(sql, _connection)
        {
            CommandTimeout = timeoutSeconds,
        };
        var raw = await cmd.ExecuteScalarAsync(ct);
        return raw switch
        {
            null     => 0L,
            DBNull   => 0L,
            long l   => l,
            int i    => i,
            decimal d => (long)d,
            _        => Convert.ToInt64(raw, CultureInfo.InvariantCulture),
        };
    }

    private async Task<long> ScalarIntAsync(string sql, int timeoutSeconds, CancellationToken ct)
    {
        return await ScalarLongAsync(sql, timeoutSeconds, ct);
    }

    private sealed record TopValueRow(string? Value, int Count);
}
