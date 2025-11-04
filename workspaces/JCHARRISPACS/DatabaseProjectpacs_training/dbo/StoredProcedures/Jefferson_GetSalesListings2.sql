
CREATE PROCEDURE [dbo].[Jefferson_GetSalesListings2]
  @RecprdedDateFrom		datetime,
  @RecprdedDateTo		datetime,
  @AssessmentYear       varchar(5),
  @UseSup               varchar(10)

AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = Cast(Left(@AssessmentYear,4) As Int)

IF object_id('TEMPDB..#PACS_SalesList') is not null
BEGIN
    DROP TABLE [#PACS_SalesList]
END

CREATE TABLE #PACS_SalesList
(REET				int null,
Deed				varchar(10) null,
Recorded			datetime null,
Grantor				varchar(70) null,
Grantee				varchar(70) null,
Ratio_Code          varchar(5) null,
Ratio_Code_Desc     varchar(100) null,
Comment             varchar(500) null,
Sales_Price			numeric(14,0) null,
Assessed_Value      numeric(14,0) null,
Prop_ID				int null,
Parcel				varchar(12) null,
[Owner]				varchar(70),
PACSyear_av         int null,
Sup_num             int null,
FMV_Building		numeric(14,0) null,
FMV_Land      		numeric(14,0) null,
FMV_Total_AV	    numeric(14,0) null,
FMV_TOS_Building	numeric(14,0) null,
FMV_TOS_Land   		numeric(14,0) null,
FMV_TOS_LandOnly_Flag	char(1) null,
Land_Use_Code       varchar(10) null,
Legal_Description	varchar(255) null,
Neighborhood_Code	varchar(10) null,
Neighborhood_Desc	varchar(100) null,
Neighborhood_Imps_Pct  numeric(5,2) null,
Neighborhood_Land_Pct  numeric(5,2) null,
Neighborhood_Appraiser  varchar(10) null,
Neighborhood_Eco_Comment  varchar(500) null,
Parcel_Acres		numeric(14,4) null,
State_Code          char(5) null,
PACSchg_of_owner_id int,
Multiple_Parcels    char(1) null,
New_Construction_Flag char(1) null
)

INSERT INTO #PACS_SalesList (REET, Deed, Recorded, Grantor, Grantee, Ratio_Code, Ratio_Code_Desc, Comment, Sales_Price, Assessed_Value, Prop_ID, Parcel, [Owner], PACSyear_av, Sup_num, FMV_Building, FMV_Land, FMV_Total_AV, FMV_TOS_Building, FMV_TOS_Land, FMV_TOS_LandOnly_Flag, Land_Use_Code, Legal_Description, Neighborhood_Code, Neighborhood_Desc, Neighborhood_Imps_Pct, Neighborhood_Land_Pct, Neighborhood_Appraiser, Neighborhood_Eco_Comment, Parcel_Acres, State_Code, PACSchg_of_owner_id, Multiple_Parcels, New_Construction_Flag)
SELECT IsNull(a.excise_number,0), a.deed_type_cd, a.recorded_dt, IsNull(a.grantor_cv,''), isNull(a.grantee_cv,''), IsNull(c.sl_ratio_type_cd,''), IsNull(c.sl_ratio_cd_reason,''), '', IsNull(c.sl_price,0), 0, b.prop_id, '', '', @AssessYear, 0, 0, 0, 0, 0, 0, 'N', '', '', '', '', 0, 0, '', '', 0, '', a.chg_of_owner_id, 'N', 'N'
FROM chg_of_owner As a, chg_of_owner_prop_assoc As b, sale As c
WHERE a.chg_of_owner_id = b.chg_of_owner_id AND a.recorded_dt between @RecprdedDateFrom and @RecprdedDateTo
AND a.chg_of_owner_id = c.chg_of_owner_id --AND b.seq_num = 0

UPDATE #PACS_SalesList SET [Owner] = c.file_as_name
FROM #PACS_SalesList As a, owner As b, account As c
WHERE a.Prop_ID = b.prop_id AND a.PACSyear_av = b.owner_tax_yr AND b.owner_id = c.acct_id

If @UseSup = 'YES'
BEGIN
UPDATE #PACS_SalesList SET Parcel =  Left(IsNull(c.geo_id,''),12), Sup_num = b.sup_num, Assessed_Value = b.assessed_val, FMV_Building = b.imprv_hstd_val + b.imprv_non_hstd_val, FMV_Land = b.land_hstd_val + b.land_non_hstd_val + b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, Legal_Description = IsNull(b.legal_desc,''), Neighborhood_Code = Isnull(b.hood_cd,''),  Parcel_Acres = IsNull(b.legal_acreage,0), Land_Use_Code = IsNull(b.property_use_cd,'')
FROM #PACS_SalesList As a, property_val As b, property As c, prop_supp_assoc As d
WHERE a.Prop_ID = b.prop_id AND a.PACSyear_av = b.prop_val_yr AND a.Prop_ID = c.prop_id
AND b.prop_id = d.prop_id AND b.prop_val_yr = d.owner_tax_yr AND b.sup_num = d.sup_num
END

If @UseSup = 'NO'
BEGIN
UPDATE #PACS_SalesList SET Parcel =  Left(IsNull(c.geo_id,''),12), Sup_num = b.sup_num, Assessed_Value = b.assessed_val, FMV_Building = b.imprv_hstd_val + b.imprv_non_hstd_val, FMV_Land = b.land_hstd_val + b.land_non_hstd_val + b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, Legal_Description = IsNull(b.legal_desc,''), Neighborhood_Code = Isnull(b.hood_cd,''),  Parcel_Acres = IsNull(b.legal_acreage,0), Land_Use_Code = IsNull(b.property_use_cd,'')
FROM #PACS_SalesList As a, property_val As b, property As c
WHERE a.Prop_ID = b.prop_id AND a.PACSyear_av = b.prop_val_yr AND a.Prop_ID = c.prop_id AND b.sup_num = 0
END

DELETE FROM #PACS_SalesList WHERE Parcel = ''

UPDATE #PACS_SalesList SET FMV_Total_AV = FMV_Building + FMV_Land

UPDATE #PACS_SalesList SET FMV_TOS_Building = b.imprv_det_val
FROM #PACS_SalesList As a, (SELECT prop_id, sale_id, Sum(imprv_det_val) As imprv_det_val FROM imprv_detail WHERE prop_val_yr = @AssessYear AND sale_id > 0 GROUP BY prop_id, sale_id) As b
WHERE a.Prop_ID = b.prop_id AND a.PACSchg_of_owner_id = b.sale_id

UPDATE #PACS_SalesList SET FMV_TOS_Land = b.land_seg_mkt_val
FROM #PACS_SalesList As a, (SELECT prop_id, sale_id, Sum(land_seg_mkt_val) As land_seg_mkt_val FROM land_detail WHERE prop_val_yr = @AssessYear AND sale_id > 0 GROUP BY prop_id, sale_id) As b
WHERE a.Prop_ID = b.prop_id AND a.PACSchg_of_owner_id = b.sale_id

UPDATE #PACS_SalesList SET FMV_TOS_LandOnly_Flag = 'Y' WHERE FMV_TOS_Building = 0 AND FMV_TOS_Land > 0

UPDATE #PACS_SalesList SET State_Code = IsNull(b.state_cd,'')
FROM #PACS_SalesList As a, property_profile As b
WHERE a.Prop_ID = b.prop_id AND a.PACSyear_av = b.prop_val_yr

UPDATE #PACS_SalesList SET Neighborhood_Desc = IsNull(b.hood_name,''), Neighborhood_Eco_Comment = IsNull(b.eco_comment,''), Neighborhood_Imps_Pct = b.hood_imprv_pct, Neighborhood_Land_Pct = b.hood_land_pct
FROM #PACS_SalesList As a, neighborhood As b
WHERE a.Neighborhood_Code = b.hood_cd AND a.PACSyear_av = b.hood_yr

UPDATE #PACS_SalesList SET Neighborhood_Appraiser = c.appraiser_nm
FROM #PACS_SalesList As a, neighborhood As b, appraiser As c
WHERE a.Neighborhood_Code = b.hood_cd AND a.PACSyear_av = b.hood_yr AND b.appraiser_id = c.appraiser_id

UPDATE #PACS_SalesList SET Comment = IsNull(b.comment,'')
FROM #PACS_SalesList As a, chg_of_owner_vw As b
WHERE a.Prop_ID = b.prop_id AND a.PACSchg_of_owner_id = b.chg_of_owner_id

UPDATE #PACS_SalesList SET Comment = Replace(Replace(Comment,char(10),''),char(13),' '), Legal_Description = Replace(Replace(Legal_Description,char(10),''),char(13),' '), Neighborhood_Eco_Comment = Replace(Replace(Neighborhood_Eco_Comment,char(10),''),char(13),' ')

UPDATE #PACS_SalesList SET New_Construction_Flag = 'Y'
FROM #PACS_SalesList As a, property_val As b
WHERE a.Prop_ID = b.Prop_ID AND a.PACSyear_av = b.prop_val_yr AND b.sup_num = 0
AND b.new_val_imprv_hs + b.new_val_imprv_nhs + b.new_val_land_hs + b.new_val_land_nhs > 0

UPDATE #PACS_SalesList SET New_Construction_Flag = 'Y'
FROM #PACS_SalesList As a, prop_group_assoc As b
WHERE a.Prop_ID = b.Prop_ID AND b.prop_group_cd = 'NC2015'

--UPDATE #PACS_SalesList SET Ratio_Code = isnull(b.sl_ratio_type_cd,'')
--FROM #PACS_SalesList As a, chg_of_owner_vw As b
--WHERE a.Prop_ID = b.prop_id AND a.PACSchg_of_owner_id = b.chg_of_owner_id AND a.ratio_code  = ''

UPDATE #PACS_SalesList SET Ratio_Code_Desc = sl_ratio_desc
FROM #PACS_SalesList As a, sale_ratio_type As b
WHERE a.Ratio_Code = b.sl_ratio_type_cd AND a.Ratio_Code_Desc = ''

UPDATE #PACS_SalesList SET Grantor = c.file_as_name
FROM #PACS_SalesList As a, seller_assoc As b, account As c
WHERE a.PACSchg_of_owner_id = b.chg_of_owner_id AND a.Prop_ID = b.prop_id
AND b.seller_id = c.acct_id

UPDATE #PACS_SalesList SET Grantee = c.file_as_name
FROM #PACS_SalesList As a, buyer_assoc As b, account As c
WHERE a.PACSchg_of_owner_id = b.chg_of_owner_id
AND b.buyer_id = c.acct_id

CREATE TABLE #PACS_MultiParcel
([REET]	int null, [Parcel_Count]int null)

INSERT INTO #PACS_MultiParcel (REET, Parcel_Count)
SELECT REET, Count(Prop_ID) As ParcelCount
FROM #PACS_SalesList
GROUP BY REET
ORDER BY REET

UPDATE #PACS_SalesList SET Multiple_Parcels = 'Y'
FROM #PACS_SalesList As a, #PACS_MultiParcel As b
WHERE a.REET = b.REET and b.Parcel_Count > 1

IF Right(@AssessmentYear, 1) = '*' -- Update Last Sale Info Table for other reports
BEGIN
DELETE FROM _jeff_Last_Sales_Info
INSERT INTO _jeff_Last_Sales_Info (Prop_ID, PACSchg_of_owner_id, REET, Deed, Recorded, Grantor, Grantee, Ratio_Code, Sales_Price, FMV_Building, FMV_Land, FMV_TOS_LandOnly_Flag, Multiple_Parcels, Download_Date)
SELECT Prop_ID, PACSchg_of_owner_id, REET, Deed, Recorded, Grantor, Grantee, Ratio_Code, Sales_Price, FMV_Building, FMV_Land, FMV_TOS_LandOnly_Flag, Multiple_Parcels, GetDate()
FROM #PACS_SalesList WHERE FMV_Building + FMV_Land > 0
END

IF Right(@AssessmentYear, 1) <> '*'
BEGIN
SELECT * FROM #PACS_SalesList ORDER BY Recorded, REET, Parcel
END

GRANT EXECUTE ON [dbo].[Jefferson_GetSalesListings2] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetSalesListings2] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetSalesListings2] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetSalesListings2] TO PUBLIC
    AS [dbo];


GO

