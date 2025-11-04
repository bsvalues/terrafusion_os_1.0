
/*

exec dbo.usp_ccCheckSum_Compare @run_type = 2, @debug = 0
select top 1 * from ccCheckSum_Compare_RunInfo where run_id = (select max(run_id) from ccCheckSum_Compare_RunInfo) 
select  td.data_desc,rd.* 
from dbo.ccCheckSum_Compare_RunInfo_Details as rd
   join
   dbo.ccChecksum_TrackedData as td
   on rd.data_type_id = td.data_type_id
 where run_id = (select max(run_id) from ccCheckSum_Compare_RunInfo) 
 
select top 10 * from ccUpSyncQueue
select top 10 * from ccAssignmentGroupQueue 
select top 10 * from ccUserSyncQueue

*/

CREATE PROCEDURE dbo.usp_ccCheckSum_Compare
    @run_type tinyint = 2 -- 1 = initialize only, 2 = compare
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
 + ' @debug =' +  isnull(convert(varchar(30),@debug),'') 
 
 exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                   @status_msg = @StartEndMsg
 
-- set variable for final status entry
 set @StartEndMsg = Replace(@StartEndMsg,'Start','End')
 
/* End top of each procedure to capture parameters */

DECLARE @CRLF VARCHAR(2)
    SET @CRLF = CHAR(13) + CHAR(10)
declare @yr numeric(4,0)
declare @run_id int
declare @data_desc  varchar(300)
declare @compare_proc_name sysname
declare @data_type_id int
declare @pacs_user_data_type_id int
declare @main_image_data_type_id int
declare @ccProperty_data_type_id int
declare @property_assoc_data_type_id int

declare @sql nvarchar(4000)
declare @PropertyQueueInserts int
declare @DeleteQueueInserts int
declare @UserQueueInserts int
declare @NewCloudProperties int
declare @MainImageQueueInserts int
declare @ccAssignmentGroupQueueInserts int
declare @insert_all_qualified_properties_to_ccProperty varchar(500)

declare @dt datetime 
    set @dt = getdate()
declare @UserName VARCHAR(128)    
declare @AppName VARCHAR(1000)
    set @UserName = system_user
    set @AppName = 'COMPARE CHECKSUM PROCEDURE'
declare @ret int
declare @error bit
    set @error = 0    


-- find data type for pacs_user data - needs special processing
select @pacs_user_data_type_id = data_type_id
  from dbo.ccChecksum_TrackedData
 where data_desc = 'pacs_user'
 
-- find data type for main image data - needs special processing
select @main_image_data_type_id = data_type_id
  from dbo.ccChecksum_TrackedData
 where data_desc = 'main_image' 

-- find data type for ccProperty data - needs special processing
select @ccProperty_data_type_id = data_type_id
  from dbo.ccChecksum_TrackedData
 where data_desc = 'ccProperty'

-- find data type for property_assoc data - needs special processing
select @property_assoc_data_type_id = data_type_id
  from dbo.ccChecksum_TrackedData
 where data_desc = 'property_assoc'
  
--BEGIN TRY   --- SET UP ERROR HANDLING
-- removed error handling so all compares that did complete can get updated to queue tables

set @StepMsg = 'Step 1 '
 
-- get current appraisal year
select @yr = appr_yr 
  from pacs_system

-- make sure ccProperty has records, otherwise all changes will be inserted to queue as new property
if not exists( select top 1 prop_id from dbo.ccProperty)
   begin
      set @StepMsg = 'Error: ccProperty table is empty, populate before re-running process. '
      exec dbo.CurrentActivityLogInsert @proc, @StepMsg,0,5000
      RAISERROR(@StepMsg , 16, 1) WITH NOWAIT
      return -1
   end

if not exists( select 1 from dbo.ccCheckSum_Compare_Procedure_Run_Settings 
                 where setting_name = 'insert_all_qualified_properties_to_ccProperty'
                    and setting_value in('Y','N'))
   begin
      set @StepMsg = 'Error: ccCheckSum_Compare_Procedure_Run_Settings table does not have valid insert_all_qualified_properties_to_ccProperty setting, populate before re-running process. '
      exec dbo.CurrentActivityLogInsert @proc, @StepMsg,0,5000
      RAISERROR(@StepMsg , 16, 1) WITH NOWAIT
      return -1
   end
      
