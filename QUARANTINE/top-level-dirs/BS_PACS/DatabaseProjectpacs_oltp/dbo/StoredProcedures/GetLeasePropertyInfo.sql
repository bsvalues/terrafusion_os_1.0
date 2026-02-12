

create procedure GetLeasePropertyInfo
	@input_prop_id int,
	@input_lease_id varchar(20),
	@input_year int,
	@input_sup_num int

as

declare @lease_id varchar(20)
declare @interest_type_cd varchar(5)
declare @interest_pct numeric(14,8)
declare @barrels_per_day numeric(18,0)
declare @rev_num int


if @input_lease_id = '0'
begin
	select top 1
		@input_lease_id = lease_id
	from
		lease_prop_assoc as lpa with (nolock)
	where
		lease_yr = @input_year
	and	sup_num = @input_sup_num
	and	prop_id = @input_prop_id
	and	rev_num =
		(
			select
				max(rev_num) 
			from
				lease_prop_assoc
			where
				lpa.lease_id = lease_id 
			and	lpa.lease_yr = lease_yr
			and	lpa.prop_id = prop_id
			and	lpa.sup_num = sup_num
			and	lpa.sup_num = @input_sup_num
		)
end

select
	@rev_num = max(rev_num)
from
	lease with (nolock)
where
	lease_id = @input_lease_id
and	lease_yr = @input_year


select
	@lease_id = lease_id,
	@interest_type_cd = interest_type_cd,
	@interest_pct = interest_pct,
	@barrels_per_day = barrels_per_day
from
	lease_prop_assoc with (nolock)
where
	prop_id = @input_prop_id
and	lease_yr = @input_year
and	rev_num = @rev_num
and	sup_num = @input_sup_num


if @@rowcount > 0
begin
	set @input_lease_id = @lease_id
end


select
	lease_id,
	lease_yr,
	rev_num,
	@input_sup_num as sup_num,
	lease_name,
	@interest_type_cd as interest_type_cd,
	@interest_pct as interest_pct,
	operator,
	geo_info,
	rrc_number,
	well_type,
	field_id,
	'' as zone,
	@barrels_per_day as barrels_per_day,
	lease_inactive_dt
from
	lease with (nolock)
where
	lease.lease_id = @input_lease_id
and	lease.lease_yr = @input_year
and	lease.rev_num = @rev_num

GO

