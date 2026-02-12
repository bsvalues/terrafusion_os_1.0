
create procedure SetPrevSupNum
@input_prop_id		int,
@input_sup_num		int,
@input_year		int
as

declare @prev_sup_num int

select @prev_sup_num = max(sup_num)
from dbo.property_val with(nolock)
where prop_id = @input_prop_id
and prop_val_yr = @input_year
and sup_num < @input_sup_num
and sup_num >= 0

update dbo.property_val with(rowlock)
set prev_sup_num = isnull(@prev_sup_num, 0)
where prop_id = @input_prop_id
and prop_val_yr = @input_year
and sup_num = @input_sup_num

GO