select @insert_all_qualified_properties_to_ccProperty = setting_value
  from dbo.ccCheckSum_Compare_Procedure_Run_Settings
 where setting_name = 'insert_all_qualified_properties_to_ccProperty'
   
set @StepMsg = 'Step 2 '

-- insert run entry 
insert into dbo.ccCheckSum_Compare_RunInfo (start_time, run_type) values (getdate(), @run_type)
 set @run_id = scope_identity()

set @StepMsg = 'Step 3 '
 
DECLARE cCur CURSOR  LOCAL FAST_FORWARD
FOR 
   SELECT data_type_id, data_desc, compare_proc_name
     FROM dbo.ccChecksum_TrackedData
    WHERE data_type_id <> @ccProperty_data_type_id  -- ccProperty can change within this run, so will be done later in proc
    ORDER BY data_type_id

OPEN cCur

FETCH NEXT FROM cCur INTO @data_type_id,@data_desc,@compare_proc_name

WHILE @@FETCH_STATUS = 0 
  BEGIN
    set @sql = 'exec @ret =  ' + @compare_proc_name 
             + ' @run_type = ' + convert(varchar(20),@run_type)
             + ' ,@yr = '  + convert(varchar(4),@yr)
             + ' ,@run_id = '  + convert(varchar(35),@run_id)
             + ' ,@data_type_id = '  + convert(varchar(4),@data_type_id)
             + ' ,@debug = '  + convert(varchar(4),@debug)
    
     if @debug = 1
         begin 
            print @CRLF + @CRLF + '******* START OF PROCEDURE ' + @compare_proc_name  + ' *******' + @CRLF + @CRLF
            print @sql
         end

     exec sp_executesql @sql ,N'@ret int OUT', @ret OUT 

     if @ret <> 0   
        begin
           set @error = 1
        end        
  FETCH NEXT FROM cCur INTO @data_type_id,@data_desc,@compare_proc_name
END
CLOSE cCur
DEALLOCATE cCur


set @StepMsg = 'Step 3.1 Find qualified properties for cloud '
set @StartStep = getdate()  --logging capture start time of step

create table #qualified_properties (prop_id int) 
   
insert into #qualified_properties(prop_id)
     select pv.prop_id
       from dbo.property as p
            join
            dbo.property_val as pv
         on p.prop_id = pv.prop_id
            join
            dbo.prop_supp_assoc as psa 
         on pv.prop_val_yr = psa.owner_tax_yr
        and pv.sup_num = psa.sup_num
        and pv.prop_id = psa.prop_id
      WHERE pv.prop_val_yr = @yr
        and psa.owner_tax_yr = @yr
        and p.prop_type_cd in ('R', 'MH') 
        and (pv.prop_inactive_dt is null or udi_parent = 'T')
        and udi_parent_prop_id is null
        
-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 3.1 Find qualified properties for cloud End '
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

create clustered index idx_prop_id on #qualified_properties(prop_id)  -- for better performance when matching to other tables
 
set @StepMsg = 'Step 4 Update Valid Flag '
set @StartStep = getdate()  --logging capture start time of step

-- flag properties in this run that would be valid for cloud
update rd
   set valid_for_cloud = 1
  from dbo.ccCheckSum_Compare_RunInfo_Details as rd
       join 
       #qualified_properties as qp
    on rd.prop_id = qp.prop_id
 WHERE rd.run_id = @run_id 
   and rd.data_type_id not in(@pacs_user_data_type_id)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 4 Update Valid Flag End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

set @StepMsg = 'Step 5 Update New For Cloud Flag '
set @StartStep = getdate()  --logging capture start time of step
                                  
-- now go see which properties found in this run would be new to the cloud
update rd
   set new_for_cloud = 1
  from dbo.ccCheckSum_Compare_RunInfo_Details as rd
       left join 
       dbo.ccProperty as cp
    on rd.prop_id = cp.prop_id
 where rd.run_id = @run_id
   and cp.prop_id is null
   and rd.valid_for_cloud = 1
  and rd.data_type_id not in(@pacs_user_data_type_id)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 5 Update New For Cloud Flag End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

