using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Moq;
using TerraFusion.API.Hubs;
using TerraFusion.API.Services;
using TerraFusion.Abstractions.Interfaces;
using Xunit;

namespace TerraFusion.API.Tests
{
    public class OSCoreHubTests
    {
        private class TestableOSCoreHub : OSCoreHub
        {
            public TestableOSCoreHub(IAuditLogger audit, IAuthValidator auth, Microsoft.Extensions.Logging.ILogger<OSCoreHub> logger) : base(audit, auth, logger) { }
            public void SetClients(IHubCallerClients clients) => Clients = clients;
            public void SetContext(HubCallerContext context) => Context = context;
        }

        [Fact]
        public async Task LoadModule_EmptyName_Fails()
        {
            var (hub, caller, _, _) = BuildHub();
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            // Authenticate with permission to load cama-core (won't be used due to empty name)
            var envelope = new AuthEnvelope(new AuthPayload("benton", "PACS_9.0", "nonce-ok2", now, Roles: new string[] { "assessor" }, Permissions: new[] { "load:cama-core" }), "sig");
            await hub.AuthenticateOS(new OSCoreHub.AuthRequest("benton", "PACS_9.0", envelope));

            await hub.LoadModule(new OSCoreHub.ModuleLoadRequest("", "test"));

            caller.Verify(p => p.SendCoreAsync(
                "ModuleLoadFailed",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        private static (TestableOSCoreHub hub, Mock<ISingleClientProxy> callerProxy, Mock<IAuditLogger> audit, Mock<IAuthValidator> auth) BuildHub()
        {
            var caller = new Mock<ISingleClientProxy>();
            caller
                .Setup(p => p.SendCoreAsync(It.IsAny<string>(), It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var clients = new Mock<IHubCallerClients>();
            clients.Setup(c => c.Caller).Returns(caller.Object);

            var ctx = new Mock<HubCallerContext>();
            ctx.SetupGet(c => c.ConnectionId).Returns("test-conn-1");

            var audit = new Mock<IAuditLogger>();
            audit
                .Setup(a => a.LogAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()))
                .Returns(Task.CompletedTask);

            var auth = new Mock<IAuthValidator>();
            auth.SetupGet(a => a.AllowedDrift).Returns(TimeSpan.FromMinutes(1));
            auth
                .Setup(a => a.Validate(It.IsAny<AuthEnvelope>(), out It.Ref<string?>.IsAny))
                .Returns(true);

            var logger = new Mock<Microsoft.Extensions.Logging.ILogger<OSCoreHub>>();
            var hub = new TestableOSCoreHub(audit.Object, auth.Object, logger.Object);
            hub.SetClients(clients.Object);
            hub.SetContext(ctx.Object);
            return (hub, caller, audit, auth);
        }

        [Fact]
        public async Task AuthenticateOS_HappyPath_SendsSuccessAndAudit()
        {
            var (hub, caller, _, _) = BuildHub();
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var envelope = new AuthEnvelope(new AuthPayload("benton", "PACS_9.0", "nonce-1", now), "sig");
            var req = new OSCoreHub.AuthRequest("benton", "PACS_9.0", envelope);

            await hub.AuthenticateOS(req);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationSuccess",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);

            caller.Verify(p => p.SendCoreAsync(
                "AuditLog",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationFailed",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact]
        public async Task AuthenticateOS_InvalidCounty_SendsFailed()
        {
            var (hub, caller, _, _) = BuildHub();
            var req = new OSCoreHub.AuthRequest("clark", "PACS_9.0", null);

            await hub.AuthenticateOS(req);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationFailed",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact]
        public async Task LoadModule_NotAuthorized_Fails()
        {
            var (hub, caller, _, _) = BuildHub();
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            // Authenticate without permissions
            var envelope = new AuthEnvelope(new AuthPayload("benton", "PACS_9.0", "nonce-na", now, Roles: new string[] { "assessor" }, Permissions: Array.Empty<string>()), "sig");
            await hub.AuthenticateOS(new OSCoreHub.AuthRequest("benton", "PACS_9.0", envelope));

            await hub.LoadModule(new OSCoreHub.ModuleLoadRequest("cama-core", "test"));

            caller.Verify(p => p.SendCoreAsync(
                "ModuleLoadFailed",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);

            caller.Verify(p => p.SendCoreAsync(
                "ModuleLoaded",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact]
        public async Task LoadModule_Authorized_Succeeds()
        {
            var (hub, caller, _, _) = BuildHub();
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            // Authenticate with permission to load parcel-management
            var envelope = new AuthEnvelope(new AuthPayload("benton", "PACS_9.0", "nonce-ok", now, Roles: new string[] { "assessor" }, Permissions: new[] { "load:parcel-management" }), "sig");
            await hub.AuthenticateOS(new OSCoreHub.AuthRequest("benton", "PACS_9.0", envelope));

            await hub.LoadModule(new OSCoreHub.ModuleLoadRequest("parcel-management", "test"));

            caller.Verify(p => p.SendCoreAsync(
                "ModuleLoaded",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);

            caller.Verify(p => p.SendCoreAsync(
                "ModuleLoadFailed",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact]
        public async Task AuthenticateOS_NullCredentials_Fails()
        {
            var (hub, caller, _, _) = BuildHub();
            var req = new OSCoreHub.AuthRequest("benton", "PACS_9.0", null);

            await hub.AuthenticateOS(req);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationFailed",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationSuccess",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact]
        public async Task AuthenticateOS_BadSignature_Fails()
        {
            var (hub, caller, _, auth) = BuildHub();
            string? reason = "Bad signature";
            auth.Reset();
            auth.SetupGet(a => a.AllowedDrift).Returns(TimeSpan.FromMinutes(1));
            auth
                .Setup(a => a.Validate(It.IsAny<AuthEnvelope>(), out reason))
                .Returns(false);

            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var envelope = new AuthEnvelope(new AuthPayload("benton", "PACS_9.0", "nonce-bad", now), "sig_wrong");
            var req = new OSCoreHub.AuthRequest("benton", "PACS_9.0", envelope);

            await hub.AuthenticateOS(req);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationFailed",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationSuccess",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact]
        public async Task AuthenticateOS_StaleTimestamp_Fails()
        {
            var (hub, caller, _, auth) = BuildHub();
            string? reason = "Stale timestamp";
            auth.Reset();
            auth.SetupGet(a => a.AllowedDrift).Returns(TimeSpan.FromMinutes(1));
            auth
                .Setup(a => a.Validate(It.IsAny<AuthEnvelope>(), out reason))
                .Returns(false);

            var stale = DateTimeOffset.UtcNow.AddMinutes(-10).ToUnixTimeMilliseconds();
            var envelope = new AuthEnvelope(new AuthPayload("benton", "PACS_9.0", "nonce-stale", stale), "sig");
            var req = new OSCoreHub.AuthRequest("benton", "PACS_9.0", envelope);

            await hub.AuthenticateOS(req);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationFailed",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationSuccess",
                It.IsAny<object?[]>(),
                It.IsAny<CancellationToken>()
            ), Times.Never);
        }

        [Fact]
        public async Task AuthenticateOS_ValidRequest_EmitsAuditEntry()
        {
            var (hub, _, audit, _) = BuildHub();
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var envelope = new AuthEnvelope(new AuthPayload("benton", "PACS_9.0", "nonce-1", now), "sig");
            var req = new OSCoreHub.AuthRequest("benton", "PACS_9.0", envelope);

            await hub.AuthenticateOS(req);

            audit.Verify(a => a.LogAsync(
                It.Is<string>(t => t == "os.auth"),
                It.IsAny<string>(),
                It.IsAny<bool>()
            ), Times.Once);
        }

        [Fact]
        public async Task Heartbeat_ValidPayload_EmitsAuditEntry()
        {
            var (hub, _, audit, _) = BuildHub();
            var hb = new OSCoreHub.HeartbeatPayload("session-1", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

            await hub.Heartbeat(hb);

            audit.Verify(a => a.LogAsync(
                It.Is<string>(t => t == "os.heartbeat"),
                It.IsAny<string>(),
                It.IsAny<bool>()
            ), Times.Once);
        }

        [Fact]
        public async Task AuthenticateOS_InvalidLegacy_SendsFailed()
        {
            var (hub, caller, _, _) = BuildHub();
            var req = new OSCoreHub.AuthRequest("benton", "TYLER",
                null);

            await hub.AuthenticateOS(req);

            caller.Verify(p => p.SendCoreAsync(
                "AuthenticationFailed",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }

        [Fact]
        public async Task Heartbeat_EmitsAudit()
        {
            var (hub, caller, _, _) = BuildHub();
            var hb = new OSCoreHub.HeartbeatPayload("session-1", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

            await hub.Heartbeat(hb);

            caller.Verify(p => p.SendCoreAsync(
                "AuditLog",
                It.Is<object?[]>(args => args != null && args.Length == 1),
                It.IsAny<CancellationToken>()
            ), Times.Once);
        }
    }
}
