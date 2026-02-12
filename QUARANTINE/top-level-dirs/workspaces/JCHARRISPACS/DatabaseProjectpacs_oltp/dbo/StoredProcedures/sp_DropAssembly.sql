
create procedure sp_DropAssembly
	@assemblyName sysname
as

	declare @assembly_id int
	select @assembly_id = assembly_id
	from sys.assemblies
	where name = @assemblyName
	
	if (@assembly_id is null)
		return
	
	declare @sql varchar(8000)
	
	declare
		@objName sysname,
		@objType char(2)
	
	declare curObjects insensitive cursor
	for
		select so.name, so.type
		from sys.all_objects as so
		join sys.assembly_modules as am on
			am.object_id = so.object_id and
			am.assembly_id = @assembly_id
	for read only
	
	open curObjects
	fetch next from curObjects into @objName, @objType
	while (@@fetch_status = 0)
	begin
		set @sql =
			'drop ' + case @objType
				when 'TA' then 'trigger'
				when 'AF' then 'aggregate'
				when 'PC' then 'procedure'
				when 'FS' then 'function'
				when 'FT' then 'function'
				else null
			end +
			' ' + @objName
			
		exec(@sql)
		
		fetch next from curObjects into @objName, @objType
	end
	
	close curObjects
	deallocate curObjects
	
	set @sql = 'drop assembly ' + @assemblyName
	exec(@sql)

GO

