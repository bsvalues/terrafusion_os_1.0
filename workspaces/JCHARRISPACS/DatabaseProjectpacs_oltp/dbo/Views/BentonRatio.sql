
create view BentonRatio as

SELECT  p.geo_id																					 as 'Parcel #',
pv.prop_id																							 as 'ParcelID', 
pv.hood_cd																							 as 'Nbhd',
rtrim(replace(pv.cycle, char(13) + char(10), ''))													 as 'Reval',
si.situs_display																					 as 'Street', 
pp.yr_blt as 'Year Built',
pp.living_area as 'SqFt', 
idt.imprv_det_area as 'Bsmt',
i.imprv_desc as 'Style', 
pp.class_cd + pp.imprv_det_sub_class_cd as 'Qlty' ,
pp.condition_cd as 'Cond', 

--pp.eff_yr_blt ,

coo.deed_type_cd  as 'Deed Type',
--s.sl_ratio_type_cd , 
coo.excise_number as 'Excies Affidavit',
convert(varchar(20), s.sl_dt, 101) as 'Sale Date', 
s.sl_price as 'Sale Price', 
--s.adjusted_sl_price as 'AdjSalePrice',
pv.market as 'AP Mrkt',
case when pv.market <> 0 then CAST(ROUND((pv.market / s.sl_price), 2) 
	as decimal(10, 2)) else 0 end as 'Ratio',
--si.situs_num, si.situs_street_prefx, si.situs_street, si.situs_street_sufix
CENTROID_X,CENTROID_Y,[Shape],[Shape_Leng]

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
(sELECT [OBJECTID_1]
      ,[Shape]
      ,[Parcel_ID]
      ,[Prop_ID]
      ,[CENTROID_X]
      ,[CENTROID_Y]
      ,[Shape_Leng]
      ,[OBJECTID]
  FROM [pacs_oltp].[dbo].[_PARCEL_]) sp on  sp.prop_id=pv.prop_id


WHERE pv.prop_val_yr = (select appr_yr from pacs_system)
AND pv.prop_inactive_dt is null 
AND s.sl_price > 0
and s.sl_ratio_type_cd = 00

AND coo.deed_dt >=  '01/01/2016'

GO

