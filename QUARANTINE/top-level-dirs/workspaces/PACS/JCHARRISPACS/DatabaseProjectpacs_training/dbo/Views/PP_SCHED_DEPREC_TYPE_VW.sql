







CREATE VIEW dbo.PP_SCHED_DEPREC_TYPE_VW
AS
SELECT DISTINCT 
    depreciation.type_cd, depreciation.year, 
    depreciation.prop_type_cd, 
    pp_type.pp_type_desc AS type_desc
FROM depreciation LEFT OUTER JOIN
    pp_type ON depreciation.type_cd = pp_type.pp_type_cd

GO

