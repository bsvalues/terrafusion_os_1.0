







CREATE PROCEDURE ConvAppraisalDeleteInfo
@input_appr_company	int,
@input_yr		numeric(4)

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

/* delete from property special entity exemptions */
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


/* delete from mortgage_assoc */
delete from mortgage_assoc from collections_property_cv
where mortgage_assoc.prop_id = collections_property_cv.prop_id

GO

