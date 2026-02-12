
CREATE PROCEDURE [dbo].[Jefferson_AppraisalBookSheets]
  @AssessmentYear char(4),
  @PID varchar(1000), 
  @SchoolDist varchar(10),
  @FieldBook  int,
  @UseSup varchar(10)

AS
DECLARE
@AssessYear int,
@Prop_ID int,
@propxmlstring xml,
@geoidxmlstring xml


SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)
SET @Prop_ID = Len(@PID)
Set @propxmlstring = '<values><value>' + Replace(@PID,'.','</value><value>') + '</value></values>'
Set @geoidxmlstring = '<values><value>' + Replace(@PID,'.','</value><value>') + '</value></values>'

IF @Prop_ID = 1
BEGIN
SET @Prop_ID = 0
END

CREATE TABLE #PACS_Assessment_Roll
(
 PACSprop_id	  int,
 Parcel_Number	  varchar(12) null,
 Tax_Area_Number  varchar(23) null,
 Prop_Type_Code   varchar(5) null,
 Land_Use_Code	  varchar(10) null,
 Year_AV		  int null,
 Year_Tax		  int null,
 Sup_Num          int null,
 Sup_Description  varchar(100) null,
 Tax_Status       varchar(30) null,
 FMV_Building		numeric(14,0) null,
 FMV_Land_Homesite numeric(14,0) null,
 FMV_Land_Non_Homesite numeric(14,0) null,
 FMV_Land_OS_Tbr	numeric(14,0) null,
 FMV_Total_Value	numeric(14,0) null,
 CUV_Land_OS_Tbr	numeric(14,0) null,
 Frozen_Value	  numeric(14,0) null,
 Taxable_Value	  numeric(14,0) null,
 NewConstruction_Value numeric(14,0) null,
 Legal_Description varchar(255) null,
 Neighborhood	  varchar(10) null,
 Cycle            int null,
 School_Dist      varchar(10) null,
 Book_Page        varchar(10) null,
 Field_Book       numeric(14,0) null,
 Field_Page       numeric(14,0) null,
 Field_Page_Suffix varchar(3) null,
 Parcel_Acres	  numeric(14,4) null,
 Download_Date	  datetime,
 PACSowner_id	  int  null,
 File_As_Name     varchar(70) null,
 Addr_Line1       varchar(60) null,
 Addr_Line2       varchar(60) null,
 Addr_Line3       varchar(60) null,
 Addr_City        varchar(50) null,
 Addr_State       varchar(50) null,
 Addr_Zip         varchar(10) null,
 Situs_Address    varchar(200) null,
 Appraiser        varchar(10) null,
 Appraiser_Yr     int,
 Inactive_Date    datetime null,
 Neighborhood_Imps_pct	numeric(5,2) null,
 Neighborhood_Land_pct	numeric(5,2) null,
 Neighborhood_Comment varchar(500) null,
 Neighborhood_Appraiser_id int null,
 Neighborhood_Appraiser  varchar(10) null,
 Abstract_Code     varchar(10) null, 
 Abstract_Imps_pct	numeric(5,2) null,
 Abstract_Land_pct	numeric(5,2) null,
 Abstract_Description varchar(60) null,
 Property_Remarks varchar (3000) null,
 IsOSOS_Flag varchar(3) null, 
 Optional_Selection_Flag varchar(1) null  
)

IF @Prop_ID = 0
BEGIN
INSERT INTO #PACS_Assessment_Roll (PACSprop_id, Parcel_Number, Tax_Area_Number, Prop_Type_Code, Land_Use_Code, Year_AV, Year_Tax, Sup_Num, Sup_Description, Tax_Status, FMV_Building, FMV_Land_Homesite, FMV_Land_Non_Homesite, FMV_Land_OS_Tbr, FMV_Total_Value, CUV_Land_OS_Tbr, Frozen_Value, Taxable_Value, NewConstruction_Value, Legal_Description, Neighborhood, Cycle, Parcel_Acres, Download_Date, PACSowner_id, School_Dist, Book_Page, Field_Book, Field_Page, Field_Page_Suffix, Situs_Address, Appraiser, Abstract_Imps_pct, Abstract_Land_pct, Abstract_Description, Property_Remarks, IsOSOS_Flag, Optional_Selection_Flag)
SELECT prop_id, Left(IsNull(geo_id,''),12), '', prop_type_cd, '', @AssessYear, @AssessYear+ 1, 0, '', 'TX', 0, 0, 0, 0, 0, 0, 0, 0, 0, '', '', 0, 0, GetDate(), col_owner_id, '', '', 0, 0, '', '', '', 100, 100, '', IsNull(remarks,''), '', ''
FROM property WHERE prop_type_cd <> 'P'
END

