

create view [dbo].[__ManuHome] as 

--create view __ManuHome as 
SELECT distinct
  pv.prop_val_yr as 'Year',
pv.prop_id as 'ParcelID', 

p.geo_id as 'Geo_ID', 
pv.hood_cd as 'neighborhood',
pv.mbl_hm_park as 'MH_Park_Code',
mh.abs_subdv_desc as 'MH_Park_Desc',
pv.mbl_hm_space 'MH_Park_Space',
pv.cycle as 'Reval',
pv.property_use_cd as 'Primary_Use_cd',
pv.legal_acreage as 'Legal_Acres',
convert(varchar (20), Deed_Dt, 111) as 'DeedDate', 
convert(varchar (20), Sale_Dt, 111) as 'SaleDate',
Sale_Price as 'OriginalSalePrice',
Adjusted_Sale as 'Adj_Sale_Price',
idt.imprv_det_type_cd as 'Imprv_Det_Type',
i.imprv_desc,
i.num_imprv,
idt.actual_age as age,
idt.yr_built as yearbuilt,
idt.calc_area as 'Totalarea',
case when idt.override_area = 'T' then 'Checked' 
	else 'Unchecked' end as 'Override', 
idt.sketch_area as 'Sketch_Area',
idt.imprv_det_desc as imprv_det_desc,
idt.imprv_det_class_cd as 'Class',
idt.condition_cd as 'Condition',
ac.file_as_name as 'Owner',
s.situs_num 'Situs_Num', 
s.situs_street_prefx 'Situs_Prefix', 
s.situs_street 'Situs_Street', 
s.situs_street_sufix 'Situs_Suffix', 
s.situs_city 'Situs_City',
idt.imprv_det_adj_val 'Imprv_Det_Adj_Value', 
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
i.imprv_mass_adj_factor,
i.imprv_type_cd as Primaryimprovment,
pv.market as 'TotalMarket',
pv.legal_desc as 'LegalDesc',
pa.link_type_cd,
p.prop_type_cd as property_type_cd,
pv.land_hstd_val + pv.land_non_hstd_val																as LandVal,
pv.imprv_hstd_val + pv.imprv_non_hstd_val						as ImprvVal,
pv2.imprv_hstd_val + pv2.imprv_non_hstd_val															AS ImpVal_before, 
pv2.land_hstd_val + pv2.land_non_hstd_val																			AS LandVal_before,
CAST(ISNULL(pv.imprv_hstd_val + pv.imprv_non_hstd_val, 0) - ISNULL(pv2.imprv_hstd_val + pv2.imprv_non_hstd_val, 0)  
AS numeric(18, 4)) / (CASE WHEN  pv2.imprv_hstd_val + pv2.imprv_non_hstd_val IS NULL THEN 1 
WHEN pv2.imprv_hstd_val + pv2.imprv_non_hstd_val = 0  
THEN 1 ELSE pv2.imprv_hstd_val + pv2.imprv_non_hstd_val END) * 100/100												as imprv_percent_change,
CAST(ISNULL(pv.land_hstd_val + pv.land_non_hstd_val, 0) - ISNULL(pv2.land_hstd_val + pv2.land_non_hstd_val, 0) 
AS numeric(18, 4))/ (CASE WHEN  pv2.land_hstd_val + pv2.land_non_hstd_val IS NULL THEN 1 
WHEN pv2.land_hstd_val + pv2.land_non_hstd_val = 0  
THEN 1 ELSE pv2.land_hstd_val + pv2.land_non_hstd_val END) * 100/100												as land_percent_change,

XCoord,
ycoord
FROM property_val pv WITH (nolock) 
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
     pv.prop_id = psa.prop_id
     AND pv.prop_val_yr = psa.owner_tax_yr
     AND pv.sup_num = psa.sup_num
INNER JOIN	property_val pv2
on pv.prop_id=pv2.prop_id
AND pv2.prop_val_yr = (select appr_yr -1
from pacs_system)

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
[Geometry].STCentroid().STX as XCoord,
[Geometry].STCentroid().STY as YCoord ,

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

