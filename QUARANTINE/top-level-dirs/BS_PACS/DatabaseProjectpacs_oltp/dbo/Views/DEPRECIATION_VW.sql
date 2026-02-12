
CREATE VIEW dbo.DEPRECIATION_VW
AS
SELECT depreciation.type_cd, 
    pp_type.pp_type_desc AS type_desc, depreciation.deprec_cd, 
    depreciation.year, depreciation.description, 
    depreciation.prop_type_cd, property_type.prop_type_desc, 
    condition.condition_desc, ISNULL(depreciation.dor_schedule, '') as dor_schedule
FROM depreciation INNER JOIN
    property_type ON 
    depreciation.prop_type_cd = property_type.prop_type_cd LEFT OUTER
     JOIN
    condition ON 
    depreciation.type_cd = condition.condition_cd LEFT OUTER JOIN
    pp_type ON depreciation.type_cd = pp_type.pp_type_cd

GO

