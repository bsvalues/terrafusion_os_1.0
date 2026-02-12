create view _proval_ms_resaults as
SELECT  [lrsn] as prop_id
      ,[EffDateLong]
      ,[LastUpdate]
      ,[PricedDate]
      ,[PricedSeq]
      ,[Status]
      ,[UserID]
      ,[Extension]
      ,[SequenceNumber0]
      ,[ImpID]
      ,[SequenceNumber1]
      ,[PVFloorNumber]
      ,[PVUseID]
      ,[PVUseCode]
      ,[SequenceNumber2]
      ,[MSReportCode]
      ,[MSDescription]
      ,[MSUnits]
      ,[MSCost]
      ,[MSTotal]
      ,[MSPercent]
      ,[MSTypeCode]
      ,[MSTypeID]
      ,[MSIntOther]
      ,[MSStringOther]
  FROM [cnv_src_benton_2_14_2017].[dbo].[MSResults]
  where Status='a'

GO

