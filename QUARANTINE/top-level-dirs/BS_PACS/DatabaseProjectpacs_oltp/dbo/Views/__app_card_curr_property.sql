create view __app_card_curr_property AS

SELECT        dbo.property.prop_id,
 dbo.property.prop_type_cd, 
 dbo.property.geo_id, 
 dbo.property_val.map_id,
 dbo.property_val.prop_val_yr, 
 dbo.property_val.land_hstd_val, 
                         dbo.property_val.land_non_hstd_val, 
						  dbo.property_val.land_hstd_val+ 
                         dbo.property_val.land_non_hstd_val as total_land_val,
						 dbo.property_val.imprv_hstd_val, 
						 dbo.property_val.imprv_non_hstd_val,
						 dbo.property_val.imprv_hstd_val+ 
						 dbo.property_val.imprv_non_hstd_val as Total_Imprv_Val, 
						 dbo.property_val.appraised_val, 
						 dbo.property_val.ag_use_val, 
						 dbo.property_val.ag_market, 
                         dbo.property_val.ten_percent_cap,
						 dbo.property_val.legal_desc,
						 dbo.property_val.legal_acreage, 
						 dbo.situs.situs_display, 
                         dbo.property_val.image_path, 
						 dbo.abs_subdv.abs_land_pct, 
						 dbo.abs_subdv.abs_imprv_pct, 
						 dbo.abs_subdv.abs_subdv_yr, 
						 dbo.neighborhood.hood_yr, 
						 dbo.neighborhood.hood_land_pct, 
                         dbo.neighborhood.hood_imprv_pct, 
						 dbo.property_val.sup_num, 
						 dbo.property_val.eff_size_acres, 
						 dbo.property_val.assessed_val, 
						 dbo.property_val.prop_inactive_dt, 
						 dbo.property_val.abs_subdv_cd, 
                         dbo.property_val.hood_cd, 
						 dbo.property.ref_id1, 
						 dbo.property.ref_id2, 
						 dbo.property.prop_sic_cd, 
						 dbo.appraiser.appraiser_nm AS last_appraiser_nm, 
						 dbo.property.dba_name, 
                         dbo.abs_subdv.abs_subdv_desc
FROM            dbo.neighborhood WITH (nolock) RIGHT OUTER JOIN
                         dbo.property WITH (nolock) INNER JOIN
                         dbo.prop_supp_assoc WITH (nolock) ON dbo.property.prop_id = dbo.prop_supp_assoc.prop_id INNER JOIN
                         dbo.property_val WITH (nolock) ON dbo.prop_supp_assoc.prop_id = dbo.property_val.prop_id AND dbo.prop_supp_assoc.owner_tax_yr = dbo.property_val.prop_val_yr AND 
                         dbo.prop_supp_assoc.sup_num = dbo.property_val.sup_num LEFT OUTER JOIN
                         dbo.appraiser WITH (nolock) ON dbo.property_val.last_appraiser_id = dbo.appraiser.appraiser_id LEFT OUTER JOIN
                         dbo.situs WITH (nolock) ON dbo.property.prop_id = dbo.situs.prop_id AND dbo.situs.primary_situs = 'Y' LEFT OUTER JOIN
                         dbo.abs_subdv WITH (nolock) ON dbo.property_val.abs_subdv_cd = dbo.abs_subdv.abs_subdv_cd AND dbo.property_val.prop_val_yr = dbo.abs_subdv.abs_subdv_yr ON 
                         dbo.neighborhood.hood_cd = dbo.property_val.hood_cd AND dbo.neighborhood.hood_yr = dbo.property_val.prop_val_yr
						 where prop_val_yr=(select appr_yr FROM pacs_oltp.dbo.pacs_system)
						 and prop_type_cd='r'
						 and prop_inactive_dt is null

GO

