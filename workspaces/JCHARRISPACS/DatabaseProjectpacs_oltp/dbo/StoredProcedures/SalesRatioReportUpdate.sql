



CREATE  PROCEDURE SalesRatioReportUpdate

	@input_user_id		int,
	@input_report_type	varchar(5),
	@input_sum_sort1	char(1),
	@input_sum_sort2	char(1),
	@input_sum_sort3	char(1),
	@input_sum_sort4	char(1)

as

create table  #sales
(
chg_of_owner_id		int,
sale_dt			datetime,
sale_price		numeric(14),
sale_ratio		numeric(18,5),sale_ratio_land 	numeric(18,5),
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
from #sales_ratio_report WITH (NOLOCK)
where pacs_user_id = @input_user_id


insert into #sales_prop (chg_of_owner_id, prop_id, land_value, market_value, living_area_sqft)
select chg_of_owner_id, prop_id, IsNull(land_value, 0), IsNull(market_value, 0), IsNull(living_area_sqft, 0)
from #sales_ratio_report_property WITH (NOLOCK)
where pacs_user_id = @input_user_id


update #sales_ratio_report_property
set appraiser_nm = appraiser.appraiser_nm
--from property, appraiser (jmd)
from  property_val WITH (NOLOCK), appraiser WITH (NOLOCK)
--last_appraiser_id no longer in [property] (jmd)
--where appraiser.appraiser_id = property.last_appraiser_id
where appraiser.appraiser_id = property_val.last_appraiser_id
and     property_val.prop_id = #sales_ratio_report_property.prop_id
and     property_val.sup_num = #sales_ratio_report_property.sup_num
and     property_val.prop_val_yr = #sales_ratio_report_property.prop_val_yr
and     #sales_ratio_report_property.pacs_user_id = @input_user_id



/***************************************/
/***** build additional information ****/
/***************************************/

update #sales_ratio_report 
set   #sales_ratio_report.temp_subdivision_cd 	= (select top 1 subdivision_cd 
					           from #sales_ratio_report_property WITH (NOLOCK)
					           where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
      #sales_ratio_report.temp_hood_cd 		= (select top 1 hood_cd 
					           from #sales_ratio_report_property WITH (NOLOCK)
					           where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
      #sales_ratio_report.temp_region_cd 	= (select top 1 region_cd 
				       		   from #sales_ratio_report_property WITH (NOLOCK)
				       		   where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id),
      #sales_ratio_report.temp_subset_cd 	= (select top 1 subset_cd 
						   from #sales_ratio_report_property WITH (NOLOCK)
						   where #sales_ratio_report_property.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id)      
where pacs_user_id = @input_user_id 


-- entity codes
update #sales_ratio_report set school_cd = entity.entity_cd
from entity WITH (NOLOCK)
where entity.entity_id = #sales_ratio_report.school_id
and   pacs_user_id = @input_user_id

update #sales_ratio_report set city_cd = entity.entity_cd
from entity WITH (NOLOCK)
where entity.entity_id = #sales_ratio_report.city_id
and   pacs_user_id = @input_user_id


-- property info
update #sales_ratio_report_property
set situs_location = REPLACE(isnull(situs_display, ''), CHAR(13) + CHAR(10), ' ')  
from situs WITH (NOLOCK)
where #sales_ratio_report_property.prop_id = situs.prop_id
and   situs.primary_situs = 'Y'
and   pacs_user_id = @input_user_id


update #sales_ratio_report set sales_ratio = 0
where pacs_user_id = @input_user_id
and (sl_adj_price =  0
or    sl_adj_price is null)

-- buyer information
update #sales_ratio_report set buyer_name =  account.file_as_name
from buyer_assoc WITH (NOLOCK), account WITH (NOLOCK)
where  buyer_assoc.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id
and     buyer_assoc.buyer_id = account.acct_id 
and      pacs_user_id = @input_user_id

update #sales_ratio_report set seller_name =  account.file_as_name
from seller_assoc WITH (NOLOCK), account WITH (NOLOCK)
where  seller_assoc.chg_of_owner_id = #sales_ratio_report.chg_of_owner_id
and     seller_assoc.seller_id = account.acct_id 
and      pacs_user_id = @input_user_id

