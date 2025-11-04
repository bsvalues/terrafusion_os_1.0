create view  __map_properties_coords as 

SELECT 	psa.prop_id, psa.owner_tax_yr as prop_val_yr, 
psa.sup_num,
XCoord,
Ycoord
FROM prop_supp_assoc psa 
join 
property p on p.prop_id = psa.prop_id 
join pacs_system ps on psa.owner_tax_yr = ps.appr_yr
LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]
	) as coords ON psa.prop_id = coords.Prop_ID AND coords.order_id = 1


WHERE p.prop_type_cd in ('R', 'MH')

GO

