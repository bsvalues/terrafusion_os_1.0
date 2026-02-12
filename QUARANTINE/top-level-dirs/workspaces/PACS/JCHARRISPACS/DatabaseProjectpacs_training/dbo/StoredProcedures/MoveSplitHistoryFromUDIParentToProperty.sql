
create procedure MoveSplitHistoryFromUDIParentToProperty
	@input_parent_prop_id int,
 	@input_child_prop_id int,
	@input_prop_val_yr numeric(4,0),
	@input_sup_num int
with recompile

as


declare @parent_prop_id int
declare @sibling_prop_id int
declare @child_prop_id int
declare @split_id int
declare @split_dt datetime
declare @before_legal_acres numeric(14,4)
declare @before_legal_desc varchar(255)
declare @before_owner varchar(2048)
declare @after_legal_acres numeric(14,4)
declare @after_legal_desc varchar(255)
declare @after_owner varchar(2048)




declare PARENTSPLIT cursor
for
select
	parent_sa.prop_id,
	child_pv.prop_id,
	parent_sa.split_id,
	parent_sa.split_dt,
	parent_sa.before_legal_acres,
	parent_sa.before_legal_desc,
	parent_sa.before_owner,
	parent_sa.after_legal_acres,
	parent_sa.after_legal_desc,
	parent_sa.after_owner
from
	split_assoc as parent_sa
inner join
	property_val as parent_pv
on
	parent_pv.prop_id = parent_sa.prop_id
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
	parent_sa.prop_id = @input_parent_prop_id
for update


open PARENTSPLIT
fetch next from PARENTSPLIT
into
	@parent_prop_id,
	@child_prop_id,
	@split_id,
	@split_dt,
	@before_legal_acres,
	@before_legal_desc,
	@before_owner,
	@after_legal_acres,
	@after_legal_desc,
	@after_owner

while (@@fetch_status = 0)
begin
	if not exists
	(
		select
			*
		from
			split_assoc as child_sa with (nolock)
		where
			child_sa.prop_id = @child_prop_id
		and	child_sa.split_id = @split_id
	)
	begin
		--	If the child was not already part of the split, create a matching
		--	split_assoc row for the child.  We can't update the prop_id because
		--	of foreign key constraints associated with the split_into table.
		insert into
			split_assoc
		(
			prop_id,
			split_id,
			split_dt,
			before_legal_acres,
			before_legal_desc,
			before_owner,
			after_legal_acres,
			after_legal_desc,
			after_owner
		)
		values
		(
			@child_prop_id,
			@split_id,
			@split_dt,
			@before_legal_acres,
			@before_legal_desc,
			@before_owner,
			@after_legal_acres,
			@after_legal_desc,
			@after_owner
		)


		--	Now that we have a split_assoc row for the child, we are able
		--	to update the parent_id on the parent's split into rows without
		--	violating the foreign key constraint.
		update
			split_into
		set
			parent_id = @child_prop_id
		from
			split_into as parent_si with (nolock)
		inner join
			split_assoc as parent_sa with (nolock)
		on
			parent_sa.prop_id = parent_si.parent_id
		and	parent_sa.split_id = parent_si.split_id
		inner join
			split_assoc as child_sa with (nolock)
		on
			child_sa.prop_id = @child_prop_id
		and	child_sa.split_id = parent_sa.split_id
		where
			parent_si.split_id = @split_id
		and	parent_si.parent_id = @parent_prop_id
	end


	--	Delete the split_assoc row for the parent.
	delete
		split_assoc
	where
		current of PARENTSPLIT


	fetch next from PARENTSPLIT
	into
		@parent_prop_id,
		@child_prop_id,
		@split_id,
		@split_dt,
		@before_legal_acres,
		@before_legal_desc,
		@before_owner,
		@after_legal_acres,
		@after_legal_desc,
		@after_owner
end


close PARENTSPLIT
deallocate PARENTSPLIT
	



declare SIBLINGSPLIT cursor
for
select
	sibling_sa.prop_id,
	child_pv.prop_id,
	sibling_sa.split_id,
	sibling_sa.split_dt,
	sibling_sa.before_legal_acres,
	sibling_sa.before_legal_desc,
	sibling_sa.before_owner,
	sibling_sa.after_legal_acres,
	sibling_sa.after_legal_desc,
	sibling_sa.after_owner
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
	split_assoc as sibling_sa
on
	sibling_sa.prop_id = sibling_pv.prop_id
where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
for update


open SIBLINGSPLIT
fetch next from SIBLINGSPLIT
into
	@sibling_prop_id,
	@child_prop_id,
	@split_id,
	@split_dt,
	@before_legal_acres,
	@before_legal_desc,
	@before_owner,
	@after_legal_acres,
	@after_legal_desc,
	@after_owner

while (@@fetch_status = 0)
begin
	if not exists
	(
		select
			*
		from
			split_assoc as child_sa with (nolock)
		where
			child_sa.prop_id = @child_prop_id
		and	child_sa.split_id = @split_id
	)
	begin
		--	If the child was not already part of the split, create a matching
		--	split_assoc row for the child.  We can't update the prop_id because
		--	of foreign key constraints associated with the split_into table.
		insert into
			split_assoc
		(
			prop_id,
			split_id,
			split_dt,
			before_legal_acres,
			before_legal_desc,
			before_owner,
			after_legal_acres,
			after_legal_desc,
			after_owner
		)
		values
		(
			@child_prop_id,
			@split_id,
			@split_dt,
			@before_legal_acres,
			@before_legal_desc,
			@before_owner,
			@after_legal_acres,
			@after_legal_desc,
			@after_owner
		)


		--	Now that we have a split_assoc row for the child, we are able
		--	to update the parent_id on the sibling's split into rows without
		--	violating the foreign key constraint.
		update
			split_into
		set
			parent_id = @child_prop_id
		from
			split_into as sibling_si with (nolock)
		inner join
			split_assoc as sibling_sa with (nolock)
		on
			sibling_sa.prop_id = sibling_si.parent_id
		and	sibling_sa.split_id = sibling_si.split_id
		inner join
			split_assoc as child_sa with (nolock)
		on
			child_sa.prop_id = @child_prop_id
		and	child_sa.split_id = sibling_sa.split_id
		where
			sibling_si.split_id = @split_id
		and	sibling_si.parent_id = @sibling_prop_id
	end


	--	Delete the split_assoc row for the sibling.
	delete
		split_assoc
	where
		current of SIBLINGSPLIT


	fetch next from SIBLINGSPLIT
	into
		@sibling_prop_id,
		@child_prop_id,
		@split_id,
		@split_dt,
		@before_legal_acres,
		@before_legal_desc,
		@before_owner,
		@after_legal_acres,
		@after_legal_desc,
		@after_owner
end


close SIBLINGSPLIT
deallocate SIBLINGSPLIT

GO

