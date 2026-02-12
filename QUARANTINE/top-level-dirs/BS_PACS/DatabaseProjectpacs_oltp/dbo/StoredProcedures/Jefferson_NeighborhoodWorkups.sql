
CREATE PROCEDURE [dbo].[Jefferson_NeighborhoodWorkups]
  @Neigborhood		    varchar(20),
  @AssessmentYear       char(4)

AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)

IF object_id('TEMPDB..#PACS_HoodAuditList') is not null
BEGIN
    DROP TABLE [#PACS_HoodAuditList]
END

CREATE TABLE #PACS_HoodAuditList
(
Neighborhood_Code       varchar(10) null,
Neighborhood_Desc  		varchar(100) null,
PACSyear_av     int null,
Prop_ID			int null,
Parcel			varchar(12) null,
[Owner]			varchar(70),
Legal_Description	varchar(255) null,
Situs_Address    varchar(200) null,
Parcel_Acres		numeric(14,4) null,
Land_Use_Code    varchar(10) null,
Book_Page        varchar(10) null,
Field_Book       numeric(14,0) null,
Field_Page       numeric(14,0) null,
FMV_Building		numeric(14,0) null,
FMV_Land         	numeric(14,0) null,
FMV_Total_AV	    numeric(14,0) null,
Assessed_Value      numeric(14,0) null,
REET				int null,
Deed				varchar(10) null,
Recorded			datetime null,
Grantor				varchar(70) null,
Grantee				varchar(70) null,
Ratio_Code          varchar(5) null,
Ratio_Code_Desc     varchar(100) null,
Comment             varchar(500) null,
Sales_Price			numeric(14,0) null,
PACSchg_of_owner_id int,
Multiple_Parcels    char(1) null,
New_Construction_Flag char(1) null
)

INSERT INTO #PACS_HoodAuditList (Neighborhood_Code, Neighborhood_Desc, PACSyear_av, Prop_ID, Parcel, [Owner], Legal_Description, Situs_Address, Parcel_Acres, Land_Use_Code, Book_Page, Field_Book, Field_Page, FMV_Building, FMV_Land, FMV_Total_AV, Assessed_Value, REET, Deed, Grantor, Grantee, Ratio_Code, Ratio_Code_Desc, Comment, Sales_Price, PACSchg_of_owner_id, Multiple_Parcels, New_Construction_Flag)
SELECT a.hood_cd, a.hood_name, @AssessYear, b.prop_id, c.geo_id, '', IsNull(b.legal_desc,''),'', IsNull(b.legal_acreage,0), IsNull(b.property_use_cd,''),  b.book_page, 0, 0, b.imprv_hstd_val + b.imprv_non_hstd_val, b.land_hstd_val + b.land_non_hstd_val + b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, 0, b.assessed_val, 0, '', '', '', '', '', '', 0, 0, '', ''
FROM neighborhood As a, property_val As b, property As c
WHERE a.hood_cd = b.hood_cd AND a.hood_yr = b.prop_val_yr AND b.prop_val_yr = @AssessYear AND b.sup_num = 0
AND b.prop_id = c.prop_id AND IsNull(b.prop_inactive_dt, '1/1/1900') = '1/1/1900'
AND a.hood_cd = @Neigborhood

UPDATE #PACS_HoodAuditList SET REET = IsNull(c.excise_number,0), Deed = c.deed_type_cd, Recorded = c.recorded_dt, Grantor = IsNull(c.grantor_cv,''), Grantee = isNull(c.grantee_cv,''), Ratio_Code = IsNull(d.sl_ratio_type_cd,''), Ratio_Code_Desc =  IsNull(d.sl_ratio_cd_reason,''), Sales_Price =  IsNull(d.sl_price,0), PACSchg_of_owner_id = c.chg_of_owner_id, Multiple_Parcels = 'N'
FROM #PACS_HoodAuditList As a, chg_of_owner_prop_assoc As b,chg_of_owner As c, sale As d
WHERE a.Prop_ID = b.prop_id AND b.chg_of_owner_id = c.chg_of_owner_id AND c.chg_of_owner_id = d.chg_of_owner_id AND b.seq_num = 0
AND (d.sl_ratio_type_cd = '00' OR d.sl_ratio_type_cd = '30')
AND c.recorded_dt between '1/1/' + Cast(@AssessYear - 2 As char(4)) and  '12/31/' + @AssessmentYear

UPDATE #PACS_HoodAuditList SET [Owner] = c.file_as_name
FROM #PACS_HoodAuditList As a, owner As b, account As c
WHERE a.Prop_ID = b.prop_id AND a.PACSyear_av = b.owner_tax_yr AND b.owner_id = c.acct_id

UPDATE #PACS_HoodAuditList SET FMV_Total_AV = FMV_Building + FMV_Land

UPDATE #PACS_HoodAuditList SET Situs_Address = IsNull(b.situs_display,'')
FROM #PACS_HoodAuditList As a, situs As b
WHERE a.Prop_ID = b.prop_id AND b.primary_situs = 'Y'

UPDATE #PACS_HoodAuditList SET Comment = IsNull(b.comment,'')
FROM #PACS_HoodAuditList As a, chg_of_owner_vw As b
WHERE a.Prop_ID = b.prop_id AND a.PACSchg_of_owner_id = b.chg_of_owner_id

UPDATE #PACS_HoodAuditList SET Ratio_Code_Desc = sl_ratio_desc
FROM #PACS_HoodAuditList As a, sale_ratio_type As b
WHERE a.Ratio_Code = b.sl_ratio_type_cd AND a.Ratio_Code_Desc = ''

UPDATE #PACS_HoodAuditList SET Grantor = c.file_as_name
FROM #PACS_HoodAuditList As a, seller_assoc As b, account As c
WHERE a.PACSchg_of_owner_id = b.chg_of_owner_id AND a.Prop_ID = b.prop_id
AND b.seller_id = c.acct_id

UPDATE #PACS_HoodAuditList SET Grantee = c.file_as_name
FROM #PACS_HoodAuditList As a, buyer_assoc As b, account As c
WHERE a.PACSchg_of_owner_id = b.chg_of_owner_id
AND b.buyer_id = c.acct_id

UPDATE #PACS_HoodAuditList SET New_Construction_Flag = 'Y'
FROM #PACS_HoodAuditList As a, property_val As b
WHERE a.Prop_ID = b.Prop_ID AND a.PACSyear_av = b.prop_val_yr AND b.sup_num = 0
AND b.new_val_imprv_hs + b.new_val_imprv_nhs + b.new_val_land_hs + b.new_val_land_nhs > 0

UPDATE #PACS_HoodAuditList SET New_Construction_Flag = 'Y'
FROM #PACS_HoodAuditList As a, prop_group_assoc As b
WHERE a.Prop_ID = b.Prop_ID AND b.prop_group_cd = 'NC2014'

UPDATE #PACS_HoodAuditList SET Field_Book = Cast(Left(Book_Page,3) As float) WHERE IsNumeric(Left(Book_Page,3)) = 1
UPDATE #PACS_HoodAuditList SET Field_Page = Cast(Right(Book_Page,3) As float) WHERE IsNumeric(Right(Book_Page,3)) = 1

CREATE TABLE #PACS_MultiParcel
([REET]	int null, [Parcel_Count]int null)

INSERT INTO #PACS_MultiParcel (REET, Parcel_Count)
SELECT REET, Count(Prop_ID) As ParcelCount
FROM #PACS_HoodAuditList
GROUP BY REET
ORDER BY REET

UPDATE #PACS_HoodAuditList SET Multiple_Parcels = 'Y'
FROM #PACS_HoodAuditList As a, #PACS_MultiParcel As b
WHERE a.REET = b.REET and b.Parcel_Count > 1 AND a.REET <> 0

SELECT * FROM #PACS_HoodAuditList ORDER BY Field_Book, Field_Page

GRANT EXECUTE ON [dbo].[Jefferson_NeighborhoodWorkups] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_NeighborhoodWorkups] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_NeighborhoodWorkups] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_NeighborhoodWorkups] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

