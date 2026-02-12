
Create view __ASPerm_Crop as
SELECT id.prop_id																						as 'prop_id', 
p.geo_id																								as 'Geo_ID', 
pv.prop_val_yr,
ROW_NUMBER() over (partition by id.prop_id ORDER BY id.imprv_det_type_cd desc)AS order_id, 
id.imprv_det_type_cd																					as 'imprv_type_cd',
id.yr_built																								as 'Year_Planted',
ID.imprv_det_meth_cd																					as 'imprv_det_meth_cd', 
Sum(case when   id.imprv_det_type_cd IS not null	
	then	( permanent_crop_acres  )	else	null	end)											as	'imprv_pc_acres',
	pv.cycle																							as 'Cycle',
	pv.hood_cd																							as 'Neighborhood',
	imprv.imprv_state_cd																				as 'State_Code',
	pv.legal_acreage																					as 'Total_Legal_Acres',
	ac.file_as_name																						as 'Owner',
	id.permanent_crop_irrigation_acres																	as 'Irrigated_Acres',
	id.imprv_det_val_source																				as 'Flat/Adjusted Value',
	id.imprv_det_flat_val																				as 'Current_Flat', 
	id.imprv_det_calc_val																				as 'Current_Imprv_Det_Val'



 FROM           pacs_oltp.dbo.imprv_detail  id 
  INNER JOIN
                         pacs_oltp.dbo.imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
						 left join 
						 pacs_oltp.dbo.property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num 
						 INNER JOIN pacs_oltp.dbo.owner o  ON	pv.prop_id = o.prop_id
						 INNER JOIN pacs_oltp.dbo.property p WITH (nolock) ON
	pv.prop_id = p.prop_id
	AND pv.prop_val_yr = o.owner_tax_yr
	AND pv.sup_num = o.sup_num
INNER JOIN pacs_oltp.dbo.account ac WITH (nolock) ON
	o.owner_id = ac.acct_id




			

where 
id.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
and id.sale_id=0
and 
imprv.imprv_type_cd='permc'
and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
--and id.prop_id=26521
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
and permanent_crop_acres is not null 
group by 
id.prop_id,id.imprv_det_id,id.imprv_det_type_cd,permanent_crop_acres,ID.imprv_det_meth_cd,p.geo_id  ,pv.cycle , pv.hood_cd , imprv.imprv_state_cd ,pv.legal_acreage ,ac.file_as_name,
id.yr_built ,pv.prop_val_yr,id.permanent_crop_acres ,id.permanent_crop_irrigation_acres,id.imprv_det_val_source,id.imprv_det_flat_val, id.imprv_det_calc_val

GO

