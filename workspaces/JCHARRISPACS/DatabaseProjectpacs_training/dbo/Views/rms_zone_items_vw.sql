create view rms_zone_items_vw as 
select Year = 2015, ZoneItemID, ZoneCategoryCode, ZoneItemName from ms_res_cost_2015.dbo.ZoneItems with(nolock)
union all
select Year = 2016, ZoneItemID, ZoneCategoryCode, ZoneItemName from ms_res_cost_2015.dbo.ZoneItems with(nolock)
union all
select Year = 2017, ZoneItemID, ZoneCategoryCode, ZoneItemName from ms_res_cost_2015.dbo.ZoneItems with(nolock)

GO

