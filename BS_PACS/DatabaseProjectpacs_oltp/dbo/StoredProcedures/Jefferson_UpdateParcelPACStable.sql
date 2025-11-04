
CREATE PROCEDURE [dbo].[Jefferson_UpdateParcelPACStable]

AS
DECLARE
@AssessYear int

SET NOCOUNT ON

SET @AssessYear = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system)

DELETE FROM PARCEL_PACS

UPDATE account SET last_name = Left(file_as_name,30)
WHERE ISNULL(last_name,'') = '' AND acct_id > 90000
  
INSERT INTO PARCEL_PACS
(Parcel_No, Prop_ID, AV_Year, Owner_ID, Last_Name, First_Name, Addr_Line1, Addr_Line2, Addr_Line3, Addr_City, Addr_State, Addr_Zip,
Use_Code, Use_Desc, Use_Code_2, Use_Desc_2, State_Code, Tax_Code, School_Dist, Fire_Dist, Planning_Area, Ttl_Acres, Legal_Desc, Cycle, Hood_Code, Hood_Desc,
Subdv_Code, Subdv_Desc, Region_Code, Region_Desc, Township, [Range], Section, Qtr_Section, Tax_Status, Situs_Addr, Situs_City, Situs_Zip,
Sewer_Flag, FPtrl_Flag, CWtr_Flag, Weed_Flag, PLDrn_Flag, WFMV_Imps, WFMV_Land, WFMV_Total, Notes,
Sale_Reet, Sale_Deed, Sale_Price, Sale_Multi, Sale_RCode, Sale_RDesc,
Attr_Sewer, Attr_Drainage, Attr_Bank, Attr_View1, Attr_View2, Attr_Zoning1, Attr_Zoning2, Attr_Zoning3,
Down_Date)
SELECT
Left(a.geo_id,30), a.prop_id, b.prop_val_yr, c.acct_id, LEFT(IsNull(c.last_name,''), 30), LEFT(IsNull(c.first_name,''), 14),
LEFT(IsNull(d.addr_line1,''),30), LEFT(IsNull(d.addr_line2,''),30), LEFT(IsNull(d.addr_line3,''),30), LEFT(IsNull(d.addr_city,''),17), LEFT(IsNull(d.addr_state,''),2), LEFT(IsNull(d.addr_zip,''),10),
LEFT(IsNull(b.property_use_cd,''),4), LEFT(IsNull(b.property_use_cd,''),4), LEFT(IsNull(b.secondary_use_cd,''),4), LEFT(IsNull(b.secondary_use_cd,''),4), '', '', '', '',
CASE
   WHEN Len(a.ref_id2) = 12 THEN Substring(a.ref_id2, 8, 2)
   ELSE '00'
END,
b.legal_acreage, Right(IsNull(b.legal_desc,''),150), b.cycle, b.hood_cd, b.hood_cd,
LEFT(IsNull(b.abs_subdv_cd,''),10), LEFT(IsNull(b.abs_subdv_cd,''),10), LEFT(IsNull(b.rgn_cd,''),10), LEFT(IsNull(b.rgn_cd,''),10), LEFT(IsNull(b.township_code,''),3), LEFT(IsNull(b.range_code,''), 3), LEFT(IsNull(b.township_section,''), 2), LEFT(IsNull(b.township_q_section,''), 5),
'Taxable', '', '', '', 'N', 'N', 'N', 'N', 'N',
b.imprv_hstd_val + b.imprv_non_hstd_val + b.ag_hs_mkt_val + b.timber_hs_mkt_val,
b.land_hstd_val + b.land_non_hstd_val + b.ag_market + b.timber_market,
b.imprv_hstd_val + b.imprv_non_hstd_val + b.land_hstd_val + b.land_non_hstd_val + b.ag_hs_mkt_val + b.timber_hs_mkt_val + b.ag_market + b.timber_market, '',
0, '', 0, '', '', '',
'', '', '', '', '', '', '', '',
Getdate()
FROM property As a
INNER JOIN property_val As b ON a.prop_id = b.prop_id AND b.sup_num = 0 AND b.prop_val_yr = @AssessYear
INNER JOIN account As c ON a.col_owner_id = c.acct_id
LEFT OUTER JOIN address As d ON c.acct_id = d.acct_id AND d.primary_addr = 'Y'
WHERE a.prop_type_cd <> 'P' AND IsNull(a.geo_id,'') <> ''

