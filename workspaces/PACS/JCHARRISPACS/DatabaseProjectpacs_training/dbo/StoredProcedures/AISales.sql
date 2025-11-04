

CREATE  procedure AISales
	@lCaseID int,
	@ID1 int,
	@ID2 int = NULL
as

DECLARE @lYear int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @lYear = @ID1
else
begin
	set @lYear = @ID2
	set @prot_by_id = @ID1
end


set nocount on

	declare @lPropID int
	
	select
		@lPropID = prop_id
	from _arb_inquiry with(nolock)
	where
		prop_val_yr = @lYear and
		case_id = @lCaseID
	
set nocount off

	/* Get the sales information associated with the default comp grid for the property */
	select
		sale.chg_of_owner_id,
		isnull(situs.situs_num, '') + ' ' + situs.situs_street as situs,
		sale.sl_dt,
		pp.living_area,

LEFT(CONVERT(varchar(20), CONVERT(money, sale.sl_price), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, sale.sl_price), 1), 1) - 1) as sl_price


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
		pp.prop_val_yr = @lYear 
	left outer join situs with(nolock) on
		situs.prop_id = props.lCompPropID and
		situs.primary_situs = 'Y'
	where
		grids.lSubjectPropID = @lPropID and
		grids.lYear = @lYear

GO

