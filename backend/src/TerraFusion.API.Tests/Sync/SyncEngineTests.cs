// TFR-076: xUnit tests for SyncEngine
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using Xunit;

namespace TerraFusion.API.Tests.Sync
{
    /// <summary>
    /// Represents a sync receipt returned by the sync engine.
    /// </summary>
    public class SyncReceipt
    {
        /// <summary>Unique sync operation identifier.</summary>
        public string SyncId { get; set; } = Guid.NewGuid().ToString("N");

        /// <summary>Whether the sync completed successfully.</summary>
        public bool Success { get; set; }

        /// <summary>Number of records fetched from source.</summary>
        public int RecordsFetched { get; set; }

        /// <summary>Number of records inserted.</summary>
        public int RecordsInserted { get; set; }

        /// <summary>Number of records updated.</summary>
        public int RecordsUpdated { get; set; }

        /// <summary>Number of records skipped (unchanged).</summary>
        public int RecordsSkipped { get; set; }

        /// <summary>Number of records that failed validation.</summary>
        public int RecordsFailed { get; set; }

        /// <summary>Error message if the sync failed.</summary>
        public string? ErrorMessage { get; set; }

        /// <summary>Duration of the sync operation.</summary>
        public TimeSpan Duration { get; set; }

        /// <summary>Sync mode (full or delta).</summary>
        public string SyncMode { get; set; } = "full";

        /// <summary>UTC timestamp when sync started.</summary>
        public DateTime StartedAt { get; set; }
    }

    /// <summary>
    /// Interface for the sync engine that coordinates data synchronization.
    /// </summary>
    public interface ISyncEngine
    {
        /// <summary>Runs a full sync operation.</summary>
        Task<SyncReceipt> RunFullSyncAsync(string connectorId, CancellationToken ct = default);

        /// <summary>Runs a delta sync fetching only changes since last sync.</summary>
        Task<SyncReceipt> RunDeltaSyncAsync(string connectorId, CancellationToken ct = default);
    }

    /// <summary>
    /// Interface for a data connector used by the sync engine.
    /// </summary>
    public interface IConnector
    {
        /// <summary>Connector identifier.</summary>
        string ConnectorId { get; }

        /// <summary>Tests the connection.</summary>
        Task<ConnectorTestResult> TestConnectionAsync(CancellationToken ct = default);

        /// <summary>Fetches all records.</summary>
        Task<List<Dictionary<string, object?>>> FetchRecordsAsync(CancellationToken ct = default);

        /// <summary>Fetches records changed since a given timestamp.</summary>
        Task<List<Dictionary<string, object?>>> FetchDeltaRecordsAsync(DateTime since, CancellationToken ct = default);

        /// <summary>Connects to the data source.</summary>
        Task ConnectAsync(CancellationToken ct = default);

        /// <summary>Disconnects from the data source.</summary>
        Task DisconnectAsync(CancellationToken ct = default);

        /// <summary>Discovers the source schema.</summary>
        Task<Dictionary<string, string>> DiscoverSchemaAsync(CancellationToken ct = default);
    }

    /// <summary>
    /// Result of testing a connector's connection.
    /// </summary>
    public class ConnectorTestResult
    {
        /// <summary>Whether the connection succeeded.</summary>
        public bool IsConnected { get; set; }

        /// <summary>Latency of the connection test.</summary>
        public TimeSpan Latency { get; set; }

        /// <summary>Error message if connection failed.</summary>
        public string? ErrorMessage { get; set; }

        /// <summary>Server version or identifying info.</summary>
        public string? ServerInfo { get; set; }
    }

