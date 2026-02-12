
create procedure MoveBuildingPermitsFromUDIParentToProperty
	@input_parent_prop_id int,
 	@input_child_prop_id int,
	@input_prop_val_yr numeric(4,0),
	@input_sup_num int
with recompile

as


declare @bldg_permit_id int
declare @parent_prop_id int
declare @sibling_prop_id int
declare @child_prop_id int


declare PARENTPERMIT cursor
for
select
	parent_pbpa.bldg_permit_id,
	parent_pbpa.prop_id,
	child_pv.prop_id
from
	prop_building_permit_assoc as parent_pbpa
inner join
	property_val as parent_pv
on
	parent_pv.prop_id = parent_pbpa.prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
where
	parent_pbpa.prop_id = @input_parent_prop_id
for update


open PARENTPERMIT
fetch next from PARENTPERMIT
into
	@bldg_permit_id,
	@parent_prop_id,
	@child_prop_id

while (@@fetch_status = 0)
begin
	if not exists
	(
		select
			*
		from
			prop_building_permit_assoc as child_pbpa with (nolock)
		where
			child_pbpa.bldg_permit_id = @bldg_permit_id
		and	child_pbpa.prop_id = @child_prop_id
	)
	begin
		update
			prop_building_permit_assoc
		set
			prop_id = @child_prop_id
		where
			current of PARENTPERMIT
	end
	else
	begin
		delete
			prop_building_permit_assoc
		where
			current of PARENTPERMIT
	end


	fetch next from PARENTPERMIT
	into
		@bldg_permit_id,
		@parent_prop_id,
		@child_prop_id
end


close PARENTPERMIT
deallocate PARENTPERMIT




declare SIBLINGPERMIT cursor
for
select
	sibling_pbpa.bldg_permit_id,
	sibling_pbpa.prop_id,
	child_pv.prop_id
from
	property_val as parent_pv
inner join
	property_val as child_pv
on
	child_pv.prop_id = @input_child_prop_id
and	child_pv.prop_val_yr = parent_pv.prop_val_yr
and	child_pv.sup_num = parent_pv.sup_num
and	
(
	isnull(child_pv.udi_parent_prop_id, -1) = parent_pv.prop_id
or	isnull(child_pv.udi_parent_prop_id, -1) <= 0
)
inner join
	property_val as sibling_pv
on
	sibling_pv.prop_id <> child_pv.prop_id
and	sibling_pv.prop_val_yr = child_pv.prop_val_yr
and	sibling_pv.sup_num = child_pv.sup_num
and	sibling_pv.udi_parent_prop_id = parent_pv.prop_id
and	isnull(sibling_pv.udi_status, '') <> 'S'
inner join
	prop_building_permit_assoc as sibling_pbpa
on
	sibling_pbpa.prop_id = sibling_pv.prop_id
where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
for update


open SIBLINGPERMIT
fetch next from SIBLINGPERMIT
into
	@bldg_permit_id,
	@sibling_prop_id,
	@child_prop_id

while (@@fetch_status = 0)
begin
	if not exists
	(
		select
			*
		from
			prop_building_permit_assoc as child_pbpa with (nolock)
		where
			child_pbpa.bldg_permit_id = @bldg_permit_id
		and	child_pbpa.prop_id = @child_prop_id
	)
	begin
		update
			prop_building_permit_assoc
		set
			prop_id = @child_prop_id
		where
			current of SIBLINGPERMIT
	end
	else
	begin
		delete
			prop_building_permit_assoc
		where
			current of SIBLINGPERMIT
	end


	fetch next from SIBLINGPERMIT
	into
		@bldg_permit_id,
		@sibling_prop_id,
		@child_prop_id
end



close SIBLINGPERMIT
deallocate SIBLINGPERMIT

GO

