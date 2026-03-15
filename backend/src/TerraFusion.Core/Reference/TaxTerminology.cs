// LEV-042 — WA State Tax Terminology Reference
// Owner Suite: TerraDais (workflow/state management for assessment operations)

using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;

namespace TerraFusion.Core.Reference
{
    /// <summary>
    /// Dictionary of 50+ Washington State property tax terms.
    /// Sourced from RCW 84, WAC 458, and DOR publications.
    /// Used for tooltips, help text, and training materials.
    /// </summary>
    public static class TaxTerminology
    {
        /// <summary>
        /// Read-only dictionary of term key to <see cref="TaxTerm"/>.
        /// Keys are PascalCase identifiers (e.g., "AssessedValue").
        /// </summary>
        public static readonly ReadOnlyDictionary<string, TaxTerm> Terms =
            new(BuildTerms());

        /// <summary>Search terms by keyword (case-insensitive).</summary>
        public static List<TaxTerm> Search(string keyword)
        {
            var k = keyword.ToUpperInvariant();
            return Terms.Values
                .Where(t => t.Term.ToUpperInvariant().Contains(k)
                          || t.Definition.ToUpperInvariant().Contains(k))
                .ToList();
        }

        private static Dictionary<string, TaxTerm> BuildTerms() => new()
        {
            ["AssessedValue"] = new("Assessed Value", "The value placed on property by the assessor for tax purposes, representing 100% of true and fair market value per RCW 84.40.030."),
            ["TrueAndFairValue"] = new("True and Fair Value", "Market value — the amount a willing buyer would pay a willing seller, neither under compulsion. RCW 84.40.030."),
            ["Levy"] = new("Levy", "The total amount of property tax dollars a taxing district is authorized to collect in a given year."),
            ["LevyRate"] = new("Levy Rate", "The tax rate per $1,000 of assessed value. Calculated as (Levy Amount / Assessed Value) * 1000."),
            ["HighestLawfulLevy"] = new("Highest Lawful Levy", "The maximum levy a district could have imposed in the prior year, used as the base for the 1% limit calculation under RCW 84.55."),
            ["BankedCapacity"] = new("Banked Capacity", "The difference between the highest lawful levy and the amount actually levied. Can be reclaimed in future years per RCW 84.55.092."),
            ["OnePctLimit"] = new("1% Limit (Levy Lid)", "Annual limit restricting most taxing districts from increasing their levy by more than 1% over the prior year's highest lawful levy, per RCW 84.55.010."),
            ["AggregateLimitFiveNinety"] = new("$5.90 Aggregate Limit", "The statutory cap of $5.90 per $1,000 AV for all regular levies on a property, per RCW 84.52.043."),
            ["ConstitutionalLimit"] = new("Constitutional Limit ($10.00)", "Article VII, Section 2 of the WA Constitution caps total regular levies at $10.00 per $1,000 of assessed value."),
            ["TaxCode"] = new("Tax Code (Tax Code Area)", "A geographic area where the same combination of overlapping taxing districts applies. Each parcel is assigned one tax code."),
            ["TaxDistrict"] = new("Tax District (Taxing District)", "A governmental entity authorized to levy property taxes — county, city, school, fire, library, port, etc."),
            ["RegularLevy"] = new("Regular Levy", "A levy imposed annually without voter approval (subject to statutory rate and 1% limits)."),
            ["ExcessLevy"] = new("Excess Levy (Voter-Approved)", "A levy above regular limits, approved by voters (typically 60% supermajority + 40% turnout). Not subject to $5.90 aggregate."),
            ["BondLevy"] = new("Bond Levy", "A voter-approved levy to repay general obligation bonds. Exempt from the 1% limit and $5.90 cap."),
            ["LidLift"] = new("Lid Lift", "Voter approval to permanently or temporarily increase a district's levy above the 1% limit, per RCW 84.55.050."),
            ["NewConstruction"] = new("New Construction", "Value added by new buildings or improvements. Added to the levy base outside the 1% cap."),
            ["Annexation"] = new("Annexation", "When a taxing district expands its boundaries. Value of annexed property is added outside the 1% cap."),
            ["Proration"] = new("Proration (Pro-Rationing)", "Proportional reduction of overlapping district rates when the aggregate exceeds statutory limits, per RCW 84.52.010."),
            ["SeniorExemption"] = new("Senior/Disabled Exemption", "Property tax exemption for qualifying seniors (62+) or disabled persons with limited income. RCW 84.36.381."),
            ["CurrentUse"] = new("Current Use (Open Space)", "Valuation of farm, timber, or open space land at its current use value rather than highest and best use. RCW 84.34."),
            ["DOR"] = new("Department of Revenue (DOR)", "Washington State Department of Revenue — provides oversight, ratio studies, and guidance to county assessors."),
            ["RatioStudy"] = new("Ratio Study", "DOR's annual study comparing assessed values to sales prices. Target: 90-110% of market value."),
            ["Revaluation"] = new("Revaluation", "The process of reassessing all property in a county, required on a cyclical basis (physical inspection every 6 years per RCW 84.41)."),
            ["BOE"] = new("Board of Equalization (BOE)", "County board that hears property value appeals from taxpayers. RCW 84.48."),
            ["PersonalProperty"] = new("Personal Property", "Tangible business assets (equipment, machinery, inventory) subject to property tax in WA."),
            ["RealProperty"] = new("Real Property", "Land and permanent improvements (buildings, structures) subject to property tax."),
            ["ExemptProperty"] = new("Exempt Property", "Property legally excluded from taxation — government, religious, nonprofit, etc. per RCW 84.36."),
            ["TimberLevy"] = new("Timber Tax (Excise)", "WA taxes timber at harvest (excise tax) rather than as standing assessed value. RCW 84.33."),
            ["TIF"] = new("Tax Increment Financing (TIF)", "Financing mechanism where increased tax revenue from rising property values in a designated area funds infrastructure improvements."),
            ["IPD"] = new("Implicit Price Deflator (IPD)", "Federal inflation index used in WA to calculate the maximum allowable levy increase for fire districts and other special purpose districts."),
            ["EMS"] = new("EMS Levy", "Emergency Medical Services levy, authorized up to $0.50/$1,000 AV. RCW 84.52.069."),
            ["SchoolLevy"] = new("School Levy", "Voter-approved enrichment levy for school districts, capped per student or percentage of state funding."),
            ["PortLevy"] = new("Port District Levy", "Port districts may levy up to $0.45/$1,000 for general purposes."),
            ["CountyRoad"] = new("County Road Levy", "Levy for county road construction and maintenance, up to $2.25/$1,000 for unincorporated areas."),
            ["FloodControl"] = new("Flood Control Zone Levy", "Special district levy for flood control, up to $0.50/$1,000. RCW 86.15."),
            ["ConservationFutures"] = new("Conservation Futures Levy", "County levy up to $0.0625/$1,000 for acquiring open space, farmland, and timberland. RCW 84.34.230."),
            ["MetroPark"] = new("Metropolitan Park District Levy", "Voter-created park districts with levy authority. RCW 35.61."),
            ["CertifiedRoll"] = new("Certified Tax Roll", "The final, official roll of all assessed values and tax amounts delivered by the assessor to the treasurer for billing."),
            ["TaxStatement"] = new("Tax Statement", "The bill sent to each property owner showing taxes due, district-by-district breakdown, and payment deadlines."),
            ["FirstHalf"] = new("First-Half Tax", "First installment payment due April 30 of each year in WA."),
            ["SecondHalf"] = new("Second-Half Tax", "Second installment payment due October 31 of each year in WA."),
            ["Delinquency"] = new("Delinquency", "Unpaid taxes past the due date. Interest accrues at 1% per month per RCW 84.56.020."),
            ["ForeclosureThreeYears"] = new("Tax Foreclosure (3-Year)", "County may begin foreclosure proceedings after taxes are delinquent for 3+ years. RCW 84.64."),
            ["SpecialAssessment"] = new("Special Assessment (LID)", "A charge against specific properties that benefit from a local improvement. Not a property tax but appears on the tax statement."),
            ["AbatementCredit"] = new("Abatement / Credit", "Reduction of taxes due to errors, destroyed property, or court-ordered adjustments."),
            ["RefundClaim"] = new("Refund Claim", "Formal request to refund overpaid property taxes, filed within 3 years per RCW 84.69."),
            ["StateLevySchool"] = new("State School Levy", "Statewide levy for public schools, set by the legislature. Separate from local school enrichment levies."),
            ["UrbanGrowthArea"] = new("Urban Growth Area (UGA)", "Area designated under GMA where urban development is encouraged. Relevant for annexation and levy calculations."),
            ["GMA"] = new("Growth Management Act (GMA)", "RCW 36.70A — requires comprehensive planning and affects property classification and valuation."),
            ["TaxTitle"] = new("Tax Title Property", "Property acquired by the county through tax foreclosure."),
            ["CompositeRate"] = new("Composite Rate", "The sum of all individual district levy rates applied to a parcel via its tax code."),
        };
    }

    /// <summary>A single WA property tax term with definition.</summary>
    public class TaxTerm
    {
        public string Term { get; }
        public string Definition { get; }

        public TaxTerm(string term, string definition)
        {
            Term = term;
            Definition = definition;
        }
    }
}
