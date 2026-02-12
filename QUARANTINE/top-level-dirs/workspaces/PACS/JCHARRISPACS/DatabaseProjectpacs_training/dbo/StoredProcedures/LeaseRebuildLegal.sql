


create procedure LeaseRebuildLegal
	@input_lease_id varchar(20),
	@input_lease_yr int,
	@input_rev_num int,
	@input_user_id int

as

declare @lease_legal varchar(255)
declare @lease_name varchar(50)
declare @operator varchar(30)
declare @interest_type_cd varchar(5)
declare @interest_pct numeric(14, 8)
declare @geo_info varchar(50)
declare @prop_id int
declare @sup_num int
declare @appraiser_id int


select
	@lease_name = lease_name,
	@operator = operator,
	@geo_info = geo_info,
	@appraiser_id = appraiser_id,
	@sup_num = isnull(sup_num, 0)
from
	lease with (nolock)
where
	lease_id = @input_lease_id
and	lease_yr = @input_lease_yr
and	rev_num = @input_rev_num


declare LEASE_PROPS cursor fast_forward
for 
select
	lpa.prop_id,
	interest_type_cd,
	interest_pct
from
	lease_prop_assoc as lpa with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on
	lpa.prop_id = psa.prop_id
and	lpa.lease_yr = psa.owner_tax_yr
and	lpa.sup_num = psa.sup_num
inner join
	property_val as pv with (nolock)
on
	lpa.prop_id = pv.prop_id
and	lpa.lease_yr = pv.prop_val_yr
and	lpa.sup_num = pv.sup_num
and	pv.prop_inactive_dt is null
where
	lpa.lease_id = @input_lease_id
and	lpa.lease_yr = @input_lease_yr
and	lpa.rev_num = @input_rev_num
and	lpa.sup_num = @sup_num

open LEASE_PROPS

fetch next from LEASE_PROPS
into
	@prop_id,
	@interest_type_cd,
	@interest_pct

while @@fetch_status = 0
begin
	-- HS 37759 Must make sure that you do not string concatenate NULL values.
	-- The result is a NULL
	set @lease_legal = 'LEASE ' + isnull(@input_lease_id, '') + ' ' + isnull(@lease_name, '')
	set @lease_legal = @lease_legal + ', ' + isnull(@operator, '')
	set @lease_legal = @lease_legal + ', ' + isnull(@interest_type_cd, '')
	set @lease_legal = @lease_legal + ' ' + isnull(CONVERT(VARCHAR(12), @interest_pct), '')
	set @lease_legal = @lease_legal + ', ' + isnull(@geo_info, '')

update
	property_val
set
	legal_desc = @lease_legal,
	last_appraiser_id = @appraiser_id
where
	prop_id = @prop_id
and	prop_val_yr = @input_lease_yr
and	sup_num = @sup_num

fetch next from LEASE_PROPS
into
	@prop_id,
	@interest_type_cd,
	@interest_pct
end

close LEASE_PROPS
deallocate LEASE_PROPS


update
	lease
set
	legal_rebuild_dt = getdate()
where
	lease_id = @input_lease_id
and	lease_yr = @input_lease_yr
and	rev_num = @input_rev_num


insert into
	lease_log
(
	lease_id,
	lease_yr,
	chg_desc,
	chg_dt,
	pacs_user_id
)
values
(
	@input_lease_id,
	@input_lease_yr,
	'Rebuilt Legal Descriptions',
	getdate(),
	@input_user_id
)

GO

