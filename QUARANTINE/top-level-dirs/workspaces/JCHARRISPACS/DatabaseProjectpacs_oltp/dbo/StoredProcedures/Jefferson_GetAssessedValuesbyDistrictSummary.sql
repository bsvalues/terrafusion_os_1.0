
CREATE PROCEDURE [dbo].[Jefferson_GetAssessedValuesbyDistrictSummary]
  @AssessmentYear char(4),
  @UseSup varchar(10)
 
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
PACSsup_num   int,
PACSprop_id	  int,
Parcel_Number	  varchar(12) null,
Property_Use_Code	varchar(10) null,
Property_Type_Code varchar(5) null,
isCUorTBRflag   varchar(10) null,
isStateAssessedFlag varchar(10) null,
ExemptEX		varchar(10) null,
ExemptSC        varchar(10) null,
ExemptSC_Qualify varchar(10) null,
ExemptHOF       varchar(10) null,
ExemptUnder500  varchar(10) null,
FMV_Improvements numeric(14,0) null,
FMV_Land        numeric(14,0) null,
FMV_Total       numeric(14,0) null,
Taxable_PP      numeric(14,0) null,
Taxable_SC      numeric(14,0) null,
Taxable_NonSC   numeric(14,0) null
)

If @UseSup = 'NO'
BEGIN 
INSERT INTO #PACS_Property_Assessment 
  (Year_AV, PACSsup_num, PACSprop_id, Parcel_Number, Property_Use_Code, Property_Type_Code, isCUorTBRflag, isStateAssessedFlag, ExemptEX, ExemptSC, ExemptSC_Qualify, ExemptHOF, ExemptUnder500, FMV_Improvements, FMV_Land, FMV_Total, Taxable_PP, Taxable_SC, Taxable_NonSC)
  SELECT @AssessYear, a.sup_num, a.prop_id, Left(b.geo_id,12), a.property_use_cd, b.prop_type_cd, '', '', '', '', '', '', '', a.imprv_hstd_val + a.imprv_non_hstd_val, a.land_hstd_val + a.land_non_hstd_val + a.ag_market, a.imprv_hstd_val + a.imprv_non_hstd_val + a.land_hstd_val + a.land_non_hstd_val + a.ag_market, 0, 0, 0
  FROM property_val As a, property As b
  WHERE a.prop_id = b.prop_id AND a.prop_val_yr = @AssessYear AND a.sup_num = 0
  AND a.prop_val_yr = @AssessYear AND IsNull(a.prop_inactive_dt, '1/1/1900') = '1/1/1900'
END

If @UseSup = 'YES'
BEGIN 
INSERT INTO #PACS_Property_Assessment 
  (Year_AV, PACSsup_num, PACSprop_id, Parcel_Number, Property_Use_Code, Property_Type_Code, isCUorTBRflag, isStateAssessedFlag, ExemptEX, ExemptSC, ExemptSC_Qualify, ExemptHOF, ExemptUnder500, FMV_Improvements, FMV_Land, FMV_Total, Taxable_PP, Taxable_SC, Taxable_NonSC)
  SELECT @AssessYear, a.sup_num, a.prop_id, Left(b.geo_id,12), a.property_use_cd, b.prop_type_cd, '', '', '', '', '', '', '', a.imprv_hstd_val + a.imprv_non_hstd_val, a.land_hstd_val + a.land_non_hstd_val + a.ag_market, a.imprv_hstd_val + a.imprv_non_hstd_val + a.land_hstd_val + a.land_non_hstd_val + a.ag_market, 0, 0, 0
  FROM property_val As a, property As b, prop_supp_assoc As c
  WHERE a.prop_id = b.prop_id AND a.prop_val_yr = @AssessYear AND a.sup_num = c.sup_num
  AND a.prop_id = c.prop_id AND a.prop_val_yr = c.owner_tax_yr
  AND a.prop_val_yr = @AssessYear AND IsNull(a.prop_inactive_dt, '1/1/1900') = '1/1/1900'
END

UPDATE #PACS_Property_Assessment SET ExemptEX = exmpt_type_cd
FROM #PACS_Property_Assessment As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND a.PACSsup_num = b.sup_num
AND exmpt_type_cd = 'EX'

UPDATE #PACS_Property_Assessment SET ExemptSC = b.exmpt_type_cd, ExemptSC_Qualify = b.exempt_qualify_cd
FROM #PACS_Property_Assessment As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND a.PACSsup_num = b.sup_num
AND exmpt_type_cd = 'SNR/DSBL'

