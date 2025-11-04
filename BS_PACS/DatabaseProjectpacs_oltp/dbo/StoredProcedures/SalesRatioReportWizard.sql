
CREATE  PROCEDURE SalesRatioReportWizard

	@input_year			numeric(4,0),
	@input_user_id 			int,
	@input_value_option 		varchar(1),
	@input_report_type    		varchar(2),
	@input_sort1			varchar(100),
	@input_sort2			varchar(100),
	@input_sort3			varchar(100),
	@input_sort4			varchar(100),
	@input_summary1			char(1),
	@input_summary2			char(1),
	@input_summary3			char(1),
	@input_summary4			char(1),
	@input_query			varchar(6000),
	@input_include_suppressed	char(1),
	@input_include_0_sales		char(1),
	@input_update_sort1		varchar(2000),
	@input_update_sort2		varchar(2000),
	@input_update_sort3		varchar(2000),
	@input_update_sort4		varchar(2000),
	@input_time_adj_month		int = 0,
	@input_time_adj_year		int = 0,
	@input_time_adj_pct		numeric(5,2) = 0,
	@input_supress_detail		char(1) = 'F',
	@input_vacant_land_only	bit = 0,
	@input_include_deleted_properties char(1) = 'T'

as

set nocount on


declare @strSQL 	varchar(4096)
declare @type		varchar(50)
declare @bSalesRatio bit


SET @bSalesRatio = 0

