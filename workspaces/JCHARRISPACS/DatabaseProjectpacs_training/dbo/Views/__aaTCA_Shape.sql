create view __aaTCA_Shape as
SELECT tca.[prop_id]
      ,[year]
      ,[rollback_id]
      ,[taxable_val]
      ,[KENNEWICK SD 17]
      ,[FINLEY SD 53]
      ,[FIRE DISTRICT #5]
      ,[CITY OF BENTON CITY]
      ,[MID-COLUMBIA LIBRARY]
      ,[COUNTY BENTON]
      ,[CITY OF KENNEWICK]
      ,[FIRE DISTRICT #2]
      ,[FIRE DISTRICT #4 EMS]
      ,[PROSSER SD 116]
      ,[RICHLAND SD 400]
      ,[CITY OF RICHLAND]
      ,[COUNTY BENTON ROAD]
      ,[STATE SCHOOL]
      ,[FIRE DISTRICT #6]
      ,[CITY OF WEST RICHLAND]
      ,[PROSSER HOSPITAL]
      ,[KENNEWICK HOSPITAL]
      ,[PATERSON SD 50]
      ,[BENTON CITY LIBRARY CAPITAL FACILITY]
      ,[WEST BENTON REGIONAL FIRE AUTHORITY]
      ,[PORT OF BENTON]
      ,[PORT OF KENNEWICK]
      ,[FIRE DISTRICT #4]
      ,[CITY OF PROSSER]
      ,[GRANDVIEW SD 200]
      ,[KIONA BENTON SD 52]
      ,[FIRE DISTRICT #1]
      ,[FIRE DISTRICT #2 EMS]
	  ,coords.XCoord
	  ,coords.YCoord
	  ,Shape

  FROM [pacs_oltp].[dbo].[__aTax_District_Cert_yr] tca
  left join 
  	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord , Shape
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]
	) as coords ON tca.prop_id = coords.Prop_ID AND coords.order_id = 1

GO

