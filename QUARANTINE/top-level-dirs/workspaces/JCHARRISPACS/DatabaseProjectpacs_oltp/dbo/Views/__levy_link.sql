create view __levy_link as
SELECT  [tax_district_id]
      ,[year]
      ,[levy_cd]
      ,[levy_cd_linked]
  FROM [web_internet_benton].[dbo].[levy_link]

GO

