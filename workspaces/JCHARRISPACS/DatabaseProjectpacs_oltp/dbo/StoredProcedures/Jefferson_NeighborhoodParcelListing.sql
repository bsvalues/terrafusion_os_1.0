
CREATE PROCEDURE [dbo].[Jefferson_NeighborhoodParcelListing]
  @AssessmentYear char(4),
  @Neighborhood varchar(10),
  @LandTypeCode varchar(30),
  @LandUseCode varchar(10)

AS
DECLARE
@AssessYear int,
@PriorYear int

SET NOCOUNT ON

SET @AssessYear = Cast(@AssessmentYear As Int)
SET @PriorYear = @AssessYear - 1
SET @LandTypeCode = IsNull(@LandTypeCode,'')
SET @LandUseCode = IsNull(@LandUseCode,'')

CREATE TABLE #PACS_Neighborhood_List
(Neighborhood	  varchar(10) null,
 Neighborhood_Desc varchar(100) null,
 Neighborhood_Appraiser varchar(40) null,
 Neighborhood_imprv_pct numeric(5,2) null,
 Neighborhood_land_pct numeric(5,2) null,
 Neighborhood_comment varchar(500) null,
 PACSprop_id	  int,
 Parcel_Number	  varchar(12) null,
 Legal_Description varchar(255) null,
 Situs_Address    varchar(200) null,
 Cycle            int null,
 Prop_Type_Code   varchar(5) null,
 Land_Use_Code	  varchar(10) null,
 Tax_Status       varchar(30) null,
 Abstract_Code     varchar(10) null,
 Land_Type_Flag   varchar(1) null,
 CurrentYear   	  int null,
 CurrentYr_FMV_Imps	  int null,
 CurrentYr_FMV_Land	  int null,
 PriorYr_FMV_Imps	  int null,
 PriorYr_FMV_Land	  int null,
 phys_comment varchar(500) null,
 eco_comment varchar(500) null,
 gov_comment varchar(500) null,
 soc_comment varchar(500) null,
 BOE_appeal_comment varchar(200) null)


INSERT INTO #PACS_Neighborhood_List (PACSprop_id, Parcel_Number, Legal_Description, Situs_Address, Neighborhood, Neighborhood_Desc, Neighborhood_Appraiser, Neighborhood_imprv_pct, Neighborhood_land_pct, Neighborhood_comment, Cycle, Prop_Type_Code, Land_Use_Code, Tax_Status, Abstract_Code, Land_Type_Flag, CurrentYear, CurrentYr_FMV_Imps, CurrentYr_FMV_Land, PriorYr_FMV_Imps, PriorYr_FMV_Land)
SELECT prop_id, Left(IsNull(geo_id,''),12), '', '', '', '', '', 0, 0, '', '', prop_type_cd, '', 'TX', '', '', @AssessYear, 0, 0, 0, 0
FROM property WHERE prop_type_cd <> 'P'

UPDATE #PACS_Neighborhood_List SET Situs_Address = IsNull(b.situs_display,'')
FROM #PACS_Neighborhood_List As a, situs As b
WHERE a.PACSprop_id = b.prop_id AND b.primary_situs = 'Y'

UPDATE #PACS_Neighborhood_List SET Land_Use_Code = IsNull(b.property_use_cd,''), CurrentYr_FMV_Imps = b.imprv_hstd_val + b.imprv_non_hstd_val, CurrentYr_FMV_Land = b.land_hstd_val + b.land_non_hstd_val + b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, Legal_Description = IsNull(legal_desc,''), Neighborhood = Isnull(hood_cd,''),  Cycle = b.cycle, Abstract_Code = isnull(b.abs_subdv_cd, '')
FROM #PACS_Neighborhood_List As a, property_val As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.prop_val_yr AND b.sup_num = 0

