
CREATE VIEW dbo.eff_acre_grp_chg_log_vw
AS
SELECT     cl.dtChange AS [Date], pu.pacs_user_name AS [User], cl.szMachineName AS Machine, cl.szChangeType AS [Action], cl.lChangeID AS ID, 
                      cl.szRefID AS Ref, pc.szColumnName AS Field, cl.szOldValue AS Before_Value, cl.szNewValue AS New_Value, clk.lKeyValue AS group_id
FROM         dbo.change_log cl INNER JOIN
                      dbo.pacs_user pu ON pu.pacs_user_id = cl.lPacsUserID INNER JOIN
                      dbo.pacs_columns pc ON pc.iColumnID = cl.iColumnID INNER JOIN
                      dbo.change_log_keys clk ON clk.lChangeID = cl.lChangeID AND clk.iColumnID = 2033
WHERE     (cl.iTableID IN (847, 848))

GO

