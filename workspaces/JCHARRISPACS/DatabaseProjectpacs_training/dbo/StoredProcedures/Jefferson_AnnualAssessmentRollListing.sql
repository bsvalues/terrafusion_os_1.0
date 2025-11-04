
CREATE PROCEDURE [dbo].[Jefferson_AnnualAssessmentRollListing]
  @AssessYear int
AS

SET NOCOUNT ON

CREATE TABLE #PACS_Assessment_Roll
(
 [PACSprop_id]		int,
 [Parcel_Number]	varchar(12) null,
 [Tax_Area_Number]	varchar(23) null,
 [Prop_Type_Code]	varchar(5) null,
 [Land_Use_Code]	varchar(10) null,
 [Year_AV]			int null,
 [Year_Tax]			int null,
 [Taxable_Adjustment] varchar(30) null,
 [FMV_Building]		numeric(14,0) null,
 [FMV_Land_NonOS_Tbr] numeric(14,0) null,
 [FMV_Land_OS_Tbr]	numeric(14,0) null,
 [CUV_Land_OS_Tbr]	numeric(14,0) null,
 [Taxable_Value]	numeric(14,0) null,
 [Legal_Description] varchar(255) null,
 [Site_Address]     varchar(255) null,
 [Neighborhood]		varchar(255) null,
 [Parcel_Acres]		numeric(14,4) null,
 [Download_Date]	datetime,
 [PACSowner_id]		int  null
)

INSERT INTO #PACS_Assessment_Roll (PACSprop_id, Parcel_Number, Tax_Area_Number, Prop_Type_Code, Land_Use_Code, Year_AV, Year_Tax, Taxable_Adjustment, FMV_Building, FMV_Land_NonOS_Tbr, FMV_Land_OS_Tbr, CUV_Land_OS_Tbr, Taxable_Value, Legal_Description, Neighborhood, Site_Address, Parcel_Acres, Download_Date, PACSowner_id)
SELECT prop_id, Left(IsNull(geo_id,''),12), '', prop_type_cd, '', @AssessYear, @AssessYear+ 1, '', 0, 0, 0, 0, 0, '', '', '', 0, GetDate(), col_owner_id
FROM property

UPDATE #PACS_Assessment_Roll SET Tax_Area_Number = c.tax_area_number
FROM #PACS_Assessment_Roll As a, property_tax_area As b, tax_area As c
WHERE a.PACSprop_id = b.prop_id AND b.tax_area_id = c.tax_area_id AND a.Year_AV = b.[year]

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = b.exmpt_type_cd
FROM #PACS_Assessment_Roll As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr

UPDATE #PACS_Assessment_Roll SET Site_Address = IsNull(b.situs_display,'')
FROM #PACS_Assessment_Roll As a, situs As b
WHERE a.PACSprop_id = b.prop_id AND b.primary_situs = 'Y'

UPDATE #PACS_Assessment_Roll SET Land_Use_Code = IsNull(b.property_use_cd,''), FMV_Building = b.imprv_hstd_val + b.imprv_non_hstd_val, FMV_Land_NonOS_Tbr = b.land_hstd_val + b.land_non_hstd_val,  FMV_Land_OS_Tbr = b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, CUV_Land_OS_Tbr = b.ag_hs_use_val + b.timber_hs_use_val + b.ag_use_val + b.timber_use, Legal_Description = IsNull(legal_desc,''), Neighborhood = Isnull(hood_cd,''),  Parcel_Acres = IsNull(legal_acreage,0)
FROM #PACS_Assessment_Roll As a, property_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'DELETED'
FROM #PACS_Assessment_Roll As a, property_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr AND NOT b.prop_inactive_dt IS NULL

DELETE FROM #PACS_Assessment_Roll WHERE Taxable_Adjustment = 'DELETED'

UPDATE #PACS_Assessment_Roll SET Taxable_Value = b.taxable_non_classified + b.taxable_classified
FROM #PACS_Assessment_Roll As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND a.Taxable_Adjustment <> 'EX'

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'OTHER EXEMPT' WHERE Taxable_Adjustment <> ''

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = b.exmpt_subtype_cd
FROM #PACS_Assessment_Roll As a, dbo.property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND IsNull(b.exmpt_subtype_cd,'') <> ''  AND b.exmpt_subtype_cd <> 'SNR'

--CORRECT LAND USE CODES (ONE YEAR ONLY)
UPDATE #PACS_Assessment_Roll SET Land_Use_Code = '8300' WHERE Parcel_Number = '901314010'
UPDATE #PACS_Assessment_Roll SET Land_Use_Code = '8110' WHERE Parcel_Number = '959000002'

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'DESG TBR'
FROM #PACS_Assessment_Roll
WHERE CUV_Land_OS_Tbr <> 0 AND Taxable_Adjustment = '' AND Land_Use_Code = '8300' 

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'OS-AG'
FROM #PACS_Assessment_Roll
WHERE CUV_Land_OS_Tbr <> 0 AND Taxable_Adjustment = '' AND Land_Use_Code = '8100' 

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'OS-TBR'
FROM #PACS_Assessment_Roll
WHERE CUV_Land_OS_Tbr <> 0 AND Taxable_Adjustment = '' AND Land_Use_Code = '8110' 

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'OS-OS'
FROM #PACS_Assessment_Roll
WHERE CUV_Land_OS_Tbr <> 0 AND Taxable_Adjustment = '' AND Land_Use_Code = '8120' 

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'VALUE IN OTHER PARCELS'
FROM #PACS_Assessment_Roll
WHERE Taxable_Adjustment = 'OTHER EXEMPT' AND (Land_Use_Code = '7600' OR Land_Use_Code = '7630')

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'UTILITIES'
FROM #PACS_Assessment_Roll
WHERE Taxable_Adjustment = 'OTHER EXEMPT' AND (Land_Use_Code = '4800' OR Land_Use_Code = '4805'  OR Land_Use_Code = '4711')

UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'TL/SHORELANDS'
FROM #PACS_Assessment_Roll
WHERE Taxable_Adjustment = 'OTHER EXEMPT' AND (Land_Use_Code = '9300' OR Land_Use_Code = '9390')

UPDATE #PACS_Assessment_Roll SET Legal_Description = Replace(Legal_Description,',', ' '), Neighborhood = Replace(Neighborhood,',', ' '), Site_Address = Replace(Site_Address,',', ' ')
UPDATE #PACS_Assessment_Roll SET Legal_Description = Replace(Replace(Legal_Description,char(10),''),char(13),' ')
UPDATE #PACS_Assessment_Roll SET Site_Address = Replace(Replace(Site_Address,char(10),''),char(13),' ')

DELETE FROM #PACS_Assessment_Roll  WHERE Tax_Area_Number = '' AND Land_Use_Code = '' AND Prop_Type_Code <> 'P' AND Taxable_Value = 0
DELETE FROM #PACS_Assessment_Roll  WHERE Legal_Description = '' AND Land_Use_Code = '' AND Prop_Type_Code = 'P' AND Taxable_Value = 0

SELECT * FROM #PACS_Assessment_Roll ORDER BY Prop_Type_Code, Parcel_Number

GRANT EXECUTE ON [dbo].[Jefferson_AnnualAssessmentRollListing] TO [COUNTY\Assesor's Office]

GO