IF @Prop_ID <> 0
BEGIN
INSERT INTO #PACS_Assessment_Roll (PACSprop_id, Parcel_Number, Tax_Area_Number, Prop_Type_Code, Land_Use_Code, Year_AV, Year_Tax, Sup_Num, Sup_Description, Tax_Status, FMV_Building, FMV_Land_Homesite, FMV_Land_Non_Homesite, FMV_Land_OS_Tbr, FMV_Total_Value, CUV_Land_OS_Tbr, Frozen_Value, Taxable_Value, NewConstruction_Value, Legal_Description, Neighborhood, Cycle, Parcel_Acres, Download_Date, PACSowner_id, School_Dist, Book_Page, Field_Book, Field_Page, Field_Page_Suffix, Situs_Address, Appraiser, Abstract_Imps_pct, Abstract_Land_pct, Abstract_Description, Property_Remarks, IsOSOS_Flag, Optional_Selection_Flag)
SELECT prop_id, Left(IsNull(geo_id,''),12), '', prop_type_cd, '', @AssessYear, @AssessYear+ 1, 0, '', 'TX', 0, 0, 0, 0, 0, 0, 0, 0, 0, '', '', 0, 0, GetDate(), col_owner_id, '', '', 0, 0, '', '', '', 100, 100, '', IsNull(remarks,''), '', ''
FROM property WHERE prop_type_cd <> 'P' AND Cast(prop_id As Varchar(12)) IN (
	SELECT t.v.query('.').value('.','VARCHAR(50)') FROM @propxmlstring.nodes('values/value') AS t(v))

INSERT INTO #PACS_Assessment_Roll (PACSprop_id, Parcel_Number, Tax_Area_Number, Prop_Type_Code, Land_Use_Code, Year_AV, Year_Tax, Sup_Num, Sup_Description, Tax_Status, FMV_Building, FMV_Land_Homesite, FMV_Land_Non_Homesite, FMV_Land_OS_Tbr, FMV_Total_Value, CUV_Land_OS_Tbr, Frozen_Value, Taxable_Value, NewConstruction_Value, Legal_Description, Neighborhood, Cycle, Parcel_Acres, Download_Date, PACSowner_id, School_Dist, Book_Page, Field_Book, Field_Page, Field_Page_Suffix, Situs_Address, Appraiser, Abstract_Imps_pct, Abstract_Land_pct, Abstract_Description, Property_Remarks, IsOSOS_Flag, Optional_Selection_Flag)
SELECT prop_id, Left(IsNull(geo_id,''),12), '', prop_type_cd, '', @AssessYear, @AssessYear+ 1, 0, '', 'TX', 0, 0, 0, 0, 0, 0, 0, 0, 0, '', '', 0, 0, GetDate(), col_owner_id, '', '', 0, 0, '', '', '', 100, 100, '', IsNull(remarks,''), '', ''
FROM property WHERE prop_type_cd <> 'P' AND geo_id IN  (
	SELECT t.v.query('.').value('.','VARCHAR(50)') FROM @geoidxmlstring.nodes('values/value') AS t(v))
END


UPDATE #PACS_Assessment_Roll SET Tax_Area_Number = c.tax_area_number, School_Dist = Substring(c.tax_area_description, 3,3)
FROM #PACS_Assessment_Roll As a, property_tax_area As b, tax_area As c
WHERE a.PACSprop_id = b.prop_id AND b.tax_area_id = c.tax_area_id AND a.Year_AV = b.[year]