/******************************/
/***** create temp tables *****/
/******************************/
CREATE TABLE #sales_ratio_report (
	[chg_of_owner_id] [int] NOT NULL ,
	[report_type] [varchar] (5) NOT NULL ,
	[pacs_user_id] [int] NOT NULL ,
	[sort1] [varchar] (100) NOT NULL ,
	[sort2] [varchar] (100) NOT NULL ,
	[sort3] [varchar] (100) NULL ,
	[sort4] [varchar] (100) NULL ,
	[sort1_desc] [varchar] (100) NULL ,
	[sort2_desc] [varchar] (100) NULL ,
	[sort3_desc] [varchar] (100) NULL ,
	[sort4_desc] [varchar] (100) NULL ,
	[summary1] [char] (1) NULL ,
	[summary2] [char] (1) NULL ,
	[summary3] [char] (1) NULL ,
	[summary4] [char] (1) NULL ,
	[buyer_name] [varchar] (70) NULL ,
	[state_cd] [char] (5) NULL ,
	[school_id] [int] NULL ,
	[school_cd] [char] (5) NULL ,
	[city_id] [int] NULL ,
	[city_cd] [char] (5) NULL ,
	[dimensions] [varchar] (80) NULL ,
	[imprv_class] [char] (10) NULL ,
	[actual_yr_built] [numeric](5, 0) NULL ,
	[eff_yr_built] [numeric](4, 0) NULL ,
	[living_area_sqft] [numeric](18, 1) NULL ,
	[ave_price_per_sqft] [numeric](14, 2) NULL ,
	[land_type_cd] [char] (10) NULL ,
	[ave_price_per_acre] [numeric](14, 2) NULL ,
	[sale_dt] [datetime] NULL ,
	[confirmed_source] [varchar] (30) NULL ,
	[confirmed_by] [varchar] (30) NULL ,
	[confirmed_dt] [datetime] NULL ,
	[deed_dt] [datetime] NULL ,
	[deed_num] [varchar] (50) NULL ,
	[deed_book_id] [char] (20) NULL ,
	[deed_book_page] [char] (20) NULL ,
	[fin_down_pymt] [numeric](14, 2) NULL ,
	[fin_interest] [numeric](14, 3) NULL ,
	[fin_period] [numeric](4, 1) NULL ,
	[sl_comment] [varchar] (500) NULL ,
	[sl_price] [numeric](14, 0) NULL ,
	[sl_adj_price] [numeric](14, 0) NULL ,
	[appraised_val] [numeric](14, 0) NULL ,
	[sales_ratio] [numeric](14, 5) NULL ,
	[land_val] [numeric](14, 0) NULL ,
	[prop_ratio] [numeric](14, 5) NULL ,
	[imprv_val] [numeric](14, 0) NULL ,
	[temp_subdivision_cd] [char] (10) NULL ,
	[temp_subset_cd] [char] (5) NULL ,
	[temp_region_cd] [char] (5) NULL ,
	[temp_hood_cd] [char] (10) NULL ,
	[sl_type_cd] [char] (5) NULL ,
	[sort1_temp_avg_dev] [numeric](14, 4) NULL ,
	[sort1_temp_median] [numeric](14, 4) NULL ,
	[sort1_temp_avg] [numeric](14, 4) NULL ,
	[sort1_temp_cod] [numeric](14, 4) NULL ,
	[sort2_temp_avg_dev] [numeric](14, 4) NULL ,
	[sort2_temp_median] [numeric](14, 4) NULL ,
	[sort2_temp_avg] [numeric](14, 4) NULL ,
	[sort2_temp_cod] [numeric](14, 4) NULL ,
	[sort3_temp_avg_dev] [numeric](14, 4) NULL ,
	[sort3_temp_median] [numeric](14, 4) NULL ,
	[sort3_temp_avg] [numeric](14, 4) NULL ,
	[sort3_temp_cod] [numeric](14, 4) NULL ,
	[sort4_temp_avg_dev] [numeric](14, 4) NULL ,
	[sort4_temp_median] [numeric](14, 4) NULL ,
	[sort4_temp_avg] [numeric](14, 4) NULL ,
	[sort4_temp_cod] [numeric](14, 4) NULL ,
	[temp_avg_dev] [numeric](14, 4) NULL ,
	[temp_median] [numeric](14, 4) NULL ,
	[temp_avg] [numeric](14, 4) NULL ,
	[temp_cod] [numeric](14, 4) NULL ,
	[appr_avg_price_per_sqft] [numeric](14, 2) NULL ,
	[sale_avg_price_per_sqft] [numeric](14, 2) NULL ,
	[sort1_temp_pop_var] [numeric](14, 4) NULL ,
	[sort1_temp_stdev] [numeric](14, 4) NULL ,
	[sort1_temp_prd] [numeric](14, 4) NULL ,
	[sort1_temp_wt_mean] [numeric](14, 4) NULL ,
	[sort1_temp_max] [numeric](14, 4) NULL ,
	[sort1_temp_mean] [numeric](14, 4) NULL ,
	[sort2_temp_pop_var] [numeric](14, 4) NULL ,
	[sort2_temp_stdev] [numeric](14, 4) NULL ,
	[sort2_temp_prd] [numeric](14, 4) NULL ,
	[sort2_temp_wt_mean] [numeric](14, 4) NULL ,
	[sort2_temp_max] [numeric](14, 4) NULL ,
	[sort2_temp_mean] [numeric](14, 4) NULL ,
	[sort3_temp_pop_var] [numeric](14, 4) NULL ,
	[sort3_temp_stdev] [numeric](14, 4) NULL ,
	[sort3_temp_prd] [numeric](14, 4) NULL ,
	[sort3_temp_wt_mean] [numeric](14, 4) NULL ,
	[sort3_temp_max] [numeric](14, 4) NULL ,
	[sort3_temp_mean] [numeric](14, 4) NULL ,
	[sort4_temp_pop_var] [numeric](14, 4) NULL ,
	[sort4_temp_stdev] [numeric](14, 4) NULL ,
	[sort4_temp_prd] [numeric](14, 4) NULL ,
	[sort4_temp_wt_mean] [numeric](14, 4) NULL ,
	[sort4_temp_max] [numeric](14, 4) NULL ,
	[sort4_temp_mean] [numeric](14, 4) NULL ,
	[temp_pop_var] [numeric](14, 4) NULL ,
	[temp_stdev] [numeric](14, 4) NULL ,
	[temp_prd] [numeric](14, 4) NULL ,
	[temp_wt_mean] [numeric](14, 4) NULL ,
	[temp_max] [numeric](14, 4) NULL ,
	[temp_mean] [numeric](14, 4) NULL ,
	[sort1_temp_min] [numeric](14, 4) NULL ,
	[sort2_temp_min] [numeric](14, 4) NULL ,
	[sort3_temp_min] [numeric](14, 4) NULL ,
	[sort4_temp_min] [numeric](14, 4) NULL ,
	[temp_min] [numeric](14, 4) NULL ,
	[appraiser_id] [int] NULL ,
	[include_no_calc] [char] (1) NULL ,
	[seller_name] [varchar] (70) NULL ,
	[sl_ratio_cd] [char] (5) NULL ,
	[land_ratio] [numeric](14, 5) NULL ,
	[land_market_ratio] [numeric](14, 5) NULL ,
	[land_ratio_mean] [numeric](14, 5) NULL ,
	[land_ratio_median] [numeric](14, 5) NULL ,
	[land_mkt_ratio_mean] [numeric](14, 5) NULL ,
	[land_mkt_ratio_median] [numeric](14, 5) NULL ,
	[sort1_land_ratio_mean] [numeric](14, 5) NULL ,
	[sort1_land_ratio_median] [numeric](14, 5) NULL ,
	[sort1_land_mkt_ratio_mean] [numeric](14, 5) NULL ,
	[sort1_land_mkt_ratio_median] [numeric](14, 5) NULL ,
	[sort2_land_ratio_mean] [numeric](14, 5) NULL ,
	[sort2_land_ratio_median] [numeric](14, 5) NULL ,
	[sort2_land_mkt_ratio_mean] [numeric](14, 5) NULL ,
	[sort2_land_mkt_ratio_median] [numeric](14, 5) NULL ,
	[sort3_land_ratio_mean] [numeric](14, 5) NULL ,
	[sort3_land_ratio_median] [numeric](14, 5) NULL ,
	[sort3_land_mkt_ratio_mean] [numeric](14, 5) NULL ,
	[sort3_land_mkt_ratio_median] [numeric](14, 5) NULL ,
	[sort4_land_ratio_mean] [numeric](14, 5) NULL ,
	[sort4_land_ratio_median] [numeric](14, 5) NULL ,
	[sort4_land_mkt_ratio_mean] [numeric](14, 5) NULL ,
	[sort4_land_mkt_ratio_median] [numeric](14, 5) NULL ,
	[eff_yr_blt] [numeric](4, 0) NULL ,
	[supress_detail] [char] (1) NULL ,
	[include_reason] [varchar] (30) NULL ,
	[deed_comment] [varchar] (500) NULL ,
	[geo_id] [varchar] (50) NULL ,
	[map_id] [varchar] (20) NULL ,
	[sl_adj_reason] [varchar] (50) NULL ,
	[true_sl_price] [numeric](14, 0) NULL,
 	[dba_name] [varchar] (50) null ,
	[prop_use_cd] [varchar] (10) null ,
	[lbratio] [numeric](14, 5) null,
	[vac_pct] [numeric](5, 2) null,
	[cap_rate] [numeric](5, 2) null,
	[gba] [numeric](14, 0) null,
	[gba_sqft] [numeric](14, 2) null,
	[nra] [numeric](14, 0) NULL,
	[nra_sqft] [numeric](14, 2) NULL,
	[imprv_sub_class] [varchar] (10) NULL ,
	[condition_cd] [varchar] (5) NULL ,
	[heat_ac_cd] [varchar] (75) NULL ,
	[land_total_sqft] [numeric] (18,2) NULL ,
	[land_total_acres] [numeric] (18,4) NULL ,
	[additive_val] [numeric] (14,0) NULL ,
	[percent_complete] [numeric](5, 2) NULL,
	[sub_market_cd] [varchar](10) NULL

) 


