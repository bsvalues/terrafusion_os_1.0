
CREATE PROCEDURE MMGetTableFields

AS

declare @appr_year int

	SELECT @appr_year = appr_yr
	FROM pacs_system
	WHERE system_type = 'A'
	OR system_type = 'B'

	SELECT type, field_name, pacs_table_name, pacs_column_name, 
			field_type, '' as adj_code, '' as adj_usage,
			'' as adj_main_table,
			'' as pct_field_name,
			'' as amt_field_name,
			0 as adj_value
	FROM mm_table_field
	UNION
	SELECT 'L', RTRIM(land_adj_type_cd) + ' (' + land_adj_type_desc + ')', 
			'land_adj', '',
			'NUMBER', RTRIM(land_adj_type_cd),
			land_adj_type_usage, 'land_detail',
			'land_seg_adj_pc', 'land_value',
			CASE WHEN land_adj_type_usage = 'P'
				THEN ISNULL(land_adj_type_pct, 0)
				WHEN land_adj_type_usage = 'A'
				THEN ISNULL(land_adj_type_amt, 0)
				ELSE -1 END
	FROM land_adj_type
	WHERE land_adj_type_year = @appr_year
	UNION
	SELECT 'I', RTRIM(imprv_adj_type_cd) + ' (' + imprv_adj_type_desc + ')',
			'imprv_adj', '',
			'NUMBER', RTRIM(imprv_adj_type_cd),
			imprv_adj_type_usage, 'imprv',
			'imprv_adj_pc', 'imprv_adj_amt',
			CASE WHEN imprv_adj_type_usage = 'P'
				THEN ISNULL(imprv_adj_type_pct, 0)
				WHEN imprv_adj_type_usage = 'A'
				THEN ISNULL(imprv_adj_type_amt, 0)
				ELSE -1 END
	FROM imprv_adj_type
	WHERE imprv_adj_type_year = @appr_year
	AND imprv_adj_type_cd <> 'S'
	UNION
	SELECT 'ID', RTRIM(imprv_adj_type_cd) + ' (' + imprv_adj_type_desc + ')',
			'imprv_det_adj', '', 
			'NUMBER', RTRIM(imprv_adj_type_cd),
			imprv_adj_type_usage, 'imprv_detail',
			'imprv_det_adj_pc', 'imprv_det_adj_amt',
			CASE WHEN imprv_adj_type_usage = 'P'
				THEN ISNULL(imprv_adj_type_pct, 0)
				WHEN imprv_adj_type_usage = 'A'
				THEN ISNULL(imprv_adj_type_amt, 0)
				ELSE -1 END
	FROM imprv_adj_type
	WHERE imprv_adj_type_year = @appr_year
	AND imprv_adj_type_cd <> 'S'
	ORDER BY type, field_name

GO

