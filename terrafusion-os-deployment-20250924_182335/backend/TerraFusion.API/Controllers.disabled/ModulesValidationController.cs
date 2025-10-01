using Microsoft.AspNetCore.Mvc;
using NJsonSchema;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/modules")]
public class ModulesValidationController : ControllerBase
{
    private readonly ILogger<ModulesValidationController> _log;
    private readonly IWebHostEnvironment _env;

    public ModulesValidationController(ILogger<ModulesValidationController> log, IWebHostEnvironment env)
    { _log = log; _env = env; }

    [HttpGet("validate")]
    public async Task<IActionResult> ValidateAll()
    {
        var root = _env.ContentRootPath;
        var schemaPath = Path.Combine(root, "backend/schemas/module.manifest.schema.json");
        var modulesRoot = Path.Combine(root, "modules");

        if (!System.IO.File.Exists(schemaPath))
            return Ok(new { valid = false, error = "schema not found", schemaPath });

        var schema = await JsonSchema.FromFileAsync(schemaPath);
        if (!Directory.Exists(modulesRoot))
            return Ok(new { valid = true, checkedManifests = 0, errors = Array.Empty<object>() });

        var manifests = Directory.GetFiles(modulesRoot, "module.manifest.json", SearchOption.AllDirectories).ToList();
        var errors = new List<object>();

        foreach (var path in manifests)
        {
            var json = await System.IO.File.ReadAllTextAsync(path);
            var result = schema.Validate(json);
            if (result.Count > 0)
            {
                errors.Add(new {
                    manifest = Path.GetRelativePath(modulesRoot, path),
                    issues = result.Select(e => new { e.Path, e.Kind, e.Property, e.LineNumber, e.LinePosition })
                });
            }
        }

        return Ok(new { valid = errors.Count == 0, checkedManifests = manifests.Count, errors });
    }
}