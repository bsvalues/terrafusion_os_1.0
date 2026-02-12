create view age_group_pc as 

SELECT id.[prop_id],
--ROW_NUMBER() over (partition by id.actual_age ORDER BY id.prop_id desc)AS age_id, 
rank() over (partition by id.actual_age ORDER BY id.imprv_det_type_cd desc)AS age_id_1,actual_age,
[imprv_det_class_cd],[imprv_det_meth_cd],[imprv_det_type_cd],[permanent_crop_acres],[permanent_crop_density],
sum(case when   id.imprv_det_type_cd  IS not null and id.actual_age between 0 and 3 	then	[permanent_crop_acres]	else	null	end) as	pc_age_0_to_3,
sum(case when   id.imprv_det_type_cd  IS not null and id.actual_age between 4 and 8		then	[permanent_crop_acres]	else	null	end) as	pc_age_4_to_8,
sum(case when   id.imprv_det_type_cd  IS not null and id.actual_age between 9 and 12 	then	[permanent_crop_acres]	else	null	end) as pc_age_9_to_12,
sum(case when   id.imprv_det_type_cd  IS not null and id.actual_age between 13 and 20 	then	[permanent_crop_acres]	else	null	end) as	pc_age_13_to_20,
sum(case when   id.imprv_det_type_cd  IS not null and id.actual_age between 21 and 30 	then	[permanent_crop_acres]	else	null	end) as	pc_age_21_to_30,
sum(case when   id.imprv_det_type_cd  IS not null and id.actual_age between 31 and 2000	then	[permanent_crop_acres]	else	null	end) as	pc_age_31_plus


  FROM [dbo].[imprv_detail] id
   left join 
   imprv ON id.prop_val_yr = imprv.prop_val_yr AND id.sup_num = imprv.sup_num AND id.sale_id = imprv.sale_id AND id.prop_id = imprv.prop_id AND 
                         id.imprv_id = imprv.imprv_id



	
						
  where id.prop_val_yr=(select appr_yr from pacs_system)
 and
   id.sale_id=0
  and imprv.imprv_type_cd='permc'
  and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
and id.imprv_det_type_cd not like 'I02% '
and id.imprv_det_type_cd not like 'AG%'
and imprv_det_meth_cd like 'V1'
  --and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
--and actual_age between 1 and 5
--and actual_age between 5 and 10
--and permanent_crop_density='hd'
and permanent_crop_acres is not null

group by id.[prop_id],id.[prop_val_yr]  ,id.[imprv_id]   ,[imprv_det_id]    ,id.[sup_num]    ,id.[sale_id]     ,[imprv_det_class_cd]     ,[imprv_det_meth_cd]     ,[imprv_det_type_cd]    ,actual_age

      ,[permanent_crop_acres]      ,[permanent_crop_density]
--order by id.prop_id

GO

