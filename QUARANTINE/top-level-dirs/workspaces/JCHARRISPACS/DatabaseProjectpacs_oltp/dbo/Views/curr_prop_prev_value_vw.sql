









CREATE VIEW dbo.curr_prop_prev_value_vw
AS
SELECT property_val.appraised_val,
    property_val.assessed_val, 
    property_val.market, 
    property_val.shared_prop_val,
    property_val.imprv_hstd_val,
    property_val.land_hstd_val,
    property_val1.appraised_val AS prev_appraised, 
    property_val1.assessed_val AS prev_assessed, 
    property_val1.market AS prev_market, 
    property_val1.imprv_hstd_val as prev_imprv_hstd_val,
    property_val1.land_hstd_val as prev_land_hstd_val,
    prop_supp_assoc.owner_tax_yr, 
    prop_supp_assoc1.owner_tax_yr AS prev_owner_tax_yr, 
    property_val.prop_inactive_dt, property.prop_id, 
    property.prop_type_cd, prop_supp_assoc.sup_num, 
    owner.owner_id,
    property_val.appraised_val - property_val1.appraised_val as appraised_gain_loss,
    property_val.market - property_val1.market as market_gain_loss,
    property.geo_id,
    property_val.ten_percent_cap,
    property_val.hscap_qualify_yr,
    property_val.hscap_override_prevhsval_flag,
    property_val.hscap_prevhsval,
    property_val.hscap_prevhsval_pacsuser,
    property_val.hscap_prevhsval_comment,
    property_val.hscap_prevhsval_date,
    property_val.hscap_override_newhsval_flag,
    property_val.hscap_newhsval,
    property_val.hscap_newhsval_pacsuser,
    property_val.hscap_newhsval_comment,
    property_val.hscap_newhsval_date,
    property_val1.ten_percent_cap		as prev_ten_percent_cap,
    property_val1.hscap_qualify_yr		as prev_hscap_qualify_yr,
    property_val1.hscap_override_prevhsval_flag as prev_hscap_override_prevhsval_flag,
    property_val1.hscap_prevhsval	as prev_hscap_prevhsval,
    property_val1.hscap_prevhsval_pacsuser as prev_hscap_prevhsval_pacsuser,
    property_val1.hscap_prevhsval_comment as prev_hscap_prevhsval_comment,
    property_val1.hscap_prevhsval_date	  as prev_hscap_prevhsval_date,
    property_val1.hscap_override_newhsval_flag as prev_hscap_override_newhsval_flag,
    property_val1.hscap_newhsval	as prev_hscap_newhsval,
    property_val1.hscap_newhsval_pacsuser as prev_hscap_newhsval_pacsuser,
    property_val1.hscap_newhsval_comment as prev_hscap_newhsval_comment,
    property_val1.hscap_newhsval_date         as prev_hscap_newhsval_date 

FROM prop_supp_assoc prop_supp_assoc1 INNER JOIN
    property_val property_val1 ON 
    prop_supp_assoc1.prop_id = property_val1.prop_id AND 
    prop_supp_assoc1.owner_tax_yr = property_val1.prop_val_yr AND
     prop_supp_assoc1.sup_num = property_val1.sup_num RIGHT OUTER
     JOIN
    property INNER JOIN
    pacs_system INNER JOIN
    prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num ON 
    pacs_system.appr_yr = prop_supp_assoc.owner_tax_yr ON 
    property.prop_id = property_val.prop_id INNER JOIN
    owner ON prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.sup_num = owner.sup_num ON 
    prop_supp_assoc1.prop_id = prop_supp_assoc.prop_id AND 
    prop_supp_assoc1.owner_tax_yr = prop_supp_assoc.owner_tax_yr
     - 1

where property_val.prop_inactive_dt is null

GO

