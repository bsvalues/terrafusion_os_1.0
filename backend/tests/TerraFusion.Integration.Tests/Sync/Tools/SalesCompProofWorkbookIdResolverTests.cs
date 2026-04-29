using FluentAssertions;
using Moq;
using TerraFusion.Sync.Workbench.Mapping;
using TerraFusion.Tools.SalesCompProof;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Integration.Tests.Sync.Tools;

/// <summary>
/// Slice C42-A tests for <see cref="WorkbookIdResolver"/>. Pure
/// resolution logic over <see cref="ISyncCountyActiveWorkbookService"/>;
/// no I/O, no DB. Locks the three resolution behaviors the
/// SalesCompProof CLI now supports:
/// <list type="number">
/// <item>Explicit <c>--workbook-id</c> takes precedence and bypasses
///   the pointer lookup.</item>
/// <item>Omitted <c>--workbook-id</c> resolves via the C41-B
///   active-workbook pointer.</item>
/// <item>Omitted <c>--workbook-id</c> with no pointer returns
///   <c>null</c> so the runner can fail closed with the locked
///   <see cref="WorkbookIdResolver.NoActiveWorkbookMessage"/>.</item>
/// </list>
/// </summary>
public class SalesCompProofWorkbookIdResolverTests
{
    private static readonly Guid CountyId   = Guid.Parse("eb94de6d-973f-4997-b257-ae1eac352ac7");
    private static readonly Guid ExplicitWb = Guid.Parse("a767c8a2-5b8a-4846-af8b-c3496601e924");
    private static readonly Guid PointedWb  = Guid.Parse("c0c0c0c0-1111-2222-3333-444444444444");

    private static SyncCountyActiveWorkbookSnapshot SnapshotFor(Guid workbookId) =>
        new(CountyId, workbookId, DateTime.UtcNow, "test-operator", "test reason");

    // ── 1. Explicit workbook id wins (precedence) ───────────────────────

    [Fact]
    public async Task ResolveAsync_ExplicitWorkbookId_BypassesPointerLookup()
    {
        var pointer = new Mock<ISyncCountyActiveWorkbookService>(MockBehavior.Strict);
        // No setup on GetAsync — the resolver MUST NOT call it when
        // an explicit workbook id is supplied. Strict mock fails the
        // test if it does.

        var resolved = await WorkbookIdResolver.ResolveAsync(
            CountyId, explicitWorkbookId: ExplicitWb, pointer.Object);

        resolved.Should().Be(ExplicitWb);
        pointer.Verify(p => p.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "explicit --workbook-id MUST bypass the pointer lookup");
    }

    [Fact]
    public async Task ResolveAsync_ExplicitWorkbookId_BypassesEvenWhenPointerDiffers()
    {
        // Operator passed --workbook-id pointing at an OLDER workbook
        // for diagnostic purposes, while the county's active pointer
        // already names a newer one. Resolver must respect the
        // operator's explicit choice.
        var pointer = new Mock<ISyncCountyActiveWorkbookService>(MockBehavior.Strict);

        var resolved = await WorkbookIdResolver.ResolveAsync(
            CountyId, explicitWorkbookId: ExplicitWb, pointer.Object);

        resolved.Should().Be(ExplicitWb);
        pointer.Verify(p => p.GetAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    // ── 2. Omitted workbook id → resolves via pointer ──────────────────

    [Fact]
    public async Task ResolveAsync_OmittedWorkbookId_UsesActivePointer()
    {
        var pointer = new Mock<ISyncCountyActiveWorkbookService>();
        pointer.Setup(p => p.GetAsync(CountyId, It.IsAny<CancellationToken>()))
               .ReturnsAsync(SnapshotFor(PointedWb));

        var resolved = await WorkbookIdResolver.ResolveAsync(
            CountyId, explicitWorkbookId: null, pointer.Object);

        resolved.Should().Be(PointedWb);
        pointer.Verify(p => p.GetAsync(CountyId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ResolveAsync_EmptyGuidWorkbookId_TreatedAsOmittedAndUsesPointer()
    {
        // Guid.Empty as the explicit workbookId is parser-safe but
        // semantically meaningless; the resolver treats it the same
        // as omission. Ensures defensive handling against operators
        // passing "00000000-0000-0000-0000-000000000000" intentionally
        // or accidentally.
        var pointer = new Mock<ISyncCountyActiveWorkbookService>();
        pointer.Setup(p => p.GetAsync(CountyId, It.IsAny<CancellationToken>()))
               .ReturnsAsync(SnapshotFor(PointedWb));

        var resolved = await WorkbookIdResolver.ResolveAsync(
            CountyId, explicitWorkbookId: Guid.Empty, pointer.Object);

        resolved.Should().Be(PointedWb);
    }

    // ── 3. Omitted workbook id + no pointer → null (fail closed) ───────

    [Fact]
    public async Task ResolveAsync_OmittedWorkbookId_NoPointer_ReturnsNull()
    {
        var pointer = new Mock<ISyncCountyActiveWorkbookService>();
        pointer.Setup(p => p.GetAsync(CountyId, It.IsAny<CancellationToken>()))
               .ReturnsAsync((SyncCountyActiveWorkbookSnapshot?)null);

        var resolved = await WorkbookIdResolver.ResolveAsync(
            CountyId, explicitWorkbookId: null, pointer.Object);

        resolved.Should().BeNull(
            "no pointer → null so the runner can fail closed with the locked operator message");
    }

    // ── Argument validation ─────────────────────────────────────────────

    [Fact]
    public async Task ResolveAsync_NullPointerService_Throws()
    {
        Func<Task> act = () => WorkbookIdResolver.ResolveAsync(
            CountyId, explicitWorkbookId: ExplicitWb, pointerService: null!);
        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    // ── Operator message lock ───────────────────────────────────────────

    [Fact]
    public void NoActiveWorkbookMessage_FormatLocksOperatorRunbookText()
    {
        // The exact message text is part of the operator runbook;
        // changing the wording is a breaking change requiring its
        // own slice.
        var msg = WorkbookIdResolver.NoActiveWorkbookMessage(CountyId);

        msg.Should().Be(
            $"No active Mapping Workbook is configured for county {CountyId}. " +
            "Provide --workbook-id or set the county active workbook.");
    }
}
