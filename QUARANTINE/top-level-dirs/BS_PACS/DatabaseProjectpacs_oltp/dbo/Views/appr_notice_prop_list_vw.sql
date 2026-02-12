







CREATE VIEW dbo.appr_notice_prop_list_vw
AS
SELECT
	appr_notice_prop_list.*,
	appr_notice_selection_criteria.create_dt, 
	appr_notice_selection_criteria.print_dt, 
	appr_notice_selection_criteria.created_by, 
	appr_notice_selection_criteria.printed_by

FROM
	appr_notice_prop_list
INNER JOIN
	appr_notice_selection_criteria
ON	appr_notice_prop_list.notice_yr = appr_notice_selection_criteria.notice_yr
AND	appr_notice_prop_list.notice_num = appr_notice_selection_criteria.notice_num

GO

