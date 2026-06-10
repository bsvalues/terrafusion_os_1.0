using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.Sync.PacsImprvAttr;
using TerraFusion.Data.Services.PacsSources;

namespace TerraFusion.Data.Services.PacsImprvAttr;

/// <summary>
/// SYNC-DOCTRINE-4-IMPL-V8: at backend startup, populate the
/// landing-layer <see cref="RefreshableImprvAttrDictionary"/> from
/// live PACS so subsequent imprv drains land cleanly without
/// requiring a manual <c>POST /api/debug/attr-drain-1/run-drain</c>
/// call.
///
/// <para>The loader (<see cref="SqlServerImprvAttrValDictionaryLoader"/>)
/// first tries <c>dbo.imprv_attr_val</c> (the proper dictionary
/// table); falls back to <c>SELECT DISTINCT i_attr_val_cd FROM
/// dbo.imprv_attr</c> when the dictionary table is empty (Benton's
/// case). Live data IS the dictionary per the Block-C contract:
/// any value that exists in PACS imprv_attr is, by definition, a
/// real PACS code that should be recognized.</para>
///
/// <para>Failure is non-fatal: if PACS is unreachable or the query
/// fails, the host logs a warning and proceeds with an empty
/// dictionary. The landing service will then quarantine all rows
/// with <c>UNKNOWN_I_ATTR_VAL_CD</c> until the operator manually
/// runs the existing attr-drain-1 endpoint.</para>
/// </summary>
public sealed class ImprvAttrDictionaryRefreshHostedService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IConfiguration _configuration;
    private readonly RefreshableImprvAttrDictionary _dictionary;
    private readonly ILogger<ImprvAttrDictionaryRefreshHostedService> _logger;

    public ImprvAttrDictionaryRefreshHostedService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        RefreshableImprvAttrDictionary dictionary,
        ILogger<ImprvAttrDictionaryRefreshHostedService> logger)
    {
        _scopeFactory = scopeFactory;
        _configuration = configuration;
        _dictionary = dictionary;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            var pacsCs = _configuration.GetConnectionString("PacsConnection");
            if (string.IsNullOrWhiteSpace(pacsCs))
            {
                _logger.LogInformation(
                    "ImprvAttrDictionaryRefreshHostedService: ConnectionStrings:PacsConnection " +
                    "not configured; skipping dictionary refresh. Landing service will quarantine " +
                    "all imprv_attr rows until operator runs attr-drain-1 manually.");
                return;
            }

            var loader = new SqlServerImprvAttrValDictionaryLoader(pacsCs);
            var codes = await loader.LoadDistinctCodesAsync(cancellationToken).ConfigureAwait(false);

            var before = _dictionary.Count;
            _dictionary.Refresh(codes);
            _logger.LogInformation(
                "ImprvAttrDictionaryRefreshHostedService: refreshed landing dictionary; " +
                "{Before} → {After} codes loaded from PACS.",
                before, _dictionary.Count);
        }
        catch (Exception ex)
        {
            // Non-fatal: PACS may be unreachable at startup (e.g.
            // dev environment without VPN). Operator can run
            // attr-drain-1 manually once PACS is reachable.
            _logger.LogWarning(ex,
                "ImprvAttrDictionaryRefreshHostedService: refresh failed; landing service " +
                "will quarantine imprv_attr rows until operator runs attr-drain-1 manually.");
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
