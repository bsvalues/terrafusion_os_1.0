

create view [dbo].[__sales_x_y] as 


SELECT pv.prop_id, 
p.geo_id as 'Geo_ID',
pv.cycle as 'Cycle',
pv.hood_cd as 'NBHD',
pp.living_area, 
idt.imprv_det_area as 'BSMT_SQFT',
i.imprv_desc as 'ImprvDesc', 
pp.class_cd as 'Class', 
pp.imprv_det_sub_class_cd as 'SubClass',
pp.yr_blt as 'YearBlt',
pp.eff_yr_blt as 'EffYrBlt',
pp.condition_cd as 'Condition',
coo.deed_type_cd as 'DeedType',
s.sl_ratio_type_cd as 'RatioCode', 
coo.excise_number as 'Excise#',
convert(varchar(20), s.sl_dt, 101) as 'SaleDate', 
s.sl_price as 'SalePrice', 
s.adjusted_sl_price as 'AdjSalePrice',
pv.market,
case when pv.market <> 0 then CAST(ROUND((pv.market / s.sl_price), 2) 
	as decimal(10, 2)) else 0 end as Current_Ratio,
si.situs_num, si.situs_street_prefx, si.situs_street, si.situs_street_sufix
,shape
FROM property_val pv WITH (nolock) 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id 
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id
INNER JOIN property_profile pp WITH (nolock) ON
	pv.prop_id = pp.prop_id 
	AND pv.prop_val_yr = pp.prop_val_yr
INNER JOIN chg_of_owner_prop_assoc copa WITH (nolock) ON
	pv.prop_id = copa.prop_id 
INNER JOIN chg_of_owner coo WITH (nolock) ON
	copa.chg_of_owner_id = coo.chg_of_owner_id
INNER JOIN sale s WITH (nolock) ON
	copa.chg_of_owner_id = s.chg_of_owner_id
LEFT OUTER JOIN imprv i WITH (nolock) ON
	pv.prop_id = i.prop_id
	AND pv.prop_val_yr = i.prop_val_yr
	AND pv.sup_num = i.sup_num
	AND i.sale_id = 0 
LEFT OUTER JOIN imprv_detail idt WITH (nolock) ON
	pv.prop_id = idt.prop_id
	AND pv.prop_val_yr = idt.prop_val_yr
	AND pv.sup_num = idt.sup_num
	AND idt.sale_id = 0 
	AND idt.imprv_det_type_cd = 'BSMT'
LEFT OUTER JOIN situs si WITH (nolock) ON	
	pv.prop_id = si.prop_id
	AND isnull(si.primary_situs, 'N') = 'Y'
inner join 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],
	--[Geometry].STCentroid().STX as XCoord,
	--[Geometry].STCentroid().STY as YCoord ,
	shape,
	  [Shape].STCentroid().STX as XCoord,
	[Shape].STCentroid().STY as YCoord 
	--[CENTROID_X] as XCoord
     -- ,[CENTROID_Y] as YCoord
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON pv.prop_id = coords.Prop_ID AND coords.order_id = 1
				WHERE pv.prop_val_yr = (select appr_yr  from pacs_system)  
AND pv.prop_inactive_dt is null 
AND s.sl_price > 0
and s.sl_ratio_type_cd = 00

AND coo.deed_dt >=  '01/01/2016'

GO

