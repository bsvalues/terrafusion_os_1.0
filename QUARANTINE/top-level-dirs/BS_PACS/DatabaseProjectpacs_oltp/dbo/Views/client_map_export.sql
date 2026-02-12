
create view client_map_export as 
SELECT  psa.prop_id, psa.owner_tax_yr as prop_val_yr, psa.sup_num, ccp.mobile_assignment_group_id ,
xcoord, ycoord,shape
FROM prop_supp_assoc psa  (nolock)
join property p (nolock)
on p.prop_id = psa.prop_id 
join pacs_system ps (nolock)
on psa.owner_tax_yr = ps.appr_yr 
join property_val pv (nolock)
on p.prop_id = pv.prop_id 
and psa.owner_tax_yr = pv.prop_val_yr
join ccProperty ccp (nolock)
on ccp.prop_id = pv.prop_id and
      ccp.prop_val_yr = pv.prop_val_yr and
      ccp.sup_num = pv.sup_num
LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	shape,  [Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 	
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON p.prop_id = coords.Prop_ID

WHERE p.prop_type_cd in ('R', 'MH') 
and (pv.prop_inactive_dt is null or udi_parent = 'T')
and udi_parent_prop_id is null

GO

