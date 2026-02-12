create view rms_zone_categories_vw as 
select Year = 2015, ZoneCategoryCode, ZoneCategoryName from ms_res_cost_2015.dbo.ZoneCategories with(nolock)
union all
select Year = 2016, ZoneCategoryCode, ZoneCategoryName from ms_res_cost_2015.dbo.ZoneCategories with(nolock)
union all
select Year = 2017, ZoneCategoryCode, ZoneCategoryName from ms_res_cost_2015.dbo.ZoneCategories with(nolock)

GO