update #sales_ratio_report set deed_dt = chg_of_owner.deed_dt,
			      deed_num = chg_of_owner.deed_num,
			      deed_book_id = chg_of_owner.deed_book_id,
			      deed_book_page = chg_of_owner.deed_book_page,
			      deed_comment     = chg_of_owner.comment
from chg_of_owner WITH (NOLOCK)
where #sales_ratio_report.chg_of_owner_id = chg_of_owner.chg_of_owner_id
and      pacs_user_id = @input_user_id

update #sales_ratio_report set confirmed_source = sale_conf.confirmed_source,
			       confirmed_by = sale_conf.confirmed_by,
			       confirmed_dt = sale_conf.confirmed_dt
from sale_conf WITH (NOLOCK)
where #sales_ratio_report.chg_of_owner_id = sale_conf.chg_of_owner_id
and    sale_conf.primary_sl_conf = 'T' 
and     pacs_user_id = @input_user_id

-- land dimensions
update #sales_ratio_report set dimensions = ' '
where pacs_user_id = @input_user_id

-- sqft
update #sales_ratio_report set dimensions =  dimensions + '  SQ: ' + convert(varchar(15), sale.sl_land_sqft) --Was varchar(10) and causing errors - HelpSTAR #11038 - EricZ 07/31/2003
from sale WITH (NOLOCK)
where pacs_user_id = @input_user_id
and     #sales_ratio_report.chg_of_owner_id = sale.chg_of_owner_id
and      sale.sl_land_sqft is not null
and      sale.sl_land_sqft <> 0

-- acres
update #sales_ratio_report set dimensions =  dimensions + '  AC: ' + convert(varchar(10), sale.sl_land_acres)
from sale WITH (NOLOCK)
where pacs_user_id = @input_user_id
and     #sales_ratio_report.chg_of_owner_id = sale.chg_of_owner_id
and     sale.sl_land_acres is not null
and     sale.sl_land_acres <> 0

-- ff
update #sales_ratio_report set dimensions =  dimensions + '  FF: ' + convert(varchar(10), sale.sl_land_front_feet)
from sale WITH (NOLOCK)
where pacs_user_id = @input_user_id
and     #sales_ratio_report.chg_of_owner_id = sale.chg_of_owner_id
and      sale.sl_land_front_feet is not null
and      sale.sl_land_front_feet <> 0

-- depth
update #sales_ratio_report set dimensions =  dimensions + '  DEPTH: ' + convert(varchar(10), sale.sl_land_depth)
from sale WITH (NOLOCK)
where pacs_user_id = @input_user_id
and     #sales_ratio_report.chg_of_owner_id = sale.chg_of_owner_id
and     sale.sl_land_depth is not null 
and     sale.sl_land_depth <> 0





/*********************************/
/***** Calculate the Ratio ******/
/********************************/
exec GetSalesRatio



update #sales_ratio_report
set appraised_val       = #sales.market_value,
sales_ratio             = #sales.sale_ratio, 
land_val                = #sales.land_value,
prop_ratio              = 0,
imprv_val 	        = #sales.market_value - #sales.land_value,
appr_avg_price_per_sqft = #sales.avg_price_sqft,
sale_avg_price_per_sqft = #sales.sale_avg_price_sqft,
land_market_ratio	= #sales.land_market_ratio,
land_ratio		= #sales.sale_ratio_land

from #sales
where #sales_ratio_report.chg_of_owner_id = #sales.chg_of_owner_id
and   #sales_ratio_report.pacs_user_id = @input_user_id


/****************************************/
/***** get the stats on the ratio *******/
/****************************************/
declare @count		int		
declare @low		numeric(18,5)	
declare @high		numeric(18,5)	
declare @avg		numeric(18,5)	
declare @median		numeric(18,5)	
declare @cod		numeric(18,5)	
declare @cov		numeric(18,5)	
declare @aad		numeric(18,5)	
declare @stdev		numeric(18,5)	
declare @wt_mean	numeric(18,5)  
declare @prd		numeric(18,5)	
declare @pop_var	numeric(18,5)