UPDATE #PACS_Assessment_Roll SET School_Dist = 'SD20/402' WHERE Left(School_Dist,2) = '20'
UPDATE #PACS_Assessment_Roll SET School_Dist = 'SD46' WHERE Left(School_Dist,2) = '46'
UPDATE #PACS_Assessment_Roll SET School_Dist = 'SD48' WHERE Left(School_Dist,2) = '48'
UPDATE #PACS_Assessment_Roll SET School_Dist = 'SD49' WHERE Left(School_Dist,2) = '49'
UPDATE #PACS_Assessment_Roll SET School_Dist = 'SD50/323' WHERE Left(School_Dist,2) = '50'
UPDATE #PACS_Assessment_Roll SET School_Dist = 'SD50/323' WHERE School_Dist = '323'
UPDATE #PACS_Assessment_Roll SET School_Dist = 'SD20/402' WHERE School_Dist = '402'
UPDATE #PACS_Assessment_Roll SET School_Dist = '' WHERE Left(School_Dist,2) <> 'SD'
UPDATE #PACS_Assessment_Roll SET School_Dist = 'CITYofPT' WHERE Tax_Area_Number = '0100'

UPDATE #PACS_Assessment_Roll SET File_As_Name = b.file_as_name
FROM #PACS_Assessment_Roll As a, account As b
WHERE a.PACSowner_id = b.acct_id

UPDATE #PACS_Assessment_Roll SET Addr_Line1 = IsNull(c.addr_line1,''), Addr_Line2 = IsNull(c.addr_line2,''), Addr_Line3 = IsNull(c.addr_line3,''), Addr_City = IsNull(c.addr_city,''), Addr_State = IsNull(c.addr_state,''), Addr_Zip = IsNull(c.addr_zip,'')
FROM #PACS_Assessment_Roll As a, account As b, address As c
WHERE a.PACSowner_id = b.acct_id AND b.acct_id = c.acct_id AND c.primary_addr = 'Y'

UPDATE #PACS_Assessment_Roll SET Situs_Address = IsNull(b.situs_display,'')
FROM #PACS_Assessment_Roll As a, situs As b
WHERE a.PACSprop_id = b.prop_id AND b.primary_situs = 'Y'

UPDATE #PACS_Assessment_Roll SET Tax_Status = b.exmpt_type_cd
FROM #PACS_Assessment_Roll As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr

If @UseSup = 'YES'
BEGIN
UPDATE #PACS_Assessment_Roll SET Sup_Num = b.sup_num, Sup_Description = d.sup_group_desc
FROM #PACS_Assessment_Roll As a, prop_supp_assoc As b, supplement As c, sup_group As d
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.owner_tax_yr AND b.sup_num > 0
AND b.sup_num = c.sup_num AND b.owner_tax_yr = c.sup_tax_yr AND c.sup_group_id = d.sup_group_id
END

UPDATE #PACS_Assessment_Roll SET Land_Use_Code = IsNull(b.property_use_cd,''), Inactive_Date = b.prop_inactive_dt, FMV_Building = b.imprv_hstd_val + b.imprv_non_hstd_val, FMV_Land_Homesite = b.land_hstd_val, FMV_Land_Non_Homesite = b.land_non_hstd_val,  NewConstruction_Value = b.new_val_imprv_hs + b.new_val_imprv_nhs + b.new_val_land_hs + b.new_val_land_nhs, FMV_Land_OS_Tbr = b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, CUV_Land_OS_Tbr = b.ag_hs_use_val + b.timber_hs_use_val + b.ag_use_val + b.timber_use, Legal_Description = IsNull(legal_desc,''), Neighborhood = Isnull(hood_cd,''),  Parcel_Acres = IsNull(legal_acreage,0), Book_Page = b.book_page, Appraiser_Yr = b.last_appraisal_yr, Cycle = b.cycle, Sup_num = b.sup_num, Abstract_Code = IsNull(b.abs_subdv_cd,'')
FROM #PACS_Assessment_Roll As a, property_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr AND a.Sup_Num = b.sup_num

UPDATE #PACS_Assessment_Roll SET Appraiser = IsNull(c.appraiser_nm,'')
FROM #PACS_Assessment_Roll As a, property_val As b, appraiser As c
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr AND a.Sup_Num = b.sup_num AND b.next_appraiser_id = c.appraiser_id

UPDATE #PACS_Assessment_Roll SET Appraiser = IsNull(c.appraiser_nm,'')
FROM #PACS_Assessment_Roll As a, property_val As b, appraiser As c
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr AND b.last_appraiser_id = c.appraiser_id AND IsNull(a.Appraiser,'') = ''

