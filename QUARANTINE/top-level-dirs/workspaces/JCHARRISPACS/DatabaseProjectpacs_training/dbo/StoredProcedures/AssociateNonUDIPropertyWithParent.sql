create procedure AssociateNonUDIPropertyWithParent

	@parent_prop_id int,
	@year numeric(4,0),
	@sup_num int,
	@associate_prop_id int
as

set nocount on
set XACT_ABORT ON

-- local variable declarations

declare @associate_owner_id int
declare @new_segment_id int
declare @segment_id int

-- associate the child with the parent

update property_val
set udi_parent_prop_id = @parent_prop_id
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @associate_prop_id

-- copy owner if not already one in UDI Parent

select @associate_owner_id = owner_id
from owner
with (nolock)
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @associate_prop_id

if @associate_owner_id > 0
begin
	if not(exists(select owner_id
					from owner
					with (nolock)
					where owner_tax_yr = @year
					and sup_num = @sup_num
					and prop_id = @parent_prop_id
					and owner_id = @associate_owner_id))
	begin
		exec dbo.LayerCopyTableOwner
					@year,
					@sup_num,
					@associate_prop_id,
					@year,
					@sup_num,
					@parent_prop_id,
					@associate_owner_id, -- Copy from specific owner
					1 -- Copy roll_* columns

		update owner
		set percent_type = 'S',
			udi_child_prop_id = @associate_prop_id
		where owner_tax_yr = @year
		and sup_num = @sup_num
		and prop_id = @parent_prop_id
		and owner_id = @associate_owner_id
	end
end

set XACT_ABORT OFF

GO

