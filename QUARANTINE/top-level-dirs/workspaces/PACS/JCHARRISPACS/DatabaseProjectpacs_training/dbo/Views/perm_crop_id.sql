 create view perm_crop_id as
 
 Select [prop_id],
[imprv_id]

-- ['O01-Apples'],['O36-Red De'],['O10-Gala'],['O02-Cherri'],['O39-Pink L'],['O89-Honeyc'],['C01-Bing']  ,['C02-Rainie']
from 

  ( SELECT imprv_detail.imprv_id,imprv_detail.prop_id	 ,
imprv_det_type_cd  ,permanent_crop_acres
from imprv_detail INNER JOIN
                         imprv ON imprv_detail.prop_val_yr = imprv.prop_val_yr AND imprv_detail.sup_num = imprv.sup_num AND imprv_detail.sale_id = imprv.sale_id AND imprv_detail.prop_id = imprv.prop_id AND 
                         imprv_detail.imprv_id = imprv.imprv_id

						 where 
imprv_detail.prop_val_yr=(select appr_yr from pacs_system)
and imprv_detail.sale_id=0
and imprv.imprv_type_cd='permc'
--and imprv_detail.prop_id=29245
--and imprv_det_type_cd like'AG-HAYSTOR '
--and imprv_det_type_cd like '%Gala '
--and imprv_det_type_cd  is not null
--and permanent_crop_acres is not null
) as sourcetable
--pivot
 --(
--sum(permanent_crop_acres) for imprv_det_type_cd  in (['O01-Apples'],['O36-Red De'],['O10-Gala'],['O02-Cherri'],['O39-Pink L'],['O89-Honeyc'],['C01-Bing']  ,['C02-Rainie'], [imprv_detail.prop_id],
--[imprv_detail.imprv_id]
--)) as pvt

GO

