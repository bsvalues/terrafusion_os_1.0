



CREATE  PROCEDURE ProfileSaleStats

	@input_run_id int,
	@input_detail_id int

as

delete from profile_sale_stats
where detail_id = @input_detail_id
and run_id = @input_run_id

delete from profile_sale_ct
where detail_id = @input_detail_id
and run_id = @input_run_id

/****************************/
/* process sales statistics */
/****************************/
declare @imprv_max_ma 	numeric(14, 0)
declare @imprv_min_ma 	numeric(14, 0)
declare @imprv_avg_ma 	numeric(14, 0)
declare @imprv_mid_ma	numeric(14, 0)
declare @imprv_cov_ma	numeric(18, 5)
declare @imprv_cod_ma	numeric(18, 5)

declare @imprv_max_mkt 	numeric(14, 0)
declare @imprv_min_mkt 	numeric(14, 0)
declare @imprv_avg_mkt 	numeric(14, 0)
declare @imprv_mid_mkt	numeric(14, 0)
declare @imprv_cov_mkt	numeric(18, 5)
declare @imprv_cod_mkt	numeric(18, 5)

declare @imprv_max_land_pct 	numeric(5, 4)
declare @imprv_min_land_pct 	numeric(5, 4)
declare @imprv_avg_land_pct 	numeric(5, 4)
declare @imprv_mid_land_pct	numeric(5, 4)
declare @imprv_cov_land_pct 	numeric(18, 5)
declare @imprv_cod_land_pct 	numeric(18, 5)

declare @imprv_max_mkt_pct 	numeric(14, 2)
declare @imprv_min_mkt_pct 	numeric(14, 2)
declare @imprv_avg_mkt_pct 	numeric(14, 2)
declare @imprv_mid_mkt_pct	numeric(14, 2)
declare @imprv_cov_mkt_pct  	numeric(18, 5)
declare @imprv_cod_mkt_pct  	numeric(18, 5)

declare @land_max_sqft 		numeric(18, 2)
declare @land_min_sqft 		numeric(18, 2)
declare @land_avg_sqft 		numeric(18, 2)
declare @land_mid_sqft		numeric(18, 2)
declare @land_cov_sqft		numeric(18, 5)
declare @land_cod_sqft		numeric(18, 5)

declare @land_max_mkt_sqft 	numeric(14, 0)
declare @land_min_mkt_sqft 	numeric(14, 0)
declare @land_avg_mkt_sqft 	numeric(14, 0)
declare @land_mid_mkt_sqft	numeric(14, 0)
declare @land_cov_mkt_sqft	numeric(18, 5)
declare @land_cod_mkt_sqft	numeric(18, 5)

declare @land_max_mkt_sqft_pct 	numeric(14, 2)
declare @land_min_mkt_sqft_pct 	numeric(14, 2)
declare @land_avg_mkt_sqft_pct 	numeric(14, 2)
declare @land_mid_mkt_sqft_pct	numeric(14, 2)
declare @land_cov_mkt_sqft_pct	numeric(18, 5)
declare @land_cod_mkt_sqft_pct	numeric(18, 5)

declare	@land_lot_ct   		int
declare @land_max_lot  		int
declare @land_min_lot  		int
declare @land_avg_lot  		int
declare @land_mid_lot  		int
declare @land_cod_lot  		numeric(18,5)
declare @land_cov_lot  		numeric(18,5)

declare @land_max_mkt_lot  	numeric(14,0)
declare @land_min_mkt_lot  	numeric(14,0)
declare @land_avg_mkt_lot  	numeric(14,0)
declare @land_mid_mkt_lot 	numeric(14,0)
declare @land_cod_mkt_lot  	numeric(18,5)
declare @land_cov_mkt_lot  	numeric(18,5)

declare @land_max_mkt_lot_pct  	numeric(14,2)
declare @land_min_mkt_lot_pct  	numeric(14,2)
declare @land_avg_mkt_lot_pct  	numeric(14,2)
declare @land_mid_mkt_lot_pct  	numeric(14,2)
declare @land_cod_mkt_lot_pct  	numeric(18,5)
declare @land_cov_mkt_lot_pct 	numeric(18,5)

declare	@land_ff_ct   		int
declare @land_max_ff  		numeric(18,2)
declare @land_min_ff  		numeric(18,2)
declare @land_avg_ff  		numeric(18,2)
declare @land_mid_ff  		numeric(18,2)
declare @land_cod_ff  		numeric(18,5)
declare @land_cov_ff  		numeric(18,5)

declare @land_max_mkt_ff  	numeric(14,0)
declare @land_min_mkt_ff  	numeric(14,0)
declare @land_avg_mkt_ff  	numeric(14,0)
declare @land_mid_mkt_ff 	numeric(14,0)
declare @land_cod_mkt_ff  	numeric(18,5)
declare @land_cov_mkt_ff  	numeric(18,5)

declare @land_max_mkt_ff_pct  	numeric(14,2)
declare @land_min_mkt_ff_pct  	numeric(14,2)
declare @land_avg_mkt_ff_pct  	numeric(14,2)
declare @land_mid_mkt_ff_pct  	numeric(14,2)
declare @land_cod_mkt_ff_pct  	numeric(18,5)
declare @land_cov_mkt_ff_pct 	numeric(18,5)
declare @sale_price_imprv_max	numeric(14, 0)
declare @sale_price_imprv_min	numeric(14, 0)
declare @sale_price_imprv_avg	numeric(14, 0)
declare @sale_price_imprv_mid	numeric(14, 0)
declare @sale_price_imprv_cod	numeric(18, 5)
declare @sale_price_imprv_cov	numeric(18, 5)

declare @sale_price_max_pct 	numeric(18, 5)
declare @sale_price_min_pct 	numeric(18, 5)
declare @sale_price_avg_pct 	numeric(18, 5)
declare @sale_price_mid_pct	numeric(18, 5)
declare @sale_price_cod_pct	numeric(18, 5)
declare @sale_price_cov_pct	numeric(18, 5)

declare @sale_price_land_mkt_sqft_max		numeric(14,0)
declare @sale_price_land_mkt_sqft_min		numeric(14,0)
declare @sale_price_land_mkt_sqft_avg		numeric(14,0)
declare @sale_price_land_mkt_sqft_mid		numeric(14,0)
declare @sale_price_land_mkt_sqft_cod		numeric(18,5)
declare @sale_price_land_mkt_sqft_cov		numeric(18,5)

declare @sale_price_land_mkt_sqft_max_pct	numeric(18,5)
declare @sale_price_land_mkt_sqft_min_pct 	numeric(18,5)
declare @sale_price_land_mkt_sqft_avg_pct 	numeric(18,5)
declare @sale_price_land_mkt_sqft_mid_pct 	numeric(18,5)
declare @sale_price_land_mkt_sqft_cod_pct	numeric(18,5)
declare @sale_price_land_mkt_sqft_cov_pct	numeric(18,5)

declare	@sale_land_lot_ct   				int
declare	@sale_price_land_mkt_lot_max  			numeric(14,0)
declare	@sale_price_land_mkt_lot_min  			numeric(14,0)
declare	@sale_price_land_mkt_lot_avg  			numeric(14,0)
declare	@sale_price_land_mkt_lot_mid  			numeric(14,0)
declare	@sale_price_land_mkt_lot_cod  			numeric(18,5)
declare	@sale_price_land_mkt_lot_cov  			numeric(18,5)
declare	@sale_price_land_mkt_lot_pct_max  		numeric(18,5)
declare	@sale_price_land_mkt_lot_pct_min  		numeric(18,5)
declare	@sale_price_land_mkt_lot_pct_avg  		numeric(18,5)
declare	@sale_price_land_mkt_lot_pct_mid  		numeric(18,5)
declare	@sale_price_land_mkt_lot_pct_cod  		numeric(18,5)
declare	@sale_price_land_mkt_lot_pct_cov 		numeric(18,5) 


declare	@sale_land_ff_ct   				int
declare	@sale_price_land_mkt_ff_max  			numeric(14,0)
declare	@sale_price_land_mkt_ff_min  			numeric(14,0)
declare	@sale_price_land_mkt_ff_avg  			numeric(14,0)
declare	@sale_price_land_mkt_ff_mid  			numeric(14,0)
declare	@sale_price_land_mkt_ff_cod  			numeric(18,5)
declare	@sale_price_land_mkt_ff_cov  			numeric(18,5)
declare	@sale_price_land_mkt_ff_pct_max  		numeric(18,5)
declare	@sale_price_land_mkt_ff_pct_min  		numeric(18,5)
declare	@sale_price_land_mkt_ff_pct_avg  		numeric(18,5)
declare	@sale_price_land_mkt_ff_pct_mid  		numeric(18,5)
declare	@sale_price_land_mkt_ff_pct_cod  		numeric(18,5)
declare	@sale_price_land_mkt_ff_pct_cov 		numeric(18,5) 

