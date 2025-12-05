using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Core.Services.Caching;
using System.Text;
using System.Security.Cryptography;

namespace TerraFusion.Core.Attributes;

/// <summary>
/// Cache response attribute for automatic API response caching
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class CacheResponseAttribute : ActionFilterAttribute
{
    private readonly int _duration;
    private readonly bool _varyByUser;
    private readonly bool _varyByParams;

    public CacheResponseAttribute(int duration = 300, bool varyByUser = false, bool varyByParams = true)
    {
        _duration = duration;
        _varyByUser = varyByUser;
        _varyByParams = varyByParams;
    }

    public override async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var cacheService = context.HttpContext.RequestServices.GetRequiredService<ICacheService>();
        var cacheKey = GenerateCacheKey(context);

        // Try to get cached response
        var cachedResponse = await cacheService.GetAsync<CachedApiResponse>(cacheKey);
        if (cachedResponse != null)
        {
            context.Result = new ContentResult
            {
                Content = cachedResponse.Content,
                ContentType = cachedResponse.ContentType,
                StatusCode = cachedResponse.StatusCode
            };
            return;
        }

        // Execute action
        var executedContext = await next();

        // Cache successful responses
        if (executedContext.Result is ObjectResult objectResult && objectResult.StatusCode < 400)
        {
            var response = new CachedApiResponse
            {
                Content = System.Text.Json.JsonSerializer.Serialize(objectResult.Value),
                ContentType = "application/json",
                StatusCode = objectResult.StatusCode ?? 200
            };

            await cacheService.SetAsync(cacheKey, response, TimeSpan.FromSeconds(_duration));
        }
    }

    private string GenerateCacheKey(ActionExecutingContext context)
    {
        var keyBuilder = new StringBuilder();
        
        // Base path
        keyBuilder.Append($"api:{context.ActionDescriptor.DisplayName}");

        // Add user ID if varying by user
        if (_varyByUser && context.HttpContext.User.Identity?.IsAuthenticated == true)
        {
            var userId = context.HttpContext.User.FindFirst("sub")?.Value ?? 
                        context.HttpContext.User.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                keyBuilder.Append($":user:{userId}");
            }
        }

        // Add parameters if varying by params
        if (_varyByParams && context.ActionArguments.Any())
        {
            var paramString = string.Join("&", context.ActionArguments
                .OrderBy(x => x.Key)
                .Select(x => $"{x.Key}={x.Value}"));
            
            // Hash long parameter strings
            if (paramString.Length > 100)
            {
                using var sha256 = SHA256.Create();
                var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(paramString));
                paramString = Convert.ToBase64String(hash);
            }
            
            keyBuilder.Append($":params:{paramString}");
        }

        return keyBuilder.ToString();
    }
}

/// <summary>
/// Cached API response model
/// </summary>
public class CachedApiResponse
{
    public string Content { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/json";
    public int StatusCode { get; set; } = 200;
}
