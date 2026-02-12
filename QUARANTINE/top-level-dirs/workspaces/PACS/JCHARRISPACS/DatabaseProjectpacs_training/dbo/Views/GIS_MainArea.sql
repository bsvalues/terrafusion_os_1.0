create view GIS_MainArea as 
SELECT DISTINCT 
imprv_detail.prop_id,
imprv_det_type.main_area, 
imprv_detail.imprv_det_desc, 
imprv.imprv_type_cd, 
imprv.imprv_desc 


FROM            imprv_det_type INNER JOIN
                         imprv_detail ON imprv_det_type.imprv_det_type_cd = imprv_detail.imprv_det_type_cd INNER JOIN
                         imprv ON imprv_detail.prop_val_yr = imprv.prop_val_yr AND imprv_detail.sup_num = imprv.sup_num AND imprv_detail.sale_id = imprv.sale_id AND imprv_detail.prop_id = imprv.prop_id AND 
                         imprv_detail.imprv_id = imprv.imprv_id INNER JOIN
                         imprv_sched ON imprv_det_type.imprv_det_type_cd = imprv_sched.imprv_det_type_cd
						



WHERE        
(imprv.prop_val_yr = (select appr_yr FROM pacs_oltp.dbo.pacs_system)) 
AND (imprv.sale_id = 0) AND (imprv_sched.imprv_det_meth_cd = 'R') 
AND (imprv_sched.imprv_sched_area_type_cd = 'stma') 
AND (imprv_sched.imprv_det_type_cd = 'MA')

GO

