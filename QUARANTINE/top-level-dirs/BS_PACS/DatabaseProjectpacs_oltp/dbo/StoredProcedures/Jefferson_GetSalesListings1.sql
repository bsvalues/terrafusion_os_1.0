
CREATE PROCEDURE [dbo].[Jefferson_GetSalesListings1]
  @RecprdedDateFrom		datetime,
  @RecprdedDateTo		datetime,
  @AssessYear			int,
  @Unverified30Only		varchar(3)

AS

SET NOCOUNT ON

IF object_id('TEMPDB..##PACS_SalesList') is not null
BEGIN
    DROP TABLE [##PACS_SalesList]
END

CREATE TABLE ##PACS_SalesList
([REET]					int null,
 [Deed]					varchar(10) null,
 [Recorded]				datetime null,
 [Grantor]				varchar(70) null,
 [Grantee]				varchar(70) null,
 [Ratio_Code]           varchar(5) null,
 [Comment]              varchar(500) null,
 [Sales_Price]			numeric(14,0) null,
 [Assessed_Value]       numeric(14,0) null,
 [Prop_ID]				int null,
 [Parcel]				varchar(12) null,
 [Owner]				varchar(70),
 [PACSyear_av]          int null,
 [FMV_Building]			numeric(14,0) null,
 [FMV_Land_Improved]	numeric(14,0) null,
 [FMV_Land_Unimproved]	numeric(14,0) null,
 [FMV_Land_OS_Tbr]		numeric(14,0) null,
 [Legal_Description]	varchar(255) null,
 [Neighborhood]			varchar(255) null,
 [Parcel_Acres]		    numeric(14,4) null,
 [PACSchg_of_owner_id]  int
)

INSERT INTO ##PACS_SalesList (REET, Deed, Recorded, Grantor, Grantee, Ratio_Code, Comment, Sales_Price, Assessed_Value, Prop_ID, Parcel, [Owner], PACSyear_av, FMV_Building, FMV_Land_Improved, FMV_Land_Unimproved, FMV_Land_OS_Tbr, Legal_Description, Neighborhood, Parcel_Acres, PACSchg_of_owner_id)
SELECT IsNull(a.excise_number,0), a.deed_type_cd, a.recorded_dt, IsNull(a.grantor_cv,''), isNull(a.grantee_cv,''),'', '', IsNull(c.sl_price,0), 0, b.prop_id, '', '', @AssessYear, 0, 0, 0, 0, '', '', 0, a.chg_of_owner_id
FROM chg_of_owner As a, chg_of_owner_prop_assoc As b, sale As c
WHERE a.chg_of_owner_id = b.chg_of_owner_id AND a.recorded_dt between @RecprdedDateFrom and @RecprdedDateTo
AND a.chg_of_owner_id = c.chg_of_owner_id

UPDATE ##PACS_SalesList SET [Owner] = c.file_as_name
FROM ##PACS_SalesList As a, owner As b, account As c
WHERE a.Prop_ID = b.prop_id AND a.PACSyear_av = b.owner_tax_yr AND b.owner_id = c.acct_id

UPDATE ##PACS_SalesList SET Parcel =  Left(IsNull(c.geo_id,''),12), Assessed_Value = b.assessed_val, FMV_Building = b.imprv_hstd_val + b.imprv_non_hstd_val, FMV_Land_Improved = b.land_hstd_val, FMV_Land_Unimproved = b.land_non_hstd_val,  FMV_Land_OS_Tbr = b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, Legal_Description = IsNull(b.legal_desc,''), Neighborhood = Isnull(b.hood_cd,''),  Parcel_Acres = IsNull(b.legal_acreage,0)
FROM ##PACS_SalesList As a, property_val As b, property As c
WHERE a.Prop_ID = b.prop_id AND a.PACSyear_av = b.prop_val_yr AND a.Prop_ID = c.prop_id

UPDATE ##PACS_SalesList SET Comment = b.comment, Ratio_Code = isnull(b.sl_ratio_type_cd,'')
FROM ##PACS_SalesList As a, chg_of_owner_vw As b
WHERE a.Prop_ID = b.prop_id AND a.PACSchg_of_owner_id = b.chg_of_owner_id

UPDATE ##PACS_SalesList SET Grantor = c.file_as_name
FROM ##PACS_SalesList As a, seller_assoc As b, account As c
WHERE a.PACSchg_of_owner_id = b.chg_of_owner_id AND a.Prop_ID = b.prop_id
AND b.seller_id = c.acct_id

UPDATE ##PACS_SalesList SET Grantee = c.file_as_name
FROM ##PACS_SalesList As a, buyer_assoc As b, account As c
WHERE a.PACSchg_of_owner_id = b.chg_of_owner_id
AND b.buyer_id = c.acct_id

IF @Unverified30Only = 'YES'
BEGIN
   DELETE FROM ##PACS_SalesList WHERE Ratio_Code <> '30'
END

SELECT * FROM ##PACS_SalesList ORDER BY Recorded DESC, REET, Parcel

GRANT EXECUTE ON [dbo].[Jefferson_GetSalesListings1] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_GetSalesListings1] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetSalesListings1] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_GetSalesListings1] TO PUBLIC
    AS [dbo];


GO