UPDATE #PACS_Assessment_Roll SET FMV_Total_Value = FMV_Building + FMV_Land_Homesite + FMV_Land_Non_Homesite + FMV_Land_OS_Tbr

UPDATE #PACS_Assessment_Roll SET Field_Book = Cast(Left(Book_Page,3) As float) WHERE IsNumeric(Left(Book_Page,3)) = 1
UPDATE #PACS_Assessment_Roll SET Field_Page = Cast(Substring(Book_Page,5, 3) As float) WHERE IsNumeric(Substring(Book_Page,5, 3)) = 1
UPDATE #PACS_Assessment_Roll SET Field_Page_Suffix = Substring(Book_Page,8, 1) WHERE IsNull(Substring(Book_Page,8, 1), '') <> ''

IF @Prop_ID = 0
BEGIN
UPDATE #PACS_Assessment_Roll SET Tax_Status = 'DELETED' WHERE NOT Inactive_Date IS NULL
END

DELETE FROM #PACS_Assessment_Roll WHERE Tax_Status = 'DELETED' 

UPDATE #PACS_Assessment_Roll SET Taxable_Value = b.taxable_non_classified + b.taxable_classified, Frozen_Value = b.snr_frz_imprv_hs + b.snr_frz_land_hs
FROM #PACS_Assessment_Roll As a, wash_prop_owner_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.[year] AND a.Sup_Num = b.sup_num AND a.Tax_Status <> 'EX'

UPDATE #PACS_Assessment_Roll SET Frozen_Value = b.snr_frz_imprv_hs + b.snr_frz_land_hs
FROM #PACS_Assessment_Roll As a, wash_property_val As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr AND a.Sup_Num = b.sup_num AND a.Tax_Status <> 'EX'


--UPDATE #PACS_Assessment_Roll SET Taxable_Adjustment = 'Other Exempt' WHERE Taxable_Adjustment <> ''

UPDATE #PACS_Assessment_Roll SET Tax_Status = b.exmpt_subtype_cd
FROM #PACS_Assessment_Roll As a, dbo.property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.exmpt_tax_yr AND a.Sup_Num = b.sup_num AND IsNull(b.exmpt_subtype_cd,'') <> ''  AND b.exmpt_subtype_cd <> 'SNR'

UPDATE #PACS_Assessment_Roll SET Tax_Status = 'DFL'
FROM #PACS_Assessment_Roll
WHERE CUV_Land_OS_Tbr <> 0 AND Tax_Status = '' AND Land_Use_Code = '8800' 

UPDATE #PACS_Assessment_Roll SET Tax_Status = 'OS-AG'
FROM #PACS_Assessment_Roll
WHERE CUV_Land_OS_Tbr <> 0 AND Tax_Status = '' AND Land_Use_Code = '8300' 

UPDATE #PACS_Assessment_Roll SET Tax_Status = 'OS-TBR'
FROM #PACS_Assessment_Roll
WHERE CUV_Land_OS_Tbr <> 0 AND Tax_Status = '' AND Land_Use_Code = '9500' 

UPDATE #PACS_Assessment_Roll SET Tax_Status = 'OS-OS'
FROM #PACS_Assessment_Roll
WHERE CUV_Land_OS_Tbr <> 0 AND Tax_Status = '' AND Land_Use_Code = '9400' 

UPDATE #PACS_Assessment_Roll SET Tax_Status = 'EX'
FROM #PACS_Assessment_Roll
WHERE Tax_Status = 'MISC'

UPDATE #PACS_Assessment_Roll SET Frozen_Value = 0 WHERE Tax_Status <> 'SNR/DSBL'

UPDATE #PACS_Assessment_Roll SET Neighborhood_Imps_pct = b.hood_imprv_pct, Neighborhood_Land_pct = b.hood_land_pct, Neighborhood_Comment = IsNull(b.comments, ''),  Neighborhood_Appraiser_id = IsNull(appraiser_id, 5), Neighborhood_Appraiser = ''
FROM #PACS_Assessment_Roll As a, neighborhood As b
WHERE a.Neighborhood = b.hood_cd AND a.Year_AV = b.hood_yr

