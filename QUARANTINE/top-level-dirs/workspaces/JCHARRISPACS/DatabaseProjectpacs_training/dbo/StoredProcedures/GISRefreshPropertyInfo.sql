
create procedure GISRefreshPropertyInfo
(
	@prop_id_list varchar(max),
	@year int
)
as
begin

	set nocount on;
	
	declare @key       int;
	declare @maxkey    int;
	declare @keytab    table ( pid int not null );
	
	CREATE TABLE #gis_property_info(
		[prop_id] [int] NOT NULL,
		[sup_num] [int] NULL,
		[prop_val_yr] [numeric](4, 0) NOT NULL,
		[geo_id] [varchar](50) NULL,
		[map_id] [varchar](20) NULL,
		[ref_id1] [varchar](50) NULL,
		[ref_id2] [varchar](50) NULL,
		[legal_acreage] [numeric](14, 2) NULL,
		[hood_cd] [varchar](10) NULL,
		[region] [varchar](5) NULL,
		[subset] [varchar](5) NULL,
		[dba] [varchar](50) NULL,
		[lot_tract] [varchar](50) NULL,
		[main_area] [numeric](14, 0) NULL,
		[ag_timber] [numeric](14, 0) NULL,
		[market] [numeric](14, 0) NULL,
		[zoning] [varchar](50) NULL,
		[state_cd] [varchar](10) NULL,
		[class_cd] [varchar](10) NULL,
		[yr_blt] [numeric](4, 0) NULL,
		[eff_yr_blt] [numeric](4, 0) NULL,
		[land_type_cd] [varchar](10) NULL,
		[abs_subdv_cd] [varchar](10) NULL,
		[block] [varchar](50) NULL,
		[land_sqft] [numeric](18, 2) NULL,
		[land_acres] [numeric](18, 4) NULL,
		[land_up] [numeric](14, 2) NULL,
		[land_appr_meth] [varchar](5) NULL,
		[str_sale_dt] [varchar](100) NULL,
		[sale_price] [numeric](14, 0) NULL,
		[sale_type] [varchar](10) NULL,
		[market_sqft] [numeric](14, 2) NULL,
		[sale_price_sqft] [numeric](14, 2) NULL,
		[sale_ratio] [numeric](18, 5) NULL,
		[file_as_name] [varchar](70) NULL,
		[address] [varchar](250) NULL,
		[situs] [varchar](150) NULL,
		[exemptions] [varchar](50) NULL,
		[situs_num] [varchar](10) NULL,
		[situs_street] [varchar](50) NULL,
		[link_message] [varchar](100) NULL,
		[gis_sq_foot] [numeric](18, 2) NULL,
		[gis_acres] [numeric](18, 4) NULL,
		[owner_id] [int] NULL,
		[land_adj_econ] [varchar](15) NULL,
		[land_adj_func] [varchar](15) NULL,
		[land_adj_area] [varchar](15) NULL,
		[land_adj_bldr] [varchar](15) NULL,
		[land_adj_flood] [varchar](15) NULL,
		[land_adj_land] [varchar](15) NULL,
		[land_adj_paved_road] [varchar](15) NULL,
		[land_adj_highway] [varchar](15) NULL,
		[land_adj_avg_fence] [varchar](15) NULL,
		[land_adj_good_fence] [varchar](15) NULL,
		[total_land_market_value] [numeric](18, 0) NULL,
		[improvement_detail_type] [varchar](10) NULL,
		[improvement_adj_bldr] [varchar](20) NULL,
		[improvement_adj_imp] [varchar](20) NULL,
		[improvement_adj_adj] [varchar](20) NULL,
		[improvement_adj_good] [varchar](20) NULL,
		[improvement_id] [varchar](100) NULL,
		[income_class] [varchar](10) NULL,
		[income_nra] [numeric](14, 0) NULL,
		[income_occupancy] [numeric](5, 2) NULL,
		[income_vacancy] [numeric](5, 2) NULL,
		[income_gpi] [numeric](14, 0) NULL,
		[income_egi] [numeric](14, 0) NULL,
		[income_exp] [numeric](14, 0) NULL,
		[income_noi] [numeric](14, 0) NULL,
		[income_cap_rate] [numeric](5, 2) NULL,
		[eff_size_acres] [numeric](14, 4) NULL,
		[ls_table] [varchar](25) NULL,
		[land_segment_1] [varchar](100) NULL,
		[land_segment_2] [varchar](100) NULL,
		[land_segment_3] [varchar](100) NULL,
		[land_segment_4] [varchar](100) NULL,
		[land_segment_5] [varchar](100) NULL,
		[land_segment_count] [int] NULL,
		[improvement_1] [varchar](100) NULL,
		[improvement_2] [varchar](100) NULL,
		[improvement_3] [varchar](100) NULL,
		[improvement_4] [varchar](100) NULL,
		[improvement_5] [varchar](100) NULL,
		[improvement_count] [int] NULL,
		[bpp_count] [int] NULL,
		[subclass_cd] [varchar](10) NULL,
		[class_subclass_cd] [varchar](21) NULL,
		[land_mkt_sqft] [numeric](14, 2) NULL,
		[land_mkt_acre] [numeric](14, 2) NULL,
		[tax_area_number] [varchar](max) NULL,
		[land_adj_codes] [varchar](max) NULL,
		[improvement_adj_codes] [varchar](max) NULL,
		[eff_acres_group_ids] [varchar](max) NULL,
		[eff_acres_group_desc] [varchar](max) NULL,
		[roll_acres_diff] [numeric](14, 2) NULL,
		[roll_acres_diff_pct] [numeric](14, 2) NULL,
		[property_note] [varchar](320) NULL,		
		[update_dt] [datetime] NOT NULL DEFAULT(getdate()),
		[pool] [varchar](10) NULL
		)
	
	if(@prop_id_list is not null and len(@prop_id_list) > 0)
	begin
		insert into @keytab select convert(int, str) from fn_ParseTable(@prop_id_list, ',')
	end
	else
	begin
		insert into @keytab
		select distinct pv.prop_id from property_val pv with(nolock)
		inner join property p with(nolock) on
						pv.prop_id = p.prop_id and
						p.prop_type_cd in ('R')
		where prop_val_yr = @year
	end
		
	declare @prop_id int
	declare @sup_num int
	declare refresh_cursor cursor fast_forward for
		select distinct pv.prop_id, max(pv.sup_num)
		from property_val as pv with(nolock)
		inner join @keytab as kt
			on kt.pid = pv.prop_id
			and pv.prop_val_yr = @year
		left outer join supplement as s with(nolock) on
			s.sup_tax_yr = pv.prop_val_yr and
			s.sup_num = pv.sup_num
		left outer join sup_group as sg with(nolock) on
			sg.sup_group_id = s.sup_group_id
		where (sg.status_cd is null or sg.status_cd in ('A','BC'))
		group by pv.prop_val_yr, pv.prop_id
	open refresh_cursor
	fetch next from refresh_cursor into @prop_id, @sup_num

	while @@fetch_status = 0
	begin
		insert into #gis_property_info(
			[prop_id],
			[sup_num],
			[prop_val_yr],
			[geo_id],
			[map_id],
			[ref_id1],
			[ref_id2],
			[legal_acreage],
			[hood_cd],
			[region],
			[subset],
			[dba],
			[lot_tract],
			[main_area],
			[ag_timber],
			[market],
			[zoning],
			[state_cd],
			[class_cd],
			[yr_blt],
			[eff_yr_blt],
			[land_type_cd],
			[abs_subdv_cd],
			[block],
			[land_sqft],
			[land_acres],
			[land_up],
			[land_appr_meth],
			[str_sale_dt],
			[sale_price],
			[sale_type],
			[market_sqft],
			[sale_price_sqft],
			[sale_ratio],
			[file_as_name],
			[address],
			[situs],
			[exemptions],
			[situs_num],
			[situs_street],
			[link_message],
			[gis_sq_foot],
			[gis_acres],
			[owner_id],
			[land_adj_econ],
			[land_adj_func],
			[land_adj_area],
			[land_adj_bldr],
			[land_adj_flood],
			[land_adj_land],
			[land_adj_paved_road],
			[land_adj_highway],
			[land_adj_avg_fence],
			[land_adj_good_fence],
			[total_land_market_value],
			[improvement_detail_type],
			[improvement_adj_bldr],
			[improvement_adj_imp],
			[improvement_adj_adj],
			[improvement_adj_good],
			[improvement_id],
			[income_class],
			[income_nra],
			[income_occupancy],
			[income_vacancy],
			[income_gpi],
			[income_egi],
			[income_exp],
			[income_noi],
			[income_cap_rate],
			[eff_size_acres],
			[ls_table],
			[land_segment_1],
			[land_segment_2],
			[land_segment_3],
			[land_segment_4],
			[land_segment_5],
			[land_segment_count],
			[improvement_1],
			[improvement_2],
			[improvement_3],
			[improvement_4],
			[improvement_5],
			[improvement_count],
			[bpp_count],
			[subclass_cd],
			[class_subclass_cd],
			[land_mkt_sqft],
			[land_mkt_acre],
			[tax_area_number],
			[land_adj_codes],
			[improvement_adj_codes],
			[eff_acres_group_ids],
			[eff_acres_group_desc],
			[roll_acres_diff],
			[roll_acres_diff_pct],
			[property_note],
			[pool]
		)
		exec dbo.GISPropertyInfo @prop_id, @year, @sup_num
		fetch next from refresh_cursor into @prop_id, @sup_num
	end

	close refresh_cursor
	deallocate refresh_cursor
	
	delete from gis_property_info
	where prop_id in (select prop_id from #gis_property_info)
	and prop_val_yr = @year
	
	insert into gis_property_info
	select * from #gis_property_info
	
end

GO

