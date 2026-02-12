
CREATE PROCEDURE AppraisalAnalysisExport

	@input_neighborhoods varchar(100),
	@input_classes varchar(100)

as

set nocount on


declare @lCommaPos int
declare @bNeedOR bit
declare @strClasses varchar(200)
declare @strSQL varchar(6000)

set @strClasses = ''
set @bNeedOR = 0

/*
set @input_neighborhoods = 'ALL'
set @input_classes = '99,AG,RD,AL,BN,DC,AA'
*/

set @strSQL = 'select LTRIM(REPLACE(s.situs_display, CHAR(13) + CHAR(10), '' '')) as situs_address, '
set @strSQL = @strSQL + 'p.geo_id as geo_id, '
set @strSQL = @strSQL + 'isnull(pp.living_area,0) as living_area, '
set @strSQL = @strSQL + 'isnull(pp.class_cd,'''') as class, '
set @strSQL = @strSQL + 'isnull(pp.heat_ac_code,'''') as heating_cooling_code, '
set @strSQL = @strSQL + 'isnull(primary_imprv.add_factor,0) as economic_index, '
set @strSQL = @strSQL + 'pp.yr_blt as year_built, '
set @strSQL = @strSQL + 'isnull(pp.condition_cd,'''') as condition_code, '
set @strSQL = @strSQL + 'isnull(primary_imprv.dep_pct,0) as percent_good, '
set @strSQL = @strSQL + 'primary_imprv.physical_pct as physical_adjustment, '
set @strSQL = @strSQL + 'isnull(pp.size_adj_pct,0) as size_adjustment, '
set @strSQL = @strSQL + 'primary_imprv.functional_pct as functional_obsolescence, '
set @strSQL = @strSQL + 'primary_land.ls_code as lot_class_code, '
set @strSQL = @strSQL + 'primary_land.land_adj_factor as land_factor, '
set @strSQL = @strSQL + 'primary_land.mkt_unit_price as land_price, '
set @strSQL = @strSQL + 'isnull(pp.land_sqft,pp.land_acres) as land_size, '
set @strSQL = @strSQL + 'isnull(b.bldg_permit_type_cd,'''') as building_permit_code, '
set @strSQL = @strSQL + 'replace(convert(varchar(9), b.bldg_permit_dt_worked, 6), '' '', ''-'') as date_worked, '
--set @strSQL = @strSQL + 'convert(varchar(2), month(b.bldg_permit_dt_worked)) + ''/'' + convert(varchar(2), day(b.bldg_permit_dt_worked)) + ''/'' + convert(varchar(4), year(b.bldg_permit_dt_worked)) as date_worked, '
set @strSQL = @strSQL + 'isnull(b.bldg_permit_type_cd,'''') as building_permit_type, '
set @strSQL = @strSQL + 'isnull(p.zoning,'''') as zoning_code, '
set @strSQL = @strSQL + 'isnull(pv.land_hstd_val,0) + isnull(pv.land_non_hstd_val,0) as total_land_value, '
set @strSQL = @strSQL + 'isnull(pv.appraised_val,0) as appraised_value, '
set @strSQL = @strSQL + 'pv.hood_cd as neighborhood_code, '
set @strSQL = @strSQL + 'primary_imprv.economic_pct as economic_adjustment, '
set @strSQL = @strSQL + 'ppv.appraised_val as previous_year_value, '
set @strSQL = @strSQL + 'pv.prop_id '

/*

set @strSQL = @strSQL + 'isnull(pp.state_cd,'''') as state_code, '
set @strSQL = @strSQL + 'pv.prop_val_yr - pp.yr_blt as age, '


set @strSQL = @strSQL + 'primary_imprv.imprv_det_adj_factor as effective_percent_good, '
set @strSQL = @strSQL + 'primary_land.eff_price as effective_land_price, '
set @strSQL = @strSQL + 'LTRIM(ISNULL(s.situs_street,'''')) as situs_street, '
set @strSQL = @strSQL + 'LTRIM(ISNULL(s.situs_num,'''')) as situs_num, '
set @strSQL = @strSQL + 'isnull(coopa.imprv_hstd_val,0) + isnull(coopa.imprv_non_hstd_val,0) as total_improvement_value, '
set @strSQL = @strSQL + '(select sum(isnull(imprv_val,0)) from imprv '
set @strSQL = @strSQL + ' with (nolock) '
set @strSQL = @strSQL + ' where prop_id = pv.prop_id '
set @strSQL = @strSQL + ' and prop_val_yr = pv.prop_val_yr '
set @strSQL = @strSQL + ' and sup_num = pv.sup_num '
set @strSQL = @strSQL + ' and sale_id = 0 '
set @strSQL = @strSQL + ' and imprv_type_cd = ''I'') as total_additive_value, '
set @strSQL = @strSQL + 'isnull(coopa.appraised_val,0) as total_property_value, '
set @strSQL = @strSQL + 'primary_imprv.imprv_det_calc_val as replacement_cost_new, '
set @strSQL = @strSQL + 'sa.sl_price as sale_price, '
set @strSQL = @strSQL + 'sa.sl_dt as sale_date, '
set @strSQL = @strSQL + 'rtrim(isnull(sa.sl_financing_cd,'''')) as finance_code, '
set @strSQL = @strSQL + 'sa.sl_type_cd as sale_type, '
set @strSQL = @strSQL + 'ap.appraiser_nm as appraiser_code, '
*/

