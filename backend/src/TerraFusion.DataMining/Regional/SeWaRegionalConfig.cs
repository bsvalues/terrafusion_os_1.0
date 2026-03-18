// TMR-044: SE Washington county metadata for Benton, Franklin, Walla Walla, Columbia, Garfield
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace TerraFusion.DataMining.Regional
{
    /// <summary>
    /// Metadata for a single county in the SE Washington region.
    /// </summary>
    public class CountyMetadata
    {
        /// <summary>Short county identifier (e.g., "benton").</summary>
        public string CountyId { get; init; } = string.Empty;

        /// <summary>Official county name.</summary>
        public string Name { get; init; } = string.Empty;

        /// <summary>FIPS county code (5-digit, state + county).</summary>
        public string FipsCode { get; init; } = string.Empty;

        /// <summary>Two-letter state code.</summary>
        public string StateCode { get; init; } = "WA";

        /// <summary>County seat city.</summary>
        public string CountySeat { get; init; } = string.Empty;

        /// <summary>Approximate population.</summary>
        public int ApproximatePopulation { get; init; }

        /// <summary>Approximate number of parcels.</summary>
        public int ApproximateParcelCount { get; init; }

        /// <summary>Whether a GIS connector is available for this county.</summary>
        public bool HasGisConnector { get; init; }

        /// <summary>Whether a PACS connector is available for this county.</summary>
        public bool HasPacsConnector { get; init; }

        /// <summary>Whether a scraper is implemented for this county.</summary>
        public bool HasScraper { get; init; }

        /// <summary>Assessment system vendor (e.g., "Harris PACS", "Tyler iasWorld").</summary>
        public string AssessmentSystemVendor { get; init; } = string.Empty;

        /// <summary>GIS platform (e.g., "ArcGIS Server", "ArcGIS Online").</summary>
        public string GisPlatform { get; init; } = string.Empty;

        /// <summary>Configuration key prefix for IConfiguration lookups.</summary>
        public string ConfigKeyPrefix { get; init; } = string.Empty;
    }

    /// <summary>
    /// Static registry of SE Washington county metadata.
    /// Provides county details for Benton, Franklin, Walla Walla,
    /// Columbia, and Garfield counties.
    /// </summary>
    public static class SeWaRegionalConfig
    {
        /// <summary>
        /// All SE Washington counties in the TerraFusion coverage area.
        /// </summary>
        public static readonly ReadOnlyDictionary<string, CountyMetadata> Counties =
            new(new Dictionary<string, CountyMetadata>(StringComparer.OrdinalIgnoreCase)
            {
                ["benton"] = new CountyMetadata
                {
                    CountyId = "benton",
                    Name = "Benton County",
                    FipsCode = "53005",
                    CountySeat = "Prosser",
                    ApproximatePopulation = 210_000,
                    ApproximateParcelCount = 89_247,
                    HasGisConnector = true,
                    HasPacsConnector = true,
                    HasScraper = true,
                    AssessmentSystemVendor = "Harris PACS 9.0",
                    GisPlatform = "ArcGIS Server",
                    ConfigKeyPrefix = "DataMining:Counties:Benton",
                },
                ["franklin"] = new CountyMetadata
                {
                    CountyId = "franklin",
                    Name = "Franklin County",
                    FipsCode = "53021",
                    CountySeat = "Pasco",
                    ApproximatePopulation = 98_000,
                    ApproximateParcelCount = 38_000,
                    HasGisConnector = false,
                    HasPacsConnector = false,
                    HasScraper = true,
                    AssessmentSystemVendor = "Tyler iasWorld",
                    GisPlatform = "ArcGIS Online",
                    ConfigKeyPrefix = "DataMining:Counties:Franklin",
                },
                ["wallawalla"] = new CountyMetadata
                {
                    CountyId = "wallawalla",
                    Name = "Walla Walla County",
                    FipsCode = "53071",
                    CountySeat = "Walla Walla",
                    ApproximatePopulation = 62_000,
                    ApproximateParcelCount = 28_000,
                    HasGisConnector = false,
                    HasPacsConnector = false,
                    HasScraper = true,
                    AssessmentSystemVendor = "Tyler iasWorld",
                    GisPlatform = "ArcGIS Online",
                    ConfigKeyPrefix = "DataMining:Counties:WallaWalla",
                },
                ["columbia"] = new CountyMetadata
                {
                    CountyId = "columbia",
                    Name = "Columbia County",
                    FipsCode = "53013",
                    CountySeat = "Dayton",
                    ApproximatePopulation = 4_100,
                    ApproximateParcelCount = 5_500,
                    HasGisConnector = false,
                    HasPacsConnector = false,
                    HasScraper = false,
                    AssessmentSystemVendor = "Unknown",
                    GisPlatform = "None",
                    ConfigKeyPrefix = "DataMining:Counties:Columbia",
                },
                ["garfield"] = new CountyMetadata
                {
                    CountyId = "garfield",
                    Name = "Garfield County",
                    FipsCode = "53023",
                    CountySeat = "Pomeroy",
                    ApproximatePopulation = 2_300,
                    ApproximateParcelCount = 4_200,
                    HasGisConnector = false,
                    HasPacsConnector = false,
                    HasScraper = false,
                    AssessmentSystemVendor = "Unknown",
                    GisPlatform = "None",
                    ConfigKeyPrefix = "DataMining:Counties:Garfield",
                },
            });

        /// <summary>
        /// Gets metadata for a county by its identifier.
        /// </summary>
        /// <param name="countyId">County identifier (case-insensitive).</param>
        /// <returns>County metadata or null if not found.</returns>
        public static CountyMetadata? GetCounty(string countyId)
        {
            return Counties.TryGetValue(countyId, out var meta) ? meta : null;
        }

        /// <summary>
        /// Returns all counties that have an active scraper implementation.
        /// </summary>
        public static IEnumerable<CountyMetadata> GetScrapableCounties()
        {
            foreach (var kvp in Counties)
            {
                if (kvp.Value.HasScraper)
                    yield return kvp.Value;
            }
        }
    }
}
