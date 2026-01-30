using System;
using System.Reflection;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace TerraFusion.API.Controllers;

public sealed class NamespaceExcludingControllerFeatureProvider : ControllerFeatureProvider
{
    private readonly string _namespacePrefix;

    public NamespaceExcludingControllerFeatureProvider(string namespacePrefix)
    {
        _namespacePrefix = namespacePrefix ?? string.Empty;
    }

    protected override bool IsController(TypeInfo typeInfo)
    {
        if (!base.IsController(typeInfo))
        {
            return false;
        }

        var ns = typeInfo.Namespace ?? string.Empty;
        if (ns.StartsWith(_namespacePrefix, StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }
}
