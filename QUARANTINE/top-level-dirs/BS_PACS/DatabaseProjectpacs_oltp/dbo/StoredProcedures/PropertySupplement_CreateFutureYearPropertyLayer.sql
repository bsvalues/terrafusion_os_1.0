
create procedure PropertySupplement_CreateFutureYearPropertyLayer
	@lInputPropID int,
	@lInputCurrentSupp int,
	@lInputFromYear numeric(4,0),
	@lInputActualFutureYear numeric(4,0), -- Might be able to remove
	@lInputPropertyUDIParent varchar(1) = null,
	@bImportPropertyProfile bit = 1,
	@szPropType char(5) = null -- If the caller knows the value, it should be passed so this sp doesn't have to query for it
as


set nocount on


declare @lFutureYear numeric(4,0)
set @lFutureYear = 0


if exists
(
	select
		prop_val_yr
	from
		dbo.property_val with (nolock)
	where
		prop_id = @lInputPropID
	and	prop_val_yr = @lFutureYear
	and	sup_num = 0
)
begin
	return(-1)
end


exec dbo.CreateFutureYearPropertyLayer @lInputPropID, @lInputCurrentSupp, @lInputFromYear, @lInputActualFutureYear, @bImportPropertyProfile, @szPropType


if (@lInputPropertyUDIParent is null)
begin
	select
		@lInputPropertyUDIParent = udi_parent
	from
		dbo.property_val with (nolock)
	where
		prop_id = @lInputPropID
	and	prop_val_yr = @lInputFromYear
	and	sup_num = @lInputCurrentSupp
end


if (@lInputPropertyUDIParent in ('D', 'T'))
begin
	-- move child properties
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
		pv.prop_val_yr = @lInputFromYear
	and	pv.sup_num = @lInputCurrentSupp
	and	pv.udi_parent_prop_id = @lInputPropID
	for read only


	declare @lChildPropID int

	open child_property_cursor
	fetch next from
		child_property_cursor
	into
		@lChildPropID
	

	while (@@fetch_status = 0)
	begin
		exec dbo.CreateFutureYearPropertyLayer @lChildPropID, @lInputCurrentSupp, @lInputFromYear, @lInputActualFutureYear, 0, @szPropType
		
		fetch next from
			child_property_cursor
		into
			@lChildPropID
	end

	close child_property_cursor
	deallocate child_property_cursor
end

GO

