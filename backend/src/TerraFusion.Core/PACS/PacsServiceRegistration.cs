// =============================================================================
// PACS Service Registration - pacscontract.v1 Compliant DI
// =============================================================================
// Registers the PACS adapter as the SINGLE boundary for all PACS access.
// =============================================================================

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace TerraFusion.Core.PACS
{
    /// <summary>
    /// Extension methods for registering PACS services.
    /// </summary>
    public static class PacsServiceRegistration
    {
        /// <summary>
        /// Adds the PACS adapter as the single authorized boundary for PACS access.
        /// Governed by pacscontract.v1 SpecLock.
        /// </summary>
        /// <remarks>
        /// <para>This registers:</para>
        /// <list type="bullet">
        ///   <item><see cref="IPacsAdapter"/> - The contract interface</item>
        ///   <item><see cref="PacsSqlAdapter"/> - The SQL implementation</item>
        /// </list>
        /// <para>The adapter is registered as Singleton to maintain connection pooling efficiency.</para>
        /// </remarks>
        public static IServiceCollection AddPacsAdapter(this IServiceCollection services)
        {
            // Register as Singleton - connection pooling is handled by SqlConnection
            services.TryAddSingleton<IPacsAdapter, PacsSqlAdapter>();

            return services;
        }

        /// <summary>
        /// Adds the PACS adapter with a custom implementation.
        /// Use this for testing with mock implementations.
        /// </summary>
        public static IServiceCollection AddPacsAdapter<TImplementation>(this IServiceCollection services)
            where TImplementation : class, IPacsAdapter
        {
            services.TryAddSingleton<IPacsAdapter, TImplementation>();
            return services;
        }
    }
}
