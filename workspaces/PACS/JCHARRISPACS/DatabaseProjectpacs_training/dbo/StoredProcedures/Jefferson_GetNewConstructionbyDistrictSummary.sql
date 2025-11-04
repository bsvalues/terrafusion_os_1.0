
CREATE PROCEDURE [dbo].[Jefferson_GetNewConstructionbyDistrictSummary]
  @AssessmentYear char(4)
 
AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..#PACS_NewConstruction_Value') is not null
BEGIN
    DROP TABLE #PACS_NewConstruction_Value
END

CREATE TABLE #PACS_NewConstruction_Value
(
Year_AV		  int null,
Cycle            int null,
Neighborhood	  varchar(10) null,
Neighborhood_Desc varchar(100) null,
PACSprop_id	  int,
Parcel_Number	  varchar(12) null,
Legal_Description varchar(255) null,
Tax_Area_Number  varchar(23) null,
School_Dist      varchar(10) null,
Book_Page        varchar(10) null,
Field_Book       numeric(14,0) null,
Field_Page       numeric(14,0) null,
NewConstruction_Imps numeric(14,0) null,
NewConstruction_Land numeric(14,0) null,
NewConstruction_Value numeric(14,0) null
)

INSERT INTO #PACS_NewConstruction_Value (Year_AV, Cycle, Neighborhood, Neighborhood_Desc, PACSprop_id, Parcel_Number, Legal_Description, Tax_Area_Number, School_Dist, Book_Page, Field_Book, Field_Page, NewConstruction_Imps, NewConstruction_Land, NewConstruction_Value)
SELECT @AssessYear, cycle, IsNull(hood_cd, ''), '', prop_id, '', IsNull(legal_desc,''), '',  '', book_page, 0, 0, new_val_imprv_hs + new_val_imprv_nhs As NCimps, new_val_land_hs + new_val_land_nhs As NCland, new_val_imprv_hs + new_val_imprv_nhs + new_val_land_hs + new_val_land_nhs As NCtotal
  FROM property_val
  WHERE prop_val_yr = @AssessYear AND new_val_imprv_hs + new_val_imprv_nhs + new_val_land_hs + new_val_land_nhs <> 0
  AND sup_num = 0 AND IsNull(prop_inactive_dt, '1/1/1900') = '1/1/1900'

-- Optional Update script
UPDATE #PACS_NewConstruction_Value SET NewConstruction_Value = new_val_hs + new_val_nhs
FROM #PACS_NewConstruction_Value As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.year AND b.sup_num = 0

UPDATE #PACS_NewConstruction_Value SET Parcel_Number = Left(IsNull(geo_id,''),12) 
FROM #PACS_NewConstruction_Value As a, property As b
WHERE a.PACSprop_id = b.prop_id

UPDATE #PACS_NewConstruction_Value SET Neighborhood_Desc = b.hood_name
FROM #PACS_NewConstruction_Value As a, neighborhood As b
WHERE a.Neighborhood = b.hood_cd AND a.Year_AV =  b.hood_yr

UPDATE #PACS_NewConstruction_Value SET Tax_Area_Number = c.tax_area_number, School_Dist = Substring(c.tax_area_description, 3,3)
FROM #PACS_NewConstruction_Value As a, property_tax_area As b, tax_area As c
WHERE a.PACSprop_id = b.prop_id AND b.tax_area_id = c.tax_area_id AND a.Year_AV = b.[year]

UPDATE #PACS_NewConstruction_Value SET School_Dist = 'SD20' WHERE Left(School_Dist,2) = '20'
UPDATE #PACS_NewConstruction_Value SET School_Dist = 'SD46' WHERE Left(School_Dist,2) = '46'
UPDATE #PACS_NewConstruction_Value SET School_Dist = 'SD48' WHERE Left(School_Dist,2) = '48'
UPDATE #PACS_NewConstruction_Value SET School_Dist = 'SD49' WHERE Left(School_Dist,2) = '49'
UPDATE #PACS_NewConstruction_Value SET School_Dist = 'SD50' WHERE Left(School_Dist,2) = '50'
UPDATE #PACS_NewConstruction_Value SET School_Dist = 'SD323' WHERE School_Dist = '323'
UPDATE #PACS_NewConstruction_Value SET School_Dist = 'SD402' WHERE School_Dist = '402'
UPDATE #PACS_NewConstruction_Value SET School_Dist = '' WHERE Left(School_Dist,2) <> 'SD'
UPDATE #PACS_NewConstruction_Value SET School_Dist = 'CITYofPT' WHERE Tax_Area_Number = '0100'

UPDATE #PACS_NewConstruction_Value SET Field_Book = Cast(Left(Book_Page,3) As float) WHERE IsNumeric(Left(Book_Page,3)) = 1
UPDATE #PACS_NewConstruction_Value SET Field_Page = Cast(Right(Book_Page,3) As float) WHERE IsNumeric(Right(Book_Page,3)) = 1

-- Build Tax District Distribution Table
IF object_id('TEMPDB..#PACS_District_NC_Table') is not null
BEGIN
    DROP TABLE [#PACS_District_NC_Table]
END
CREATE TABLE #PACS_District_NC_Table
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
levy_rate                   numeric(13,10) null,
newconstruction_imps		numeric(14,2) null,
newconstruction_land		numeric(14,2) null,
newconstruction_total		numeric(14,2) null
)