declare	@sale_price_imprv_ratio_max 			numeric(18,5)
declare	@sale_price_imprv_ratio_min 			numeric(18,5)
declare	@sale_price_imprv_ratio_avg 			numeric(18,5)
declare	@sale_price_imprv_ratio_mid 			numeric(18,5)
declare	@sale_price_imprv_ratio_cod 			numeric(18,5)
declare	@sale_price_imprv_ratio_cov 			numeric(18,5)

declare	@sale_price_w_sale_ct_pct			int 
declare	@sale_price_w_sale_max_pct			numeric(18, 2) 
declare	@sale_price_w_sale_min_pct 			numeric(18, 2) 
declare	@sale_price_w_sale_avg_pct 			numeric(18, 2) 
declare	@sale_price_w_sale_mid_pct 			numeric(18, 2) 
declare	@sale_price_w_sale_cod_pct 			numeric(18, 5) 
declare	@sale_price_w_sale_cov_pct 			numeric(18, 5) 

declare @sale_price_land_sqft_ratio_ct			int
declare @sale_price_land_sqft_ratio_max 		numeric(18,5)
declare @sale_price_land_sqft_ratio_min 		numeric(18,5)
declare @sale_price_land_sqft_ratio_avg 		numeric(18,5)
declare @sale_price_land_sqft_ratio_mid 		numeric(18,5)
declare @sale_price_land_sqft_ratio_cod 		numeric(18,5)
declare @sale_price_land_sqft_ratio_cov 		numeric(18,5)

declare @sale_price_land_mkt_sqft_w_sale_ct		int
declare @sale_price_land_mkt_sqft_w_sale_max_pct	numeric(18,2)	
declare @sale_price_land_mkt_sqft_w_sale_min_pct	numeric(18,2)	
declare @sale_price_land_mkt_sqft_w_sale_avg_pct	numeric(18,2)  
declare @sale_price_land_mkt_sqft_w_sale_mid_pct	numeric(18,2) 
declare @sale_price_land_mkt_sqft_w_sale_cod_pct	numeric(18,5) 
declare @sale_price_land_mkt_sqft_w_sale_cov_pct 	numeric(18,5)


declare @sale_price_land_mkt_lot_w_sale_ct		int
declare @sale_price_land_mkt_lot_w_sale_max_pct		numeric(18,2)
declare @sale_price_land_mkt_lot_w_sale_min_pct		numeric(18,2)

declare @sale_price_land_mkt_lot_w_sale_avg_pct		numeric(18,2)
declare @sale_price_land_mkt_lot_w_sale_mid_pct		numeric(18,2)
declare @sale_price_land_mkt_lot_w_sale_cod_pct		numeric(18,5)
declare @sale_price_land_mkt_lot_w_sale_cov_pct		numeric(18,5)

declare @sale_price_land_ratio_lot_ct 			numeric(18,5)
declare @sale_price_land_ratio_lot_max			numeric(18,5)
declare @sale_price_land_ratio_lot_min			numeric(18,5)
declare @sale_price_land_ratio_lot_avg			numeric(18,5)
declare @sale_price_land_ratio_lot_mid			numeric(18,5)
declare @sale_price_land_ratio_lot_cod			numeric(18,5)
declare @sale_price_land_ratio_lot_cov			numeric(18,5)	

declare @sale_price_land_mkt_ff_w_sale_ct		int
declare @sale_price_land_mkt_ff_w_sale_max_pct		numeric(18,2)
declare @sale_price_land_mkt_ff_w_sale_min_pct		numeric(18,2)
declare @sale_price_land_mkt_ff_w_sale_avg_pct		numeric(18,2)
declare @sale_price_land_mkt_ff_w_sale_mid_pct		numeric(18,2)
declare @sale_price_land_mkt_ff_w_sale_cod_pct		numeric(18,5)
declare @sale_price_land_mkt_ff_w_sale_cov_pct		numeric(18,5)

declare @sale_price_land_ratio_ff_ct 			numeric(18,5)
declare @sale_price_land_ratio_ff_max			numeric(18,5)
declare @sale_price_land_ratio_ff_min			numeric(18,5)
declare @sale_price_land_ratio_ff_avg			numeric(18,5)
declare @sale_price_land_ratio_ff_mid			numeric(18,5)
declare @sale_price_land_ratio_ff_cod			numeric(18,5)
declare @sale_price_land_ratio_ff_cov			numeric(18,5)
 	 	 	
declare @sale_gim_monthly_ct		int	
declare @sale_gim_monthly_min		numeric(18,2)
declare @sale_gim_monthly_max		numeric(18,2)
declare @sale_gim_monthly_avg		numeric(18,2)
declare @sale_gim_monthly_mid		numeric(18,2)
declare @sale_gim_monthly_cod		numeric(18,5)
declare @sale_gim_monthly_cov		numeric(18,5)

declare @sale_gim_annual_ct			int
declare @sale_gim_annual_min		numeric(18,2)
declare @sale_gim_annual_max		numeric(18,2)
declare @sale_gim_annual_avg		numeric(18,2)
declare @sale_gim_annual_mid		numeric(18,2)
declare @sale_gim_annual_cod		numeric(18,5)
declare @sale_gim_annual_cov		numeric(18,5)

declare @num_imprv_props	  		int
declare @num_land_pct_props	  		int
declare @num_mkt_pct_props	  		int	
declare @num_land_sqft_props	  		int
declare @num_land_lot_props			int
declare @num_land_ff_props			int
declare @num_mkt_pct_sqft_props	 		int
declare @num_mkt_pct_lot_props			int
declare @num_mkt_pct_ff_props			int

declare @num_sale_imprv_props	 		int
declare @num_sale_imprv_mkt_pct_props 		int
declare @num_sale_imprv_ratio_props		int
declare @num_sale_land_sqft_props 		int
declare @num_sale_land_lot_props		int
declare @num_sale_land_ff_props			int
declare @mid_count		 		int
declare @input_type				varchar(5)


declare @aad	numeric(18,5)
declare @stdev  numeric(18,5)
declare @sql	varchar(2048)


declare @ratio_50	int
declare @ratio_55	int
declare @ratio_60	int
declare @ratio_65	int
declare @ratio_70	int
declare @ratio_75	int
declare @ratio_80	int
declare @ratio_85	int
declare @ratio_90	int
declare @ratio_95	int
declare @ratio_100	int
declare @ratio_105	int
declare @ratio_110	int
declare @ratio_115	int
declare @ratio_120	int
declare @ratio_125	int
declare @ratio_130	int
declare @ratio_135	int
declare @ratio_135_UP	int

create table #stats_list
(
value	numeric(18,5)
)


set @input_type = ''

/****************************************/
/********* Improved Sales ***************/
/****************************************/

insert into #stats_list
select (living_area) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val > 0
and   pp.living_area > 0

exec GetStats @input_type, 
	      @num_imprv_props output,
	      @imprv_min_ma    output,
	      @imprv_max_ma    output,
	      @imprv_avg_ma    output,
	      @imprv_mid_ma    output,
	      @imprv_cod_ma    output,
	      @imprv_cov_ma    output,
	      @aad	       output,
	      @stdev	       output

delete from #stats_list


insert into #stats_list
select (market) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val > 0
and   pp.living_area > 0

exec GetStats @input_type,  
	      @num_imprv_props output,
	      @imprv_min_mkt   output,
	      @imprv_max_mkt   output,
	      @imprv_avg_mkt   output,
	      @imprv_mid_mkt   output,
	      @imprv_cod_mkt   output,
	      @imprv_cov_mkt   output,
	      @aad	       output,
	      @stdev	       output

delete from #stats_list



/***************/
/* market pct */
/**************/


insert into #stats_list
select (pp.market/pp.living_area) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val > 0
and   pp.living_area > 0

exec GetStats @input_type,  
	      @num_mkt_pct_props output,
	      @imprv_min_mkt_pct output,
	      @imprv_max_mkt_pct output,
	      @imprv_avg_mkt_pct output,
	      @imprv_mid_mkt_pct output,
	      @imprv_cod_mkt_pct output,
	      @imprv_cov_mkt_pct output,
	      @aad	       output,
	      @stdev	       output

delete from #stats_list

/*************/
/* land_ pct */
/*************/


insert into #stats_list
select ((pp.land_hstd_val + pp.land_non_hstd_val + pp.ag_market + pp.timber_market)/pp.market) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val > 0
and   pp.living_area > 0
and   (pp.land_hstd_val + pp.land_non_hstd_val + pp.ag_market + pp.timber_market) > 0
and   pp.market > 0


exec GetStats @input_type,  
	      @num_land_pct_props output,
	      @imprv_min_land_pct output,
	      @imprv_max_land_pct output,
	      @imprv_avg_land_pct output,
	      @imprv_mid_land_pct output,
	      @imprv_cod_land_pct output,
	      @imprv_cov_land_pct output,
	      @aad	          output,
	      @stdev	          output

delete from #stats_list



/****************************************/
/*********** Vacant Sales ***************/
/****************************************/


-- square feet / acres

insert into #stats_list
select (pp.market) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_total_sqft > 0
and   pp.land_appr_method in ('A', 'SQ')


