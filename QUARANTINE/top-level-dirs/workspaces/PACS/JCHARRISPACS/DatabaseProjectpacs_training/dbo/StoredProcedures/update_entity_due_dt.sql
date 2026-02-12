








create procedure update_entity_due_dt
as
declare @entity_id	int
declare @tax_rate_yr 	numeric(4)
declare @date_string	varchar(100)

DECLARE TAX_RATE SCROLL CURSOR
FOR select entity_id, tax_rate_yr
    from   tax_rate
    where  effective_due_dt is null
OPEN TAX_RATE
FETCH NEXT FROM TAX_RATE into @entity_id, @tax_rate_yr

while (@@FETCH_STATUS = 0)
begin
	select @date_string = '01/31/' + convert(varchar(4), @tax_rate_yr + 1)

	update tax_rate 
	set effective_due_dt = convert(datetime, @date_string)
	where entity_id = @entity_id
	and   tax_rate_yr = @tax_rate_yr

	FETCH NEXT FROM TAX_RATE into @entity_id, @tax_rate_yr
end

CLOSE TAX_RATE
DEALLOCATE TAX_RATE

GO