UPDATE #PACS_Assessment_Roll SET Neighborhood_Appraiser = IsNull(b.appraiser_nm,'')
FROM #PACS_Assessment_Roll As a, appraiser As b
WHERE a.Neighborhood_Appraiser_id = b.appraiser_id

UPDATE #PACS_Assessment_Roll SET Abstract_Imps_pct = b.abs_imprv_pct, Abstract_Land_pct = b.abs_land_pct, Abstract_Description = IsNull(b.abs_subdv_desc, ''), Neighborhood_Appraiser = Right(RTrim(IsNull(b.comments, '')),2)
FROM #PACS_Assessment_Roll As a, abs_subdv As b
WHERE a.Abstract_Code = b.abs_subdv_cd AND a.Year_AV = b.abs_subdv_yr
AND (a.Neighborhood = '1900' OR a.Neighborhood = '2900' OR a.Neighborhood = '3900' OR a.Neighborhood = '4900' OR a.Neighborhood = '5900' OR a.Neighborhood = '6900' OR b.abs_imprv_pct <> 100 OR b.abs_land_pct <> 100)

UPDATE #PACS_Assessment_Roll SET IsOSOS_Flag = 'Y-R'
FROM #PACS_Assessment_Roll As a, land_detail As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr AND a.Sup_Num = b.sup_num AND b.ag_use_cd = 'OSP'

UPDATE #PACS_Assessment_Roll SET IsOSOS_Flag = 'Y-U'
FROM #PACS_Assessment_Roll As a, land_detail As b
WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr AND a.Sup_Num = b.sup_num AND b.ag_use_cd = 'OSP' AND b.sub_use_cd = 'Unrated'

--UPDATE #PACS_Assessment_Roll SET Legal_Description = Replace(Legal_Description,',', ' '), Neighborhood = Replace(Neighborhood,',', ' ')
--UPDATE #PACS_Assessment_Roll SET Legal_Description = Replace(Replace(Legal_Description,char(10),''),char(13),' ')

DELETE FROM #PACS_Assessment_Roll  WHERE Tax_Area_Number = '' AND Land_Use_Code = '' AND Prop_Type_Code <> 'P' AND Taxable_Value = 0
DELETE FROM #PACS_Assessment_Roll  WHERE Legal_Description = '' AND Land_Use_Code = '' AND Prop_Type_Code = 'P' AND Taxable_Value = 0

-- Use Optional Selection Flag as customized for need.   Mark those with front foot calculations.
--UPDATE #PACS_Assessment_Roll SET Optional_Selection_Flag = 'Y'
--FROM #PACS_Assessment_Roll As a, land_detail As b
--WHERE a.PACSprop_id = b.prop_id AND a.Year_AV = b.prop_val_yr
----AND Right(b.land_type_cd, 1) = 'F'
--AND b.ag_use_cd = 'OSP'

-- Use Optional Selection Flag as customized for need.   Print Improvements Manual Adjustments.
--UPDATE #PACS_Assessment_Roll SET Optional_Selection_Flag = 'Y'
--FROM #PACS_Assessment_Roll As a, (SELECT DISTINCT b.prop_id As prop_id
--  FROM imprv_adj As a, imprv As b, prop_supp_assoc As c
--  WHERE (isnull(a.imprv_adj_pc,0) <> 0 OR a.imprv_adj_amt <> 0)
--  AND a.sale_id = 0 AND a.prop_val_yr = 2015
--  AND a.prop_id = b.prop_id AND a.prop_val_yr = b.prop_val_yr AND a.sup_num = b.sup_num
--  AND a.prop_id = c.prop_id AND a.prop_val_yr = c.owner_tax_yr AND a.sup_num = c.sup_num
--  AND a.sale_id = b.sale_id AND a.imprv_id = b.imprv_id
--  AND b.imprv_val <> 0) As b
--WHERE a.PACSprop_id = b.prop_id

-- Use Optional Selection Flag as customized for need.   Print West End.
--UPDATE #PACS_Assessment_Roll SET Optional_Selection_Flag = 'Y'
--FROM #PACS_Assessment_Roll As a, land_detail As b
--WHERE Neighborhood between '2700'AND '2899'