declare @lr_count	int		
declare @lr_low		numeric(18,5)	
declare @lr_high	numeric(18,5)	
declare @lr_avg		numeric(18,5)	
declare @lr_median	numeric(18,5)	
declare @lr_cod		numeric(18,5)	
declare @lr_cov		numeric(18,5)	
declare @lr_aad		numeric(18,5)	
declare @lr_stdev	numeric(18,5)	
declare @lr_wt_mean	numeric(18,5)  
declare @lr_prd		numeric(18,5)	
declare @lr_pop_var	numeric(18,5)


declare @lr_mkt_count	int		
declare @lr_mkt_low	numeric(18,5)	
declare @lr_mkt_high	numeric(18,5)	
declare @lr_mkt_avg	numeric(18,5)	
declare @lr_mkt_median	numeric(18,5)	
declare @lr_mkt_cod	numeric(18,5)	
declare @lr_mkt_cov	numeric(18,5)	
declare @lr_mkt_aad	numeric(18,5)	
declare @lr_mkt_stdev	numeric(18,5)	
declare @lr_mkt_wt_mean	numeric(18,5)  
declare @lr_mkt_prd	numeric(18,5)	
declare @lr_mkt_pop_var	numeric(18,5)

declare @sort1		varchar(100)
declare @sort2		varchar(100)
declare @sort3		varchar(100)
declare @sort4		varchar(100)


create table #stats_list
(
value numeric(18,5) null
)


create table #stats_sale_price
(
sale_price numeric(18, 5) null
)


create table #stats_appr_value
(
appr_value numeric(18, 5) null
)


create table #stats_land_value
(
land_value numeric(18, 5) null
)


/*********************************/
/************* sort 1 ************/
/*********************************/

if (@input_sum_sort1 = 'T')
begin
	
	declare sort1_sales CURSOR FAST_FORWARD	for select distinct sort1
	from #sales_ratio_report WITH (NOLOCK)
	where pacs_user_id = @input_user_id
	and   include_no_calc = 'F'
	order by sort1
	
	open sort1_sales
	fetch next from sort1_sales into @sort1
	
	while (@@FETCH_STATUS = 0)
	begin
		delete from #stats_list
		delete from #stats_sale_price
		delete from #stats_appr_value
		delete from #stats_land_value
	
		if (@input_report_type = 'LP')
		begin

			-- use land ratio instead of sales ratio (for vacant land report)
			insert into #stats_list (value) 
			select land_ratio
			from #sales_ratio_report WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and sort1 = @sort1
			and include_no_calc = 'F'

		end
		else
		begin

			insert into #stats_list (value) 
			select sales_ratio
			from #sales_ratio_report WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and sort1 = @sort1
			and include_no_calc = 'F'

		end

		
		insert into #stats_sale_price (sale_price) 
		select sl_adj_price
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and include_no_calc = 'F'
		
		insert into #stats_appr_value (appr_value) 
		select appraised_val
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and include_no_calc = 'F'
		
		insert into #stats_land_value (land_value) 
		select land_val 
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and include_no_calc = 'F'
	
		exec GetStats 'SR', @count output, @low output, @high output, 
				    @avg output, @median output, @cod output, 
				    @cov output, @aad output, @stdev output, 
				    @wt_mean output, @prd output, @pop_var output, @input_report_type
		
		delete from #stats_list
		delete from #stats_sale_price
		delete from #stats_appr_value
		delete from #stats_land_value
		
		insert into #stats_list (value) 
		select land_ratio
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and include_no_calc = 'F'

		exec GetStats '',   @lr_count   output, @lr_low output,    @lr_high output, 
				    @lr_avg     output, @lr_median output, @lr_cod output, 
				    @lr_cov     output, @lr_aad output,    @lr_stdev output, 
				    @lr_wt_mean output, @lr_prd output,    @lr_pop_var output, @input_report_type

		delete from #stats_list
		
		insert into #stats_list (value) 
		select land_market_ratio
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and include_no_calc = 'F'

		exec GetStats '',   @lr_mkt_count   output, @lr_mkt_low output,    @lr_mkt_high output, 
				    @lr_mkt_avg     output, @lr_mkt_median output, @lr_mkt_cod output, 
				    @lr_mkt_cov     output, @lr_mkt_aad output,    @lr_mkt_stdev output, 
				    @lr_mkt_wt_mean output, @lr_mkt_prd output,    @lr_mkt_pop_var output, @input_report_type
		
		
		update #sales_ratio_report set sort1_temp_avg_dev    = @aad,
					      sort1_temp_median     = @median,
					      sort1_temp_avg        = @avg ,					      sort1_temp_cod        = @cod,
					      sort1_temp_pop_var    = @pop_var,
					      sort1_temp_stdev      = @stdev,
					      sort1_temp_prd        = @prd,
					      sort1_temp_wt_mean    = @wt_mean,
					      sort1_temp_max        = @high,
					      sort1_temp_min        = @low,
					      sort1_land_ratio_mean   = @lr_avg,
					      sort1_land_ratio_median = @lr_median,
					      sort1_land_mkt_ratio_mean   = @lr_mkt_avg,
					      sort1_land_mkt_ratio_median = @lr_mkt_median
		
		where pacs_user_id = @input_user_id
		and sort1 = @sort1

		fetch next from sort1_sales into @sort1
	
	end
	
	close	   sort1_sales
	deallocate sort1_sales
