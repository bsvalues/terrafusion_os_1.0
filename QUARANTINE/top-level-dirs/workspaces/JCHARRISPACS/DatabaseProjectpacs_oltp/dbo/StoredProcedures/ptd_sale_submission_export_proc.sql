

CREATE PROCEDURE ptd_sale_submission_export_proc

@input_pacs_user_id		int,
@input_school_codes		varchar(1024),
@input_date_begin		varchar(10),
@input_date_end			varchar(10),
@input_map_number		varchar(25), --'Geo ID', 'Map ID', 'Mapsco', 'Property ID', 'Reference ID 1', Reference ID 2'
@input_order_by			varchar(512),
@input_mode			varchar(1), --'P' for Production (need to log criteria, save results, etc), 'T' for Testing
@input_filename			varchar(512),
@input_year				numeric(4,0) = 2006

WITH RECOMPILE

AS

SET NOCOUNT ON

create table #layer_assoc
(
	prop_val_yr numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	primary key clustered (prop_val_yr, sup_num, prop_id)
	with fillfactor = 100,
	unique nonclustered (prop_id)
	with fillfactor = 100
)

create table #layer_assoc_prev_year
(
	prop_val_yr numeric(4,0) not null,
	sup_num int not null,
	prop_id int not null,
	primary key clustered (prop_val_yr, sup_num, prop_id)
	with fillfactor = 100,
	unique nonclustered (prop_id)
	with fillfactor = 100
)

insert #layer_assoc (prop_val_yr, prop_id, sup_num)
select distinct pv.prop_val_yr, pv.prop_id, max(pv.sup_num)
from property_val as pv with(nolock)
left outer join supplement as s with(nolock) on
	s.sup_tax_yr = pv.prop_val_yr and
	s.sup_num = pv.sup_num
left outer join sup_group as sg with(nolock) on
	sg.sup_group_id = s.sup_group_id
where
pv.prop_val_yr = @input_year and
(sg.status_cd is null or sg.status_cd in ('A','BC'))
group by pv.prop_val_yr, pv.prop_id

insert #layer_assoc_prev_year (prop_val_yr, prop_id, sup_num)
select distinct pv.prop_val_yr, pv.prop_id, max(pv.sup_num)
from property_val as pv with(nolock)
left outer join supplement as s with(nolock) on
	s.sup_tax_yr = pv.prop_val_yr and
	s.sup_num = pv.sup_num
left outer join sup_group as sg with(nolock) on
	sg.sup_group_id = s.sup_group_id
where
pv.prop_val_yr = (@input_year - 1) and
(sg.status_cd is null or sg.status_cd in ('A','BC'))
group by pv.prop_val_yr, pv.prop_id

declare @cad_id_code		varchar(3)
declare @sql1 			varchar(4000)
declare @sql2 			varchar(4000)
declare @sql3 			varchar(4000)
declare @sql4 			varchar(4000)
declare @sql5 			varchar(4000)
declare @export_run_id		int