-- Use Optional Selection Flag as customized for need.   Print Neigborhood Range
--UPDATE #PACS_Assessment_Roll SET Optional_Selection_Flag = 'Y'
--FROM #PACS_Assessment_Roll As a, land_detail As b
--WHERE (Neighborhood between '2530'AND '2535') OR (Neighborhood between '2550'AND '2595')

-- Use Optional Selection Flag as customized for need.   Print Parcel Range
UPDATE #PACS_Assessment_Roll SET Optional_Selection_Flag = 'Y'
FROM #PACS_Assessment_Roll
--WHERE PACSprop_id BETWEEN 29477 AND 29504 --AND Sup_Num <> 0
WHERE Parcel_Number Like '96160%'

-- Use Optional Selection Flag as customized for need.   Print Parcels with certain Events
	--UPDATE #PACS_Assessment_Roll SET Optional_Selection_Flag = 'Y'
	--FROM #PACS_Assessment_Roll As a, prop_event_assoc As b, event As c
	--WHERE a.PACSprop_id = b.prop_id AND b.event_id = c.event_id AND c.event_type LIKE 'BOE_EQ%'

CREATE TABLE #PACS_Improvements_Roll
(
 IMPSprop_id		   int,
 IMPSsup_num           int null,
 IMPSYear_AV	       int null,
 IMPSimprv_id	       int null,
 IMPSImprv_Type_Code   varchar(5) null,
 IMPSImprv_Desc   	   varchar(200) null,
 IMPSImprv_Cmnt        varchar(1000) null,
 IMPSImprv_Val		   numeric(14,0) null,
 IMPSAdjusted_Val      numeric(14,0) null,
 IMPSFlat_Val          numeric(14,0) null,
 IMPSDistributed_Val   numeric(14,0) null,
 IMPSImprv_Val_Source  char(1) null,
 IMPSStories           varchar(5) null,
 IMPSActual_Year_Built numeric(4,0) null,
 IMPSimprv_det_id	   int null,
 IMPSimprv_det_type_cd  char(10) null,
 IMPSseq_num           int null,
 IMPSimprv_det_class_cd char(10) null,
 IMPSimprv_det_sub_class_cd char(10) null,
 IMPSnum_units         int null,
 IMPSunit_price        numeric(14,2) null,
 IMPSyr_built          numeric(4,0) null,
 IMPScondition_cd      char(5) null,
 IMPSdepreciation_yr   numeric(4,0) null,
 IMPSdep_pct           numeric(5,2) null,
 IMPSphysical_pct      numeric(5,2) null,
 IMPSfunctional_pct    numeric(5,2) null,
 IMPSeconomic_pct      numeric(5,2) null,
 IMPScomplete_pct      numeric(5,2) null,
 IMPSimprv_det_val     numeric(18,0) null,
 IMPSimprv_det_desc    varchar(100) null,
 IMPSimprv_det_area    numeric(18,1) null,
 IMPSimprv_det_adj_factor  numeric(8,6) null,
 IMPSimprv_det_mkt_factor  numeric(8,6) null
  )

  
 INSERT INTO #PACS_Improvements_Roll 
  (IMPSprop_id, IMPSsup_num, IMPSYear_AV, IMPSimprv_id, IMPSImprv_Type_Code, IMPSImprv_Desc, IMPSImprv_Cmnt, IMPSImprv_Val, IMPSAdjusted_Val, IMPSFlat_Val, IMPSDistributed_Val, IMPSImprv_Val_Source, IMPSStories, IMPSActual_Year_Built,
  IMPSimprv_det_id, IMPSimprv_det_type_cd, IMPSseq_num, IMPSimprv_det_class_cd, IMPSimprv_det_sub_class_cd, IMPSnum_units, IMPSunit_price, IMPSyr_built, IMPScondition_cd, IMPSdepreciation_yr, IMPSdep_pct, IMPSphysical_pct, IMPSfunctional_pct, IMPSeconomic_pct, IMPScomplete_pct, IMPSimprv_det_val, IMPSimprv_det_desc, IMPSimprv_det_area, IMPSimprv_det_adj_factor, IMPSimprv_det_mkt_factor)