end

/*********************************/
/************* sort 2 ************/
/*********************************/
if (@input_sum_sort2 = 'T')
begin
	
	declare sort2_sales CURSOR FAST_FORWARD
	for select distinct sort1, sort2
	from #sales_ratio_report WITH (NOLOCK)
	where pacs_user_id = @input_user_id
	and   include_no_calc = 'F'
	order by sort1, sort2
	
	open sort2_sales
	fetch next from sort2_sales into @sort1, @sort2
	
	while (@@FETCH_STATUS = 0)
	begin
		delete from #stats_list
		delete from #stats_sale_price
		delete from #stats_appr_value
		delete from #stats_land_value
	
		if (@input_report_type = 'LP')
		begin

			-- use land ratio instead of sales ratio (for vacant land report)
			insert into #stats_list (value) 
			select land_ratio
			from #sales_ratio_report WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and sort1 = @sort1
			and sort2 = @sort2
			and include_no_calc = 'F'

		end
		else
		begin
	
			insert into #stats_list (value) 
			select sales_ratio
			from #sales_ratio_report WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and sort1 = @sort1
			and sort2 = @sort2
			and include_no_calc = 'F'

		end
		
		insert into #stats_sale_price (sale_price) 
		select sl_adj_price
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and include_no_calc = 'F'
		
		insert into #stats_appr_value (appr_value) 
		select appraised_val
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and include_no_calc = 'F'
		
		insert into #stats_land_value (land_value) 
		select land_val
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and include_no_calc = 'F'
	
		exec GetStats 'SR', @count output, @low output, @high output, 
				    @avg output, @median output, @cod output, 
				    @cov output, @aad output, @stdev output, 
				    @wt_mean output, @prd output, @pop_var output, @input_report_type
		
		delete from #stats_list
		delete from #stats_sale_price
		delete from #stats_appr_value
		delete from #stats_land_value
		
		insert into #stats_list (value) 
		select land_ratio
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and include_no_calc = 'F'

		exec GetStats '',   @lr_count   output, @lr_low output,    @lr_high output, 
				    @lr_avg     output, @lr_median output, @lr_cod output, 
				    @lr_cov     output, @lr_aad output,    @lr_stdev output, 
				    @lr_wt_mean output, @lr_prd output,    @lr_pop_var output, @input_report_type

		delete from #stats_list
		
		insert into #stats_list (value) 
		select land_market_ratio
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and include_no_calc = 'F'

		exec GetStats '',   @lr_mkt_count   output, @lr_mkt_low output,    @lr_mkt_high output, 
				    @lr_mkt_avg     output, @lr_mkt_median output, @lr_mkt_cod output, 
				    @lr_mkt_cov     output, @lr_mkt_aad output,    @lr_mkt_stdev output, 
				    @lr_mkt_wt_mean output, @lr_mkt_prd output,    @lr_mkt_pop_var output, @input_report_type
		
		
		update #sales_ratio_report set sort2_temp_avg_dev   = @aad,
					      sort2_temp_median    = @median,
					      sort2_temp_avg       = @avg ,
					      sort2_temp_cod       = @cod,
					      sort2_temp_pop_var   = @pop_var,
					      sort2_temp_stdev     = @stdev,
					      sort2_temp_prd       = @prd,
					      sort2_temp_wt_mean   = @wt_mean,
					      sort2_temp_max       = @high,
					      sort2_temp_min       = @low,
					      sort2_land_ratio_mean   = @lr_avg,
					      sort2_land_ratio_median = @lr_median,
					      sort2_land_mkt_ratio_mean   = @lr_mkt_avg,
					      sort2_land_mkt_ratio_median = @lr_mkt_median
		
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2

		fetch next from sort2_sales into @sort1, @sort2
	
	end
	
	close	   sort2_sales
	deallocate sort2_sales