CREATE TABLE #sales_ratio_report_property (
	[chg_of_owner_id] [int] NOT NULL ,
	[report_type] [char] (5) NULL ,
	[pacs_user_id] [int] NOT NULL ,
	[prop_id] [int] NOT NULL ,
	[sup_num] [int] NULL ,
	[prop_val_yr] [numeric](14, 0) NULL ,
	[prop_type_cd] [char] (5) NULL ,
	[legal_desc] [varchar] (255) NULL ,
	[situs_location] [varchar] (255) NULL ,
	[eff_size_acres] [numeric](14, 4) NULL ,
	[legal_acreage] [numeric](14, 4) NULL ,
	[subdivision_cd] [char] (10) NULL ,
	[hood_cd] [char] (10) NULL ,
	[subset_cd] [char] (5) NULL ,
	[region_cd] [char] (5) NULL ,
	[geo_id] [varchar] (50) NULL ,
	[land_value] [numeric](14, 0) NULL ,
	[market_value] [numeric](14, 0) NULL ,
	[living_area_sqft] [numeric](18, 4) NULL ,
	[appraiser_nm] [varchar] (40) NULL ,
	[imprv_val_1] [numeric](14, 0) NULL ,
	[imprv_desc_1] [varchar] (50) NULL ,
	[imprv_val_2] [numeric](14, 0) NULL ,
	[imprv_desc_2] [varchar] (50) NULL ,
	[imprv_val_3] [numeric](14, 0) NULL ,
	[imprv_desc_3] [varchar] (50) NULL ,
	[econ_pct] [numeric](5, 2) NULL ,
	[phy_pct] [numeric](5, 2) NULL ,
	[func_pct] [numeric](5, 2) NULL ,
	[as_imprv_pct] [numeric](5, 2) NULL ,
	[as_land_pct] [numeric](5, 2) NULL ,
	[hood_imprv_pct] [numeric](5, 2) NULL ,
	[hood_land_pct] [numeric](5, 2) NULL ,
	[map_id] [varchar] (20) NULL ,
	[prop_inactive_dt] [datetime] NULL ,
	[base_dep] [numeric](5, 2) NULL 
) 




/************************/
/***** prep the data ****/
/************************/


set @strSQL = 'insert into #sales_ratio_report'
set @strSQL = @strSQL + ' ('
set @strSQL = @strSQL + ' chg_of_owner_id,' 
set @strSQL = @strSQL + ' report_type,'                                        
set @strSQL = @strSQL + ' pacs_user_id,' 
set @strSQL = @strSQL + ' sort1,'
set @strSQL = @strSQL + ' sort2,'
set @strSQL = @strSQL + ' sort3,'
set @strSQL = @strSQL + ' sort4,'
set @strSQL = @strSQL + ' summary1,' 
set @strSQL = @strSQL + ' summary2,'
set @strSQL = @strSQL + ' summary3,'
set @strSQL = @strSQL + ' summary4,'                                                           
set @strSQL = @strSQL + ' state_cd,' 
set @strSQL = @strSQL + ' school_id,'   
set @strSQL = @strSQL + ' city_id,'                                                                    
set @strSQL = @strSQL + ' imprv_class,' 
set @strSQL = @strSQL + ' actual_yr_built,' 
set @strSQL = @strSQL + ' living_area_sqft,'     
set @strSQL = @strSQL + ' land_type_cd,' 
set @strSQL = @strSQL + ' sale_dt,'     
set @strSQL = @strSQL + ' sl_price,'    
set @strSQL = @strSQL + ' sl_adj_price, ' 
set @strSQL = @strSQL + ' sl_type_cd,' 
set @strSQL = @strSQL + ' appraiser_id,' 
set @strSQL = @strSQL + ' include_no_calc,'
set @strSQL = @strSQL + ' sl_ratio_cd,'
set @strSQL = @strSQL + ' eff_yr_built,'
set @strSQL = @strSQL + ' supress_detail,'
set @strSQL = @strSQL + ' include_reason,'
set @strSQL = @strSQL + ' geo_id,'
set @strSQL = @strSQL + ' map_id,'
set @strSQL = @strSQL + ' sl_adj_reason, '
set @strSQL = @strSQL + ' true_sl_price, '

set @strSQL = @strSQL + ' dba_name, '
set @strSQL = @strSQL + ' prop_use_cd, '
set @strSQL = @strSQL + ' lbratio, '
set @strSQL = @strSQL + ' vac_pct, '
set @strSQL = @strSQL + ' cap_rate, '
set @strSQL = @strSQL + ' gba, '
set @strSQL = @strSQL + ' gba_sqft, '
set @strSQL = @strSQL + ' nra, '
set @strSQL = @strSQL + ' nra_sqft, '
set @strSQL = @strSQL + ' imprv_sub_class, '
set @strSQL = @strSQL + ' condition_cd, '
set @strSQL = @strSQL + ' heat_ac_cd, '
set @strSQL = @strSQL + ' land_total_sqft, '
set @strSQL = @strSQL + ' land_total_acres, '
set @strSQL = @strSQL + ' additive_val, '
set @strSQL = @strSQL + ' percent_complete, '
set @strSQL = @strSQL + ' sub_market_cd '

set @strSQL = @strSQL + ' )'

set @strSQL = @strSQL + ' select sale.chg_of_owner_id, '
set @strSQL = @strSQL + '''' + @input_report_type + ''','
set @strSQL = @strSQL +  convert(varchar(12), @input_user_id) + ', '
set @strSQL = @strSQL + '''' + @input_sort1 + ''','
set @strSQL = @strSQL + '''' + @input_sort2 + ''','
set @strSQL = @strSQL + '''' + @input_sort3 + ''','
set @strSQL = @strSQL + '''' + @input_sort4 + ''','
set @strSQL = @strSQL + '''' + @input_summary1 + ''','
set @strSQL = @strSQL + '''' + @input_summary2 + ''','
set @strSQL = @strSQL + '''' + @input_summary3 + ''','
set @strSQL = @strSQL + '''' + @input_summary4 + ''','
set @strSQL = @strSQL + ' pp.state_cd, '
set @strSQL = @strSQL + ' pp.school_id, '
set @strSQL = @strSQL + ' pp.city_id , '
set @strSQL = @strSQL + ' pp.class_cd, '
set @strSQL = @strSQL + ' pp.yr_blt, '
set @strSQL = @strSQL + ' pp.living_area, '
set @strSQL = @strSQL + ' pp.land_type_cd, '
set @strSQL = @strSQL + ' sale.sl_dt, '
set @strSQL = @strSQL + ' sale.adjusted_sl_price, '
set @strSQL = @strSQL + ' sale.adjusted_sl_price, '
set @strSQL = @strSQL + ' sale.sl_type_cd, '
set @strSQL = @strSQL + ' pv.last_appraiser_id, '
set @strSQL = @strSQL + ' case when (pv.prop_inactive_dt is null or pv.udi_parent = ''T'') then IsNull(sale.include_no_calc, ''F'') else ''T'' end, '
set @strSQL = @strSQL + ' sale.sl_ratio_type_cd, '
set @strSQL = @strSQL + ' pp.eff_yr_blt, '
set @strSQL = @strSQL + '''' + @input_supress_detail + ''''
set @strSQL = @strSQL + ', IsNull(sale.include_reason, ''''), '
set @strSQL = @strSQL + ' p.geo_id, '
set @strSQL = @strSQL + ' pv.map_id, '
set @strSQL = @strSQL + ' CASE WHEN sale.sl_price <> sale.adjusted_sl_price THEN sale.sl_adj_rsn ELSE '''' END, '
set @strSQL = @strSQL + ' sale.sl_price, '