SELECT a.prop_id, a.sup_num, a.prop_val_yr, a.imprv_id, a.imprv_type_cd, a.imprv_desc, a.imprv_cmnt, a.imprv_val, a.adjusted_val, a.flat_Val, a.dist_val, a.imprv_val_source, a.stories, a.actual_year_built,
  IsNull(c.imprv_det_id,0), IsNull(c.imprv_det_type_cd,''), 0, IsNull(c.imprv_det_class_cd,''), IsNull(c.imprv_det_sub_class_cd,''), IsNull(c.num_units,1), IsNull(c.unit_price,0), IsNull(c.yr_built,0), IsNull(c.condition_cd,''), IsNull(c.depreciation_yr,0), IsNull(c.dep_pct,0), IsNull(c.physical_pct,0), IsNull(c.functional_pct,0), IsNull(c.economic_pct,0), IsNull(c.percent_complete,0), IsNull(c.imprv_det_val,0), IsNull(c.imprv_det_desc,''), IsNull(c.imprv_det_area,0), IsNull(c.imprv_det_adj_factor,0), IsNull(a.imprv_mass_adj_factor,0)
FROM imprv As a 
JOIN prop_supp_assoc As b
ON  a.prop_id = b.prop_id AND a.prop_val_yr = b.owner_tax_yr AND a.sup_num = b.sup_num
LEFT OUTER JOIN imprv_detail As c
ON a.prop_id = c.prop_id AND a.imprv_id = c.imprv_id AND a.prop_val_yr = c.prop_val_yr
AND a.sup_num = c.sup_num AND a.sale_id = c.sale_id
WHERE a.prop_val_yr = @AssessYear AND a.sale_id = 0

UPDATE #PACS_Improvements_Roll SET IMPSseq_num = b.seq_num
FROM #PACS_Improvements_Roll As a, _jeff_Imprv_Det_Type As b
WHERE a.IMPSimprv_det_type_cd = b.imprv_det_type_cd

UPDATE #PACS_Improvements_Roll SET IMPSimprv_det_desc = b.imprv_det_type_desc
FROM #PACS_Improvements_Roll As a, _jeff_Imprv_Det_Type As b
WHERE a.IMPSimprv_det_type_cd = b.imprv_det_type_cd AND a.IMPSimprv_det_desc = ''

UPDATE #PACS_Improvements_Roll SET IMPSImprv_Val_Source = 'D', IMPSImprv_Val = IMPSDistributed_Val WHERE IMPSDistributed_Val > 0

IF @Prop_ID = 0 AND @FieldBook = 0 AND @SchoolDist <> 'ALL'
BEGIN
SELECT a.*, b.*
FROM #PACS_Assessment_Roll As a
LEFT OUTER JOIN #PACS_Improvements_Roll As b
ON a.PACSprop_id = b.IMPSprop_id AND a.Sup_Num = b.IMPSsup_num
WHERE a.School_Dist = @SchoolDist
ORDER BY Field_Book, Field_Page, IMPSseq_num
END

IF @Prop_ID = 0 AND @FieldBook = 0 AND @SchoolDist = 'ALL'
BEGIN
SELECT a.*, b.*
FROM #PACS_Assessment_Roll As a
LEFT OUTER JOIN #PACS_Improvements_Roll As b
ON a.PACSprop_id = b.IMPSprop_id AND a.Sup_Num = b.IMPSsup_num
ORDER BY Field_Book, Field_Page, IMPSseq_num
END

IF @Prop_ID = 0 AND @FieldBook <> 0
BEGIN
SELECT a.*, b.*
FROM #PACS_Assessment_Roll As a
LEFT OUTER JOIN #PACS_Improvements_Roll As b
ON a.PACSprop_id = b.IMPSprop_id AND a.Sup_Num = b.IMPSsup_num
WHERE a.School_Dist = @SchoolDist AND a.Field_Book = @FieldBook
ORDER BY Field_Book, Field_Page, IMPSseq_num
END

IF @Prop_ID <> 0
BEGIN
SELECT a.*, b.*
FROM #PACS_Assessment_Roll As a
LEFT OUTER JOIN #PACS_Improvements_Roll As b
ON a.PACSprop_id = b.IMPSprop_id AND a.Sup_Num = b.IMPSsup_num
ORDER BY a.Parcel_Number, IMPSseq_num
END

Select @Prop_ID

GRANT EXECUTE ON [dbo].[Jefferson_AppraisalBookSheets] TO [COUNTY\Assesor's Office]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_AppraisalBookSheets] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

