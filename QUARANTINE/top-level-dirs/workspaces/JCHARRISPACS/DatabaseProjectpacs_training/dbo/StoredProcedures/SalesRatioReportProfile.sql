




CREATE PROCEDURE SalesRatioReportProfile

@input_detail_id	int,
@input_user_id 		int,
@input_report_type    	varchar(5)

as


declare @strSQL 	varchar(4096)

/******************************/
/***** create temp tables *****/
/******************************/
CREATE TABLE #sales_ratio_report (
	[chg_of_owner_id] [int] NOT NULL ,
	[report_type] [varchar] (5) NOT NULL ,
	[pacs_user_id] [int] NOT NULL ,
	[sort1] [varchar] (100) NULL ,
	[sort2] [varchar] (100) NOT NULL ,
	[sort3] [varchar] (100) NOT NULL ,
	[sort4] [varchar] (100) NOT NULL ,
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
	[report_type] [char] (5) NOT NULL ,
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



set @strSQL = 'insert into #sales_ratio_report'
set @strSQL = @strSQL + ' ('
set @strSQL = @strSQL + ' chg_of_owner_id,' 
set @strSQL = @strSQL + ' report_type,'                                        
set @strSQL = @strSQL + ' pacs_user_id,'                                                           
set @strSQL = @strSQL + ' state_cd, '
set @strSQL = @strSQL + ' school_id, '  
set @strSQL = @strSQL + ' city_id,  '                                                                       
set @strSQL = @strSQL + ' imprv_class,' 
set @strSQL = @strSQL + ' actual_yr_built,' 
set @strSQL = @strSQL + ' living_area_sqft,'     
set @strSQL = @strSQL + ' land_type_cd, '
set @strSQL = @strSQL + ' sale_dt,'                                                                                                                                                                                                                            

set @strSQL = @strSQL + ' sl_adj_price,'
set @strSQL = @strSQL + ' sort1,'
set @strSQL = @strSQL + ' sort2,'
set @strSQL = @strSQL + ' sort3,'
set @strSQL = @strSQL + ' sort4,'
set @strSQL = @strSQL + ' summary1,'
set @strSQL = @strSQL + ' summary2,'
set @strSQL = @strSQL + ' summary3,'
set @strSQL = @strSQL + ' summary4, '     
set @strSQL = @strSQL + 'include_no_calc,'
set @strSQL = @strSQL + 'sl_type_cd,'
set @strSQL = @strSQL + 'sl_ratio_cd,'
set @strSQL = @strSQL + 'eff_yr_built,'
set @strSQL = @strSQL + 'supress_detail,'
set @strSQL = @strSQL + 'include_reason,'
set @strSQL = @strSQL + 'geo_id,'
set @strSQL = @strSQL + ' sl_adj_reason,'
set @strSQL = @strSQL + ' true_sl_price '
set @strSQL = @strSQL + ' )'
set @strSQL = @strSQL + ' select distinct' 
set @strSQL = @strSQL + ' ppls.chg_of_owner_id,'
set @strSQL = @strSQL + '''' + convert(varchar(12), @input_report_type) + '''' + ','
set @strSQL = @strSQL + convert(varchar(12), @input_user_id) + ','
set @strSQL = @strSQL + ' ppls.sl_state_cd,' 
set @strSQL = @strSQL + ' ppls.sl_school_id,' 
set @strSQL = @strSQL + ' ppls.sl_city_id, ' 
set @strSQL = @strSQL + ' ppls.sl_class_cd, '
set @strSQL = @strSQL + ' ppls.sl_yr_blt, '
set @strSQL = @strSQL + ' ppls.sl_living_area,'  
set @strSQL = @strSQL + ' ppls.sl_land_type_cd,'  
set @strSQL = @strSQL + ' ppls.sale_dt,'   
set @strSQL = @strSQL + ' ppls.sale_price,'
set @strSQL = @strSQL + ''''', '
set @strSQL = @strSQL + ''''','
set @strSQL = @strSQL + ''''','
set @strSQL = @strSQL + ''''','
set @strSQL = @strSQL + '''F'','
set @strSQL = @strSQL + '''F'','
set @strSQL = @strSQL + '''F'','
set @strSQL = @strSQL + '''F'','
set @strSQL = @strSQL + ' IsNull(ppls.include_no_calc, ''F''),'
set @strSQL = @strSQL + ' ppls.sl_type_cd,'
set @strSQL = @strSQL + ' ppls.sl_ratio_cd,'
set @strSQL = @strSQL + ' ppls.eff_yr_blt,'
set @strSQL = @strSQL + '''F'','
set @strSQL = @strSQL + ' IsNull(ppls.include_reason, ''''),'
set @strSQL = @strSQL + ' p.geo_id, '
set @strSQL = @strSQL + ' CASE WHEN ppls.sl_price <> ppls.adjusted_sl_price THEN ppls.sl_adj_rsn ELSE '''' END, '
set @strSQL = @strSQL + ' ppls.sl_price '

set @strSQL = @strSQL + ' from  profile_prop_list_sales ppls WITH (NOLOCK),' 
set @strSQL = @strSQL + '        profile_prop_list ppl WITH (NOLOCK),'
set @strSQL = @strSQL + '        property p WITH (NOLOCK) '
set @strSQL = @strSQL + ' where ppls.prop_id = ppl.prop_id'
set @strSQL = @strSQL + ' and ppl.detail_id = ppl.detail_id'
set @strSQL = @strSQL + ' and ppl.prop_id = p.prop_id '
set @strSQL = @strSQL + ' and ppls.detail_id = ' + convert(varchar(12), @input_detail_id)

if (@input_report_type = 'I')
begin
	set @strSQL = @strSQL + ' and ppl.imprv_hstd_val + ppl.imprv_non_hstd_val > 0 '
end
else if (@input_report_type = 'VL')
begin
	set @strSQL = @strSQL + ' and ppl.imprv_hstd_val + ppl.imprv_non_hstd_val <= 0 '
	set @strSQL = @strSQL + ' and   ppl.land_num_lots > 0 '
	set @strSQL = @strSQL + ' and   ppl.land_appr_method = ''LOT'''
	set @strSQL = @strSQL + ' and   ppls.sale_price > 0'