exec GetStats @input_type,  @num_land_sqft_props  output,
	      @land_min_mkt_sqft    output,
	      @land_max_mkt_sqft    output,
	      @land_avg_mkt_sqft    output,
	      @land_mid_mkt_sqft    output,
	      @land_cod_mkt_sqft    output,
	      @land_cov_mkt_sqft    output,
	      @aad	            output,
	      @stdev	            output

delete from #stats_list



insert into #stats_list
select (pp.land_total_sqft) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_total_sqft > 0
and   pp.land_appr_method in ('A', 'SQ')


exec GetStats @input_type,  @num_land_sqft_props 	output,
	      @land_min_sqft   		output,
	      @land_max_sqft   		output,
	      @land_avg_sqft   		output,
	      @land_mid_sqft   		output,
	      @land_cod_sqft   		output,
	      @land_cov_sqft   		output,
	      @aad	            	output,
	      @stdev	            	output

delete from #stats_list


/************************/
/* land market sqft pct */
/************************/

insert into #stats_list
select (pp.market/pp.land_total_sqft) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_total_sqft > 0
and   pp.land_appr_method in ('A', 'SQ')



exec GetStats @input_type,  @num_mkt_pct_sqft_props 	output,
	      @land_min_mkt_sqft_pct   	output,
	      @land_max_mkt_sqft_pct   	output,
	      @land_avg_mkt_sqft_pct   	output,
	      @land_mid_mkt_sqft_pct   	output,
	      @land_cod_mkt_sqft_pct    output,
	      @land_cov_mkt_sqft_pct   	output,
	      @aad	            	output,
	      @stdev	            	output

delete from #stats_list


-- lot / flat price


insert into #stats_list
select (pp.market) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_num_lots > 0
and   pp.land_appr_method = 'LOT'


exec GetStats @input_type,  @num_land_lot_props  output,
			@land_min_mkt_lot    output,
			@land_max_mkt_lot    output,
			@land_avg_mkt_lot  output,
			@land_mid_mkt_lot    output,
			@land_cod_mkt_lot    output,
			@land_cov_mkt_lot    output,
			@aad	           output,
			@stdev	           output

delete from #stats_list



insert into #stats_list
select (pp.land_num_lots) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_num_lots > 0
and   pp.land_appr_method = 'LOT'


exec GetStats @input_type,  @num_land_lot_props 	output,
	      @land_min_lot   		output,
	      @land_max_lot   		output,
	      @land_avg_lot   		output,
	      @land_mid_lot   		output,
	      @land_cod_lot   		output,
	      @land_cov_lot   		output,
	      @aad	            	output,
	      @stdev	            	output

delete from #stats_list


/************************/
/* land market sqft pct */
/************************/

insert into #stats_list
select (pp.market/pp.land_num_lots) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_num_lots > 0
and   pp.land_appr_method = 'LOT'



exec GetStats @input_type,  @num_mkt_pct_lot_props 	output,
	      @land_min_mkt_lot_pct   	output,
	      @land_max_mkt_lot_pct   	output,
	      @land_avg_mkt_lot_pct   	output,
	      @land_mid_mkt_lot_pct   	output,
	      @land_cod_mkt_lot_pct    output,
	      @land_cov_mkt_lot_pct   	output,
	      @aad	            	output,
	      @stdev	            	output

delete from #stats_list


-- front feet


insert into #stats_list
select (pp.market) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_front_feet > 0
and   pp.land_appr_method = 'FF'


exec GetStats @input_type,  @num_land_ff_props  output,
	      @land_min_mkt_ff    output,
	      @land_max_mkt_ff    output,
	      @land_avg_mkt_ff    output,
	      @land_mid_mkt_ff    output,
	      @land_cod_mkt_ff    output,
	      @land_cov_mkt_ff    output,
	      @aad	          output,
	      @stdev	          output

delete from #stats_list



insert into #stats_list
select (pp.land_front_feet) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_front_feet > 0
and   pp.land_appr_method = 'FF'


exec GetStats @input_type,  @num_land_ff_props 	output,
	      @land_min_ff   		output,
	      @land_max_ff   		output,
	      @land_avg_ff   		output,
	      @land_mid_ff   		output,
	      @land_cod_ff   		output,
	      @land_cov_ff   		output,
	      @aad	            	output,
	      @stdev	            	output

delete from #stats_list


/************************/
/* land market sqft pct */
/************************/

insert into #stats_list
select (pp.market/pp.land_front_feet) 
from profile_prop_list pp
where pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0
and   pp.land_front_feet > 0
and   pp.land_appr_method = 'FF'



exec GetStats @input_type,  @num_mkt_pct_ff_props 	output,
	      @land_min_mkt_ff_pct   	output,
	      @land_max_mkt_ff_pct   	output,
	      @land_avg_mkt_ff_pct   	output,
	      @land_mid_mkt_ff_pct   	output,
	      @land_cod_mkt_ff_pct    output,
	      @land_cov_mkt_ff_pct   	output,
	      @aad	            	output,
	      @stdev	            	output

delete from #stats_list



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


create table  #sale_ratio_acres_sqft
(
sale_ratio		numeric(18,5)
)


create table  #sale_ratio_lot
(
sale_ratio		numeric(18,5)
)


create table  #sale_ratio_ff
(
sale_ratio		numeric(18,5)
)


declare @bUseRatioCodes bit

IF EXISTS(SELECT * FROM profile_run_list_options
			WHERE option_type IN ('ISS','LSS')
			AND run_id = @input_run_id)
BEGIN
	SET @bUseRatioCodes = 1
END
ELSE
BEGIN
	SET @bUseRatioCodes = 0
END

/****************************************/
/********* Sales Imprv Price ************/
/****************************************/


select distinct pps.chg_of_owner_id, pps.sale_price into #temp_imprv_sale_price
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val > 0
and   pps.sale_price > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
												FROM profile_run_list_options
												WHERE option_type = 'ISS'
												AND sl_ratio_cd = option_desc)
			THEN 1
			WHEN @bUseRatioCodes = 1
			THEN 0
			ELSE 1
		END = 1


insert into #stats_list
select (sale_price) 
from #temp_imprv_sale_price

exec GetStats @input_type,  @num_sale_imprv_props output,
	      @sale_price_imprv_min output,
	      @sale_price_imprv_max output,
	      @sale_price_imprv_avg output,
	      @sale_price_imprv_mid output,
	      @sale_price_imprv_cod output,
	      @sale_price_imprv_cov output,
	      @aad	            output,
	      @stdev	            output

delete from #stats_list




/*****************************/
/****** imprv sales ratio ****/
/*****************************/



insert into #sales (chg_of_owner_id, sale_dt, sale_price)
select distinct pps.chg_of_owner_id, pps.sale_dt, pps.sale_price
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val > 0
and   pps.sale_price > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
												FROM profile_run_list_options
												WHERE option_type = 'ISS'
												AND sl_ratio_cd = option_desc)
			THEN 1
			WHEN @bUseRatioCodes = 1
			THEN 0
			ELSE 1
		END = 1


insert into #sales_prop (chg_of_owner_id, prop_id, land_value, market_value, living_area_sqft)
select pps.chg_of_owner_id, pp.prop_id, (land_hstd_val + land_non_hstd_val + ag_market + timber_market), market,  living_area
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id     = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pps.chg_of_owner_id in (select chg_of_owner_id from #sales) --sams: get all props from the sales we selected

exec GetSalesRatio

insert into #stats_list
select (sale_avg_price_sqft) 
from #sales

exec GetStats @input_type,  @num_sale_imprv_mkt_pct_props output,
	      @sale_price_min_pct output,
	      @sale_price_max_pct output,
	      @sale_price_avg_pct output,
	      @sale_price_mid_pct output,
	      @sale_price_cod_pct output,
	      @sale_price_cov_pct output,
	      @aad	            output,
	      @stdev	            output

delete from #stats_list


insert into #stats_list
select (avg_price_sqft) 
from #sales

exec GetStats @input_type,  @sale_price_w_sale_ct_pct output,
	      @sale_price_w_sale_min_pct output,
	      @sale_price_w_sale_max_pct output,
	      @sale_price_w_sale_avg_pct output,
	      @sale_price_w_sale_mid_pct output,
	      @sale_price_w_sale_cod_pct output,
	      @sale_price_w_sale_cov_pct output,
	      @aad	            output,
	      @stdev	            output

delete from #stats_list



insert into #stats_list
select (sale_ratio) 
from #sales

insert into #sale_ratio
select (sale_ratio) 
from #sales


exec GetStats @input_type,  @num_sale_imprv_ratio_props output,
	      @sale_price_imprv_ratio_min output,
	      @sale_price_imprv_ratio_max output,
	      @sale_price_imprv_ratio_avg output,
	      @sale_price_imprv_ratio_mid output,
	      @sale_price_imprv_ratio_cod output,
	      @sale_price_imprv_ratio_cov output,
	      @aad	            	  output,
	      @stdev	                  output


delete from #stats_list

drop table #temp_imprv_sale_price


delete from #sales
delete from #sales_prop

/*************************/
/**** sales land sqft ****/
/*************************/

select distinct pps.chg_of_owner_id, pps.sale_price into #temp_land_sqft_sale_price
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   CASE WHEN @bUseRatioCodes = 1 THEN 1
			WHEN @bUseRatioCodes = 0 and pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0 THEN 1
			ELSE 0
		END = 1
and   pp.land_total_sqft > 0
and   pp.land_appr_method in ('A', 'SQ')
and   pps.sale_price > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
												FROM profile_run_list_options
												WHERE option_type = 'LSS'
												AND sl_ratio_cd = option_desc)
			THEN 1
			WHEN @bUseRatioCodes = 1
			THEN 0
			ELSE 1
		END = 1


