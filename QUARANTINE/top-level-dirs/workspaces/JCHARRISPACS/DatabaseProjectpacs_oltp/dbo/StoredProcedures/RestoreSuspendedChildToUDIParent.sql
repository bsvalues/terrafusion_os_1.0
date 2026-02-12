create procedure RestoreSuspendedChildToUDIParent

	@child_prop_id int,
	@year numeric(4,0),
	@sup_num int

as

set nocount on

update property_val
set udi_status = null
where prop_val_yr = @year
and sup_num = @sup_num
and prop_id = @child_prop_id

exec dbo.DeletePropertySegments @child_prop_id, @sup_num, @year

GO

