
CREATE VIEW dbo.SHARED_PROP_VALUE_VW
AS
SELECT spv.pacs_prop_id,
	spv.shared_cad_code,
	spv.shared_year, 
	spv.record_type,
	spv.shared_value,
	spv.ag_use_code,
	spv.ag_use_value, 
	spv.homesite_flag,
	spv.sup_num,
	sp.imp_new_value,
	sp.land_new_value
FROM shared_prop_value as spv
with (nolock)
join shared_prop as sp
with (nolock)
on spv.pacs_prop_id = sp.pacs_prop_id
and spv.shared_prop_id = sp.shared_prop_id
and spv.shared_year = sp.shared_year
and spv.shared_cad_code = sp.shared_cad_code

GO

