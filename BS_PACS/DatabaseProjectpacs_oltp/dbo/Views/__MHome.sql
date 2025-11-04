

create view [dbo].[__MHome] as 
SELECT distinct
  pv.prop_val_yr as 'Year',
pv.prop_id as 'ParcelID', 

p.geo_id as 'Geo ID', 
pv.hood_cd as 'NBHD',
pv.mbl_hm_park as 'MH Park Code',
mh.abs_subdv_desc as 'MH Park Desc',
pv.mbl_hm_space 'MH Park Space',
pv.cycle as 'Cycle',
pv.property_use_cd as 'Primary Use',
pv.legal_acreage as 'Legal Acres',
convert(varchar (20), Deed_Dt, 111) as 'Deed Date', 
convert(varchar (20), Sale_Dt, 111) as 'Sale Date',
Sale_Price as 'Sale Price',
Adjusted_Sale as 'Adj Sale Price',
idt.imprv_det_type_cd as 'Imprv Det Type',
i.imprv_desc,
i.num_imprv,
idt.calc_area as 'Area SqFt',
case when idt.override_area = 'T' then 'Checked' 
	else 'Unchecked' end as 'Override', 
idt.sketch_area as 'Sketch Area',
idt.imprv_det_desc as imprv_det_desc,
idt.imprv_det_class_cd as 'Class',
idt.condition_cd as 'Condition',
ac.file_as_name as 'Owner',
s.situs_num 'Situs Num', 
s.situs_street_prefx 'Situs Prefix', 
s.situs_street 'Situs Street', 
s.situs_street_sufix 'Situs Suffix', 
s.situs_city 'Situs City',
idt.imprv_det_adj_val 'Imprv Det Adj Value', 
rtrim(idt.dep_pct) as dep_pct,
rtrim(idt.add_factor) as add_factor,
rtrim(idt.depreciation_yr) as depreciation_yr,
rtrim(idt.use_up_for_pct_base) as se_up_for_pct_base,
rtrim(idt.depreciated_replacement_cost_new) as RCN,
idt.economic_pct,
idt.functional_pct,
idt.imprv_det_adj_amt,
idt.imprv_det_adj_factor,
idt.imprv_det_adj_val,
pv.market as 'Total Market',
pv.legal_desc as 'Legal Desc',
pa.link_type_cd,


XCoord,
ycoord
FROM property_val pv WITH (nolock) 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
     pv.prop_id = psa.prop_id
     AND pv.prop_val_yr = psa.owner_tax_yr
     AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON
	pv.prop_id = p.prop_id
	--AND p.geo_id like '4%'---you can change as needed
INNER JOIN owner o WITH (nolock) ON
	pv.prop_id = o.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN account ac WITH (nolock) ON 
	o.owner_id = ac.acct_id
INNER JOIN imprv_detail idt WITH (nolock) ON
	pv.prop_id = idt.prop_id
	AND pv.prop_val_yr = idt.prop_val_yr 
	AND pv.sup_num = idt.sup_num
	AND idt.sale_id = 0
	AND idt.imprv_det_type_cd = 'MHOME'---you can change as needed
inner join imprv i
on pv.prop_id=i.prop_id
and pv.prop_val_yr=i.prop_val_yr
and pv.sup_num=i.sup_num
and i.sale_id=0
and i.imprv_type_cd like '%MH%'

LEFT OUTER JOIN abs_subdv mh WITH (nolock) ON	
	pv.mbl_hm_park = mh.abs_subdv_cd
	AND pv.prop_val_yr = mh.abs_subdv_yr

LEFT OUTER JOIN
    (select copa.prop_id, coo.deed_dt as Deed_Dt, 
    sl.sl_dt as Sale_Dt, sl.sl_price as Sale_Price,
	sl.adjusted_sl_price as Adjusted_Sale
    from chg_of_owner_prop_assoc copa with (nolock)
    inner join chg_of_owner coo with (nolock) on
        copa.chg_of_owner_id = coo.chg_of_owner_id
	inner join sale sl with (nolock) on
		copa.chg_of_owner_id = sl.chg_of_owner_id
		and sl.sl_price > 0
    and copa.seq_num = 0) as sb
    on pv.prop_id = sb.prop_id
LEFT OUTER JOIN situs s WITH (nolock) ON
	pv.prop_id = s.prop_id
	AND isnull(s.primary_situs, 'N') = 'Y'

	left join 
	(SELECT  child_prop_id,pv.prop_id,
		parent_prop_id
      ,appraised_val,market,pv.business_close_dt,pv.business_start_dt
     
      ,pa.sup_num

	  ,pa.prop_val_yr
      ,lOrder
      ,link_type_cd
      ,link_sub_type_cd


	
  FROM [pacs_oltp].[dbo].[property_val] pv
  inner join 
  [pacs_oltp].[dbo].property_assoc pa
  on 
  pv.prop_id=pa.parent_prop_id and pv.prop_val_yr=pa.prop_val_yr
 
   
  where  pv.prop_val_yr=(select appr_yr 
from pacs_system)) as pa
on pa.prop_id=pv.prop_id

  LEFT JOIN 

(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,
[Prop_ID],
--Geometry,
[shape].STCentroid().STX as XCoord,
[shape].STCentroid().STY as YCoord ,

      [CENTROID_X] as x
      ,[CENTROID_Y] as y

FROM 
--[Benton_spatial_data].[dbo].[spatial_coords]
[Benton_spatial_data].[dbo].[parcel]
) as coords
 
ON 

pv.prop_id = coords.Prop_ID AND coords.order_id = 1


WHERE pv.prop_val_yr = (select appr_yr from pacs_oltp.dbo.pacs_system)---you can change as needed
--AND pv.cycle = 5---you can change as needed
AND pv.prop_inactive_dt is null
--and XCoord is not null

GO