set @strSQL = @strSQL + ' p.dba_name, '
set @strSQL = @strSQL + ' pp.property_use_cd, '
set @strSQL = @strSQL + ' case when isnull(pp.living_area,0) >0 then isnull(pp.land_total_sqft,0) / isnull(pp.living_area,0) else 0 end, '

set @strSQL = @strSQL + ' isnull(iv.VR,0), '
set @strSQL = @strSQL + ' isnull(iv.CAPR,0), '
set @strSQL = @strSQL + ' isnull(pp.living_area,0), '
set @strSQL = @strSQL + ' case when isnull(pp.living_area,0) >0 then isnull(pv.market,0) / isnull(pp.living_area,0) else 0 end, '
set @strSQL = @strSQL + ' isnull(iv.NRA,0)ra, '
set @strSQL = @strSQL + ' case when isnull(iv.NRA,0) >0 then isnull(pv.market,0) / isnull(iv.NRA,0) else 0 end, '

set @strSQL = @strSQL + ' pp.imprv_det_sub_class_cd, '
set @strSQL = @strSQL + ' pp.condition_cd, '
set @strSQL = @strSQL + ' pp.heat_ac_code, '
set @strSQL = @strSQL + ' isnull(pp.land_total_sqft,0), '
set @strSQL = @strSQL + ' isnull(pp.land_total_acres,0), '
set @strSQL = @strSQL + ' isnull(pp.imprv_add_val,0), '
set @strSQL = @strSQL + ' isnull(pp.percent_complete,0), '
set @strSQL = @strSQL + ' pp.sub_market_cd '

set @strSQL = @strSQL + ' from chg_of_owner_prop_assoc copa WITH (NOLOCK) ' 
set @strSQL = @strSQL + ' inner join sale WITH (NOLOCK) on '
set @strSQL = @strSQL + ' 	copa.chg_of_owner_id = sale.chg_of_owner_id '
set @strSQL = @strSQL + ' inner join property_profile as pp WITH (NOLOCK) on '
set @strSQL = @strSQL + ' 	copa.prop_id = pp.prop_id '
set @strSQL = @strSQL + '   and copa.sup_tax_yr = pp.prop_val_yr '
set @strSQL = @strSQL + ' inner join prop_supp_assoc as psa WITH (NOLOCK) on '
set @strSQL = @strSQL + ' 	pp.prop_id = psa.prop_id and '
set @strSQL = @strSQL + ' 	pp.prop_val_yr = psa.owner_tax_yr '
--set @strSQL = @strSQL + ' 	pp.prop_val_yr = psa.owner_tax_yr and '
--set @strSQL = @strSQL + ' 	pp.sup_num = psa.sup_num '
set @strSQL = @strSQL + ' inner join property_val as pv WITH (NOLOCK) on '
set @strSQL = @strSQL + ' 	psa.prop_id = pv.prop_id and '
set @strSQL = @strSQL + ' 	psa.owner_tax_yr = pv.prop_val_yr and '
set @strSQL = @strSQL + ' 	psa.sup_num = pv.sup_num '
set @strSQL = @strSQL + ' inner join property as p WITH (NOLOCK) on '
set @strSQL = @strSQL + ' 	pp.prop_id = p.prop_id '
 

set @strSQL = @strSQL + ' left 	outer join income_prop_assoc as ipa with(nolock)  on ' 
set @strSQL = @strSQL + '		ipa.prop_id = pv.prop_id '
set @strSQL = @strSQL + ' 		and ipa.prop_val_yr = ' + convert(varchar(4), @input_year)
set @strSQL = @strSQL + ' 		and ipa.sup_num = pv.sup_num '

set @strSQL = @strSQL + ' left 	outer join income_vw as iv with(nolock)  on '
set @strSQL = @strSQL + ' 		iv.income_id = ipa.income_id '
set @strSQL = @strSQL + ' 		and iv.income_yr = ' + convert(varchar(4), @input_year)
set @strSQL = @strSQL + ' 		and iv.sup_num = pv.sup_num '


set @strSQL = @strSQL + ' where sale.chg_of_owner_id = copa.chg_of_owner_id '
set @strSQL = @strSQL + ' and   copa.prop_id         = pv.prop_id '
set @strSQL = @strSQL + ' and   pv.prop_id             = p.prop_id'

if (@input_include_suppressed = 'F')
begin
	set @strSQL = @strSQL + ' and   (sale.suppress_on_ratio_rpt_cd = ''F'' or sale.suppress_on_ratio_rpt_cd is null)'end

if (@input_value_option = 'S')
begin
	set @strSQL = @strSQL + ' and psa.sup_num = pv.sup_num '
	set @strSQL = @strSQL + ' and psa.owner_tax_yr = pv.prop_val_yr '
end
else
begin
	set @strSQL = @strSQL + ' and   pp.prop_val_yr       = ' + convert(varchar(4), @input_year)
end

set @strSQL = @strSQL + ' and   pp.prop_id	    = pv.prop_id '
set @strSQL = @strSQL + ' and   pp.prop_val_yr	    = pv.prop_val_yr '

if (@input_include_0_sales = 'F')
begin
	set @strSQL = @strSQL + ' and   sale.adjusted_sl_price > 0 and sale.adjusted_sl_price is not null '
end

if (@input_vacant_land_only = 1)
begin
	set @strSQL = @strSQL + ' and	sale.land_only_sale = 1 '
end

if ( @input_include_deleted_properties <> 'T' )
begin
	set @strSQL = @strSQL + ' and (pv.prop_inactive_dt is null or pv.udi_parent = ''T'')'
