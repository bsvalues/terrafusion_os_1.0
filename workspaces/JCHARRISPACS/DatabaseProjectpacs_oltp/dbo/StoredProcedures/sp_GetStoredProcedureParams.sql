
create procedure sp_GetStoredProcedureParams
	@proc_name varchar(255)
AS 

SELECT     dbo.sysobjects.id, dbo.syscolumns.name AS param_name, dbo.syscolumns.xtype, dbo.syscolumns.length,
           dbo.syscolumns.isoutparam, dbo.syscolumns.isnullable, dbo.systypes.name AS param_type
FROM         dbo.syscolumns INNER JOIN
                      dbo.sysobjects ON dbo.sysobjects.id = dbo.syscolumns.id INNER JOIN
                      dbo.systypes ON dbo.syscolumns.xtype = dbo.systypes.xtype
WHERE     (dbo.sysobjects.name = @proc_name)
ORDER BY dbo.syscolumns.colorder

GO

