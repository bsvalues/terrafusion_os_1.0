Create view recalc_error as 

SELECT DISTINCT          pr.prop_id,
						 ap1.pacs_user_id, 
						 pv.last_appraiser_id, 
						 ap.appraiser_full_name as Next_Appraiser, 
						 ap1.appraiser_full_name as Last_Appraiser, 
						 pr.error,pr.error_id, pr.error_type, pv.hood_cd,pr.imprv_id, pr.imprv_detail_id, pr.land_detail_id
FROM 
	property_val AS pv WITH (nolock) 
		INNER JOIN
	prop_recalc_errors AS pr WITH (nolock) 
			ON pv.prop_id = pr.prop_id AND pv.prop_val_yr = pr.sup_yr AND pv.sup_num = pr.sup_num 
		INNER JOIN
	pacs_system AS ps WITH (nolock) 
			ON pv.prop_val_yr = ps.appr_yr AND pv.prop_val_yr = ps.appr_yr 
		LEFT OUTER JOIN
	appraiser AS ap WITH (nolock) 
			ON pv.next_appraiser_id = ap.appraiser_id 
		LEFT OUTER JOIN
	appraiser AS ap1 WITH (nolock) ON pv.last_appraiser_id = ap1.appraiser_id 
where prop_val_yr=(select appr_yr from pacs_system)and  pv.prop_inactive_dt is null and sale_id=0

GO

