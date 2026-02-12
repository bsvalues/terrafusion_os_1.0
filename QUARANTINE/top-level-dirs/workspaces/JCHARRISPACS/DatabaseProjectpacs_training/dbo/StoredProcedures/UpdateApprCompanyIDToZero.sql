



/****** Object:  Stored Procedure dbo.UpdateApprCompanyIDToZero    Script Date: 2/3/00 10:23:20 AM ******/
CREATE procedure UpdateApprCompanyIDToZero

@input_year as int,
@prop_id as int

as

if @prop_id <> 0
	update property_val set appr_company_id = 0 from property where property_val.prop_id = property.prop_id and property.prop_type_cd = 'P'
                         and property_val.appr_company_id is null
	            and property_val.prop_val_yr = @input_year
                         and property_val.prop_id = @prop_id
else
	update property_val set appr_company_id = 0 from property where property_val.prop_id = property.prop_id and property.prop_type_cd = 'P'
                         and property_val.appr_company_id is null
                         and property_val.prop_val_yr = @input_year

GO