end
	
if (@input_query <> '')
begin
	set @strSQL = @strSQL + ' and sale.chg_of_owner_id in (' + @input_query + ')'
end
else
begin

	DECLARE query_type CURSOR FAST_FORWARD
	FOR   select distinct type 
	from  sales_ratio_report_query WITH (NOLOCK)
	where pacs_user_id = @input_user_id
	
	open query_type
	fetch next from query_type into @type
	
	while (@@FETCH_STATUS = 0)
	begin
	
		declare @begin_value	numeric(18,10)
		declare @end_value	numeric(18,10)
		declare @begin_date	varchar(25)
		declare @end_date	varchar(25)
		declare @begin_char_value	varchar(50)
		declare @end_char_value		varchar(50)
	
		/* neighborhood */
		if (@type = 'NBHD')
		begin
			set @strSQL = @strSQL + ' and pp.neighborhood in (select code_value '
			set @strSQL = @strSQL + ' from sales_ratio_report_query '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''NBHD'')'
		end
	
		/* Abstract/Subdivision */
		if (@type = 'AS')

		begin
			set @strSQL = @strSQL + ' and pp.abs_subdv in (select code_value '
			set @strSQL = @strSQL + ' from sales_ratio_report_query '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''AS'')'
		end
		
		/* region */
		if (@type = 'R')
		begin
			set @strSQL = @strSQL + ' and pp.region in (select code_value '
			set @strSQL = @strSQL + ' from sales_ratio_report_query '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''R'')'
		end
	
		/* subset */
		if (@type = 'S')
		begin
			set @strSQL = @strSQL + ' and pp.subset in (select code_value '
			set @strSQL = @strSQL + ' from sales_ratio_report_query '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''S'')'
		end
	
		/* state code */
		if (@type = 'SC')
		begin
			
			if (@input_value_option = 'S')
			begin
				set @strSQL = @strSQL + ' and sale.sl_state_cd in (select code_value '
			end
			else
			begin
				set @strSQL = @strSQL + ' and pp.state_cd in (select code_value '
			end
	
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''SC'')'
		end
	
		/* improvement class code */
		if (@type = 'IC')
		begin
			if (@input_value_option = 'S')
			begin
				set @strSQL = @strSQL + ' and sale.sl_class_cd in (select code_value '
			end
			else
			begin
				set @strSQL = @strSQL + ' and pp.class_cd in (select code_value '
			end
	
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''IC'')'
		end
	

		/* improvement sub class code  32290*/
		if (@type = 'ISUBC')
		begin
			if (@input_value_option = 'S')
			begin
				set @strSQL = @strSQL + ' and sale.sl_sub_class_cd in (select code_value '
			end
			else
			begin
				set @strSQL = @strSQL + ' and pp.imprv_det_sub_class_cd in (select code_value '
			end
	
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''ISUBC'')'
		end



		/* land type code */
		if (@type = 'LT')
		begin
			if (@input_value_option = 'S')
			begin
				set @strSQL = @strSQL + ' and sale.sl_land_type_cd in (select code_value '
			end
			else
			begin
				set @strSQL = @strSQL + ' and pp.land_type_cd in (select code_value '
			end
	
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''LT'')'
		end
	
		/* city */
		if (@type = 'CITY')
		begin
			if (@input_value_option = 'S')
			begin
				set @strSQL = @strSQL + ' and sale.sl_city_id in (select code_id'
			end
			else
			begin
				set @strSQL = @strSQL + ' and pp.city_id in (select code_id '
			end
	
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''CITY'')'
		end
	
		/* school */
		if (@type = 'SCHOOL')
		begin
			if (@input_value_option = 'S')
			begin
				set @strSQL = @strSQL + ' and sale.sl_school_id in (select code_id'
			end
			else
			begin
				set @strSQL = @strSQL + ' and pp.school_id in (select code_id '
			end
	
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''SCHOOL'')'
		end
	
		/* living area */
		if (@type = 'LA')
		begin
			select @begin_value = begin_value,
			       @end_value   = end_value
			from sales_ratio_report_query WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and   type = 'LA'
	
			if (@@ROWCOUNT > 0)
			begin
				if (@input_value_option = 'S')
				begin
					set @strSQL = @strSQL + ' and sale.sl_living_area >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and sale.sl_living_area <= ' + convert(varchar(18), @end_value)
				end
				else
				begin
					set @strSQL = @strSQL + ' and pp.living_area >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and pp.living_area <= ' + convert(varchar(18), @end_value)
		
				end
	
			end
		end
	
		/* effective age */
		if (@type = 'EA')
		begin
			select @begin_value = begin_value,
			       @end_value   = end_value
			from sales_ratio_report_query WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and   type = 'EA'
			
			-- HS 34801 : For Effective Age the users are trained to enter the actualy year built therefore 
			--            changing the logic accordingly

	
			if (@@ROWCOUNT > 0)
			begin
				if (@input_value_option = 'S')
				begin
					--set @strSQL = @strSQL + ' and (' + convert(varchar(4), @input_year)  + '- sale.sl_yr_blt) >= ' + convert(varchar(18), @begin_value)
					--set @strSQL = @strSQL + ' and (' + convert(varchar(4), @input_year)  + '- sale.sl_yr_blt) <= ' + convert(varchar(18), @end_value)
					set @strSQL = @strSQL + ' and ( convert(varchar(4),  sale.sl_yr_blt) ) >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and ( convert(varchar(4),  sale.sl_yr_blt) ) <= ' + convert(varchar(18), @end_value)
				
				
				end
				else
				begin
					set @strSQL = @strSQL + ' and ( convert(varchar(4),  pp.yr_blt) ) >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and ( convert(varchar(4),  pp.yr_blt) ) <= ' + convert(varchar(18), @end_value)
				end
			end
		end
	
		/* acres */
		if (@type = 'ACRES')
		begin
	
			select @begin_value = begin_value,
			       @end_value   = end_value
			from sales_ratio_report_query WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and   type = 'ACRES'
	
			if (@@ROWCOUNT > 0)
			begin
				if (@input_value_option = 'S')
				begin
					set @strSQL = @strSQL + ' and sale.sl_land_acres >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and sale.sl_land_acres <= ' + convert(varchar(18), @end_value)

				end
				else
				begin
					set @strSQL = @strSQL + ' and pp.land_acres >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and pp.land_acres <= ' + convert(varchar(18), @end_value)
				end
			end
		end
	
		/* SQFT */
		if (@type = 'SQFT')
		begin
			select @begin_value = begin_value,
			       @end_value   = end_value
			from sales_ratio_report_query WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and   type = 'SQFT'
	
			if (@@ROWCOUNT > 0)
			begin
				if (@input_value_option = 'S')
				begin
					set @strSQL = @strSQL + ' and sale.sl_land_sqft >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and sale.sl_land_sqft <= ' + convert(varchar(18), @end_value)
				end
				else
				begin
					set @strSQL = @strSQL + ' and pp.land_sqft >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and pp.land_sqft <= ' + convert(varchar(18), @end_value)
				end
	
			end
		end
	
		if (@type = 'FF')
		begin
			select @begin_value = begin_value,
			       @end_value   = end_value
			from sales_ratio_report_query WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and   type = 'FF'
	
			if (@@ROWCOUNT > 0)
			begin
				if (@input_value_option = 'S')
				begin
					set @strSQL = @strSQL + ' and sale.sl_land_front_feet >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and sale.sl_land_front_feet <= ' + convert(varchar(18), @end_value)
				end
				else
				begin
					set @strSQL = @strSQL + ' and pp.land_front_feet >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and pp.land_front_feet <= ' + convert(varchar(18), @end_value)
				end
			end
		end
	
		if (@type = 'DEPTH')
		begin
			select @begin_value = begin_value,
			       @end_value   = end_value
			from sales_ratio_report_query WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and   type = 'DEPTH'
	
			if (@@ROWCOUNT > 0)
			begin
	
				if (@input_value_option = 'S')
				begin
					set @strSQL = @strSQL + ' and sale.sl_land_depth >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and sale.sl_land_depth <= ' + convert(varchar(18), @end_value)
				end
				else
				begin
					set @strSQL = @strSQL + ' and pp.land_depth >= ' + convert(varchar(18), @begin_value)
					set @strSQL = @strSQL + ' and pp.land_depth <= ' + convert(varchar(18), @end_value)
				end
			end
		end
	
		/* ratio type */
		if (@type = 'RT')
		begin
			set @strSQL = @strSQL + ' and sale.sl_ratio_type_cd in (select code_value '
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''RT'')'
		end
	
		/* sale type */
		if (@type = 'ST')
		begin
			set @strSQL = @strSQL + ' and sale.sl_type_cd in (select code_value '
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''ST'')'
		end
	
		/* sale date */
		if (@type = 'SD')
		begin
	
			select @begin_date = begin_date,
			       @end_date   = end_date
			from sales_ratio_report_query
			where pacs_user_id = @input_user_id
			and   type = 'SD'
	
			if (@@ROWCOUNT > 0)
			begin
				set @strSQL = @strSQL + ' and sale.sl_dt >= ''' + convert(varchar(18), @begin_date) + ''''
				set @strSQL = @strSQL + ' and sale.sl_dt <= ''' + convert(varchar(18), @end_date)   + ''''
			end
	
		end
	
		/* sale price */
		if (@type = 'SP')
		begin
			select @begin_value = begin_value,
			       @end_value   = end_value
			from sales_ratio_report_query WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and   type = 'SP'
	
			if (@@ROWCOUNT > 0)
			begin
				set @strSQL = @strSQL + ' and sale.adjusted_sl_price >= ' + convert(varchar(19), @begin_value)
				set @strSQL = @strSQL + ' and sale.adjusted_sl_price <= ' + convert(varchar(19), @end_value)
			end
		end
	
		/* appraiser */
		if (@type = 'APPR')
		begin
			set @strSQL = @strSQL + ' and pv.last_appraiser_id in (select code_id'
	
			set @strSQL = @strSQL + ' from sales_ratio_report_query WITH (NOLOCK) '
			set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
			set @strSQL = @strSQL + ' and type = ''APPR'')'
		end

		/* sales ratio */
		if (@type = 'SR')
		begin
			set @bSalesRatio = 1

			/*
			 * go to the bottom of this stored procedure to
			 * to see the rest of the logic concerning
			 * sales ratio.  It's not calculated yet, so
			 * it can't be filtered here...
			 */
		end

		/* Map Id */
		if (@type = 'MAPID')
		begin
			select @begin_char_value = begin_char_value,
			       @end_char_value   = end_char_value
			from sales_ratio_report_query WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and   type = 'MAPID'
	
			if (@@ROWCOUNT > 0)
			begin
				set @strSQL = @strSQL + ' and ((pv.map_id >= ''' + @begin_char_value  + ''') and (pv.map_id <= ''' + @end_char_value + '''))'
			end
		end
	
		fetch next from query_type into @type
	end

	close query_type
	deallocate query_type

end

exec (@strSQL)



/* eliminate the extra entry for any multi property sales */
declare @mp_chg_of_owner_id 	int
declare @sale_ct		int

declare multi_prop_sales CURSOR FAST_FORWARD
for select chg_of_owner_id, count(*) as sale_ct
    from #sales_ratio_report
    where report_type = @input_report_type
    and   pacs_user_id = @input_user_id
    group by chg_of_owner_id
    having count(*) > 1

open multi_prop_sales

fetch next from multi_prop_sales into @mp_chg_of_owner_id, @sale_ct
while (@@FETCH_STATUS = 0)
begin
	set @sale_ct = @sale_ct - 1
	set rowcount @sale_ct

	delete from #sales_ratio_report 
	where report_type = @input_report_type
	and   pacs_user_id = @input_user_id
	and   chg_of_owner_id = @mp_chg_of_owner_id

	set rowcount 0

	fetch next from multi_prop_sales into @mp_chg_of_owner_id, @sale_ct
end

close multi_prop_sales
deallocate multi_prop_sales

set rowcount 0

/* apply time adjustment if applicable */
if (@input_time_adj_month > 0)
begin
	declare @temp_date varchar(15)

	set @temp_date = convert(varchar(2), @input_time_adj_month) + '/01/' + 
			 convert(varchar(4), @input_time_adj_year)
	
	set @strSQL = 'update #sales_ratio_report set sl_adj_price = '
	set @strSQL = @strSQL + 'sl_price * ((100 + (datediff(mm,  sale_dt, ''' + @temp_date + ''') * ' 
	set @strSQL = @strSQL + convert(varchar(10), @input_time_adj_pct) + '))/100.0)'
	set @strSQL = @strSQL + ' where pacs_user_id = ' + convert(varchar(12), @input_user_id)
	set @strSQL = @strSQL + ' and sale_dt is not null '
	
	exec (@strSQL)

	set @strSQL = 'delete from #sales_ratio_report '
	set @strSQL = @strSQL + ' where sl_adj_price <= 0 '
	set @strSQL = @strSQL + ' and pacs_user_id = ' + convert(varchar(12), @input_user_id)

	exec (@strSQL)
end
		


set @strSQL = 'insert into #sales_ratio_report_property '
set @strSQL = @strSQL + '( '
set @strSQL = @strSQL + '	chg_of_owner_id,'
set @strSQL = @strSQL + '	report_type, 	'
set @strSQL = @strSQL + '	pacs_user_id, 	'
set @strSQL = @strSQL + '	prop_id,     	'
set @strSQL = @strSQL + '	sup_num,     	'
set @strSQL = @strSQL + '	prop_val_yr,    '
set @strSQL = @strSQL + '	prop_type_cd, 	'
set @strSQL = @strSQL + '	subdivision_cd,	' 
set @strSQL = @strSQL + '	hood_cd,    	'
set @strSQL = @strSQL + '	subset_cd, 	'
set @strSQL = @strSQL + '	region_cd,	'
set @strSQL = @strSQL + '	geo_id,		'
set @strSQL = @strSQL + '       map_id,         '
set @strSQL = @strSQL + '	land_value,	'
set @strSQL = @strSQL + '	market_value,	'
set @strSQL = @strSQL + '	legal_acreage,	'
set @strSQL = @strSQL + '	eff_size_acres,	'
set @strSQL = @strSQL + '	legal_desc,	'
set @strSQL = @strSQL + '       prop_inactive_dt, '
set @strSQL = @strSQL + '       living_area_sqft '
set @strSQL = @strSQL + ')'
set @strSQL = @strSQL + ' select distinct #sales_ratio_report.chg_of_owner_id, '
set @strSQL = @strSQL + '	#sales_ratio_report.report_type, '
set @strSQL = @strSQL + '	#sales_ratio_report.pacs_user_id, '
set @strSQL = @strSQL + '	property.prop_id,'
set @strSQL = @strSQL + '	property_val.sup_num,'
set @strSQL = @strSQL + '	property_val.prop_val_yr,'
set @strSQL = @strSQL + '	property.prop_type_cd,'
set @strSQL = @strSQL + '	IsNULL(property_val.abs_subdv_cd, ''''),'
set @strSQL = @strSQL + '	IsNULL(property_val.hood_cd, ''''),'
set @strSQL = @strSQL + '	IsNULL(property_val.subset_cd, ''''),'
set @strSQL = @strSQL + '	IsNULL(property_val.rgn_cd, ''''),'
set @strSQL = @strSQL + '	property.geo_id,'
set @strSQL = @strSQL + '	IsNULL(property_val.map_id, ''''),'