UPDATE #PACS_Property_Assessment SET ExemptHOF = b.exmpt_type_cd
FROM #PACS_Property_Assessment As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND b.exmpt_type_cd = 'HOF'

UPDATE #PACS_Property_Assessment SET ExemptUnder500 = 'YES'
FROM #PACS_Property_Assessment As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND a.PACSsup_num = b.sup_num AND b.exmpt_type_cd = 'U500'

UPDATE #PACS_Property_Assessment SET isCUorTBRflag = 'YES'
FROM #PACS_Property_Assessment As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND a.PACSsup_num = b.sup_num AND b.ag_market > 0

UPDATE #PACS_Property_Assessment SET isStateAssessedFlag = 'YES'
FROM #PACS_Property_Assessment As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND a.PACSsup_num = b.sup_num AND b.state_assessed > 0

UPDATE #PACS_Property_Assessment SET Taxable_SC = b.taxable_classified, Taxable_NonSC = b.taxable_non_classified
FROM #PACS_Property_Assessment As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND a.PACSsup_num = b.sup_num AND a.Property_Type_Code <> 'P' AND b.sup_num = a.PACSsup_num

UPDATE #PACS_Property_Assessment SET Taxable_PP =  b.taxable_classified + b.taxable_non_classified
FROM #PACS_Property_Assessment As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND a.PACSsup_num = b.sup_num AND a.Property_Type_Code = 'P' AND b.sup_num = a.PACSsup_num

UPDATE #PACS_Property_Assessment SET ExemptUnder500 = 'YES'--, Taxable_NonSC = 0 Already zeroed out in wash_prop_owner_val
FROM #PACS_Property_Assessment
WHERE isCUorTBRflag <> 'YES' AND Taxable_NonSC > 0 AND Taxable_NonSC < 500


-- Build Tax District Table
IF object_id('TEMPDB..#PACS_District_Levy_Table') is not null
BEGIN
    DROP TABLE [#PACS_District_Levy_Table]
END

CREATE TABLE #PACS_District_Levy_Table
(
tax_district_priority		int null,
tax_district_type_cd        varchar(10) null,
tax_district_type_desc		varchar(50) null,
tax_district_cd             varchar(20) null,
tax_district_desc			varchar(50) null,
tax_district_id   			int null,
av_year		 			    numeric(4,0) null,
levy_cd						varchar(10) null,
levy_description            varchar(50) null,
Taxable_PP_StateAssessed    numeric(14,0) null,
Taxable_RP_StateAssessed    numeric(14,0) null,
Taxable_PP					numeric(14,0) null,
Taxable_SC					numeric(14,0) null,
Taxable_NonSC				numeric(14,0) null,
Taxable_Voted				numeric(14,0) null,
Taxable_NonVoted			numeric(14,0) null,
TaxableCount_PP_StateAssessed int null,
TaxableCount_RP_StateAssessed int null,
TaxableCount_PP               int null,
TaxableCount_SC               int null,
TaxableCount_NonSC            int null,
TaxableCount_Voted            int null,
TaxableCount_NonVoted         int null,
ExemptCount                   int null
)

INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, av_year, levy_cd, levy_description, Taxable_PP_StateAssessed, Taxable_RP_StateAssessed, Taxable_PP, Taxable_SC, Taxable_NonSC, Taxable_Voted, Taxable_NonVoted,
TaxableCount_PP_StateAssessed, TaxableCount_RP_StateAssessed, TaxableCount_PP, TaxableCount_SC, TaxableCount_NonSC, TaxableCount_Voted, TaxableCount_NonVoted, ExemptCount)
SELECT a.priority, a.tax_district_type_cd, a.tax_district_desc, b.tax_district_cd, b.tax_district_desc, b.tax_district_id, c.year, c.levy_cd, c.levy_description, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 0, 0
FROM tax_district_type As a, tax_district As b, levy As c
WHERE a.tax_district_type_cd = b.tax_district_type_cd AND b.tax_district_id = c.tax_district_id AND c.year = @AssessYear AND IsNull(c.end_year, 2999) > @AssessYear
-- Include Flood Zones
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, av_year, levy_cd, levy_description, Taxable_PP_StateAssessed, Taxable_RP_StateAssessed, Taxable_PP, Taxable_SC, Taxable_NonSC, Taxable_Voted, Taxable_NonVoted, TaxableCount_PP_StateAssessed, TaxableCount_RP_StateAssessed, TaxableCount_PP, TaxableCount_SC, TaxableCount_NonSC, TaxableCount_Voted, TaxableCount_NonVoted, ExemptCount)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z1', 'FLOOD ZONE #1', 100000, @AssessYear, 'FZ1', 'FLOOD ZONE #1 (no levy)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, av_year, levy_cd, levy_description, Taxable_PP_StateAssessed, Taxable_RP_StateAssessed, Taxable_PP, Taxable_SC, Taxable_NonSC, Taxable_Voted, Taxable_NonVoted, TaxableCount_PP_StateAssessed, TaxableCount_RP_StateAssessed, TaxableCount_PP, TaxableCount_SC, TaxableCount_NonSC, TaxableCount_Voted, TaxableCount_NonVoted, ExemptCount)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z2', 'FLOOD ZONE #2', 100001, @AssessYear, 'FZ2', 'FLOOD ZONE #2 (no levy)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, av_year, levy_cd, levy_description, Taxable_PP_StateAssessed, Taxable_RP_StateAssessed, Taxable_PP, Taxable_SC, Taxable_NonSC, Taxable_Voted, Taxable_NonVoted, TaxableCount_PP_StateAssessed, TaxableCount_RP_StateAssessed, TaxableCount_PP, TaxableCount_SC, TaxableCount_NonSC, TaxableCount_Voted, TaxableCount_NonVoted, ExemptCount)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z3', 'FLOOD ZONE #3', 100002, @AssessYear, 'FZ3', 'FLOOD ZONE #3 (no levy)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

