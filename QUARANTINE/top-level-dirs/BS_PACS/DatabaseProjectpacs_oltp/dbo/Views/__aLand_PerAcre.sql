create view __aLand_PerAcre as
SELECT  [ParcelID]
      ,[Legal_Acreage]
      ,[Sum_Segment_Market]
	   ,case when Sum_Segment_Market > 0 and [Legal_Acreage]>0 
	   then CAST(ROUND(([Sum_Segment_Market]/[Legal_Acreage]), 2) as decimal(10, 2)) else 0 end as Value_Per_Acre
 
  FROM [pacs_oltp].[dbo].[__Land_Segments]ls

GO

