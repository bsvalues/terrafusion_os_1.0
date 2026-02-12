using System;
using System.Data;
using System.Text.RegularExpressions;
using System.Globalization;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Activities.ETL
{
    public class DateTransformation : IDataTransformation
    {
        public string SourceColumn { get; set; }
        public string TargetColumn { get; set; }
        public string InputFormat { get; set; }
        public string OutputFormat { get; set; }
        public CultureInfo Culture { get; set; } = CultureInfo.InvariantCulture;
        public string DefaultValue { get; set; } = null;

        public void Transform(DataTable data, ILogger logger)
        {
            if (!data.Columns.Contains(SourceColumn)) return;

            if (!data.Columns.Contains(TargetColumn))
            {
                data.Columns.Add(TargetColumn, typeof(string));
            }

            foreach (DataRow row in data.Rows)
            {
                try
                {
                    var sourceValue = row[SourceColumn]?.ToString();
                    if (string.IsNullOrEmpty(sourceValue))
                    {
                        row[TargetColumn] = DefaultValue;
                        continue;
                    }

                    var date = DateTime.ParseExact(sourceValue, InputFormat, Culture);
                    row[TargetColumn] = date.ToString(OutputFormat, Culture);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, $"Date transformation failed for value: {row[SourceColumn]}");
                    row[TargetColumn] = DefaultValue;
                }
            }
        }
    }

    public class PhoneNumberTransformation : IDataTransformation
    {
        public string SourceColumn { get; set; }
        public string TargetColumn { get; set; }
        public string CountryCode { get; set; } = "+1";
        public bool StripNonNumeric { get; set; } = true;
        public string Format { get; set; } = "{0}-{1}-{2}-{3}";

        public void Transform(DataTable data, ILogger logger)
        {
            if (!data.Columns.Contains(SourceColumn)) return;

            if (!data.Columns.Contains(TargetColumn))
            {
                data.Columns.Add(TargetColumn, typeof(string));
            }

            foreach (DataRow row in data.Rows)
            {
                try
                {
                    var phone = row[SourceColumn]?.ToString();
                    if (string.IsNullOrEmpty(phone))
                    {
                        row[TargetColumn] = null;
                        continue;
                    }

                    if (StripNonNumeric)
                    {
                        phone = Regex.Replace(phone, @"[^\d]", "");
                    }

                    if (phone.Length == 10)
                    {
                        row[TargetColumn] = string.Format(Format,
                            CountryCode,
                            phone.Substring(0, 3),
                            phone.Substring(3, 3),
                            phone.Substring(6));
                    }
                    else
                    {
                        row[TargetColumn] = phone;
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, $"Phone number transformation failed for value: {row[SourceColumn]}");
                    row[TargetColumn] = row[SourceColumn];
                }
            }
        }
    }

    public class AddressTransformation : IDataTransformation
    {
        public string StreetColumn { get; set; }
        public string CityColumn { get; set; }
        public string StateColumn { get; set; }
        public string ZipColumn { get; set; }
        public string TargetColumn { get; set; }
        public string Format { get; set; } = "{0}, {1}, {2} {3}";
        public bool StandardizeState { get; set; } = true;
        public bool ValidateZip { get; set; } = true;

        private static readonly Dictionary<string, string> StateAbbreviations = new()
        {
            {"ALABAMA", "AL"}, {"ALASKA", "AK"}, {"ARIZONA", "AZ"},
            {"CALIFORNIA", "CA"}, {"COLORADO", "CO"}, {"CONNECTICUT", "CT"},
            // Add more states as needed
        };

        public void Transform(DataTable data, ILogger logger)
        {
            var columns = new[] { StreetColumn, CityColumn, StateColumn, ZipColumn };
            if (!columns.All(c => data.Columns.Contains(c))) return;

            if (!data.Columns.Contains(TargetColumn))
            {
                data.Columns.Add(TargetColumn, typeof(string));
            }

            foreach (DataRow row in data.Rows)
            {
                try
                {
                    var street = row[StreetColumn]?.ToString()?.Trim();
                    var city = row[CityColumn]?.ToString()?.Trim();
                    var state = row[StateColumn]?.ToString()?.Trim().ToUpper();
                    var zip = row[ZipColumn]?.ToString()?.Trim();

                    if (StandardizeState && StateAbbreviations.ContainsKey(state))
                    {
                        state = StateAbbreviations[state];
                    }

                    if (ValidateZip && !Regex.IsMatch(zip, @"^\d{5}(-\d{4})?$"))
                    {
                        logger.LogWarning($"Invalid ZIP code: {zip}");
                    }

                    row[TargetColumn] = string.Format(Format, street, city, state, zip);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Address transformation failed");
                    row[TargetColumn] = null;
                }
            }
        }
    }

    public class AggregateTransformation : IDataTransformation
    {
        public string[] SourceColumns { get; set; }
        public string TargetColumn { get; set; }
        public AggregationType AggregationType { get; set; }
        public bool IgnoreNulls { get; set; } = true;
        public double DefaultValue { get; set; } = 0;

        public void Transform(DataTable data, ILogger logger)
        {
            if (!SourceColumns.All(c => data.Columns.Contains(c))) return;

            if (!data.Columns.Contains(TargetColumn))
            {
                data.Columns.Add(TargetColumn, typeof(double));
            }

            foreach (DataRow row in data.Rows)
            {
                try
                {
                    var values = SourceColumns
                        .Select(c => row[c])
                        .Where(v => !IgnoreNulls || (v != DBNull.Value && v != null))
                        .Select(v => Convert.ToDouble(v))
                        .ToList();

                    if (!values.Any())
                    {
                        row[TargetColumn] = DefaultValue;
                        continue;
                    }

                    row[TargetColumn] = AggregationType switch
                    {
                        AggregationType.Sum => values.Sum(),
                        AggregationType.Average => values.Average(),
                        AggregationType.Minimum => values.Min(),
                        AggregationType.Maximum => values.Max(),
                        _ => DefaultValue
                    };
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Aggregate transformation failed");
                    row[TargetColumn] = DefaultValue;
                }
            }
        }
    }

    public enum AggregationType
    {
        Sum,
        Average,
        Minimum,
        Maximum
    }
}
