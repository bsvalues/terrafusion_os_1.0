
create view collin_land_price_vw         

as

select pv.prop_id, pv. sup_num, pv.prop_val_yr, pv.tract_or_lot, pp.land_sqft,  pp.land_acres, pp.land_unit_price, pp.state_cd, p.zoning
  From property_profile pp with (nolock),
       property_val     pv with (nolock),
       pacs_system      with (nolock),
       property 	p with (nolock),
       prop_supp_assoc psa with (nolock)
where pp.prop_id = pv.prop_id
and   pp.sup_num = pv.sup_num
and   pp.prop_val_yr = pv.prop_val_yr
and   pp.prop_val_yr = pacs_system.appr_yr
and   pp.prop_id = p.prop_id
and   psa.prop_id = pv.prop_id
and   psa.sup_num = pv.sup_num
and   psa.owner_tax_yr = pv.prop_val_yr

GO

