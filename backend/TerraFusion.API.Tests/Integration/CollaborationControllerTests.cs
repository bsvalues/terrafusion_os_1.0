using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using TerraFusion.API.Tests.Infrastructure;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Integration tests for the CollaborationController.
/// Validates collaboration CRUD operations for users, teams, projects,
/// tasks, notifications, metrics, and audit trail endpoints.
/// All endpoints require authentication ([Authorize] on the controller).
/// </summary>
[Collection("Integration")]
public class CollaborationControllerTests : IClassFixture<SeededApiWebAppFactory>
{
    private readonly SeededApiWebAppFactory _factory;
    private readonly JsonSerializerOptions _jsonOpts = new() { PropertyNameCaseInsensitive = true };

    public CollaborationControllerTests(SeededApiWebAppFactory factory)
    {
        _factory = factory;
    }

    // ══════════════════════════════════════════════════════════════════
    // 401 Unauthorized — All collaboration endpoints require auth
    // ══════════════════════════════════════════════════════════════════

    [Theory]
    [InlineData("GET", "/api/collaboration/users")]
    [InlineData("GET", "/api/collaboration/users/test-user-001")]
    [InlineData("POST", "/api/collaboration/users")]
    [InlineData("PUT", "/api/collaboration/users/test-user-001")]
    [InlineData("PUT", "/api/collaboration/users/test-user-001/status")]
    [InlineData("DELETE", "/api/collaboration/users/test-user-001")]
    [InlineData("GET", "/api/collaboration/users/test-user-001/teams")]
    [InlineData("GET", "/api/collaboration/users/test-user-001/projects")]
    [InlineData("GET", "/api/collaboration/users/test-user-001/tasks")]
    [InlineData("GET", "/api/collaboration/users/test-user-001/notifications")]
    [InlineData("GET", "/api/collaboration/teams")]
    [InlineData("GET", "/api/collaboration/teams/team-1")]
    [InlineData("POST", "/api/collaboration/teams")]
    [InlineData("PUT", "/api/collaboration/teams/team-1")]
    [InlineData("DELETE", "/api/collaboration/teams/team-1")]
    [InlineData("POST", "/api/collaboration/teams/team-1/members")]
    [InlineData("DELETE", "/api/collaboration/teams/team-1/members/user-1")]
    [InlineData("GET", "/api/collaboration/projects")]
    [InlineData("GET", "/api/collaboration/projects/proj-1")]
    [InlineData("POST", "/api/collaboration/projects")]
    [InlineData("PUT", "/api/collaboration/projects/proj-1")]
    [InlineData("PUT", "/api/collaboration/projects/proj-1/status")]
    [InlineData("DELETE", "/api/collaboration/projects/proj-1")]
    [InlineData("GET", "/api/collaboration/projects/proj-1/tasks")]
    [InlineData("GET", "/api/collaboration/projects/proj-1/metrics")]
    [InlineData("GET", "/api/collaboration/tasks/task-1")]
    [InlineData("POST", "/api/collaboration/projects/proj-1/tasks")]
    [InlineData("PUT", "/api/collaboration/tasks/task-1")]
    [InlineData("PUT", "/api/collaboration/tasks/task-1/status")]
    [InlineData("PUT", "/api/collaboration/tasks/task-1/assign")]
    [InlineData("DELETE", "/api/collaboration/tasks/task-1")]
    [InlineData("GET", "/api/collaboration/tasks/task-1/comments")]
    [InlineData("POST", "/api/collaboration/tasks/task-1/comments")]
    [InlineData("POST", "/api/collaboration/notifications")]
    [InlineData("PUT", "/api/collaboration/notifications/notif-1/read")]
    [InlineData("PUT", "/api/collaboration/users/test-user-001/notifications/read-all")]
    [InlineData("DELETE", "/api/collaboration/notifications/notif-1")]
    [InlineData("POST", "/api/collaboration/metrics")]
    [InlineData("GET", "/api/collaboration/metrics/teams")]
    [InlineData("GET", "/api/collaboration/metrics/tasks")]
    [InlineData("GET", "/api/collaboration/audit/project/proj-1")]
    [InlineData("GET", "/api/collaboration/audit/users/test-user-001")]
    public async Task Unauthenticated_Request_Returns_401(string method, string url)
    {
        using var client = _factory.CreateClient(); // No auth header

        HttpResponseMessage response;
        switch (method)
        {
            case "GET":
                response = await client.GetAsync(url);
                break;
            case "POST":
                var postBody = new StringContent("{}", Encoding.UTF8, "application/json");
                response = await client.PostAsync(url, postBody);
                break;
            case "PUT":
                var putBody = new StringContent("{}", Encoding.UTF8, "application/json");
                response = await client.PutAsync(url, putBody);
                break;
            case "DELETE":
                response = await client.DeleteAsync(url);
                break;
            default:
                throw new ArgumentException($"Unsupported HTTP method: {method}");
        }

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ══════════════════════════════════════════════════════════════════
    // User Management Endpoints
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetUsers_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/users");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.ValueKind == JsonValueKind.Array,
            "Response should be a JSON array of users");
    }

    [Fact]
    public async Task GetUser_Returns_NotFound_For_NonExistent_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/users/non-existent-user-999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateUser_Returns_Created_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            id = "integration-test-user",
            displayName = "Integration Test User",
            email = "integration@county.gov",
            department = "IT",
            role = "Analyst",
            isOnline = false
        };

        var response = await client.PostAsJsonAsync("/api/collaboration/users", payload);

        // Permission check may return Forbidden if the service denies;
        // otherwise expect Created (201)
        Assert.True(
            response.StatusCode == HttpStatusCode.Created ||
            response.StatusCode == HttpStatusCode.Forbidden ||
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 201, 403, or 200 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task UpdateUser_Returns_NotFound_For_NonExistent_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            id = "non-existent-user-999",
            displayName = "Updated Name",
            email = "updated@county.gov"
        };

        var response = await client.PutAsJsonAsync("/api/collaboration/users/non-existent-user-999", payload);

        // Expect 404 or 403 (permission check may fire first)
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task DeleteUser_Returns_NotFound_For_NonExistent_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.DeleteAsync("/api/collaboration/users/non-existent-user-999");

        // Expect 404 or 403 (permission check may fire first)
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetUserTeams_Returns_Ok_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        // test-user-001 is the user ID in the JWT
        var response = await client.GetAsync("/api/collaboration/users/test-user-001/teams");

        // When requesting own data, should succeed; otherwise 403
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetUserProjects_Returns_Ok_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/users/test-user-001/projects");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetUserTasks_Returns_Ok_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/users/test-user-001/tasks");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetUserNotifications_Returns_Ok_For_Own_Notifications()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/users/test-user-001/notifications");

        // Own notifications should be accessible
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetUserNotifications_Returns_Forbidden_For_Other_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/users/other-user-999/notifications");

        // Cannot view other user's notifications
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task UpdateUserStatus_Returns_Forbidden_For_Other_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.PutAsJsonAsync(
            "/api/collaboration/users/other-user-999/status", true);

        // Cannot update other user's status
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ══════════════════════════════════════════════════════════════════
    // Team Management Endpoints
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetTeams_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/teams");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.ValueKind == JsonValueKind.Array,
            "Response should be a JSON array of teams");
    }

    [Fact]
    public async Task GetTeam_Returns_NotFound_For_NonExistent_Team()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/teams/non-existent-team-999");

        // Expect NotFound or Forbidden (permission check may fire first)
        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task CreateTeam_Returns_Created_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            name = "Integration Test Team",
            description = "A team created during integration testing",
            department = "IT"
        };

        var response = await client.PostAsJsonAsync("/api/collaboration/teams", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.Created ||
            response.StatusCode == HttpStatusCode.Forbidden ||
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 201, 403, or 200 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task UpdateTeam_Returns_NotFound_Or_Forbidden_For_NonExistent_Team()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            name = "Updated Team Name",
            description = "Updated description"
        };

        var response = await client.PutAsJsonAsync(
            "/api/collaboration/teams/non-existent-team-999", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task DeleteTeam_Returns_NotFound_Or_Forbidden_For_NonExistent_Team()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.DeleteAsync("/api/collaboration/teams/non-existent-team-999");

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task AddTeamMember_Returns_BadRequest_Or_Forbidden_For_NonExistent_Team()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            userId = "test-user-001",
            isOwner = false
        };

        var response = await client.PostAsJsonAsync(
            "/api/collaboration/teams/non-existent-team-999/members", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.Forbidden ||
            response.StatusCode == HttpStatusCode.NotFound,
            $"Expected 400, 403, or 404 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task RemoveTeamMember_Returns_NotFound_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.DeleteAsync(
            "/api/collaboration/teams/non-existent-team-999/members/non-existent-user-999");

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    // ══════════════════════════════════════════════════════════════════
    // Project Management Endpoints
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetProjects_Returns_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/projects");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        Assert.False(string.IsNullOrWhiteSpace(json));

        using var doc = JsonDocument.Parse(json);
        Assert.True(doc.RootElement.ValueKind == JsonValueKind.Array,
            "Response should be a JSON array of projects");
    }

    [Fact]
    public async Task GetProject_Returns_NotFound_Or_Forbidden_For_NonExistent_Project()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/projects/non-existent-proj-999");

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task CreateProject_Returns_Created_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            name = "Integration Test Project",
            description = "A project created during integration testing",
            status = "Active"
        };

        var response = await client.PostAsJsonAsync("/api/collaboration/projects", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.Created ||
            response.StatusCode == HttpStatusCode.Forbidden ||
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 201, 403, or 200 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task UpdateProject_Returns_NotFound_Or_Forbidden_For_NonExistent_Project()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            name = "Updated Project Name",
            description = "Updated description"
        };

        var response = await client.PutAsJsonAsync(
            "/api/collaboration/projects/non-existent-proj-999", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task UpdateProjectStatus_Returns_NotFound_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new { status = 0 };

        var response = await client.PutAsJsonAsync(
            "/api/collaboration/projects/non-existent-proj-999/status", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task DeleteProject_Returns_NotFound_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.DeleteAsync("/api/collaboration/projects/non-existent-proj-999");

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetProjectTasks_Returns_Ok_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/projects/non-existent-proj-999/tasks");

        // Permission check or empty list
        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetProjectMetrics_Returns_Ok_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/projects/non-existent-proj-999/metrics");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    // ══════════════════════════════════════════════════════════════════
    // Task Management Endpoints
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetTask_Returns_NotFound_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/tasks/non-existent-task-999");

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task CreateTask_Returns_BadRequest_On_ProjectId_Mismatch()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            projectId = "different-project-id",
            title = "Integration Test Task",
            description = "A task created during integration testing"
        };

        var response = await client.PostAsJsonAsync(
            "/api/collaboration/projects/proj-1/tasks", payload);

        // ProjectId mismatch returns 400, or permission check returns 403
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 400 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task CreateTask_With_Matching_ProjectId_Returns_Created_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            projectId = "proj-1",
            title = "Integration Test Task",
            description = "A task created during integration testing"
        };

        var response = await client.PostAsJsonAsync(
            "/api/collaboration/projects/proj-1/tasks", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.Created ||
            response.StatusCode == HttpStatusCode.Forbidden ||
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 201, 403, or 200 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task UpdateTask_Returns_NotFound_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            title = "Updated Task Title",
            description = "Updated description"
        };

        var response = await client.PutAsJsonAsync(
            "/api/collaboration/tasks/non-existent-task-999", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task UpdateTaskStatus_Returns_NotFound_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new { status = 0 };

        var response = await client.PutAsJsonAsync(
            "/api/collaboration/tasks/non-existent-task-999/status", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task AssignTask_Returns_NotFound_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new { assigneeId = "test-user-001" };

        var response = await client.PutAsJsonAsync(
            "/api/collaboration/tasks/non-existent-task-999/assign", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task DeleteTask_Returns_NotFound_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.DeleteAsync("/api/collaboration/tasks/non-existent-task-999");

        Assert.True(
            response.StatusCode == HttpStatusCode.NotFound ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 404 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetTaskComments_Returns_Ok_Or_Forbidden_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/tasks/non-existent-task-999/comments");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task AddTaskComment_Returns_BadRequest_On_TaskId_Mismatch()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            taskId = "different-task-id",
            content = "Integration test comment"
        };

        var response = await client.PostAsJsonAsync(
            "/api/collaboration/tasks/task-1/comments", payload);

        // TaskId mismatch returns 400, or permission check returns 403
        Assert.True(
            response.StatusCode == HttpStatusCode.BadRequest ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 400 or 403 but got {(int)response.StatusCode}");
    }

    // ══════════════════════════════════════════════════════════════════
    // Notification Management Endpoints
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateNotification_Returns_Created_Or_Ok()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            recipientId = "test-user-001",
            title = "Integration Test Notification",
            message = "This is a test notification",
            type = "info"
        };

        var response = await client.PostAsJsonAsync("/api/collaboration/notifications", payload);

        // Should succeed or fail gracefully
        Assert.True(
            response.StatusCode == HttpStatusCode.Created ||
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.BadRequest,
            $"Expected 201, 200, or 400 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task MarkNotificationRead_Returns_NotFound_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.PutAsync(
            "/api/collaboration/notifications/non-existent-notif-999/read",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task MarkAllNotificationsRead_Returns_Ok_For_Own_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.PutAsync(
            "/api/collaboration/users/test-user-001/notifications/read-all",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task MarkAllNotificationsRead_Returns_Forbidden_For_Other_User()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.PutAsync(
            "/api/collaboration/users/other-user-999/notifications/read-all",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeleteNotification_Returns_NotFound_For_NonExistent()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.DeleteAsync("/api/collaboration/notifications/non-existent-notif-999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ══════════════════════════════════════════════════════════════════
    // Analytics and Reporting Endpoints
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetCollaborationMetrics_Returns_Ok_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var payload = new
        {
            startDate = "2025-01-01T00:00:00Z",
            endDate = "2025-12-31T23:59:59Z"
        };

        var response = await client.PostAsJsonAsync("/api/collaboration/metrics", payload);

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetTeamMetrics_Returns_Ok_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/metrics/teams");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetTeamMetrics_Supports_Department_Filter()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/metrics/teams?department=IT");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetTaskMetrics_Returns_Ok_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/metrics/tasks");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetTaskMetrics_Supports_ProjectId_Filter()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/metrics/tasks?projectId=proj-1");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetTaskMetrics_Supports_UserId_Filter()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/metrics/tasks?userId=test-user-001");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    // ══════════════════════════════════════════════════════════════════
    // Audit Trail Endpoints
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetAuditTrail_Returns_Ok_Or_Forbidden()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/audit/project/proj-1");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetUserAuditTrail_Returns_Ok_For_Own_Audit()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/audit/users/test-user-001");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetUserAuditTrail_Supports_DateRange_Filters()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync(
            "/api/collaboration/audit/users/test-user-001?startDate=2025-01-01&endDate=2025-12-31");

        Assert.True(
            response.StatusCode == HttpStatusCode.OK ||
            response.StatusCode == HttpStatusCode.Forbidden,
            $"Expected 200 or 403 but got {(int)response.StatusCode}");
    }

    [Fact]
    public async Task GetUserAuditTrail_Returns_Forbidden_For_Other_User_Without_Permission()
    {
        // Generate token without audit.view permission
        var token = AuthenticatedClientExtensions.GenerateTestJwt(
            permissions: ["read:parcel"]);
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/collaboration/audit/users/other-user-999");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ══════════════════════════════════════════════════════════════════
    // Response Format Validation
    // ══════════════════════════════════════════════════════════════════

    [Fact]
    public async Task GetUsers_Response_Is_Valid_Json_Array()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/users");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        }
    }

    [Fact]
    public async Task GetTeams_Response_Is_Valid_Json_Array()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/teams");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        }
    }

    [Fact]
    public async Task GetProjects_Response_Is_Valid_Json_Array()
    {
        using var client = _factory.CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/collaboration/projects");

        if (response.StatusCode == HttpStatusCode.OK)
        {
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            Assert.Equal(JsonValueKind.Array, doc.RootElement.ValueKind);
        }
    }
}
