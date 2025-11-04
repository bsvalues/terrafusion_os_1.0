



create view  __industrial_1 as


SELECT  child_prop_id,pv.prop_id as  ParcelID,
		parent_prop_id
      ,appraised_val,market,pv.business_close_dt,pv.business_start_dt
      ,pa.prop_val_yr
      ,pa.sup_num
      ,lOrder
      ,link_type_cd
      ,link_sub_type_cd
	  ,legal_desc


	  ,x_coord
	  ,y_coord
	

  FROM [pacs_oltp].[dbo].[property_val] pv
  inner join 
  property_assoc pa
  on 
  pv.prop_id=pa.parent_prop_id and pv.prop_val_yr=pa.prop_val_yr
  left join

(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [Prop_ID]DESC) 
AS order_id,
[Prop_ID]

,shape
--,[XCoord]
--,[YCoord]
,[shape].STCentroid().STX as X_Coord
,[shape].STCentroid().STY as Y_Coord 
--,[Shape_Area]
--,[Shape_Leng]

    

FROM 
[Benton_spatial_data].[dbo].[parcel]
where Prop_ID> 0 


) sp 

  on 
sp.prop_id=pa.child_prop_id


  where 
  pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
  and legal_desc like '%****industrial account****%'

 -- and pv.cycle=-1
  --and link_type_cd='rel'

GO

