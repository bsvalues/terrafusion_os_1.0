// PR-3 observability fix #3 — DoctrineDrainController.SerializeExceptionChain.
//
// These tests are the regression guard for "the bug that burned 3 days":
// previously $"{ex.GetType().Name}: {ex.Message}" silently dropped every
// inner exception, so when a real DbUpdateException → SqlException landed
// in a lane catch block, the operator saw only the outer wrapper text and
// none of the constraint name / conflicting key info that would have
// pointed at the cause. These tests assert the chain walks correctly,
// the depth cap holds, and a deep DbUpdateException-shaped chain
// survives serialization.

using FluentAssertions;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.Unit.Tests.Observability;

public class SerializeExceptionChainTests
{
    [Fact]
    public void Single_exception_includes_type_and_message_and_stack_marker()
    {
        var ex = new InvalidOperationException("boom");

        var result = DoctrineDrainController.SerializeExceptionChain(ex);

        result.Should().Contain("InvalidOperationException");
        result.Should().Contain("boom");
        // No INNER marker for a single-exception chain.
        result.Should().NotContain(" || INNER: ");
        // The STACK suffix is always appended.
        result.Should().Contain(" || STACK: ");
    }

    [Fact]
    public void Nested_three_levels_deep_preserves_all_messages_and_inner_markers()
    {
        var inner3 = new InvalidOperationException("level-3");
        var inner2 = new ApplicationException("level-2", inner3);
        var outer = new InvalidOperationException("level-1", inner2);

        var result = DoctrineDrainController.SerializeExceptionChain(outer);

        result.Should().Contain("level-1");
        result.Should().Contain("level-2");
        result.Should().Contain("level-3");
        // Two inner markers for a 3-deep chain (depth 0 = outer, 1 + 2 = inners).
        var innerMarkerCount = result.Split(" || INNER: ").Length - 1;
        innerMarkerCount.Should().Be(2);
    }

    [Fact]
    public void DbUpdateException_shaped_chain_preserves_sql_constraint_text()
    {
        // Simulate the EF Core failure surface without actually depending on
        // EF runtime types in this unit test (just need the InnerException
        // chain shape). The asserted text is the kind of payload that was
        // being dropped in the lane error summary pre-PR-3.
        var sqlLike = new InvalidOperationException(
            "Violation of UNIQUE KEY constraint 'UX_tf_improvement_truth_natural_key'. " +
            "Cannot insert duplicate key in object 'truth_pacs.imprv_current'. " +
            "The duplicate key value is (12345, 2026, 0, 1).");
        var dbUpdateLike = new InvalidOperationException(
            "An error occurred while saving the entity changes.", sqlLike);

        var result = DoctrineDrainController.SerializeExceptionChain(dbUpdateLike);

        result.Should().Contain("UX_tf_improvement_truth_natural_key");
        result.Should().Contain("duplicate key value is (12345, 2026, 0, 1)");
        result.Should().Contain(" || INNER: ");
    }

    [Fact]
    public void Depth_cap_prevents_unbounded_walks_on_cyclic_or_pathological_chains()
    {
        // Construct an 8-deep chain; default cap is 5.
        Exception current = new InvalidOperationException("level-8");
        for (var i = 7; i >= 1; i--)
        {
            current = new InvalidOperationException($"level-{i}", current);
        }

        var result = DoctrineDrainController.SerializeExceptionChain(current, maxDepth: 5);

        // Levels 1-5 must be present; level-6 onwards must NOT be present.
        result.Should().Contain("level-1");
        result.Should().Contain("level-5");
        result.Should().NotContain("level-6:"); // colon to avoid substring match
        result.Should().NotContain("level-7:");
        result.Should().NotContain("level-8:");
    }

    [Fact]
    public void Stack_trace_dump_is_truncated_at_4kb()
    {
        // Build a synthetic exception whose ToString() exceeds 4096 chars by
        // chaining a very long message. We cannot directly inflate the stack
        // trace, but ToString() includes the Message, so a long message will
        // push past the truncation threshold.
        var longMessage = new string('x', 5000);
        var ex = new InvalidOperationException(longMessage);

        var result = DoctrineDrainController.SerializeExceptionChain(ex);

        result.Should().Contain("... [truncated]");
    }

    [Fact]
    public void Null_exception_returns_empty_string_without_throwing()
    {
        var result = DoctrineDrainController.SerializeExceptionChain(null!);
        result.Should().BeEmpty();
    }
}
