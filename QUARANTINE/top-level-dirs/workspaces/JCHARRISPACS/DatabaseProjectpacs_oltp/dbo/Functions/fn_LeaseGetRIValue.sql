
create function fn_LeaseGetRIValue (@input_lease_id varchar(20), @input_lease_yr int, @input_rev_num int)
returns numeric(14,0)
 
as


begin

declare @ri_value numeric(14,0)
set @ri_value = 0

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
	@ri_value =
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


if (@ri_value < 0)
begin
	set @ri_value = 0
end


return (isnull(@ri_value, 0))


end

GO

