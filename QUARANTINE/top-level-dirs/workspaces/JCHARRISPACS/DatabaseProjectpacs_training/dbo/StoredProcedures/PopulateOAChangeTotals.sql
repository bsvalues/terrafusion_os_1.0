


CREATE PROCEDURE PopulateOAChangeTotals

AS

	DELETE FROM oa_change_totals

	INSERT INTO oa_change_totals
	SELECT COUNT(*) AS total_records,
			SUM(CASE WHEN record_type = 'O' THEN 1 ELSE 0 END) as total_owner_records,
			SUM(CASE WHEN record_type = 'A' THEN 1 ELSE 0 END) as total_agent_records,
			SUM(CASE WHEN p.prop_type_cd = 'R' THEN 1 ELSE 0 END) as total_real,
			SUM(CASE WHEN p.prop_type_cd = 'P' THEN 1 ELSE 0 END) as total_personal,
			SUM(CASE WHEN p.prop_type_cd = 'MH' THEN 1 ELSE 0 END) as total_mobile_home,
			SUM(CASE WHEN p.prop_type_cd = 'A' THEN 1 ELSE 0 END) as total_automobile,
			SUM(CASE WHEN p.prop_type_cd = 'MN' THEN 1 ELSE 0 END) as total_mineral
	
	FROM oa_change_info
	INNER JOIN property as p
	ON oa_change_info.prop_id = p.prop_id

GO

