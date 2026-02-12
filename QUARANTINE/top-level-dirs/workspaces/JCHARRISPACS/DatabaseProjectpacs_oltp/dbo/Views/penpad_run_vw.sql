
CREATE  VIEW dbo.penpad_run_vw
AS
SELECT pr.run_id, pr.status_cd, 
    pr.pacs_user_id, pr.criteria, 
    pr.check_in_date, pr.check_out_date, 
    pacs_user.pacs_user_name, pr.prop_count, 
    pr.penpad_name, pr.recalc_flag,
    case when IsNull(OWNER_COUNT.OWNS, '0') > 0 Then 'T'
    else 'F' end OWNS,
    case when IsNull(SALES_COUNT.SALES, '0') > 0 Then 'T'
    else 'F' end SALES
FROM penpad_run pr
	INNER JOIN pacs_user ON pr.pacs_user_id = pacs_user.pacs_user_id
	LEFT JOIN (
		select lRunID run_id, count(*) OWNS from penpad_owner_change with(nolock) where  bWizardComplete = 0 group by lRunID
	) OWNER_COUNT ON pr.run_id=OWNER_COUNT.run_id
	LEFT JOIN (
		select lRunID run_id, count(*) SALES from penpad_sales_change with(nolock) where  bWizardComplete = 0 group by lRunID
	) SALES_COUNT ON pr.run_id=SALES_COUNT.run_id
GROUP BY pr.run_id, pr.status_cd, 
    pr.pacs_user_id, pr.criteria, 
    pr.check_in_date, pr.check_out_date, 
    pacs_user.pacs_user_name, pr.prop_count, 
    pr.penpad_name, pr.recalc_flag,
    OWNER_COUNT.OWNS,
    SALES_COUNT.SALES

GO

