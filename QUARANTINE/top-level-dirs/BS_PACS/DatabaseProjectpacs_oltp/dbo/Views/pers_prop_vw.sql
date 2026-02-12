create view pers_prop_vw as
SELECT        pv.prop_id, pv.prop_val_yr, pv.cost_value, pv.income_value, pv.shared_value, pv.appr_method, pv.sub_market_cd, pv.property_use_cd, pv.visibility_access_cd, pv.last_pacs_user_id, pv.recalc_dt, 
                         pv.new_val_hs, pv.new_val_nhs, pv.new_val_p, pv.cad_value_option, pv.condo_pct, pv.reviewed_dt, pv.reviewed_appraiser, pv.udi_parent, pv.udi_parent_prop_id, pv.udi_status, pv.udi_child_legal_desc, 
                         pv.pp_sq_ft, pv.pp_rentable_sq_ft_rate, pv.dist_vit_val, pv.secondary_use_cd, pv.assessment_use_cd, pv.state_district_cd, pv.tax_area_mileage, pv.total_mileage, pv.dor_value, 
                         pv.apply_miscellaneous_codes, pv.book_page, pv.sup_comment, pv.change_of_value_form, pv.sub_type, pv.urban_growth_cd, pv.cycle, pv.cycle_override, pv.pp_farm, pv.pp_non_farm, pv.prepared_by_id, 
                         pv.ubi_number, pv.tax_registration, pv.business_start_dt, pv.business_close_dt, pv.business_sold_dt, pv.has_locked_values, __PP_point.child_prop_id, __PP_point.parent_prop_id, 
                         __PP_point.prop_id AS Expr1, __PP_point.link_sub_type_cd, __PP_point.link_type_cd, __PP_point.y_coord, __PP_point.x_coord, __PP_point.Shape_Leng, __PP_point.Shape_Area, __PP_point.Shape, 
                         __PP_point.Geometry
FROM            property_val AS pv INNER JOIN
                         __PP_point ON pv.prop_id = __PP_point.prop_id
WHERE        (pv.prop_val_yr = 2018) AND (pv.prop_inactive_dt IS NULL) AND (pv.sub_type LIKE 'PP%')

GO

