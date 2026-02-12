create view proval_LBAggregateSize_land as
SELECT [Id]
      ,[LandHeaderId]
      ,[BegEffDate]
      ,[EffStatus]
      ,[TranId]
      ,[LastUpdate]
      ,[AggregateType]
      ,[AggregateSize]
      ,[PostingSource]
  FROM [cnv_src_benton_2_14_2017].[dbo].[LBAggregateSize]

GO

