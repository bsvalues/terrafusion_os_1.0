
create view [dbo].[pc_class_cd_group] as

SELECT id.[prop_id],
--NTILE(5) over (partition by id.actual_age ORDER BY id.imprv_det_type_cd desc)AS age_group,
--NTILE(5) over (partition by permanent_crop_acres ORDER BY id.imprv_det_type_cd desc)AS acres_group,
NTILE(2) over (partition by imprv_det_class_cd ORDER BY id.imprv_det_type_cd desc)AS class_cd_group,
actual_age,id.imprv_det_type_cd,permanent_crop_acres,[imprv_det_class_cd],[imprv_det_meth_cd],[permanent_crop_density]



  FROM [dbo].[imprv_detail] id
   left join 
   imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id


						 
  where id.prop_val_yr=2019
  and id.sale_id=0
  and imprv.imprv_type_cd='permc'
  and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
and id.imprv_det_type_cd not like 'I0%'
-- and imprv_det_meth_cd like 'V1'
  --and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
and permanent_crop_acres is not null

group by id.[prop_id],id.[prop_val_yr]  ,id.[imprv_id]   ,[imprv_det_id]    ,id.[sup_num]    ,id.[sale_id]     ,[imprv_det_class_cd]     ,[imprv_det_meth_cd]     ,[imprv_det_type_cd]    ,actual_age

      ,[permanent_crop_acres]      ,[permanent_crop_density]
--order by [permanent_crop_acres] ,acres_group,imprv_det_type_cd,id.prop_id

GO

