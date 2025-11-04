Create view Parcel_P as
SELECT [Prop_ID],      
      [Parcel_ID]
      ,[CENTROID_X]
      ,[CENTROID_Y]
      ,[Shape_Leng]
      ,[OBJECTID]
  FROM [pacs_oltp].[dbo].[_PARCEL_]

GO