if exists(select 1 from dbo.ccCheckSum_Compare_RunInfo_Details where run_id = @run_id and new_for_cloud = 1)
   begin
     -- new properties inserted into ccProperty will use assignment group of 'CAD'
     -- add it to mobile_assignment_group, if it does not exists, becuase there is a FK to the value
     if not exists(select 1 from mobile_assignment_group where mobile_assignment_group_id = 'CAD')
        begin
           insert into mobile_assignment_group(mobile_assignment_group_id,mobile_assignment_group_description)
              values('CAD','User defined orphan group') 

        -- logging end of step 
        SELECT @LogTotRows = @@ROWCOUNT, 
               @LogErrCode = @@ERROR 
           SET @LogSeconds = datediff(s,@StartStep,getdate())
           SET @StepMsg =  'Step 5.1 Insert CAD entry to mobile_assignment_group table  End'
        exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                          @status_msg = @StepMsg,
                                          @row_count = @LogTotRows,
                                          @err_status = @LogErrCode,
                                          @duration_in_seconds = @LogSeconds              
        end
   end

set @StepMsg = 'Step 6 Insert new ccProperty '
set @StartStep = getdate()  --logging capture start time of step

-- new setting added for testing environments to insert all qualified properties to ccProperty or not

if @insert_all_qualified_properties_to_ccProperty = 'Y'
   begin   
-- now insert any new properties based on changed data to ccProperty table
    insert into dbo.ccProperty
      ( 
        prop_id
       ,prop_val_yr
       ,sup_num
       ,mobile_assignment_group_id   
      )

     select distinct 
            rd.prop_id
           ,@yr as prop_val_yr
           ,0 as sup_num
           ,'CAD' as mobile_assignment_group_id
      from dbo.ccCheckSum_Compare_RunInfo_Details as rd
           left join 
           dbo.ccProperty as cp
        on rd.prop_id = cp.prop_id
     where rd.run_id = @run_id
       and cp.prop_id is null  -- no duplicates
       and rd.valid_for_cloud = 1
       and rd.new_for_cloud = 1
      and rd.data_type_id not in(@pacs_user_data_type_id, @main_image_data_type_id, @ccProperty_data_type_id)
      
    select @NewCloudProperties = @@ROWCOUNT,
           @LogErrCode = @@ERROR
           
    -- logging end of step 
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 6 Insert new ccProperty End'
    exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @NewCloudProperties,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds

   end
else
  begin
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 6.0.1 Bypass of Insert missing changed qualified properties to ccProperty due to run setting of ' + @insert_all_qualified_properties_to_ccProperty
       exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds

  
  end 
-- R2 changes - always check to ensure the ccProperty only contains properties that "qualify"
--  remove or add as needed
-- new setting added for testing environments to insert all qualified properties to ccProperty or not

if @insert_all_qualified_properties_to_ccProperty = 'Y'
   begin

        set @StepMsg = 'Step 6.1 Insert missing qualified properties to ccProperty '
        set @StartStep = getdate()  --logging capture start time of step

        insert into dbo.ccProperty
          ( 
            prop_id
           ,prop_val_yr
           ,sup_num
           ,mobile_assignment_group_id   
          )

         select distinct 
                qp.prop_id
               ,@yr as prop_val_yr
               ,0 as sup_num
               ,'CAD' as mobile_assignment_group_id
          from #qualified_properties as qp
               left join
               dbo.ccProperty as cc
            on qp.prop_id = cc.prop_id
         where cc.prop_id is null -- only those not in ccProperty

        -- logging end of step 
        SELECT @LogTotRows = @@ROWCOUNT, 
               @LogErrCode = @@ERROR 
           SET @LogSeconds = datediff(s,@StartStep,getdate())
           SET @StepMsg =  'Step 6.1 Insert missing qualified properties to ccProperty End '
        exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                          @status_msg = @StepMsg,
                                          @row_count = @LogTotRows,
                                          @err_status = @LogErrCode,
                                          @duration_in_seconds = @LogSeconds

        select @NewCloudProperties = @NewCloudProperties + @LogTotRows

  end
else
  begin
       SET @LogSeconds = datediff(s,@StartStep,getdate())
       SET @StepMsg =  'Step 6.1.1 Bypass of Insert missing qualified properties to ccProperty due to run setting of ' + @insert_all_qualified_properties_to_ccProperty
       exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                      @status_msg = @StepMsg,
                                      @row_count = @LogTotRows,
                                      @err_status = @LogErrCode,
                                      @duration_in_seconds = @LogSeconds

  
  end  

