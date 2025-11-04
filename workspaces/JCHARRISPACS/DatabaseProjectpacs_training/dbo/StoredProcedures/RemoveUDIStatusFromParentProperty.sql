
CREATE procedure RemoveUDIStatusFromParentProperty

	@parent_prop_id int,
	@year numeric(4,0),
	@sup_num int,
	@child_prop_id int

as

set nocount on

declare @default_sup_cd varchar(6)
declare @owner_id int

select top 1 @default_sup_cd = sup_type_cd
from udi_system_settings
with (nolock)

-- First, delete the parent property

update property_val
set prop_inactive_dt = getdate(),
		udi_parent = 'D',
		sup_action = case when @sup_num > 0 then 'D' else sup_action end,
		sup_cd = case when @sup_num > 0 then @default_sup_cd else sup_cd end
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @parent_prop_id

-- Get the current owner of the parent property.  This SP should not
-- be called if there is more than 1 owner on the property.

select @owner_id = owner_id
from owner
with (nolock)
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @parent_prop_id

-- update the child property to not be a "child" property

update property_val
set udi_parent_prop_id = null
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @child_prop_id

-- copy all segments to this former "child" property

exec dbo.CopySegmentsToNewProperty @parent_prop_id, @sup_num, @year, @owner_id,
																		@child_prop_id, @sup_num, @year, @owner_id

-- move all deeds

exec dbo.MoveDeedHistoryFromUDIParentToProperty @parent_prop_id, @child_prop_id,
																								@year, @sup_num

-- move all protests/inquiries

exec dbo.MoveProtestsAndInquiriesFromUDIParentToProperty @parent_prop_id,
																					@child_prop_id, @year, @sup_num

-- move all split history

exec dbo.MoveSplitHistoryFromUDIParentToProperty @parent_prop_id, @child_prop_id,
																					@year, @sup_num

-- move all images

exec dbo.MoveImagesFromUDIParentToProperty @parent_prop_id, @child_prop_id,
																						@year, @sup_num

-- move all building permits

exec dbo.MoveBuildingPermitsFromUDIParentToProperty @parent_prop_id, @child_prop_id,
																					@year, @sup_num

GO