if (@input_value_option = 'S')
begin
	set @strSQL = @strSQL + '	IsNull(chg_of_owner_prop_assoc.land_hstd_val,0) + IsNull(chg_of_owner_prop_assoc.land_non_hstd_val, 0) + IsNULL(chg_of_owner_prop_assoc.ag_market, 0) + IsNULL(chg_of_owner_prop_assoc.timber_market, 0),'
	set @strSQL = @strSQL + '	IsNull(chg_of_owner_prop_assoc.land_hstd_val,0) + IsNull(chg_of_owner_prop_assoc.land_non_hstd_val, 0) + IsNULL(chg_of_owner_prop_assoc.ag_market, 0) + IsNULL(chg_of_owner_prop_assoc.timber_market, 0) '
	set @strSQL = @strSQL + ' + IsNull(chg_of_owner_prop_assoc.imprv_hstd_val, 0) + IsNull(chg_of_owner_prop_assoc.imprv_non_hstd_val, 0),'
end
else
begin
	set @strSQL = @strSQL + '	IsNull(property_val.land_hstd_val,0) + IsNull(property_val.land_non_hstd_val, 0) + IsNULL(property_val.ag_market, 0) + IsNULL(property_val.timber_market, 0),'
	set @strSQL = @strSQL + '	IsNull(property_val.land_hstd_val,0) + IsNull(property_val.land_non_hstd_val, 0) + IsNULL(property_val.ag_market, 0) + IsNULL(property_val.timber_market, 0) + IsNull(property_val.imprv_hstd_val, 0) '
	set @strSQL = @strSQL + ' + IsNull(property_val.imprv_non_hstd_val, 0),'