end


/*********************************/
/************* sort 3 ************/
/*********************************/

if (@input_sum_sort3 = 'T')
begin
	
	declare sort3_sales CURSOR FAST_FORWARD
	for select distinct sort1, sort2, sort3
	from #sales_ratio_report WITH (NOLOCK)
	where pacs_user_id = @input_user_id
	and   include_no_calc = 'F'
	order by sort1, sort2, sort3
	
	open sort3_sales
	fetch next from sort3_sales into @sort1, @sort2, @sort3
	
	while (@@FETCH_STATUS = 0)
	begin
		delete from #stats_list
		delete from #stats_sale_price
		delete from #stats_appr_value
		delete from #stats_land_value
	
		if (@input_report_type = 'LP')
		begin

			-- use land ratio instead of sales ratio (for vacant land report)
			insert into #stats_list (value) 
			select land_ratio
			from #sales_ratio_report WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and sort1 = @sort1
			and sort2 = @sort2
			and sort3 = @sort3
			and   include_no_calc = 'F'

		end
		begin
	
			insert into #stats_list (value) 
			select sales_ratio
			from #sales_ratio_report WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and sort1 = @sort1
			and sort2 = @sort2
			and sort3 = @sort3
			and   include_no_calc = 'F'

		end
		
		insert into #stats_sale_price (sale_price) 
		select sl_adj_price
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and   include_no_calc = 'F'
		
		insert into #stats_appr_value (appr_value) 
		select appraised_val
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and   include_no_calc = 'F'
		
		insert into #stats_land_value (land_value) 
		select land_val
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and   include_no_calc = 'F'
	
		exec GetStats 'SR', @count output, @low output, @high output, 
				    @avg output, @median output, @cod output, 
				    @cov output, @aad output, @stdev output, 
				    @wt_mean output, @prd output, @pop_var output, @input_report_type
		
		delete from #stats_list		delete from #stats_sale_price
		delete from #stats_appr_value
		delete from #stats_land_value
		
		insert into #stats_list (value) 
		select land_ratio
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and include_no_calc = 'F'

		exec GetStats '',   @lr_count   output, @lr_low output,    @lr_high output, 
				    @lr_avg     output, @lr_median output, @lr_cod output, 
				    @lr_cov     output, @lr_aad output,    @lr_stdev output, 
				    @lr_wt_mean output, @lr_prd output,    @lr_pop_var output, @input_report_type

		delete from #stats_list
		
		insert into #stats_list (value) 
		select land_market_ratio
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and include_no_calc = 'F'

		exec GetStats '',   @lr_mkt_count   output, @lr_mkt_low output,    @lr_mkt_high output, 
				    @lr_mkt_avg     output, @lr_mkt_median output, @lr_mkt_cod output, 
				    @lr_mkt_cov     output, @lr_mkt_aad output,    @lr_mkt_stdev output, 
				    @lr_mkt_wt_mean output, @lr_mkt_prd output,    @lr_mkt_pop_var output, @input_report_type
		
		update #sales_ratio_report set sort3_temp_avg_dev   = @aad,
					      sort3_temp_median    = @median,
					      sort3_temp_avg       = @avg ,
					      sort3_temp_cod       = @cod,
					      sort3_temp_pop_var   = @pop_var,
					      sort3_temp_stdev     = @stdev,
					      sort3_temp_prd       = @prd,
					      sort3_temp_wt_mean   = @wt_mean,
					      sort3_temp_max       = @high,
					      sort3_temp_min       = @low,
					      sort3_land_ratio_mean   = @lr_avg,
					      sort3_land_ratio_median = @lr_median,
					      sort3_land_mkt_ratio_mean   = @lr_mkt_avg,
					      sort3_land_mkt_ratio_median = @lr_mkt_median
		
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2	
		and sort3 = @sort3
	
		fetch next from sort3_sales into @sort1, @sort2, @sort3
	
	end
	
	close	   sort3_sales
	deallocate sort3_sales

