using System;
using System.Collections.Generic;

namespace TerraFusion.Core.DTOs.Sync;

/// <summary>
/// Slice C44-B per-group entry for the stale-row summary
/// endpoint per the C44-A policy.
///
/// <para>One <see cref="StaleSummaryGroupDto"/> per
/// <c>(SourceWorkbookId, ComputedDecision)</c> pair in the
/// county's stale set.
/// <see cref="ComputedDecision"/> is serialized as the enum's
/// string name (<c>"Qualified"</c> / <c>"Excluded"</c> /
/// <c>"Inconclusive"</c>) for wire stability across enum-int
/// reordering.</para>
/// </summary>
public sealed record StaleSummaryGroupDto(
    Guid   SourceWorkbookId,
    string ComputedDecision,
    int    Count);

/// <summary>
/// Slice C44-B aggregate envelope for the stale-row summary
/// endpoint. Single bounded response (max 100 groups via the
/// C44-A Hard Guard 4 cap; truncates rather than throws on
/// overflow).
///
/// <para>Per C44-A:
/// <list type="bullet">
/// <item><see cref="TotalStaleRows"/> is the COUNT(*) of stale
///   rows in the county relative to the baseline — independent of
///   the group cap.</item>
/// <item><see cref="GroupCount"/> is the total number of distinct
///   <c>(SourceWorkbookId, ComputedDecision)</c> pairs BEFORE any
///   truncation. <see cref="Truncated"/> is <c>true</c> iff
///   <c>GroupCount &gt; 100</c>; in that case <see cref="Groups"/>
///   carries the top-100 by <c>count DESC</c>.</item>
/// <item><see cref="BaselineSource"/> is locked to one of two
///   values: <c>"explicit-query-param"</c> or
///   <c>"active-workbook-pointer"</c>.</item>
/// </list>
/// </para>
/// </summary>
public sealed record StaleSummaryDto(
    Guid   CountyId,
    Guid   BaselineWorkbookId,
    string BaselineSource,
    int    TotalStaleRows,
    int    GroupCount,
    IReadOnlyList<StaleSummaryGroupDto> Groups,
    bool   Truncated);
