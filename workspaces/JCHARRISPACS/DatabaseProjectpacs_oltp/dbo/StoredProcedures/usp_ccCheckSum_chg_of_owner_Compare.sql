
/*
exec dbo.usp_ccCheckSum_chg_of_owner_Compare 2,2013,1,1,1
*/
 
CREATE PROCEDURE dbo.usp_ccCheckSum_chg_of_owner_Compare
    @run_type tinyint  -- 1 = initialize only, 2 = compare
   ,@yr numeric(4,0)
   ,@run_id int
   ,@data_type_id int 
   ,@debug bit = 0
AS 

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogSeconds int
DECLARE @LogErrCode int
DECLARE @StartEndMsg varchar(1000)
DECLARE @StepMsg varchar(3000)
DECLARE @proc varchar(100)
    SET @proc = object_name(@@procid)
 
    SET @StartEndMsg = 'Start - ' + @proc  
 + ' @run_type =' +  isnull(convert(varchar(30),@run_type),'') + ','
 + ' @yr =' +  isnull(convert(varchar(30),@yr),'') + ','
 + ' @run_id =' +  isnull(convert(varchar(30),@run_id),'') + ','
 + ' @data_type_id =' +  isnull(convert(varchar(30),@data_type_id),'') + ','
 + ' @debug =' +  isnull(convert(varchar(30),@debug),'') 
 
 exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                   @status_msg = @StartEndMsg
 
-- set variable for final status entry
 set @StartEndMsg = Replace(@StartEndMsg,'Start','End')
 
/* End top of each procedure to capture parameters */

declare @TableName sysname 
    set @TableName = 'chg_of_owner'
declare @ccTemplateTable sysname
    set @ccTemplateTable = 'cc_checksum_chg_of_owner_template' -- this is also hard coded in one spot  
declare @new_table_name sysname
    set @new_table_name = '#ccCheckSum_chg_of_owner_new' -- this is also hard coded in one spot
declare @old_table_name sysname
    set @old_table_name = 'ccCheckSum_chg_of_owner_old'
declare @join_table_for_prop_id sysname
    set @join_table_for_prop_id = 'chg_of_owner_prop_assoc' -- pk chg_of_owner_id, prop_id
declare @join_syntax varchar(300)
    set @join_syntax = ' ON ' + @TableName + '.chg_of_owner_id = '
                     + @join_table_for_prop_id + '.chg_of_owner_id'   
     
DECLARE @CRLF VARCHAR(2)
    SET @CRLF = CHAR(13) + CHAR(10)
declare @PKColJoin varchar(2000) 
declare @PKColNames varchar(1000)
declare @TrackedColumns varchar(5000)
declare @PKDelimitedNames varchar(2000) 
declare @PKOldNewSQL varchar(2000) 
 
declare @old_table_exists bit
    set @old_table_exists = 0
declare @sql varchar(max)


BEGIN TRY   --- SET UP ERROR HANDLING

/* 
building permit has an assoc table needed to retrieve the prop_id value
so has to have unique processing to those table that contain prop_id already
*/
   
-- set up call to stored proc to get Table Info
set @StepMsg = 'Step 1 '

create table #PrimaryKeyColumns(column_name sysname, ordinal_position int)
create table #tbl_info (column_name sysname, column_id int,data_type varchar(255), is_computed bit )   

exec dbo.usp_ccGetTableInfo @TableName
                           ,@PKColJoin OUTPUT
                           ,@PKColNames OUTPUT
                           ,@TrackedColumns OUTPUT
                           ,@PKDelimitedNames OUTPUT
                           ,@PKOldNewSQL OUTPUT


-- add prop_id to @PKOldNewSQL & @PKColJoin
--set @PKOldNewSQL = ' convert(varchar(200),coalesce(new.prop_id,old.prop_id)) + ''|'' + '  + @PKOldNewSQL
--print @PKOldNewSQL
set @PKColJoin = replace(@PKColJoin, 'ON ','AND ')
set @PKColJoin = ' ON new.prop_id = old.prop_id ' + @PKColJoin

if exists(select 1 from sys.tables where name = @old_table_name)
   begin 
    set @old_table_exists = 1
   end

set @StepMsg = 'Step 2 '
   
-- set up sql for insert to temp table for comparison or initial insert
if exists(select 1 from sys.tables where name = @ccTemplateTable) 
   begin 
         set @sql = ' drop table ' + @ccTemplateTable
         if @debug = 1
             begin 
                print @sql
             end 
         exec (@sql)              
   end 

set @StepMsg = 'Step 3 '

--SET @sql = 'select ' + @PKColNames + ', cast(0 as int) as checksum_val into ' 
--         +  @ccTemplateTable + ' from ' + @TableName 
--         + ' where 1=2 ' 

-- need to add prop_id field to template table 
SET @sql = 'select cast(0 as int) as prop_id,' + @PKColNames + ', cast(0 as int) as checksum_val into ' 
         +  @ccTemplateTable + ' from ' + @TableName 
         + ' where 1=2 ' 
         
if @debug = 1
   begin 
     print @sql
   end
exec (@sql)

set @StepMsg = 'Step 4 '

-- now create temp table based on template - will have to hard code template name for this
-- since a temp table created in dynamic sql is not visible to proc
select * into #ccCheckSum_chg_of_owner_new 
  from dbo.cc_checksum_chg_of_owner_template

