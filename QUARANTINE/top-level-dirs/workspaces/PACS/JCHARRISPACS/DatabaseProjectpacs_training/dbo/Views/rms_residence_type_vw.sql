create view rms_residence_type_vw as 
select Year = 2015, TypeID, TypeName from ms_res_cost_2015.dbo.Type with(nolock)
union all
select Year = 2016, TypeID, TypeName from ms_res_cost_2015.dbo.Type with(nolock)
union all
select Year = 2017, TypeID, TypeName from ms_res_cost_2015.dbo.Type with(nolock)

GO

