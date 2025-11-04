
CREATE proc [dbo].[WorkflowTaskQueryInsertUpdate](@pacsqueryid int)
as
BEGIN
	declare @id uniqueidentifier
	declare @sql varchar(max)
	declare @tablename varchar(110)
	
set nocount on
		
	if NOT EXISTS 
	   (SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME='pacs_taskquery') 
    return
   
   if NOT EXISTS 
	   (SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME='pacs_taskqueryselectionfield') 
   return
   
	
	if exists(select * from pacs_taskquery where PACSQueryId = @pacsqueryid)
	BEGIN
		select @id = id from pacs_taskquery where PACSQueryId = @pacsqueryid
		update pacs_taskquery
			set SQLQuery = qbqsql.szSQL,
			[name] = szQueryName,
			[CreationDate] = dtCreate,
			[ExpirationDate] = dtExpire,
		   [PacsUser] = u.pacs_user_name,
			[Description] = szQueryDesc
		from pacs_taskquery p inner join 
		query_builder_query qbq
			on p.PacsQueryId = qbq.lQueryID
		inner join query_builder_query_usersql qbqsql 
			on qbq.lQueryID = qbqsql.lQueryID
		inner join pacs_user u on
			qbq.lPacsUserID = u.pacs_user_id
		where qbq.lQueryID = @pacsqueryid
	END
	ELSE
	BEGIN
		set @id = newid()

		insert into pacs_taskquery ([id],[SQLQuery],[name],[PACSQueryId],[CreationDate],[ExpirationDate],[PacsUser],[Description]) 
		select @id as [id], 
			   qbqsql.szSQL as [SQLQuery],
			   szQueryName as [name],
			   qbq.lQueryId as [PACSQueryId],
			   dtCreate as [CreationDate],
			   dtExpire as [ExpirationDate],
			   u.pacs_user_name as [PacsUser],
			   szQueryDesc as [Description]
		from query_builder_query qbq
			inner join query_builder_query_usersql qbqsql 
				on qbq.lQueryID = qbqsql.lQueryID
			inner join pacs_user u on
				qbq.lPacsUserID = u.pacs_user_id
		where qbq.lQueryID = @pacsqueryid
	END

	select @sql = [SQLQuery] from pacs_taskquery where id = @id

	set @tablename = '#tmp' + replace(cast(newid() as varchar(100)), '-','')

	declare @tmpsql varchar(max)

	set @tmpsql = ltrim(rtrim(right(ltrim(rtrim(@sql)),len(ltrim(rtrim(@sql))) - len('select'))))

	if left(@tmpsql,3) = 'all'
	BEGIN
		  set @tmpsql = ltrim(rtrim(right(ltrim(rtrim(@tmpsql)),len(@tmpsql) - len('all'))))
	END

	if left(@tmpsql,len('distinct')) = 'distinct'
	BEGIN
		  set @tmpsql = ltrim(rtrim(right(ltrim(rtrim(@tmpsql)),len(@tmpsql) - len('distinct'))))
	END



	if left(@tmpsql,3) = 'top'
	BEGIN
		  set @tmpsql = ltrim(rtrim(right(ltrim(rtrim(@tmpsql)),len(@tmpsql) - len('top'))))
		  while len(ltrim(left(@tmpsql,1))) > 0
		  BEGIN
				set @tmpsql = right(@tmpsql,len(@tmpsql) - 1) 
		  END
	END

	set @tmpsql = 'select top 1 ' + @tmpsql

	set @tmpsql = stuff(@tmpsql, charindex('from', @tmpsql), len('from'), 'into ' + @tablename + ' from')

	select  @tmpsql = 
	'' + 
	@tmpsql
	+ '
	delete from pacs_taskqueryselectionfield where taskquery_id = ''' + cast(@id as varchar(100)) + '''
	insert into pacs_taskqueryselectionfield ([id],[Name],[FieldType],[length],[taskquery_id], [colorder])
	select newid(), c.name as [Name], t.Name as [FieldType], c.length, ''' +  cast(@id as varchar(100)) + ''' as [taskquery_id],
		c.colorder	
	from tempdb..sysobjects o inner join tempdb..syscolumns c on o.id = c.id
		  inner join Systypes t on t.xtype = c.xtype
	and o.name like ''' + @tablename + '%''
	order by c.colorder'
	exec(@tmpsql)
set nocount off
END

GO

