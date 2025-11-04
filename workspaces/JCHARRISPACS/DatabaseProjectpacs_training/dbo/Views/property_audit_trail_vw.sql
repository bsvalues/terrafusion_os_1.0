

CREATE VIEW dbo.property_audit_trail_vw
AS
SELECT     pat.pacs_user_id, pat.prop_id, pat.audit_date, pat.type, pat.action, pat.action_user_id, dbo.pacs_user.pacs_user_name, pat.trans_id, pat.trans_amt, pat.prop_val_yr, 
                      pat.base_tax_trans_amt, pat.report_print_balance, pat.modify_reason
FROM       dbo.property_audit_trail AS pat LEFT OUTER JOIN
                      dbo.pacs_user ON pat.action_user_id = dbo.pacs_user.pacs_user_id

GO

