create view rms_condition_vw as 
select Year = 2015, ConditionID, Description from ms_res_cost_2015.dbo.Condition with(nolock)
union all
select Year = 2016, ConditionID, Description from ms_res_cost_2015.dbo.Condition with(nolock)
union all
select Year = 2017, ConditionID, Description from ms_res_cost_2015.dbo.Condition with(nolock)

GO

