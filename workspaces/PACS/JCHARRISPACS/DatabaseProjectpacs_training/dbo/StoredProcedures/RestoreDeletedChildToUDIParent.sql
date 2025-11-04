create procedure RestoreDeletedChildToUDIParent

	@child_prop_id int,
	@year numeric(4,0),
	@sup_num int,
	@parent_prop_id int,
	@owner_id int

as

declare @prev_prop_inactive_dt datetime
declare @prev_sup_num int
declare @curr_prop_inactive_dt datetime
declare @bAlreadyExisted bit
declare @prev_prop_id int
declare @default_sup_cd varchar(6)

select top 1 @default_sup_cd = sup_type_cd
from udi_system_settings
with (nolock)

set nocount on

-- copy the child's owner back to the UDI Parent

exec dbo.CopyOwnerToNewProperty @owner_id, @child_prop_id, @sup_num, @year,
																@parent_prop_id, @sup_num, @year

-- link parent owner with child property

update owner
set udi_child_prop_id = @child_prop_id
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @parent_prop_id
and owner_id = @owner_id

exec dbo.DeletePropertySegments @child_prop_id, @sup_num, @year

set @bAlreadyExisted = 0

if @sup_num > 0
begin
	select @prev_sup_num = prev_sup_num,
					@curr_prop_inactive_dt = prop_inactive_dt
	from property_val
	with (nolock)
	where prop_val_yr = @year
	and sup_num = @sup_num
	and prop_id = @child_prop_id

	select @prev_prop_inactive_dt = prop_inactive_dt,
					@prev_prop_id = prop_id
	from property_val
	with (nolock)
	where prop_val_yr = @year
	and sup_num = @prev_sup_num
	and prop_id = @child_prop_id

	-- @prev_prop_id is just a test to see if the property existed
	-- previously.  This could have been supplemented in...

	if @prev_prop_id > 0 and @prev_prop_inactive_dt is null
	begin
		set @bAlreadyExisted = 1
	end
end

update property_val
set prop_inactive_dt = null,
		sup_action = case when @bAlreadyExisted = 1 then 'M' else 'A' end,
		sup_cd = case when @bAlreadyExisted = 1 then @default_sup_cd else sup_cd end
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @child_prop_id

GO

