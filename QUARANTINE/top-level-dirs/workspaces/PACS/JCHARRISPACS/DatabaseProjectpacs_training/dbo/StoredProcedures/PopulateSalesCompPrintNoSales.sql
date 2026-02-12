



--Revision 1.0 PratimaV..modified to not bring deleted properties - HS 14054
--Revision 1.1 RossK  added code to check if #sales_comp_print exists HS 17050
--Revision 1.2 Rossk added supplement no to income_prop_vw, land detail and added land detail.sale_id = 0 to remove duplicate prop_id's

create procedure dbo.PopulateSalesCompPrintNoSales
	@subject_prop_id int,
	@subject_prop_year numeric(4,0),
	@input_user_id int,
	@where_clause varchar(3000),
	@where_clause_sales varchar(3000),
	@debug_flag varchar(1) = 'F',
	@bAutoGrid bit = 0
as

set nocount on

	--Declare stored procedure variables
	declare @exec_sql varchar(8000)

	--Prepare the SQL to be executed
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
		condition_cd,
		percent_complete,
		ls_table,
		main_land_unit_price,
		main_land_total_adj,
		size_adj_pct,
		improv_value,
		effective_land_price,
		heat_ac_code,
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
		property_profile.region,
		property_profile.abs_subdv,
		property_profile.neighborhood,
		property_profile.subset,
		property_profile.map_id,
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
		property_profile.land_lot,
		case
			when 
				isnull(property_profile.land_appr_method,'''') = ''LOT''
			then
				cast(isnull(property_profile.land_num_lots, 0) as varchar(50))
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
			when
				isnull(property_profile.land_num_lots, 0) > 0
			then
				cast(property_profile.land_num_lots as varchar(50))
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
		null,
		property_val.market,
		0,
		null,
		null,
		null,
		null,
		null,
		0,
		''F'',
		0,
		property_profile.condition_cd,
		property_profile.percent_complete,
		property_profile.ls_table,
		property_profile.main_land_unit_price,
		property_profile.main_land_total_adj,
		property_profile.size_adj_pct,
		(property_val.imprv_hstd_val + property_val.imprv_non_hstd_val),
		(property_profile.main_land_unit_price * property_profile.main_land_total_adj),
		property_profile.heat_ac_code,
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

	from property_profile with(nolock)
	inner join prop_supp_assoc with(nolock)
	inner join property_val with(nolock) on
		prop_supp_assoc.prop_id = property_val.prop_id and
		prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr and
		prop_supp_assoc.sup_num = property_val.sup_num
	inner join property with(nolock) on
		prop_supp_assoc.prop_id = property.prop_id on 
		property_profile.prop_id = prop_supp_assoc.prop_id and 
		property_profile.prop_val_yr = prop_supp_assoc.owner_tax_yr and
		property_profile.sup_num = prop_supp_assoc.sup_num
	inner join account with(nolock)
	inner join owner with(nolock) on
		account.acct_id = owner.owner_id on 
		property_val.prop_id = owner.prop_id and 
		property_val.prop_val_yr = owner.owner_tax_yr and 
		property_val.sup_num = owner.sup_num
	left outer join entity as city_entity with(nolock) on
		property_profile.city_id = city_entity.entity_id
	left outer join entity as school_entity with(nolock) on
		property_profile.school_id = school_entity.entity_id
	left outer join situs with(nolock) on
		situs.prop_id = property_profile.prop_id and
		situs.primary_situs = ''Y''
	where ' 

	set @where_clause = @where_clause +  ' order by property_profile.prop_id'

-- modified the above to bring only active proeprties and not deleted properties
--PratimaV HS 14054
--RK below 23816 and 23824
-- removed by RK its passed in the where clause
--	and (isnull(property_val.prop_inactive_dt, '''') = '''' or isnull(property_val.udi_parent, '''') = ''T'')
-- removed from propertyval join
--		property_val.udi_parent_prop_id is null


	--Insert records
	exec(@exec_sql + @where_clause)

	--Update additional fields
	if ( @bAutoGrid = 0 )
	begin
	update #sales_comp_print with(tablockx) set
		land_val_per_area = cast(
			case
				when (
					isnumeric(land_size) = 1 and
					cast(isnull(land_size, 0) as numeric(18,4)) > 0
				)
				then (
		--hs23101	cast(isnull(appraised_val, 0) as numeric(14,2))
					cast(isnull(land_val, 0) as numeric(14,2))
					/
					cast(land_size as numeric(18,4))
				)
				else
		--hs23101	cast(appraised_val as numeric(14,2))
					cast(land_val as numeric(14,2))
			end as numeric(14,2)
		),
		appraised_val_per_sqft = cast(
			case
				when
					cast(isnull(living_area, 0) as numeric(14,2)) > 0
				then (
					cast(isnull(appraised_val, 0) as numeric(14,2))
					/
					cast(living_area as numeric(14,2))
				)
				else
					cast(appraised_val as numeric(14,2))
			end as numeric(14,2)
		)
	end

	--Update the Sales Information if necessary
	if len(@where_clause_sales) > 0
	begin
		exec UpdateSalesCompPrintNoSales @input_user_id, @where_clause_sales, @debug_flag
	end

	exec CompSalesScoreProperties @subject_prop_id, @subject_prop_year, @input_user_id

GO

