create view __report_of_errors as 

SELECT 
                         pv.prop_id as ParcelID, ap1.pacs_user_id, pv.last_appraiser_id, ap.appraiser_nm as appr_name, ap1.appraiser_nm as appraiser, pr.error, pr.error_id,
						  pr.prop_id AS Expr1, pr.sup_num, pr.sup_yr, pr.sale_id, pr.imprv_id, pr.imprv_desc, pr.imprv_detail_id, pr.imprv_detail_desc, pr.land_detail_id, 
                         pr.land_detail_desc, pr.error AS Expr2, pr.error_type, pr.record_type, pr.ptd_imprv_hstd_val, pr.pv_imprv_hstd_val, pr.ptd_imprv_non_hstd_val, 
						 pr.pv_imprv_non_hstd_val, pr.ptd_land_hstd_val, 
                         pr.pv_land_hstd_val, pr.ptd_land_non_hstd_val, 
						 pr.pv_land_non_hstd_val, pr.ptd_ag_use_val, pr.pv_ag_use_val, pr.ptd_ag_market, pr.pv_ag_market, pr.ptd_timber_use, pr.pv_timber_use, 
                         pr.ptd_timber_market, pr.pv_timber_market, pr.ptd_appraised_val, pr.pv_appraised_val, 
						 pr.ptd_assessed_val, pr.pv_assessed_val, pr.ptd_market_val, pr.pv_market_val, pr.ptd_ten_percent_cap, 
                         pr.pv_ten_percent_cap, pr.income_id, pr.land_type_cd, pv.hood_cd


FROM            property_val AS pv WITH (nolock) INNER JOIN
                         prop_recalc_errors AS pr WITH (nolock) ON pv.prop_id = pr.prop_id AND pv.prop_val_yr = pr.sup_yr AND pv.sup_num = pr.sup_num INNER JOIN
                         pacs_system AS ps WITH (nolock) ON pv.prop_val_yr = ps.appr_yr AND pv.prop_val_yr = ps.appr_yr 
						  LEFT OUTER JOIN
                         appraiser AS ap WITH (nolock) ON pv.next_appraiser_id = ap.appraiser_id LEFT OUTER JOIN

                         appraiser AS ap1 WITH (nolock) ON pv.last_appraiser_id = ap1.appraiser_id 

						 where prop_val_yr=(select appr_yr from pacs_system)
						 --and pv.cycle=5

GO

