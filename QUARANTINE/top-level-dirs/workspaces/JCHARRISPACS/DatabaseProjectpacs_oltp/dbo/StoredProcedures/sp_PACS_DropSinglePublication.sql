
create procedure dbo.sp_PACS_DropSinglePublication
	@szPublicationName sysname
as

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @StartProc datetime
    SET @StartProc = getdate()
DECLARE @StartStep datetime
DECLARE @LogTotRows int
DECLARE @LogStatus varchar(200)
DECLARE @LogErrCode int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
  SET @qry = 'Start - ' + @proc  
 + ' @szPublicationName =' + @szPublicationName   
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

-- this procedure is used to drop a single publication and it's subscriptions
if not exists(select spub.name
                from syspublications as spub
               where spub.name = @szPublicationName
             )

   -- publication does not exists, exit
   begin
      exec dbo.CurrentActivityLogInsert @proc, 'Info: Publication does not exists',@@ROWCOUNT,@@ERROR
      RAISERROR('sp_PACS_DropSinglePublication Info: Publication %s does not exists.' , 0, 1,@szPublicationName) WITH NOWAIT
      return 0
   end


-- now drop  publication and subscriptions for this table
declare @ret int

exec @ret = sp_dropsubscription
	@publication = @szPublicationName,
	@article = 'all',
	@subscriber = 'all',
	@destination_db = null

if @ret <> 0 
	begin
    exec dbo.CurrentActivityLogInsert @proc, 'ERROR: Error dropping subscription(s), unable to drop replication',@@ROWCOUNT,@@ERROR
	RAISERROR('sp_PACS_DropSinglePublication Error: Error dropping subscription(s) on publication %s ' , 16, 1,@szPublicationName) WITH NOWAIT
	return -1
   end

exec @ret =  sp_droppublication
	@publication = @szPublicationName

if @ret <> 0 
	begin
    exec dbo.CurrentActivityLogInsert @proc, 'ERROR: Error dropping publication, unable to drop replication',@@ROWCOUNT,@@ERROR
	RAISERROR('sp_PACS_DropSinglePublication Error: Error dropping publication %s ' , 16, 1,@szPublicationName) WITH NOWAIT
	return -1
   end

exec dbo.CurrentActivityLogInsert @proc, 'Info: Successfully dropped publication',@@ROWCOUNT,@@ERROR


RAISERROR('sp_PACS_DropSinglePublication Info: Successfully dropped replication on publication %s ' , 0, 1,@szPublicationName) WITH NOWAIT

GO

