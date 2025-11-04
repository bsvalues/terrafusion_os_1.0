

create procedure PopulatePOEV

as

declare @year		numeric(4)
declare @sup_num	int

declare prop_cursor scroll cursor 
for 
select distinct prop_val_yr, sup_num
from property_val
where prop_val_yr >= 2002

open prop_cursor
fetch next from prop_cursor into @year, @sup_num

while (@@fetch_status = 0)
begin

	exec CalculateTaxable '', @sup_num, @year

	fetch next from prop_cursor into @year, @sup_num
end

close prop_cursor
deallocate prop_cursor

GO

