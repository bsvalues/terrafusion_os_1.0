create view rms_system_vw as 
select Year = 2015, SystemID, SystemName from ms_res_cost_2015.dbo.System with(nolock)
union all
select Year = 2016, SystemID, SystemName from ms_res_cost_2015.dbo.System with(nolock)
union all
select Year = 2017, SystemID, SystemName from ms_res_cost_2015.dbo.System with(nolock)

GO

