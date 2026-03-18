// TMR-168: Data Validation Tests
using System;
using System.Collections.Generic;
using Xunit;
using TerraFusion.DataMining.Utils;
using TerraFusion.DataMining.Search;

namespace TerraFusion.DataMining.Tests
{
    /// <summary>
    /// Tests for data validation utilities including coordinate validation,
    /// distance calculations, and search criteria validation.
    /// </summary>
    public class DataValidationTests
    {
        [Theory]
        [InlineData(46.3, -119.5, true)]   // Benton County, WA
        [InlineData(0, 0, true)]            // Valid coordinates (null island)
        [InlineData(90, 180, true)]         // Boundary valid
        [InlineData(-90, -180, true)]       // Boundary valid
        [InlineData(91, 0, false)]          // Latitude out of range
        [InlineData(0, 181, false)]         // Longitude out of range
        [InlineData(-91, 0, false)]         // Negative latitude out of range
        public void IsValidCoordinate_ReturnsExpected(double lat, double lon, bool expected)
        {
            var result = LocationUtils.IsValidCoordinate(lat, lon);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void DistanceMiles_SamePoint_ReturnsZero()
        {
            var distance = LocationUtils.DistanceMiles(46.3, -119.5, 46.3, -119.5);
            Assert.Equal(0, distance, precision: 5);
        }

        [Fact]
        public void DistanceMiles_KnownPoints_ReturnsApproximateDistance()
        {
            // Approximate distance between Kennewick and Richland, WA (~5 miles)
            var distance = LocationUtils.DistanceMiles(46.2112, -119.1372, 46.2856, -119.2845);
            Assert.InRange(distance, 3, 10);
        }

        [Fact]
        public void PropertySearchCriteria_DefaultPageSize_Is50()
        {
            var criteria = new PropertySearchCriteria();
            Assert.Equal(50, criteria.PageSize);
            Assert.Equal(1, criteria.PageNumber);
        }

        [Fact]
        public void PropertySearchCriteria_CanSetFilters()
        {
            var criteria = new PropertySearchCriteria
            {
                CountyId = "benton",
                ParcelNumber = "1-2345-678",
                MinValue = 100000m,
                MaxValue = 500000m
            };

            Assert.Equal("benton", criteria.CountyId);
            Assert.Equal("1-2345-678", criteria.ParcelNumber);
            Assert.Equal(100000m, criteria.MinValue);
            Assert.Equal(500000m, criteria.MaxValue);
        }

        [Fact]
        public void PropertySearchResponse_TotalPages_CalculatesCorrectly()
        {
            var response = new PropertySearchResponse
            {
                TotalCount = 125,
                PageSize = 50
            };

            Assert.Equal(3, response.TotalPages);
        }

        [Fact]
        public void PropertySearchResponse_EmptyResults_ZeroPages()
        {
            var response = new PropertySearchResponse { TotalCount = 0, PageSize = 50 };
            Assert.Equal(0, response.TotalPages);
        }

        [Fact]
        public void GeocodedLocation_Default_IsInvalid()
        {
            var location = new GeocodedLocation();
            Assert.False(location.IsValid);
        }

        [Fact]
        public void GeocodedLocation_WithCoordinates_IsValid()
        {
            var location = new GeocodedLocation { Latitude = 46.3, Longitude = -119.5 };
            Assert.True(location.IsValid);
        }
    }
}