end



/*********************************/
/************* sort 4 ************/
/*********************************/

if (@input_sum_sort4 = 'T')
begin
	
	declare sort4_sales CURSOR FAST_FORWARD
	for select distinct sort1, sort2, sort3, sort4
	from #sales_ratio_report WITH (NOLOCK)
	where pacs_user_id = @input_user_id
	and   include_no_calc = 'F'
	order by sort1, sort2, sort3, sort4
	
	open sort4_sales
	fetch next from sort4_sales into @sort1, @sort2, @sort3, @sort4
	
	while (@@FETCH_STATUS = 0)
	begin
		delete from #stats_list
		delete from #stats_sale_price
		delete from #stats_appr_value
		delete from #stats_land_value
	
		if (@input_report_type = 'LP')
		begin

			-- use land ratio instead of sales ratio (for vacant land report)
			insert into #stats_list (value) 
			select land_ratio
			from #sales_ratio_report WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and sort1 = @sort1
			and sort2 = @sort2
			and sort3 = @sort3
			and sort4 = @sort4
			and   include_no_calc = 'F'
		end
		else
		begin
		
			insert into #stats_list (value) 
			select sales_ratio
			from #sales_ratio_report WITH (NOLOCK)
			where pacs_user_id = @input_user_id
			and sort1 = @sort1
			and sort2 = @sort2
			and sort3 = @sort3
			and sort4 = @sort4
			and   include_no_calc = 'F'

		end
		
		insert into #stats_sale_price (sale_price) 
		select sl_adj_price
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and sort4 = @sort4
		and   include_no_calc = 'F'
		
		insert into #stats_appr_value (appr_value) 
		select appraised_val
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and sort4 = @sort4
		and   include_no_calc = 'F'
			
		insert into #stats_land_value (land_value) 
		select land_val
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and sort4 = @sort4
		and   include_no_calc = 'F'
		
		exec GetStats 'SR', @count output, @low output, @high output, 
				    @avg output, @median output, @cod output, 
				    @cov output, @aad output, @stdev output, 
				    @wt_mean output, @prd output, @pop_var output, @input_report_type
		
		delete from #stats_list
		delete from #stats_sale_price
		delete from #stats_appr_value
		delete from #stats_land_value
		
		insert into #stats_list (value) 
		select land_ratio
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and sort4 = @sort4
		and include_no_calc = 'F'

		exec GetStats '',   @lr_count   output, @lr_low output,    @lr_high output, 
				    @lr_avg     output, @lr_median output, @lr_cod output, 
				    @lr_cov     output, @lr_aad output,    @lr_stdev output, 
				    @lr_wt_mean output, @lr_prd output,    @lr_pop_var output, @input_report_type

		delete from #stats_list
		
		insert into #stats_list (value) 
		select land_market_ratio
		from #sales_ratio_report WITH (NOLOCK)
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2
		and sort3 = @sort3
		and sort4 = @sort4
		and include_no_calc = 'F'

		exec GetStats '',   @lr_mkt_count   output, @lr_mkt_low output,    @lr_mkt_high output, 
				    @lr_mkt_avg     output, @lr_mkt_median output, @lr_mkt_cod output, 
				    @lr_mkt_cov     output, @lr_mkt_aad output,    @lr_mkt_stdev output, 
				    @lr_mkt_wt_mean output, @lr_mkt_prd output,    @lr_mkt_pop_var output, @input_report_type
	
		
		update #sales_ratio_report set sort4_temp_avg_dev   = @aad,
					      sort4_temp_median    = @median,
					      sort4_temp_avg       = @avg ,
					      sort4_temp_cod       = @cod,
					      sort4_temp_pop_var   = @pop_var,
					      sort4_temp_stdev     = @stdev,
					      sort4_temp_prd       = @prd,
					      sort4_temp_wt_mean   = @wt_mean,
					      sort4_temp_max       = @high,
					      sort4_temp_min       = @low,
					      sort4_land_ratio_mean   = @lr_avg,
					      sort4_land_ratio_median = @lr_median,
					      sort4_land_mkt_ratio_mean   = @lr_mkt_avg,
					      sort4_land_mkt_ratio_median = @lr_mkt_median
					     		
		where pacs_user_id = @input_user_id
		and sort1 = @sort1
		and sort2 = @sort2	
		and sort3 = @sort3
		and sort4 = @sort4
	
		fetch next from sort4_sales into @sort1, @sort2, @sort3, @sort4
	
	end
	
	close	   sort4_sales
	deallocate sort4_sales

