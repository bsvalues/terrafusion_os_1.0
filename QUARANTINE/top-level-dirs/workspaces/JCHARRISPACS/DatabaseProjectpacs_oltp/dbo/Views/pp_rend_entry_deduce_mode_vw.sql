
-- View will set the mode (Editable/Viewonly) of the PP Rendition Data Entry Screen
-- If there are more than 1 main segments of the same type as configured in the rendition
-- configuration, the screen is view only

CREATE VIEW dbo.pp_rend_entry_deduce_mode_vw
AS 
	
SELECT 
	pps.prop_id as prop_id, 
	pps.prop_val_yr as prop_val_yr,
	pprc.pp_rend_column as pp_rend_column,
        COUNT(*) as cnt_main_seg
FROM 
	pers_prop_rendition_column_layout_vw AS pprc
     	INNER JOIN pers_prop_seg AS pps
		ON pprc.pp_type_cd = pps.pp_type_cd
	INNER JOIN prop_supp_assoc AS psa
		ON pps.prop_id = psa.prop_id
		   AND pps.sup_num = psa.sup_num
		   AND pps.prop_val_yr = psa.owner_tax_yr
		   AND pps.pp_active_flag = 'T'
		   AND pps.sale_id = 0	
		
GROUP BY 
	pps.prop_id, 
	pps.prop_val_yr, 
	pprc.pp_rend_column
HAVING  
	Count(*) > 1

GO

