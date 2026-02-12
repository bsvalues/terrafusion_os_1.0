
CREATE procedure RemoveOwnerFromUDIParent

	@parent_prop_id int,
	@year decimal(4,0),
	@sup_num int,
	@child_prop_id int,
	@child_owner_id int,
	@pacs_user_name varchar(30),
	@pacs_user_id int
	
as

declare @defaultSupCd varchar(6)
declare @percent_type varchar(5)
declare @event_id int

set nocount on

select top 1 @defaultSupCd = sup_type_cd
from udi_system_settings
with (nolock)

-- delete child property from parent
update property_val
set prop_inactive_dt = getdate(),
		sup_action = case when @sup_num > 0 then 'D' else sup_action end,
		sup_cd = case when @sup_num > 0 then @defaultSupCd else sup_cd end
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @child_prop_id

-- copy any segments
select @percent_type = percent_type
from owner
with (nolock)
where owner_tax_yr = @year
and sup_num = @sup_num
and owner_id = @child_owner_id
and prop_id = @child_prop_id

if @percent_type = 'S'
begin
	exec dbo.CopyAssociatedSegmentsToNewProperty @parent_prop_id, @sup_num, @year,
																@child_owner_id, @child_prop_id, @sup_num,
																@year, @child_owner_id
end
else
begin
	exec dbo.CopyOverallOwnerSegmentsToNewProperty @parent_prop_id, @sup_num, @year,
																@child_owner_id, @child_prop_id, @sup_num,
																@year, @child_owner_id
end

-- delete child owner from parent
delete from owner
where owner_tax_yr = @year
and sup_num = @sup_num
and owner_id = @child_owner_id
and prop_id = @parent_prop_id

-- create deletion event
exec dbo.GetUniqueID 'event', @event_id output, 1, 0

if @event_id > 0
begin
	insert event
	(event_id, event_type, pacs_user, event_desc, event_date, pacs_user_id)
	values
	(@event_id, 'DELPROP', @pacs_user_name,
	 'Delete Property: Child Removed from UDI Parent ' + convert(varchar(10), @parent_prop_id),
	 getdate(), @pacs_user_id)

	insert prop_event_assoc
	(prop_id, event_id)
	values
	(@child_prop_id, @event_id)
end

GO