set @StepMsg = 'Step 6.2 Remove unqualified properties from ccProperty '
set @StartStep = getdate()  --logging capture start time of step


delete cc
  from #qualified_properties as qp
       right join
       dbo.ccProperty as cc
    on qp.prop_id = cc.prop_id
 where qp.prop_id is null -- only those not in #qualified_properties

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 6.2 Remove unqualified properties from ccProperty End '
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds
                                                                                                                                         
set @StepMsg = 'Step 7 Exec compare proc for ccProperty '
set @StartStep = getdate()  --logging capture start time of step
   
-- after ccProperty inserts, run proc to check for changes for ccProperty

SELECT  @data_type_id = data_type_id
        ,@data_desc = data_desc
		,@compare_proc_name = compare_proc_name
    FROM dbo.ccChecksum_TrackedData
WHERE data_type_id = @ccProperty_data_type_id 

set @sql = 'exec @ret =  ' + @compare_proc_name 
             + ' @run_type = ' + convert(varchar(20),@run_type)
             + ' ,@yr = '  + convert(varchar(4),@yr)
             + ' ,@run_id = '  + convert(varchar(35),@run_id)
             + ' ,@data_type_id = '  + convert(varchar(4),@data_type_id)
             + ' ,@debug = '  + convert(varchar(4),@debug)
    
if @debug = 1
    begin 
    print @CRLF + @CRLF + '******* START OF PROCEDURE ' + @compare_proc_name  + ' *******' + @CRLF + @CRLF
    print @sql
    end

exec sp_executesql @sql ,N'@ret int OUT', @ret OUT 

if @ret <> 0   
begin
    set @error = 1
end  

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 7 Exec compare proc for ccProperty End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

set @StepMsg = 'Step 8 Update inserted to queue flag '
set @StartStep = getdate()  --logging capture start time of step
   
-- update run detail with those to be inserted to queue
-- at this point all prop_id that are supposed to be in ccProperty should be there, so join on ccProperty 
-- to identify those to send.  We don't want to send if they are not in ccProperty at this point.
update rd
   set inserted_to_queue_table = 1
  from dbo.ccCheckSum_Compare_RunInfo_Details as rd
       join
       dbo.ccProperty as cp
    on rd.prop_id = cp.prop_id
        left join 
        ccUpSyncQueue as q
     on rd.prop_id = q.prop_id
  where rd.run_id = @run_id
    and valid_for_cloud = 1
    and q.prop_id is null  
  and rd.data_type_id not in(@pacs_user_data_type_id ,@main_image_data_type_id)

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 8 Update inserted to queue flag End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

set @StepMsg = 'Step 9 Insert ccUpSyncQueue '
set @StartStep = getdate()  --logging capture start time of step
      
-- insert valid props into queue table
insert into ccUpSyncQueue(prop_id, isNew, run_id)
select n.prop_id,max(n.new_for_cloud), max(n.run_id)
from
(
  select distinct rd.prop_id,convert(int,isnull(rd.new_for_cloud,0)) as new_for_cloud, rd.run_id
    from dbo.ccCheckSum_Compare_RunInfo_Details as rd
         left join 
         dbo.ccUpSyncQueue as q
      on rd.prop_id = q.prop_id
   where rd.run_id = @run_id
     and rd.valid_for_cloud = 1
     and rd.inserted_to_queue_table = 1  --flag updated in prior step to identify those to send to cloud
     and q.prop_id is null -- do not insert if already in queue
  and rd.data_type_id not in(@pacs_user_data_type_id ,@main_image_data_type_id,@ccProperty_data_type_id)
         UNION -- want to also insert just the new props in ccProperty
  select distinct rd.prop_id,convert(int,isnull(rd.new_for_cloud,0)) as new_for_cloud, rd.run_id
    from dbo.ccCheckSum_Compare_RunInfo_Details as rd
         left join 
         dbo.ccUpSyncQueue as q
      on rd.prop_id = q.prop_id
   where rd.run_id = @run_id
     and rd.data_type_id = @ccProperty_data_type_id  --ccProperty only
     and rd.valid_for_cloud = 1  -- this value is set in compare proc for this table
     and rd.new_for_cloud = 1  -- this value is set in compare proc for this table
     and q.prop_id is null -- do not insert if already in queue       
	) as n
