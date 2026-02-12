




create procedure UpdateEntityTaxRate

as

declare @entity_id	int
declare @tax_rate_yr	numeric(4)
declare @sup_due_dt	datetime
declare @DueYear	numeric(4)
declare @date_string	varchar(100)
declare @stmnt_string	varchar(100)

declare tax_rate scroll cursor
for select entity_id,
	   tax_rate_yr
   from tax_rate

open tax_rate
fetch next from tax_rate into @entity_id, @tax_rate_yr

while (@@fetch_status = 0)
begin
	select @DueYear = @tax_rate_yr + 1

	select @date_string = '01/31/' + convert(varchar(4), @DueYear)
       	select @sup_due_dt = convert(datetime, @date_string)

	update tax_rate set effective_due_dt = @sup_due_dt
	where tax_rate_yr = @tax_rate_yr
	and   entity_id   = @entity_id

	fetch next from tax_rate into @entity_id, @tax_rate_yr
end

close tax_rate

GO