--Log Criteria if Production Mode
if (@input_mode = 'P')
begin

	insert into ptd_sale_submission_export_run
	(
		pacs_user_id,
		export_dt,
		school_codes,
		date_begin,
		date_end,
		map_number,
		order_by,
		export_filename,
		export_count
	)
	select
		@input_pacs_user_id,
		GetDate(),
		replace(@input_school_codes, '''''', ''''),
		@input_date_begin,
		@input_date_end,
		@input_map_number,
		@input_order_by,
		@input_filename,
		0

	set @export_run_id = scope_identity()

end
else
begin
	set @export_run_id = 0
end

select @cad_id_code = cad_id_code
from system_address with (nolock)
where system_type = 'A'

set @input_map_number = case when @input_map_number = 'Geo ID' then 'property.geo_id'
							when @input_map_number = 'Map ID' then 'property_val.map_id'
							when @input_map_number = 'Mapsco' then 'property_val.mapsco'
							when @input_map_number = 'Property ID' then 'property.prop_id'
							when @input_map_number = 'Reference ID 1' then 'property.ref_id1'
							when @input_map_number = 'Reference ID 2' then 'property.ref_id2'
							else 'property_val.map_id' end

--Delete appropriate records
delete from ptd_sale_submission_export
where pacs_user_id = @input_pacs_user_id
	and export_run_id = 0

--Insert base records

set @sql1 = '
insert into ptd_sale_submission_export
(
	export_run_id,
	pacs_user_id,
	chg_of_owner_id,
	cad_code,
	school_district_code,
	comptrollers_category_code,
	account_number,
	geo_id,
	legal_description,
	parcel_address,
	parcel_zip_code,
	sale_date,
	sale_price,
	deed_date,
	deed_volume,
	deed_page,
	deed_number,
	deed_type,
	multiple_account_code,
	sale_price_apportioned,
	overlapping_property_indicator,
	totally_exempt_code,
	grantee_first_name,
	grantee_last_name_or_business_name,
	grantee_address_line_1,
	grantee_address_line_2,
	grantee_city,
	grantee_state,
	grantee_zip,
	grantor_first_name,
	grantor_last_name_or_business_name,
	grantor_address_line_1,
	grantor_address_line_2,
	grantor_city,
	grantor_state,
	grantor_zip,
	map_number,
	cad_verification_source_code,
	validity_code,
	confidential_code,
	frozen_characteristics,
	certified_value_year,
	value_set_by_arb,
	cad_value_land,
	cad_value_improvement,
	cad_value_personal_property,
	total_cad_value,
	square_footage_improvement,
	land_unit_type,
	number_of_land_units,
	number_of_bedrooms,
	number_of_bathrooms,
	cach,
	year_built,
	construction_type_class,
	number_of_stories,
	subdivision_neighborhood,
	financing_code,
	number_of_days_on_market,
	previous_cad_value_land,
	previous_cad_value_improvement,
	cad_comments_1,
	cad_comments_2,
	interest_rate,
	number_of_years_financed,
	down_payment
)'

set @sql2 = '
select ' + cast(@export_run_id as varchar(14)) + ',--export_run_id,
	' + cast(@input_pacs_user_id as varchar(14)) + ',--pacs_user_id,
	chg_of_owner_prop_assoc.chg_of_owner_id,--chg_of_owner_id,
	cast(' + @cad_id_code + ' as char(3)),--cad_code,
	cast(left(replace(isnull(entity_pp.taxing_unit_num, ''000-000-00''), ''-'', ''''), 6) as char(6)),--school_district_code,
	cast(isnull(property_profile.state_cd, '''') as char(2)),--comptrollers_category_code,
	cast(property_val.prop_id as char(10)),--account_number,
	cast(isnull(property.geo_id, '''') as char(25)), --geo_id,
	cast(isnull(property_val.legal_desc, '''') as char(50)),--legal_description,
	cast(ltrim(replace(isnull(situs.situs_num, '''')
		+ '' '' + isnull(situs.situs_street_prefx, '''')
		+ '' '' + isnull(situs.situs_street, '''')
		+ '' '' + isnull(situs.situs_street_sufix, '''')
		+ '' '' + isnull(situs.situs_unit, '''')
		+ '' '' + isnull(situs.situs_city, ''''), ''  '', '' '')) as char(50)),--parcel_address,
	cast(isnull(situs.situs_zip, '''') as char(5)),--parcel_zip_code,
	cast(case when sale.sl_dt is null then '''' else convert(char(10), sale.sl_dt, 101) end as char(10)), -- sale_date,
	cast(isnull(sale.sl_price, 0) as char(12)),--sale_price,
	cast(case when chg_of_owner.deed_dt is null then '''' else convert(char(10), chg_of_owner.deed_dt, 101) end as char(10)), -- deed_date,
	cast(isnull(rtrim(chg_of_owner.deed_book_id), '''') as char(5)),--deed_volume,
	cast(isnull(rtrim(chg_of_owner.deed_book_page), '''') as char(7)),--deed_page,
	cast(isnull(rtrim(chg_of_owner.deed_num), '''') as char(20)),--deed_number,
	cast(isnull(rtrim(chg_of_owner.deed_type_cd), '''') as char(12)),--deed_type,
	cast(''N'' as char(1)),--multiple_account_code,
	cast(''U'' as char(1)),--sale_price_apportioned,
	cast(''0'' as char(1)),--overlapping_property_indicator,
	cast(''N'' as char(1)),--totally_exempt_code,
	cast('''' as char(50)),--grantee_first_name,
	cast(isnull(rtrim(psseggv.grantee_file_as_name), '''') as char(50)),--grantee_last_name_or_business_name,
	cast(isnull(rtrim(psseggv.grantee_addr_line1), isnull(rtrim(psseggv.grantee_addr_line2), '''')) as char(35)),--grantee_address_line_1,
	cast(isnull(rtrim(psseggv.grantee_addr_line2), isnull(rtrim(psseggv.grantee_addr_line3), '''')) as char(35)),--grantee_address_line_2,
	cast(isnull(rtrim(psseggv.grantee_addr_city), '''') as char(24)),--grantee_city,
	cast(isnull(rtrim(psseggv.grantee_addr_state), '''') as char(2)),--grantee_state,
	cast(isnull(rtrim(replace(psseggv.grantee_addr_zip, ''-'', '''')), '''') as char(9)),--grantee_zip,
	cast('''' as char(50)),--grantor_first_name,
	cast(isnull(rtrim(psseggv.grantor_file_as_name), '''') as char(50)),--grantor_last_name_or_business_name,
	cast(isnull(rtrim(psseggv.grantor_addr_line1), isnull(rtrim(psseggv.grantor_addr_line2), '''')) as char(35)),--grantor_address_line_1,
	cast(isnull(rtrim(psseggv.grantor_addr_line2), isnull(rtrim(psseggv.grantor_addr_line3), '''')) as char(35)),--grantor_address_line_2,
	cast(isnull(rtrim(psseggv.grantor_addr_city), '''') as char(24)),--grantor_city,
	cast(isnull(rtrim(psseggv.grantor_addr_state), '''') as char(2)),--grantor_state,
	cast(isnull(rtrim(replace(psseggv.grantor_addr_zip, ''-'', '''')), '''') as char(9)),--grantor_zip,'

set @sql3 = '
	cast(isnull(rtrim(' + @input_map_number + '), '''') as char(25)),--map_number,
	cast(''NOT'' as char(3)),--cad_verification_source_code,
	cast(case when isnull(sale.sl_price, 0) > 0 then (case when isnull(sale.sl_type_cd, '''') in (select sl_type_cd from sale_type where isnull(sl_ptd_arms_length, ''F'') = ''T'') then ''Y'' else ''N'' end) else ''U'' end as char(1)),--validity_code,
	cast(case when isnull(sale.sl_price, 0) > 0 then (case when isnull(sale.confidential_sale, ''F'') = ''T'' then ''Y'' else ''N'' end) else ''U'' end as char(1)),--confidential_code,
	cast(case when isnull(sale.frozen_characteristics, ''F'') = ''T'' then ''Y'' else ''N'' end as char(1)),--frozen_characteristics,
	cast(property_val.prop_val_yr as char(4)),--certified_value_year,
	cast(''N'' as char(1)),--value_set_by_arb,
	cast((isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + isnull(property_val.ag_market, 0) + isnull(property_val.timber_market, 0)) as char(12)),--cad_value_land,
	cast((isnull(property_val.imprv_hstd_val, 0) + isnull(property_val.imprv_non_hstd_val, 0)) as char(12)),--cad_value_improvement,
	cast(case when property.prop_type_cd = ''P'' then isnull(property_val.appraised_val, 0) else 0 end as char(12)),--cad_value_personal_property,
	cast((isnull(property_val.land_hstd_val, 0) + isnull(property_val.land_non_hstd_val, 0) + isnull(property_val.ag_market, 0) + isnull(property_val.timber_market, 0) + isnull(property_val.imprv_hstd_val, 0) + isnull(property_val.imprv_non_hstd_val, 0)) as char(12)),--total_cad_value,
	cast(isnull(property_profile.living_area, 0) as char(7)),--square_footage_improvement,
	cast(case when property_profile.land_appr_method = ''A'' then ''AC''
		when property_profile.land_appr_method = ''FF'' then ''FF''
		when property_profile.land_appr_method = ''SQ'' then ''SF''
		when property_profile.land_appr_method = ''LOT'' then ''FV''
		else ''NA'' end as char(2)),--land_unit_type,
	cast(
		cast(
			case 
				when property_profile.land_appr_method = ''A'' then property_profile.land_acres
				when property_profile.land_appr_method = ''FF'' then property_profile.land_front_feet
				when property_profile.land_appr_method = ''SQ'' then property_profile.land_sqft
				when property_profile.land_appr_method = ''LOT'' then 1
				else 0 
			end 
		as decimal(13,4)) as char(14)),--number_of_land_units,
	cast(0 as char(1)),--number_of_bedrooms,
	cast(''00.00'' as char(5)),--number_of_bathrooms,
	cast(''N'' as char(1)),--cach,
	cast(case when isnull(property_profile.yr_blt, 0) > 0 then property_profile.yr_blt else 0 end as char(4)),--year_built,
	cast('''' as char(10)),--construction_type_class,
	cast(''001.00'' as char(6)),--number_of_stories,
	cast(isnull(case when property_val.abs_subdv_cd is null then property_val.hood_cd else property_val.abs_subdv_cd end, '''') as char(15)),--subdivision_neighborhood,
	cast(isnull(sale.sl_financing_cd, '''') as char(5)),--financing_code,
	cast(isnull(sale.num_days_on_market, 0) as char(5)),--number_of_days_on_market,
	cast(0 as char(12)),--previous_cad_value_land,
	cast(0 as char(12)),--previous_cad_value_improvement,
	cast(left(isnull(sale.sl_comment, ''''), 50) as char(50)),--cad_comments_1,
	cast(substring(isnull(sale.sl_comment, ''''), 51, 50) as char(50)),--cad_comments_2,
	cast(cast(case when isnull(sale.interest_rate, 0) < 100 then isnull(sale.interest_rate, 0) else 0 end as decimal(4, 2)) as char(5)),--interest_rate,
	cast(cast(case when isnull(finance_yrs, 0) < 100 then round(isnull(finance_yrs, 0), 0) else 0 end as int) as char(2)) ,--number_of_years_financed,

	cast(isnull(sale.amt_down, 0) as char(12))--down_payment'

set @sql4 = '
FROM property_val with (nolock)
JOIN #layer_assoc as la with(nolock) on
	la.prop_val_yr = property_val.prop_val_yr and
	la.sup_num = property_val.sup_num and
	la.prop_id = property_val.prop_id
JOIN property with (nolock)
	ON property_val.prop_id = property.prop_id
JOIN property_profile with (nolock)
	ON property_val.prop_id = property_profile.prop_id
	AND property_val.prop_val_yr = property_profile.prop_val_yr
LEFT OUTER JOIN entity_prop_assoc as epa with(nolock) on
	la.prop_val_yr = epa.tax_yr and
	la.sup_num = epa.sup_num and
	la.prop_id = epa.prop_id
LEFT OUTER JOIN entity entity_pp with (nolock) ON
	entity_pp.entity_id = epa.entity_id and
	entity_pp.entity_type_cd = ''S''
LEFT OUTER JOIN situs with (nolock)
	ON situs.prop_id = property.prop_id
	AND situs.primary_situs = ''Y''
JOIN chg_of_owner_prop_assoc with (nolock)
	ON dbo.property_val.prop_id = chg_of_owner_prop_assoc.prop_id
JOIN chg_of_owner with (nolock)
	ON chg_of_owner.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
LEFT OUTER JOIN sale with (nolock)
	ON chg_of_owner.chg_of_owner_id = sale.chg_of_owner_id
JOIN ptd_sale_submission_export_grantor_grantee_vw psseggv with (nolock)
	ON chg_of_owner_prop_assoc.chg_of_owner_id = psseggv.chg_of_owner_id and chg_of_owner_prop_assoc.prop_id = psseggv.prop_id '

--Add 'WHERE' clause

set @sql5 = 
'WHERE 
property_val.prop_inactive_dt is null AND
isnull(property.reference_flag, ''F'') = ''F'' AND
	((
		( sale.sl_dt >= ''' 		+ @input_date_begin + ''' AND sale.sl_dt <= ''' 		+ @input_date_end + ''' ) AND
		( ISNULL(sale.sl_exported_flag, ''T'')		= ''F'' )
	)
	OR
	(
		( chg_of_owner.deed_dt >= '''	+ @input_date_begin + ''' AND chg_of_owner.deed_dt <='''	+ @input_date_end + ''' ) AND
		( ISNULL(chg_of_owner.coo_exported_flag, ''F'')	= ''F'' )
	))

'

if ((len(@input_school_codes) > 0) and (@input_school_codes <> '<ALL>'))
begin
	set @sql5 = @sql5 + 'and entity_pp.entity_cd in ' + @input_school_codes + ' '
end


--Add 'ORDER' clause

if (len(@input_order_by) > 0)
begin
	set @sql5 = @sql5 + 'ORDER BY ' + @input_order_by
end

--Execute SQL
exec(@sql1 + @sql2 + @sql3 + @sql4 + @sql5)

--Update additional info not populated by insert
update ptd_sale_submission_export
set cad_comments_1 = 'Unknown Validity Reason',
cad_comments_2 = ''
where pacs_user_id = @input_pacs_user_id
	and export_run_id = @export_run_id
	and validity_code = 'U'

update ptd_sale_submission_export
set multiple_account_code = 'Y',
cad_comments_1 = dbo.fn_GetChgOfOwnerPropIDs(chg_of_owner_id, 0),
cad_comments_2 = dbo.fn_GetChgOfOwnerPropIDs(chg_of_owner_id, 1)
where pacs_user_id = @input_pacs_user_id
	and export_run_id = @export_run_id
	and chg_of_owner_id in
	(
		select chg_of_owner_id
		from chg_of_owner_prop_assoc with (nolock)
		group by chg_of_owner_id
		having count(chg_of_owner_id) > 1
	)


update ptd_sale_submission_export
set ptd_sale_submission_export.overlapping_property_indicator = case when isnull(pv.appr_method, 'C') = 'S' then '2' else '1' end
from ptd_sale_submission_export
join #layer_assoc as la with(nolock) on
	la.prop_id = cast(ptd_sale_submission_export.account_number as int)
join property_val as pv with(nolock) on
	pv.prop_val_yr = la.prop_val_yr and
	pv.sup_num = la.sup_num and
	pv.prop_id = la.prop_id
join shared_prop as sp with(nolock) on
	sp.shared_year = la.prop_val_yr and
	sp.sup_num = la.sup_num and
	sp.pacs_prop_id = la.prop_id
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id

update ptd_sale_submission_export
set ptd_sale_submission_export.totally_exempt_code = 'Y'
where pacs_user_id = @input_pacs_user_id
	and export_run_id = @export_run_id
	and exists
	(
		select pe.*
		from property_exemption pe with (nolock)
		join #layer_assoc as la with(nolock) on
			la.prop_val_yr = pe.exmpt_tax_yr and
			la.prop_val_yr = pe.owner_tax_yr and
			la.sup_num = pe.sup_num and
			la.prop_id = pe.prop_id
		where 
			pe.exmpt_tax_yr = cast(certified_value_year as numeric(4,0))
		and pe.owner_tax_yr = cast(certified_value_year as numeric(4,0))
		and pe.prop_id = cast(ptd_sale_submission_export.account_number as int)
		and pe.exmpt_type_cd = 'EX'
	)

update ptd_sale_submission_export
set ptd_sale_submission_export.value_set_by_arb = 'Y'
where pacs_user_id = @input_pacs_user_id
	and export_run_id = @export_run_id
	and exists
	(
		select arb.*
		from _arb_protest arb with (nolock)
		where arb.prop_id = cast(ptd_sale_submission_export.account_number as int)
			and arb.prop_val_yr = cast(certified_value_year as numeric(4,0))
			and isnull(arb.prot_sustain_district_val, 'F') = 'F'
			and arb.prot_complete_dt is not null
			
	)

if object_id('tempdb..#tmp_area_personal') is not null
begin
	drop table #tmp_area_personal
end

select distinct pv.prop_id,
	pv.prop_val_yr,
	cast(sum(isnull(pers_prop_seg.pp_area, 0)) as char(7)) as pp_area
into #tmp_area_personal
from ptd_sale_submission_export with (nolock)
join #layer_assoc as la with(nolock) on
	la.prop_id = cast(ptd_sale_submission_export.account_number as int)
join property_val as pv with(nolock) on
	pv.prop_val_yr = la.prop_val_yr and
	pv.sup_num = la.sup_num and
	pv.prop_id = la.prop_id
join pers_prop_seg with(nolock) on
	pers_prop_seg.prop_val_yr = la.prop_val_yr and
	pers_prop_seg.sup_num = la.sup_num and
	pers_prop_seg.prop_id = la.prop_id
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and pers_prop_seg.pp_active_flag = 'T'
	and pers_prop_seg.pp_area > 0
group by pv.prop_id,
	pv.prop_val_yr

update ptd_sale_submission_export
set ptd_sale_submission_export.square_footage_improvement = #tmp_area_personal.pp_area
from #tmp_area_personal
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and #tmp_area_personal.prop_id = cast(ptd_sale_submission_export.account_number as int)
	and #tmp_area_personal.prop_val_yr = cast(ptd_sale_submission_export.certified_value_year as numeric(4,0))

update ptd_sale_submission_export
set ptd_sale_submission_export.previous_cad_value_land = cast((isnull(pv.land_hstd_val, 0) + isnull(pv.land_non_hstd_val, 0) + isnull(pv.ag_market, 0) + isnull(pv.timber_market, 0)) as char(12)),--cad_value_land,
	ptd_sale_submission_export.previous_cad_value_improvement = cast((isnull(pv.imprv_hstd_val, 0) + isnull(pv.imprv_non_hstd_val, 0)) as char(12))--cad_value_improvement,
from ptd_sale_submission_export
join #layer_assoc_prev_year as la with(nolock) on
	la.prop_id = cast(ptd_sale_submission_export.account_number as int)
join property_val as pv with (nolock) on
	pv.prop_val_yr = la.prop_val_yr and
	pv.sup_num = la.sup_num and
	pv.prop_id = la.prop_id
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id


if object_id('tempdb..#tmp_sale_conf') is not null
begin
	drop table #tmp_sale_conf
end

select distinct sale_conf.chg_of_owner_id,
	cast((select top 1 isnull(sc.buyer_conf_lvl_cd, sc.seller_conf_lvl_cd)
		from sale_conf sc with (nolock)
		where sale_conf.chg_of_owner_id = sc.chg_of_owner_id
		order by sc.sl_conf_id desc) as varchar(5)) as conf_lvl_cd
into #tmp_sale_conf
from sale_conf with (nolock),
	ptd_sale_submission_export with (nolock)
where sale_conf.primary_sl_conf = 'T'
	and sale_conf.chg_of_owner_id = ptd_sale_submission_export.chg_of_owner_id
	and ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id

delete from #tmp_sale_conf
where conf_lvl_cd is null

insert into #tmp_sale_conf
select distinct sale_conf.chg_of_owner_id,
	cast((select top 1 isnull(sc.buyer_conf_lvl_cd, sc.seller_conf_lvl_cd)
		from sale_conf sc with (nolock)
		where sale_conf.chg_of_owner_id = sc.chg_of_owner_id
		order by sc.sl_conf_id desc) as varchar(5)) as conf_lvl_cd
from sale_conf with (nolock),
	ptd_sale_submission_export with (nolock)
where sale_conf.primary_sl_conf = 'F'
	and sale_conf.chg_of_owner_id = ptd_sale_submission_export.chg_of_owner_id
	and ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and sale_conf.chg_of_owner_id not in
	(
		select chg_of_owner_id
		from #tmp_sale_conf
	)

delete from #tmp_sale_conf
where conf_lvl_cd is null

update ptd_sale_submission_export
set ptd_sale_submission_export.cad_verification_source_code = sale_conf_level.sl_conf_lvl_ptd_cd
from #tmp_sale_conf, sale_conf_level
where #tmp_sale_conf.conf_lvl_cd = ltrim(rtrim(sale_conf_level.sl_conf_lvl_cd))
	and ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and ptd_sale_submission_export.chg_of_owner_id = #tmp_sale_conf.chg_of_owner_id

update ptd_sale_submission_export
set ptd_sale_submission_export.comptrollers_category_code = state_code.ptd_state_cd
from state_code
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and ptd_sale_submission_export.comptrollers_category_code = state_code.state_cd
	and ptd_sale_submission_export.comptrollers_category_code <> state_code.ptd_state_cd

if object_id('tempdb..#tmp_num_of_bedrooms') is not null
begin
	drop table #tmp_num_of_bedrooms
end

select ia.prop_id,
	ia.prop_val_yr,
	sum(case when isnumeric(case when charindex('.', ia.i_attr_val_cd) > 0 then left(ia.i_attr_val_cd, charindex('.', ia.i_attr_val_cd) -1) else ia.i_attr_val_cd end) = 1
		then case when charindex('.', ia.i_attr_val_cd) > 0 then left(ia.i_attr_val_cd, charindex('.', ia.i_attr_val_cd) -1) else ia.i_attr_val_cd end
		else 0 end) as num_of_bedrooms
into #tmp_num_of_bedrooms
from ptd_sale_submission_export as psse with(nolock)
join #layer_assoc as la with(nolock) on
	la.prop_id = cast(psse.account_number as int)
join pacs_system as ps with(nolock) on
	0 = 0
join imprv_attr as ia with(nolock) on
	ia.prop_val_yr = la.prop_val_yr and
	ia.sup_num = la.sup_num and
	ia.sale_id = 0 and
	ia.prop_id = la.prop_id and
	ia.i_attr_val_id = ps.num_bedrooms_code_attribute_id
where psse.pacs_user_id = @input_pacs_user_id
	and psse.export_run_id = @export_run_id
group by ia.prop_id,
	ia.prop_val_yr

update ptd_sale_submission_export
set ptd_sale_submission_export.number_of_bedrooms = cast(#tmp_num_of_bedrooms.num_of_bedrooms as char(1))
from #tmp_num_of_bedrooms
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and #tmp_num_of_bedrooms.prop_id = cast(ptd_sale_submission_export.account_number as int)
	and #tmp_num_of_bedrooms.prop_val_yr = cast(ptd_sale_submission_export.certified_value_year as numeric(4,0))

if object_id('tempdb..#tmp_num_of_bathrooms') is not null
begin
	drop table #tmp_num_of_bathrooms
end

select ia.prop_id,
	ia.prop_val_yr,
	sum(case when isnumeric(case when charindex('.', replace(ia.i_attr_val_cd, ',', '.')) > 0 then left(ia.i_attr_val_cd, charindex('.', replace(ia.i_attr_val_cd, ',', '.')) -1) else ia.i_attr_val_cd end) = 1
		then case when charindex('.', replace(ia.i_attr_val_cd, ',', '.')) > 0 then left(ia.i_attr_val_cd, charindex('.', replace(ia.i_attr_val_cd, ',', '.')) -1) else ia.i_attr_val_cd end
		else 0 end) as num_of_bathrooms
into #tmp_num_of_bathrooms
from ptd_sale_submission_export as psse with(nolock)
join #layer_assoc as la with(nolock) on
	la.prop_id = cast(psse.account_number as int)
join pacs_system as ps with(nolock) on
	0 = 0
join imprv_attr as ia with(nolock) on
	ia.prop_val_yr = la.prop_val_yr and
	ia.sup_num = la.sup_num and
	ia.sale_id = 0 and
	ia.prop_id = la.prop_id and
	ia.i_attr_val_id = ps.num_bathrooms_code_attribute_id
where psse.pacs_user_id = @input_pacs_user_id
	and psse.export_run_id = @export_run_id
group by ia.prop_id,
	ia.prop_val_yr

update ptd_sale_submission_export
set ptd_sale_submission_export.number_of_bathrooms = cast(#tmp_num_of_bathrooms.num_of_bathrooms as char(2))
from #tmp_num_of_bathrooms
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and #tmp_num_of_bathrooms.prop_id = cast(ptd_sale_submission_export.account_number as int)
	and #tmp_num_of_bathrooms.prop_val_yr = cast(ptd_sale_submission_export.certified_value_year as numeric(4,0))


if object_id('tempdb..#tmp_cach') is not null
begin
	drop table #tmp_cach
end

select ia.prop_id,
	ia.prop_val_yr
into #tmp_cach
from ptd_sale_submission_export as psse with(nolock)
join #layer_assoc as la with(nolock) on
	la.prop_id = cast(psse.account_number as int)
join pacs_system as ps with(nolock) on
	0 = 0
join imprv_attr as ia with(nolock) on
	ia.prop_val_yr = la.prop_val_yr and
	ia.sup_num = la.sup_num and
	ia.prop_id = la.prop_id and
	ia.sale_id = 0 and
	ia.i_attr_val_id = ps.heat_ac_code_attribute_id
join attribute_val as av with(nolock) on
	av.imprv_attr_id = ia.i_attr_val_id and
	av.imprv_attr_val_cd = ia.i_attr_val_cd and
	av.cach_flag = 'T'
where psse.pacs_user_id = @input_pacs_user_id
	and psse.export_run_id = @export_run_id
group by ia.prop_id,
	ia.prop_val_yr

update ptd_sale_submission_export
set ptd_sale_submission_export.cach = 'Y'
from #tmp_cach
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and #tmp_cach.prop_id = cast(ptd_sale_submission_export.account_number as int)
	and #tmp_cach.prop_val_yr = cast(ptd_sale_submission_export.certified_value_year as numeric(4,0))

update ptd_sale_submission_export
set ptd_sale_submission_export.cach = 'L'
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and not exists
	(
		select *
		from imprv as i with(nolock)
		join #layer_assoc as la with(nolock) on
			la.prop_val_yr = i.prop_val_yr and
			la.sup_num = i.sup_num and
			la.prop_id = i.prop_id
		where i.prop_id = cast(ptd_sale_submission_export.account_number as int)
			and i.sale_id = 0
	)


if object_id('tempdb..#tmp_main_imprv') is not null
begin
	drop table #tmp_main_imprv
end

select la.prop_id,
	la.prop_val_yr,
	(
		select top 1 ltrim(rtrim(impd.imprv_det_class_cd)) + '-' + ltrim(rtrim(impd.imprv_det_sub_class_cd))
		from imprv_detail as impd with(nolock)
		where
			impd.prop_id = la.prop_id
			and impd.sup_num = la.sup_num
			and impd.prop_val_yr = la.prop_val_yr
			and impd.sale_id = 0
		order by impd.imprv_det_val desc
	) as construction_type_class,
	(
		select top 1 isnull(impd.num_stories, 1)
		from imprv_detail as impd with(nolock)
		where
			impd.prop_id = la.prop_id
			and impd.sup_num = la.sup_num
			and impd.prop_val_yr = la.prop_val_yr
			and impd.sale_id = 0
		order by impd.imprv_det_val desc
	) as num_stories
into #tmp_main_imprv
from ptd_sale_submission_export as psse with(nolock)
join #layer_assoc as la with(nolock) on
	la.prop_id = cast(psse.account_number as int)
where psse.pacs_user_id = @input_pacs_user_id
	and psse.export_run_id = @export_run_id

update ptd_sale_submission_export
set ptd_sale_submission_export.construction_type_class = cast(#tmp_main_imprv.construction_type_class as char(10)),
	ptd_sale_submission_export.number_of_stories = cast(#tmp_main_imprv.num_stories as char(3))
from #tmp_main_imprv
where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export.export_run_id = @export_run_id
	and #tmp_main_imprv.prop_id = cast(ptd_sale_submission_export.account_number as int)
	and #tmp_main_imprv.prop_val_yr = cast(ptd_sale_submission_export.certified_value_year as numeric(4,0))

--Pad all numeric fields with padding zeroes
update ptd_sale_submission_export
set cad_code 				= right('000' 		+ ltrim(rtrim(isnull(cad_code, '0'))), 3),
	school_district_code 		= right('000000' 	+ ltrim(rtrim(isnull(school_district_code, '0'))), 6),
	parcel_zip_code 		= right('00000' 	+ ltrim(rtrim(isnull(parcel_zip_code, '0'))), 5),
	sale_price 			= right('000000000000' 	+ ltrim(rtrim(isnull(sale_price, '0'))), 12),
	overlapping_property_indicator 	= right('0' 		+ ltrim(rtrim(isnull(overlapping_property_indicator, '0'))), 1),
	grantee_zip 			= right('000000000' 	+ ltrim(rtrim(isnull(grantee_zip, '0'))), 9),
	grantor_zip 			= right('000000000' 	+ ltrim(rtrim(isnull(grantor_zip, '0'))), 9),
	certified_value_year 		= right('0000' 		+ ltrim(rtrim(isnull(certified_value_year, '0'))), 4),
	cad_value_land 			= right('000000000000' 	+ ltrim(rtrim(isnull(cad_value_land, '0'))), 12),
	cad_value_improvement 		= right('000000000000' 	+ ltrim(rtrim(isnull(cad_value_improvement, '0'))), 12),
	cad_value_personal_property 	= right('000000000000' 	+ ltrim(rtrim(isnull(cad_value_personal_property, '0'))), 12),
	total_cad_value 		= right('000000000000' 	+ ltrim(rtrim(isnull(total_cad_value, '0'))), 12),
	square_footage_improvement 	= right('0000000' 	+ ltrim(rtrim(isnull(square_footage_improvement, '0'))), 7),
	number_of_land_units 		= right('000000000' 	+ ltrim(rtrim(isnull(number_of_land_units, '0'))), 9),
	number_of_bedrooms 		= right('0' 		+ ltrim(rtrim(isnull(number_of_bedrooms, '0'))), 1),
	number_of_bathrooms 		= right('00' 		+ ltrim(rtrim(isnull(number_of_bathrooms, '0'))), 2),
	year_built 			= right('0000' 		+ ltrim(rtrim(isnull(year_built, '0'))), 4),
	number_of_stories 		= right('000' 		+ ltrim(rtrim(isnull(number_of_stories, '0'))), 3),
	number_of_days_on_market 	= right('000' 		+ ltrim(rtrim(isnull(number_of_days_on_market, '0'))), 3),
	previous_cad_value_land 	= right('000000000000' 	+ ltrim(rtrim(isnull(previous_cad_value_land, '0'))), 12),
	previous_cad_value_improvement	= right('000000000000' 	+ ltrim(rtrim(isnull(previous_cad_value_improvement, '0'))), 12),
	interest_rate 			= right('0000' 		+ ltrim(rtrim(isnull(interest_rate, '0'))), 4),
	number_of_years_financed 	= right('00' 		+ ltrim(rtrim(isnull(number_of_years_financed, '0'))), 2),
	down_payment 			= right('000000000000' 	+ ltrim(rtrim(isnull(down_payment, '0'))), 12)
where pacs_user_id = @input_pacs_user_id
	and export_run_id = @export_run_id

update ptd_sale_submission_export_run
set ptd_sale_submission_export_run.export_count = (select count(*)
													from ptd_sale_submission_export
													where ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
														and ptd_sale_submission_export.export_run_id = @export_run_id)
where ptd_sale_submission_export_run.pacs_user_id = @input_pacs_user_id
	and ptd_sale_submission_export_run.export_run_id = @export_run_id

if (@input_mode = 'P')
begin
	update sale
	set sale.sl_exported_flag = 'T'
	from ptd_sale_submission_export
	where sale.chg_of_owner_id = ptd_sale_submission_export.chg_of_owner_id
		and ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
		and ptd_sale_submission_export.export_run_id = @export_run_id

	update chg_of_owner
	set chg_of_owner.coo_exported_flag = 'T'
	from ptd_sale_submission_export
	where chg_of_owner.chg_of_owner_id = ptd_sale_submission_export.chg_of_owner_id
		and ptd_sale_submission_export.pacs_user_id = @input_pacs_user_id
		and ptd_sale_submission_export.export_run_id = @export_run_id
end

GO

