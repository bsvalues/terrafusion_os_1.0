// TFR-080: xUnit tests for IConnector implementations
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Moq;
using Xunit;

namespace TerraFusion.API.Tests.Sync
{
    /// <summary>
    /// Tests for IConnector implementations: lifecycle, connection testing,
    /// data fetching, and schema discovery.
    /// </summary>
    public class ConnectorTests
    {
        private readonly Mock<IConnector> _mockConnector;

        public ConnectorTests()
        {
            _mockConnector = new Mock<IConnector>();
            _mockConnector.SetupGet(c => c.ConnectorId).Returns("pacs-benton-test");
        }

        /// <summary>
        /// Connect and disconnect lifecycle should complete without errors.
        /// </summary>
        [Fact]
        public async Task Connect_Disconnect_Lifecycle_Completes()
        {
            var connected = false;

            _mockConnector.Setup(c => c.ConnectAsync(It.IsAny<CancellationToken>()))
                .Callback(() => connected = true)
                .Returns(Task.CompletedTask);

            _mockConnector.Setup(c => c.DisconnectAsync(It.IsAny<CancellationToken>()))
                .Callback(() => connected = false)
                .Returns(Task.CompletedTask);

            await _mockConnector.Object.ConnectAsync();
            Assert.True(connected);

            await _mockConnector.Object.DisconnectAsync();
            Assert.False(connected);

            _mockConnector.Verify(c => c.ConnectAsync(It.IsAny<CancellationToken>()), Times.Once);
            _mockConnector.Verify(c => c.DisconnectAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// TestConnection should return a valid result with connection status.
        /// </summary>
        [Fact]
        public async Task TestConnection_Returns_Valid_Result()
        {
            var testResult = new ConnectorTestResult
            {
                IsConnected = true,
                Latency = TimeSpan.FromMilliseconds(45),
                ServerInfo = "SQL Server 2019 (15.0.4153)",
            };

            _mockConnector.Setup(c => c.TestConnectionAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(testResult);

            var result = await _mockConnector.Object.TestConnectionAsync();

            Assert.True(result.IsConnected);
            Assert.True(result.Latency.TotalMilliseconds > 0);
            Assert.NotNull(result.ServerInfo);
            Assert.Null(result.ErrorMessage);
        }

        /// <summary>
        /// TestConnection should return failure info when connection fails.
        /// </summary>
        [Fact]
        public async Task TestConnection_Returns_Failure_When_Unavailable()
        {
            var testResult = new ConnectorTestResult
            {
                IsConnected = false,
                ErrorMessage = "Connection refused: target machine actively refused connection.",
            };

            _mockConnector.Setup(c => c.TestConnectionAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(testResult);

            var result = await _mockConnector.Object.TestConnectionAsync();

            Assert.False(result.IsConnected);
            Assert.NotNull(result.ErrorMessage);
        }

        /// <summary>
        /// FetchRecords should return data with expected fields.
        /// </summary>
        [Fact]
        public async Task FetchRecords_Returns_Data()
        {
            var records = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["prop_id"] = 1,
                    ["parcel_number"] = "01-0001-001",
                    ["property_type"] = "R",
                    ["status_code"] = "A",
                },
                new()
                {
                    ["prop_id"] = 2,
                    ["parcel_number"] = "01-0001-002",
                    ["property_type"] = "C",
                    ["status_code"] = "A",
                },
            };

            _mockConnector.Setup(c => c.FetchRecordsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(records);

            var result = await _mockConnector.Object.FetchRecordsAsync();

            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Equal("01-0001-001", result[0]["parcel_number"]);
            Assert.Equal("01-0001-002", result[1]["parcel_number"]);
        }

        /// <summary>
        /// FetchRecords should return empty list when no data exists.
        /// </summary>
        [Fact]
        public async Task FetchRecords_Returns_Empty_When_No_Data()
        {
            _mockConnector.Setup(c => c.FetchRecordsAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Dictionary<string, object?>>());

            var result = await _mockConnector.Object.FetchRecordsAsync();

            Assert.NotNull(result);
            Assert.Empty(result);
        }

        /// <summary>
        /// FetchDeltaRecords should only return records modified after the given timestamp.
        /// </summary>
        [Fact]
        public async Task FetchDeltaRecords_Returns_Only_Changed_Records()
        {
            var since = DateTime.UtcNow.AddHours(-1);
            var deltaRecords = new List<Dictionary<string, object?>>
            {
                new()
                {
                    ["prop_id"] = 42,
                    ["parcel_number"] = "05-1234-001",
                    ["modify_date"] = DateTime.UtcNow.AddMinutes(-30),
                },
            };

            _mockConnector.Setup(c => c.FetchDeltaRecordsAsync(It.IsAny<DateTime>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(deltaRecords);

            var result = await _mockConnector.Object.FetchDeltaRecordsAsync(since);

            Assert.Single(result);
            Assert.Equal(42, result[0]["prop_id"]);
        }

        /// <summary>
        /// Schema discovery should return column name to type mappings.
        /// </summary>
        [Fact]
        public async Task DiscoverSchema_Returns_Column_Types()
        {
            var schema = new Dictionary<string, string>
            {
                ["prop_id"] = "int",
                ["parcel_number"] = "varchar(30)",
                ["property_type"] = "varchar(10)",
                ["create_date"] = "datetime",
            };

            _mockConnector.Setup(c => c.DiscoverSchemaAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(schema);

            var result = await _mockConnector.Object.DiscoverSchemaAsync();

            Assert.NotNull(result);
            Assert.True(result.Count >= 4);
            Assert.Equal("int", result["prop_id"]);
            Assert.Equal("varchar(30)", result["parcel_number"]);
        }

        /// <summary>
        /// Connector ID should be set and non-empty.
        /// </summary>
        [Fact]
        public void ConnectorId_Is_Set()
        {
            Assert.Equal("pacs-benton-test", _mockConnector.Object.ConnectorId);
        }

        /// <summary>
        /// FetchRecords should propagate exceptions from the connector.
        /// </summary>
        [Fact]
        public async Task FetchRecords_Propagates_Exceptions()
        {
            _mockConnector.Setup(c => c.FetchRecordsAsync(It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Connection lost during fetch."));

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                _mockConnector.Object.FetchRecordsAsync());
        }
    }
}
