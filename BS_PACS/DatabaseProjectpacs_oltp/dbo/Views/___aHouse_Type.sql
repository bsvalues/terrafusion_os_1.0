
			
create view ___aHouse_Type as

select distinct prop_id, imprv_det_type_cd
from imprv_detail
WHERE [pacs_oltp].[dbo].imprv_detail.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)

and imprv_detail.imprv_det_type_cd like '%MA%'

GO

