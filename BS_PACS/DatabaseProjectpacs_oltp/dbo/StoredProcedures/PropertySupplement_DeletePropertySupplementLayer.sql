
create procedure PropertySupplement_DeletePropertySupplementLayer
 	@input_prop_id int,
	@input_current_supp int,
	@input_tax_yr numeric(4,0),
	@split_merge_flag bit = 0,
	@szPropType char(5) = null -- If the caller knows the value, it should be passed so this sp doesn't have to query for it
as

set nocount on

if not exists
(
	select
		*
	from
		dbo.property_val with (nolock)
	where
		prop_id = @input_prop_id
	and	prop_val_yr = @input_tax_yr
	and	sup_num = @input_current_supp
	and	accept_create_id is null
)
begin
	return(-1)
end


declare @row_count int
declare @num_props int


delete
	daily_batch_prop_assoc
Where
	prop_id = @input_prop_id


declare @udi_parent varchar(1)
set @udi_parent = ''

declare @sup_action varchar(1)
set @sup_action = ''

select
	@udi_parent = udi_parent,
	@sup_action = sup_action
from
	dbo.property_val with (nolock)
where
	prop_id = @input_prop_id
and	prop_val_yr = @input_tax_yr
and	sup_num = @input_current_supp


if (isnull(@udi_parent, '') in ('D', 'T'))
begin
	-- Delete child properties.
	--
	-- NOTE: If this is a 'Move' instead of a 'Remove', then no properties should be
	--	 returned by the cursor as the child properties will be deleted one at a
	--	 time prior to the deletion of the parent property.  This processing is
	--	 controlled through PropertySupplement_MoveToSupplementLayer.
	declare child_property_cursor cursor
	for
		select
			pv.prop_id
		from
			dbo.property_val as pv with (nolock)
		inner join
			dbo.prop_supp_assoc as psa with (nolock)
		on
			psa.prop_id = pv.prop_id
		and	psa.owner_tax_yr = pv.prop_val_yr
		and	psa.sup_num = pv.sup_num
		where
			pv.udi_parent_prop_id = @input_prop_id
		and	pv.prop_val_yr = @input_tax_yr
		and	pv.sup_num = @input_current_supp
		and	isnull(pv.udi_status, '') <> 'S'
	for read only

	declare @child_prop_id int


	open child_property_cursor
	fetch next from child_property_cursor into @child_prop_id
	
	while (@@fetch_status = 0)
	begin
		select
			@row_count = count(*)
		from
			dbo.property_val with (nolock)
		where
			prop_id = @child_prop_id


		if (@row_count = 1)
		begin
			exec dbo.DeleteProperty @child_prop_id
		end
		else
		begin
			exec dbo.DeletePropertySupplementLayer @child_prop_id, @input_current_supp, @input_tax_yr, @split_merge_flag, @szPropType
		end


		fetch next from
			child_property_cursor
		into
			@child_prop_id
	end

	close child_property_cursor
	deallocate child_property_cursor
end


set @row_count = 0


select
	@row_count = count(*)
from
	dbo.property_val with (nolock)
where
	prop_id = @input_prop_id


if ((@row_count = 1) and (@split_merge_flag = 0))
begin
	if (isnull(@udi_parent, '') in ('D', 'T'))
	begin
		update
			dbo.property_val 
		set
			udi_parent_prop_id = null,
			udi_status = ''
		where
			udi_parent_prop_id = @input_prop_id
	end
	

	exec dbo.DeleteProperty @input_prop_id
end
else
begin
	exec dbo.DeletePropertySupplementLayer @input_prop_id, @input_current_supp, @input_tax_yr, @split_merge_flag, @szPropType
end

return(0)

GO

