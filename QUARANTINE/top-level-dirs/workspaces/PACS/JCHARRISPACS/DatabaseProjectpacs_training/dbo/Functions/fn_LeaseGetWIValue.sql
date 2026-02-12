
create function fn_LeaseGetWIValue (@input_lease_id varchar(20), @input_lease_yr int, @input_rev_num int)
returns numeric(14,0)
 
as


begin

declare @wi_value numeric(14,0)
set @wi_value = 0

if (@input_rev_num is null)
begin
	select
		@input_rev_num = max(l.rev_num)
	from
		lease as l with (nolock)
	where
		l.lease_id = @input_lease_id
	and	l.lease_yr = @input_lease_yr
end

select
	@wi_value =
		convert(numeric(14,0),
			case 
				when l.curr_yr_values_are_1_8_7_8 = 1 then (isnull(l.curr_yr_value_wi_7_8, 0) - round(((isnull(curr_yr_value_ri_1_8, 0) * 8) * (.875 - dbo.fn_LeaseGetTotalWIInterest(l.lease_id, l.lease_yr, l.rev_num))), 0))
				else isnull(curr_yr_value_wi_7_8, 0)
			end)
from
	lease as l with (nolock)
where
	l.lease_id = @input_lease_id
and	l.lease_yr = @input_lease_yr
and	l.rev_num = isnull(@input_rev_num, 0)


if (@wi_value < 0)
begin
	set @wi_value = 0
end


return (isnull(@wi_value, 0))


end

GO

