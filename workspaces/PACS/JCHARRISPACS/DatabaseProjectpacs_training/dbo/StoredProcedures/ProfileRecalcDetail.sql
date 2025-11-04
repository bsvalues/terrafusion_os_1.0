
CREATE procedure ProfileRecalcDetail
@detail_id	int

as

declare @strSQL 	varchar(max)
declare @imprv_pct	numeric(5,2)
declare @land_pct	numeric(5,2)
declare @imprv_ct	int
declare @unimprv_ct	int

declare @code		varchar(10)
declare @code_type	varchar(5)
declare @code_desc	varchar(50)
declare @report_title	varchar(50)
declare @report_date_range	varchar(50)
declare @report_school_code	varchar(250)
declare @report_state_code	varchar(250)
declare @report_sale_type	varchar(250)

-- get the input parameters from the profile run list
declare @input_type			char(5)
declare @input_run_id		int
declare @input_yr			numeric(4)
declare @input_hood_cd		varchar(10)
declare @input_region		varchar(10)
declare @input_subset		varchar(10)
declare @input_abs_subdv_cd	varchar(10)
declare @input_query		varchar(4096)
declare @default_run		char(1)

select	@input_type 		= run_type,
		@input_run_id 		= run_id,
		@input_yr 			= prop_val_yr,
		@input_hood_cd		= hood_cd,
		@input_region		= region,
		@input_subset		= subset,
		@input_abs_subdv_cd	= abs_subdv_cd,
		@input_query		= query,
		@default_run		= default_run
from 	profile_run_list
where	@detail_id			= detail_id

--


if (@input_type = 'N' or @input_type = 'QN')
begin
	select @imprv_pct  = hood_imprv_pct ,
	       @land_pct   = hood_land_pct,
	       @code_desc  = hood_name
	from neighborhood
	where hood_cd = @input_hood_cd
	and    hood_yr   = @input_yr

	set @code         = @input_hood_cd
	set @code_type = 'N'
	set @report_title = 'Neighborhood: ' + @code + ' (' + @code_desc + ')'
end
else if  (@input_type = 'AS')
begin
	select @imprv_pct = abs_imprv_pct,
	       @land_pct  = abs_land_pct,
	       @code_desc = abs_subdv_desc
	from abs_subdv
	where abs_subdv_cd = @input_abs_subdv_cd
	and    abs_subdv_yr   = @input_yr

	set @code 	= @input_abs_subdv_cd
	set @code_type = 'AS'
	set @report_title = 'Abstract/Subdivision: ' + @code + ' (' + @code_desc + ')'
end

exec ProfileGetOptions 	@input_run_id,
			@report_date_range	output,
			@report_school_code	output,
			@report_state_code	output,
			@report_sale_type	output


-- add calculated items to the profile run list

update profile_run_list
set	run_date	= GetDate(),
	imprv_pct	= IsNull(@imprv_pct, 100),
	land_pct	= IsNull(@land_pct, 100),

	code				= @code,
	code_type			= @code_type,
	report_title		= @report_title,
	report_date_range	= @report_date_range,
	report_school_code	= @report_school_code,
	report_state_code	= @report_state_code,
	report_sale_type	= @report_sale_type

where detail_id = @detail_id


/**************************/
/***** build prop list ****/
/**************************/
delete from profile_prop_list where detail_id = @detail_id

