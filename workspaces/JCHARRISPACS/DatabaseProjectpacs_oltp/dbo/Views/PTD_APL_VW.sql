







CREATE VIEW dbo.PTD_APL_VW
AS


SELECT     property_val.legal_desc, property_val.legal_desc_2, property_val.prop_inactive_dt, property.prop_create_dt, 
                      property_val1.appraised_val AS prev_appraised_val, situs.primary_situs, situs.situs_num, situs.situs_street_prefx, 
                      situs.situs_street, situs.situs_street_sufix, situs.situs_unit, situs.situs_city, situs.situs_state, situs.situs_zip, 
                      situs.situs_display, owner.owner_id, sale_conf.sl_conf_id, sale.sl_price, sale.sl_dt, property_val.sup_num, 
                      owner.prop_id, owner.owner_tax_yr
FROM sale 
inner join chg_of_owner_prop_assoc on
sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
left outer join sale_conf on
sale.chg_of_owner_id = sale_conf.chg_of_owner_id
inner join property on
chg_of_owner_prop_assoc.prop_id = property.prop_id
inner join prop_supp_assoc on
property.prop_id = prop_supp_assoc.prop_id
inner join property_val on
prop_supp_assoc.prop_id = property_val.prop_id and
prop_supp_assoc.sup_num = property_val.sup_num and
prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr 
inner join owner on
property_val.prop_id = owner.prop_id and
property_val.sup_num = owner.sup_num and
property_val.prop_val_yr = owner.owner_tax_yr 
left outer join situs on
property.prop_id = situs.prop_id and
situs.primary_situs = 'Y'
left outer join prop_supp_assoc ps1 on
property.prop_id = ps1.prop_id and
ps1.owner_tax_yr = property_val.prop_val_yr -1
inner join property_val property_val1 on
ps1.prop_id = property_val1.prop_id and
ps1.sup_num = property_val1.sup_num and
ps1.owner_tax_yr = property_val1.prop_val_yr

GO

