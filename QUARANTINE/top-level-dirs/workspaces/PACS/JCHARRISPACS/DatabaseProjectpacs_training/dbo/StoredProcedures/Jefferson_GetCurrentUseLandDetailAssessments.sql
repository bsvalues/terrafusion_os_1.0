
CREATE PROCEDURE [dbo].[Jefferson_GetCurrentUseLandDetailAssessments]
  @AssessmentYear char(4)
 
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..#PACS_CurrentUse_Assessment') is not null
BEGIN
    DROP TABLE [#PACS_CurrentUse_Assessment]
END

CREATE TABLE #PACS_CurrentUse_Assessment
(
ag_use_cd		char(5) null,
prop_id			int null,
prop_val_yr     numeric(4,0) null,
property_use_cd	varchar(10) null,
size_acres		numeric(18,4) null,
state_cd        char(5) null,
ag_val	        numeric(14,0) null,
land_seg_mkt_val numeric(14,0) null,
land_type_cd    char(10) null,
land_class_code char(3) null,
exmpt_type_cd1  varchar(10) null,
exmpt_type_cd2  varchar(10) null,
exempt_qualify_cd varchar(10) null
)
 
INSERT INTO #PACS_CurrentUse_Assessment 
  (ag_use_cd, prop_id, prop_val_yr, property_use_cd, size_acres, state_cd, ag_val, land_seg_mkt_val, land_type_cd, land_class_code, exmpt_type_cd1, exmpt_type_cd2, exempt_qualify_cd)
  SELECT a.ag_use_cd, a.prop_id, a.prop_val_yr, b.property_use_cd, a.size_acres, a.state_cd, a.ag_val, a.land_seg_mkt_val, a.land_type_cd, a.land_class_code, '', '', ''
  FROM land_detail As a, property_val As b
  WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
  AND a.prop_val_yr = @AssessYear  AND a.sale_id = 0 AND a.sup_num = 0 AND a.ag_apply = 'T' AND IsNull(b.prop_inactive_dt, '1/1/1900') = '1/1/1900'
  AND (a.ag_use_cd = 'DFL' OR a.ag_use_cd = 'TIM' OR a.ag_use_cd = 'AG' OR a.ag_use_cd = 'OSP')
  AND a.land_type_cd <> 'EXEMPT'

UPDATE #PACS_CurrentUse_Assessment SET exmpt_type_cd1 = exmpt_type_cd
FROM #PACS_CurrentUse_Assessment As a, property_exemption As b
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.exmpt_tax_yr AND b.sup_num = 0
AND exmpt_type_cd = 'EX'

UPDATE #PACS_CurrentUse_Assessment SET exmpt_type_cd2 = b.exmpt_type_cd, exempt_qualify_cd = b.exempt_qualify_cd
FROM #PACS_CurrentUse_Assessment As a, property_exemption As b
WHERE a.prop_id = b.prop_id AND a.prop_val_yr = b.exmpt_tax_yr AND b.sup_num = 0
AND exmpt_type_cd = 'SNR/DSBL'

UPDATE #PACS_CurrentUse_Assessment SET ag_val = 0, size_acres = 0, land_seg_mkt_val = 0
FROM #PACS_CurrentUse_Assessment 
WHERE exmpt_type_cd1 = 'EX' --OR exempt_qualify_cd = 1 OR exempt_qualify_cd = 2

UPDATE #PACS_CurrentUse_Assessment SET ag_val = land_seg_mkt_val
FROM #PACS_CurrentUse_Assessment 
WHERE ag_val > land_seg_mkt_val

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
levy_year					numeric(4,0) null,
levy_cd						varchar(10) null,
levy_description            varchar(50) null,
DFL_value					numeric(14,0) null,
DFL_acres				    numeric(18,4) null,
TIM_value					numeric(14,0) null,
TIM_acres				    numeric(18,4) null,
OSP_value					numeric(14,0) null,
OSP_market_value			numeric(14,0) null,
OSP_acres				    numeric(18,4) null,
AG_value					numeric(14,0) null,
AG_acres				    numeric(18,4) null,
AG_1_value					numeric(14,0) null,
AG_1_acres				    numeric(18,4) null,
AG_2_value					numeric(14,0) null,
AG_2_acres				    numeric(18,4) null,
AG_3_value					numeric(14,0) null,
AG_3_acres				    numeric(18,4) null,
AG_4_value					numeric(14,0) null,
AG_4_acres				    numeric(18,4) null,
AG_H_value					numeric(14,0) null,
AG_H_acres				    numeric(18,4) null
)

INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, DFL_value, DFL_acres, TIM_value, TIM_acres, OSP_value, OSP_market_value, OSP_acres, AG_value, AG_acres, AG_1_value, AG_1_acres, AG_2_value, AG_2_acres, AG_3_value, AG_3_acres, AG_4_value, AG_4_acres, AG_H_value, AG_H_acres)
SELECT a.priority, a.tax_district_type_cd, a.tax_district_desc, b.tax_district_cd, b.tax_district_desc, b.tax_district_id, c.year, c.levy_cd, c.levy_description, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM tax_district_type As a, tax_district As b, levy As c
WHERE a.tax_district_type_cd = b.tax_district_type_cd AND b.tax_district_id = c.tax_district_id AND c.year = @AssessYear AND IsNull(c.end_year, 2999) > @AssessYear
-- Include Flood Zones
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, DFL_value, DFL_acres, TIM_value, TIM_acres, OSP_value, OSP_market_value, OSP_acres, AG_value, AG_acres, AG_1_value, AG_1_acres, AG_2_value, AG_2_acres, AG_3_value, AG_3_acres, AG_4_value, AG_4_acres, AG_H_value, AG_H_acres)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z1', 'FLOOD ZONE #1', 100000, @AssessYear, 'FZ1', 'FLOOD ZONE #1 (no levy)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, DFL_value, DFL_acres, TIM_value, TIM_acres, OSP_value, OSP_market_value, OSP_acres, AG_value, AG_acres, AG_1_value, AG_1_acres, AG_2_value, AG_2_acres, AG_3_value, AG_3_acres, AG_4_value, AG_4_acres, AG_H_value, AG_H_acres)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z2', 'FLOOD ZONE #2', 100001, @AssessYear, 'FZ2', 'FLOOD ZONE #2 (no levy)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
INSERT INTO #PACS_District_Levy_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, DFL_value, DFL_acres, TIM_value, TIM_acres, OSP_value, OSP_market_value, OSP_acres, AG_value, AG_acres, AG_1_value, AG_1_acres, AG_2_value, AG_2_acres, AG_3_value, AG_3_acres, AG_4_value, AG_4_acres, AG_H_value, AG_H_acres)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z3', 'FLOOD ZONE #3', 100002, @AssessYear, 'FZ3', 'FLOOD ZONE #3 (no levy)', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)

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


UPDATE #PACS_District_Levy_Table   --Add DFL values
SET DFL_value = b.TtlVal, DFL_acres = b.TtlAcres
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'DFL' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add TIM values
SET TIM_value = b.TtlVal, TIM_acres = b.TtlAcres
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'TIM' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add OSP values
SET OSP_value = b.TtlVal, OSP_acres = b.TtlAcres, OSP_market_value = b.TtlMktVal
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres, SUM(c.land_seg_mkt_val) As TTlMktVal
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'OSP' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add AG values
SET AG_value = b.TtlVal, AG_acres = b.TtlAcres
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'AG' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add AG1 values
SET AG_1_value = b.TtlVal, AG_1_acres = b.TtlAcres
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'AG' AND c.land_class_code = 'AG1' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add AG1 values
SET AG_2_value = b.TtlVal, AG_2_acres = b.TtlAcres
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'AG' AND c.land_class_code = 'AG2' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add AG1 values
SET AG_3_value = b.TtlVal, AG_3_acres = b.TtlAcres
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'AG' AND c.land_class_code = 'AG3' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add AG1 values
SET AG_4_value = b.TtlVal, AG_4_acres = b.TtlAcres
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'AG' AND c.land_class_code = 'AG4' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

UPDATE #PACS_District_Levy_Table  --Add AG1 values
SET AG_H_value = b.TtlVal, AG_H_acres = b.TtlAcres
FROM #PACS_District_Levy_Table As a, (SELECT levy_cd, SUM(c.ag_val) As TTlVal, SUM(c.size_acres) As TtlAcres
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b,  #PACS_CurrentUse_Assessment As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.prop_id AND c.ag_use_cd = 'AG' AND c.land_class_code = 'AGH' AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd

SELECT * FROM #PACS_District_Levy_Table ORDER BY tax_district_priority, tax_district_desc
--SELECT * FROM #PACS_CurrentUse_Assessment WHERE ag_val <> 0 AND ag_use_cd = 'DFL' ORDER BY ag_use_cd

--SELECT prop_id, sum(ag_val) As Ttlag, sum(size_acres) As Ttlac
--FROM #PACS_CurrentUse_Assessment
--WHERE ag_val <> 0 AND ag_use_cd = 'DFL'
--GROUP BY prop_id

GRANT EXECUTE ON [dbo].[Jefferson_GetCurrentUseLandDetailAssessments] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetCurrentUseLandDetailAssessments] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetCurrentUseLandDetailAssessments] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetCurrentUseLandDetailAssessments] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

