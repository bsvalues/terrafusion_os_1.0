namespace TerraFusion.Modules.CurrentUse.Interest;

public static class CurrentUseInterestRules
{
    /// <summary>
    /// Phase 2 production rule default: interest starts April 30 of the year the tax could have been paid
    /// without penalty unless county configuration overrides the due date.
    /// </summary>
    public static DateOnly GetDefaultAccrualStartDate(int taxYear)
    {
        return new DateOnly(taxYear, 4, 30);
    }

    public static int CountDaysInclusiveStartExclusiveEnd(DateOnly start, DateOnly end)
    {
        if (end <= start)
        {
            return 0;
        }

        return end.DayNumber - start.DayNumber;
    }
}
