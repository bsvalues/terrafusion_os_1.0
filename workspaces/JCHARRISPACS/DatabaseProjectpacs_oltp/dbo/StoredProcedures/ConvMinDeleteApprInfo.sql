








CREATE procedure ConvMinDeleteApprInfo

@input_yr		numeric(4),
@input_appr_company	int

as

/* delete from entity prop assoc */
delete from entity_prop_assoc
from property_val
where entity_prop_assoc.prop_id    = property_val.prop_id
and   entity_prop_assoc.sup_num    = property_val.sup_num
and   entity_prop_assoc.tax_yr     = property_val.prop_val_yr
and   property_val.prop_val_yr     = @input_yr
and   property_val.appr_company_id = @input_appr_company

/* delete from property exemptions */
delete from property_exemption
from property_val
where property_exemption.prop_id      = property_val.prop_id
and   property_exemption.sup_num      = property_val.sup_num
and   property_exemption.owner_tax_yr = property_val.prop_val_yr
and   property_val.prop_val_yr        = @input_yr
and   property_val.appr_company_id    = @input_appr_company

/* delete from property exemptions */
delete from property_special_entity_exemption
from property_val
where property_special_entity_exemption.prop_id      = property_val.prop_id
and   property_special_entity_exemption.sup_num      = property_val.sup_num
and   property_special_entity_exemption.owner_tax_yr = property_val.prop_val_yr
and   property_val.prop_val_yr        = @input_yr
and   property_val.appr_company_id    = @input_appr_company

/* delete from owner */
delete from owner
from property_val
where owner.prop_id      	    = property_val.prop_id
and   owner.sup_num      	    = property_val.sup_num
and   owner.owner_tax_yr 	    = property_val.prop_val_yr
and   property_val.prop_val_yr      = @input_yr
and   property_val.appr_company_id  = @input_appr_company


delete from pers_prop_sub_seg
from property_val
where pers_prop_sub_seg.prop_id        = property_val.prop_id
and   pers_prop_sub_seg.sup_num        = property_val.sup_num
and   pers_prop_sub_seg.prop_val_yr    = property_val.prop_val_yr
and   property_val.prop_val_yr     = @input_yr
and   property_val.appr_company_id = @input_appr_company


delete from pers_prop_seg
from property_val
where pers_prop_seg.prop_id        = property_val.prop_id
and   pers_prop_seg.sup_num        = property_val.sup_num
and   pers_prop_seg.prop_val_yr    = property_val.prop_val_yr
and   property_val.prop_val_yr     = @input_yr
and   property_val.appr_company_id = @input_appr_company

delete from pers_prop
from property_val
where pers_prop.prop_id            = property_val.prop_id
and   pers_prop.prop_val_yr        = property_val.prop_val_yr
and   property_val.prop_val_yr     = @input_yr
and   property_val.appr_company_id = @input_appr_company

/* rendered seg */
delete from rendered_seg
from property_val
where rendered_seg.prop_id         = property_val.prop_id
and   rendered_seg.sup_num         = property_val.sup_num
and   rendered_seg.prop_val_yr     = property_val.prop_val_yr
and   property_val.prop_val_yr     = @input_yr
and   property_val.appr_company_id = @input_appr_company

delete from prop_supp_assoc
from property_val
where prop_supp_assoc.prop_id      = property_val.prop_id
and   prop_supp_assoc.sup_num      = property_val.sup_num
and   prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr
and   property_val.prop_val_yr     = @input_yr
and   property_val.appr_company_id = @input_appr_company


/* delete from property_val */
delete from property_val
where property_val.prop_val_yr     = @input_yr
and   property_val.appr_company_id = @input_appr_company

GO

