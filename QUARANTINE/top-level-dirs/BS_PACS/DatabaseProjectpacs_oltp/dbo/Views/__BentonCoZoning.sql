create view __BentonCoZoning as

SELECT distinct
      pv.[Prop_ID]
      ,Concat (bz.[Zoning]			
	  ,kz.[Zoning]			
	  ,pz.[Class]		
	  ,rz.[Primary_Zo]		
      ,wrz.[Zoning_Cla]	) as zoning	
	 
 
 
  FROM property_val pv
 left join 
  
  [Benton_spatial_data].[dbo].[PARCEL_BNTONCITY_ZONING] bz on pv.prop_id=bz.prop_id 
 left join 

  [Benton_spatial_data].[dbo].[PARCEL_RICHLANDZONING] rz on pv.prop_id=rz.prop_id
  left join 
  [Benton_spatial_data].[dbo].[PARCEL_KENNEWICKZONING] kz on pv.prop_id=kz.prop_id
   left join 
  [Benton_spatial_data].[dbo].[PARCEL_PROSSERZONING] pz on pv.prop_id=pz.prop_id
   left join 
 [Benton_spatial_data].[dbo].[PARCEL_WESTRICHLANDZONING] wrz on pv.prop_id=wrz.prop_id




  where pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
  and pv.prop_inactive_dt is null
  and pv.sup_num=0

GO