INSERT INTO #PACS_District_NC_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, levy_rate, newconstruction_imps, newconstruction_land, newconstruction_total)
SELECT a.priority, a.tax_district_type_cd, a.tax_district_desc, b.tax_district_cd, b.tax_district_desc, b.tax_district_id, c.year, c.levy_cd, c.levy_description, levy_rate, 0, 0, 0
FROM tax_district_type As a, tax_district As b, levy As c
WHERE a.tax_district_type_cd = b.tax_district_type_cd AND b.tax_district_id = c.tax_district_id AND c.year = @AssessYear AND IsNull(c.end_year, 2999) > @AssessYear
-- Include Flood Zones
INSERT INTO #PACS_District_NC_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, levy_rate, newconstruction_imps, newconstruction_land, newconstruction_total)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z1', 'FLOOD ZONE #1', 100000, @AssessYear, 'FZ1', 'FLOOD ZONE #1 (no levy)', 0, 0, 0, 0)
INSERT INTO #PACS_District_NC_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, levy_rate, newconstruction_imps, newconstruction_land, newconstruction_total)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z2', 'FLOOD ZONE #2', 100001, @AssessYear, 'FZ2', 'FLOOD ZONE #2 (no levy)', 0, 0, 0, 0)
INSERT INTO #PACS_District_NC_Table (tax_district_priority, tax_district_type_cd, tax_district_type_desc, tax_district_cd, tax_district_desc, tax_district_id, levy_year, levy_cd, levy_description, levy_rate, newconstruction_imps, newconstruction_land, newconstruction_total)
VALUES(15,'FZ', 'FLOOD ZONE', 'Z3', 'FLOOD ZONE #3', 100002, @AssessYear, 'FZ3', 'FLOOD ZONE #3 (no levy)', 0, 0, 0, 0)

UPDATE #PACS_District_NC_Table SET tax_district_type_desc = 'FIRE DISTRICT' WHERE tax_district_type_cd = 'FD'  OR tax_district_type_cd = 'FD-P'

--Change Priorities for reports
UPDATE #PACS_District_NC_Table SET tax_district_priority = 0 WHERE tax_district_type_cd = 'ST' --State Schools
UPDATE #PACS_District_NC_Table SET tax_district_priority = 1 WHERE tax_district_type_cd = 'CO' --County
UPDATE #PACS_District_NC_Table SET tax_district_priority = 2 WHERE tax_district_type_cd = 'CF' --Conservation Futures
UPDATE #PACS_District_NC_Table SET tax_district_priority = 3 WHERE tax_district_type_cd = 'RO' --Roads
UPDATE #PACS_District_NC_Table SET tax_district_priority = 4 WHERE tax_district_type_cd = 'CI' OR tax_district_type_cd = 'CITY' --City Of PT
UPDATE #PACS_District_NC_Table SET tax_district_priority = 5 WHERE tax_district_type_cd = 'CE' OR tax_district_type_cd = 'CEM' --Cemetery
UPDATE #PACS_District_NC_Table SET tax_district_priority = 6 WHERE tax_district_type_cd = 'FI' OR tax_district_type_cd = 'FD'  OR tax_district_type_cd = 'FD-P' --Fire
UPDATE #PACS_District_NC_Table SET tax_district_priority = 7 WHERE tax_district_type_cd = 'EMS' --EMS
UPDATE #PACS_District_NC_Table SET tax_district_priority = 8 WHERE tax_district_type_cd = 'HOSP' --Hospital
UPDATE #PACS_District_NC_Table SET tax_district_priority = 9 WHERE tax_district_type_cd = 'LI' OR tax_district_type_cd = 'LIB' --Library
UPDATE #PACS_District_NC_Table SET tax_district_priority = 10 WHERE tax_district_type_cd = 'PO' OR tax_district_type_cd = 'PORT' --Port
UPDATE #PACS_District_NC_Table SET tax_district_priority = 11, tax_district_type_desc = 'PUD' WHERE tax_district_cd = 'PUD1'  OR tax_district_type_cd = 'PUD' --PUD
UPDATE #PACS_District_NC_Table SET tax_district_priority = 12 WHERE tax_district_type_cd = 'SD' --Schools
UPDATE #PACS_District_NC_Table SET tax_district_priority = 13 WHERE tax_district_type_cd = 'FZ' --Flood Zones

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

UPDATE #PACS_District_NC_Table  --Add New Construction
SET newconstruction_imps = NC_Imps, newconstruction_land = NC_Land, newconstruction_total = b.NC_Total 
FROM #PACS_District_NC_Table As a,
(SELECT levy_cd, SUM(NewConstruction_Imps) As NC_Imps, SUM(NewConstruction_Land) As NC_Land, SUM(NewConstruction_Value) As NC_Total
FROM #PACS_Levy_TaxArea_Table As a, property_tax_area As b, #PACS_NewConstruction_Value As c
WHERE a.tax_area_id = b.tax_area_id AND b.year = @AssessYear AND b.prop_id = c.PACSprop_id AND b.sup_num = 0
GROUP BY levy_cd) As b WHERE a.levy_cd = b.levy_cd


SELECT * FROM #PACS_District_NC_Table ORDER BY tax_district_priority, tax_district_desc
--SELECT * FROM ##PACS_NewConstruction_Value ORDER BY Cycle, Neighborhood

GRANT EXECUTE ON [dbo].Jefferson_GetNewConstructionbyDistrictSummary TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].Jefferson_GetNewConstructionbyDistrictSummary TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNewConstructionbyDistrictSummary] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNewConstructionbyDistrictSummary] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

