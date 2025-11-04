--2.18 DOR Assessment Roll for Personal Property 

 create view __dor_RealProp_assessment_roll as

SELECT DISTINCT pv.prop_id 
	,p.geo_id 
	,ac.file_as_name 
	,ad.addr_line1 	,ad.addr_line2 	,ad.addr_line3 	,ad.addr_city   ,ad.addr_state   ,ad.addr_zip   ,s.situs_display 
	,ta.tax_area_number 
	,pv.property_use_cd 
	,pv.secondary_use_cd 
	,pv.legal_acreage 
	,(wpov.imprv_hstd_val + wpov.imprv_non_hstd_val) AS Imprv_Mkt_Val 
	,(wpov.land_hstd_val + wpov.land_non_hstd_val + wpov.timber_market + wpov.ag_market + wpov.timber_hs_market + wpov.ag_hs_market) AS Land_Mkt_Val 
	,(wpov.new_val_hs + wpov.new_val_nhs) AS New_Construction_Value  
	,wpov.appraised_classified  ,wpov.appraised_non_classified  
	,(wpov.appraised_classified + wpov.appraised_non_classified) AS Total_Appraised_Value 
	,(wpov.ag_use_val + wpov.ag_hs_use_val + wpov.timber_use_val + wpov.timber_hs_use_val) AS Current_Use_Value 
	,wpov.taxable_classified 
	,wpov.taxable_non_classified 
	,(wpov.taxable_classified + wpov.taxable_non_classified) AS Total_Taxable_Value 
	,dbo.fn_GetExemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) AS Exemptions 
	,wpoe.exempt_qualify_cd 
	,pv.prop_val_yr 
FROM 
	property_val pv 
INNER JOIN 
	prop_supp_assoc psa  ON pv.prop_id = psa.prop_id  AND pv.prop_val_yr = psa.owner_tax_yr  AND pv.sup_num = psa.sup_num 
INNER JOIN 
	property p ON pv.prop_id = p.prop_id 
INNER JOIN 
	OWNER o  ON pv.prop_id = o.prop_id  AND pv.prop_val_yr = o.owner_tax_yr  AND pv.sup_num = o.sup_num 
INNER JOIN 
	account ac  ON o.owner_id = ac.acct_id 
INNER JOIN 
	address ad  ON ac.acct_id = ad.acct_id  AND isnull(ad.primary_addr, 'N') = 'Y' 
INNER JOIN 
	wash_prop_owner_tax_area_assoc wta ON pv.prop_id = wta.prop_id  AND pv.prop_val_yr = wta.year  AND pv.sup_num = wta.sup_num  AND o.owner_id = wta.owner_id 
INNER JOIN 
	tax_area ta  ON wta.tax_area_id = ta.tax_area_id 
INNER JOIN 
	wash_prop_owner_val wpov  ON pv.prop_id = wpov.prop_id  AND pv.prop_val_yr = wpov.year  AND pv.sup_num = wpov.sup_num  AND o.owner_id = wpov.owner_id 
LEFT OUTER JOIN 
	wash_prop_owner_exemption wpoe ON pv.prop_id = wpoe.prop_id  AND pv.prop_val_yr = wpoe.year  AND pv.sup_num = wpoe.sup_num  AND o.owner_id = wpoe.owner_id 
LEFT OUTER JOIN 
	situs s  ON pv.prop_id = s.prop_id  AND isnull(s.primary_situs, 'N') = 'Y'
LEFT OUTER JOIN 
	property_sub_type pst  ON pv.sub_type = pst.property_sub_cd 
		WHERE pv.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system) AND (  pv.prop_inactive_dt IS NULL  OR udi_parent = 'T'  )  AND p.prop_type_cd = 'R'  AND isnull(pst.state_assessed_utility, 0) <> 1  AND isnull(pst.local_assessed_utility, 0) <> 1 
			--ORDER BY p.geo_id 

GO