end
else if (@input_report_type = 'VFF')
begin
	set @strSQL = @strSQL + ' and ppl.imprv_hstd_val + ppl.imprv_non_hstd_val <= 0 '
	set @strSQL = @strSQL + ' and   ppl.land_front_feet > 0'
	set @strSQL = @strSQL + ' and   ppl.land_appr_method = ''FF'''
	set @strSQL = @strSQL + ' and   ppls.sale_price > 0'
end
else if (@input_report_type = 'VAS')

begin
	set @strSQL = @strSQL + ' and ppl.imprv_hstd_val + ppl.imprv_non_hstd_val <= 0 '
	set @strSQL = @strSQL + ' and   ppl.land_total_sqft > 0 '
	set @strSQL = @strSQL + ' and   ppl.land_appr_method in (''A'', ''SQ'')'
	set @strSQL = @strSQL + ' and   ppls.sale_price > 0'
end

set @strSQL = @strSQL + ' and ppls.mp_sale is null '

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
	select * into #temp_list
	from  #sales_ratio_report
	where report_type = @input_report_type
	and   pacs_user_id = @input_user_id
	and   chg_of_owner_id = @mp_chg_of_owner_id

	delete from #sales_ratio_report 
	where report_type = @input_report_type
	and   pacs_user_id = @input_user_id
	and   chg_of_owner_id = @mp_chg_of_owner_id

	insert into #sales_ratio_report select top 1 * from #temp_list 

	drop table #temp_list

	fetch next from multi_prop_sales into @mp_chg_of_owner_id, @sale_ct
end

close multi_prop_sales
deallocate multi_prop_sales




/************************/
/***** prep the data ****/
/************************/

