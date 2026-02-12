



create view [dbo].[perm_crop_type_acre]
as 
SELECT id.prop_id,
ROW_NUMBER() over (partition by id.prop_id,id.imprv_det_type_cd,permanent_crop_acres  ORDER BY id.imprv_det_type_cd desc)AS imprvment_id,ID.imprv_det_meth_cd, id.imprv_det_type_cd,

Sum(case when   id.imprv_det_type_cd IS not null	then	( permanent_crop_acres  )	else	null	end) as	imprv_pc_acres 


 
 FROM            imprv_detail  id
 
 
 

 
  INNER JOIN
                         imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id
						 left join 
						 property_val pv on pv.prop_id=id.prop_id and pv.prop_val_yr=id.prop_val_yr and pv.sup_num=id.sup_num 


			

where 
id.prop_val_yr=(select appr_yr from pacs_system)
and id.sale_id=0
and 
imprv.imprv_type_cd='permc'
and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
--and id.prop_id=29245
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
--and permanent_crop_acres is not null 
group by 
id.prop_id,id.imprv_det_id,id.imprv_det_type_cd,permanent_crop_acres,ID.imprv_det_meth_cd

GO

