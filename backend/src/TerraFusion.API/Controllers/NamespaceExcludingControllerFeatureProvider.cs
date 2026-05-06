using System;
using System.Reflection;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace TerraFusion.API.Controllers;

public sealed class NamespaceExcludingControllerFeatureProvider : ControllerFeatureProvider
{
    private readonly string _namespacePrefix;
    private readonly HashSet<string> _includedControllerNames;
    private readonly HashSet<string> _excludedControllerNames;

    public NamespaceExcludingControllerFeatureProvider(string namespacePrefix, params string[] includedControllerNames)
        : this(namespacePrefix, includedControllerNames, Array.Empty<string>())
    {
    }

    public NamespaceExcludingControllerFeatureProvider(
        string namespacePrefix,
        IEnumerable<string> includedControllerNames,
        IEnumerable<string> excludedControllerNames)
    {
        _namespacePrefix = namespacePrefix ?? string.Empty;
        _includedControllerNames = new HashSet<string>(includedControllerNames ?? Array.Empty<string>(), StringComparer.Ordinal);
        _excludedControllerNames = new HashSet<string>(excludedControllerNames ?? Array.Empty<string>(), StringComparer.Ordinal);
    }

    protected override bool IsController(TypeInfo typeInfo)
    {
        if (!base.IsController(typeInfo))
        {
            return false;
        }

        var ns = typeInfo.Namespace ?? string.Empty;
        if (_excludedControllerNames.Contains(typeInfo.Name))
        {
            return false;
        }

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
