
CREATE PROCEDURE dbo.sp_PACS_AddTableSubscription
   @szPubName sysname,
   @szDestServer sysname,
   @szDestDB sysname
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
 + ' @szPubName =' + @szPubName + ','
 + ' @szDestServer =' + @szDestServer + ','
 + ' @szDestDB =' + @szDestDB
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */

declare @ret int
-- this is the PACS supported subscription - one article(table) per publication
exec @ret = sp_addsubscription 
     @publication = @szPubName ,
     @article = N'all',
     @subscriber = @szDestServer,
	 @destination_db = @szDestDB,
	 @sync_type = N'automatic',
	 @update_mode = N'read only',
	 @offloadagent = 0,
	 @dts_package_location = N'distributor'

if @ret <> 0
   begin
     exec dbo.CurrentActivityLogInsert @proc, 'Error: Unable to create subscription',@@ROWCOUNT,@@ERROR
	 RAISERROR('sp_PACS_AddTableSubscription Error: Error creating subscription to publication %s on Server: %s Database: %s' , 16, 1,@szPubName,@szDestServer,@szDestDB) WITH NOWAIT
	 return -1
   end

GO