set @strSQL = @strSQL + 'from property_val as pv '
set @strSQL = @strSQL + 'with (nolock) '

set @strSQL = @strSQL + 'join property as p '
set @strSQL = @strSQL + 'on pv.prop_id = p.prop_id '

set @strSQL = @strSQL + 'join property_profile as pp '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pv.prop_id = pp.prop_id '
set @strSQL = @strSQL + 'and pv.prop_val_yr = pp.prop_val_yr '
set @strSQL = @strSQL + 'and pv.sup_num = pp.sup_num '

set @strSQL = @strSQL + 'join prop_supp_assoc as psa '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pv.prop_id = psa.prop_id '
set @strSQL = @strSQL + 'and pv.prop_val_yr = psa.owner_tax_yr '
set @strSQL = @strSQL + 'and pv.sup_num = psa.sup_num '

set @strSQL = @strSQL + 'join appraiser as ap '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pv.last_appraiser_id = ap.appraiser_id '

set @strSQL = @strSQL + 'join situs as s '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pv.prop_id = s.prop_id '
set @strSQL = @strSQL + 'and s.primary_situs = ''Y'' '

set @strSQL = @strSQL + 'join pacs_system as ps '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pv.prop_val_yr = ps.appr_yr '

set @strSQL = @strSQL + 'join property_val as ppv '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pv.prop_id = ppv.prop_id '
set @strSQL = @strSQL + 'and pv.prop_val_yr -1 = ppv.prop_val_yr '

set @strSQL = @strSQL + 'join prop_supp_assoc as ppsa '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on ppv.prop_id = ppsa.prop_id '
set @strSQL = @strSQL + 'and ppv.prop_val_yr = ppsa.owner_tax_yr '
set @strSQL = @strSQL + 'and ppv.sup_num = ppsa.sup_num '

set @strSQL = @strSQL + 'left outer join (select i.prop_id, i.prop_val_yr, i.sup_num, i.sale_id, '
set @strSQL = @strSQL + 'ii.add_factor, ii.size_adj_pct, ii.physical_pct, '
set @strSQL = @strSQL + 'ii.economic_pct, ii.functional_pct, ii.dep_pct, ii.imprv_det_calc_val, ii.imprv_det_adj_factor  '
set @strSQL = @strSQL + 'from imprv as i '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'join imprv_detail as ii '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on i.prop_id = ii.prop_id '
set @strSQL = @strSQL + 'and i.prop_val_yr = ii.prop_val_yr '
set @strSQL = @strSQL + 'and i.sup_num = ii.sup_num '
set @strSQL = @strSQL + 'and i.imprv_id = ii.imprv_id '
set @strSQL = @strSQL + 'and i.sale_id = ii.sale_id '
set @strSQL = @strSQL + 'where i.imprv_id in '
set @strSQL = @strSQL + '(select top 1 imprv_id '
set @strSQL = @strSQL + ' from imprv '
set @strSQL = @strSQL + ' with (nolock) '
set @strSQL = @strSQL + ' where prop_id = i.prop_id '
set @strSQL = @strSQL + ' and prop_val_yr = i.prop_val_yr '
set @strSQL = @strSQL + ' and sup_num = i.sup_num '
set @strSQL = @strSQL + ' and sale_id = i.sale_id '
set @strSQL = @strSQL + ' order by imprv_val desc) '
set @strSQL = @strSQL + 'and i.sale_id = 0 '
set @strSQL = @strSQL + 'and ii.imprv_det_id in '
set @strSQL = @strSQL + '(select top 1 imprv_det_id '
set @strSQL = @strSQL + ' from imprv_detail '
set @strSQL = @strSQL + ' with (nolock) '
set @strSQL = @strSQL + ' where prop_id = i.prop_id '
set @strSQL = @strSQL + ' and prop_val_yr = i.prop_val_yr '
set @strSQL = @strSQL + ' and sup_num = i.sup_num '
set @strSQL = @strSQL + ' and sale_id = i.sale_id '
set @strSQL = @strSQL + ' and imprv_id = i.imprv_id)) as  primary_imprv '
set @strSQL = @strSQL + 'on pv.prop_id = primary_imprv.prop_id '
set @strSQL = @strSQL + 'and pv.prop_val_yr = primary_imprv.prop_val_yr '
set @strSQL = @strSQL + 'and pv.sup_num = primary_imprv.sup_num '

