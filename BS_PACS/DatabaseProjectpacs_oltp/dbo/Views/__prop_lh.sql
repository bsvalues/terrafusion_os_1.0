create view __prop_lh as

select pv.prop_id, 
pl.child_prop_id
,pv.sub_type
,p.alt_dba_name,p.dba_name,p.geo_id
,s.situs_display,s.situs_num,s.situs_street_prefx,s.situs_street,s.situs_street_sufix,s.situs_city,s.situs_state, s.situs_zip
,pv.abs_subdv_cd
,pv.cycle
,pv.hood_cd
,pv.appr_method
,pv.legal_desc
--,pv.mktappr_land_hstd_val
,XCoord,YCoord
from property_val pv
left join 
(SELECT [parent_prop_id]  ,[child_prop_id],[prop_val_yr] ,[sup_num],[lOrder],[link_type_cd] ,[link_sub_type_cd]	  
  FROM [pacs_oltp].[dbo].[property_assoc] 
	where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)and [child_prop_id] is not null
	--and link_type_cd='rel'
	) pl on pl.parent_prop_id=pv.prop_id and pl.prop_val_yr=pv.prop_val_yr
  LEFT JOIN 
	property p
		ON pv.prop_id = p.prop_id	
		LEFT Join 
	[pacs_oltp].[dbo].situs s
		on pv.prop_id=s.prop_id
		left join
	[pacs_oltp].[dbo].owner o
		on  pv.prop_id = o.prop_id  and pv.prop_val_yr = o.owner_tax_yr and pv.sup_num = o.sup_num
inner  join
	[pacs_oltp].[dbo].account a
		on o.owner_id=a.acct_id
LEFT JOIN 
--(SELECT  [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,[Shape].STCentroid().STY as YCoord 

  --FROM [Benton_spatial_data].[dbo].[POINTS])coords ON coords.prop_id= pl.parent_prop_id


	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
[Shape].STCentroid().STX as XCoord,
[Shape].STCentroid().STY as YCoord 
--	[CENTROID_X] as XCoord
    --,[CENTROID_Y] as YCoord
	FROM [Benton_spatial_data].[dbo].[parcel]) as coords
		--ON pl.parent_prop_id = coords.Prop_ID AND coords.order_id = 1
		ON pv.prop_id = coords.Prop_ID AND coords.order_id = 1

			WHERE pv.prop_val_yr = (select appr_yr  from [pacs_oltp].[dbo].pacs_system) 
			and pv.prop_inactive_dt is null	
	and s.primary_situs= 'Y'
		--and prop_type_cd='r'
			--and pv.sup_num=0
  --where pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system) and pv.prop_inactive_dt is null and pl.sup_num=0
--and pl.child_prop_id is not null
  --and pv.sub_type like'%lh%'
 -- and pv.land_hstd_val=0 and pv.income_land_non_hstd_val=0
 -- and XCoord is not null
and pv.sub_type ='lh'
and pv.sub_type not like '%p%'
and pv.sub_type not like '%m%'
--and legal_desc like '%lease%'
--and p.geo_id like'4%' or 
--p.geo_id like'8%' 
and pl.child_prop_id is not null

GO