insert into #stats_list
select (sale_price) 
from #temp_land_sqft_sale_price

exec GetStats @input_type,  @num_sale_land_sqft_props     output,
	      @sale_price_land_mkt_sqft_min output,
	      @sale_price_land_mkt_sqft_max output,
	      @sale_price_land_mkt_sqft_avg output,
	      @sale_price_land_mkt_sqft_mid output,
	      @sale_price_land_mkt_sqft_cod output,
	      @sale_price_land_mkt_sqft_cov output,
	      @aad	            	    output,
	      @stdev	            	    output

delete from #stats_list




/*********************************/
/****** land sqft sales ratio ****/
/*********************************/

insert into #sales (chg_of_owner_id, sale_dt, sale_price)
select distinct pps.chg_of_owner_id, pps.sale_dt, pps.sale_price
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   CASE WHEN @bUseRatioCodes = 1 THEN 1
			WHEN @bUseRatioCodes = 0 and pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0 THEN 1
			ELSE 0
		END = 1
and   pp.land_total_sqft > 0
and   pp.land_appr_method in ('A', 'SQ')
and   pps.sale_price > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
												FROM profile_run_list_options
												WHERE option_type = 'LSS'
												AND sl_ratio_cd = option_desc)
			THEN 1
			WHEN @bUseRatioCodes = 1
			THEN 0
			ELSE 1
		END = 1


insert into #sales_prop (chg_of_owner_id, prop_id, land_value, market_value, living_area_sqft)
select pps.chg_of_owner_id, pp.prop_id, 0, (land_hstd_val + land_non_hstd_val + ag_market + timber_market),   pp.land_total_sqft
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id     = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pps.chg_of_owner_id in (select chg_of_owner_id from #sales) --sams: get all props from the sales we selected

exec GetSalesRatio


insert into #stats_list
select (sale_avg_price_sqft) 
from #sales

exec GetStats @input_type,  @num_sale_land_sqft_props output,
	      @sale_price_land_mkt_sqft_min_pct output,
	      @sale_price_land_mkt_sqft_max_pct output,
	      @sale_price_land_mkt_sqft_avg_pct output,
	      @sale_price_land_mkt_sqft_mid_pct output,
	      @sale_price_land_mkt_sqft_cod_pct output,
	      @sale_price_land_mkt_sqft_cov_pct output,
	      @aad	            output,
	      @stdev	            output

delete from #stats_list


insert into #stats_list
select (avg_price_sqft) 
from #sales


exec GetStats @input_type,  @sale_price_land_mkt_sqft_w_sale_ct output,
	      @sale_price_land_mkt_sqft_w_sale_min_pct output,
	      @sale_price_land_mkt_sqft_w_sale_max_pct output,
	      @sale_price_land_mkt_sqft_w_sale_avg_pct output,
	      @sale_price_land_mkt_sqft_w_sale_mid_pct output,
	      @sale_price_land_mkt_sqft_w_sale_cod_pct output,
	      @sale_price_land_mkt_sqft_w_sale_cov_pct output,
	      @aad	            output,
	      @stdev	            output

delete from #stats_list


insert into #stats_list
select (sale_ratio) 
from #sales


insert into #sale_ratio_acres_sqft
select (sale_ratio) 
from #sales

exec GetStats @input_type,  @sale_price_land_sqft_ratio_ct output,
	      @sale_price_land_sqft_ratio_min output,
	      @sale_price_land_sqft_ratio_max output,
	      @sale_price_land_sqft_ratio_avg output,
	      @sale_price_land_sqft_ratio_mid output,
	      @sale_price_land_sqft_ratio_cod output,
	      @sale_price_land_sqft_ratio_cov output,
	      @aad	            	      output,
	      @stdev	            	      output

delete from #stats_list

drop table #temp_land_sqft_sale_price

delete from #sales
delete from #sales_prop




/*************************/
/**** sales land lots ****/
/*************************/

select distinct pps.chg_of_owner_id, pps.sale_price into #temp_land_lot_sale_price
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   CASE WHEN @bUseRatioCodes = 1 THEN 1
			WHEN @bUseRatioCodes = 0 and pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0 THEN 1
			ELSE 0
		END = 1
and   pp.land_num_lots > 0
and   pp.land_appr_method = 'LOT'
and   pps.sale_price > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
												FROM profile_run_list_options
												WHERE option_type = 'LSS'
												AND sl_ratio_cd = option_desc)
			THEN 1
			WHEN @bUseRatioCodes = 1
			THEN 0
			ELSE 1
		END = 1


insert into #stats_list
select (sale_price) 
from #temp_land_lot_sale_price

exec GetStats @input_type,  @num_sale_land_lot_props output,
	      @sale_price_land_mkt_lot_min output,
	      @sale_price_land_mkt_lot_max output,
	      @sale_price_land_mkt_lot_avg output,
	      @sale_price_land_mkt_lot_mid output,
	      @sale_price_land_mkt_lot_cod output,
	      @sale_price_land_mkt_lot_cov output,
	      @aad	            	   output,
	      @stdev	            	   output

delete from #stats_list




/*********************************/
/****** land lot sales ratio ****/
/*********************************/

insert into #sales (chg_of_owner_id, sale_dt, sale_price)
select distinct pps.chg_of_owner_id, pps.sale_dt, pps.sale_price
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   CASE WHEN @bUseRatioCodes = 1 THEN 1
			WHEN @bUseRatioCodes = 0 and pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0 THEN 1
			ELSE 0
		END = 1
and   pp.land_num_lots > 0
and   pp.land_appr_method = 'LOT'
and   pps.sale_price > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
												FROM profile_run_list_options
												WHERE option_type = 'LSS'
												AND sl_ratio_cd = option_desc)
			THEN 1
			WHEN @bUseRatioCodes = 1
			THEN 0
			ELSE 1
		END = 1

insert into #sales_prop (chg_of_owner_id, prop_id, land_value, market_value, living_area_sqft)
select pps.chg_of_owner_id, pp.prop_id, 0, (land_hstd_val + land_non_hstd_val + ag_market + timber_market), pp.land_num_lots
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id     = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pps.chg_of_owner_id in (select chg_of_owner_id from #sales) --sams: get all props from the sales we selected

exec GetSalesRatio


insert into #stats_list
select (sale_avg_price_sqft) 
from #sales


exec GetStats @input_type,  @num_sale_land_lot_props 	output,
	      @sale_price_land_mkt_lot_pct_min output,
	      @sale_price_land_mkt_lot_pct_max output,
	      @sale_price_land_mkt_lot_pct_avg output,
	      @sale_price_land_mkt_lot_pct_mid output,
	      @sale_price_land_mkt_lot_pct_cod output,
	      @sale_price_land_mkt_lot_pct_cov output,
	      @aad	            		output,
	      @stdev	            		output

delete from #stats_list


insert into #stats_list
select (avg_price_sqft) 
from #sales


exec GetStats @input_type,  @sale_price_land_mkt_lot_w_sale_ct output,
	      @sale_price_land_mkt_lot_w_sale_min_pct output,
	      @sale_price_land_mkt_lot_w_sale_max_pct output,
	      @sale_price_land_mkt_lot_w_sale_avg_pct output,
	      @sale_price_land_mkt_lot_w_sale_mid_pct output,
	      @sale_price_land_mkt_lot_w_sale_cod_pct output,
	      @sale_price_land_mkt_lot_w_sale_cov_pct output,
	      @aad	            output,
	      @stdev	            output

delete from #stats_list


insert into #stats_list
select (sale_ratio) 
from #sales


insert into #sale_ratio_lot
select (sale_ratio) 
from #sales

exec GetStats @input_type,  @sale_price_land_ratio_lot_ct output,
	     @sale_price_land_ratio_lot_min output,
	      @sale_price_land_ratio_lot_max output,
	      @sale_price_land_ratio_lot_avg output,
	      @sale_price_land_ratio_lot_mid output,
	      @sale_price_land_ratio_lot_cod output,
	      @sale_price_land_ratio_lot_cov output,
	      @aad	            	      output,
	      @stdev	            	      output

delete from #stats_list

drop table #temp_land_lot_sale_price

delete from #sales
delete from #sales_prop



/*************************/
/**** sales land ff ******/
/*************************/

select distinct pps.chg_of_owner_id, pps.sale_price into #temp_land_ff_sale_price
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   CASE WHEN @bUseRatioCodes = 1 THEN 1
			WHEN @bUseRatioCodes = 0 and pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0 THEN 1
			ELSE 0
		END = 1
and   pp.land_front_feet > 0
and   pp.land_appr_method = 'FF'
and   pps.sale_price > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
												FROM profile_run_list_options
												WHERE option_type = 'LSS'
												AND sl_ratio_cd = option_desc)
			THEN 1
			WHEN @bUseRatioCodes = 1
			THEN 0
			ELSE 1
		END = 1