select @strSQL = ' insert into profile_prop_list' 
select @strSQL = @strSQL + ' (run_id, detail_id, prop_id, sup_num, prop_val_yr, market, imprv_hstd_val,'
select @strSQL = @strSQL + ' imprv_non_hstd_val, land_hstd_val, land_non_hstd_val, ag_market,'
select @strSQL = @strSQL + ' timber_market, living_area, land_sqft, land_acres, class_cd, land_front_feet, land_depth, land_total_sqft, land_appr_method, '
select @strSQL = @strSQL + ' land_num_lots, as_cd, nbhd_cd, yr_blt, eff_yr_blt)'
select @strSQL = @strSQL + ' select ' + convert(varchar(10), @input_run_id) + ', ' + convert(varchar(10), @detail_id)
select @strSQL = @strSQL + ', pv.prop_id, pv.sup_num, pv.prop_val_yr, pv.market, pv.imprv_hstd_val, pv.imprv_non_hstd_val,' 
select @strSQL = @strSQL + ' pv.land_hstd_val, pv.land_non_hstd_val, pv.ag_market, pv.timber_market, pp.living_area,'
select @strSQL = @strSQL + ' pp.land_sqft, pp.land_acres, pp.class_cd, pp.land_front_feet, pp.land_depth, pp.land_total_sqft, pp.land_appr_method, '
select @strSQL = @strSQL + ' pp.land_num_lots, pv.abs_subdv_cd, pv.hood_cd, pp.yr_blt, pp.eff_yr_blt'
select @strSQL = @strSQL + ' from property_val pv with (nolock), prop_supp_assoc psa with (nolock), property_profile pp with (nolock)'
select @strSQL = @strSQL + ' where pv.prop_id = pp.prop_id'
select @strSQL = @strSQL + ' and pv.sup_num = pp.sup_num'


select @strSQL = @strSQL + ' and pv.prop_val_yr = pp.prop_val_yr'
select @strSQL = @strSQL + ' and pv.prop_id = psa.prop_id'
select @strSQL = @strSQL + ' and pv.sup_num = psa.sup_num'
select @strSQL = @strSQL + ' and pv.prop_val_yr = psa.owner_tax_yr'
select @strSQL = @strSQL + ' and pv.prop_val_yr = ' + convert(varchar(10), @input_yr) 
select @strSQL = @strSQL + ' and pv.prop_id in (' + @input_query + ')' 

exec (@strSQL)


/* update the abs/hood pct, this is for the collin version of sales ratio report */

update profile_prop_list
set nbhd_imprv_pct = IsNull(neighborhood.hood_imprv_pct, 100),
      nbhd_land_pct  = IsNull(neighborhood.hood_land_pct, 100)
from neighborhood
where profile_prop_list.nbhd_cd = neighborhood.hood_cd
and    profile_prop_list.prop_val_yr = neighborhood.hood_yr
and    run_id = @input_run_id
and    detail_id = @detail_id

update profile_prop_list
set as_imprv_pct = IsNull(abs_subdv.abs_imprv_pct, 100),
    as_land_pct  = IsNull(abs_subdv.abs_land_pct, 100)
from abs_subdv
where  profile_prop_list.as_cd = abs_subdv_cd
and     profile_prop_list.prop_val_yr = abs_subdv.abs_subdv_yr
and     run_id = @input_run_id
and    detail_id = @detail_id

/*******************************/
/****** build sales list *******/
/*******************************/

delete from profile_prop_list_sales where detail_id = @detail_id

