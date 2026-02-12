
CREATE procedure GISPropertyInfo

@prop_id		int,
@year			int = -1,
@sup_num_in int = -1

as

declare @sup_num	int										  
declare @prop_val_yr		numeric(4)
declare @file_as_name		varchar(70)
declare @geo_id			varchar(50)
declare @exemptions		varchar(50)
declare @map_id			varchar(20)
declare @ref_id1		varchar(50)
declare @ref_id2		varchar(50)
declare @legal_acreage		numeric(14,2)
declare @hood_cd		varchar(10)
declare @region			varchar(5)
declare @subset			varchar(5)
declare @dba			varchar(50)
declare @lot_tract		varchar(50)
declare @main_area		numeric(14,0)
declare @ag_timber		numeric(14,0)
declare @market			numeric(14,0)
declare @zoning			varchar(50)
declare @state_cd		varchar(10)
declare @class_cd		varchar(10)
declare @yr_blt			numeric(4,0)
declare @eff_yr_blt		numeric(4,0)
declare @land_type_cd		varchar(10)
declare @abs_subdv_cd		varchar(10)
declare @block			varchar(50)
declare @land_sqft		numeric(18,2)
declare @land_acres		numeric(18,4)
declare @land_up		numeric(14,2)
declare @land_appr_meth 	varchar(5)
declare @sale_dt		datetime
declare @sale_price		numeric(14,0)
declare @sale_type		varchar(10)
declare @sale_ratio		numeric(18,5)
declare @sale_price_sqft	numeric(14,2)
declare @market_sqft		numeric(14,2)
declare @owner_id		int
declare @address 		varchar(250)
declare @addr_line1 		varchar(60)
declare @addr_line2 		varchar(60)
declare @addr_line3 		varchar(60)
declare @addr_city  		varchar(50)
declare @addr_state 		varchar(50)
declare @addr_zip   		varchar(50)
declare @situs			varchar(150)
declare @situs_num  		varchar(10)
declare @situs_street           varchar(50)           	                 
declare @str_sale_dt		varchar(100)
declare @link_ct		int
declare @link_message		varchar(100)
declare @land_adj_econ	varchar(15)
declare @land_adj_func	varchar(15)
declare @land_adj_area	varchar(15)
declare @land_adj_bldr	varchar(15)
declare @land_adj_flood	varchar(15)
declare @land_adj_land	varchar(15)
declare @land_adj_paved_road	varchar(15)
declare @land_adj_highway	varchar(15)
declare @land_adj_avg_fence	varchar(15)
declare @land_adj_good_fence	varchar(15)
declare @total_land_market_value	numeric(18, 0)
declare @improvement_detail_type	varchar(10)
declare @improvement_adj_bldr	varchar(20)
declare @improvement_adj_imp	varchar(20)
declare @improvement_adj_adj	varchar(20)
declare @improvement_adj_good	varchar(20)
declare @improvement_id	varchar(100)
declare @income_class	varchar(10)
declare @income_nra	numeric(14, 0)
declare @income_occupancy	numeric(5, 2)
declare @income_vacancy	numeric(5, 2)
declare @income_gpi	numeric(14, 0)
declare @income_egi	numeric(14, 0)
declare @income_exp	numeric(14, 0)
declare @income_noi	numeric(14, 0)
declare @income_cap_rate	numeric(5, 2)
declare @eff_size_acres	numeric(14, 4)
declare @ls_table	varchar(25)
declare @mkt_flat_val	numeric(14, 0)
declare @land_segment_1	varchar(100)
declare @land_segment_2	varchar(100)
declare @land_segment_3	varchar(100)
declare @land_segment_4	varchar(100)
declare @land_segment_5	varchar(100)
declare @land_segment_count	int
declare @improvement_1	varchar(100)
declare @improvement_2	varchar(100)
declare @improvement_3	varchar(100)
declare @improvement_4	varchar(100)
declare @improvement_5	varchar(100)
declare @improvement_count	int
declare @bpp_count	int
declare @subclass_cd		varchar(10)
declare @class_subclass_cd	varchar(21)
declare @land_mkt_sqft	numeric(14,2)
declare @land_mkt_acre	numeric(14,2)
declare @tax_area_number varchar(23)
declare @land_adj_codes varchar(max)
declare @improvement_adj_codes varchar(max)
declare @eff_acres_group_ids [varchar](max)
declare @eff_acres_group_descriptions [varchar](max)
declare @roll_acres_diff numeric(14,2)
declare @roll_acres_diff_pct numeric(14,2)
declare @property_note varchar(320)
declare @pool varchar(10)


-- init variables

