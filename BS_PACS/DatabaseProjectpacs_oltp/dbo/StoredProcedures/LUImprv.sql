
CREATE procedure LUImprv

@prop_id	int,
@id2 		int

as
 
select 
year      = prop_val_yr, 
class_cd  = imprv_det_class_cd, 
type_cd   = imprv_det_type_cd, 
meth_cd   = imprv_det_meth_cd
 
from imprv_detail 
where prop_id = @prop_id

GO

