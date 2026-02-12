create view __aSenior_Exmption_over_1acre as
select distinct 
pv.prop_id, 
p.geo_id, 
pv.cycle,
dbo.fn_getexemptions(pv.prop_id, pv.prop_val_yr, pv.sup_num) as exemptions,
land.size_acres,
xcoord, 
ycoord

from property_val pv with (nolock)
inner join prop_supp_assoc psa with (nolock) on
pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num
inner join property p with (nolock) on
pv.prop_id = p.prop_id 
inner join land_detail ld with (nolock) on
pv.prop_id = ld.prop_id
and pv.prop_val_yr = ld.prop_val_yr
and pv.sup_num = ld.sup_num
and ld.sale_id = 0



left join 
	(SELECT prop_id, SUM(size_acres) as size_acres, prop_val_yr, state_cd
			FROM [pacs_oltp].[dbo].land_detail 
				GROUP BY prop_id,  prop_val_yr,state_cd) as land on land.prop_id=pv.prop_id
LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	--[CENTROID_X] as XCoord
     -- ,[CENTROID_Y] as YCoord
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) as coords
			ON land.prop_id = coords.Prop_ID AND coords.order_id = 1



where pv.prop_val_yr = (select appr_yr from pacs_system)---you can change the year as needed
and pv.prop_inactive_dt is null
and pv.prop_id in (select prop_id



from property_exemption
where exmpt_tax_yr = (select appr_yr from pacs_system)---change year to match the above year
and exmpt_type_cd in ('snr/dsbl'))
and land.size_acres > 1

GO