set @file_as_name	= ''
set @geo_id		= ''
set @exemptions		= ''
set @map_id		= ''
set @ref_id1		= ''
set @ref_id2		= ''
set @legal_acreage	= 0
set @hood_cd		= ''
set @region		= ''
set @subset		= ''
set @dba		= ''
set @lot_tract		= ''
set @main_area		= 0
set @ag_timber		= 0
set @market		= 0
set @zoning		= ''
set @state_cd		= ''
set @class_cd		= ''
set @yr_blt		= 0
set @eff_yr_blt		= 0
set @land_type_cd	= ''
set @abs_subdv_cd	= ''
set @block		= ''
set @land_sqft		= 0
set @land_acres		= 0
set @land_up		= 0
set @land_appr_meth 	= ''
set @sale_dt		= null
set @sale_price		= 0
set @sale_type		= ''
set @sale_ratio		= 0
set @sale_price_sqft	= 0
set @market_sqft	= 0
set @owner_id		= 0
set @address 		= ''
set @addr_line1 	= ''
set @addr_line2 	= ''
set @addr_line3 	= ''
set @addr_city  	= ''
set @addr_state 	= ''
set @addr_zip   	= ''
set @situs		= ''
set @situs_num  	= ''
set @situs_street       = ''
set @land_adj_econ = ''
set @land_adj_func = ''
set @land_adj_area	= ''
set @land_adj_bldr = ''
set @land_adj_flood	= ''
set @land_adj_land = ''
set @land_adj_paved_road = ''
set @land_adj_highway = ''
set @land_adj_avg_fence = ''
set @land_adj_good_fence = ''
set @total_land_market_value = 0
set @improvement_detail_type = ''
set @improvement_adj_bldr = ''
set @improvement_adj_imp = ''
set @improvement_adj_adj = ''
set @improvement_adj_good = ''
set @improvement_id = ''
set @income_class = ''
set @income_nra = 0
set @income_occupancy = 0
set @income_vacancy = 0
set @income_gpi = 0
set @income_egi = 0
set @income_exp = 0
set @income_noi = 0
set @income_cap_rate = 0
set @eff_size_acres = 0
set @ls_table = ''
set @mkt_flat_val = 0
set @land_segment_1 = ''
set @land_segment_2 = ''
set @land_segment_3 = ''
set @land_segment_4 = ''
set @land_segment_5 = ''
set @land_segment_count = 0
set @improvement_1 = ''
set @improvement_2 = ''
set @improvement_3 = ''
set @improvement_4 = ''
set @improvement_5 = ''
set @improvement_count = 0
set @bpp_count = 0
set @subclass_cd		= ''
set @class_subclass_cd	= ''
set @land_mkt_sqft = 0
set @land_mkt_acre = 0
set @tax_area_number = ''
set @land_adj_codes = ''
set @improvement_adj_codes = ''
set @eff_acres_group_ids = ''
set @eff_acres_group_descriptions = ''
set @roll_acres_diff = 0
set @roll_acres_diff_pct = 0
set @property_note = ''
set @pool = ''

if @year = -1
begin
	select @year = cast(appr_yr as int)
	from pacs_system
end

if(@sup_num_in <> -1)
begin
	set @sup_num = @sup_num_in
end
else
begin
	select @sup_num = max(pv_sub_query.sup_num) 
		from property_val as pv_sub_query with(nolock)
		left outer join supplement as s with(nolock) on
			s.sup_tax_yr = pv_sub_query.prop_val_yr and
			s.sup_num = pv_sub_query.sup_num 
		left outer join sup_group as sg with(nolock) on
			sg.sup_group_id = s.sup_group_id
		where (sg.status_cd is null or sg.status_cd in ('A','BC'))
		and prop_id = @prop_id
		and pv_sub_query.prop_val_yr = @year
		group by pv_sub_query.prop_val_yr, pv_sub_query.prop_id
end

select 
	@prop_id = pv.prop_id,
	@sup_num = pv.sup_num,
	@prop_val_yr = pv.prop_val_yr,
	@geo_id = IsNull(p.geo_id, ''),		
	@map_id = IsNull(pv.map_id, ''),
	@ref_id1 = IsNull(p.ref_id1, ''),
	@ref_id2 = IsNull(p.ref_id2, ''),
	@legal_acreage = IsNull(pv.legal_acreage, 0),
	@hood_cd = IsNull(pv.hood_cd, ''),
	@region = IsNull(pv.rgn_cd, ''),
	@subset = IsNull(pv.subset_cd, ''),
	@dba = IsNull(p.dba_name, ''),
	@lot_tract = IsNull(pv.tract_or_lot, ''),
	@ag_timber = IsNull(pv.ag_use_val + pv.timber_use, 0),
	@market = IsNull(pv.market, 0),
	@zoning = IsNull(p.zoning, ''),
	@abs_subdv_cd = IsNull(pv.abs_subdv_cd, ''),
	@block = IsNull(pv.block, ''),
	@eff_size_acres = IsNull(pv.eff_size_acres, 0)
from
	property_val pv with (nolock),
	property p with (nolock)
where
	pv.prop_id = p.prop_id
and	pv.prop_id = @prop_id
and	pv.prop_val_yr = @year
and pv.sup_num = @sup_num

select
	@main_area = IsNull(pp.living_area, 0),
	@state_cd = IsNull(pp.state_cd, ''),
	@class_cd = IsNull(pp.class_cd, ''),
	@yr_blt = IsNull(pp.yr_blt, 0),
	@eff_yr_blt = IsNull(pp.eff_yr_blt, 0),
	@land_type_cd = IsNull(pp.land_type_cd, ''),
	@land_sqft = IsNull(pp.land_sqft, 0),
	@land_acres = IsNull(pp.land_acres, 0),
	@land_up = IsNull(pp.land_unit_price, 0),
	@land_appr_meth = IsNull(pp.land_appr_method, ''),
	@subclass_cd = IsNull(pp.imprv_det_sub_class_cd, ''),
	@class_subclass_cd = IsNull(pp.class_cd, '')+'/'+IsNull(pp.imprv_det_sub_class_cd, '')
