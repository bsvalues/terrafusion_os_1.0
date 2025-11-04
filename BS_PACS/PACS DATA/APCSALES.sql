
CREATE PROCEDURE APCSALES

	@input_case_id int,
	@ID1 int,
	@ID2 int = NULL
with recompile
as

DECLARE @input_year int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @input_year = @ID1
else
begin
	set @input_year = @ID2
	set @prot_by_id = @ID1
end

declare @prop_id int

SELECT @prop_id = prop_id
FROM _arb_protest
WITH (NOLOCK)
WHERE case_id = @input_case_id
AND prop_val_yr = @input_year

select grids.lsubjectpropid as subject_prop_id,
		LTRIM(REPLACE(s.situs_display, CHAR(13) + CHAR(10), ' ')) as subject_situs,
		LEFT(CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, pp.living_area), 1), 1) - 1) as subject_ma,
		prop.lcomppropid as sale_prop_id,
		LTRIM(REPLACE(cs.situs_display, CHAR(13) + CHAR(10), ' ')) as sale_situs,
		convert(varchar(10), sale.sl_dt, 101) as sale_dt,
		LEFT(CONVERT(varchar(20), CONVERT(money, spp.living_area), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, spp.living_area), 1), 1) - 1) as sale_ma,
		case when exists(select imprv_det_type_cd
							from imprv_detail
							with (nolock)
							where prop_id = prop.lcomppropid
							and prop_val_yr = spp.prop_val_yr
							and sup_num = comppsa.sup_num
							and imprv_det_type_cd = 'PL')
			then 'Y'
			else 'N'
			end as pool_flag,
		LEFT(CONVERT(varchar(20), CONVERT(money, sale.sl_price), 1), CHARINDEX('.', CONVERT(varchar(20), CONVERT(money, sale.sl_price), 1), 1) - 1) as sale_price

from comp_sales_property_grids as grids with(nolock)

join comparable_grid_prop_year_comptype as defgrid with(nolock) on
	defgrid.lYear = grids.lYear and
	defgrid.lPropID = grids.lSubjectPropID and
	defgrid.szCompType = grids.comparison_type and
	defgrid.lPropGridID = grids.lPropGridID

inner join comp_sales_property as prop
with (nolock)
on grids.lpropgridid = prop.lpropgridid

inner join property_profile as pp
with (nolock)
on grids.lsubjectpropid = pp.prop_id
and pp.prop_val_yr = @input_year

inner join sale
with (nolock)
on prop.lsaleid = sale.chg_of_owner_id

inner join property_profile as spp
with (nolock)
on prop.lcomppropid = spp.prop_id
and spp.prop_val_yr = @input_year

join prop_supp_assoc as comppsa with(nolock) on
	comppsa.owner_tax_yr = spp.prop_val_yr and
	comppsa.prop_id = spp.prop_id

left outer join situs as s
with (nolock)
on grids.lsubjectpropid = s.prop_id
and s.primary_situs = 'Y'

left outer join situs as cs
with (nolock)
on prop.lcomppropid = cs.prop_id
and cs.primary_situs = 'Y'

where grids.lsubjectpropid = @prop_id
and grids.lYear = @input_year

order by prop.lid, prop.lpropgridid

GO