insert into #stats_list
select (sale_price) 
from #temp_land_ff_sale_price

exec GetStats @input_type,  @num_sale_land_ff_props     output,
	      @sale_price_land_mkt_ff_min output,
	      @sale_price_land_mkt_ff_max output,
	      @sale_price_land_mkt_ff_avg output,
	      @sale_price_land_mkt_ff_mid output,
	      @sale_price_land_mkt_ff_cod output,
	      @sale_price_land_mkt_ff_cov output,
	      @aad	            	   output,
	      @stdev	            	   output

delete from #stats_list




/*********************************/
/****** land lot sales ratio ****/
/*********************************/

insert into #sales (chg_of_owner_id, sale_dt, sale_price)
select distinct pps.chg_of_owner_id, pps.sale_dt, pps.sale_price
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   CASE WHEN @bUseRatioCodes = 1 THEN 1
			WHEN @bUseRatioCodes = 0 and pp.imprv_hstd_val + pp.imprv_non_hstd_val <= 0 THEN 1
			ELSE 0
		END = 1
and   pp.land_front_feet > 0
and   pp.land_appr_method = 'FF'
and   pps.sale_price > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
												FROM profile_run_list_options
												WHERE option_type = 'LSS'
												AND sl_ratio_cd = option_desc)
			THEN 1
			WHEN @bUseRatioCodes = 1
			THEN 0
			ELSE 1
		END = 1


