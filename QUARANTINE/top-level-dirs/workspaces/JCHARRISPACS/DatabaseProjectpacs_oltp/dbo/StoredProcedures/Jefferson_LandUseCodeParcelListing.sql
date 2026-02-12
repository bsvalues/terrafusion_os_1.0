
CREATE PROCEDURE [dbo].[Jefferson_LandUseCodeParcelListing]


AS
DECLARE
  @AssessYear int
 

SET NOCOUNT ON

SET @AssessYear = (SELECT appr_yr As AssessmentYear FROM pacs_system WHERE id = 1)

CREATE TABLE #PACS_RealPropertyMaster_List
(PACSprop_id	  int,
 Parcel_Number	  varchar(12) null,
 Neighborhood	  varchar(10) null,
 PACSowner_id     int null,
 First_Name    varchar(30),
 Last_Name     varchar(30),
 Full_Name     varchar(70),
 Addr_Line1    varchar(60),
 Addr_Line2    varchar(60),
 Addr_Line3    varchar(60),
 Addr_City     varchar(50),
 Addr_State    varchar(50),
 Addr_Zip      varchar(10),
 Legal_Description varchar(255) null,
 Situs_Address    varchar(200) null,
 Cycle            int null,
 Land_Use_Code	  varchar(10) null,
 Land_Use_Code_Desc varchar(50) null,
 Tax_Code_Area	  varchar(22) null,
 Tax_Status       varchar(30) null,
 CurrentYear   	  int null,
 CurrentYr_FMV_Imps	  int null,
 CurrentYr_FMV_Land	  int null)

INSERT INTO #PACS_RealPropertyMaster_List (PACSprop_id, Parcel_Number, Neighborhood, PACSowner_id, First_Name, Last_Name, Full_Name, Addr_Line1, Addr_Line2, Addr_Line3, Addr_City, Addr_State, Addr_Zip, Legal_Description, Situs_Address, Cycle, Land_Use_Code, Land_Use_Code_Desc, Tax_Code_Area, Tax_Status, CurrentYear, CurrentYr_FMV_Imps, CurrentYr_FMV_Land)
SELECT a.prop_id, Left(IsNull(a.geo_id,''),12), '', a.col_owner_id, '', '', '', '', '', '', '', '', '', '', '', '1', '1100', '', '', 'TX', @AssessYear, 0, 0
FROM property As a, property_val As b
WHERE a.prop_type_cd <> 'P' AND a.prop_id = b.prop_id AND b.sup_num = 0
AND b.prop_val_yr = @AssessYear

UPDATE #PACS_RealPropertyMaster_List SET PACSowner_id = b.owner_id
FROM #PACS_RealPropertyMaster_List As a, prop_linked_owner As b
WHERE a.PACSprop_id = b.prop_id AND b.prop_val_yr =  @AssessYear

UPDATE #PACS_RealPropertyMaster_List SET First_Name = RTrim(IsNull(b.first_name,'')), Last_Name = RTrim(IsNull(b.last_name,'')), Full_Name = IsNull(b.file_as_name,''), Addr_Line1 = IsNull(c.addr_line1,''), Addr_Line2 = IsNull(c.addr_line2,''), Addr_Line3 = IsNull(c.addr_line3,''), Addr_City = IsNull(c.addr_city,''), Addr_State = IsNull(c.addr_state,''), Addr_Zip = IsNull(c.addr_zip,'')
FROM #PACS_RealPropertyMaster_List As a, account As b, address As c
WHERE a.PACSowner_id = b.acct_id AND b.acct_id  = c.acct_id AND c.primary_addr = 'Y'

UPDATE #PACS_RealPropertyMaster_List SET Situs_Address = IsNull(b.situs_display,'')
FROM #PACS_RealPropertyMaster_List As a, situs As b
WHERE a.PACSprop_id = b.prop_id AND b.primary_situs = 'Y'

UPDATE #PACS_RealPropertyMaster_List SET Land_Use_Code = IsNull(b.property_use_cd,''), CurrentYr_FMV_Imps = b.imprv_hstd_val + b.imprv_non_hstd_val, CurrentYr_FMV_Land = b.land_hstd_val + b.land_non_hstd_val + b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, Legal_Description = IsNull(legal_desc,''), Neighborhood = Isnull(hood_cd,''),  Cycle = b.cycle
FROM #PACS_RealPropertyMaster_List As a, property_val As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.prop_val_yr AND b.sup_num = 0

UPDATE #PACS_RealPropertyMaster_List SET Land_Use_Code_Desc = b.property_use_desc
FROM #PACS_RealPropertyMaster_List As a, property_use As b
WHERE a.Land_Use_Code = b.property_use_cd

UPDATE #PACS_RealPropertyMaster_List SET Tax_Status = b.exmpt_type_cd
FROM #PACS_RealPropertyMaster_List As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.exmpt_tax_yr

UPDATE #PACS_RealPropertyMaster_List SET Tax_Status = b.exmpt_subtype_cd
FROM #PACS_RealPropertyMaster_List As a, property_exemption As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.exmpt_tax_yr AND exmpt_subtype_cd = 'CA'

UPDATE #PACS_RealPropertyMaster_List SET Tax_Code_Area = RTrim(c.tax_area_number)
FROM #PACS_RealPropertyMaster_List As a, property_tax_area As b, tax_area As c
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.year AND b.sup_num = 0
AND b.tax_area_id = c.tax_area_id

UPDATE #PACS_RealPropertyMaster_List SET Tax_Code_Area = Substring(Tax_Code_Area, 2, 22) WHERE Left(Tax_Code_Area,1) = '0'

UPDATE #PACS_RealPropertyMaster_List SET Tax_Status = 'DELETED'
FROM #PACS_RealPropertyMaster_List As a, property_val As b
WHERE a.PACSprop_id = b.prop_id AND a.CurrentYear = b.prop_val_yr AND NOT b.prop_inactive_dt IS NULL



DELETE FROM #PACS_RealPropertyMaster_List WHERE Tax_Status = 'DELETED' OR PACSowner_id = 0 OR Land_Use_Code < 1000

SELECT * FROM #PACS_RealPropertyMaster_List

GRANT EXECUTE ON [dbo].[Jefferson_LandUseCodeParcelListing] TO [COUNTY\Assesor's Office]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_LandUseCodeParcelListing] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