set @strSQL = @strSQL + 'left outer join (select ld.prop_id, ld.prop_val_yr, ld.sup_num, ls.ls_code, '
set @strSQL = @strSQL + 'ld.mkt_unit_price, ld.land_adj_factor, ld.mkt_unit_price * ld.land_adj_factor as eff_price '
set @strSQL = @strSQL + 'from land_detail as ld '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'join land_sched as ls '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on ld.ls_mkt_id = ls.ls_id '
set @strSQL = @strSQL + 'and ld.prop_val_yr = ls.ls_year '
set @strSQL = @strSQL + 'where ld.sale_id = 0 '
set @strSQL = @strSQL + 'and ld.land_seg_id in '
set @strSQL = @strSQL + '(select top 1 land_seg_id '
set @strSQL = @strSQL + ' from land_detail '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'where prop_id = ld.prop_id '
set @strSQL = @strSQL + 'and prop_val_yr = ld.prop_val_yr '
set @strSQL = @strSQL + 'and sup_num = ld.sup_num '
set @strSQL = @strSQL + 'and sale_id = ld.sale_id '
set @strSQL = @strSQL + 'order by land_seg_mkt_val desc) '
set @strSQL = @strSQL + ') as primary_land '
set @strSQL = @strSQL + 'on pv.prop_id = primary_land.prop_id '
set @strSQL = @strSQL + 'and pv.prop_val_yr = primary_land.prop_val_yr '
set @strSQL = @strSQL + 'and pv.sup_num = primary_land.sup_num '
/*
set @strSQL = @strSQL + 'left outer join chg_of_owner_prop_assoc as coopa '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pv.prop_id = coopa.prop_id '
set @strSQL = @strSQL + 'and pv.prop_val_yr = coopa.sup_tax_yr '
set @strSQL = @strSQL + 'and pv.sup_num = coopa.sup_num '

set @strSQL = @strSQL + 'left outer join sale as sa '
set @strSQL = @strSQL + 'on coopa.chg_of_owner_id = sa.chg_of_owner_id '
*/
set @strSQL = @strSQL + 'left outer join (select top 1 pbpa.prop_id, bp.bldg_permit_type_cd, bp.bldg_permit_dt_worked  '
set @strSQL = @strSQL + 'from prop_building_permit_assoc as pbpa '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'join building_permit as bp '
set @strSQL = @strSQL + 'with (nolock) '
set @strSQL = @strSQL + 'on pbpa.bldg_permit_id = bp.bldg_permit_id '
set @strSQL = @strSQL + 'order by bldg_permit_dt_worked desc) as b '
set @strSQL = @strSQL + 'on pv.prop_id = b.prop_id '

set @strSQL = @strSQL + 'where pv.prop_inactive_dt is null '

if @input_neighborhoods <> '' and @input_neighborhoods <> 'ALL'
begin
	set @input_neighborhoods = '''' + replace(@input_neighborhoods,',',''',''') + ''''
	set @strSQL = @strSQL + 'and pv.hood_cd in (' + @input_neighborhoods + ') '
end

if @input_classes <> '' and @input_classes <> 'ALL'
begin
	set @strSQL = @strSQL + 'and ('

	set @lCommaPos = charindex(',', @input_classes, 1)
	if @lCommaPos > 0
	begin
		while @lCommaPos > 0
		begin
			if @bNeedOR = 1
			begin
				set @strSQL = @strSQL + ' or '
			end

			set @strSQL = @strSQL + 'pp.class_cd like ''' + rtrim(left(@input_classes, @lCommaPos - 1)) + '%'' '
			set @input_classes = ltrim(right(@input_classes, len(@input_classes) - @lCommaPos))

			set @lCommaPos = charindex(',', @input_classes, 1)
			set @bNeedOR = 1
		end
	end
	else
	begin
		set @strSQL = @strSQL + 'pp.class_cd like ''' + @input_classes + '%'' '
	end

	set @strSQL = @strSQL + ') '
end

exec(@strSQL)

GO

