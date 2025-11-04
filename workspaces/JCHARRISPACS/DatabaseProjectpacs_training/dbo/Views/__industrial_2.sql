





create view  [dbo].[__industrial_2] as


SELECT  child_prop_id,pv.prop_id as  ParcelID,
		parent_prop_id
      ,appraised_val,market,pv.business_close_dt,pv.business_start_dt
      ,pa.prop_val_yr
      ,pa.sup_num
      ,lOrder
      ,link_type_cd
      ,link_sub_type_cd
	  ,legal_desc


	  ,xcoord
	  ,ycoord
	

  FROM [pacs_oltp].[dbo].[property_val] pv
  inner join 
  property_assoc pa
  on 
  pv.prop_id=pa.parent_prop_id and pv.prop_val_yr=pa.prop_val_yr
 
left join

(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as sp   on sp.prop_id=pa.child_prop_id
		  where 
  pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
 and legal_desc like '%****industrial account****%'

 -- and pv.cycle=-1
  --and link_type_cd='rel'

GO

