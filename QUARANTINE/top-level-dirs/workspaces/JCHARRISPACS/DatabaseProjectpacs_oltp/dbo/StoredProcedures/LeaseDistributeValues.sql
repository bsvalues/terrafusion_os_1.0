

create procedure LeaseDistributeValues

	@input_lease_id varchar(20),
	@input_lease_yr int,
	@input_rev_num int,
	@input_user_id int

AS

	declare @curr_yr_ri numeric(14,0)
	declare @curr_yr_wi numeric(14,0)
	declare @total_lease_value numeric(14,0)
	declare @new_value numeric(14,0)
	declare @prop_id int
	declare @interest_type_cd varchar(5)
	declare @apply_pct numeric(14,8)
	declare @interest_pct numeric(14,8)
	declare @total_wi_pct numeric(14,8)
	declare @sup_num int


select
	@sup_num = isnull(sup_num,0)
from
	lease with (nolock)
where
	lease_id = @input_lease_id
and	lease_yr = @input_lease_yr
and	rev_num = @input_rev_num


-- Delete all non-CAD entities from properties
--
-- NOTE: If sup_num > 0, entities won't be changing because
--       that field is locked after certification, so don't
--       bother deleting and inserting them.

if @sup_num = 0
begin
	delete
		entity_prop_assoc
	from
		entity_prop_assoc as epa
	inner join
		entity
	on
		epa.entity_id = entity.entity_id
	inner join
		lease_prop_assoc as lpa
	on
		epa.prop_id = lpa.prop_id
	and	epa.tax_yr = lpa.lease_yr
	and	epa.sup_num = lpa.sup_num
	inner join
		property_val as pv
	on
		epa.prop_id = pv.prop_id
	and	epa.tax_yr = pv.prop_val_yr
	and	epa.sup_num = pv.sup_num
	and	pv.prop_inactive_dt is null
	where
		lpa.lease_id = @input_lease_id
	and	lpa.lease_yr = @input_lease_yr
	and	lpa.rev_num = @input_rev_num
	and	lpa.sup_num = @sup_num
	and	entity.entity_cd <> 'CAD'


	-- Add all entities associated with lease header to properties
	insert into
		entity_prop_assoc
	(
		entity_id,
		prop_id,
		entity_prop_id,
		entity_prop_pct,
		sup_num,
		tax_yr
	)
	select
		lea.entity_id,
		lpa.prop_id,
		lpa.prop_id,
		lea.entity_pct,
		lpa.sup_num,
		lea.lease_yr
	from
		lease_entity_assoc as lea
	inner join
		lease_prop_assoc as lpa
	on
		lea.lease_id = lpa.lease_id
	and	lea.lease_yr = lpa.lease_yr
	and	lea.rev_num = lpa.rev_num
	and	lpa.sup_num = @sup_num
	inner join
		property_val as pv with (nolock)
	on
		lpa.prop_id = pv.prop_id
	and	lpa.lease_yr = pv.prop_val_yr
	and	lpa.sup_num = pv.sup_num
	and	pv.prop_inactive_dt is null
	where
		lea.lease_id = @input_lease_id
	and	lea.lease_yr = @input_lease_yr
	and	lea.rev_num = @input_rev_num
end

select
	@curr_yr_ri = curr_yr_ri,
	@curr_yr_wi = curr_yr_wi,
	@total_wi_pct = total_wi_interest,
	@total_lease_value = (isnull(curr_yr_ri, 0) * 8)
from
	lease_header_vw with (nolock)
where
	lease_id = @input_lease_id
and	lease_yr = @input_lease_yr
and	rev_num = @input_rev_num


declare LEASE_PROPS cursor fast_forward
for
select
	lpa.prop_id,
	lpa.interest_type_cd,
	lpa.interest_pct
from
	lease_prop_assoc as lpa with (nolock)
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
	if @interest_type_cd in ('RI', 'OR')
	begin
		set @apply_pct = @interest_pct
		set @new_value = @total_lease_value
	end
	else if @interest_type_cd = 'WI'
	begin
		set @apply_pct = @interest_pct / @total_wi_pct
		set @new_value = @curr_yr_wi
	end

	set @new_value = @new_value * @apply_pct

	update
		property_val
	set
		appraised_val = @new_value,
		assessed_val = @new_value,
		market = @new_value,
		cost_value = @new_value,
		land_hstd_val = 0,
		land_non_hstd_val = 0,
		imprv_hstd_val = 0,
		imprv_non_hstd_val = 0,
		ag_use_val = 0,
		ag_market = 0,
		ag_loss = 0,
		ag_late_loss = 0,
		timber_78 = 0,
		timber_market = 0,
		timber_use = 0,
		timber_loss = 0,
		timber_late_loss = 0,
		rendered_val = 0
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


-- Rebuild the legal description as well.  Saves the user a step.
exec LeaseRebuildLegal @input_lease_id, @input_lease_yr, @input_rev_num, @input_user_id

update
	lease
set
	value_distrib_dt = getdate()
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
	'Distributed Values',
	getdate(),
	@input_user_id
)

GO

