

create procedure RecapPopulateFiscalYear

@year numeric(4)

as

declare @entity_id	int

declare  entity_cursor cursor fast_forward
for select entity_id
from entity

open entity_cursor
fetch next from entity_cursor into @entity_id

while (@@FETCH_STATUS = 0)
begin
	declare @fiscal_year	varchar(20)
	
	select top 1 @fiscal_year = fiscal_year
	from recap_fiscal
	where entity_id = @entity_id
	order by end_date desc

	if (@@ROWCOUNT = 1)
	begin
		declare @mno numeric(14,2)
		declare @ins numeric(14,2)

		select @mno = bill_m_n_o,
		       @ins = bill_i_n_s
		from bill with (nolock)
		where entity_id = @entity_id
		and   sup_tax_yr = @year

		insert into recap_fiscal_totals
		(
		entity_id, fiscal_year, coll_year, beg_mno, beg_ins
		)
		values
		(
		@entity_id, @fiscal_year, @year, @mno, @ins
		)
	end

	fetch next from entity_cursor into @entity_id

end

close entity_cursor
deallocate entity_cursor

GO