group by n.prop_id
 
select @PropertyQueueInserts = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
-- logging end of step 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 9 Insert ccUpSyncQueue End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @PropertyQueueInserts,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds


set @StepMsg = 'Step 10 Insert ccUserSyncQueue'
set @StartStep = getdate()  --logging capture start time of step

-- now process pacs_user data
declare @ccUser table
       (pacs_user_id int NOT NULL,
	    pacs_user_name varchar(30) NULL,
	    [password] binary(20) NULL,
	    action_type varchar(1) NOT NULL,
	    run_id int
	    )
insert into @ccUser
 (pacs_user_id,pacs_user_name,[password],action_type, run_id)
  select rd.pacs_user_id
         ,coalesce(pu.pacs_user_name,rd.pacs_user_name)
         ,pu.[password_hash]
         ,case isNew when 1 then 'I' 
           else case isDel when 1 then 'D' else 'U' end
          end
         ,rd.run_id
    from dbo.ccCheckSum_Compare_RunInfo_Details as rd
         left join   
         dbo.pacs_user as pu
      on rd.pacs_user_id = pu.pacs_user_id
   where rd.run_id = @run_id
     and valid_for_cloud = 1
     and rd.data_type_id = @pacs_user_data_type_id -- only pacs_user records


insert into dbo.ccUserSyncQueue
   (pacs_user_id,pacs_user_name,[password],action_type, run_id)
   select  distinct 
           rd.pacs_user_id,rd.pacs_user_name,rd.[password],rd.action_type, rd.run_id
     from @ccUser as rd
         left join
         dbo.ccUserSyncQueue as cc
      on rd.pacs_user_id = cc.pacs_user_id
     and rd.action_type = cc.action_type
   where cc.pacs_user_id IS NULL -- no duplicate user and action type
   
SELECT  @UserQueueInserts = @@ROWCOUNT,
        @LogErrCode = @@ERROR

-- logging end of step 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 10 Insert ccUserSyncQueue End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @UserQueueInserts,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds



set @StepMsg = 'Step 11 Deletes to TADM_CHANGE_TRACKING '  
set @StartStep = getdate()  --logging capture start time of step

insert into TADM_CHANGE_TRACKING 
(  tableName
  ,changeDate
  ,keyValues
  ,changeType
  ,[description]
  ,applicationName
  )

select t.data_desc as tableName
      ,@dt as changeDate 
      ,rd.PKValues as keyValues
      ,'D' as changeType
      ,@UserName as [description]
      ,@AppName as applicationName
 from dbo.ccCheckSum_Compare_RunInfo_Details as rd
      join 
      dbo.ccChecksum_TrackedData as t
   on rd.data_type_id = t.data_type_id
where rd.run_id = @run_id
  and rd.valid_for_cloud = 1
  and rd.isDel = 1
  and t.track_deletes = 1  
  and rd.data_type_id not in(@pacs_user_data_type_id ,@main_image_data_type_id)

select @DeleteQueueInserts = @@ROWCOUNT,
       @LogErrCode = @@ERROR

-- logging end of step 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 11 Deletes to TADM_CHANGE_TRACKING End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @DeleteQueueInserts,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds


set @StepMsg = 'Step 12 Inserts to ccImageUpSyncQueue '  
set @StartStep = getdate()  --logging capture start time of step

insert into dbo.ccImageUpSyncQueue
 (prop_id,image_path,main_image_flag, run_id)
  select distinct 
          rd.prop_id
         ,rd.image_path 
         ,1 as main_image_flag 
         ,rd.run_id
    from dbo.ccCheckSum_Compare_RunInfo_Details as rd
         join
         dbo.ccProperty as cc
      on rd.prop_id = cc.prop_id  -- make sure they are valid for cloud
         left join
         dbo.ccImageUpSyncQueue as iq
      on rd.prop_id = iq.prop_id
     and rd.image_path = iq.image_path
         
   where rd.run_id = @run_id
     and valid_for_cloud = 1
     and rd.data_type_id = @main_image_data_type_id -- only main_image records
     and len(isnull(rd.image_path,'')) > 1
     and iq.prop_id IS NULL -- do not duplicate anything already in queue table
     
