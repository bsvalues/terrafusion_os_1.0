


CREATE PROCEDURE SetUseUpForPctBase
@input_yr	numeric(4,0)
AS

update imprv_detail set use_up_for_pct_base = 'F'
where prop_val_yr = @input_yr

update imprv_detail set use_up_for_pct_base = 'T'
from imprv_detail as a, 
(select prop_id, prop_val_yr, imprv_id, min(imprv_det_id) as imprv_det_id from imprv_detail
where imprv_det_type_cd like 'MA%'
group by prop_id, prop_val_yr, sup_num, imprv_id) as b

where a.prop_id = b.prop_id
and a.prop_val_yr = b.prop_val_yr
and a.imprv_id = b.imprv_id
and a.imprv_det_id = b.imprv_det_id
and a.prop_val_yr = @input_yr

GO

