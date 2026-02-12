create view __zoning as
SELECT distinct
      pv.[Prop_ID]
      ,bz.[Zoning]			as BentonCity_Zoning
	  ,kz.[Zoning]			AS Kennewick_Zoning
	  ,pz.[Class]			as Prosser_Zoning
	  ,rz.[Primary_Zo]		as Richland_Zoning
      ,wrz.[Zoning_Cla]		as WestRichland_Zoning
 
 
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