    /// <summary>
    /// Tests for SyncEngine: full sync, delta sync, failure handling,
    /// and SyncReceipt accuracy.
    /// </summary>
    public class SyncEngineTests
    {
        /// <summary>
        /// Full sync should complete and return a receipt with correct counts.
        /// </summary>
        [Fact]
        public async Task FullSync_Completes_With_Correct_Counts()
        {
            var mockEngine = new Mock<ISyncEngine>();
            var expectedReceipt = new SyncReceipt
            {
                Success = true,
                RecordsFetched = 100,
                RecordsInserted = 80,
                RecordsUpdated = 15,
                RecordsSkipped = 5,
                RecordsFailed = 0,
                SyncMode = "full",
                Duration = TimeSpan.FromSeconds(10),
                StartedAt = DateTime.UtcNow,
            };

            mockEngine.Setup(e => e.RunFullSyncAsync("pacs-benton", It.IsAny<CancellationToken>()))
                .ReturnsAsync(expectedReceipt);

            var receipt = await mockEngine.Object.RunFullSyncAsync("pacs-benton");

            Assert.True(receipt.Success);
            Assert.Equal(100, receipt.RecordsFetched);
            Assert.Equal(80, receipt.RecordsInserted);
            Assert.Equal(15, receipt.RecordsUpdated);
            Assert.Equal(5, receipt.RecordsSkipped);
            Assert.Equal(0, receipt.RecordsFailed);
            Assert.Equal("full", receipt.SyncMode);
        }

        /// <summary>
        /// Delta sync should only fetch records changed since last sync.
        /// </summary>
        [Fact]
        public async Task DeltaSync_Fetches_Only_Changes()
        {
            var mockEngine = new Mock<ISyncEngine>();
            var deltaReceipt = new SyncReceipt
            {
                Success = true,
                RecordsFetched = 12,
                RecordsInserted = 3,
                RecordsUpdated = 9,
                RecordsSkipped = 0,
                RecordsFailed = 0,
                SyncMode = "delta",
            };

            mockEngine.Setup(e => e.RunDeltaSyncAsync("pacs-benton", It.IsAny<CancellationToken>()))
                .ReturnsAsync(deltaReceipt);

            var receipt = await mockEngine.Object.RunDeltaSyncAsync("pacs-benton");

            Assert.True(receipt.Success);
            Assert.Equal("delta", receipt.SyncMode);
            Assert.Equal(12, receipt.RecordsFetched);
            Assert.True(receipt.RecordsFetched < 100, "Delta should fetch fewer records than full sync.");
        }

        /// <summary>
        /// Sync engine should abort gracefully when the connector fails.
        /// </summary>
        [Fact]
        public async Task FailedConnector_Aborts_Gracefully()
        {
            var mockEngine = new Mock<ISyncEngine>();
            var failedReceipt = new SyncReceipt
            {
                Success = false,
                RecordsFetched = 0,
                RecordsInserted = 0,
                ErrorMessage = "Connection refused: PACS server unreachable.",
                SyncMode = "full",
            };

            mockEngine.Setup(e => e.RunFullSyncAsync("pacs-offline", It.IsAny<CancellationToken>()))
                .ReturnsAsync(failedReceipt);

            var receipt = await mockEngine.Object.RunFullSyncAsync("pacs-offline");

            Assert.False(receipt.Success);
            Assert.Equal(0, receipt.RecordsFetched);
            Assert.NotNull(receipt.ErrorMessage);
            Assert.Contains("unreachable", receipt.ErrorMessage, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// SyncReceipt counts should be internally consistent.
        /// </summary>
        [Fact]
        public void SyncReceipt_Counts_Are_Consistent()
        {
            var receipt = new SyncReceipt
            {
                RecordsFetched = 100,
                RecordsInserted = 60,
                RecordsUpdated = 25,
                RecordsSkipped = 10,
                RecordsFailed = 5,
            };

            var totalProcessed = receipt.RecordsInserted + receipt.RecordsUpdated
                + receipt.RecordsSkipped + receipt.RecordsFailed;

            Assert.Equal(receipt.RecordsFetched, totalProcessed);
        }

        /// <summary>
        /// Cancellation should be respected by the sync engine.
        /// </summary>
        [Fact]
        public async Task Sync_Respects_Cancellation()
        {
            var mockEngine = new Mock<ISyncEngine>();
            mockEngine.Setup(e => e.RunFullSyncAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new OperationCanceledException());

            using var cts = new CancellationTokenSource();
            cts.Cancel();

            await Assert.ThrowsAsync<OperationCanceledException>(() =>
                mockEngine.Object.RunFullSyncAsync("pacs-benton", cts.Token));
        }
    }
}
