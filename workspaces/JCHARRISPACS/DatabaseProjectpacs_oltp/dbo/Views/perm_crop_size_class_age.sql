create view perm_crop_size_class_age as 
SELECT id.[prop_id],ID.prop_val_yr,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 0 and 1	and imprv_det_class_cd like 'PC-g' and id.actual_age between 0 and 3    then	(permanent_crop_acres)else	null	end) as	pc03_G1,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 1.001and 3	and imprv_det_class_cd like 'PC-g' and id.actual_age between 0 and 3 then	(permanent_crop_acres)else	null	end) as	pc03_G2,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 3.001 and 5	and imprv_det_class_cd like 'PC-g' and id.actual_age between 0 and 3then	(permanent_crop_acres)else	null	end) as	pc03_G3,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 5.001 and 10 and imprv_det_class_cd like 'PC-g' and id.actual_age between 0 and 3	then	(permanent_crop_acres)else	null	end) as	pc03_G4,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 10.001 and 20	and imprv_det_class_cd like 'PC-g'and id.actual_age between 0 and 3 then	(permanent_crop_acres)else	null	end) as	pc03_G5,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 20.001 and 1000000	and imprv_det_class_cd like 'PC-g' and id.actual_age between 0 and 3 then	(permanent_crop_acres)else	null	end) as	pc03_G6,

min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 0 and 1	and imprv_det_class_cd like 'PC-g' and id.actual_age between 4 and 8    then	(permanent_crop_acres)else	null	end) as	pc48_G1,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 1.001and 3	and imprv_det_class_cd like 'PC-g' and id.actual_age between 4 and 8  then	(permanent_crop_acres)else	null	end) as	pc48_G2,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 3.001 and 5	and imprv_det_class_cd like 'PC-g' and id.actual_age between 4 and 8  then	(permanent_crop_acres) else	null	end)as	pc48_G3,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 5.001 and 10 and imprv_det_class_cd like 'PC-g' and id.actual_age between 4 and 8 	then	(permanent_crop_acres) else	null	end) as	pc48_G4,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 10.001 and 20	and imprv_det_class_cd like 'PC-g' and id.actual_age between 4 and 8  then	(permanent_crop_acres) else	null	end) as	pc48_G5,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 20.001 and 1000000	and imprv_det_class_cd like 'PC-g' and id.actual_age between 4 and 8  then	(permanent_crop_acres)else	null	end) as	pc48_G6,

min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 0 and 1	and imprv_det_class_cd like 'PC-g' and id.actual_age between 9 and 12     then	(permanent_crop_acres)else	null	end) as	pc912_G1,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 1.001and 3	and imprv_det_class_cd like 'PC-g'and id.actual_age between 9 and 12  then	(permanent_crop_acres)else	null	end) as	pc912_G2,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 3.001 and 5	and imprv_det_class_cd like 'PC-g' and id.actual_age between 9 and 12   then	(permanent_crop_acres)else	null	end) as	pc912_G3,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 5.001 and 10 and imprv_det_class_cd like 'PC-g' and id.actual_age between 9 and 12 	then	(permanent_crop_acres)else	null	end) as	pc912_G4,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 10.001 and 20	and imprv_det_class_cd like 'PC-g' and id.actual_age between 9 and 12   then	(permanent_crop_acres)else	null	end) as	pc912_G5,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 20.001 and 1000000	and imprv_det_class_cd like 'PC-g' and id.actual_age between 9 and 12   then	(permanent_crop_acres)else	null	end) as	pc912_G6,

min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 0 and 1	and imprv_det_class_cd like 'PC-g' and id.actual_age between 13 and 20      then	(permanent_crop_acres) else	null	end) as	pc1320_G1,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 1.001and 3	and imprv_det_class_cd like 'PC-g' and id.actual_age between 13 and 20   then	(permanent_crop_acres) else	null	end) as	pc1320_G2,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 3.001 and 5	and imprv_det_class_cd like 'PC-g' and id.actual_age between 13 and 20    then	(permanent_crop_acres) else	null	end) as	pc1320_G3,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 5.001 and 10 and imprv_det_class_cd like 'PC-g' and id.actual_age between 13 and 20  	then	(permanent_crop_acres) else	null	end) as	pc1320_G4,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 10.001 and 20	and imprv_det_class_cd like 'PC-g' and id.actual_age between 13 and 20    then	(permanent_crop_acres) else	null	end) as	pc1320_G5,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 20.001 and 1000000	and imprv_det_class_cd like 'PC-g' and id.actual_age between 13 and 20    then	(permanent_crop_acres) else	null	end) as	pc1320_G6,

min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 0 and 1	and imprv_det_class_cd like 'PC-g' and id.actual_age between 20 and 200000      then(permanent_crop_acres) else	null	end) as	pc2000_G1,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 1.001and 3	and imprv_det_class_cd like 'PC-g' and id.actual_age between 20 and 200000  then	(permanent_crop_acres) else	null	end) as	pc2000_G2,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 3.001 and 5	and imprv_det_class_cd like 'PC-g' and id.actual_age between 20 and 200000    then	(permanent_crop_acres) else	null	end) as	pc2000_G3,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 5.001 and 10 and imprv_det_class_cd like 'PC-g' and id.actual_age between 20 and 200000   	then	(permanent_crop_acres) else	null	end) as	pc2000_G4,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 10.001 and 20	and imprv_det_class_cd like 'PC-g' and id.actual_age between 20 and 200000     then	 (permanent_crop_acres) else	null	end) as	pc2000_G5,
min(case when   id.imprv_det_type_cd  IS not null and permanent_crop_acres between 20.001 and 1000000	and imprv_det_class_cd like 'PC-g' and id.actual_age between 20 and 200000     then	(permanent_crop_acres) else	null	end) as	pc2000_G6
--actual_age
--,[imprv_det_class_cd] as class_cd
--,[imprv_det_meth_cd]
--,[permanent_crop_density]

  FROM [dbo].[imprv_detail] id
   left join 
   imprv
    ON id.prop_val_yr = imprv.prop_val_yr 
   AND id.sup_num = imprv.sup_num 
   AND id.sale_id = imprv.sale_id 
   AND id.prop_id = imprv.prop_id 
   AND id.imprv_id = imprv.imprv_id
   						 
  where id.prop_val_yr=2019
   and
   id.sale_id=0
  and imprv.imprv_type_cd='permc'
  and id.imprv_det_meth_cd not like 'irr'
and id.imprv_det_meth_cd not like 'trl'
-- and imprv_det_meth_cd like 'V1'
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%V16-Merlot'
and id.actual_age is not null




group by id.[prop_id],id.[prop_val_yr]  ,id.[imprv_id]   ,[imprv_det_id]    ,id.[sup_num]    ,id.[sale_id]     ,[imprv_det_class_cd]     ,[imprv_det_meth_cd]     ,[imprv_det_type_cd]    ,actual_age

      ,[permanent_crop_acres]      ,[permanent_crop_density]
--order by imprv_det_type_cd,id.prop_id

GO

