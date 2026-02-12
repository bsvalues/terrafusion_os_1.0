








CREATE procedure  SetSQLandInterp	

as 

declare @ls_range_adj_price 		numeric(14,2)
declare @ls_range_max			numeric(14,4)
declare @ls_id				int
declare @prev_ls_range_adj_price 	numeric(14,2)
declare @prev_ls_range_max		numeric(14,4)
declare @prev_ls_id			int
declare @diff_price			numeric(14,2)
declare @diff_range			numeric(14,4)
declare @InterpIncr 			numeric(14,6)


select @prev_ls_id              = 0
select @prev_ls_range_adj_price = 0
select @prev_ls_range_max       = 0

declare land_sched_detail_cursor scroll cursor 
for
select  land_sched_detail.ls_id,
	land_sched_detail.ls_range_adj_price,
	land_sched_detail.ls_range_max
from land_sched, land_sched_detail
where land_sched.ls_id = land_sched_detail.ls_id
and   land_sched.ls_method = 'SQ'
and   land_sched.ls_interpolate = 'Y'
order by land_sched_detail.ls_id, land_sched_detail.ls_range_max

open land_sched_detail_cursor
fetch next from land_sched_detail_cursor into @ls_id, @ls_range_adj_price, @ls_range_max

while (@@FETCH_STATUS = 0)
begin

	if (@ls_id <> @prev_ls_id)
	begin
		update land_sched_detail set ls_range_interpolate_inc = 0.00
		where ls_id = @ls_id
		and   ls_range_max = @ls_range_max

		select @prev_ls_id              = @ls_id
		select @prev_ls_range_adj_price = @ls_range_adj_price
		select @prev_ls_range_max       = @ls_range_max
	end
	else
	begin
		
		select @diff_price = @prev_ls_range_adj_price - @ls_range_adj_price
		select @diff_range = @ls_range_max - @prev_ls_range_max

		select @diff_range = @diff_range/1000

--select diff_price = @diff_price, diff_range = @diff_range, test = @diff_price/@diff_range

		select @InterpIncr = @diff_price/@diff_range

		update land_sched_detail set ls_range_interpolate_inc = @InterpIncr
		where ls_id = @ls_id
		and   ls_range_max = @ls_range_max

		select @prev_ls_range_adj_price = @ls_range_adj_price
		select @prev_ls_range_max       = @ls_range_max
	end

	fetch next from land_sched_detail_cursor into @ls_id, @ls_range_adj_price, @ls_range_max
end

close land_sched_detail_cursor
deallocate land_sched_detail_cursor

GO

