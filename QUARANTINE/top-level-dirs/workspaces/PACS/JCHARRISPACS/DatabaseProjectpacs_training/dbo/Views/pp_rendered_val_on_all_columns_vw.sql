
CREATE VIEW dbo.pp_rendered_val_on_all_columns_vw
AS 

SELECT 	
	pps.prop_id AS prop_id, 
	pps.prop_val_yr AS prop_val_yr,
	ISNULL( SUM(CASE WHEN pprc.pp_rend_column='FFE' THEN pps.pp_rendered_val END), 0) AS rendered_val_FFE,
	ISNULL( SUM(CASE WHEN pprc.pp_rend_column='OFFE' THEN pps.pp_rendered_val END), 0) AS rendered_val_OFFE,
	ISNULL( SUM(CASE WHEN pprc.pp_rend_column='COMP' THEN pps.pp_rendered_val END), 0) AS rendered_val_COMP,
    	ISNULL( SUM(CASE WHEN pprc.pp_rend_column='MEQT' THEN pps.pp_rendered_val END), 0) As rendered_val_MEQT,		
	ISNULL( SUM(CASE WHEN pprc.pp_rend_column='VEH' THEN pps.pp_rendered_val END), 0) AS rendered_val_VEH

FROM 	
	pers_prop_seg AS pps
	INNER JOIN
	prop_supp_assoc AS psa
		ON psa.prop_id = pps.prop_id
			AND psa.owner_tax_yr = pps.prop_val_yr
			AND psa.sup_num = pps.sup_num
			AND pps.pp_active_flag = 'T'
			AND pps.sale_id IS NOT NULL
	INNER JOIN 
	pers_prop_rendition_column_layout_vw as pprc
		ON pprc.pp_type_cd = pps.pp_type_cd
GROUP BY 
	pps.prop_id,
	pps.prop_val_yr

GO

