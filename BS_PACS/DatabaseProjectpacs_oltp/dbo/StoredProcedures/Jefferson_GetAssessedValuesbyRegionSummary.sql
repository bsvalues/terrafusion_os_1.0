
CREATE PROCEDURE [dbo].[Jefferson_GetAssessedValuesbyRegionSummary]
  @AssessmentYear char(4)
 
AS
DECLARE
@AssessYear int,
@FarmPPValue int = 0

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..#PACS_Property_Assessment') is not null
BEGIN
    DROP TABLE #PACS_Property_Assessment
END

CREATE TABLE #PACS_Property_Assessment
(
Year_AV		  int null,
PACSprop_id	  int,
Parcel_Number	  varchar(12) null,
Property_Use_Code	varchar(10) null,
Property_Type_Code varchar(5) null,
Region_Code     varchar(5) null,
isCUorTBRflag   varchar(10) null,
isStateAssessedFlag varchar(10) null,
ExemptEX		varchar(10) null,
ExemptSC        varchar(10) null,
ExemptSC_Qualify varchar(10) null,
ExemptHOF       varchar(10) null,
ExemptUnder500  varchar(10)null,
FMV_Improvements numeric(14,0) null,
FMV_Land        numeric(14,0) null,
FMV_Total       numeric(14,0) null,
Taxable_PP      numeric(14,0) null,
Taxable_SC      numeric(14,0) null,
Taxable_NonSC   numeric(14,0) null
)
 
INSERT INTO #PACS_Property_Assessment 
  (Year_AV, PACSprop_id, Parcel_Number, Property_Use_Code, Property_Type_Code, Region_Code, isCUorTBRflag, isStateAssessedFlag, ExemptEX, ExemptSC, ExemptSC_Qualify, ExemptHOF, ExemptUnder500, FMV_Improvements, FMV_Land, FMV_Total, Taxable_PP, Taxable_SC, Taxable_NonSC)
  SELECT @AssessYear, a.prop_id, b.geo_id, a.property_use_cd, b.prop_type_cd, a.rgn_cd, '', '', '', '', '', '', '', a.imprv_hstd_val + a.imprv_non_hstd_val, a.land_hstd_val + a.land_non_hstd_val + a.ag_market, a.imprv_hstd_val + a.imprv_non_hstd_val + a.land_hstd_val + a.land_non_hstd_val + a.ag_market, 0, 0, 0
  FROM property_val As a, property As b
  WHERE a.prop_id = b.prop_id AND a.prop_val_yr = @AssessYear AND a.sup_num = 0
  AND a.prop_val_yr = @AssessYear AND IsNull(a.prop_inactive_dt, '1/1/1900') = '1/1/1900'

UPDATE #PACS_Property_Assessment SET ExemptEX = exmpt_type_cd
FROM #PACS_Property_Assessment As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND b.sup_num = 0
AND exmpt_type_cd = 'EX'

UPDATE #PACS_Property_Assessment SET ExemptSC = b.exmpt_type_cd, ExemptSC_Qualify = b.exempt_qualify_cd
FROM #PACS_Property_Assessment As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND b.sup_num = 0
AND exmpt_type_cd = 'SNR/DSBL'

UPDATE #PACS_Property_Assessment SET ExemptHOF = b.exmpt_type_cd
FROM #PACS_Property_Assessment As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND b.exmpt_type_cd = 'HOF'

UPDATE #PACS_Property_Assessment SET ExemptUnder500 = 'YES'
FROM #PACS_Property_Assessment As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND b.exmpt_type_cd = 'U500'

UPDATE #PACS_Property_Assessment SET isCUorTBRflag = 'YES'
FROM #PACS_Property_Assessment As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND b.ag_market > 0

UPDATE #PACS_Property_Assessment SET isStateAssessedFlag = 'YES'
FROM #PACS_Property_Assessment As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND b.state_assessed > 0

UPDATE #PACS_Property_Assessment SET Taxable_SC = b.taxable_classified, Taxable_NonSC = b.taxable_non_classified
FROM #PACS_Property_Assessment As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND a.Property_Type_Code <> 'P' AND b.sup_num = 0

UPDATE #PACS_Property_Assessment SET Taxable_PP =  b.taxable_classified + b.taxable_non_classified
FROM #PACS_Property_Assessment As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND a.Property_Type_Code = 'P' AND b.sup_num = 0

UPDATE #PACS_Property_Assessment SET ExemptUnder500 = 'YES'--, Taxable_NonSC = 0 Already zeroed out in wash_prop_owner_val
FROM #PACS_Property_Assessment
WHERE isCUorTBRflag <> 'YES' AND Taxable_NonSC > 0 AND Taxable_NonSC < 500


-- Build Regional Distribution Table
IF object_id('TEMPDB..#PACS_District_Levy_Table') is not null
BEGIN
    DROP TABLE [#PACS_Region_AV_Table]
END

CREATE TABLE #PACS_Region_AV_Table
(
region_cd 		            varchar(10) null,
region_desc		            varchar(50) null,
av_year		 			    numeric(4,0) null,
Taxable_PP_StateAssessed    numeric(14,0) null,
Taxable_RP_StateAssessed    numeric(14,0) null,
Taxable_PP					numeric(14,0) null,
Taxable_SC					numeric(14,0) null,
Taxable_NonSC				numeric(14,0) null,
Taxable_Voted				numeric(14,0) null,
Taxable_NonVoted			numeric(14,0) null
)

INSERT INTO #PACS_Region_AV_Table (region_cd, region_desc, av_year, Taxable_PP_StateAssessed, Taxable_RP_StateAssessed, Taxable_PP, Taxable_SC, Taxable_NonSC, Taxable_Voted, Taxable_NonVoted)
SELECT rgn_cd, rgn_name, @AssessYear, 0, 0, 0, 0, 0, 0, 0
FROM region

UPDATE #PACS_Region_AV_Table   --Add Values
SET Taxable_PP = b.TTL_PP, Taxable_SC = b.TTL_SC, Taxable_NonSC = b.TTL_NonSC, Taxable_Voted = b.TTL_PP + b.TTL_NonSC, Taxable_NonVoted = b.TTL_PP + b.TTL_SC + b.TTL_NonSC
FROM #PACS_Region_AV_Table As a, (SELECT Region_Code, SUM(Taxable_PP) As TTL_PP,  SUM(Taxable_SC) As TTL_SC,  SUM(Taxable_NonSC) As TTL_NonSC
FROM #PACS_Property_Assessment
WHERE ExemptEX = '' AND ExemptUnder500 <> 'YES'
GROUP BY Region_Code) As b WHERE a.region_cd = b.Region_Code

UPDATE #PACS_Region_AV_Table   --Add State Assessed Utilities
SET Taxable_PP_StateAssessed = b.TTL_PP, Taxable_RP_StateAssessed = b.TTL_NonSC
FROM #PACS_Region_AV_Table As a, (SELECT Region_Code, SUM(Taxable_PP) As TTL_PP,  SUM(Taxable_SC) As TTL_SC,  SUM(Taxable_NonSC) As TTL_NonSC
FROM #PACS_Property_Assessment
WHERE isStateAssessedFlag = 'YES'
GROUP BY Region_Code) As b WHERE a.region_cd = b.Region_Code


SELECT * FROM #PACS_Region_AV_Table ORDER BY region_cd

GRANT EXECUTE ON [dbo].[Jefferson_GetAssessedValuesbyRegionSummary] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetAssessedValuesbyRegionSummary] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetAssessedValuesbyRegionSummary] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetAssessedValuesbyRegionSummary] TO PUBLIC
    AS [dbo];


GO

