
CREATE VIEW arbitration_reports_entity_vw
AS

SELECT DISTINCT
		arbitration_id, 
		case_id, 
		prop_id, 
		prop_val_yr, 
		entity_id,
		entity_cd
FROM
		entity WITH (NOLOCK)
INNER JOIN 
		arbitration_case_assoc with (nolock)
ON 
		charindex(',' +  rtrim(entity_cd) + ',', ',' + replace(isnull(begin_entities,''), ' ', '') + ',') > 0

GO