insert into #sales_prop (chg_of_owner_id, prop_id, land_value, market_value, living_area_sqft)
select pps.chg_of_owner_id, pp.prop_id, 0, (land_hstd_val + land_non_hstd_val + ag_market + timber_market),  land_front_feet
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id     = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.detail_id = @input_detail_id
and   pp.run_id = @input_run_id
and   pps.chg_of_owner_id in (select chg_of_owner_id from #sales) --sams: get all props from the sales we selected

exec GetSalesRatio


insert into #stats_list
select (sale_avg_price_sqft) 
from #sales


exec GetStats @input_type,  @num_sale_land_ff_props 	output,
	      @sale_price_land_mkt_ff_pct_min output,
	      @sale_price_land_mkt_ff_pct_max output,
	      @sale_price_land_mkt_ff_pct_avg output,
	      @sale_price_land_mkt_ff_pct_mid output,
	      @sale_price_land_mkt_ff_pct_cod output,
	      @sale_price_land_mkt_ff_pct_cov output,
	      @aad	            		output,
	      @stdev	            		output

delete from #stats_list


insert into #stats_list
select (avg_price_sqft) 
from #sales


exec GetStats @input_type,  @sale_price_land_mkt_ff_w_sale_ct output,
	      @sale_price_land_mkt_ff_w_sale_min_pct output,
	      @sale_price_land_mkt_ff_w_sale_max_pct output,
	      @sale_price_land_mkt_ff_w_sale_avg_pct output,
	      @sale_price_land_mkt_ff_w_sale_mid_pct output,
	      @sale_price_land_mkt_ff_w_sale_cod_pct output,
	      @sale_price_land_mkt_ff_w_sale_cov_pct output,
	      @aad	            output,
	      @stdev	            output

delete from #stats_list


insert into #stats_list
select (sale_ratio) 
from #sales


insert into #sale_ratio_ff
select (sale_ratio) 
from #sales


exec GetStats @input_type,  @sale_price_land_ratio_ff_ct output,

	     @sale_price_land_ratio_ff_min output,
	      @sale_price_land_ratio_ff_max output,
	      @sale_price_land_ratio_ff_avg output,
	      @sale_price_land_ratio_ff_mid output,
	      @sale_price_land_ratio_ff_cod output,
	      @sale_price_land_ratio_ff_cov output,
	      @aad	            	      output,
	      @stdev	            	      output

delete from #stats_list

drop table #temp_land_ff_sale_price

delete from #sales
delete from #sales_prop


--***************************
--****   GIM statistics  ****
--***************************

-- gather data in a temporary table
select distinct pps.chg_of_owner_id, pps.sale_price,
		pps.monthly_income, pps.annual_income into #temp_gim_sales
from profile_prop_list pp, 
     profile_prop_list_sales pps
where pps.detail_id = pp.detail_id
and   pps.run_id    = pp.run_id
and   pps.prop_id   = pp.prop_id
and   pp.run_id    = @input_run_id
and   pp.detail_id = @input_detail_id
and   pp.imprv_hstd_val + pp.imprv_non_hstd_val > 0
and   pps.sale_price > 0
and   pps.monthly_income > 0
and   pps.annual_income > 0
and	  ISNULL(pps.include_no_calc,'F') <> 'T'
and   CASE WHEN @bUseRatioCodes = 1 AND EXISTS(SELECT *
		FROM profile_run_list_options
		WHERE option_type = 'ISS' AND sl_ratio_cd = option_desc) THEN 1
		WHEN @bUseRatioCodes = 1 THEN 0
		ELSE 1
		END = 1

-- monthly GIM stats
insert into #stats_list
select (sale_price / monthly_income) 
from #temp_gim_sales

exec GetStats @input_type,
		  @sale_gim_monthly_ct		output,
	      @sale_gim_monthly_min		output,
	      @sale_gim_monthly_max		output,
	      @sale_gim_monthly_avg		output,
	      @sale_gim_monthly_mid		output,
	      @sale_gim_monthly_cod		output,
	      @sale_gim_monthly_cov		output,
	      @aad						output,
	      @stdev					output

delete from #stats_list

-- annual GIM stats
insert into #stats_list
select (sale_price / annual_income) 
from #temp_gim_sales

exec GetStats @input_type,
		  @sale_gim_annual_ct		output,
	      @sale_gim_annual_min		output,
	      @sale_gim_annual_max		output,
	      @sale_gim_annual_avg		output,
	      @sale_gim_annual_mid		output,
	      @sale_gim_annual_cod		output,
	      @sale_gim_annual_cov		output,
	      @aad						output,
	      @stdev					output

delete from #stats_list

drop table #temp_gim_sales


/*****************************/
/**** insert final values ****/
/*****************************/

insert into profile_sale_stats
(
run_id,
detail_id,                                       
imprv_ct,    
imprv_max_ma,     
imprv_min_ma,     
imprv_avg_ma,     
imprv_mid_ma,     
imprv_max_mkt,    
imprv_min_mkt,    
imprv_avg_mkt,    
imprv_mid_mkt,    
imprv_max_land_pct, 
imprv_min_land_pct, 
imprv_avg_land_pct, 
imprv_mid_land_pct, 
imprv_max_mkt_pct, 
imprv_min_mkt_pct, 
imprv_avg_mkt_pct, 
imprv_mid_mkt_pct, 
land_sqft_ct, 
land_max_sqft,        
land_min_sqft,        
land_avg_sqft,        
land_mid_sqft,        
land_max_mkt_sqft, 
land_min_mkt_sqft, 
land_avg_mkt_sqft, 
land_mid_mkt_sqft, 
land_max_mkt_sqft_pct, 
land_min_mkt_sqft_pct, 
land_avg_mkt_sqft_pct, 
land_mid_mkt_sqft_pct, 
sale_imprv_ct,
sale_price_imprv_max,	
sale_price_imprv_min,	
sale_price_imprv_avg,	
sale_price_imprv_mid,	
sale_price_max_pct, 	
sale_price_min_pct, 	
sale_price_avg_pct, 	
sale_price_mid_pct,	
sale_land_sqft_ct,
sale_price_land_mkt_sqft_max,		
sale_price_land_mkt_sqft_min,		
sale_price_land_mkt_sqft_avg,		
sale_price_land_mkt_sqft_mid,		
sale_price_land_mkt_sqft_pct_max, 	
sale_price_land_mkt_sqft_pct_min, 	
sale_price_land_mkt_sqft_pct_avg, 	
sale_price_land_mkt_sqft_pct_mid, 	
imprv_cov_ma,
imprv_cod_ma,
imprv_cov_mkt,
imprv_cod_mkt,
imprv_cov_land_pct,
imprv_cod_land_pct,
imprv_cov_mkt_pct,
imprv_cod_mkt_pct,
land_cov_sqft,
land_cod_sqft,
land_cov_mkt_sqft,	
land_cod_mkt_sqft,	
land_cov_mkt_sqft_pct,	
land_cod_mkt_sqft_pct,	
sale_price_imprv_cod,	
sale_price_imprv_cov,	
sale_price_cod_pct,	
sale_price_cov_pct,	
sale_price_land_mkt_sqft_cod,		
sale_price_land_mkt_sqft_cov,		
sale_price_land_mkt_sqft_pct_cod,	
sale_price_land_mkt_sqft_pct_cov,	
land_lot_ct   ,
land_max_lot  ,
land_min_lot  ,
land_avg_lot  ,
land_mid_lot  ,
land_cod_lot  ,
land_cov_lot  ,
land_max_mkt_lot  ,
land_min_mkt_lot  ,
land_avg_mkt_lot  ,
land_mid_mkt_lot  ,
land_cod_mkt_lot  ,
land_cov_mkt_lot  ,
land_max_mkt_lot_pct  ,
land_min_mkt_lot_pct  ,
land_avg_mkt_lot_pct  ,
land_mid_mkt_lot_pct  ,
land_cod_mkt_lot_pct  ,
land_cov_mkt_lot_pct  ,
sale_land_lot_ct   ,
sale_price_land_mkt_lot_max  ,
sale_price_land_mkt_lot_min  ,
sale_price_land_mkt_lot_avg  ,
sale_price_land_mkt_lot_mid  ,
sale_price_land_mkt_lot_cod  ,
sale_price_land_mkt_lot_cov  ,
sale_price_land_mkt_lot_pct_max  ,
sale_price_land_mkt_lot_pct_min  ,
sale_price_land_mkt_lot_pct_avg  ,
sale_price_land_mkt_lot_pct_mid  ,
sale_price_land_mkt_lot_pct_cod  ,
sale_price_land_mkt_lot_pct_cov  ,
land_ff_ct   ,
land_max_ff  ,
land_min_ff  ,
land_avg_ff  ,
land_mid_ff  ,
land_cod_ff  ,
land_cov_ff  ,
land_max_mkt_ff  ,
land_min_mkt_ff  ,
land_avg_mkt_ff  ,
land_mid_mkt_ff  ,
land_cod_mkt_ff  ,
land_cov_mkt_ff  ,
land_max_mkt_ff_pct  ,
land_min_mkt_ff_pct  ,
land_avg_mkt_ff_pct  ,
land_mid_mkt_ff_pct  ,
land_cod_mkt_ff_pct  ,
land_cov_mkt_ff_pct  ,
sale_land_ff_ct   ,
sale_price_land_mkt_ff_max  ,
sale_price_land_mkt_ff_min  ,
sale_price_land_mkt_ff_avg  ,
sale_price_land_mkt_ff_mid  ,
sale_price_land_mkt_ff_cod  ,
sale_price_land_mkt_ff_cov  ,
sale_price_land_mkt_ff_pct_max  ,
sale_price_land_mkt_ff_pct_min  ,
sale_price_land_mkt_ff_pct_avg  ,
sale_price_land_mkt_ff_pct_mid  ,
sale_price_land_mkt_ff_pct_cod  ,
sale_price_land_mkt_ff_pct_cov  ,

sale_price_imprv_ratio_ct,
sale_price_imprv_ratio_max ,
sale_price_imprv_ratio_min ,
sale_price_imprv_ratio_avg ,
sale_price_imprv_ratio_mid ,
sale_price_imprv_ratio_cod ,
sale_price_imprv_ratio_cov ,
sale_price_w_sale_ct_pct,
sale_price_w_sale_max_pct,	
sale_price_w_sale_min_pct,	
sale_price_w_sale_avg_pct,  
sale_price_w_sale_mid_pct, 
sale_price_w_sale_cod_pct, 
sale_price_w_sale_cov_pct,
sale_price_land_ratio_sqft_ct,
sale_price_land_ratio_sqft_max ,
sale_price_land_ratio_sqft_min ,
sale_price_land_ratio_sqft_avg ,
sale_price_land_ratio_sqft_mid ,
sale_price_land_ratio_sqft_cod ,
sale_price_land_ratio_sqft_cov ,
sale_price_land_mkt_sqft_w_sale_ct,
sale_price_land_mkt_sqft_w_sale_max_pct,	
sale_price_land_mkt_sqft_w_sale_min_pct,	
sale_price_land_mkt_sqft_w_sale_avg_pct,  
sale_price_land_mkt_sqft_w_sale_mid_pct, 
sale_price_land_mkt_sqft_w_sale_cod_pct, 
sale_price_land_mkt_sqft_w_sale_cov_pct,

sale_price_land_mkt_lot_w_sale_ct,
sale_price_land_mkt_lot_w_sale_max_pct,
sale_price_land_mkt_lot_w_sale_min_pct ,
sale_price_land_mkt_lot_w_sale_avg_pct,
sale_price_land_mkt_lot_w_sale_mid_pct,
sale_price_land_mkt_lot_w_sale_cod_pct,
sale_price_land_mkt_lot_w_sale_cov_pct,
sale_price_land_ratio_lot_ct ,
sale_price_land_ratio_lot_max,
sale_price_land_ratio_lot_min,
sale_price_land_ratio_lot_avg,
sale_price_land_ratio_lot_mid,
sale_price_land_ratio_lot_cod,
sale_price_land_ratio_lot_cov,


sale_price_land_mkt_ff_w_sale_ct,
sale_price_land_mkt_ff_w_sale_max_pct,
sale_price_land_mkt_ff_w_sale_min_pct ,
sale_price_land_mkt_ff_w_sale_avg_pct,
sale_price_land_mkt_ff_w_sale_mid_pct,
sale_price_land_mkt_ff_w_sale_cod_pct,
sale_price_land_mkt_ff_w_sale_cov_pct,
sale_price_land_ratio_ff_ct ,
sale_price_land_ratio_ff_max,
sale_price_land_ratio_ff_min,
sale_price_land_ratio_ff_avg,
sale_price_land_ratio_ff_mid,
sale_price_land_ratio_ff_cod,
sale_price_land_ratio_ff_cov,
 	 	
sale_gim_ct,
	
sale_gim_monthly_min,		
sale_gim_monthly_max,	
sale_gim_monthly_avg,	
sale_gim_monthly_mid,	
sale_gim_monthly_cod,	
sale_gim_monthly_cov,	

sale_gim_annual_min,
sale_gim_annual_max,	
sale_gim_annual_avg,	
sale_gim_annual_mid,	
sale_gim_annual_cod,	
sale_gim_annual_cov	
)

values
(
@input_run_id,
@input_detail_id,                                       
@num_imprv_props,    
@imprv_max_ma,     
@imprv_min_ma,     
@imprv_avg_ma,     
@imprv_mid_ma,     
@imprv_max_mkt,    
@imprv_min_mkt,    
@imprv_avg_mkt,    
@imprv_mid_mkt,    
@imprv_max_land_pct, 
@imprv_min_land_pct, 
@imprv_avg_land_pct, 
@imprv_mid_land_pct, 
@imprv_max_mkt_pct, 
@imprv_min_mkt_pct, 
@imprv_avg_mkt_pct, 
@imprv_mid_mkt_pct, 
@num_land_sqft_props, 
@land_max_sqft,        
@land_min_sqft,        
@land_avg_sqft,        
@land_mid_sqft,        
@land_max_mkt_sqft, 
@land_min_mkt_sqft, 
@land_avg_mkt_sqft, 
@land_mid_mkt_sqft, 
@land_max_mkt_sqft_pct, 
@land_min_mkt_sqft_pct, 
@land_avg_mkt_sqft_pct, 
@land_mid_mkt_sqft_pct, 
@num_sale_imprv_props,
@sale_price_imprv_max,	
@sale_price_imprv_min,	
@sale_price_imprv_avg,	
@sale_price_imprv_mid,	
@sale_price_max_pct, 	
@sale_price_min_pct, 	
@sale_price_avg_pct, 	
@sale_price_mid_pct,	
@num_sale_land_sqft_props,
@sale_price_land_mkt_sqft_max,		
@sale_price_land_mkt_sqft_min,		
@sale_price_land_mkt_sqft_avg,		
@sale_price_land_mkt_sqft_mid,		
@sale_price_land_mkt_sqft_max_pct, 	
@sale_price_land_mkt_sqft_min_pct, 	
@sale_price_land_mkt_sqft_avg_pct, 	
@sale_price_land_mkt_sqft_mid_pct, 	
@imprv_cov_ma,
@imprv_cod_ma,
@imprv_cov_mkt,
@imprv_cod_mkt,
@imprv_cov_land_pct,
@imprv_cod_land_pct,
@imprv_cov_mkt_pct,
@imprv_cod_mkt_pct,
@land_cov_sqft,
@land_cod_sqft,
@land_cov_mkt_sqft,	
@land_cod_mkt_sqft,	
@land_cov_mkt_sqft_pct,	
@land_cod_mkt_sqft_pct,	
@sale_price_imprv_cod,	
@sale_price_imprv_cov,	
@sale_price_cod_pct,	
@sale_price_cov_pct,	
@sale_price_land_mkt_sqft_cod,		
@sale_price_land_mkt_sqft_cov,		
@sale_price_land_mkt_sqft_cod_pct,	
@sale_price_land_mkt_sqft_cov_pct,	
@num_land_lot_props ,
@land_max_lot  ,
@land_min_lot  ,
@land_avg_lot  ,
@land_mid_lot  ,
@land_cod_lot  ,
@land_cov_lot  ,
@land_max_mkt_lot  ,
@land_min_mkt_lot ,
@land_avg_mkt_lot  ,
@land_mid_mkt_lot  ,
@land_cod_mkt_lot  ,
@land_cov_mkt_lot  ,
@land_max_mkt_lot_pct  ,
@land_min_mkt_lot_pct  ,
@land_avg_mkt_lot_pct  ,
@land_mid_mkt_lot_pct  ,
@land_cod_mkt_lot_pct  ,
@land_cov_mkt_lot_pct  ,
@num_sale_land_lot_props  ,
@sale_price_land_mkt_lot_max  ,
@sale_price_land_mkt_lot_min  ,
@sale_price_land_mkt_lot_avg  ,
@sale_price_land_mkt_lot_mid  ,
@sale_price_land_mkt_lot_cod  ,
@sale_price_land_mkt_lot_cov  ,
@sale_price_land_mkt_lot_pct_max  ,
@sale_price_land_mkt_lot_pct_min  ,
@sale_price_land_mkt_lot_pct_avg  ,
@sale_price_land_mkt_lot_pct_mid  ,
@sale_price_land_mkt_lot_pct_cod  ,
@sale_price_land_mkt_lot_pct_cov  ,
@num_land_ff_props ,
@land_max_ff  ,
@land_min_ff  ,
@land_avg_ff  ,
@land_mid_ff  ,
@land_cod_ff  ,
@land_cov_ff  ,
@land_max_mkt_ff  ,
@land_min_mkt_ff  ,
@land_avg_mkt_ff  ,
@land_mid_mkt_ff  ,
@land_cod_mkt_ff  ,
@land_cov_mkt_ff  ,
@land_max_mkt_ff_pct  ,
@land_min_mkt_ff_pct  ,
@land_avg_mkt_ff_pct  ,
@land_mid_mkt_ff_pct  ,
@land_cod_mkt_ff_pct  ,
@land_cov_mkt_ff_pct  ,
@num_sale_land_ff_props  ,
@sale_price_land_mkt_ff_max  ,
@sale_price_land_mkt_ff_min  ,
@sale_price_land_mkt_ff_avg  ,
@sale_price_land_mkt_ff_mid  ,
@sale_price_land_mkt_ff_cod  ,
@sale_price_land_mkt_ff_cov  ,
@sale_price_land_mkt_ff_pct_max  ,
@sale_price_land_mkt_ff_pct_min  ,
@sale_price_land_mkt_ff_pct_avg  ,
@sale_price_land_mkt_ff_pct_mid  ,
@sale_price_land_mkt_ff_pct_cod  ,
@sale_price_land_mkt_ff_pct_cov  ,
@num_sale_imprv_ratio_props ,
@sale_price_imprv_ratio_max ,
@sale_price_imprv_ratio_min ,
@sale_price_imprv_ratio_avg ,
@sale_price_imprv_ratio_mid ,
@sale_price_imprv_ratio_cod ,
@sale_price_imprv_ratio_cov ,
@sale_price_w_sale_ct_pct,
@sale_price_w_sale_max_pct,	
@sale_price_w_sale_min_pct,	
@sale_price_w_sale_avg_pct,  
@sale_price_w_sale_mid_pct, 
@sale_price_w_sale_cod_pct, 
@sale_price_w_sale_cov_pct,
@sale_price_land_sqft_ratio_ct,
@sale_price_land_sqft_ratio_max ,
@sale_price_land_sqft_ratio_min ,
@sale_price_land_sqft_ratio_avg ,
@sale_price_land_sqft_ratio_mid ,
@sale_price_land_sqft_ratio_cod ,
@sale_price_land_sqft_ratio_cov ,
@sale_price_land_mkt_sqft_w_sale_ct,
@sale_price_land_mkt_sqft_w_sale_max_pct,	
@sale_price_land_mkt_sqft_w_sale_min_pct,	
@sale_price_land_mkt_sqft_w_sale_avg_pct,  
@sale_price_land_mkt_sqft_w_sale_mid_pct, 
@sale_price_land_mkt_sqft_w_sale_cod_pct, 
@sale_price_land_mkt_sqft_w_sale_cov_pct,
@sale_price_land_mkt_lot_w_sale_ct,
@sale_price_land_mkt_lot_w_sale_max_pct,
@sale_price_land_mkt_lot_w_sale_min_pct ,
@sale_price_land_mkt_lot_w_sale_avg_pct,
@sale_price_land_mkt_lot_w_sale_mid_pct,
@sale_price_land_mkt_lot_w_sale_cod_pct,
@sale_price_land_mkt_lot_w_sale_cov_pct,
@sale_price_land_ratio_lot_ct ,
@sale_price_land_ratio_lot_max,
@sale_price_land_ratio_lot_min,
@sale_price_land_ratio_lot_avg,
@sale_price_land_ratio_lot_mid,
@sale_price_land_ratio_lot_cod,
@sale_price_land_ratio_lot_cov,
@sale_price_land_mkt_ff_w_sale_ct,
@sale_price_land_mkt_ff_w_sale_max_pct,
@sale_price_land_mkt_ff_w_sale_min_pct ,
@sale_price_land_mkt_ff_w_sale_avg_pct,
@sale_price_land_mkt_ff_w_sale_mid_pct,
@sale_price_land_mkt_ff_w_sale_cod_pct,
@sale_price_land_mkt_ff_w_sale_cov_pct,
@sale_price_land_ratio_ff_ct ,
@sale_price_land_ratio_ff_max,
@sale_price_land_ratio_ff_min,
@sale_price_land_ratio_ff_avg,
@sale_price_land_ratio_ff_mid,
@sale_price_land_ratio_ff_cod,
@sale_price_land_ratio_ff_cov,
@sale_gim_monthly_ct,
@sale_gim_monthly_min,		
@sale_gim_monthly_max,	
@sale_gim_monthly_avg,	
@sale_gim_monthly_mid,	
@sale_gim_monthly_cod,	
@sale_gim_monthly_cov,	
@sale_gim_annual_min,
@sale_gim_annual_max,	
@sale_gim_annual_avg,	
@sale_gim_annual_mid,	
@sale_gim_annual_cod,	
@sale_gim_annual_cov	
)

if (@num_sale_imprv_ratio_props > 0)
begin
	
	/* sale ratio count improvement */
	
	select @ratio_50 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) > 0
	and  (sale_ratio * 100) <= 50
	
	select @ratio_55 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  50
	and   (sale_ratio * 100) <= 55
	
	select @ratio_60 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  55
	and   (sale_ratio * 100) <= 60
	
	select @ratio_65 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  60
	and   (sale_ratio * 100) <= 65
	
	select @ratio_70 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  65
	and   (sale_ratio * 100) <= 70
	
	select @ratio_75 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  70
	and   (sale_ratio * 100) <= 75
	
	select @ratio_80 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  75
	and   (sale_ratio * 100) <= 80
	
	select @ratio_85 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  80
	and   (sale_ratio * 100) <= 85
	
	select @ratio_90 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  85
	and   (sale_ratio * 100) <= 90
	
	select @ratio_95 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  90
	and   (sale_ratio * 100) <= 95
	
	select @ratio_100 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  95
	and   (sale_ratio * 100) <= 100
	
	select @ratio_105 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  100
	and   (sale_ratio * 100) <= 105
	
	select @ratio_110 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  105
	and   (sale_ratio * 100) <= 110
	
	select @ratio_115 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  110
	and   (sale_ratio * 100) <= 115
	
	select @ratio_120 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  115
	and   (sale_ratio * 100) <= 120
	
	select @ratio_125 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  120
	and   (sale_ratio * 100) <= 125
	
	select @ratio_130 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  125
	and   (sale_ratio * 100) <= 130
	
	select @ratio_135 = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  130
	and   (sale_ratio * 100) <= 135
	
	select @ratio_135_UP = IsNull(count(*), 0)
	from #sale_ratio
	where (sale_ratio * 100) >  135
	
	
	insert into profile_sale_ct
	(
	type,
	run_id,
	detail_id, 
	ratio_50,    
	ratio_55,    
	ratio_60,    
	ratio_65,    
	ratio_70,    
	ratio_75,    
	ratio_80,    
	ratio_85,    
	ratio_90,    
	ratio_95,    
	ratio_100,   
	ratio_105,   
	ratio_110,   
	ratio_115,   
	ratio_120,   
	ratio_125,   
	ratio_130,   
	ratio_135,   
	ratio_135_up 
	)
	values
	(
	'I',
	@input_run_id,
	@input_detail_id, 
	@ratio_50,    
	@ratio_55,    
	@ratio_60,    
	@ratio_65,    
	@ratio_70,    
	@ratio_75,    
	@ratio_80,    
	@ratio_85,    
	@ratio_90,    
	@ratio_95,    
	@ratio_100,   
	@ratio_105,   
	@ratio_110,   
	@ratio_115,   
	@ratio_120,   
	@ratio_125,   
	@ratio_130,   
	@ratio_135,   
	@ratio_135_up 
	)
