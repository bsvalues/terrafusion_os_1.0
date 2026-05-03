using System;
using System.Threading;
using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Sync.Workbench.Schema;

/// <summary>
/// Slice C48-B: DI registration helpers for the
/// <c>pacs_schema_catalog</c>. The catalog is registered as a
/// singleton built once at first resolution from the configured
/// <see cref="IPacsSchemaSource"/>.
///
/// <para>This slice does NOT auto-register the catalog in the
/// production <c>TerraFusion.API</c> startup graph. C48-C will wire
/// the production source. Call sites that want the catalog today
/// (tests, future bring-up code) opt in explicitly via
/// <see cref="AddPacsSchemaCatalog"/>.</para>
/// </summary>
public static class PacsSchemaCatalogServiceCollectionExtensions
{
    /// <summary>
    /// Registers the supplied <see cref="IPacsSchemaSource"/> and
    /// builds the catalog as a singleton on first resolution.
    /// Subsequent resolutions return the same instance (HG3 read-only
    /// at runtime).
    /// </summary>
    /// <param name="services">DI container.</param>
    /// <param name="source">
    /// The schema source. Caller is responsible for choosing an
    /// appropriate implementation (an
    /// <see cref="InMemoryPacsSchemaSource"/> for tests, a future
    /// PACS-file source in C48-C).
    /// </param>
    public static IServiceCollection AddPacsSchemaCatalog(
        this IServiceCollection services,
        IPacsSchemaSource source)
    {
        if (services is null)
        {
            throw new ArgumentNullException(nameof(services));
        }

        if (source is null)
        {
            throw new ArgumentNullException(nameof(source));
        }

        services.AddSingleton(source);
        services.AddSingleton<IPacsSchemaCatalog>(sp =>
        {
            // Build synchronously from the registered source. The
            // synchronous .Result is acceptable here because (a) the
            // build runs once at startup, (b) the source contract
            // does not require I/O latency for in-memory or
            // file-shaped PACS schema artifacts, and (c) DI singleton
            // factories are required to be synchronous.
            var catalog = PacsSchemaCatalog
                .BuildAsync(sp.GetRequiredService<IPacsSchemaSource>(), CancellationToken.None)
                .GetAwaiter()
                .GetResult();
            return catalog;
        });

        return services;
    }

    /// <summary>
    /// Slice C48-C: registers a <see cref="LivePacsSchemaSource"/>
    /// backed by a <see cref="SqlInformationSchemaIntrospector"/>
    /// reading from the supplied SQL Server connection string. The
    /// catalog is registered as a singleton built once at first
    /// resolution from the live introspection result (HG3 read-only
    /// at runtime).
    ///
    /// <para>This helper opts in the production wiring against a
    /// real Harris PACS database. Callers MUST ensure the connection
    /// string targets the **legacy source database** (Harris PACS
    /// 9.0 in Benton's environment) — never TerraFusion DB. Mixing
    /// these would invert the conversion arrow per the C48-A
    /// "Source / target model" binding rule.</para>
    ///
    /// <para>Validation status: the SQL queries inside
    /// <see cref="SqlInformationSchemaIntrospector"/> are not
    /// exercised against a live PACS DB in C48-C. Live-DB validation
    /// is deferred to C48-D (first consumer migration), which will
    /// run an integration test gated on a configured connection
    /// string.</para>
    /// </summary>
    /// <param name="services">DI container.</param>
    /// <param name="connectionString">
    /// SQL Server connection string for the legacy source PACS DB.
    /// </param>
    /// <param name="options">
    /// Operator-tunable labels surfaced in provenance + version
    /// stamping. Use <see cref="LivePacsSchemaSourceOptions.ForBentonHarrisPacs"/>
    /// for the standard <c>dbo</c> schema default.
    /// </param>
    public static IServiceCollection AddLivePacsSchemaCatalog(
        this IServiceCollection services,
        string connectionString,
        LivePacsSchemaSourceOptions options)
    {
        if (services is null)
        {
            throw new ArgumentNullException(nameof(services));
        }

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new ArgumentException("Connection string must be non-empty.", nameof(connectionString));
        }

        if (options is null)
        {
            throw new ArgumentNullException(nameof(options));
        }

        var introspector = new SqlInformationSchemaIntrospector(connectionString, options.SchemaName);
        var source = new LivePacsSchemaSource(introspector, options);
        return services.AddPacsSchemaCatalog(source);
    }
}