from property_profile pp with (nolock)
where pp.prop_id = @prop_id
and	pp.prop_val_yr = @prop_val_yr


select
	@land_mkt_sqft = case when( @land_sqft <> 0) then (isnull(pv.land_hstd_val,0) + isnull(pv.land_non_hstd_val,0) + isnull(pv.ag_market,0))/ @land_sqft  else 0 end,
	@land_mkt_acre = case when( @land_acres<> 0) then (isnull(pv.land_hstd_val,0) + isnull(pv.land_non_hstd_val,0) + isnull(pv.ag_market,0))/ @land_acres else 0 end
from
	property_val pv with (nolock)	
where
	pv.prop_id = @prop_id
and	pv.prop_val_yr = @year
and pv.sup_num = @sup_num


select top 1 
	@tax_area_number = ta.tax_area_number
from
	property_tax_area pta with(nolock),
	tax_area ta with(nolock)
where
	pta.tax_area_id = ta.tax_area_id
and	pta.year = @prop_val_yr
and pta.prop_id = @prop_id
and pta.sup_num = @sup_num 

select top 1
	@sale_dt = sl_dt, 
	@sale_price = IsNull(adjusted_sl_price, 0), 
	@sale_type = IsNull(sl_type_cd, '') 
from
	sale s with (nolock),
	chg_of_owner_prop_assoc copa with (nolock)
where
	s.chg_of_owner_id = copa.chg_of_owner_id
and	copa.prop_id = @prop_id
and	copa.seq_num = 0
order by
	copa.chg_of_owner_id desc


select top 1
	@owner_id = o.owner_id,
	@file_as_name = Rtrim(IsNull(file_as_name, '')),
	@addr_line1 = Rtrim(IsNull(addr_line1, '')),
	@addr_line2 = Rtrim(IsNull(addr_line2, '')),
	@addr_line3 = Rtrim(IsNull(addr_line3, '')),
	@addr_city = Rtrim(IsNull(addr_city, '')),
	@addr_state = Rtrim(IsNull(addr_state, '')),
	@addr_zip = Rtrim(IsNull(addr_zip, ''))
from
	owner o with (nolock),
	account a with (nolock),
	address ad with (nolock)
where
	o.owner_id = a.acct_id
and	a.acct_id = ad.acct_id
and	ad.primary_addr = 'Y'
and	o.prop_id = @prop_id
and	o.sup_num = @sup_num
and	o.owner_tax_yr = @prop_val_yr

-- build address

set @address = ''

if (@addr_line1 <> '' and @addr_line1 is not null)
begin
	set @address = @addr_line1
end

if (@addr_line2 <> '' and @addr_line2 is not null)
begin
	if (@address <> '')
	begin
		set @address = @address + ' ' 
	end
		
	set @address = @address + @addr_line2
end

if (@addr_line3 <> '' and @addr_line3 is not null)
begin
	if (@address <> '')
	begin
		set @address = @address + ' ' 
	end
		
	set @address = @address + @addr_line3
end


if (@addr_city <> '' and @addr_city is not null)
begin
	if (@address <> '')
	begin
		set @address = @address + ' ' 
	end
		
	set @address = @address + @addr_city
end

if (@addr_state <> '' and @addr_state is not null)
begin
	if (@address <> '')
	begin
		set @address = @address + ', ' 
	end
		
	set @address = @address + @addr_state
end

if (@addr_zip <> '' and @addr_zip is not null)
begin
	if (@address <> '')
	begin
		set @address = @address + ' ' 
	end
		
	set @address = @address + @addr_zip
end


-- build situs

select 
	@situs = REPLACE(isnull(situs_display, ''), CHAR(13) + CHAR(10), ' '),
	@situs_num = situs_num,
	@situs_street = situs_street
from
	situs with (nolock)
where
	prop_id = @prop_id
and	primary_situs = 'Y'

set @owner_id = IsNull(@owner_id, 0)

-- exemptions

if (@owner_id is not null and @owner_id > 0) and (@prop_id is not null and @prop_id > 0)
begin
	exec GetExemptions '', @prop_id, @owner_id, @sup_num, @prop_val_yr, @exemptions output
end
else
begin
	set @exemptions = ''
end


if (@main_area > 0)
begin
	set @market_sqft = @market/ @main_area
	set @sale_price_sqft = @sale_price/@main_area
end
else
begin
	set @market_sqft = 0
	set @sale_price_sqft = 0
end


if (@sale_price is not null and @sale_price > 0)
begin
	set @sale_ratio = @market/@sale_price
end
else
begin
	set @sale_ratio = 0
end



if (@sale_dt is not null)
begin
	set @str_sale_dt = convert(varchar(2), datepart(mm, @sale_dt)) + '/' + convert(varchar(2), datepart(dd, @sale_dt)) + '/' + convert(varchar(4), datepart(yyyy, @sale_dt))
end
else
begin
	set @str_sale_dt = ''
end

-- property links

select @link_ct = count(*) from property_assoc with (nolock)
where parent_prop_id = @prop_id
and prop_val_yr = @prop_val_yr
and sup_num = @sup_num

set @link_message = ''

if @link_ct > 2
begin
    set @link_message = 'Multi'
