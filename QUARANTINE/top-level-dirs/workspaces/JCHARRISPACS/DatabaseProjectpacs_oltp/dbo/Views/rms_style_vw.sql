create view rms_style_vw as 
select Year = 2015, StyleID, StyleName from ms_res_cost_2015.dbo.Style with(nolock)
union all
select Year = 2016, StyleID, StyleName from ms_res_cost_2015.dbo.Style with(nolock)
union all
select Year = 2017, StyleID, StyleName from ms_res_cost_2015.dbo.Style with(nolock)

GO

