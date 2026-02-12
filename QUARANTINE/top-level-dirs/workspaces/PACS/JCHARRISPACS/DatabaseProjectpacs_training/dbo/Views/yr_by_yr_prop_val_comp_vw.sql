
CREATE VIEW yr_by_yr_prop_val_comp_vw
AS 

SELECT 
	pv1.prop_id AS prop_id,
	pv1.prop_val_yr AS year_one,
	pv1.market AS market_val_yr_one,
	pv2.prop_val_yr AS year_two,
 	pv2.market AS market_val_yr_two,

	(CAST( ( ISNULL(pv2.market,0) - ISNULL(pv1.market,0) )AS NUMERIC(18,4))
	 / 
	(CASE 
	 	WHEN pv1.market IS NULL THEN 1  
		WHEN pv1.market = 0 THEN 1
		ELSE pv1.market
	END) 
	* 100) AS percent_change,
	( ISNULL(pv2.new_val_hs,0) + ISNULL(pv2.new_val_nhs,0) + ISNULL(pv2.new_val_p, 0) ) AS new_val,
	pp.yr_blt AS last_yr_blt,
 	pp.property_use_cd, 
	pp.region,
	pp.neighborhood
	
FROM	property_val AS pv1
	INNER JOIN
	prop_supp_assoc as psa1
		ON psa1.prop_id = pv1.prop_id
		   AND psa1.owner_tax_yr = pv1.prop_val_yr
		   AND psa1.sup_num = pv1.sup_num
	INNER JOIN 
	property_val AS pv2
		ON pv2.prop_id = pv1.prop_id
	INNER JOIN 
	prop_supp_assoc AS psa2
		ON psa2.prop_id = pv2.prop_id
		   AND psa2.owner_tax_yr = pv2.prop_val_yr
		   AND psa2.sup_num = pv2.sup_num	
	INNER JOIN
	property_profile AS pp
		ON pp.prop_id = pv2.prop_id
		   AND pp.prop_val_yr = pv2.prop_val_yr

GO

