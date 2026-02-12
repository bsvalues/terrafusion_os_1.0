



CREATE PROCEDURE [dbo].[PA_WebMapAbsSubdv]
	@szServerDBSource sysname


as


declare @sql varchar(8000);

set @sql = 'select
		p.abs_subdv_cd,
		p.abs_subdv_desc
	from '+@szServerDBSource+'.dbo._clientdb_abs_subdv as p with (nolock)'

exec(@sql)

GO

