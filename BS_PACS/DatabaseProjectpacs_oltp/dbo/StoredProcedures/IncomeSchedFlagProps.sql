

create procedure IncomeSchedFlagProps

@input_yr		numeric(4),
@input_econ_area	varchar(10),
@input_prop_type	varchar(10),
@input_class		varchar(10),
@input_level		varchar(10)

as

						 
update property_val
set recalc_flag = 'M'
from income_prop_assoc, income
where income_prop_assoc.prop_id = property_val.prop_id
and   income_prop_assoc.sup_num = property_val.sup_num
and   income_prop_assoc.prop_val_yr = property_val.prop_val_yr
and   income_prop_assoc.income_id   = income.income_id
and   income_prop_assoc.prop_val_yr = income.income_yr
and   income.income_yr     = @input_yr
and   income.econ_area     = @input_econ_area
and   income.prop_type_cd  = @input_prop_type
and   income.class         = @input_class
and   income.level_cd      = @input_level


					 
update income
set recalc_flag = 'M'
where income.income_yr     = @input_yr
and   income.econ_area     = @input_econ_area
and   income.prop_type_cd  = @input_prop_type
and   income.class         = @input_class
and   income.level_cd      = @input_level

GO