select @MainImageQueueInserts = @@ROWCOUNT,
       @LogErrCode = @@ERROR

-- logging end of step 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 12 Inserts to ccImageUpSyncQueue End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @MainImageQueueInserts,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds

set @StepMsg = 'Step 13 Insert to ccAssignmentGroupQueue '  
set @StartStep = getdate()  --logging capture start time of step
                                  

--  ccAssignmentGroupQueue 
insert into dbo.ccAssignmentGroupQueue
   (prop_id, run_id, action_type)
  select  rd.prop_id
         ,rd.run_id
         ,case isNew when 1 then 'I' 
           else case isDel when 1 then 'D' else 'U' end
          end
    from dbo.ccCheckSum_Compare_RunInfo_Details as rd
         left join
         dbo.ccAssignmentGroupQueue as q
      on rd.prop_id = q.prop_id
     and rd.run_id = q.run_id         
   where rd.run_id = @run_id
     and rd.valid_for_cloud = 1
     and rd.data_type_id = @ccProperty_data_type_id -- only ccProperty records
     and q.prop_id is null -- no duplicates in queue table
   

-- logging end of step 
SELECT @ccAssignmentGroupQueueInserts = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 13 Insert to ccAssignmentGroupQueue End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @ccAssignmentGroupQueueInserts,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds 
                                  
set @StepMsg = 'Step 14 Update Run Record '  
set @StartStep = getdate()  --logging capture start time of step

-- update run record
declare @det_recs bigint
select @det_recs = count(*)
  from dbo.ccCheckSum_Compare_RunInfo_Details
 where run_id = @run_id
 
update dbo.ccCheckSum_Compare_RunInfo  
   set detail_record_count = isnull(@det_recs,0)
      ,PropertyQueueInserts = isnull(@PropertyQueueInserts,0) 
      ,DeleteQueueInserts = isnull(@DeleteQueueInserts,0)
      ,UserQueueInserts = isnull(@UserQueueInserts,0)
      ,NewCloudProperties = isnull(@NewCloudProperties,0)
      ,MainImageQueueInserts = isnull(@MainImageQueueInserts,0)
      ,end_time = getdate()
      ,ccAssignmentGroupQueueInserts = isnull(@ccAssignmentGroupQueueInserts,0)
      ,insert_all_qualified_properties_to_ccProperty_setting = @insert_all_qualified_properties_to_ccProperty
 where run_id = @run_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 14 Update Run Record End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds 
                                  
set @StepMsg = 'Step 15 Delete Old Run Info Records'  

declare @delete_date datetime
    set @delete_date = dateadd(d,-180,getdate())

declare @run_id_tbl table (run_id int)

insert into @run_id_tbl(run_id)
   select run_id 
     from dbo.ccCheckSum_Compare_RunInfo 
    where start_time < @delete_date 

delete d
from dbo.ccCheckSum_Compare_RunInfo_Details as d
     join 
     @run_id_tbl as t
  on d.run_id = t.run_id

delete d
from dbo.ccCheckSum_Compare_RunInfo as d
     join 
     @run_id_tbl as t
  on d.run_id = t.run_id

-- logging end of step 
SELECT @LogTotRows = @@ROWCOUNT, 
       @LogErrCode = @@ERROR 
   SET @LogSeconds = datediff(s,@StartStep,getdate())
   SET @StepMsg =  'Step 15 Delete Old Run Info Records End'
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StepMsg,
                                  @row_count = @LogTotRows,
                                  @err_status = @LogErrCode,
                                  @duration_in_seconds = @LogSeconds   

if @error = 1
   begin
      set @StartEndMsg = 'END: Error in compare procedure, check current_activity_log for more details'
   end
-- end of procedure update log
SET @LogSeconds = datediff(s,@StartProc,getdate())
exec dbo.CurrentActivityLogInsert @process_name = @proc,
                                  @status_msg = @StartEndMsg,
                                  @row_count = @@ROWCOUNT,
                                  @err_status = @error,
                                  @duration_in_seconds = @LogSeconds

if @error = 1
   begin
      RAISERROR(@StartEndMsg , 16, 1) 
   end

GO

