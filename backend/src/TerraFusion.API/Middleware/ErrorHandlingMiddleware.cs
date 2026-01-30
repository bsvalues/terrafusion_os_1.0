using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ProblemDetails();

        switch (exception)
        {
            case ArgumentNullException:
                response.Status = (int)HttpStatusCode.BadRequest;
                response.Title = "Bad Request";
                response.Detail = "A required parameter was null or empty";
                break;

            case ArgumentException:
                response.Status = (int)HttpStatusCode.BadRequest;
                response.Title = "Bad Request";
                response.Detail = exception.Message;
                break;

            case UnauthorizedAccessException:
                response.Status = (int)HttpStatusCode.Unauthorized;
                response.Title = "Unauthorized";
                response.Detail = "Access denied";
                break;

            case KeyNotFoundException:
                response.Status = (int)HttpStatusCode.NotFound;
                response.Title = "Not Found";
                response.Detail = "The requested resource was not found";
                break;

            case InvalidOperationException:
                response.Status = (int)HttpStatusCode.BadRequest;
                response.Title = "Invalid Operation";
                response.Detail = exception.Message;
                break;

            case TimeoutException:
                response.Status = (int)HttpStatusCode.RequestTimeout;
                response.Title = "Request Timeout";
                response.Detail = "The request timed out";
                break;

            default:
                response.Status = (int)HttpStatusCode.InternalServerError;
                response.Title = "Internal Server Error";
                response.Detail = "An error occurred while processing your request";
                break;
        }

        context.Response.StatusCode = response.Status.Value;

        var jsonResponse = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}
