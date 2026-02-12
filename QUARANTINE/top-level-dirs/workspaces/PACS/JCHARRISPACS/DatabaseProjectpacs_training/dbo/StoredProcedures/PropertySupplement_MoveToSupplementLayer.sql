
create procedure PropertySupplement_MoveToSupplementLayer
 	@input_prop_id int,
 	@input_current_supp int,
 	@input_tax_yr numeric(4,0),
 	@input_new_supp int,
	@szPropType char(5) = null -- If the caller knows the value, it should be passed so this sp doesn't have to query for it
as

set nocount on


declare @sup_cd char(10)
declare @sup_desc varchar(500)
declare @sup_action char(1)
declare @sup_dt datetime
declare @udi_parent char(1)


-- Get current sup information because PropertySupplement_CreatePropertySupplementLayer might stomp on it.
-- Also, get udi_parent information while we're at it.
select
	@sup_cd = sup_cd,
	@sup_desc = sup_desc,
	@sup_action = sup_action,
	@sup_dt = sup_dt,
	@udi_parent = udi_parent
from
	dbo.property_val with (nolock)
where
	prop_id = @input_prop_id
and	prop_val_yr = @input_tax_yr
and	sup_num = @input_current_supp


declare @udi_supplement char(1)
set @udi_supplement = 'F'

-- We need to handle UDI children before the parent so that we can more easily control which children
-- are created in the 'To' supplement, and that those same children AND ONLY THOSE SAME CHILDREN are
-- deleted in the 'From' supplement.
--
-- Note that when 'Moving' child properties between supplements, we'll include deleted and suspended
-- children whose current supplement (i.e., prop_supp_assoc.sup_num) is the same as the 'From' supplement.
if (isnull(@udi_parent, '') in ('D', 'T'))
begin
	set @udi_supplement = 'T'


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
	for read only

	declare @child_prop_id int


	open child_property_cursor

	fetch next from
		child_property_cursor
	into
		@child_prop_id

	while (@@fetch_status = 0)
	begin
		exec dbo.PropertySupplement_CreatePropertySupplement @child_prop_id, @input_current_supp, @input_tax_yr, @input_new_supp, @input_tax_yr, @child_prop_id, 'F', '', 0, 'F', @szPropType, 1
		exec dbo.PropertySupplement_DeletePropertySupplementLayer @child_prop_id, @input_current_supp, @input_tax_yr, 0, @szPropType

		fetch next from
			child_property_cursor
		into
			@child_prop_id
	end

	close child_property_cursor
	deallocate child_property_cursor
end

exec dbo.PropertySupplement_CreatePropertySupplement @input_prop_id, @input_current_supp, @input_tax_yr, @input_new_supp, @input_tax_yr, @input_prop_id, 'F', '', 0, @udi_supplement, @szPropType, 1
exec dbo.PropertySupplement_DeletePropertySupplementLayer @input_prop_id, @input_current_supp, @input_tax_yr, 0, @szPropType


update
	dbo.property_val with (rowlock)
set
	sup_cd = @sup_cd,
	sup_desc = @sup_desc,
	sup_action = @sup_action,
	sup_dt = @sup_dt
where
	prop_id = @input_prop_id
and	prop_val_yr = @input_tax_yr
and	sup_num = @input_new_supp

GO