end

set @strSQL = @strSQL + '	IsNull(property_val.legal_acreage, 0),'
set @strSQL = @strSQL + '	IsNull(property_val.eff_size_acres, 0),'
set @strSQL = @strSQL + '	IsNull(property_val.legal_desc, ''''),'
set @strSQL = @strSQL + '	case when property_val.udi_parent = ''T'' then null else property_val.prop_inactive_dt end,'
	
if (@input_value_option = 'S')
begin

	set @strSQL = @strSQL + '           IsNull(sale.sl_living_area, 0)'
	set @strSQL = @strSQL + '	from #sales_ratio_report WITH (NOLOCK), chg_of_owner_prop_assoc WITH (NOLOCK), property WITH (NOLOCK), property_val WITH (NOLOCK),  sale WITH (NOLOCK)'
	set @strSQL = @strSQL + '	where #sales_ratio_report.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id'
	set @strSQL = @strSQL + '	and  chg_of_owner_prop_assoc.prop_id 	= property.prop_id'
	set @strSQL = @strSQL + '          and  chg_of_owner_prop_assoc.chg_of_owner_id = sale.chg_of_owner_id'
	set @strSQL = @strSQL + '	and  property.prop_id = property_val.prop_id'
	set @strSQL = @strSQL + '	and  property_val.prop_id = chg_of_owner_prop_assoc.prop_id'
	set @strSQL = @strSQL + '	and  property_val.sup_num = chg_of_owner_prop_assoc.sup_num'	set @strSQL = @strSQL + '	and  property_val.prop_val_yr = chg_of_owner_prop_assoc.sup_tax_yr'	set @strSQL = @strSQL + '	and  #sales_ratio_report.pacs_user_id = '
	set @strSQL = @strSQL + convert(varchar(12), @input_user_id)

end
else
begin
	
	set @strSQL = @strSQL + '          IsNull(property_profile.living_area, 0) '
	set @strSQL = @strSQL + '	from #sales_ratio_report WITH (NOLOCK), chg_of_owner_prop_assoc WITH (NOLOCK), property WITH (NOLOCK), property_val WITH (NOLOCK), prop_supp_assoc WITH (NOLOCK), property_profile WITH (NOLOCK)'
	set @strSQL = @strSQL + '	where #sales_ratio_report.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id'
	set @strSQL = @strSQL + '	and  chg_of_owner_prop_assoc.prop_id 	= property.prop_id'
	set @strSQL = @strSQL + '	and  property.prop_id = property_val.prop_id'
	set @strSQL = @strSQL + '	and  property_val.prop_id = prop_supp_assoc.prop_id'
	set @strSQL = @strSQL + '	and  property_val.sup_num = prop_supp_assoc.sup_num'
	set @strSQL = @strSQL + '	and  property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr'
	set @strSQL = @strSQL + '          and  property_val.prop_id = property_profile.prop_id'
	set @strSQL = @strSQL + '          and  property_val.prop_val_yr = property_profile.prop_val_yr'
	set @strSQL = @strSQL + '	and  prop_supp_assoc.owner_tax_yr = ' + convert(varchar(4), @input_year)
	set @strSQL = @strSQL + '	and  #sales_ratio_report.pacs_user_id = ' + convert(varchar(12), @input_user_id)

end


	
exec (@strSQL)

update #sales_ratio_report set 
      		            
       #sales_ratio_report.temp_subdivision_cd = (select top 1 subdivision_cd 
					       from #sales_ratio_report_property WITH (NOLOCK)
					       where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
       #sales_ratio_report.temp_hood_cd = (select top 1 hood_cd 
					       from #sales_ratio_report_property WITH (NOLOCK)
					       where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
       #sales_ratio_report.temp_region_cd = (select top 1 region_cd 
					       from #sales_ratio_report_property WITH (NOLOCK)
					       where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
       #sales_ratio_report.temp_subset_cd = (select top 1 subset_cd 
					       from #sales_ratio_report_property WITH (NOLOCK)
					       where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id)
					       
where     pacs_user_id = @input_user_id 

update #sales_ratio_report_property
set hood_imprv_pct = IsNull(neighborhood.hood_imprv_pct, 100),
    hood_land_pct  = IsNull(neighborhood.hood_land_pct, 100)
from neighborhood WITH (NOLOCK)
where #sales_ratio_report_property.hood_cd = neighborhood.hood_cd
and   #sales_ratio_report_property.prop_val_yr = neighborhood.hood_yr
and   pacs_user_id = @input_user_id

update #sales_ratio_report_property
set as_imprv_pct = IsNull(abs_subdv.abs_imprv_pct, 100),
    as_land_pct  = IsNull(abs_subdv.abs_land_pct, 100)
from abs_subdv WITH (NOLOCK)
where #sales_ratio_report_property.subdivision_cd = abs_subdv_cd
and   #sales_ratio_report_property.prop_val_yr = abs_subdv.abs_subdv_yr
and   pacs_user_id = @input_user_id


/****************************************/
/********** build sales options *********/
/****************************************/


/*************************************************************/
/* now call this funtion to calculate ratios, cod, cov's etc */
/*************************************************************/
declare @summary1 	char(1)
declare @summary2	char(1)
declare @summary3	char(1)
declare @summary4	char(1)

select  @summary1 = IsNull(summary1, 'F'),
	@summary2 = IsNull(summary2, 'F'),
	@summary3 = IsNull(summary3, 'F'),
	@summary4 = IsNull(summary4, 'F')
from #sales_ratio_report WITH (NOLOCK)
where pacs_user_id = @input_user_id


/*
 * Sort fields have to be populated before SalesRatioReportUpdate
 */

-- entity codes
update #sales_ratio_report set school_cd = entity.entity_cd
from entity WITH (NOLOCK)
where entity.entity_id = #sales_ratio_report.school_id
and   pacs_user_id = @input_user_id

update #sales_ratio_report set city_cd = entity.entity_cd
from entity WITH (NOLOCK)
where entity.entity_id = #sales_ratio_report.city_id
and   pacs_user_id = @input_user_id


exec (@input_update_sort1)
exec (@input_update_sort2)
exec (@input_update_sort3)
exec (@input_update_sort4)

exec SalesRatioReportUpdate @input_user_id, @input_report_type, @summary1, @summary2, @summary3, @summary4


/*
 * Issue: User filtered on sales ratio range.  Sales ratio is calculated by the
 * SalesRatioReportUpdate stored procedure.  So can't filter until this is done.

 * However, after the sales ratio is filtered, all of the statistical totals are
 * now off, so it will have to be run again with the filtered set of data.
 */

if @bSalesRatio = 1
begin
	select @begin_value = begin_value,
	       @end_value   = end_value
	from sales_ratio_report_query WITH (NOLOCK)
	where pacs_user_id = @input_user_id
	and   type = 'SR'

	delete from #sales_ratio_report 
	where pacs_user_id = @input_user_id
	and report_type = @input_report_type
	and (sales_ratio < @begin_value or sales_ratio > @end_value)

	exec SalesRatioReportUpdate @input_user_id, @input_report_type, @summary1, @summary2, @summary3, @summary4
	/*
     * If user sorted by sales ratio, the sorts need to be done again...
	 */
end


exec (@input_update_sort1)
exec (@input_update_sort2)
exec (@input_update_sort3)
exec (@input_update_sort4)


exec SalesRatioReportUpdateAdditionalFields @input_user_id, @input_value_option


insert into sales_ratio_report select * from #sales_ratio_report
insert into sales_ratio_report_property select * from #sales_ratio_report_property

GO

