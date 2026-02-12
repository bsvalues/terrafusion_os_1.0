
CREATE VIEW dbo.monthly_as_of_recap_heading_vw
AS
SELECT DISTINCT 
                      dbo.recap_month_vw.tax_month, dbo.recap_month_vw.tax_yr, dbo.recap_month_vw.begin_date, dbo.recap_month_vw.end_date, mrs.pacs_user_id, 
                      dbo.entity.entity_cd, dbo.account.file_as_name, dbo.recap_month_vw.report_heading, dbo.entity.entity_id, mrs.fiscal_year, mrs.fiscal_begin_dt, 
                      mrs.fiscal_end_dt, mrs.begin_dt, mrs.end_dt
FROM         dbo.monthly_as_of_recap_summary mrs INNER JOIN
                      dbo.entity ON mrs.entity_id = dbo.entity.entity_id INNER JOIN
                      dbo.account ON mrs.entity_id = dbo.account.acct_id LEFT OUTER JOIN
                      dbo.recap_month_vw ON mrs.coll_month = dbo.recap_month_vw.tax_month AND mrs.coll_year = dbo.recap_month_vw.tax_yr

GO