UPDATE #PACS_District_Levy_Table SET tax_district_type_desc = 'FIRE DISTRICT' WHERE tax_district_type_cd = 'FD'  OR tax_district_type_cd = 'FD-P'

--Change Priorities for reports
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 0 WHERE tax_district_type_cd = 'ST' --State Schools
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 1 WHERE tax_district_type_cd = 'CO' --County
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 2 WHERE tax_district_type_cd = 'CF' --Conservation Futures
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 3 WHERE tax_district_type_cd = 'RO' --Roads
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 4 WHERE tax_district_type_cd = 'CI' OR tax_district_type_cd = 'CITY' --City Of PT
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 5 WHERE tax_district_type_cd = 'CE' OR tax_district_type_cd = 'CEM' --Cemetery
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 6 WHERE tax_district_type_cd = 'FI' OR tax_district_type_cd = 'FD'  OR tax_district_type_cd = 'FD-P' --Fire
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 7 WHERE tax_district_type_cd = 'EMS' --EMS
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 8 WHERE tax_district_type_cd = 'HOSP' --Hospital
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 9 WHERE tax_district_type_cd = 'LI' OR tax_district_type_cd = 'LIB' --Library
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 10 WHERE tax_district_type_cd = 'PO' OR tax_district_type_cd = 'PORT' --Port
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 11, tax_district_type_desc = 'PUD' WHERE tax_district_cd = 'PUD1'  OR tax_district_type_cd = 'PUD' --PUD
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 12 WHERE tax_district_type_cd = 'SD' --Schools
UPDATE #PACS_District_Levy_Table SET tax_district_priority = 13 WHERE tax_district_type_cd = 'FZ' --Flood Zones

-- Build Tax District - Tax Area cross reference table (to inlcude flood zones)
IF object_id('TEMPDB..#PACS_Levy_TaxArea_Table') is not null
BEGIN
    DROP TABLE [#PACS_Levy_TaxArea_Table]
END
CREATE TABLE [#PACS_Levy_TaxArea_Table]
(levy_cd varchar(10) null, tax_area_id     int null)
INSERT INTO [#PACS_Levy_TaxArea_Table] (levy_cd, tax_area_id)
SELECT levy_cd, tax_area_id FROM tax_area_fund_assoc WHERE year = @AssessYear
 AND levy_cd <> 'PARK2'

-- Add in Park District 2 (Make same as FD#4 EMS)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id)
SELECT 'PARK2', tax_area_id FROM tax_area_fund_assoc WHERE year = @AssessYear AND levy_cd = 'EMS4'

-- Add in Flood Zones
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ1',1031)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ1',1044)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ1',1047)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ1',1049)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ1',1054)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ2',1030)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ2',1035)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ2',1045)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ2',1048)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ2',1052)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ2',1055)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ3',1034)
INSERT INTO #PACS_Levy_TaxArea_Table (levy_cd, tax_area_id) VALUES ('FZ3',1039)