end


/* acres/sqft */
if (@sale_price_land_sqft_ratio_ct > 0)
begin
	
	/* sale ratio count improvement */
	
	select @ratio_50 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) > 0
	and  (sale_ratio * 100) <= 50
	
	select @ratio_55 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  50
	and   (sale_ratio * 100) <= 55
	
	select @ratio_60 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  55
	and   (sale_ratio * 100) <= 60
	
	select @ratio_65 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  60
	and   (sale_ratio * 100) <= 65
	
	select @ratio_70 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  65
	and   (sale_ratio * 100) <= 70
	
	select @ratio_75 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  70
	and   (sale_ratio * 100) <= 75
	
	select @ratio_80 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  75
	and   (sale_ratio * 100) <= 80
	
	select @ratio_85 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  80
	and   (sale_ratio * 100) <= 85
	
	select @ratio_90 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  85
	and   (sale_ratio * 100) <= 90
	
	select @ratio_95 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  90
	and   (sale_ratio * 100) <= 95
	
	select @ratio_100 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  95
	and   (sale_ratio * 100) <= 100
	
	select @ratio_105 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  100
	and   (sale_ratio * 100) <= 105
	
	select @ratio_110 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  105
	and   (sale_ratio * 100) <= 110
	
	select @ratio_115 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  110
	and   (sale_ratio * 100) <= 115
	
	select @ratio_120 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  115
	and   (sale_ratio * 100) <= 120
	
	select @ratio_125 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  120
	and   (sale_ratio * 100) <= 125
	
	select @ratio_130 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  125
	and   (sale_ratio * 100) <= 130
	
	select @ratio_135 = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  130
	and   (sale_ratio * 100) <= 135
	
	select @ratio_135_UP = IsNull(count(*), 0)
	from #sale_ratio_acres_sqft
	where (sale_ratio * 100) >  135
	
	
	insert into profile_sale_ct
	(
	type,
	run_id,
	detail_id, 
	ratio_50,    
	ratio_55,    
	ratio_60,    
	ratio_65,    
	ratio_70,    
	ratio_75,    
	ratio_80,    
	ratio_85,    
	ratio_90,    
	ratio_95,    
	ratio_100,   
	ratio_105,   
	ratio_110,   
	ratio_115,   
	ratio_120,   
	ratio_125,   
	ratio_130,   
	ratio_135,   
	ratio_135_up 
	)
	values
	(
	'VAS',
	@input_run_id,
	@input_detail_id, 
	@ratio_50,    
	@ratio_55,    
	@ratio_60,    
	@ratio_65,    
	@ratio_70,    
	@ratio_75,    
	@ratio_80,    
	@ratio_85,    
	@ratio_90,    
	@ratio_95,    
	@ratio_100,   
	@ratio_105,   
	@ratio_110,   
	@ratio_115,   
	@ratio_120,   
	@ratio_125,   
	@ratio_130,   
	@ratio_135,   
	@ratio_135_up 
	)