end
else
begin
    declare links_cursor cursor for
    select child_prop_id as prop_id
    from property_assoc with (nolock)
	where parent_prop_id = @prop_id
	and prop_val_yr = @prop_val_yr
	and sup_num = @sup_num

    declare @prop_link int

    open links_cursor
    fetch next from links_cursor into @prop_link

    while (@@FETCH_STATUS = 0)
    begin
        if not @link_message = ''
            set @link_message = @link_message + ', '

        set @link_message = @link_message + convert(varchar(20), @prop_link);

	fetch next from	links_cursor into @prop_link
    end

    close links_cursor
    deallocate links_cursor
end



/*
select @link_ct = count(*) From property_assoc
where parent_prop_id = @prop_id

if (@link_ct > 0)
begin
	set @link_message = 'Links'
end
else
begin	
	set @link_message = ''
end
*/

---------------


-- land

declare @land_seg_id		int
set @land_seg_id = 0

select top 1
	@land_seg_id = ISNULL(land_detail.land_seg_id, 0),
	@ls_table = ISNULL(land_sched.ls_code, '')
from
	land_detail with(nolock)
left outer join 
	land_sched with(nolock)
on
	land_sched.ls_year = land_detail.prop_val_yr
and	land_sched.ls_id = land_detail.ls_mkt_id
where
	land_detail.prop_id = @prop_id
and	land_detail.prop_val_yr = @prop_val_yr
and	land_detail.sup_num = @sup_num
and	land_detail.sale_id = 0
order by
	land_detail.land_seg_id

if @land_seg_id > 0
begin
	declare @land_value		numeric(10, 0)
	declare @land_seg_adj_pc	numeric(5, 2)
	declare @land_adj_type_usage	varchar(5)
	declare @land_adj_type_amt	numeric(10, 0)
	declare @land_adj_type_pct	numeric(5, 2)

	-- land_adj_econ
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'ECON'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_econ = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_econ = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_econ = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_econ = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_func
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where	prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'FUNC'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_func = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_func = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_func = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_func = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_area
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'AREA'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_area = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_area = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_area = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_area = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_bldr
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'BLDR'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_bldr = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_bldr = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_bldr = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_bldr = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_flood
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'FLOOD'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_flood = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_flood = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_flood = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_flood = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_land
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'LAND'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_land = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_land = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_land = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_land = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_paved_road
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'P'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_paved_road = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_paved_road = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_paved_road = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_paved_road = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_highway
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'H'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_highway = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_highway = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_highway = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_highway = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_avg_fence
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'AF'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_avg_fence = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_avg_fence = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_avg_fence = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_avg_fence = convert(varchar(15), @land_adj_type_amt)
	end

	-- land_adj_good_fence
	set @land_value = 0
	set @land_seg_adj_pc = 0
	set @land_adj_type_usage = ''
	set @land_adj_type_amt = 0
	set @land_adj_type_pct = 0

	select top 1
		@land_value = ISNULL(land_value, 0),
		@land_seg_adj_pc = ISNULL(land_seg_adj_pc, 0),
		@land_adj_type_usage = ISNULL(land_adj_type_usage, ''),
		@land_adj_type_amt = ISNULL(land_adj_type_amt, 0),
		@land_adj_type_pct = ISNULL(land_adj_type_pct, 0)
	from
		land_adj_vw with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	land_seg_id = @land_seg_id
	and	land_seg_adj_type = 'GF'
	order by
		land_seg_adj_seq

	if @land_adj_type_usage = 'U'
	begin
		if @land_seg_adj_pc  = 0
		begin
			set @land_adj_good_fence = convert(varchar(15), @land_value)
		end
		else
		begin
			set @land_adj_good_fence = convert(varchar(15), @land_seg_adj_pc) + '%'
		end	
	end
	else if @land_adj_type_usage = 'P'
	begin
		set @land_adj_good_fence = convert(varchar(15), @land_adj_type_pct) + '%'
	end
	else
	begin
		set @land_adj_good_fence = convert(varchar(15), @land_adj_type_amt)
	end
end

-- land segments 1 - 5
declare @ls_mkt_id		int
declare @size_square_feet	numeric(18, 2)
declare @size_acres		numeric(18, 4)
declare @land_seg_up		numeric(14, 2)
declare @ls_method		varchar(5)
declare @mkt_val_source		varchar(1)
declare @segment_text		varchar(100)
declare @segment_counter	int
set @segment_counter = 0

declare land_segment cursor for
select top 5
	ISNULL(ls_mkt_id, 0),
	ISNULL(size_square_feet, 0),
	ISNULL(size_acres, 0),
	ISNULL(land_seg_up, 0),
	ISNULL(mkt_val_source, '')
from
	land_detail with(nolock)
where
	prop_id = @prop_id
and	prop_val_yr = @prop_val_yr
and	sup_num = @sup_num
and	sale_id = 0
order by
	land_seg_id

open	land_segment

fetch next from	land_segment into
	@ls_mkt_id,
	@size_square_feet,
	@size_acres,
	@land_seg_up,
	@mkt_val_source

