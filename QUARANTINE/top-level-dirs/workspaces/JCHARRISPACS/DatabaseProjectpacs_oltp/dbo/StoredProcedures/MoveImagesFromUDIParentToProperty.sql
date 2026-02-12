
create procedure MoveImagesFromUDIParentToProperty
	@input_parent_prop_id int,
 	@input_child_prop_id int,
	@input_prop_val_yr numeric(4,0),
	@input_sup_num int
with recompile

as


declare @ref_id int
declare @ref_type varchar(2)
declare @image_id int
declare @system_type char(5)
declare @child_prop_id int


declare PARENTIMAGE cursor
for
select
	parent_pi.ref_id,
	parent_pi.ref_type,
	parent_pi.image_id,
	parent_pi.system_type,
	child_pv.prop_id
from
	pacs_image as parent_pi
inner join
	property_val as parent_pv
on
	parent_pv.prop_id = parent_pi.ref_id
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
	parent_pi.ref_id = @input_parent_prop_id
and	parent_pi.ref_type = 'P'
for update




open PARENTIMAGE
fetch next from PARENTIMAGE
into
	@ref_id,
	@ref_type,
	@image_id,
	@system_type,
	@child_prop_id

while (@@fetch_status = 0)
begin
	if not exists
	(
		select
			*
		from
			pacs_image as child_pi with (nolock)
		where
			child_pi.ref_id = @child_prop_id
		and	child_pi.ref_type = @ref_type
		and	child_pi.image_id = @image_id
		and	child_pi.system_type = @system_type
	)
	begin
		update
			pacs_image
		set
			ref_id = @child_prop_id
		where
			current of PARENTIMAGE
	end
	else
	begin
		delete
			pacs_image
		where
			current of PARENTIMAGE
	end


	fetch next from PARENTIMAGE
	into
		@ref_id,
		@ref_type,
		@image_id,
		@system_type,
		@child_prop_id
end


close PARENTIMAGE
deallocate PARENTIMAGE




declare SIBLINGIMAGE cursor
for
select
	sibling_pi.ref_id,
	sibling_pi.ref_type,
	sibling_pi.image_id,
	sibling_pi.system_type,
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
	pacs_image as sibling_pi
on
	sibling_pi.ref_id = sibling_pv.prop_id
and	sibling_pi.ref_type = 'P'
where
	parent_pv.prop_id = @input_parent_prop_id
and	parent_pv.prop_val_yr = @input_prop_val_yr
and	parent_pv.sup_num = @input_sup_num
and	isnull(parent_pv.udi_parent, '') in ('D', 'T')
for update


open SIBLINGIMAGE
fetch next from SIBLINGIMAGE
into
	@ref_id,
	@ref_type,
	@image_id,
	@system_type,
	@child_prop_id

while (@@fetch_status = 0)
begin
	if not exists
	(
		select
			*
		from
			pacs_image as child_pi with (nolock)
		where
			child_pi.ref_id = @child_prop_id
		and	child_pi.ref_type = @ref_type
		and	child_pi.image_id = @image_id
		and	child_pi.system_type = @system_type
	)
	begin
		update
			pacs_image
		set
			ref_id = @child_prop_id
		where
			current of SIBLINGIMAGE
	end
	else
	begin
		delete
			pacs_image
		where
			current of SIBLINGIMAGE
	end


	fetch next from SIBLINGIMAGE
	into
		@ref_id,
		@ref_type,
		@image_id,
		@system_type,
		@child_prop_id
end


close SIBLINGIMAGE
deallocate SIBLINGIMAGE

GO

