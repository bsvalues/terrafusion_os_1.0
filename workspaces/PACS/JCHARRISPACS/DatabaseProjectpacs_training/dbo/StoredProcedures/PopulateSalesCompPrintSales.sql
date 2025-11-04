

create procedure dbo.PopulateSalesCompPrintSales
	@subject_prop_id int,
	@subject_prop_year numeric(4,0),
	@input_user_id int,
	@where_clause varchar(4000),
	@source_flag varchar(1) = 'S',
	@debug_flag varchar(1) = 'F',
	@bAutoGrid bit = 0
as

set nocount on

--If @source_flag = 'S', then populate the sales_comp_print value information with values from the sales record
--If @source_flag = 'P', then populate the sales_comp_print value information with values from the property_val record

--Declare stored procedure variables
declare @exec_sql varchar(8000)

delete #sales_comp_print with(tablockx)

--Prepare the SQL to be executed
if (@source_flag = 'S')
begin
	set @exec_sql = '
	insert into #sales_comp_print with(tablockx)
	(
		prop_id,
		year,
		geo_id,
		owner,
		situs,
		situs_street,
		school,
		city,
		state_cd,
		region,
		abs_subdv,
		hood,
		subset,
		map_id,
		imprv_class,
		living_area,
		year_built,
		imprv_up,
		imprv_val,
		imprv_add_val,
		land_type,
		land_sqft,
		land_front_feet,
		land_acres,
		land_lot,
		land_size,
		land_up,
		land_val,
		land_val_per_area,
		land_sale_val_per_area,
		appraised_val,
		appraised_val_per_sqft,
		sale_type,
		sale_date,
		sale_price,
		sale_price_per_sqft,
		sale_ratio,
		score,
		print_flag,
		sequence_num,
		sale_id,
		condition_cd,
		percent_complete,
		ls_table,
		main_land_unit_price,
		main_land_total_adj,
		size_adj_pct,
		improv_value,
		effective_land_price,
		heat_ac_code,
		sale_ratio_code,
		imprv_sub_class,
		imprv_type_cd,
		udi_type
	)
	select
		property_profile.prop_id,
		property_profile.prop_val_yr,
		property.geo_id,
		cast(account.file_as_name as varchar(50)),
		cast(
			case
				when
					situs.situs_display is not null
				then
					replace(situs.situs_display, char(13) + char(10), '' '')
				else
					''''
			end as varchar(173)
		),
		cast(situs.situs_street as varchar(50)),
		school_entity.entity_cd,
		city_entity.entity_cd,
		sale.sl_state_cd,
		property_val.rgn_cd,
		property_val.abs_subdv_cd,
		property_val.hood_cd,
		property_val.subset_cd,
		property_val.map_id,
		sale.sl_class_cd,
		sale.sl_living_area,
		sale.sl_yr_blt,
		sale.sl_imprv_unit_price,
		cast(
			case
				when (
					isnull(property_val.imprv_hstd_val, 0) +
					isnull(property_val.imprv_non_hstd_val, 0)
				) > 0
				then (
					isnull(property_val.imprv_hstd_val, 0) +
					isnull(property_val.imprv_non_hstd_val, 0)
				)
				else
					0
			end as varchar(50)
		) as imprv_val,
		property_profile.imprv_add_val,
		sale.sl_land_type_cd,
		sale.sl_land_sqft,
		sale.sl_land_front_feet,
		sale.sl_land_acres,
		null,
		case
			when 
				isnull(property_profile.land_appr_method,'''') = ''LOT''
			then
				cast(isnull(property_profile.land_num_lots, 0) as varchar(50))
			when
				isnull(sale.sl_land_sqft, 0) > 0
			then
				cast(sale.sl_land_sqft as varchar(50))
			when
				isnull(sale.sl_land_acres, 0) > 0
			then
				cast(sale.sl_land_acres as varchar(50))
			when
				isnull(sale.sl_land_front_feet, 0) > 0
			then
				cast(sale.sl_land_front_feet as varchar(50))
			else
				cast(0 as varchar(50))
		end as land_size,
		sale.sl_land_unit_price,
		cast(
			case
				when (
					isnull(property_val.land_hstd_val, 0) +
					isnull(property_val.land_non_hstd_val, 0) +
					isnull(property_val.ag_market, 0) +
					isnull(property_val.timber_market, 0)
				) > 0
				then (
					isnull(property_val.land_hstd_val, 0) +
					isnull(property_val.land_non_hstd_val, 0) +
					isnull(property_val.ag_market, 0) +
					isnull(property_val.timber_market, 0)
				)
				else
					0
			end as varchar(50)
		) as land_val,
		0,
		0,
		property_val.market,
		0,
		sale.sl_type_cd,
		convert(varchar(50), sale.sl_dt, 101) as sl_dt,
		sale.sl_price,
		0,
		cast(
			case
				when
					isnull(sale.adjusted_sl_price, 0) > 0
				then (
					isnull(property_val.market, 0) / isnull(sale.adjusted_sl_price, 0)
				)
			end as numeric(12,4)
		) as sl_ratio,
		0,
		''F'',
		0,
		sale.chg_of_owner_id,
		property_profile.condition_cd,
		property_profile.percent_complete,
		property_profile.ls_table,
		property_profile.main_land_unit_price,
		property_profile.main_land_total_adj,
		property_profile.size_adj_pct,
		(property_val.imprv_hstd_val + property_val.imprv_non_hstd_val),
		(property_profile.main_land_unit_price * property_profile.main_land_total_adj),
		property_profile.heat_ac_code,
		sale.sl_ratio_type_cd,
		sale.sl_sub_class_cd,
		sale.sl_imprv_type_cd,
		case (
			case
				when isnull(property_val.udi_parent_prop_id, 0) > 0 and isnull(property_val.prop_inactive_dt,0)=0 and isnull(property_val.udi_status,'''') = ''''
				then ''C''
				when isnull(property_val.udi_parent_prop_id, 0) > 0 and isnull(property_val.prop_inactive_dt,0)=0 and isnull(property_val.udi_status,'''') = ''S''
				then ''S''
				when isnull(property_val.udi_parent,'''') = ''T''
				then ''P''
				else ''''
			end as varchar(1)
		) as udi_type

	from chg_of_owner_prop_assoc with(nolock)
	inner join sale with(nolock) on
		chg_of_owner_prop_assoc.chg_of_owner_id = sale.chg_of_owner_id
	inner join property_profile with(nolock) on
		chg_of_owner_prop_assoc.prop_id = property_profile.prop_id
	inner join prop_supp_assoc with(nolock) on
		property_profile.prop_id = prop_supp_assoc.prop_id and
		property_profile.prop_val_yr = prop_supp_assoc.owner_tax_yr and
		property_profile.sup_num = prop_supp_assoc.sup_num
	inner join owner with(nolock) on
		prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr and
		prop_supp_assoc.sup_num = owner.sup_num and
		prop_supp_assoc.prop_id = owner.prop_id
	inner join property_val with(nolock) on
		prop_supp_assoc.prop_id = property_val.prop_id and
		prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr and
		prop_supp_assoc.sup_num = property_val.sup_num
	inner join property with(nolock) on
		property_profile.prop_id = property.prop_id
	inner join account with(nolock) on
		owner.owner_id = account.acct_id
	left outer join entity as city_entity with(nolock) on
		sale.sl_city_id = city_entity.entity_id
	left outer join entity as school_entity with(nolock) on
		sale.sl_school_id = school_entity.entity_id
	left outer join situs with(nolock) on
		situs.prop_id = property_profile.prop_id and
		situs.primary_situs = ''Y''
	where '

	set  @where_clause = @where_clause + ' ' + '
	order by
		property_profile.prop_id
	'
end
else if (@source_flag = 'P')
begin
	set @exec_sql = '
	insert into #sales_comp_print with(tablockx)
	(
		prop_id,
		year,
		geo_id,
		owner,
		situs,
		situs_street,
		school,
		city,
		state_cd,
		region,
		abs_subdv,
		hood,
		subset,
		map_id,
		imprv_class,
		living_area,
		year_built,
		imprv_up,
		imprv_val,
		imprv_add_val,
		land_type,
		land_sqft,
		land_front_feet,
		land_acres,
		land_lot,
		land_size,
		land_up,
		land_val,
		land_val_per_area,
		land_sale_val_per_area,
		appraised_val,
		appraised_val_per_sqft,
		sale_type,
		sale_date,
		sale_price,
		sale_price_per_sqft,
		sale_ratio,
		score,
		print_flag,
		sequence_num,
		sale_id,
		condition_cd,
		percent_complete,
		ls_table,
		main_land_unit_price,
		main_land_total_adj,
		size_adj_pct,
		improv_value,
		effective_land_price,
		heat_ac_code,
		sale_ratio_code,
		imprv_sub_class,
		imprv_type_cd,
		udi_type
	)
	select
		property_profile.prop_id,
		property_profile.prop_val_yr,
		property.geo_id,
		cast(account.file_as_name as varchar(50)),
		cast(
			case
				when
					situs.situs_display is not null
				then
					replace(situs.situs_display, char(13) + char(10), '' '')
				else
					''''
			end as varchar(173)
		),
		cast(situs.situs_street as varchar(50)),
		school_entity.entity_cd,
		city_entity.entity_cd,
		property_profile.state_cd,
		property_val.rgn_cd,
		property_val.abs_subdv_cd,
		property_val.hood_cd,
		property_val.subset_cd,
		property_val.map_id,
		property_profile.class_cd,
		property_profile.living_area,
		property_profile.yr_blt,
		property_profile.imprv_unit_price,
		cast(
			case
				when (
					isnull(property_val.imprv_hstd_val, 0) +
					isnull(property_val.imprv_non_hstd_val, 0)
				) > 0
				then (
					isnull(property_val.imprv_hstd_val, 0) +
					isnull(property_val.imprv_non_hstd_val, 0)
				)
				else
					0
			end as varchar(50)
		) as imprv_val,
		property_profile.imprv_add_val,
		property_profile.land_type_cd,
		property_profile.land_sqft,
		property_profile.land_front_feet,
		property_profile.land_acres,
		null,
		case
			when
				isnull(property_profile.land_sqft, 0) > 0
			then
				cast(property_profile.land_sqft as varchar(50))
			when
				isnull(property_profile.land_acres, 0) > 0
			then
				cast(property_profile.land_acres as varchar(50))
			when
				isnull(property_profile.land_front_feet, 0) > 0
			then
				cast(property_profile.land_front_feet as varchar(50))
			else
				cast(0 as varchar(50))
		end as land_size,
		property_profile.land_unit_price,
		cast(
			case
				when (
					isnull(property_val.land_hstd_val, 0) +
					isnull(property_val.land_non_hstd_val, 0) +
					isnull(property_val.ag_market, 0) +
					isnull(property_val.timber_market, 0)
				) > 0
				then (
					isnull(property_val.land_hstd_val, 0) +
					isnull(property_val.land_non_hstd_val, 0) +
					isnull(property_val.ag_market, 0) +
					isnull(property_val.timber_market, 0)
				)
				else
					0
			end as varchar(50)
		) as land_val,
		0,
		0,
		property_val.market,
		0,
		sale.sl_type_cd,
		convert(varchar(50), sale.sl_dt, 101) as sl_dt,
		sale.sl_price,
		0,
		cast(
			case
				when
					isnull(sale.adjusted_sl_price, 0) > 0
				then (
					isnull(property_val.market, 0) / isnull(sale.adjusted_sl_price, 0)
				)
			end as numeric(12,4)
		) as sl_ratio,
		0,
		''F'',
		0,
		sale.chg_of_owner_id,
		property_profile.condition_cd,
		property_profile.percent_complete,
		property_profile.ls_table,
		property_profile.main_land_unit_price,
		property_profile.main_land_total_adj,
		property_profile.size_adj_pct,
		(property_val.imprv_hstd_val + property_val.imprv_non_hstd_val),
		(property_profile.main_land_unit_price * property_profile.main_land_total_adj),
		property_profile.heat_ac_code,
		sale.sl_ratio_type_cd,
		property_profile.imprv_det_sub_class_cd,
		property_profile.imprv_type_cd,
		cast (
			case
				when isnull(property_val.udi_parent_prop_id, 0) > 0 and isnull(property_val.prop_inactive_dt,0)=0 and isnull(property_val.udi_status,'''') = ''''
				then ''C''
				when isnull(property_val.udi_parent_prop_id, 0) > 0 and isnull(property_val.prop_inactive_dt,0)=0 and isnull(property_val.udi_status,'''') = ''S''
				then ''S''
				when isnull(property_val.udi_parent,'''') = ''T''
				then ''P''
				else ''''
			end as varchar(1)
		) as udi_type

	from chg_of_owner_prop_assoc with(nolock)
	inner join sale with(nolock) on
		chg_of_owner_prop_assoc.chg_of_owner_id = sale.chg_of_owner_id
	inner join property_profile with(nolock) on
		chg_of_owner_prop_assoc.prop_id = property_profile.prop_id
	inner join prop_supp_assoc with(nolock) on
		property_profile.prop_id = prop_supp_assoc.prop_id and
		property_profile.prop_val_yr = prop_supp_assoc.owner_tax_yr and
		property_profile.sup_num = prop_supp_assoc.sup_num
	inner join owner with(nolock) on
		prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr and
		prop_supp_assoc.sup_num = owner.sup_num and
		prop_supp_assoc.prop_id = owner.prop_id
	inner join property_val with(nolock) on
		prop_supp_assoc.prop_id = property_val.prop_id and
		prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr and
		prop_supp_assoc.sup_num = property_val.sup_num and
		property_val.udi_parent_prop_id is null
	inner join property with(nolock) on
		property_profile.prop_id = property.prop_id
	inner join account with(nolock) on
		owner.owner_id = account.acct_id
	left outer join entity as city_entity with(nolock) on
		property_profile.city_id = city_entity.entity_id
	left outer join entity as school_entity with(nolock) on
		property_profile.school_id = school_entity.entity_id
	left outer join situs with(nolock) on
		situs.prop_id = property_profile.prop_id and
		situs.primary_situs = ''Y''
	where ' 
	
	set @where_clause = @where_clause + ' ' + '
	order by
		property_profile.prop_id'
end

--Insert records
exec(@exec_sql + @where_clause)

--Update additional information
if ( @bAutoGrid = 0 )
begin
	update #sales_comp_print with(tablockx)
	set
	land_val_per_area = cast(
		case
			when (
				isnumeric(land_size) = 1 and
				cast(isnull(land_size, 0) as numeric(18,4)) > 0
			)
			then (
	--23101		cast(isnull(appraised_val, 0) as numeric(14,2)) /
				cast(isnull(land_val, 0) as numeric(14,2)) /
				cast(land_size as numeric(18,4))
			)
			else
	--23101		cast(appraised_val as numeric(14,2))
				cast(land_val as numeric(14,2))
		end as numeric(14,2)
	),
	land_sale_val_per_area = cast(
		case
			when (
				isnumeric(land_size) = 1 and
				cast(isnull(land_size, 0) as numeric(18,4)) > 0
			)
			then (
				cast(isnull(sale_price, 0) as numeric(14,2)) /
				cast(land_size as numeric(18,4))
			)
			else
				cast(sale_price as numeric(14,2))
		end as numeric(14,2)
	),
	appraised_val_per_sqft = cast(
		case
			when
				cast(isnull(living_area, 0) as numeric(14,2)) > 0
			then (
				cast(isnull(appraised_val, 0) as numeric(14,2)) /
				cast(living_area as numeric(14,2))
			)
			else
				cast(appraised_val as numeric(14,2))
		end as numeric(14,2)
	),
	sale_price_per_sqft = cast(
		case
			when
				cast(isnull(living_area, 0) as numeric(14,2)) > 0
			then (
				cast(isnull(sale_price, 0) as numeric(14,2)) /
				cast(living_area as numeric(14,2)))
			else
				cast(sale_price as numeric(14,2))
		end as numeric(14,2)
	)
end

	exec CompSalesScoreProperties @subject_prop_id, @subject_prop_year, @input_user_id

GO