while (@@FETCH_STATUS = 0)
begin
	set @segment_counter = @segment_counter + 1

	select
		@ls_method = RTRIM(ISNULL(ls_method, ''))
	from
		land_sched with(nolock)
	where
		ls_year = @prop_val_yr
	and	ls_id = @ls_mkt_id

	set @segment_text = convert(varchar(20), @size_square_feet)
	set @segment_text = @segment_text + ', ' + convert(varchar(20), @size_acres)
	set @segment_text = @segment_text + ', ' + convert(varchar(20), @land_seg_up)
	set @segment_text = @segment_text + ', ' + @ls_method
	set @segment_text = @segment_text + ', ' + @mkt_val_source

	if @segment_counter = 1
	begin
		set @land_segment_1 = @segment_text
	end
	else if @segment_counter = 2
	begin
		set @land_segment_2 = @segment_text
	end
	else if @segment_counter = 3
	begin
		set @land_segment_3 = @segment_text
	end
	else if @segment_counter = 4
	begin
		set @land_segment_4 = @segment_text
	end
	else if @segment_counter = 5
	begin
		set @land_segment_5 = @segment_text
	end

	fetch next from land_segment into
		@ls_mkt_id,
		@size_square_feet,
		@size_acres,
		@land_seg_up,
		@mkt_val_source
end

close	land_segment
deallocate	land_segment

-- total_land_market_value
select	@total_land_market_value = sum(ISNULL(land_seg_mkt_val, 0))
from	land_detail with(nolock)
where	prop_id = @prop_id
and	prop_val_yr = @prop_val_yr
and	sup_num = @sup_num
and	sale_id = 0

-- improvement
declare @imprv_id	int
set @imprv_id = 0

select top 1
	@imprv_id = ISNULL(imprv_id, 0)
from
	imprv with(nolock)
where
	prop_id = @prop_id
and	prop_val_yr = @prop_val_yr
and	sup_num = @sup_num
and	sale_id = 0
order by
	imprv_id

