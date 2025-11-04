


CREATE VIEW dbo.ag_rollback_vw
AS
SELECT     dbo.ag_rollback.prop_id, dbo.ag_rollback.owner_id, dbo.ag_rollback.ag_rollbk_id, dbo.account.file_as_name, dbo.ag_rollback.chg_in_use_dt, 
                      dbo.ag_rollback.ag_rollbk_dt, dbo.ag_rollback.ag_rollbk_stmnt_dt, dbo.ag_rollback.bills_created, dbo.ag_rollback.ag_rollbk_type, 
                      CONVERT(varchar(20), CONVERT(varchar(4), DATEPART(mm, dbo.ag_rollback.chg_in_use_dt)) + '/' + CONVERT(varchar(4), DATEPART(dd, 
                      dbo.ag_rollback.chg_in_use_dt)) + '/' + CONVERT(varchar(4), DATEPART(yyyy, dbo.ag_rollback.chg_in_use_dt))) AS chg_in_use_dt_str, 
                      CONVERT(varchar(20), CONVERT(varchar(4), DATEPART(mm, dbo.ag_rollback.ag_rollbk_stmnt_dt)) + '/' + CONVERT(varchar(4), DATEPART(dd, 
                      dbo.ag_rollback.ag_rollbk_stmnt_dt)) + '/' + CONVERT(varchar(4), DATEPART(yyyy, dbo.ag_rollback.ag_rollbk_stmnt_dt))) 
                      AS ag_rollbk_stmnt_dt_str,dbo.ag_rollback.status_cd as ag_rollbk_status
FROM         dbo.ag_rollback INNER JOIN
                      dbo.account ON dbo.ag_rollback.owner_id = dbo.account.acct_id

GO