end




/* front feet */
if (@sale_price_land_ratio_ff_ct > 0)
begin
	
	/* sale ratio count improvement */
	
	select @ratio_50 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) > 0
	and  (sale_ratio * 100) <= 50
	
	select @ratio_55 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  50
	and   (sale_ratio * 100) <= 55
	
	select @ratio_60 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  55

	and   (sale_ratio * 100) <= 60
	
	select @ratio_65 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  60
	and   (sale_ratio * 100) <= 65
	
	select @ratio_70 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  65
	and   (sale_ratio * 100) <= 70
	
	select @ratio_75 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  70
	and   (sale_ratio * 100) <= 75
	
	select @ratio_80 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  75
	and   (sale_ratio * 100) <= 80
	
	select @ratio_85 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  80
	and   (sale_ratio * 100) <= 85
	
	select @ratio_90 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  85
	and   (sale_ratio * 100) <= 90
	
	select @ratio_95 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  90
	and   (sale_ratio * 100) <= 95
	
	select @ratio_100 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  95
	and   (sale_ratio * 100) <= 100
	
	select @ratio_105 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  100
	and   (sale_ratio * 100) <= 105
	
	select @ratio_110 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  105
	and   (sale_ratio * 100) <= 110
	
	select @ratio_115 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  110
	and   (sale_ratio * 100) <= 115
	
	select @ratio_120 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  115
	and   (sale_ratio * 100) <= 120
	
	select @ratio_125 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  120
	and   (sale_ratio * 100) <= 125
	
	select @ratio_130 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  125
	and   (sale_ratio * 100) <= 130
	
	select @ratio_135 = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  130
	and   (sale_ratio * 100) <= 135
	
	select @ratio_135_UP = IsNull(count(*), 0)
	from #sale_ratio_ff
	where (sale_ratio * 100) >  135
	
	
	insert into profile_sale_ct
	(
	type,
	run_id,
	detail_id, 
	ratio_50,    
	ratio_55,    
	ratio_60,    
	ratio_65,    
	ratio_70,    
	ratio_75,    
	ratio_80,    
	ratio_85,    
	ratio_90,    
	ratio_95,    
	ratio_100,   
	ratio_105,   
	ratio_110,   
	ratio_115,   
	ratio_120,   
	ratio_125,   
	ratio_130,   
	ratio_135,   
	ratio_135_up 
	)
	values
	(
	'VFF',
	@input_run_id,
	@input_detail_id, 
	@ratio_50,    
	@ratio_55,    
	@ratio_60,    
	@ratio_65,    
	@ratio_70,    
	@ratio_75,    
	@ratio_80,    
	@ratio_85,    
	@ratio_90,    
	@ratio_95,    
	@ratio_100,   
	@ratio_105,   
	@ratio_110,   
	@ratio_115,   
	@ratio_120,   
	@ratio_125,   
	@ratio_130,   
	@ratio_135,   
	@ratio_135_up 
	)
end




/* lot */
if (@sale_price_land_ratio_lot_ct > 0)
begin
	
	/* sale ratio count improvement */
	
	select @ratio_50 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) > 0
	and  (sale_ratio * 100) <= 50
	
	select @ratio_55 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  50
	and   (sale_ratio * 100) <= 55
	
	select @ratio_60 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  55
	and   (sale_ratio * 100) <= 60
	
	select @ratio_65 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  60
	and   (sale_ratio * 100) <= 65
	
	select @ratio_70 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  65
	and   (sale_ratio * 100) <= 70
	
	select @ratio_75 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  70
	and   (sale_ratio * 100) <= 75
	
	select @ratio_80 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  75
	and   (sale_ratio * 100) <= 80
	
	select @ratio_85 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  80
	and   (sale_ratio * 100) <= 85
	
	select @ratio_90 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  85
	and   (sale_ratio * 100) <= 90
	
	select @ratio_95 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  90
	and   (sale_ratio * 100) <= 95
	
	select @ratio_100 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  95
	and   (sale_ratio * 100) <= 100
	
	select @ratio_105 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  100
	and   (sale_ratio * 100) <= 105
	
	select @ratio_110 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  105
	and   (sale_ratio * 100) <= 110
	
	select @ratio_115 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  110
	and   (sale_ratio * 100) <= 115
	
	select @ratio_120 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  115
	and   (sale_ratio * 100) <= 120
	
	select @ratio_125 = IsNull(count(*), 0)
	from #sale_ratio_lot

	where (sale_ratio * 100) >  120
	and   (sale_ratio * 100) <= 125
	
	select @ratio_130 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  125
	and   (sale_ratio * 100) <= 130
	
	select @ratio_135 = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  130
	and   (sale_ratio * 100) <= 135
	
	select @ratio_135_UP = IsNull(count(*), 0)
	from #sale_ratio_lot
	where (sale_ratio * 100) >  135
	
	
	insert into profile_sale_ct
	(
	type,
	run_id,
	detail_id, 
	ratio_50,    
	ratio_55,    
	ratio_60,    
	ratio_65,    
	ratio_70,    
	ratio_75,    
	ratio_80,    
	ratio_85,    
	ratio_90,    
	ratio_95,    
	ratio_100,   
	ratio_105,   
	ratio_110,   
	ratio_115,   
	ratio_120,   
	ratio_125,   
	ratio_130,   
	ratio_135,   
	ratio_135_up 
	)
	values
	(
	'VL',
	@input_run_id,
	@input_detail_id, 
	@ratio_50,    
	@ratio_55,    
	@ratio_60,    
	@ratio_65,    
	@ratio_70,    
	@ratio_75,    
	@ratio_80,    
	@ratio_85,    
	@ratio_90,    
	@ratio_95,    
	@ratio_100,   
	@ratio_105,   
	@ratio_110,   
	@ratio_115,   
	@ratio_120,   
	@ratio_125,   
	@ratio_130,   
	@ratio_135,   
	@ratio_135_up 
	)
end

GO