UPDATE PARCEL_PACS SET State_Code = lEFT(IsNull(b.State_Cd,''), 2)
FROM PARCEL_PACS As a, property_profile As b
WHERE a.Prop_ID = b.prop_id AND b.sup_num = 0 AND b.prop_val_yr = (SELECT appr_yr FROM pacs_system)
UPDATE PARCEL_PACS SET Tax_Status = b.exmpt_type_cd
FROM PARCEL_PACS As a, property_exemption As b
WHERE a.Prop_ID = b.prop_id AND IsNull(b.exmpt_type_cd,'') <> '' AND b.exmpt_tax_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system)
UPDATE PARCEL_PACS SET Tax_Status = b.exmpt_subtype_cd
FROM PARCEL_PACS As a, property_exemption As b
WHERE a.Prop_ID = b.prop_id AND IsNull(b.exmpt_subtype_cd,'') <> '' AND b.exmpt_tax_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system)  AND b.exmpt_subtype_cd <> 'SNR'
UPDATE PARCEL_PACS SET Tax_Code = c.tax_area_number, School_Dist = Left(c.tax_area_description,20), Fire_Dist = Left(c.tax_area_description, 17)
FROM PARCEL_PACS As a, property_tax_area As b, TRUEDB.pacs_oltp.dbo.tax_area As c
WHERE a.Prop_ID = b.prop_id AND b.tax_area_id = c.tax_area_id  AND b.sup_num = 0 AND b.year = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system)
UPDATE PARCEL_PACS SET Use_Desc = Use_Code + ' - ' + b.property_use_desc
FROM PARCEL_PACS As a, property_use As b
WHERE a.Use_Code = b.property_use_cd
UPDATE PARCEL_PACS SET Use_Desc_2 = Use_Code_2 + ' - ' + b.property_use_desc
FROM PARCEL_PACS As a, property_use As b
WHERE a.Use_Code_2 = b.property_use_cd
UPDATE PARCEL_PACS SET Hood_Desc = Hood_Code + ' - ' + b.hood_name
FROM PARCEL_PACS As a, neighborhood As b
WHERE a.Hood_Code = b.hood_cd AND b.hood_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system)
UPDATE PARCEL_PACS SET Subdv_Desc = Subdv_Code + ' - ' + b.abs_subdv_desc
FROM PARCEL_PACS As a, abs_subdv As b
WHERE a.Subdv_Code = b.abs_subdv_cd AND b.abs_subdv_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system)
UPDATE PARCEL_PACS SET Region_Desc = Region_Code + ' - ' + b.rgn_name
FROM PARCEL_PACS As a, region As b
WHERE a.Region_Code = b.rgn_cd

UPDATE PARCEL_PACS SET InActive_Date = prop_inactive_dt, Tax_Status = 'Inactive'
FROM PARCEL_PACS As a, property_val As b
WHERE a.prop_id = b.prop_id AND b.sup_num = 0 AND b.prop_val_yr = (SELECT appr_yr FROM pacs_system)
AND IsNull(b.prop_inactive_dt, '1/1/1900') <> '1/1/1900' 

UPDATE PARCEL_PACS SET Legal_Desc = Replace(Replace(Legal_Desc,char(10),''),char(13),' ')

