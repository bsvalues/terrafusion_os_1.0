
CREATE   procedure IncomeSetActive

@input_income_id	int,
@input_sup_num		int,
@input_income_yr	numeric(4),
@input_prop_id		int = 0

as

if (@input_prop_id = 0)
begin

	update income_prop_assoc set active_valuation = 'F'
	where prop_val_yr = @input_income_yr
	and   sup_num = @input_sup_num
	and   prop_id     in (select prop_id 
			      from income_prop_assoc 
			      where income_id   = @input_income_id
			      and   sup_num     = @input_sup_num
			      and   prop_val_yr = @input_income_yr)
	
	update income_prop_assoc set active_valuation = 'T'
	where prop_val_yr = @input_income_yr
	and   sup_num     = @input_sup_num
	and   income_id   = @input_income_id
end
else
begin
	update income_prop_assoc set active_valuation = 'F'
	where prop_val_yr = @input_income_yr
	and   sup_num = @input_sup_num
	and   prop_id     in (select prop_id 
			      from income_prop_assoc 
			      where income_id   = @input_income_id
			      and   sup_num     = @input_sup_num
			      and   prop_val_yr = @input_income_yr
			      and   prop_id     = @input_prop_id)
	
	update income_prop_assoc set active_valuation = 'T'
	where prop_val_yr = @input_income_yr
	and   sup_num     = @input_sup_num
	and   income_id   = @input_income_id
	and   prop_id     = @input_prop_id
end

GO

