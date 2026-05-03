using Microsoft.Extensions.DependencyInjection;

namespace TerraFusion.Core.GIS.ArcGisRest;

/// <summary>
/// Slice G1-C: DI registration for the ArcGIS REST adapter. Wires up
/// the named <see cref="System.Net.Http.HttpClient"/> and the
/// <see cref="IArcGisFeatureServiceClient"/> interface binding.
///
/// <para>Options binding is performed separately at composition root
/// (<c>Program.cs</c>) — this extension assumes
/// <see cref="TerraFusion.Core.Configuration.ArcGisFeatureServiceOptions"/>
/// has already been registered via
/// <see cref="Microsoft.Extensions.DependencyInjection.OptionsConfigurationServiceCollectionExtensions.Configure{TOptions}(IServiceCollection, Microsoft.Extensions.Configuration.IConfiguration)"/>.</para>
/// </summary>
public static class ArcGisFeatureServiceServiceCollectionExtensions
{
    public static IServiceCollection AddArcGisFeatureServiceClient(
        this IServiceCollection services)
    {
        services.AddHttpClient(ArcGisFeatureServiceClient.HttpClientName);
        services.AddScoped<IArcGisFeatureServiceClient, ArcGisFeatureServiceClient>();
        return services;
    }
}