set @StepMsg = 'Step 5 '

-- now set up sql to get this year data 
set @sql = ' insert into ' + @new_table_name + @CRLF
         + ' select ' + @join_table_for_prop_id + '.prop_id,' + @CRLF
         + @TableName + '.' + @PKColNames  + @CRLF
         + ',CHECKSUM(' + @TrackedColumns + ') as checksum_val'  + @CRLF
         + ' from ' + @TableName  + @CRLF
         + ' join ' + @CRLF
         + @join_table_for_prop_id  + @CRLF
         + @join_syntax + @CRLF + @CRLF
        -- + ' where prop_val_yr = ' + convert(varchar(4),@yr)
         
if @debug = 1
   begin 
     print @sql
   end 
exec (@sql)

-- add prop_id to PKColumnList for rest of processing
set @PKColNames = 'prop_id,' + @PKColNames

set @StepMsg = 'Step 6 '

if @run_type = 1  or @old_table_exists = 0 -- just initialize
   begin
     exec dbo.usp_ccCheckSum_Reinitialize
                          @old_table_name = @old_table_name
                         ,@new_table_name = @new_table_name
                         ,@PKColNames = @PKColNames
                         ,@debug = @debug

    -- end of procedure update log
    SET @LogSeconds = datediff(s,@StartProc,getdate())
    set @StartEndMsg = @StartEndMsg + ':Initialize only'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StartEndMsg,
                                      @row_count = @@ROWCOUNT,
                                      @err_status = @@ERROR,
                                      @duration_in_seconds = @LogSeconds                         
     return 0
   end

set @StepMsg = 'Step 7 '
   
if @old_table_exists = 1 and @run_type = 2
   begin
     -- old data exists, compare, get prop_id and and insert new to old
     set @sql = ' create clustered index idx_PK on ' + @new_table_name + '(' + @PKColNames + ')'
     if @debug = 1
        begin 
          print @sql
        end
     exec (@sql)  
     
     set @StepMsg = 'Step 8 '
     -- full join to recognize adds and deletes
     set @sql = 'insert into  dbo.ccCheckSum_Compare_RunInfo_Details '
              + ' (run_id,data_type_id,prop_id,IsNew,IsDel,PKColNames,PKValues,valid_for_cloud,new_for_cloud,inserted_to_queue_table) '
              + ' select ' + convert(varchar(35),@run_id) + ' as run_id ' + @CRLF
              + ',' + convert(varchar(10),@data_type_id) + ' as data_type_id ' + @CRLF
              + ', coalesce(new.prop_id,old.prop_id) as prop_id ' + @CRLF
              + ', case isnull(old.prop_id,-1)  when - 1 then 1 else 0 end as IsNew ' + @CRLF   
              + ', case isnull(new.prop_id,-1)  when - 1 then 1 else 0 end as IsDEL ' + @CRLF 
              + ', ''' + @PKDelimitedNames + ''' as PKColNames ' + @CRLF 
              + ', ' + @PKOldNewSQL + ' as PKValues ' + @CRLF
              + ', 0 as valid_for_cloud,0 as new_for_cloud,0 as inserted_to_queue_table '  
              + ' from ' + @new_table_name + ' as new ' + @CRLF
              + ' full join ' + @CRLF
              + @old_table_name + ' as old ' + @CRLF
              + @PKColJoin  + @CRLF
              + 'where (new.prop_id is null or old.prop_id is null or new.checksum_val <> old.checksum_val)'  + @CRLF 
     if @debug = 1
        begin 
          print @sql
        end
     exec (@sql)

     set @StepMsg = 'Step 8 '

     exec dbo.usp_ccCheckSum_Reinitialize
                          @old_table_name = @old_table_name
                         ,@new_table_name = @new_table_name
                         ,@PKColNames = @PKColNames
                         ,@debug = @debug      
   end

set @StepMsg = 'Step 10 '

-- drop temp table
set @sql = 'drop table ' + @new_table_name
exec (@sql)   

set @StepMsg = 'Step 11 '

-- end of procedure update log
SET @LogSeconds = datediff(s,@StartProc,getdate())
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StartEndMsg,
                                  @row_count = @@ROWCOUNT,
                                  @err_status = @@ERROR,
                                  @duration_in_seconds = @LogSeconds
                                  
END TRY

BEGIN CATCH
	DECLARE
	@ERROR_SEVERITY INT,
	@ERROR_STATE INT,
	@ERROR_NUMBER INT,
	@ERROR_LINE INT,
	@ERROR_MESSAGE VARCHAR(245),
    @AppMsg varchar(2000)
    
	SELECT
	@ERROR_SEVERITY = ERROR_SEVERITY(),
	@ERROR_STATE = ERROR_STATE(),
	@ERROR_NUMBER = ERROR_NUMBER(),
	@ERROR_LINE = ERROR_LINE(),
	@ERROR_MESSAGE = ERROR_MESSAGE(),
	@AppMsg = 'Error in proc: ' + @proc + ' ' + @StepMsg + @ERROR_MESSAGE
	
	exec dbo.CurrentActivityLogInsert @proc, @AppMsg,0,@ERROR_NUMBER

   RAISERROR(@AppMsg , 16, 1) 

	
END CATCH

GO