UPDATE PARCEL_PACS SET School_Dist = 'Port Townsend (50)' WHERE School_Dist Like '%C-50%' OR School_Dist Like '%1-50%'
UPDATE PARCEL_PACS SET School_Dist = 'Chimacum (49)' WHERE School_Dist Like '%1-49%'
UPDATE PARCEL_PACS SET School_Dist = 'Quilcene (48)' WHERE School_Dist Like '%1-48%'
UPDATE PARCEL_PACS SET School_Dist = 'Brinnon (46)' WHERE School_Dist Like '%1-46%'
UPDATE PARCEL_PACS SET School_Dist = 'Sequim (323)' WHERE School_Dist Like '%1-323%'
UPDATE PARCEL_PACS SET School_Dist = 'Quillayute (402)' WHERE School_Dist Like '%1-402%'
UPDATE PARCEL_PACS SET School_Dist = 'Queets - Clearwater (20)' WHERE School_Dist Like '%1-20%'
UPDATE PARCEL_PACS SET Fire_Dist = 'Port Townsend' WHERE Fire_Dist Like '%C-50%'
UPDATE PARCEL_PACS SET Fire_Dist = 'Chimacum (1)' WHERE Fire_Dist Like '%F1%'
UPDATE PARCEL_PACS SET Fire_Dist = 'Quilcene (2)' WHERE Fire_Dist Like '%F2%'
UPDATE PARCEL_PACS SET Fire_Dist = 'Port Ludlow (3)' WHERE Fire_Dist Like '%F3%'
UPDATE PARCEL_PACS SET Fire_Dist = 'Brinnon (4)' WHERE Fire_Dist Like '%F4%'
UPDATE PARCEL_PACS SET Fire_Dist = 'Discovery Bay (5)' WHERE Fire_Dist Like '%F5%'
UPDATE PARCEL_PACS SET Fire_Dist = 'West End (7)' WHERE Fire_Dist Like '%F7%'
UPDATE PARCEL_PACS SET Fire_Dist = 'Sequim (8)' WHERE Fire_Dist Like '%F8%'
UPDATE PARCEL_PACS SET Fire_Dist = 'None' WHERE Left(Fire_Dist,1) = '1'
UPDATE PARCEL_PACS SET Planning_Area = '' WHERE Planning_Area = '00'
UPDATE PARCEL_PACS SET Planning_Area = 'Port Townsend (1)' WHERE Planning_Area = '01'
UPDATE PARCEL_PACS SET Planning_Area = 'Quimper (2)' WHERE Planning_Area = '02'
UPDATE PARCEL_PACS SET Planning_Area = 'Marrowstone (3)' WHERE Planning_Area = '03'
UPDATE PARCEL_PACS SET Planning_Area = 'Tri-Area (4)' WHERE Planning_Area = '04'
UPDATE PARCEL_PACS SET Planning_Area = 'Discovery Bay (5)' WHERE Planning_Area = '05'
UPDATE PARCEL_PACS SET Planning_Area = 'South Chimacum/Inland Valleys/Center (6)' WHERE Planning_Area = '06'
UPDATE PARCEL_PACS SET Planning_Area = 'Port Ludlow (7)' WHERE Planning_Area = '07'
UPDATE PARCEL_PACS SET Planning_Area = 'Paradise Bay (8)' WHERE Planning_Area = '08'
UPDATE PARCEL_PACS SET Planning_Area = 'South Toandos Peninsula,Coyle Area (9)' WHERE Planning_Area = '09' Or Planning_Area = '19'
UPDATE PARCEL_PACS SET Planning_Area = 'Quilcene (10)' WHERE Planning_Area = '10'
UPDATE PARCEL_PACS SET Planning_Area = 'Brinnon (11)' WHERE Planning_Area = '11'
UPDATE PARCEL_PACS SET Planning_Area = 'West Jefferson County (12)' WHERE Planning_Area = '12'

UPDATE PARCEL_PACS SET Situs_Addr = b.situs_num + ' ' + Left((IsNull(b.situs_street_prefx,'') +
   CASE
      WHEN IsNull(b.situs_street_prefx,'') <> '' THEN ' '
      ELSE ''
   END
+ IsNull(b.situs_street,'')),20),
Situs_City = isNull(b.situs_city,''),
Situs_Zip = isNull(b.situs_zip,'')
FROM PARCEL_PACS As a, situs As b
WHERE a.Prop_ID = b.prop_id AND b.situs_num NOT LIKE '%[^0-9]%' AND ISNUMERIC(b.situs_num) = 1

UPDATE PARCEL_PACS SET Sewer_Flag = 'Y', Attr_Sewer = b.characteristic_cd + ' - Connected(No CWF)'
FROM PARCEL_PACS As a, prop_characteristic_assoc As b
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND (b.characteristic_cd = 'PLSEWER' OR b.characteristic_cd = 'PTSEWER') AND b.attribute_cd = 'Connected'

UPDATE PARCEL_PACS SET Sewer_Flag = 'X', Attr_Sewer = b.characteristic_cd + ' - TreatAsConnected(No CWF)' 
FROM PARCEL_PACS As a, prop_characteristic_assoc As b
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND (b.characteristic_cd = 'PLSEWER' OR b.characteristic_cd = 'PTSEWER') AND b.attribute_cd = 'TreatAsConnected'

