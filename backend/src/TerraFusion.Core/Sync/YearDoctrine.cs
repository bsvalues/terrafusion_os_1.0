// TFR-021 — Tax year and assessment cycle management for WA State
using System;
using System.Collections.Generic;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Represents the WA State assessment-levy-collection year cycle.
    /// Assessment Year N → Levy Year N+1 → Collection Year N+1.
    /// </summary>
    public sealed record AssessmentCycle
    {
        /// <summary>Year in which property is assessed (value as of January 1).</summary>
        public int AssessmentYear { get; init; }

        /// <summary>Year in which levies are certified against the assessed value (= AssessmentYear + 1).</summary>
        public int LevyYear => AssessmentYear + 1;

        /// <summary>Year in which taxes are collected (= LevyYear = AssessmentYear + 1).</summary>
        public int CollectionYear => AssessmentYear + 1;
    }

    /// <summary>
    /// Key calendar milestones in the WA State assessment cycle.
    /// </summary>
    public sealed record AssessmentCalendar
    {
        public int Year { get; init; }

        /// <summary>January 1 — statutory assessment date; property value determined as of this date.</summary>
        public DateTime AssessmentDate => new(Year, 1, 1);

        /// <summary>May 31 — assessor's roll due to county for review.</summary>
        public DateTime RollDueDate => new(Year, 5, 31);

        /// <summary>July 1 — DOR equalization review begins.</summary>
        public DateTime EqualizationDate => new(Year, 7, 1);

        /// <summary>October — levy rates certified by county legislative authority.</summary>
        public DateTime LevyCertificationDate => new(Year + 1, 10, 1);

        /// <summary>April 30 — first-half taxes due (collection year).</summary>
        public DateTime FirstHalfDue => new(Year + 1, 4, 30);

        /// <summary>October 31 — second-half taxes due (collection year).</summary>
        public DateTime SecondHalfDue => new(Year + 1, 10, 31);
    }

    /// <summary>
    /// Maps assessment year → levy year → collection year per WA State RCW.
    /// Provides calendar milestone lookups for sync pipeline scheduling.
    /// </summary>
    public class YearDoctrine
    {
        /// <summary>
        /// Returns the assessment cycle for a given assessment year.
        /// </summary>
        public AssessmentCycle GetCycle(int assessmentYear) =>
            new() { AssessmentYear = assessmentYear };

        /// <summary>
        /// Returns the assessment cycle that corresponds to a given collection/levy year.
        /// </summary>
        public AssessmentCycle GetCycleByCollectionYear(int collectionYear) =>
            new() { AssessmentYear = collectionYear - 1 };

        /// <summary>
        /// Returns the calendar milestones for a given assessment year.
        /// </summary>
        public AssessmentCalendar GetCalendar(int assessmentYear) =>
            new() { Year = assessmentYear };

        /// <summary>
        /// Returns the current assessment cycle based on today's date.
        /// If we are past January 1, the current assessment year is this year.
        /// </summary>
        public AssessmentCycle GetCurrentCycle() =>
            GetCycle(DateTime.Today.Year);

        /// <summary>
        /// Determines which phase of the assessment cycle a given date falls into.
        /// </summary>
        public string GetCyclePhase(DateTime date)
        {
            var month = date.Month;
            return month switch
            {
                >= 1 and <= 3 => "assessment-fieldwork",
                >= 4 and <= 5 => "roll-preparation",
                >= 6 and <= 7 => "equalization-review",
                >= 8 and <= 9 => "appeals-period",
                >= 10 and <= 11 => "levy-certification",
                12 => "year-end-closeout",
                _ => "unknown"
            };
        }

        /// <summary>
        /// Returns all cycles for a range of assessment years.
        /// </summary>
        public IReadOnlyList<AssessmentCycle> GetCycles(int startYear, int endYear)
        {
            var cycles = new List<AssessmentCycle>();
            for (int y = startYear; y <= endYear; y++)
                cycles.Add(GetCycle(y));
            return cycles;
        }
    }
}