insert into #sales_ratio_report_property
(
	chg_of_owner_id, 
	report_type, 
	pacs_user_id, 
	prop_id,     
             sup_num,
             prop_val_yr,
	prop_type_cd, 
	subset_cd, 
	region_cd,
	geo_id,
	legal_acreage,
	eff_size_acres,
	legal_desc,
	land_value,
	market_value,
	living_area_sqft,
	subdivision_cd,
	as_imprv_pct, 
	as_land_pct,
	hood_cd,
	hood_imprv_pct, 

	hood_land_pct,
	prop_inactive_dt 
)
select distinct #sales_ratio_report.chg_of_owner_id, 
	#sales_ratio_report.report_type, 
	#sales_ratio_report.pacs_user_id, 
	property.prop_id,
	property_val.sup_num,
	property_val.prop_val_yr,
	property.prop_type_cd,
	IsNULL(property_val.subset_cd, ''),
	IsNULL(property_val.rgn_cd, ''),
	property.geo_id,
	IsNULL(property_val.legal_acreage, 0),
	IsNULL(property_val.eff_size_acres, 0),
	IsNULL(property_val.legal_desc, ''),
	IsNull(profile_prop_list.land_hstd_val,0) + IsNull(profile_prop_list.land_non_hstd_val, 0) + IsNULL(profile_prop_list.ag_market, 0) + IsNULL(profile_prop_list.timber_market, 0) as land_value,
	IsNull(profile_prop_list.imprv_hstd_val,0) + IsNull(profile_prop_list.imprv_non_hstd_val, 0) + 
	IsNull(profile_prop_list.land_hstd_val,0) + IsNull(profile_prop_list.land_non_hstd_val, 0) + 
	IsNULL(profile_prop_list.ag_market, 0) + IsNULL(profile_prop_list.timber_market, 0) as market,
	IsNull(profile_prop_list.living_area, 0) as living_area,
	IsNULL(as_cd, ''),      
	IsNULL(as_imprv_pct, 100),
	IsNULL(as_land_pct, 100), 
	IsNULL(nbhd_cd, ''),                                            
	IsNULL(nbhd_imprv_pct, 100), 
	IsNULL(nbhd_land_pct, 100) ,
        property_val.prop_inactive_dt
	

from #sales_ratio_report WITH (NOLOCK), 
	profile_prop_list_sales WITH (NOLOCK), 
	property_val WITH (NOLOCK), 
	property WITH (NOLOCK), 
	profile_prop_list WITH (NOLOCK)
where #sales_ratio_report.chg_of_owner_id  = profile_prop_list_sales.chg_of_owner_id
and   profile_prop_list_sales.prop_id     = profile_prop_list.prop_id
and   profile_prop_list_sales.detail_id = profile_prop_list.detail_id
and   profile_prop_list.prop_id           = property_val.prop_id
and   profile_prop_list.sup_num           = property_val.sup_num
and   profile_prop_list.prop_val_yr       = property_val.prop_val_yr
and   property_val.prop_id		  = property.prop_id
and   #sales_ratio_report.pacs_user_id     = @input_user_id
and   profile_prop_list_sales.detail_id   = @input_detail_id
and   profile_prop_list_sales.mp_sale is null



insert into #sales_ratio_report_property
(
	chg_of_owner_id, 
	report_type, 
	pacs_user_id, 
	prop_id,     
             sup_num,
             prop_val_yr,
	prop_type_cd, 
	subset_cd, 
	region_cd,
	geo_id,
	legal_acreage,
	eff_size_acres,
	legal_desc,
	land_value,
	market_value,
	living_area_sqft,
	subdivision_cd,
	as_imprv_pct, 
	as_land_pct,
	hood_cd,
	hood_imprv_pct, 
	hood_land_pct,
	prop_inactive_dt 
)
select distinct #sales_ratio_report.chg_of_owner_id, 
	#sales_ratio_report.report_type, 
	#sales_ratio_report.pacs_user_id, 
	property.prop_id,
	property_val.sup_num,
	property_val.prop_val_yr,
	property.prop_type_cd,
	IsNULL(property_val.subset_cd, ''),
	IsNULL(property_val.rgn_cd, ''),
	property.geo_id,
	IsNULL(property_val.legal_acreage, 0),
	IsNULL(property_val.eff_size_acres, 0),
	IsNULL(property_val.legal_desc, ''),
	IsNull(property_val.land_hstd_val,0) + IsNull(property_val.land_non_hstd_val, 0) + IsNULL(property_val.ag_market, 0) + IsNULL(property_val.timber_market, 0) as land_value,
	IsNull(property_val.imprv_hstd_val,0) + IsNull(property_val.imprv_non_hstd_val, 0) + 
	IsNull(property_val.land_hstd_val,0) + IsNull(property_val.land_non_hstd_val, 0) + 
	IsNULL(property_val.ag_market, 0) + IsNULL(property_val.timber_market, 0) as market,
	IsNull(property_profile.living_area, 0) as living_area,
	'', 0, 0, '', 0, 0, 
        property_val.prop_inactive_dt
	

