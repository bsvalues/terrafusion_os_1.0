
create procedure CopyLease

@input_lease_id varchar(20),
@input_new_id varchar(20),
@input_lease_yr int,
@input_new_yr int

as

declare @orig_rev_num int
declare @new_rev_num int
declare @prop_id int
declare @new_prop_id int

set nocount on

select
	@orig_rev_num = max(l.rev_num)
from
	lease as l
where
	l.lease_id = @input_lease_id
and	l.lease_yr = @input_lease_yr

-- If @input_lease_id <> @input_new_id, user wants to copy the lease, 
-- which means, all properties belonging to the lease need to be copied
-- (created with new prop_id's), etc.
--
-- If @input_lease_id = @input_new_id, system wants to copy lease
-- because the year just changed for certification OR
-- user clicked Revision button and everything needs to be copied
-- to a new revision number.

if @input_lease_id <> @input_new_id
begin
	set @new_rev_num = 0

	insert into
		lease
	(
		lease_id,
		lease_yr,
		rev_num,
		lease_name,
		operator,
		rrc_number,
		field_id,
		abstract,
		geo_info,
		well_type,
		state_cd,
		gatherer_cd,
		prior_yr_ri,
		prior_yr_wi,
		prior_yr_1_8,
		prior_yr_7_8,
	 	curr_yr_values_are_1_8_7_8,
		curr_yr_value_ri_1_8,
		curr_yr_value_wi_7_8,
		lease_dt,
		participation_pct,
		zero_value,
		comment,
		create_dt
	)
	select
		@input_new_id,
		lease_yr,
		@new_rev_num,
		lease_name,
		operator,
		rrc_number,
		field_id,
		abstract,
		geo_info,	
		well_type,
		state_cd,
		gatherer_cd,
		prior_yr_ri,
		prior_yr_wi,
		prior_yr_1_8,
		prior_yr_7_8,
	 	curr_yr_values_are_1_8_7_8,
		curr_yr_value_ri_1_8,
		curr_yr_value_wi_7_8,
		lease_dt,
		participation_pct,
		zero_value,
		comment,
		getdate()
	from
		lease as l
	where
		l.lease_id = @input_lease_id
	and	l.lease_yr = @input_lease_yr
	and	l.rev_num = @orig_rev_num
end
else
begin
	if @input_lease_yr <> @input_new_yr
	begin
		set @new_rev_num = 0
	end
	else
	begin
		set @new_rev_num = @orig_rev_num + 1
	end

	-- make sure that curr_yr_wi = prior_yr_wi and
	-- curr_yr_ri = prior_yr_ri for new year lease
	insert into
		lease
	(
		lease_id,
		lease_yr,
		rev_num,
		lease_name,
		operator,
		rrc_number,
		field_id,
		abstract,
		geo_info,
		well_type,
		state_cd,
		gatherer_cd,
		prior_yr_ri,
		prior_yr_wi,
		prior_yr_1_8,
		prior_yr_7_8,
	 	curr_yr_values_are_1_8_7_8,
		curr_yr_value_ri_1_8,
		curr_yr_value_wi_7_8,
		lease_dt,
		participation_pct,
		zero_value,
		comment,
		create_dt,
		rev_comment,
		appraiser_id
	)
	select
		@input_new_id,
		@input_new_yr,
		@new_rev_num,
		lease_name,
		operator,
		rrc_number,
		field_id,
		abstract,
		geo_info,	
		well_type,
		state_cd,
		gatherer_cd,
		curr_yr_ri,
		curr_yr_wi,
		curr_yr_1_8,
		curr_yr_7_8,
	 	curr_yr_values_are_1_8_7_8,
		curr_yr_value_ri_1_8,
		curr_yr_value_wi_7_8,
		lease_dt,
		participation_pct,
		zero_value,
		comment,
		getdate(),
		rev_comment,
		appraiser_id
	from
		lease_header_vw as lhv
	where
		lhv.lease_id = @input_lease_id
	and	lhv.lease_yr = @input_lease_yr
	and	lhv.rev_num = @orig_rev_num
end


insert into
	lease_entity_assoc
(
	lease_id,
	lease_yr,
	rev_num,
	entity_id,
	entity_pct
)
select
	@input_new_id,
	@input_new_yr,
	@new_rev_num,
	entity_id,
	entity_pct
from
	lease_entity_assoc as lea
where
	lea.lease_id = @input_lease_id
and	lea.lease_yr = @input_lease_yr
and	lea.rev_num = @orig_rev_num


-- If user is copying lease, create all new property id's.
-- If system is copying lease, just copy lease_prop_assoc.
if @input_lease_id <> @input_new_id
begin
	declare PROP_CURSOR cursor fast_forward
	for
	select
		lpa.prop_id
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
	and	lpa.rev_num = @orig_rev_num
	and	lpa.sup_num = 0
	order by
		lpa.prop_id


	open PROP_CURSOR

	fetch next from PROP_CURSOR
	into
		@prop_id


	while @@fetch_status = 0
	begin
		exec dbo.GetUniqueID 'property', @new_prop_id output, 1, 0

		exec CreatePropertySupplementLayer @prop_id, 0, @input_lease_yr, 0, @input_lease_yr, @new_prop_id, 'F', @input_new_id


		fetch next from PROP_CURSOR
		into
			@prop_id
	end

	close PROP_CURSOR
	deallocate PROP_CURSOR
end
else
begin
	insert into
		lease_prop_assoc
	(
		lease_id,
		lease_yr,
		rev_num,
		sup_num,
		prop_id,
		interest_type_cd,
		interest_pct,
		barrels_per_day
	)
	select
		@input_new_id,
		@input_new_yr,
		@new_rev_num,
		case when @input_lease_yr <> @input_new_yr then 0 else lpa.sup_num end,
		lpa.prop_id,
		interest_type_cd,
		interest_pct,
		barrels_per_day
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
		lease_id = @input_lease_id
	and	lease_yr = @input_lease_yr
	and	rev_num = @orig_rev_num
end

GO