end


/*********************************/
/********* grand totals **********/
/*********************************/
delete from #stats_list
delete from #stats_sale_price
delete from #stats_appr_value
delete from #stats_land_value


if (@input_report_type = 'LP')
begin
	-- use land ratio instead of sales ratio (for vacant land report)
	insert into #stats_list (value) 
	select land_ratio
	from #sales_ratio_report WITH (NOLOCK)
	where pacs_user_id = @input_user_id
	and   include_no_calc = 'F'
end
else
begin
	insert into #stats_list (value) 
	select sales_ratio
	from #sales_ratio_report WITH (NOLOCK)
	where pacs_user_id = @input_user_id
	and   include_no_calc = 'F'
end

insert into #stats_sale_price (sale_price) 
select sl_adj_price
from #sales_ratio_report WITH (NOLOCK)
where pacs_user_id = @input_user_id
and   include_no_calc = 'F'

insert into #stats_appr_value (appr_value) 
select appraised_val
from #sales_ratio_report WITH (NOLOCK)
where pacs_user_id = @input_user_id
and   include_no_calc = 'F'

insert into #stats_land_value (land_value) 
select land_val
from #sales_ratio_report WITH (NOLOCK)
where pacs_user_id = @input_user_id
and   include_no_calc = 'F'

exec GetStats 'SR', @count output, @low output, @high output, 
		    @avg output, @median output, @cod output, 
		    @cov output, @aad output, @stdev output, 
		    @wt_mean output, @prd output, @pop_var output, @input_report_type

delete from #stats_list
delete from #stats_sale_price
delete from #stats_appr_value
delete from #stats_land_value

insert into #stats_list (value) 
select land_ratio
from #sales_ratio_report WITH (NOLOCK)
where pacs_user_id = @input_user_id
and include_no_calc = 'F'

exec GetStats '',   @lr_count   output, @lr_low output,    @lr_high output, 
		    @lr_avg     output, @lr_median output, @lr_cod output, 
		    @lr_cov     output, @lr_aad output,    @lr_stdev output, 
		    @lr_wt_mean output, @lr_prd output,    @lr_pop_var output, @input_report_type

delete from #stats_list
		
insert into #stats_list (value) 
select land_market_ratio
from #sales_ratio_report WITH (NOLOCK) 
where pacs_user_id = @input_user_id
and include_no_calc = 'F'

exec GetStats '',   @lr_mkt_count   output, @lr_mkt_low output,    @lr_mkt_high output, 
		    @lr_mkt_avg     output, @lr_mkt_median output, @lr_mkt_cod output, 
		    @lr_mkt_cov     output, @lr_mkt_aad output,    @lr_mkt_stdev output, 
		    @lr_mkt_wt_mean output, @lr_mkt_prd output,    @lr_mkt_pop_var output, @input_report_type
	
	

update #sales_ratio_report set temp_avg_dev   = @aad,
			      temp_median    = @median,
			      temp_avg       = @avg ,
			  temp_cod       = @cod,
			      temp_pop_var   = @pop_var,
			      temp_stdev     = @stdev,
			      temp_prd       = @prd,
			      temp_wt_mean   = @wt_mean,
			      temp_max       = @high,
			      temp_min       = @low,
			      land_ratio_mean   = @lr_avg,
			      land_ratio_median = @lr_median,
			      land_mkt_ratio_mean   = @lr_mkt_avg,
			      land_mkt_ratio_median = @lr_mkt_median

where pacs_user_id = @input_user_id


drop table #sales
drop table #sales_prop

GO

