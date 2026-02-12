





CREATE PROCEDURE [dbo].[PA_WebMapNeighborhood]
	@szServerDBSource sysname


as


declare @sql varchar(8000);

set @sql = 'select
		p.hood_cd,
		p.hood_name
	from '+@szServerDBSource+'.dbo._clientdb_neighborhood as p with (nolock)'

exec(@sql)

GO

