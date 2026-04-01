using System;
using System.Reflection;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace TerraFusion.API.Controllers;

public sealed class NamespaceExcludingControllerFeatureProvider : ControllerFeatureProvider
{
    private readonly string _namespacePrefix;
    private readonly HashSet<string> _includedControllerNames;

    public NamespaceExcludingControllerFeatureProvider(string namespacePrefix, params string[] includedControllerNames)
    {
        _namespacePrefix = namespacePrefix ?? string.Empty;
        _includedControllerNames = new HashSet<string>(includedControllerNames ?? Array.Empty<string>(), StringComparer.Ordinal);
    }

    protected override bool IsController(TypeInfo typeInfo)
    {
        if (!base.IsController(typeInfo))
        {
            return false;
        }

        var ns = typeInfo.Namespace ?? string.Empty;
        if (_includedControllerNames.Contains(typeInfo.Name))
        {
            return true;
        }

        if (ns.StartsWith(_namespacePrefix, StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }
}
