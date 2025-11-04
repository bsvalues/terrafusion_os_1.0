



CREATE VIEW dbo.appr_card_pers_prop_vw AS

select pps.prop_id, pps.prop_val_yr, 
    pps.sup_num, pps.pp_seg_id, 
    pps.sale_id, pps.pp_type_cd, 
    pps.pp_description, ppt.pp_type_desc, 
    pps.pp_qual_cd, pps.pp_class_cd, 
    pps.pp_area, pps.pp_unit_count, 
    pps.pp_yr_aquired, pps.pp_orig_cost, 
    pps.pp_unit_price, pps.pp_pct_good, 
    pps.pp_deprec_deprec_cd, 
    pps.pp_deprec_pct, 
    prior_pps.pp_appraised_val as pp_prior_yr_val, 
    pps.pp_appraised_val, 
    pps.pp_rendered_val, 
    pps.pp_appraise_meth, 
    pps.pp_mkt_val, 
    pps.pp_density_cd

from pers_prop_seg pps with (nolock)

inner join pp_type ppt with (nolock)
ON pps.pp_type_cd = ppt.pp_type_cd
AND pps.pp_active_flag = 'T'

left outer join pers_prop_seg prior_pps with (nolock)
on pps.pp_seg_id = prior_pps.pp_seg_id 
and pps.prop_id = prior_pps.prop_id
and (pps.prop_val_yr - 1) = prior_pps.prop_val_yr
and prior_pps.sup_num =
	(select sup_num from prop_supp_assoc psa
	 where psa.prop_id = pps.prop_id
	 and psa.owner_tax_yr = (pps.prop_val_yr - 1))

GO

