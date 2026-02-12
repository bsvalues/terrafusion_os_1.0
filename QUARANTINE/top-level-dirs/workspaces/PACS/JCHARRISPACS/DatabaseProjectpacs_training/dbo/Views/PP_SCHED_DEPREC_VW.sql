







CREATE VIEW dbo.PP_SCHED_DEPREC_VW
AS
SELECT pp_schedule_deprec.pp_sched_id, 
    pp_schedule_deprec.pp_sched_deprec_type_cd, 
    pp_schedule_deprec.pp_sched_deprec_deprec_cd, 
    pp_schedule_deprec.year, 
    pp_schedule_deprec.description AS pp_sched_deprec_description,
     depreciation.description AS depreciation_description, 
    depreciation.prop_type_cd
FROM depreciation RIGHT OUTER JOIN
    pp_schedule_deprec ON 
    depreciation.type_cd = pp_schedule_deprec.pp_sched_deprec_type_cd
     AND 
    depreciation.deprec_cd = pp_schedule_deprec.pp_sched_deprec_deprec_cd
     AND depreciation.year = pp_schedule_deprec.year

GO

