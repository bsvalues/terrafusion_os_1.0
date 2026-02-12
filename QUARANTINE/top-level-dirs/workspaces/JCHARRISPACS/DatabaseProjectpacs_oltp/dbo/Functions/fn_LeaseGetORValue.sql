
create function fn_LeaseGetORValue (@input_lease_id varchar(20), @input_lease_yr int, @input_rev_num int)
returns numeric(14,0)
 
as


begin

declare @or_value numeric(14,0)
set @or_value = 0

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

set @or_value =
	(dbo.fn_LeaseGetRIValue(@input_lease_id, @input_lease_yr, @input_rev_num) * 8 * dbo.fn_LeaseGetTotalORInterest(@input_lease_id, @input_lease_yr, @input_rev_num))


if (@or_value < 0)
begin
	set @or_value = 0
end


return (isnull(@or_value, 0))


end

GO

