








CREATE   PROCEDURE GetSuppDueDate
@input_bill_id      		int,
@input_effective_due_dt      	datetime,
@input_posting_date		datetime,
@input_entity_id		int,
@input_tax_yr			numeric(4),
@output_effective_due_dt	datetime output

AS

if (@input_posting_date <= @input_effective_due_dt)
begin
	select @output_effective_due_dt = @input_effective_due_dt
end
else
begin
	/* at this point the effective due date has passed and we need to revert
	   back to the original due date for bills of Entity/Year combonation  -- crazy ain't it */
	
	select @output_effective_due_dt = effective_due_dt
	from tax_rate 
	where entity_id = @input_entity_id
	and   tax_rate_yr    = @input_tax_yr
end

GO