UPDATE #PACS_District_Levy_Table   --Add Values
SET Taxable_PP = b.TTL_PP, Taxable_SC = b.TTL_SC, Taxable_NonSC = b.TTL_NonSC, Taxable_Voted = b.TTL_PP + b.TTL_NonSC, Taxable_NonVoted = b.TTL_PP + b.TTL_SC + b.TTL_NonSC
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.Taxable_PP) As TTL_PP,  SUM(c.Taxable_SC) As TTL_SC,  SUM(c.Taxable_NonSC) As TTL_NonSC
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_Property_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = c.PACSsup_num AND c.ExemptEX = '' AND ExemptUnder500 <> 'YES'
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table   --Add State Assessed Utilities Values
SET Taxable_PP_StateAssessed = b.TTL_PP, Taxable_RP_StateAssessed = b.TTL_NonSC
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.Taxable_PP) As TTL_PP,  SUM(c.Taxable_NonSC) As TTL_NonSC
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_Property_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = c.PACSsup_num AND c.isStateAssessedFlag = 'YES'
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table   --Add PP State Assessed Utilities Count
SET TaxableCount_PP_StateAssessed = b.Count_PP
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, COUNT(c.Taxable_PP) As Count_PP FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_Property_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = c.PACSsup_num AND c.isStateAssessedFlag = 'YES' AND c.Property_Type_Code = 'P'
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table   --Add RP State Assessed Utilities Count
SET TaxableCount_RP_StateAssessed = b.Count_RP
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, COUNT(c.Taxable_NonSC) As Count_RP FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_Property_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = c.PACSsup_num AND c.isStateAssessedFlag = 'YES' AND c.Property_Type_Code <> 'P'
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table   --Add Personal Property Count
SET TaxableCount_PP = b.Count_PP
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, COUNT(c.Taxable_PP) As Count_PP FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_Property_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = c.PACSsup_num AND c.ExemptEX = '' AND c.Property_Type_Code = 'P'
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table   --Add Senior Citizen Count
SET TaxableCount_SC = b.Count_SC
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, COUNT(c.Taxable_SC) As Count_SC FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_Property_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = c.PACSsup_num AND c.ExemptEX = '' AND c.ExemptSC <> ''
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table   --Add Non-Senior Citizen Count
SET TaxableCount_NonSC = b.Count_NonSC
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, COUNT(c.Taxable_NonSC) As Count_NonSC FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_Property_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = c.PACSsup_num AND c.ExemptEX = '' AND c.ExemptSC = ''  AND c.Property_Type_Code <> 'P'
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table SET TaxableCount_Voted = TaxableCount_PP + TaxableCount_NonSC, TaxableCount_NonVoted = TaxableCount_PP + TaxableCount_SC + TaxableCount_NonSC


UPDATE #PACS_District_Levy_Table   --Add Exempt Count
SET ExemptCount = b.Count_Exempt
FROM #PACS_District_Levy_Table As a,
(SELECT levy_cd, COUNT(c.PACSprop_id) As Count_Exempt FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_Property_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = c.PACSsup_num AND c.ExemptEX <> ''
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd


-- Remove Farms from State Levy for Farm Equipment Personal Property
--SET @FarmPPValue = (SELECT Sum(Taxable_PP) FROM #PACS_Property_Assessment As a, property_tax_area As b WHERE a.Property_Type_Code = 'P' AND a.PACSprop_id = b.prop_id AND b.year = @AssessYear AND b.sup_num = 0 AND (b.tax_area_id = 1022 OR b.tax_area_id = 1040))
--UPDATE #PACS_District_Levy_Table
--SET Taxable_PP = Taxable_PP - @FarmPPValue, Taxable_Voted = Taxable_Voted  - @FarmPPValue, Taxable_NonVoted = Taxable_NonVoted  - @FarmPPValue
--WHERE tax_district_cd = 'STATE'

SELECT * FROM #PACS_District_Levy_Table ORDER BY tax_district_priority, tax_district_desc
--SELECT SUM(Taxable_SC_AandB) FROM #PACS_Property_Assessment --ORDER BY PACSprop_id
--SELECT SUM(Taxable_PP) FROM #PACS_Property_Assessment
--SELECT SUM(Taxable_NonSC) FROM #PACS_Property_Assessment

GRANT EXECUTE ON [dbo].[Jefferson_GetAssessedValuesbyDistrictSummary] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetAssessedValuesbyDistrictSummary] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetAssessedValuesbyDistrictSummary] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetAssessedValuesbyDistrictSummary] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

