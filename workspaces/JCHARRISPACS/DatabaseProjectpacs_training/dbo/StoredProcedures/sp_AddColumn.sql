
create procedure dbo.sp_AddColumn
	 @szTable sysname
	,@szColumn sysname
	,@ColumnDef varchar(8000) 
    ,@Allow_Nulls bit
    ,@IsComputed bit 
    ,@DictionaryDescription varchar(7500)
    ,@DefaultValue varchar(8000) = NULL
as

set nocount on
declare @ret int
declare @err int
    set @err = 0
declare @MaxRows_ForDropReplication int
    set @MaxRows_ForDropReplication = 100000

declare @Definition varchar(8000)

declare @DefaultName varchar(2000)
    set @DefaultName = ''

-- if not nullable, then ensure there is a default value given
if @Allow_Nulls = 0
   if @DefaultValue IS NULL -- allow for empty string default value
	  begin
         set @err = -1
         RAISERROR('Default was not provided for non nullable column for Table: %s ,Column: %s', 16, 1,@szTable,@szColumn) WITH NOWAIT
         return @err
	  end

if @DefaultValue IS NOT NULL -- allow empty string as default
begin
	-- set default name using True Automation naming standards
	set @DefaultName = 'CDF_' + @szTable + '_' + @szColumn
	-- print @DefaultName
end

-- validate input
if LEN(@ColumnDef) = 0
   begin
      set @err = -1
      RAISERROR('DataType was not provided for Table: %s ,Column: %s', 16, 1,@szTable,@szColumn) WITH NOWAIT
      return @err
   end

if LEN(@DictionaryDescription) = 0
   begin
      set @err = -1
      RAISERROR('No description provided for Table: %s ,Column: %s', 16, 1,@szTable,@szColumn) WITH NOWAIT
      return @err
   end

-- see if table exists
if not exists (
	select *
	from sysobjects
        where name = @szTable
          and xtype = 'U'
         )
   begin
      set @err = -1
      RAISERROR('Table does not exists: %s', 16, 1, @szTable) WITH NOWAIT
      return @err
   end


if exists (
	select *
	from syscolumns
	where id = object_id(@szTable)
	and name = @szColumn
)
begin
    print 'sp_AddColumn Info Msg: Column ' + @szColumn + ' already exists on table ' + @szTable
    -- column already exists, exit
	return 0
end

-- set sql syntax for column definition
set @Definition = @ColumnDef 
--print @Definition

if @DefaultValue IS NOT NULL
   begin
     if @Allow_Nulls = 0
     begin
       set @Definition = @Definition + ' NOT NULL CONSTRAINT '
                       + @DefaultName + ' Default '
     end
     else
     begin
       set @Definition = @Definition + ' NULL CONSTRAINT '
                       + @DefaultName + ' Default '
     end
     
     if isnumeric(@DefaultValue) = 1 
        begin
          set @Definition = @Definition + '(' + @DefaultValue + ')'
        end
     else if @ColumnDef <> 'datetime'
        begin
          set @Definition = @Definition + '(''' + @DefaultValue + ''')'
        end
     else
        begin
          set @Definition = @Definition + @DefaultValue
        end
   end
else
   begin
     if @IsComputed = 0  -- add null designator for non-computed columns
        begin
           set @Definition = @Definition + ' NULL'
        end
   end

-- if not nullable, check to see if replication needs to be dropped
declare @replicated bit
    set @replicated = (select dbo.fn_IsTableReplicated(@szTable))
declare @TotRows bigint

if @replicated = 1
   if @Allow_Nulls = 0  -- non- nullable will have default set for all existing columns
       begin
        -- see how many rows in table, if over MaxRows , drop replication on table
         set @TotRows = (select dbo.fn_GetRowCountForTable(@szTable))
         if @TotRows > @MaxRows_ForDropReplication
            begin
               exec @ret = dbo.sp_DropTableReplication @szTable
               if @ret <> 0
                  return @ret
               else
                  begin
                    -- just to be safe, check again 
                     set @replicated = (select dbo.fn_IsTableReplicated(@szTable))
                     if @replicated <> 0
                        begin
                          RAISERROR('Error dropping replication on Table: %s ', 16, 1,@szTable) WITH NOWAIT
				          return -1
                        end
                  end
            end 

       end

-- determine if this is SQL 2000 or greater
DECLARE @ver varchar(7)
SELECT @ver = CASE
                WHEN CHARINDEX('9.00', @@VERSION) > 0 THEN '2005'
                WHEN CHARINDEX('8.00', @@VERSION) > 0 THEN '2000'
                ELSE '2005' -- no clients are lower than 2000, default to 2005
              END 

declare @szSQL nvarchar(4000)

if @replicated = 0 or @ver = '2005'
    begin
	  set @szSQL = 'alter table ' + @szTable + ' add ' + @szColumn + ' ' + @Definition

	   exec(@szSQL)
       -- check and see if column is now there, 

		if not exists (
			select *
			from syscolumns
			where id = object_id(@szTable)
			and name = @szColumn
		)
         begin
		  set @err = -1
		  RAISERROR('Error when adding Column %s on Table %s', 16, 1,@szColumn,@szTable) WITH NOWAIT
		  return @err
         end
    end
else
	begin
       if @ver = '2000'
          begin
           
          -- sp_repladdcolum: This stored procedure has been deprecated 
          -- and is being supported mainly for backward-compatibility.
          -- It should only be used with Microsoft SQL Server 2000 Publishers
          -- and SQL Server 2000 republishing Subscribers.

             exec @ret = sp_repladdcolumn @szTable,@szColumn,@Definition
             if @ret <> 0
			   begin
                  RAISERROR('Error adding column to SQL 2000 replicated Table: %s ,Column: %s', 16, 1,@szTable,@szColumn) WITH NOWAIT
				  return @ret
			   end
		    --set @szSQL = 'exec sp_repladdcolumn ''' + @szTable + ''', ''' + @szColumn + ''', ''' + @Definition + ''''
            --print @szSQL

	      end
    end

-- now add the column description 
 execute @ret = sp_AddColumnDescription @szTable,@szColumn,@DictionaryDescription 
 if @ret <> 0
    return @ret
 else
    return 0

GO

