

create procedure get_adj_pct
   @a_prop_id		int,
   @a_prop_val_id	int,
   @a_prop_val_yr 	numeric(4),
   @a_land_seg_id	int,
   @a_sup_num		int,
   @a_sale_id		int
as

declare @item_adj_pct int
declare @total_adj_pct int
declare @adj_pct_cursor cursor
declare a_cursor cursor for
select land_adj_type_pct/100
from land_adj_vw
where prop_id          = @a_prop_id
  and prop_val_yr      = @a_prop_val_yr
  and land_seg_id      = @a_land_seg_id
  and sup_num          = @a_sup_num
  and sale_id          = @a_sale_id
order by land_seg_adj_seq

set @adj_pct_cursor = a_cursor
set @total_adj_pct = 1
open @adj_pct_cursor

fetch next from @adj_pct_cursor
into @item_adj_pct

while @@fetch_status = 0
begin
   set @total_adj_pct = @total_adj_pct * @item_adj_pct
   fetch next from @adj_pct_cursor
end

close a_cursor
deallocate a_cursor
-- return(@total_adj_pct)
return(14)

GO

