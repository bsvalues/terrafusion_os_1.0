
CREATE VIEW dbo.pp_by_designated_column_vw
AS 
SELECT 	ppss.prop_id,  
	ppss.prop_val_yr, 
	pprc.pp_rend_column, 
	ppss.pp_yr_aquired as pp_yr_aquired, 
       	IsNull(ppss.pp_orig_cost, 0) as pp_orig_cost, 
	IsNull(ppss.pp_rendered_val,0) as pp_rendered_val
FROM pers_prop_sub_seg AS ppss
	INNER JOIN pers_prop_rendition_config AS pprc
		ON pprc.pp_type_cd = ppss.pp_type_cd
	INNER JOIN pers_prop_seg pps
	INNER JOIN prop_supp_assoc AS psa
		ON pps.prop_id = psa.prop_id
			AND pps.sup_num = psa.sup_num
			AND pps.prop_val_yr = psa.owner_tax_yr
		ON ppss.prop_id = pps.prop_id
			AND ppss.sup_num = pps.sup_num 
			AND ppss.prop_val_yr = pps.prop_val_yr
			AND ppss.pp_seg_id = pps.pp_seg_id
			AND pps.pp_active_flag = 'T'
			AND pps.sale_id IS NOT NULL
	INNER JOIN 
	pers_prop_rendition_config AS pprc2
			ON pprc2.pp_rend_column IN ('FFE', 'VEH')
			AND pps.pp_type_cd = pprc2.pp_type_cd
 
WHERE ((ppss.prop_val_yr - ppss.pp_yr_aquired) < 15) 
      	

UNION ALL

-- Summarize all the sub-segments acquired in a year which is 15 or more farther from the prop_val_yr
SELECT 	ppss.prop_id,  
	ppss.prop_val_yr, 
	pprc.pp_rend_column, 
        (ppss.prop_val_yr-15) AS pp_yr_aquired,
       	SUM(IsNull(ppss.pp_orig_cost, 0)) as pp_orig_cost, 
	SUM(IsNull(ppss.pp_rendered_val,0)) as pp_rendered_val
FROM pers_prop_sub_seg AS ppss
	INNER JOIN pers_prop_rendition_config AS pprc
		ON pprc.pp_type_cd = ppss.pp_type_cd
	INNER JOIN pers_prop_seg pps
	INNER JOIN prop_supp_assoc AS psa
		ON pps.prop_id = psa.prop_id
			AND pps.sup_num = psa.sup_num
			AND pps.prop_val_yr = psa.owner_tax_yr
		ON ppss.prop_id = pps.prop_id
			AND ppss.sup_num = pps.sup_num 
			AND ppss.prop_val_yr = pps.prop_val_yr
			AND ppss.pp_seg_id = pps.pp_seg_id
			AND pps.pp_active_flag = 'T'
			AND pps.sale_id IS NOT NULL
	INNER JOIN 
	pers_prop_rendition_config AS pprc2
			ON pprc2.pp_rend_column IN ('FFE', 'VEH')
			AND pps.pp_type_cd = pprc2.pp_type_cd

WHERE ((ppss.prop_val_yr - ppss.pp_yr_aquired) >= 15)
GROUP BY ppss.prop_id,  pprc.pp_rend_column, ppss.prop_val_yr

UNION ALL

SELECT 	pps.prop_id,  
	pps.prop_val_yr, 
	pprc.pp_rend_column, 
	pps.pp_yr_aquired as pp_yr_aquired, 
       	IsNull(pp_orig_cost,0) as pp_orig_cost, 
	IsNull(pp_rendered_val,0) as pp_rendered_val
FROM pers_prop_seg AS pps
	INNER JOIN pers_prop_rendition_config AS pprc
		ON pprc.pp_rend_column IN ('FFE', 'VEH')
		AND pprc.pp_type_cd = pps.pp_type_cd
	INNER JOIN prop_supp_assoc AS psa
		ON pps.prop_id = psa.prop_id
			AND pps.sup_num = psa.sup_num
			AND pps.prop_val_yr = psa.owner_tax_yr
			AND pps.pp_active_flag = 'T' 
			AND pps.sale_id IS NOT NULL

AND NOT EXISTS (SELECT  * 
		FROM pers_prop_sub_seg ppss
		WHERE ppss.prop_id = pps.prop_id
		  	AND   ppss.sup_num = pps.sup_num
		  	AND   ppss.prop_val_yr = pps.prop_val_yr
		  	AND   ppss.pp_seg_id = pps.pp_seg_id)
WHERE ((pps.prop_val_yr - pps.pp_yr_aquired) < 15 )

UNION ALL

-- Summarize all the segments acquired in a year which is 15 or more farther from the prop_val_yr
SELECT 	pps.prop_id,  
	pps.prop_val_yr, 
	pprc.pp_rend_column, 
       	(pps.prop_val_yr-15) AS pp_yr_aquired, 
       	SUM(IsNull(pp_orig_cost,0)) as pp_orig_cost, 
	SUM(IsNull(pp_rendered_val,0)) as pp_rendered_val
FROM 	pers_prop_seg AS pps
	INNER JOIN pers_prop_rendition_config AS pprc
		ON pprc.pp_rend_column IN ('FFE', 'VEH')
		AND pprc.pp_type_cd = pps.pp_type_cd
	INNER JOIN prop_supp_assoc AS psa
		ON pps.prop_id = psa.prop_id
			AND pps.sup_num = psa.sup_num
			AND pps.prop_val_yr = psa.owner_tax_yr
			AND pps.pp_active_flag = 'T'
			AND pps.sale_id IS NOT NULL 
			AND NOT EXISTS (SELECT  * 
					FROM 	pers_prop_sub_seg ppss
					WHERE 	ppss.prop_id = pps.prop_id
					  	AND   ppss.sup_num = pps.sup_num
					  	AND   ppss.prop_val_yr = pps.prop_val_yr
					  	AND   ppss.pp_seg_id = pps.pp_seg_id)
WHERE ((pps.prop_val_yr - pps.pp_yr_aquired) >= 15)
GROUP BY pps.prop_id,  pprc.pp_rend_column, pps.prop_val_yr

GO

