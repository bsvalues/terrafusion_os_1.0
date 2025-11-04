
CREATE VIEW dbo.nbhd_cost_calc_capture_props_vw
AS
SELECT     cc_prop.*, sl.sl_price AS latest_sale_price, sl.sl_dt AS latest_sale_date, sit.situs_display AS situs, prop_prof.class_cd AS grade, 
                      prop_prof.condition_cd AS condition
FROM         dbo.nbhd_cost_calc_capture_props cc_prop LEFT OUTER JOIN
                      dbo.sale sl ON cc_prop.chg_of_owner_id = sl.chg_of_owner_id LEFT OUTER JOIN
                      dbo.situs sit ON cc_prop.prop_id = sit.prop_id AND sit.primary_situs = 'Y' LEFT OUTER JOIN
                      dbo.profile_run_list prof ON cc_prop.profile_run_list_detail_id = prof.detail_id LEFT OUTER JOIN
                      dbo.property_profile prop_prof ON prop_prof.prop_id = cc_prop.prop_id AND prof.prop_val_yr = prop_prof.prop_val_yr

GO

