create view rms_component_vw as 
select Year = 2015, ComponentID, SystemID, ComponentName from ms_res_cost_2015.dbo.Component with(nolock)
union all
select Year = 2016, ComponentID, SystemID, ComponentName from ms_res_cost_2015.dbo.Component with(nolock)
union all
select Year = 2017, ComponentID, SystemID, ComponentName from ms_res_cost_2015.dbo.Component with(nolock)

GO

