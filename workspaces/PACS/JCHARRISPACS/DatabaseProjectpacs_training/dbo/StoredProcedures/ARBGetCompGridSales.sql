

create procedure ARBGetCompGridSales
	@lYear numeric(4,0),
	@lCaseID int,
	@bInquiry bit
as

set nocount on

	declare @lPropID int
	/* Get the property ID */
	if ( @bInquiry = 1 )
	begin
		select
			@lPropID = prop_id
		from _arb_inquiry with(nolock)
		where
			prop_val_yr = @lYear and
			case_id = @lCaseID
	end
	else
	begin
		select
			@lPropID = prop_id
		from _arb_protest with(nolock)
		where
			prop_val_yr = @lYear and
			case_id = @lCaseID
	end

set nocount off

	/* Get the sales information associated with the default comp grid for the property */
	select
		sale.chg_of_owner_id,
		isnull(situs.situs_num, '') + ' ' + situs.situs_street,
		sale.sl_dt,
		pp.living_area,
		sale.sl_price
	from comp_sales_property_grids as grids with(nolock)
	join comparable_grid_prop_year_comptype as defgrid with(nolock) on
		defgrid.lYear = grids.lYear and
		defgrid.lPropID = grids.lSubjectPropID and
		defgrid.szCompType = grids.comparison_type and
		defgrid.lPropGridID = grids.lPropGridID
	join comp_sales_property as props with(nolock) on
		grids.lPropGridID = props.lPropGridID
	join sale with(nolock) on
		props.lSaleID = sale.chg_of_owner_id
	join property_profile as pp with(nolock) on
		pp.prop_id = props.lCompPropID and
		pp.prop_val_yr = @lYear and
		pp.sup_num = 0
	left outer join situs with(nolock) on
		situs.prop_id = props.lCompPropID and
		situs.primary_situs = 'Y'
	where
		grids.lSubjectPropID = @lPropID and
		grids.lYear = @lYear

GO

