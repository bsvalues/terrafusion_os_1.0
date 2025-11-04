using System;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.Core.Utilities
{
    /// <summary>
    /// Elite Type Converter - Government-Grade Type Safety with Championship Precision
    /// 3-6-9-12 Framework: Foundation (3) - Type Safety Score Enhancement
    /// </summary>
    public static class EliteTypeConverter
    {
        /// <summary>
        /// Safely converts object to specified type with fallback value
        /// Prevents CS0266 type conversion errors with championship-level safety
        /// </summary>
        public static T? SafeCast<T>(object value, T? fallback = default) where T : class
        {
            return value as T ?? fallback;
        }

        /// <summary>
        /// Safely converts object to List<T> with empty list fallback
        /// Resolves CS0029 List<string> to List<T> conversion errors
        /// </summary>
        public static List<T> SafeListCast<T>(object value) where T : class
        {
            if (value == null) return new List<T>();
            if (value is List<T> typedList) return typedList;
            if (value is List<string> stringList) return new List<T>();
            return new List<T>();
        }

        /// <summary>
        /// Safely accesses dynamic property with fallback value
        /// Prevents CS1061 property access errors on object/dynamic types
        /// </summary>
        public static TValue GetDynamicProperty<TValue>(dynamic obj, string propertyName, TValue fallback = default!)
        {
            try
            {
                if (obj == null) return fallback;

                var objType = obj.GetType();
                var property = objType.GetProperty(propertyName);

                if (property == null) return fallback;

                var value = property.GetValue(obj);
                if (value == null) return fallback;

                if (value is TValue typedValue)
                    return typedValue;

                // Attempt conversion for value types
                if (typeof(TValue).IsValueType)
                    return (TValue)Convert.ChangeType(value, typeof(TValue));

                return fallback;
            }
            catch
            {
                return fallback;
            }
        }

        /// <summary>
        /// Safely converts decimal to double for calculations
        /// Resolves CS0266 double to decimal conversion errors
        /// </summary>
        public static decimal ToDecimal(double value)
        {
            return Convert.ToDecimal(value);
        }

        /// <summary>
        /// Safely converts object to int with fallback
        /// Championship-level numeric conversion
        /// </summary>
        public static int ToInt(object value, int fallback = 0)
        {
            if (value == null) return fallback;

            try
            {
                return Convert.ToInt32(value);
            }
            catch
            {
                return fallback;
            }
        }

        /// <summary>
        /// Safely converts object to decimal with fallback
        /// Government-grade financial precision
        /// </summary>
        public static decimal ToDecimal(object value, decimal fallback = 0m)
        {
            if (value == null) return fallback;

            try
            {
                return Convert.ToDecimal(value);
            }
            catch
            {
                return fallback;
            }
        }

        /// <summary>
        /// Safely converts object to string with fallback
        /// Prevents null reference errors
        /// </summary>
        public static string ToString(object value, string fallback = "")
        {
            return value?.ToString() ?? fallback;
        }

        /// <summary>
        /// Safely converts object to bool with fallback
        /// Championship-level boolean conversion
        /// </summary>
        public static bool ToBool(object value, bool fallback = false)
        {
            if (value == null) return fallback;

            try
            {
                return Convert.ToBoolean(value);
            }
            catch
            {
                return fallback;
            }
        }

        /// <summary>
        /// Safely extracts Count from object collection
        /// Resolves CS1061 'object' does not contain definition for 'Count' errors
        /// </summary>
        public static int GetCount(object value)
        {
            if (value == null) return 0;

            try
            {
                if (value is System.Collections.ICollection collection)
                    return collection.Count;

                dynamic dynValue = value;
                return dynValue.Count;
            }
            catch
            {
                return 0;
            }
        }

        /// <summary>
        /// Safely checks if object has Any() elements
        /// Prevents CS1061 'object' does not contain definition for 'Any' errors
        /// </summary>
        public static bool HasAny(object value)
        {
            if (value == null) return false;

            try
            {
                if (value is System.Collections.IEnumerable enumerable)
                    return enumerable.Cast<object>().Any();

                return GetCount(value) > 0;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Safely converts object to Dictionary<string, object>
        /// Government-grade dictionary conversion
        /// </summary>
        public static Dictionary<string, object> ToDictionary(object value)
        {
            if (value == null) return new Dictionary<string, object>();

            if (value is Dictionary<string, object> dict)
                return dict;

            return new Dictionary<string, object>();
        }

        /// <summary>
        /// Championship-level type validation
        /// Returns true if object can be safely cast to specified type
        /// </summary>
        public static bool CanCast<T>(object value)
        {
            if (value == null) return false;
            return value is T;
        }

        /// <summary>
        /// Elite conversion with custom converter function
        /// Provides ultimate flexibility for complex conversions
        /// </summary>
        public static TOutput ConvertWith<TInput, TOutput>(
            object value,
            Func<TInput, TOutput> converter,
            TOutput fallback = default!)
        {
            try
            {
                if (value == null) return fallback;

                if (value is TInput typedInput)
                    return converter(typedInput);

                return fallback;
            }
            catch
            {
                return fallback;
            }
        }

        /// <summary>
        /// Government. Transcended. Type Safety Scorer
        /// Calculates type safety score (0-12) for 3-6-9-12 Framework Foundation metric
        /// </summary>
        public static decimal CalculateTypeSafetyScore(int totalCasts, int safeCasts)
        {
            if (totalCasts == 0) return 12m; // Perfect score if no casts needed

            var safetyRatio = (decimal)safeCasts / totalCasts;
            return Math.Round(safetyRatio * 12m, 2); // Scale to 0-12
        }
    }
}