set @strSQL = 'insert into profile_prop_list_sales '
set @strSQL = @strSQL + ' (run_id, detail_id, chg_of_owner_id, prop_id, sale_dt, sale_price, '
set @strSQL = @strSQL + ' sl_state_cd, sl_school_id, sl_city_id, sl_class_cd, sl_yr_blt, '
set @strSQL = @strSQL + ' sl_living_area, sl_land_type_cd, include_no_calc, sl_type_cd, sl_ratio_cd,'
set @strSQL = @strSQL + ' eff_yr_blt, include_reason, sl_adj_rsn, monthly_income, annual_income) '  
set @strSQL = @strSQL + ' select ' + convert(varchar(10), @input_run_id) + ', ' + convert(varchar(10), @detail_id)
set @strSQL = @strSQL + ', sale.chg_of_owner_id, copa.prop_id, sale.sl_dt, sale.adjusted_sl_price, '
set @strSQL = @strSQL + ' pp.state_cd, pp.school_id, pp.city_id, pp.class_cd, pp.yr_blt, '
set @strSQL = @strSQL + ' pp.living_area, pp.land_type_cd, IsNull(include_no_calc, ''F''), sale.sl_type_cd,'
set @strSQL = @strSQL + ' sale.sl_ratio_type_cd, pp.eff_yr_blt, IsNull(sale.include_reason, ''''), IsNull(sale.sl_adj_rsn, ''''),'
set @strSQL = @strSQL + ' sale.monthly_income, sale.annual_income'
set @strSQL = @strSQL + ' from sale with (nolock), chg_of_owner_prop_assoc copa with (nolock), property_profile pp with (nolock)'
set @strSQL = @strSQL + ' where sale.chg_of_owner_id = copa.chg_of_owner_id '
set @strSQL = @strSQL + ' and sale.adjusted_sl_price is not null and sale.adjusted_sl_price > 0 '
set @strSQL = @strSQL + ' AND (sale.suppress_on_ratio_rpt_cd = ''F'' or sale.suppress_on_ratio_rpt_cd is null) '
set @strSQL = @strSQL + ' and copa.prop_id in (' + @input_query + ')'   
set @strSQL = @strSQL + ' and copa.prop_id = pp.prop_id'
set @strSQL = @strSQL + ' and pp.prop_val_yr = ' + convert(varchar(10), @input_yr) 



declare @begin_dt	varchar(50)
declare @end_dt		varchar(50)
declare @num_sale_type	int


select @begin_dt = option_desc
from profile_run_list_options
where run_id = @input_run_id
and option_type = 'BD'

select @end_dt = option_desc
from profile_run_list_options
where run_id = @input_run_id
and option_type = 'ED'

select @num_sale_type = count(*)
from profile_run_list_options
where run_id = @input_run_id
and option_type = 'ST'

