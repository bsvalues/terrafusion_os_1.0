


CREATE  procedure IncomeDelete

@input_income_id	int,
@input_sup_num		int,
@input_income_yr	numeric(4)

as

delete from income_prop_assoc 
where income_id   = @input_income_id
and   sup_num     = @input_sup_num
and   prop_val_yr = @input_income_yr

delete from income
where income_id = @input_income_id
and   sup_num   = @input_sup_num
and   income_yr = @input_income_yr

GO

