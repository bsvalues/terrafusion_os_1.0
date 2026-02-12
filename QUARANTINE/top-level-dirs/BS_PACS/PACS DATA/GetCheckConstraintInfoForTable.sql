
-- exec dbo.GetCheckConstraintInfoForTable 'property_val','test'

create procedure dbo.GetCheckConstraintInfoForTable 

	@table_name sysname,
    @table_owner sysname

AS
set nocount on


declare
	@szTable sysname,
	@szConstraintName sysname,
	@lConstraintID int

declare @szConstraintDefinition varchar(8000)
declare @szSQL varchar(8000)
declare @ver varchar(10)

SELECT @ver = CASE
 WHEN CHARINDEX('9.00', @@VERSION) > 0 THEN '2005'
 WHEN CHARINDEX('8.00', @@VERSION) > 0 THEN '2000'
 ELSE '2005' -- no clients are lower than 2000, default to 2005
END  


create table #ck_constraints 
(
 constraint_id int,
 constraint_name sysname,
 constraint_type varchar(100),
 status_enabled varchar(100),
 status_for_replication varchar(100),
 [constraint] varchar(4000),
 column_name sysname NULL
)

declare curChecks cursor local fast_forward
for
	select st.name, so.name, sc.constid
	from sysconstraints as sc
	     join 
         sysobjects as so 
      on sc.constid = so.id
	     join 
         sysobjects as st 
      on sc.id = st.id
	where ( sc.status & 15 ) = 4 
      and st.xtype = 'U' 
      and objectproperty(st.id, 'IsMSShipped') = 0
      and st.name = @table_name
      and USER_NAME(st.uid) = @table_owner

	order by so.name asc

	open curChecks
	fetch next from curChecks into @szTable, @szConstraintName, @lConstraintID

	while ( @@fetch_status = 0 )
	begin
		/* Get the check constraint definition from syscomments */
		set @szConstraintDefinition = null
		select @szConstraintDefinition = convert(varchar(8000), text)
		from syscomments
		where
			id = @lConstraintID

		if ( @szConstraintDefinition is null )
		begin
			print '/* No entry in syscomments for check constraint ' + @szConstraintName + ' on table ' + @szTable + '*/'
		end
		else
		begin
            insert into #ck_constraints
			(
             constraint_id,
			 constraint_name ,
			 constraint_type ,
			 status_enabled ,
			 status_for_replication,
			 [constraint] ,
			 column_name
			)
            values(@lConstraintID,@szConstraintName,'','','',@szConstraintDefinition,'')

			if @ver = '2000'
               begin
				 set @szSQL = 'Update c  '
							+ '   set  status_enabled = case ObjectProperty(' + convert(varchar(40),@lConstraintID ) + ', ''CnstIsDisabled'')'
                            + '    when 1 then ''Disabled'' else ''Enabled'' end '
							+ ' ,status_for_replication = case ObjectProperty(' + convert(varchar(40),@lConstraintID ) + ', ''CnstIsNotRepl'')'
                            + '    when 1 then ''Not_For_Replication'' else ''Is_For_Replication'' end '

                            + ' ,column_name = col_name(object_id(''' + @table_name + '''), s.info) '
                            + ' ,constraint_type = case when s.info <> 0 '
							+ '	then ''CHECK on column '' + col_name(object_id(''' + @table_name + '''), s.info) '
							+ '	else ''CHECK Table Level '' end '
							+ ' from sysobjects as s '
                            + ' join #ck_constraints as c '
                            + ' on s.id = c.constraint_id '
                            + ' where s.id = ' + convert(varchar(40),@lConstraintID )
			--	 print @szSQL
                 exec(@szSQL)

               end
            else
			   begin
				 set @szSQL = 'Update c  '
							+ '   set status_enabled = case s.is_disabled'
                            + '    when 1 then ''Disabled'' else ''Enabled'' end '
							+ ' ,status_for_replication = case s.is_not_for_replication'
                            + '    when 1 then ''Not_For_Replication'' else ''Is_For_Replication'' end '

                            + ' ,column_name = col_name(object_id(''' + @table_name + '''), s.parent_column_id) '
                            + ' ,constraint_type = case when parent_column_id <> 0 '
							+ '	then ''CHECK on column '' + col_name(object_id(''' + @table_name + '''), s.parent_column_id) '
							+ '	else ''CHECK Table Level '' end '
							+ ' from sys.check_constraints as s '
                            + ' join #ck_constraints as c '
                            + ' on s.object_id = c.constraint_id '
                            + ' where s.object_id = ' + convert(varchar(40),@lConstraintID )
			--	 print @szSQL
                 exec(@szSQL)

			   end

		end
		
		fetch next from curChecks into @szTable, @szConstraintName, @lConstraintID
	end

	close curChecks
	deallocate curChecks


select constraint_name ,
       constraint_type ,
       status_enabled ,
       status_for_replication ,
       [constraint] ,
       column_name 
  from #ck_constraints
order by constraint_type,constraint_name

GO