UPDATE PARCEL_PACS SET FPtrl_Flag = 'Y'
FROM PARCEL_PACS As a, property_special_assessment As b
WHERE a.Prop_ID = b.prop_id AND b.year = (SELECT appr_yr FROM pacs_system) AND b.sup_num = 0 AND b.agency_id = 102

-- USE FOR CLEAN WATER ACTUAL CALCULATION
UPDATE PARCEL_PACS SET CWtr_Flag = 'Y'
FROM PARCEL_PACS As a, property_special_assessment As b
WHERE a.Prop_ID = b.prop_id AND b.year = (SELECT appr_yr FROM pacs_system) AND b.sup_num = 0 AND (b.agency_id = 101 OR b.agency_id = 118)

-- USE FOR CLEAN WATER TEST CALCULATION
--UPDATE PARCEL_PACS SET CWtr_Flag = 'Y'
--FROM PARCEL_PACS As a, user_property As b
--WHERE a.Prop_ID = b.prop_id AND Left(b.clean_water_flag, 3) = 'YES'

-- USE FOR NOXIOUS WEED ACTUAL CALCULATION
UPDATE PARCEL_PACS SET Weed_Flag = 'Y'
FROM PARCEL_PACS As a, property_special_assessment As b
WHERE a.Prop_ID = b.prop_id AND b.year = (SELECT appr_yr FROM pacs_system) AND b.sup_num = 0 AND b.agency_id = 117

-- USE FOR NOXIOUS WEED TEST CALCULATION
--UPDATE PARCEL_PACS SET Weed_Flag = 'Y'
--FROM PARCEL_PACS As a, user_property_val As b
--WHERE a.Prop_ID = b.prop_id AND (b.nwa_type = 'TBR' OR b.nwa_type = 'NTB' OR b.nwa_type = 'SAG')

UPDATE PARCEL_PACS SET PLDrn_Flag = 'Y'
FROM PARCEL_PACS As a, property_special_assessment As b
WHERE a.Prop_ID = b.prop_id AND b.year = (SELECT appr_yr FROM pacs_system) AND b.sup_num = 0 AND b.agency_id = 100

-- Other attribute fields
UPDATE PARCEL_PACS SET Attr_Drainage = b.characteristic_cd + ' - ' + b.attribute_cd
FROM PARCEL_PACS As a, prop_characteristic_assoc As b
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND b.characteristic_cd = 'PLDD'

UPDATE PARCEL_PACS SET Attr_Bank = b.characteristic_cd + ' - ' + b.attribute_cd
FROM PARCEL_PACS As a, prop_characteristic_assoc As b
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND b.characteristic_cd = 'BANK'

UPDATE PARCEL_PACS SET Attr_View1 = b.characteristic_cd + ' - ' + b.attribute_cd
FROM PARCEL_PACS As a, prop_characteristic_assoc As b
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND b.characteristic_cd = 'VIEW' AND b.attribute_cd = 'Marine'

UPDATE PARCEL_PACS SET Attr_View1 = b.characteristic_cd + ' - ' + b.attribute_cd
FROM PARCEL_PACS As a, prop_characteristic_assoc As b
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND b.characteristic_cd = 'VIEW' AND b.attribute_cd = 'Territorial' AND a.Attr_View1 = ''

UPDATE PARCEL_PACS SET Attr_View2 = b.characteristic_cd + ' - ' + b.attribute_cd
FROM PARCEL_PACS As a, prop_characteristic_assoc As b
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND b.characteristic_cd = 'VIEW' AND b.attribute_cd = 'Territorial' AND a.Attr_View1 = 'VIEW - Marine'

UPDATE PARCEL_PACS SET Attr_Zoning1 = Left(b.attribute_cd + ' - ' + c.attribute_desc, 100)
FROM PARCEL_PACS As a, prop_characteristic_assoc As b, attribute_value_code As c
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND b.attribute_cd = c.attribute_cd AND IsNull(c.attribute_desc,'') <> ''
AND b.characteristic_cd = 'ZONING'

