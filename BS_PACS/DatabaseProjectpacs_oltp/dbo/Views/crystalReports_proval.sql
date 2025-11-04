create view crystalReports_proval as
SELECT  [ID]
      ,[DisplayOrder]
      ,[DisplayName]
      ,[Status]
      ,[Path]
      ,[ReportName]
      ,[PrintCurrentParcel]
      ,[DefaultDSN]
  FROM [cnv_src_benton_11_2_2016].[dbo].[CrystalReports]

GO

