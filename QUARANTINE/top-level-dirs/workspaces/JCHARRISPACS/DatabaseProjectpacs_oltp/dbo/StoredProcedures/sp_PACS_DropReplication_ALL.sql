
create procedure dbo.sp_PACS_DropReplication_ALL
   @ReplicationType varchar(30) -- valid values= 'online appeals' or 'pacs'
AS 

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(1000)
 declare @proc varchar(100)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc  
 + ' @ReplicationType =' + @ReplicationType 
 
 exec dbo.CurrentActivityLogInsert @proc, @qry

/* End top of each procedure to capture parameters */
 
declare @pub_prefix table(pub_prefix varchar(20))
   insert into @pub_prefix
      select publication_prefix + '%' 
        from dbo.pacs_supported_replication_publication_prefix
       where publication_type = @ReplicationType

declare @rep_tables table (Id int identity(1,1),
                           szPubName sysname,szTableName sysname null)

insert into @rep_tables(szPubName,szTableName)
select distinct spub.name,sart.name 
  from sysarticles as sart
       right join   -- just in case publications without articles
       syspublications as spub 
    on sart.pubid = spub.pubid
       join
       @pub_prefix p
    on spub.name like p.pub_prefix

if @@rowcount = 0
   begin
     exec dbo.CurrentActivityLogInsert @proc, 'Info: There were no pacs supported replicated tables found',@@ROWCOUNT,@@ERROR
     RAISERROR('sp_PACS_DropReplication_ALL Info: There were no pacs supported replicated tables found.' , 0, 1) WITH NOWAIT
     return 0
   end


declare @szTableName sysname
declare @szPubName sysname
declare @ret int

declare @loop_counter int
declare @min_id int

set @loop_counter = (select count(*) from @rep_tables)

set @loop_counter = coalesce(@loop_counter,0)

while @loop_counter > 0
  begin
    set  @min_id = (select min(Id) from @rep_tables)

	select @szTableName = szTableName,
           @szPubName = szPubName
	  from @rep_tables 
     where Id = @min_id 
 
    if len(@szPubName) > 0 and len(isnull(@szTableName,'')) = 0
       begin
         -- straggler publication, remove it
         exec @ret =  sp_droppublication
		                  @publication = @szPubName
         if @ret <> 0
            begin
             -- show fail message, and continue
              exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable to remove straggler PACS publication',@@ROWCOUNT,@@ERROR
	          RAISERROR('sp_PACS_DropReplication_ALL Info: Error removing straggler PACS publication : %s which contained no published articles' , 0, 1,@szPubName) WITH NOWAIT
            end 
         else
            begin
             -- show success message, and continue
              exec dbo.CurrentActivityLogInsert @proc, 'Info: Removed straggler PACS publication',@@ROWCOUNT,@@ERROR
	          RAISERROR('sp_PACS_DropReplication_ALL Info: Removed straggler PACS publication : %s which contained no published articles' , 0, 1,@szPubName) WITH NOWAIT
            end 
       end
    else
		if len(@szPubName) > 0
		   begin
			  exec @ret = dbo.sp_PACS_DropSinglePublication @szPubName

			if @ret <> 0 
				begin
                  exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable Unable to drop publication',@@ROWCOUNT,@@ERROR
				  RAISERROR('sp_PACS_DropReplication_ALL Error: Unable to drop publication for table: %s' , 16, 1,@szTableName) WITH NOWAIT
				  return -1
			    end
			end

     -- delete from table used for looping
     delete from @rep_tables where id = @min_id  

     -- decrement counter to end while loop
	 set @loop_counter = @loop_counter - 1

  end -- while @loop_counter > 0 end

-- final message -- success!
exec dbo.CurrentActivityLogInsert @proc, 'Info: Success!',@@ROWCOUNT,@@ERROR

RAISERROR('sp_PACS_DropReplication_ALL Info: Success!' , 0, 1) WITH NOWAIT

GO

