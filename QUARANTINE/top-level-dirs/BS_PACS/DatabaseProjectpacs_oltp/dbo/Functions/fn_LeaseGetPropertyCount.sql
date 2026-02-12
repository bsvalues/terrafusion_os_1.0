
create function fn_LeaseGetPropertyCount (@input_lease_id varchar(20), @input_lease_yr int, @input_rev_num int)
returns int
 
as


begin

declare @property_count int
set @property_count = 0

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
	@property_count = count(lpa.prop_id)
from
	lease_prop_assoc as lpa with (nolock)
inner join
	lease as l with (nolock)
on
	l.lease_id = lpa.lease_id
and	l.lease_yr = lpa.lease_yr
and	l.rev_num = lpa.rev_num
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = lpa.prop_id
and	psa.owner_tax_yr = lpa.lease_yr
and	psa.sup_num = lpa.sup_num
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	pv.prop_inactive_dt is null
where
	lpa.lease_id = @input_lease_id
and	lpa.lease_yr = @input_lease_yr
and	lpa.rev_num = isnull(@input_rev_num, 0)


return (isnull(@property_count, 0))


end

GO