UPDATE PARCEL_PACS SET Attr_Zoning1 = b.attribute_cd
FROM PARCEL_PACS As a, prop_characteristic_assoc As b, attribute_value_code As c
WHERE a.Prop_ID = b.prop_id AND b.prop_val_yr = (SELECT appr_yr FROM TRUEDB.pacs_oltp.dbo.pacs_system) AND b.sup_num = 0 AND b.sale_id = 0
AND b.attribute_cd = c.attribute_cd AND IsNull(c.attribute_desc,'') = ''
AND b.characteristic_cd = 'ZONING'

--INACTIVE RECORDS
DELETE FROM PARCEL_PACS_INACTIVE
INSERT INTO PARCEL_PACS_INACTIVE (Parcel_No, Prop_ID, Last_Year_PACS, Owner_ID, Last_Name, First_Name, InActive_Date, Source)
SELECT Parcel_No, Prop_ID, AV_Year, Owner_ID, Last_Name, First_Name, InActive_Date, 'Current'
FROM PARCEL_PACS WHERE Tax_Status = 'Inactive'

CREATE TABLE #Old_Inactive (prop_id INT, last_year INT)
INSERT INTO #Old_Inactive
SELECT a.prop_id, a.LastYear FROM (SELECT a.prop_id, MAX(prop_val_yr) AS LastYear FROM property_val As a, property As b WHERE a.prop_id = b.prop_id AND b.prop_type_cd = 'R' GROUP BY a.prop_id) As a
LEFT OUTER JOIN PARCEL_PACS As b
ON a.prop_id = b.prop_id
WHERE IsNull(b.Parcel_No,'*') = '*'
INSERT INTO PARCEL_PACS_INACTIVE (Parcel_No, Prop_ID, Last_Year_PACS, Owner_ID, Last_Name, First_Name, InActive_Date, Source)
SELECT c.geo_id, a.prop_id, a.last_year, c.col_owner_id, d.last_name, IsNull(d.first_name,''), b.prop_inactive_dt, 'ConversionfromAS400'
FROM #Old_Inactive As a, property_val As b, property As c, account As d
WHERE a.prop_id = b.prop_id AND a.last_year = b.prop_val_yr AND b.prop_id = c.prop_id
AND c.col_owner_id = d.acct_id AND Isnull(c.geo_id,'') <> ''

--SALES
UPDATE PARCEL_PACS
SET Sale_Reet = IsNull(b.excise_number,0), Sale_Deed = b.deed_type_cd, Sale_Date = b.recorded_dt, Sale_RCode = IsNull(d.sl_ratio_type_cd,''), Sale_RDesc = IsNull(d.sl_ratio_cd_reason,''), Sale_Price =  IsNull(d.sl_price,0), Sale_Multi = 'N'
FROM PARCEL_PACS As a, chg_of_owner As b, chg_of_owner_prop_assoc As c, sale As d
WHERE  a.prop_id = c.prop_id
AND b.chg_of_owner_id = c.chg_of_owner_id AND b.recorded_dt between '1/1/2012' and '1/1/2016'
AND b.chg_of_owner_id = d.chg_of_owner_id AND c.seq_num = 0

UPDATE PARCEL_PACS 
SET Sale_RDesc = sl_ratio_desc
FROM PARCEL_PACS As a, sale_ratio_type As b
WHERE a.Sale_RCode = b.sl_ratio_type_cd AND a.Sale_RDesc = ''

CREATE TABLE #PACS_Multi ([REET]	int null, [Parcel_Count]int null)

INSERT INTO #PACS_Multi (REET, Parcel_Count) SELECT Sale_Reet, Count(Prop_Id) As ParcelCount FROM PARCEL_PACS GROUP BY Sale_Reet ORDER BY Sale_Reet
UPDATE PARCEL_PACS SET Sale_Multi = 'Y'
FROM  PARCEL_PACS As a, #PACS_Multi As b
WHERE a.Sale_Reet = b.REET AND a.Sale_Reet > 0 AND b.Parcel_Count > 1

GRANT EXECUTE ON [dbo].[Jefferson_UpdateParcelPACStable] TO [COUNTY\Assesor's Office]
GRANT EXECUTE ON [dbo].[Jefferson_UpdateParcelPACStable] TO [PUBLIC]

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateParcelPACStable] TO PUBLIC
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[Jefferson_UpdateParcelPACStable] TO [COUNTY\Assesor's Office]
    AS [dbo];


GO

