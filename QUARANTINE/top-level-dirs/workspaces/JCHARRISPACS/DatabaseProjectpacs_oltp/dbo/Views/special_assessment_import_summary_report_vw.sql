
CREATE VIEW [dbo].[special_assessment_import_summary_report_vw]
AS
	SELECT     assessment_cd, ia.import_id AS run_id, ia.filename, ia.mapping, counts.*
	FROM         dbo.import_assessment AS ia 
	LEFT JOIN
	( 
		SELECT 
			import_id AS import_run_id
			,COUNT(1) AS [Total Records]
			,COUNT(CASE WHEN match = 'M' THEN 1 ELSE NULL END) AS Matched
			,COUNT(CASE WHEN match <> 'M' THEN 1 ELSE NULL END) AS [Mapping Errors]
			,COUNT(CASE WHEN match = 'D' THEN 1 ELSE NULL END) AS [Matching Errors Deleted]
			,COUNT(CASE WHEN match = 'U' THEN 1 ELSE NULL END) AS [No Matching Property ID]
		FROM import_assessment_data
		GROUP BY import_id
		UNION
		SELECT 
			import_id AS import_run_id
			,COUNT(1) AS [Total Records]
			,COUNT(CASE WHEN match = 'M' THEN 1 ELSE NULL END) AS Matched
			,COUNT(CASE WHEN match <> 'M' THEN 1 ELSE NULL END) AS [Mapping Errors]
			,COUNT(CASE WHEN match = 'D' THEN 1 ELSE NULL END) AS [Matching Errors Deleted]
			,COUNT(CASE WHEN match = 'U' THEN 1 ELSE NULL END) AS [No Matching Property ID]
		FROM import_user_assessment_data
		GROUP BY import_id
	) counts
		ON counts.import_run_id = ia.import_id
	LEFT JOIN special_assessment_agency saa ON saa.agency_id = ia.agency_id

GO