if @imprv_id > 0
begin
	declare @imprv_detail_id	int
	set @imprv_detail_id = 0

	-- improvement_detail_type
	select top 1
		@imprv_detail_id = ISNULL(imprv_det_id, 0),
		@improvement_detail_type = ISNULL(imprv_det_type_cd, '')
	from
		imprv_detail with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	imprv_id = @imprv_id
	order by
		imprv_det_id

	if @imprv_detail_id > 0
	begin
		declare @imprv_det_adj_pc	numeric(14, 2)
		declare @imprv_det_adj_amt	numeric(14, 0)
		declare @imprv_adj_type_usage	varchar(5)
		declare @imprv_adj_type_amt	numeric(10, 0)
		declare @imprv_adj_type_pct	numeric(5, 2)

		-- improvement_adj_bldr
		set @imprv_det_adj_pc = 0
		set @imprv_det_adj_amt = 0
		set @imprv_adj_type_usage = ''
		set @imprv_adj_type_amt = 0
		set @imprv_adj_type_pct = 0

		select top 1
			@imprv_det_adj_pc = ISNULL(imprv_det_adj_pc, 0),
			@imprv_det_adj_amt = ISNULL(imprv_det_adj_amt, 0),
			@imprv_adj_type_usage = ISNULL(imprv_adj_type_usage, ''),
			@imprv_adj_type_amt = ISNULL(imprv_adj_type_amt, 0),
			@imprv_adj_type_pct = ISNULL(imprv_adj_type_pct, 0)
		from
			imp_detail_adj_vw with(nolock)
		where
			prop_id = @prop_id
		and	prop_val_yr = @prop_val_yr
		and	sup_num = @sup_num
		and	imprv_id = @imprv_id
		and	imprv_det_id = @imprv_detail_id
		and	imprv_adj_type_cd = 'BLDR'
		order by
			imprv_det_adj_seq

		if @imprv_adj_type_usage = 'U' or @imprv_adj_type_usage = 'S'
		begin
			if @imprv_det_adj_pc  = 0
			begin
				set @improvement_adj_bldr = convert(varchar(20), @imprv_det_adj_amt)
			end
			else
			begin
				set @improvement_adj_bldr = convert(varchar(20), @imprv_det_adj_pc) + '%'
			end	
		end
		else if @imprv_adj_type_usage = 'P'
		begin
			set @improvement_adj_bldr = @imprv_adj_type_pct + '%'
		end
		else
		begin
			set @improvement_adj_bldr = @imprv_adj_type_amt
		end

		-- improvement_adj_imp
		set @imprv_det_adj_pc = 0
		set @imprv_det_adj_amt = 0
		set @imprv_adj_type_usage = ''
		set @imprv_adj_type_amt = 0
		set @imprv_adj_type_pct = 0

		select top 1
			@imprv_det_adj_pc = ISNULL(imprv_det_adj_pc, 0),
			@imprv_det_adj_amt = ISNULL(imprv_det_adj_amt, 0),
			@imprv_adj_type_usage = ISNULL(imprv_adj_type_usage, ''),
			@imprv_adj_type_amt = ISNULL(imprv_adj_type_amt, 0),
			@imprv_adj_type_pct = ISNULL(imprv_adj_type_pct, 0)
		from
			imp_detail_adj_vw with(nolock)
		where
			prop_id = @prop_id
		and	prop_val_yr = @prop_val_yr
		and	sup_num = @sup_num
		and	imprv_id = @imprv_id
		and	imprv_det_id = @imprv_detail_id
		and	imprv_adj_type_cd = 'IMP'
		order by
			imprv_det_adj_seq

		if @imprv_adj_type_usage = 'U' or @imprv_adj_type_usage = 'S'
		begin
			if @imprv_det_adj_pc  = 0
			begin
				set @improvement_adj_imp = convert(varchar(20), @imprv_det_adj_amt)
			end
			else
			begin
				set @improvement_adj_imp = convert(varchar(20), @imprv_det_adj_pc) + '%'
			end	
		end
		else if @imprv_adj_type_usage = 'P'
		begin
			set @improvement_adj_imp = @imprv_adj_type_pct + '%'
		end
		else
		begin
			set @improvement_adj_imp = @imprv_adj_type_amt
		end

		-- improvement_adj_adj
		set @imprv_det_adj_pc = 0
		set @imprv_det_adj_amt = 0
		set @imprv_adj_type_usage = ''
		set @imprv_adj_type_amt = 0
		set @imprv_adj_type_pct = 0

		select top 1
			@imprv_det_adj_pc = ISNULL(imprv_det_adj_pc, 0),
			@imprv_det_adj_amt = ISNULL(imprv_det_adj_amt, 0),
			@imprv_adj_type_usage = ISNULL(imprv_adj_type_usage, ''),
			@imprv_adj_type_amt = ISNULL(imprv_adj_type_amt, 0),
			@imprv_adj_type_pct = ISNULL(imprv_adj_type_pct, 0)
		from
			imp_detail_adj_vw with(nolock)
		where
			prop_id = @prop_id
		and	prop_val_yr = @prop_val_yr
		and	sup_num = @sup_num
		and	imprv_id = @imprv_id
		and	imprv_det_id = @imprv_detail_id
		and	imprv_adj_type_cd = 'ADJ'
		order by
			imprv_det_adj_seq

		if @imprv_adj_type_usage = 'U' or @imprv_adj_type_usage = 'S'
		begin
			if @imprv_det_adj_pc  = 0
			begin
				set @improvement_adj_adj = convert(varchar(20), @imprv_det_adj_amt)
			end
			else
			begin
				set @improvement_adj_adj = convert(varchar(20), @imprv_det_adj_pc) + '%'
			end	
		end
		else if @imprv_adj_type_usage = 'P'
		begin
			set @improvement_adj_adj = @imprv_adj_type_pct + '%'
		end
		else
		begin
			set @improvement_adj_adj = @imprv_adj_type_amt
		end

		-- improvement_adj_good
		set @imprv_det_adj_pc = 0
		set @imprv_det_adj_amt = 0
		set @imprv_adj_type_usage = ''
		set @imprv_adj_type_amt = 0
		set @imprv_adj_type_pct = 0

		select top 1
			@imprv_det_adj_pc = ISNULL(imprv_det_adj_pc, 0),
			@imprv_det_adj_amt = ISNULL(imprv_det_adj_amt, 0),
			@imprv_adj_type_usage = ISNULL(imprv_adj_type_usage, ''),
			@imprv_adj_type_amt = ISNULL(imprv_adj_type_amt, 0),
			@imprv_adj_type_pct = ISNULL(imprv_adj_type_pct, 0)
		from
			imp_detail_adj_vw with(nolock)
		where
			prop_id = @prop_id
		and	prop_val_yr = @prop_val_yr
		and	sup_num = @sup_num
		and	imprv_id = @imprv_id
		and	imprv_det_id = @imprv_detail_id
		and	imprv_adj_type_cd = 'ADJ'
		order by
			imprv_det_adj_seq

		if @imprv_adj_type_usage = 'U' or @imprv_adj_type_usage = 'S'
		begin
			if @imprv_det_adj_pc  = 0
			begin
				set @improvement_adj_good = convert(varchar(20), @imprv_det_adj_amt)
			end
			else
			begin
				set @improvement_adj_good = convert(varchar(20), @imprv_det_adj_pc) + '%'
			end	
		end
		else if @imprv_adj_type_usage = 'P'
		begin
			set @improvement_adj_good = @imprv_adj_type_pct + '%'
		end
		else
		begin
			set @improvement_adj_good = @imprv_adj_type_amt
		end
	end
end

-- improvement id
declare @imprv_id_str varchar(10)

declare imprv_cursor cursor for
select imprv_id
from
	imprv with(nolock)
where
	prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
order by
	imprv_id

open imprv_cursor
fetch next from imprv_cursor into @imprv_id_str
while @@fetch_status = 0
begin
 if not @improvement_id = ''
   set @improvement_id = @improvement_id + ','
 set @improvement_id = @improvement_id + @imprv_id_str
 fetch next from imprv_cursor into @imprv_id_str
end
close imprv_cursor
deallocate imprv_cursor

-- improvements 1 - 5 (1st detail for each)
declare @imprv_det_class_cd	varchar(10)
declare @yr_built		varchar(4)
declare @imprv_det_area		numeric(18, 1)
declare @imprv_state_cd		varchar(5)
declare @imprv_det_type_cd	varchar(5)
declare @improvement_text	varchar(100)
declare @improvement_counter	int
set @improvement_counter = 0

declare improvement cursor for
select top 5
	imprv_id,
	RTRIM(ISNULL(imprv_state_cd, ''))
from
	imprv with(nolock)
where
	prop_id = @prop_id
and	prop_val_yr = @prop_val_yr
and	sup_num = @sup_num
and	sale_id = 0
order by
	imprv_id

