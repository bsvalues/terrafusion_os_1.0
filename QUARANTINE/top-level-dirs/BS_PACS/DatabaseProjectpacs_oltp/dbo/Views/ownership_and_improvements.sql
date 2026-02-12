-- maybe for crystal report ownership and improvements
create view ownership_and_improvements
as 
SELECT DISTINCT pv.prop_id as 'lrsn'
, p.geo_id as 'parcel_id',-- pv.property_use_cd as property_use_cd,
pv.cycle as 'rt',
 pv.hood_cd as 'NB',
pv.legal_acreage as 'legal_acr',
ac.file_as_name as 'owner1',
si.situs_street as 'prop_street',
--si.situs_city as 'Prop City',
idt.imprv_det_meth_cd as 'imp_type',
--idt.imprv_det_type_cd as 'Imprv Det Type',
idt1.imprv_det_typ_desc as 'const_description',
idt.yr_built as 'eff_year_built',
pp.class_cd as 'grade'

--idt.permanent_crop_acres as 'Crop Acres',
--idt.permanent_crop_irrigation_acres as 'Irrigated Acres',
--idt.imprv_det_val_source as 'Current Year Flat/Adjusted Value',
--idt.imprv_det_flat_val as 'Current Year Flat Value', 
--idt.imprv_det_calc_val as 'Current Year Imprv Det Calc Val',
--Prior_Year_Flat_or_Adjusted_Value,
--Prior_Year_Flat_Value,
--Prior_Year_Imprv_Det_Calc_Val
FROM property_val pv WITH (nolock)
INNER JOIN prop_supp_assoc psa WITH (nolock) ON
	pv.prop_id = psa.prop_id
	AND pv.prop_val_yr = psa.owner_tax_yr
	AND pv.sup_num = psa.sup_num
INNER JOIN property p WITH (nolock) ON

	pv.prop_id = p.prop_id

LEFT JOIN property_profile pp

ON pv.prop_id = pp.prop_id 

AND pp.prop_val_yr = (select appr_yr 
from pacs_system) 

INNER JOIN owner o WITH (nolock) ON
	pv.prop_id = o.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN account ac WITH (nolock) ON
	o.owner_id = ac.acct_id
INNER JOIN imprv i WITH (nolock) ON
	pv.prop_id = i.prop_id
	AND pv.prop_val_yr = i.prop_val_yr
	AND pv.sup_num = i.sup_num
	AND i.sale_id = 0
	AND i.imprv_type_cd = 'PERMC'
INNER JOIN imprv_detail idt WITH (nolock) ON
	pv.prop_id = idt.prop_id
	AND pv.prop_val_yr = idt.prop_val_yr
	AND pv.sup_num = idt.sup_num
	AND idt.sale_id = 0
	AND i.imprv_id = idt.imprv_id
LEFT OUTER JOIN imprv_det_type idt1 WITH (nolock) ON
	idt.imprv_det_type_cd = idt1.imprv_det_type_cd
LEFT OUTER JOIN situs si WITH (nolock) ON
	pv.prop_id = si.prop_id
	AND isnull(si.primary_situs, 'N') = 'Y'
LEFT OUTER JOIN
	(select distinct pv1.prop_id, pv1.prop_val_yr, pv1.sup_num,
	idt1.imprv_id, idt1.imprv_det_id, 
	idt1.imprv_det_val_source as Prior_Year_Flat_or_Adjusted_Value,
	idt1.imprv_det_flat_val as Prior_Year_Flat_Value, 
	idt1.imprv_det_calc_val as Prior_Year_Imprv_Det_Calc_Val
	from property_val pv1 with (nolock) 
	inner join prop_supp_assoc psa1 with (nolock) on
		pv1.prop_id = psa1.prop_id
	and pv1.prop_val_yr = psa1.owner_tax_yr
	and pv1.sup_num = psa1.sup_num
	inner join imprv_detail idt1 with (nolock) on
		pv1.prop_id = idt1.prop_id
		and pv1.prop_val_yr = idt1.prop_val_yr
		and pv1.sup_num = idt1.sup_num
		and idt1.sale_id = 0
	
	where pv1.prop_val_yr = (select tax_yr 
from pacs_system) ) as x----you can change the year
	on pv.prop_id = x.prop_id
	and i.imprv_id = x.imprv_id
	and idt.imprv_det_id = x.imprv_det_id
WHERE pv.prop_val_yr = (select appr_yr 
from pacs_system) ----you can change the year
AND pv.prop_inactive_dt is null
--and pv.property_use_cd='83'
--AND pv.cycle = 1
--AND ac.file_as_name like '%EARLWOOD CORPORATION%'---you can change the name between the %'s
--ORDER BY p.geo_id

GO

