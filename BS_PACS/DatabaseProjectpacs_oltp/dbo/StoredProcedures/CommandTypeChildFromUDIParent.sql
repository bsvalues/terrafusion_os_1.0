CREATE procedure CommandTypeChildFromUDIParent

	@commandType varchar(10),
	@parent_prop_id int,
	@year numeric(4,0),
	@sup_num int,
	@owner_id int,
	@child_prop_id int

as

set nocount on

declare @percent_type varchar(1)
declare @pct_ownership numeric(13,10)

select @percent_type = percent_type,
				@pct_ownership = pct_ownership
from owner
with (nolock)
where owner_tax_yr = @year
and sup_num = @sup_num
and prop_id = @parent_prop_id
and owner_id = @owner_id

if @percent_type = 'S'
begin
	exec dbo.CopyAssociatedSegmentsToNewProperty @parent_prop_id, @sup_num, @year,
																								@owner_id, @child_prop_id,
																								@sup_num, @year, @owner_id
end
else
begin
	exec dbo.CopyOverallOwnerSegmentsToNewProperty @parent_prop_id, @sup_num, @year,
																								@owner_id, @child_prop_id,
																								@sup_num, @year, @owner_id
end

if @commandType = 'Remove'
begin
	update owner
	set percent_type = @percent_type,
			pct_ownership = @pct_ownership
	where owner_tax_yr = @year
	and sup_num = @sup_num
	and prop_id = @child_prop_id
	and owner_id = @owner_id

	delete
	from owner
	where owner_tax_yr = @year
	and sup_num = @sup_num
	and prop_id = @parent_prop_id
	and owner_id = @owner_id

	update property_val
	set udi_parent_prop_id = null
	where prop_val_yr = @year	
	and sup_num = @sup_num
	and prop_id = @child_prop_id
end
else if @commandType = 'Suspend'
begin
	update property_val
	set udi_status = 'S'
	where prop_val_yr = @year
	and sup_num = @sup_num
	and prop_id = @child_prop_id
end

GO

