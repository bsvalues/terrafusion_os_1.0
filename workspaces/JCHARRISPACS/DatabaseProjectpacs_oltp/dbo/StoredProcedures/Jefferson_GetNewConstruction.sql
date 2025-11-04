
CREATE PROCEDURE [dbo].[Jefferson_GetNewConstruction]
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
Inspection_Date	datetime null,
Appraiser        varchar(10) null,
Last_Appraiser_id int null,
Last_Appraiser    varchar(10) null,
Last_Appraisal_Date    datetime null,
NCCode_Flag       char(1) null,
Last_Appr_Event_PACSuser varchar(30) null,
Last_Appr_Event_Desc varchar(2048) null,
Last_Appr_Event_Date datetime null
)

INSERT INTO #PACS_NewConstruction_Value (Year_AV, Cycle, Neighborhood, Neighborhood_Desc, PACSprop_id, Parcel_Number, Legal_Description, Tax_Area_Number, School_Dist, Book_Page, Field_Book, Field_Page, NewConstruction_Imps, NewConstruction_Land, Inspection_Date, Appraiser, Last_Appraiser_id, Last_Appraisal_Date, NCCode_Flag, Last_Appr_Event_PACSuser, Last_Appr_Event_Desc)
SELECT @AssessYear, a.cycle, IsNull(a.hood_cd, ''), '', a.prop_id, '', IsNull(a.legal_desc,''), '',  '', a.book_page, 0, 0, a.new_val_imprv_hs + a.new_val_imprv_nhs As new_construct_imps, a.new_val_land_hs + a.new_val_land_nhs As new_construct_land, a.next_appraisal_dt, b.appraiser_nm, a.last_appraiser_id, a.last_appraisal_dt, 'N', '', ''
  FROM property_val As a, appraiser As b
  WHERE a.prop_val_yr = @AssessYear AND a.new_val_imprv_hs + a.new_val_imprv_nhs + a.new_val_land_hs + a.new_val_land_nhs > 0
  AND IsNull(a.next_appraiser_id,10) = b.appraiser_id

UPDATE #PACS_NewConstruction_Value SET NCCode_Flag = 'Y' FROM #PACS_NewConstruction_Value As a, prop_group_assoc As b WHERE a.PACSprop_id = b.prop_id AND b.prop_group_cd = 'NC2014'

INSERT INTO #PACS_NewConstruction_Value (Year_AV, Cycle, Neighborhood, Neighborhood_Desc, PACSprop_id, Parcel_Number, Legal_Description, Tax_Area_Number, School_Dist, Book_Page, Field_Book, Field_Page, NewConstruction_Imps, NewConstruction_Land, Inspection_Date, Appraiser, Last_Appraiser_id, Last_Appraisal_Date, NCCode_Flag, Last_Appr_Event_PACSuser, Last_Appr_Event_Desc)
SELECT @AssessYear, a.cycle, IsNull(a.hood_cd, ''), '', a.prop_id, '', IsNull(a.legal_desc,''), '',  '', a.book_page, 0, 0, 0, 0, a.next_appraisal_dt, b.appraiser_nm, a.last_appraiser_id, last_appraisal_dt,  'Y', '', ''
  FROM property_val As a, appraiser As b, prop_group_assoc As c
  WHERE a.prop_val_yr = 2014 AND a.new_val_imprv_hs + a.new_val_imprv_nhs + a.new_val_land_hs + a.new_val_land_nhs = 0
  AND IsNull(a.next_appraiser_id,10) = b.appraiser_id AND a.prop_id = c.prop_id AND c.prop_group_cd = 'NC2014'

UPDATE #PACS_NewConstruction_Value SET Parcel_Number = Left(IsNull(geo_id,''),12) 
FROM #PACS_NewConstruction_Value As a, property As b
WHERE a.PACSprop_id = b.prop_id

UPDATE #PACS_NewConstruction_Value SET Last_Appraiser = b.appraiser_nm
FROM #PACS_NewConstruction_Value As a, appraiser As b
WHERE a.Last_Appraiser_id = b.appraiser_id

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

UPDATE #PACS_NewConstruction_Value SET Last_Appr_Event_PACSuser = c.pacs_user, Last_Appr_Event_Desc = c.event_desc, Last_Appr_Event_Date = c.event_date
FROM #PACS_NewConstruction_Value As a, prop_event_assoc As b, event As c
WHERE a.PACSprop_id = b.prop_id AND b.event_id = c.event_id AND c.event_type = 'APPR_NOTE'

SELECT * FROM #PACS_NewConstruction_Value ORDER BY Cycle, Neighborhood

GRANT EXECUTE ON [dbo].[Jefferson_GetNewConstruction] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetNewConstruction] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNewConstruction] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetNewConstruction] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