If @LandTypeCode <> ''
BEGIN
UPDATE #PACS_Neighborhood_List SET Land_Type_Flag = 'Y'
FROM #PACS_Neighborhood_List As a, Land_detail As b
WHERE a.PACSprop_id = b.prop_id AND b.prop_val_yr = @AssessYear AND b.sup_num = 0 AND b.sale_id = 0 AND b.land_type_cd = @LandTypeCode
DELETE FROM #PACS_Neighborhood_List WHERE Land_Type_Flag <> 'Y'
END

If @LandUseCode <> ''
BEGIN
UPDATE #PACS_Neighborhood_List SET Land_Type_Flag = 'Y'
FROM #PACS_Neighborhood_List As a, Land_detail As b
WHERE a.PACSprop_id = b.prop_id AND b.prop_val_yr = @AssessYear AND b.sup_num = 0 AND b.sale_id = 0 AND b.primary_use_cd = @LandUseCode
DELETE FROM #PACS_Neighborhood_List WHERE Land_Type_Flag <> 'Y'
END

UPDATE #PACS_Neighborhood_List SET Tax_Status = b.exmpt_type_cd
FROM #PACS_Neighborhood_List As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.exmpt_tax_yr

UPDATE #PACS_Neighborhood_List SET Tax_Status = 'DELETED'
FROM #PACS_Neighborhood_List As a, property_val As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.prop_val_yr AND NOT b.prop_inactive_dt IS NULL

If Right(@Neighborhood,1) = '%'
BEGIN
UPDATE #PACS_Neighborhood_List SET Tax_Status = 'DELETED' WHERE Neighborhood NOT Like @Neighborhood
END

If Right(@Neighborhood,1) <> '%'
BEGIN
UPDATE #PACS_Neighborhood_List SET Tax_Status = 'DELETED' WHERE Neighborhood <> @Neighborhood
END

DELETE FROM #PACS_Neighborhood_List WHERE Tax_Status = 'DELETED'

UPDATE #PACS_Neighborhood_List SET Neighborhood_Desc = b.hood_name, Neighborhood_Appraiser = c.appraiser_nm, Neighborhood_imprv_pct = b.hood_imprv_pct, Neighborhood_land_pct = b.hood_land_pct, Neighborhood_comment = IsNull(b.comments,''), phys_comment = IsNull(b.phys_comment,''), eco_comment = IsNull(b.eco_comment,''), gov_comment = IsNull(b.gov_comment,''), soc_comment = IsNull(b.soc_comment,'')
FROM #PACS_Neighborhood_List As a, neighborhood As b, appraiser As c
WHERE a.Neighborhood = b.hood_cd AND a.CurrentYear = b.hood_yr AND b.appraiser_id = c.appraiser_id

UPDATE #PACS_Neighborhood_List SET PriorYr_FMV_Imps = b.imprv_hstd_val + b.imprv_non_hstd_val, PriorYr_FMV_Land = b.land_hstd_val + b.land_non_hstd_val + b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market
FROM #PACS_Neighborhood_List As a, property_val As b, property_profile As c
WHERE a.PACSprop_id = b.prop_id AND b.prop_id = c.prop_id AND b.prop_val_yr = c.prop_val_yr AND b.sup_num = c.sup_num
AND b.prop_val_yr = @PriorYear

UPDATE #PACS_Neighborhood_List SET BOE_appeal_comment = b.prot_taxpayer_comments + '(' + Cast(b.opinion_of_value As varchar(10)) + ')'
FROM #PACS_Neighborhood_List As a, _arb_protest As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.prop_val_yr

UPDATE #PACS_Neighborhood_List SET BOE_appeal_comment = b.prot_taxpayer_comments + '(' + Cast(b.opinion_of_value As varchar(10)) + ')'
FROM #PACS_Neighborhood_List As a, _arb_protest As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear - 1 = b.prop_val_yr AND IsNull(a.BOE_appeal_comment,'') = ''

SELECT * FROM #PACS_Neighborhood_List ORDER BY Parcel_Number

GRANT EXECUTE ON [dbo].[Jefferson_NeighborhoodParcelListing] TO [COUNTY\Assesor's Office]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_NeighborhoodParcelListing] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

