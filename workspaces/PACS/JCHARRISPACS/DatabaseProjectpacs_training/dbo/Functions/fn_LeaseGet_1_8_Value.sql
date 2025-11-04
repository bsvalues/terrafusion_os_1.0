
create function fn_LeaseGet_1_8_Value (@input_lease_id varchar(20), @input_lease_yr int, @input_rev_num int)
returns numeric(14,0)
 
as


begin

declare @1_8_value numeric(14,0)
set @1_8_value = 0

if (@input_rev_num is null)
begin
	select
		@input_rev_num = max(rev_num)
	from
		lease as l with (nolock)
	where
		l.lease_id = @input_lease_id
	and	l.lease_yr = @input_lease_yr
end

select
	@1_8_value =
		convert(numeric(14,0),
			case
				when l.curr_yr_values_are_1_8_7_8 = 1 then isnull(l.curr_yr_value_ri_1_8, 0)
				else isnull(l.curr_yr_value_ri_1_8, 0)
			end)
from
	lease as l with (nolock)
where
	l.lease_id = @input_lease_id
and	l.lease_yr = @input_lease_yr
and	l.rev_num = isnull(@input_rev_num, 0)


if (@1_8_value < 0)
begin
	set @1_8_value = 0
end


return (isnull(@1_8_value, 0))


end

GO

