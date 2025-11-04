








CREATE VIEW dbo.DEPRECIATION_DISTINCT_DEPREC_CD_VW
AS
SELECT DISTINCT deprec_cd, year, description, prop_type_cd
FROM depreciation
GROUP BY deprec_cd, year, description, prop_type_cd

GO

