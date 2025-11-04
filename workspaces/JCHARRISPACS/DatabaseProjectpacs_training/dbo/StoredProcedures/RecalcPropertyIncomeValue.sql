






CREATE     PROCEDURE RecalcPropertyIncomeValue
@input_prop_id 		 	int,
@input_sup_yr 		 	numeric(4),
@input_sup_num  	 	int,   
@input_rounding_factor	 	numeric(1),
@income_imprv_hstd_val		numeric(14) output,
@income_imprv_non_hstd_val	numeric(14) output,
@income_land_hstd_val		numeric(14) output,
@income_land_non_hstd_val	numeric(14) output,
@income_ag_use_val		numeric(14) output,
@income_ag_market		numeric(14) output,
@income_ag_loss			numeric(14) output,
@income_timber_use		numeric(14) output,
@income_timber_market		numeric(14) output,
@income_timber_loss		numeric(14) output,
@input_recalc_income		char(1) = 'F' 


AS

declare @income_id	int
declare @income_value	numeric(14)

select @income_id  = income_id
from income_prop_assoc
where prop_id     = @input_prop_id
and   sup_num     = @input_sup_num
and   prop_val_yr = @input_sup_yr
and   active_valuation = 'T'

if (@@rowcount = 0)
begin
	-- this indicates that no income records exists, so set the value
	-- to 0 and return
	set @income_value = 0
	set @income_land_non_hstd_val = 0
	return
end
else
begin
	if (@input_recalc_income = 'T')
	begin

		exec IncomeRecalc @income_id, @input_sup_yr, @input_sup_num, @input_rounding_factor, 'T'
	end

	select @income_value = income_value
	from income_prop_assoc
	where prop_id     = @input_prop_id
	and   sup_num     = @input_sup_num
	and   prop_val_yr = @input_sup_yr
	and   income_id   = @income_id

end

set @income_value = IsNull(@income_value, 0)

set @income_imprv_hstd_val     = 0
set @income_land_hstd_val      = 0	
set @income_ag_use_val         = 0
set @income_ag_market	       = 0
set @income_ag_loss	       = 0
set @income_timber_use	       = 0
set @income_timber_market      = 0
set @income_timber_loss	       = 0

if (@income_value > 0)
begin
	set @income_imprv_non_hstd_val = @income_value - @income_land_non_hstd_val
end

if (@income_imprv_non_hstd_val < 0)
begin
	set @income_imprv_non_hstd_val = 0

	insert into prop_recalc_errors
	(
	prop_id,
	sup_num,
	sup_yr,
	sale_id,
	error_type,
	error,
	income_id
	)
	values
	(
	@input_prop_id,
	@input_sup_num,
	@input_sup_yr,
	0,
	'INC',
	'Land Value is greater than the Income Value',
	@income_id
	)

end

GO

