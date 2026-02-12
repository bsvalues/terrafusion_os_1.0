create view rms_addition_vw as 
select Year = 2015, AdditionTypeID, Description from ms_res_cost_2015.dbo.AdditionType with(nolock)
union all
select Year = 2016, AdditionTypeID, Description from ms_res_cost_2015.dbo.AdditionType with(nolock)
union all
select Year = 2017, AdditionTypeID, Description from ms_res_cost_2015.dbo.AdditionType with(nolock)

GO

