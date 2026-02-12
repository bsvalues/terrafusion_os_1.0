
create view comp_grid_comp_count_vw
as

	select distinct cg.lPropGridID, lCompCount = count(cgp.lID)
	from comp_sales_property_grids as cg with(nolock)
	left outer join comp_sales_property as cgp with(nolock) on
		cgp.lPropGridID = cg.lPropGridID
	group by cg.lPropGridID

GO

