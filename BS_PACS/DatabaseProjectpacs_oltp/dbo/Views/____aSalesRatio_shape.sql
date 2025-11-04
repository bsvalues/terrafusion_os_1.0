create view ____aSalesRatio_shape as 
select *
from __aaSales_ratio asr
LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,prop_id as pid,shape
  --[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords on coords.PID=asr.prop_id

GO