if (@begin_dt is not null)
begin
	set @strSQL = @strSQL + ' and sale.sl_dt >= ''' + @begin_dt + ''''
end


if (@end_dt is not null)
begin
	set @strSQL = @strSQL + ' and sale.sl_dt <= ''' + @end_dt +  ''''
end


if (@num_sale_type > 0)
begin
	set @strSQL = @strSQL + ' and sale.sl_type_cd in (select option_desc from profile_run_list_options'
	set @strSQL = @strSQL + ' where option_type = ''ST'' and run_id = ' + convert(varchar(10), @input_run_id) + ')'

end

 
exec (@strSQL)


/*********************************************************/
/**** make one additional pass to insert property    *****/
/**** that are not part of the profile property list *****/
/**** but are tied to a multi sale 		     *****/
/*********************************************************/

set @strSQL = 'insert into profile_prop_list_sales '
set @strSQL = @strSQL + ' (run_id, detail_id, chg_of_owner_id, prop_id, sale_dt, sale_price, '
set @strSQL = @strSQL + ' sl_state_cd, sl_school_id, sl_city_id, sl_class_cd, sl_yr_blt, '
set @strSQL = @strSQL + ' sl_living_area, sl_land_type_cd, include_no_calc, sl_type_cd, sl_ratio_cd,'
set @strSQL = @strSQL + ' eff_yr_blt, include_reason, sl_adj_rsn, mp_sale, sup_num, prop_val_yr,'
set @strSQL = @strSQL + ' monthly_income, annual_income) '  
set @strSQL = @strSQL + ' select ' + convert(varchar(10), @input_run_id) + ', ' + convert(varchar(10), @detail_id)
set @strSQL = @strSQL + ', sale.chg_of_owner_id, copa.prop_id, sale.sl_dt, sale.adjusted_sl_price, '
set @strSQL = @strSQL + ' pp.state_cd, pp.school_id, pp.city_id, pp.class_cd, pp.yr_blt, '
set @strSQL = @strSQL + ' pp.living_area, pp.land_type_cd, IsNull(include_no_calc, ''F''), sale.sl_type_cd, '
set @strSQL = @strSQL + ' sale.sl_ratio_type_cd, pp.eff_yr_blt, IsNull(sale.include_reason, ''''), IsNull(sale.sl_adj_rsn, ''''),'
set @strSQL = @strSQL + ' ''T'', pp.sup_num, pp.prop_val_yr, sale.monthly_income, sale.annual_income '
set @strSQL = @strSQL + ' from sale with (nolock), chg_of_owner_prop_assoc copa with (nolock), property_profile pp with (nolock)'
set @strSQL = @strSQL + ' where sale.chg_of_owner_id = copa.chg_of_owner_id '
set @strSQL = @strSQL + ' and sale.adjusted_sl_price is not null and sale.adjusted_sl_price > 0 '
set @strSQL = @strSQL + ' AND (sale.suppress_on_ratio_rpt_cd = ''F'' or sale.suppress_on_ratio_rpt_cd is null) '
set @strSQL = @strSQL + ' and copa.prop_id not in  (' + @input_query + ')'   
set @strSQL = @strSQL + ' and copa.chg_of_owner_id in (select chg_of_owner_id from profile_prop_list_sales '
set @strSQL = @strSQL + ' where run_id = ' + convert(varchar(10), @input_run_id) + ' and detail_id =  ' + convert(varchar(10), @detail_id) + ')' 
set @strSQL = @strSQL + ' and copa.prop_id = pp.prop_id'
set @strSQL = @strSQL + ' and pp.prop_val_yr = ' + convert(varchar(10), @input_yr) 

exec (@strSQL)

/*****************************/
/**** construct the stats ****/
/*****************************/

exec ProfileClassStats  @input_run_id, @detail_id
--exec ProfileSaleCt      @input_run_id, @detail_id
exec ProfileSaleStats   @input_run_id, @detail_id


/* set the improved & unimproved count */


select @imprv_ct = count(*)
from profile_prop_list
where imprv_hstd_val + imprv_non_hstd_val > 0
and    detail_id = @detail_id
and    run_id = @input_run_id

select @unimprv_ct = count(*)
from profile_prop_list
where imprv_hstd_val + imprv_non_hstd_val <= 0
and    land_hstd_val + land_non_hstd_val + ag_market + timber_market > 0
and    detail_id = @detail_id
and    run_id = @input_run_id

update profile_run_list
set imprv_ct = IsNull(@imprv_ct, 0),
     unimprv_ct    = IsNull(@unimprv_ct, 0)
where detail_id = @detail_id
and     run_id = @input_run_id

/* 
 * Create a profile_type_desc record if it doesn't exist with the neighborhood.appraiser_id
 * if it is not null.  If the profile_type_desc record does exist and the appraiser_id column
 * is null, then update it with the one in the neighborhood table.  If it is NOT null, do not
 * do anything as it may affect already existing profiles.
 *
 * NOTE: This is only for Neighborhood profiles!!!!
 */
 
if @input_type = 'N'
begin
	if not exists(select code
								from profile_type_desc
								with (nolock)
								where code = @input_hood_cd
								and type = 'N')
	begin
		insert profile_type_desc
		(code, type, appraiser_id)
		
		select @input_hood_cd, 'N', n.appraiser_id
		from neighborhood as n
		with (nolock)
		where hood_yr = @input_yr
		and hood_cd = @input_hood_cd
		and appraiser_id is not null
	end
	else if exists(select code
									from profile_type_desc
									with (nolock)
									where code = @input_hood_cd
									and type = 'N'
									and appraiser_id is null)
	begin
		update profile_type_desc
		set appraiser_id = n.appraiser_id
		from profile_type_desc as ptd
		join neighborhood as n
		with (nolock)
		on ptd.code = n.hood_cd
		and n.hood_yr = @input_yr
		where ptd.code = @input_hood_cd
		and n.appraiser_id is not null
	end
									
end


/* set the default run */

if (@default_run = 'T' and @input_type <> 'Q')
begin
	exec ProfileSetDefault @input_run_id, @detail_id
end

GO