open	improvement

fetch next from	improvement into
	@imprv_id,
	@imprv_state_cd

while (@@FETCH_STATUS = 0)
begin
	set @improvement_counter = @improvement_counter + 1

	select top 1
		@imprv_det_class_cd =RTRIM(ISNULL(imprv_det_class_cd, '')),
		@yr_built = RTRIM(ISNULL(CONVERT(varchar(4), yr_built), '')),
		@imprv_det_area = ISNULL(imprv_det_area, 0),
		@imprv_det_type_cd = RTRIM(ISNULL(imprv_det_type_cd, ''))
	from
		imprv_detail with(nolock)
	where
		prop_id = @prop_id
	and	prop_val_yr = @prop_val_yr
	and	sup_num = @sup_num
	and	imprv_id = @imprv_id
	order by
		imprv_det_id

	set @improvement_text = @imprv_det_class_cd
	set @improvement_text = @improvement_text + ', ' + @yr_built
	set @improvement_text = @improvement_text + ', ' + convert(varchar(25), @imprv_det_area)
	set @improvement_text = @improvement_text + ', ' + @imprv_state_cd
	set @improvement_text = @improvement_text + ', ' + @imprv_det_type_cd

	if @improvement_counter = 1
	begin
		set @improvement_1 = @improvement_text
	end
	else if @improvement_counter = 2
	begin
		set @improvement_2 = @improvement_text
	end
	else if @improvement_counter = 3
	begin
		set @improvement_3 = @improvement_text
	end
	else if @improvement_counter = 4
	begin
		set @improvement_4 = @improvement_text
	end
	else if @improvement_counter = 5
	begin
		set @improvement_5 = @improvement_text
	end

	fetch next from	improvement into
		@imprv_id,
		@imprv_state_cd
end

close	improvement
deallocate	improvement

-- income
select top 1
	@income_class = ISNULL(class, ''),
	@income_nra = ISNULL(NRA, 0),
	@income_occupancy = ISNULL(OCR, 0),
	@income_vacancy = ISNULL(VR, 0),
	@income_gpi = ISNULL(GPI, 0),
	@income_egi = ISNULL(EGI, 0),
	@income_exp = ISNULL(TEXP, 0),
	@income_noi = ISNULL(NOI, 0),
	@income_cap_rate = ISNULL(CAPR, 0)
from
	income_prop_vw with(nolock)
where
	prop_id = @prop_id
and	prop_val_yr = @prop_val_yr
and	sup_num = @sup_num
and	active_valuation = 'T'
order by
	income_id

-- land_segment_count
select
	@land_segment_count = count(*)
from
	land_detail with(nolock)
where
	prop_id = @prop_id
and	prop_val_yr = @prop_val_yr
and	sup_num = @sup_num
and	sale_id = 0

-- improvement_count
select
	@improvement_count = count(*)
from
	imprv with(nolock)
where
	prop_id = @prop_id
and	prop_val_yr = @prop_val_yr
and	sup_num = @sup_num
and	sale_id = 0

-- bpp_count
select
	@bpp_count = count(*)
from
	property_assoc with (nolock)
inner join
	property with(nolock)
on
	property_assoc.child_prop_id = property.prop_id
where
	property_assoc.parent_prop_id = @prop_id
and	property.prop_type_cd = 'P'
and property_assoc.prop_val_yr = @prop_val_yr
and property_assoc.sup_num = @sup_num

--land_adj_codes
select @land_adj_codes = (select
	land_seg_adj_cd + ','
from (
	select distinct land_seg_adj_cd
	from land_adj la with(nolock)
	where la.prop_id = @prop_id and la.prop_val_yr = @prop_val_yr and la.sup_num = @sup_num and la.sale_id = 0
) as tt
order by land_seg_adj_cd
for xml path(''))

if LEN(@land_adj_codes) > 0
begin
	select @land_adj_codes = LEFT(@land_adj_codes, LEN(@land_adj_codes) - 1)
end


--improvement_adj_codes
select @improvement_adj_codes = (select
	imprv_adj_type_cd + ','
from (
	select distinct imprv_adj_type_cd
	from imprv_adj ia with(nolock)
	where ia.prop_id = @prop_id and ia.prop_val_yr = @prop_val_yr and ia.sup_num = @sup_num and ia.sale_id = 0
) as tt
order by imprv_adj_type_cd
for xml path(''))

if LEN(@improvement_adj_codes) > 0
begin
	select @improvement_adj_codes = LEFT(@improvement_adj_codes, LEN(@improvement_adj_codes) - 1)
end


--eff_acres_group_ids
select @eff_acres_group_ids = (select
	cast(group_id AS varchar(50)) + ','
from (
	select distinct group_id
	from effective_acres_assoc eaa with(nolock)
	where eaa.prop_id = @prop_id and eaa.prop_val_yr = @prop_val_yr
) as tt
order by group_id
for xml path(''))

if LEN(@eff_acres_group_ids) > 0
begin
	select @eff_acres_group_ids = LEFT(@eff_acres_group_ids, LEN(@eff_acres_group_ids) - 1)
end