from #sales_ratio_report WITH (NOLOCK), 
	profile_prop_list_sales WITH (NOLOCK), 
	property_val WITH (NOLOCK), 
        property_profile with (nolock),
	property WITH (NOLOCK)
where #sales_ratio_report.chg_of_owner_id  = profile_prop_list_sales.chg_of_owner_id
and   profile_prop_list_sales.prop_id           = property_val.prop_id
and   profile_prop_list_sales.sup_num           = property_val.sup_num
and   profile_prop_list_sales.prop_val_yr       = property_val.prop_val_yr
and   property_val.prop_id 			= property_profile.prop_id
and   property_val.sup_num 			= property_profile.sup_num
and   property_val.prop_val_yr 			= property_profile.prop_val_yr
and   property_val.prop_id		  	= property.prop_id
and   #sales_ratio_report.pacs_user_id     	= @input_user_id
and   profile_prop_list_sales.detail_id   	= @input_detail_id
and   profile_prop_list_sales.mp_sale 		= 'T'




update #sales_ratio_report 
set 
      #sales_ratio_report.temp_subdivision_cd = (select top 1 subdivision_cd 
					        from #sales_ratio_report_property 
					        where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
      #sales_ratio_report.temp_hood_cd = (select top 1 hood_cd 
  				         from #sales_ratio_report_property 
				         where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
      #sales_ratio_report.temp_region_cd = (select top 1 region_cd 
				           from #sales_ratio_report_property 
				           where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
      #sales_ratio_report.temp_subset_cd = (select top 1 subset_cd 
 				           from #sales_ratio_report_property 
					   where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id)
								       
where pacs_user_id = @input_user_id 




/****************************************/
/********** build sales options *********/
/****************************************/

create table  #sales
(
chg_of_owner_id		int,
sale_dt			datetime,
sale_price		numeric(14),
sale_ratio		numeric(18,5),
sale_ratio_land 	numeric(18,5),
sale_avg_price_sqft	numeric(18,5),
avg_price_sqft		numeric(18,5),
land_value		numeric(14),
land_market_ratio	numeric(18,5),
market_value		numeric(14),
living_area_sqft	numeric(18,4)
)

create table #sales_prop
(
chg_of_owner_id		int,

prop_id			int,
land_value		numeric(14),
market_value		numeric(14),
living_area_sqft	numeric(18,4)
)


create table  #sale_ratio
(
sale_ratio		numeric(18,5)
)


insert into #sales (chg_of_owner_id, sale_dt, sale_price)

select chg_of_owner_id, sale_dt, IsNull(sl_adj_price, 0)
from #sales_ratio_report
where pacs_user_id = @input_user_id


insert into #sales_prop (chg_of_owner_id, prop_id, land_value, market_value, living_area_sqft)
select chg_of_owner_id, prop_id, IsNull(land_value, 0), IsNull(market_value, 0), IsNull(living_area_sqft, 0)
from #sales_ratio_report_property
where pacs_user_id = @input_user_id


/*************************************************************/
/* now call this funtion to calculate ratios, cod, cov's etc */
/*************************************************************/
exec SalesRatioReportUpdate @input_user_id,  @input_report_type, 'F', 'F', 'F', 'F'
exec SalesRatioReportUpdateAdditionalFields @input_user_id, 'C'


-- profile report sorts by ratio type, then geo_id always...
update #sales_ratio_report
set sort1 = sl_ratio_cd,
	sort2 = geo_id
where pacs_user_id = @input_user_id





insert into sales_ratio_report select * from #sales_ratio_report
insert into sales_ratio_report_property select * from #sales_ratio_report_property



drop table #sales_ratio_report
drop table #sales_ratio_report_property


-- this will print the header information on the sales ratio report
exec SalesRatioReportProfileBuildCriteria @input_detail_id, @input_user_id

GO

