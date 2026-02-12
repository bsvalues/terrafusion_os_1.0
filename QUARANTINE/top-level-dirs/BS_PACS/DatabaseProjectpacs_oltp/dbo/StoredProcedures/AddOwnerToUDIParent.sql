
CREATE procedure AddOwnerToUDIParent

	@parent_prop_id int,
	@year numeric(4,0),
	@sup_num int,
	@new_owner_id int
	
as

declare @new_child_prop_id int
declare @defaultSupCd varchar(6)

set nocount on

-- first create a new property from the parent for the new child
-- copy new owner from parent to child.
-- update child property_val
-- update parent owner to point to child property

exec dbo.GetUniqueID 'property', @new_child_prop_id output, 1, 0

if @new_child_prop_id > 0
begin
	exec dbo.CopyPropertyToNewProperty @parent_prop_id, @sup_num, @year,
																			@new_child_prop_id, @sup_num, @year
	exec dbo.CopyOwnerToNewProperty @new_owner_id, @parent_prop_id, @sup_num,
																	@year, @new_child_prop_id, @sup_num,
																	@year

	select top 1 @defaultSupCd = sup_type_cd
	from udi_system_settings
	with (nolock)

	update property_val
	set udi_parent_prop_id = @parent_prop_id,
			udi_parent = null,
			udi_status = null,
			prop_inactive_dt = null,
			sup_action = case when @sup_num > 0 then 'A' else sup_action end,
			sup_cd = case when @sup_num > 0 then sup_cd else @defaultSupCd end,
			sup_dt = case when @sup_num > 0 then getdate() else sup_dt end
	where prop_val_yr = @year
	and sup_num = @sup_num
	and prop_id = @new_child_prop_id

	update owner
	set udi_child_prop_id = @new_child_prop_id
	where owner_tax_yr = @year
	and sup_num = @sup_num
	and prop_id = @parent_prop_id
	and owner_id = @new_owner_id
end

GO