--eff_acres_group_descriptions
select @eff_acres_group_descriptions = (select
	[description] + ','
from (
	select distinct eag.[description]
	from effective_acres_assoc eaa with(nolock)
	inner join effective_acres_group eag with(nolock)
		on eag.group_id = eaa.group_id and eag.prop_val_yr = eaa.prop_val_yr
	where eaa.prop_id = @prop_id and eaa.prop_val_yr = @prop_val_yr
) as tt
order by [description]
for xml path(''))

if LEN(@eff_acres_group_descriptions) > 0
begin
	select @eff_acres_group_descriptions = LEFT(@eff_acres_group_descriptions, LEN(@eff_acres_group_descriptions) - 1)
end


--roll_acres_diff
select @roll_acres_diff = @legal_acreage - @main_area

--roll_acres_diff_pct
select @roll_acres_diff_pct = case when @legal_acreage > 0 then @roll_acres_diff / @legal_acreage else 0 end

--property_note
select
	@property_note = prop_note
from property_note with(nolock)
where prop_id = @prop_id
and prop_val_yr = @year

--pool
select @pool = 'POOL'
from imprv_detail id with(nolock)
inner join imprv_det_type idt with(nolock)
	on idt.imprv_det_type_cd = id.imprv_det_type_cd and
		idt.bPool = 1
where 
	id.prop_id = @prop_id and 
	id.prop_val_yr = @year and 
	id.sup_num = @sup_num and
	id.sale_id = 0


--select everything
select
	prop_id = @prop_id,	
	sup_num = @sup_num,	
	prop_val_yr = @year,	
	geo_id = @geo_id,		
	map_id = @map_id,		
	ref_id1 = @ref_id1,	
	ref_id2 = @ref_id2,	
	legal_acreage = @legal_acreage,  
	hood_cd = @hood_cd,	
	region = @region,		
	subset = @subset,		
	dba = @dba,
	lot_tract = @lot_tract,	
	main_area = @main_area,	
	ag_timber = @ag_timber,	
	market = @market,		
	zoning = @zoning,		
	state_cd = @state_cd,	
	class_cd = @class_cd,	
	yr_blt = @yr_blt,		
	eff_yr_blt = @eff_yr_blt,	
	land_type_cd = @land_type_cd,	
	abs_subdv_cd = @abs_subdv_cd,	
	block = @block,		
	land_sqft = @land_sqft,	
	land_acres = @land_acres,	
	land_up = @land_up,	
	land_appr_meth = @land_appr_meth, 
	sale_dt = @str_sale_dt,    
	sale_price = @sale_price, 
	sale_type = @sale_type,
	market_sqft = @market_sqft,
	sale_price_sqft = @sale_price_sqft,
	sale_ratio = @sale_ratio,
	file_as_name = @file_as_name,
	address = @address,
	situs = @situs,
	exemptions = @exemptions,
	situs_no = @situs_num,
	situs_street = @situs_street,
	linked = @link_message,
	gis_sq_foot = 0,
	gis_acres = 0,
	owner_id = @owner_id,
	land_adj_econ = @land_adj_econ,
	land_adj_func = @land_adj_func,
	land_adj_area = @land_adj_area,
	land_adj_bldr = @land_adj_bldr,
	land_adj_flood = @land_adj_flood,
	land_adj_land = @land_adj_land,
	land_adj_paved_road = @land_adj_paved_road,
	land_adj_highway = @land_adj_highway,
	land_adj_avg_fence = @land_adj_avg_fence,
	land_adj_good_fence = @land_adj_good_fence,
	total_land_market_value = @total_land_market_value,
	improvement_detail_type = @improvement_detail_type,
	improvement_adj_bldr = @improvement_adj_bldr,
	improvement_adj_imp = @improvement_adj_imp,
	improvement_adj_adj = @improvement_adj_adj,
	improvement_adj_good = @improvement_adj_good,
  imprv_id = @improvement_id,
	income_class = @income_class,
	income_nra = @income_nra,
	income_occupancy = @income_occupancy,
	income_vacancy = @income_vacancy,
	income_gpi = @income_gpi,
	income_egi = @income_egi,
	income_exp = @income_exp,
	income_noi = @income_noi,
	income_cap_rate = @income_cap_rate,
	eff_size_acres = @eff_size_acres,
	ls_table = @ls_table,
	land_segment_1 = @land_segment_1,
	land_segment_2 = @land_segment_2,
	land_segment_3 = @land_segment_3,
	land_segment_4 = @land_segment_4,
	land_segment_5 = @land_segment_5,
	land_segment_count = @land_segment_count,
	improvement_1 = @improvement_1,
	improvement_2 = @improvement_2,
	improvement_3 = @improvement_3,
	improvement_4 = @improvement_4,
	improvement_5 = @improvement_5,
	improvement_count = @improvement_count,
	bpp_count = @bpp_count,
	subclass_cd = @subclass_cd,
	class_subclass_cd = @class_subclass_cd,
	land_mkt_sqft = @land_mkt_sqft,
	land_mkt_acre = @land_mkt_acre,
	tax_area_number = @tax_area_number,
	land_adj_codes = @land_adj_codes,
	improvement_adj_codes = @improvement_adj_codes,
	eff_acres_group_ids = @eff_acres_group_ids,
	eff_acres_group_desc = @eff_acres_group_descriptions,
	roll_acres_diff = @roll_acres_diff,
	roll_acres_diff_pct = @roll_acres_diff_pct,
	property_note = @property_note,
	[pool] = @pool

GO

