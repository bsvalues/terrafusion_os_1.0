
create procedure dbo.sp_DropTableReplication
	@szTableName sysname
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
 + ' @szTableName =' + @szTableName   
 exec dbo.CurrentActivityLogInsert @proc, @qry
 
-- set variable for final status entry
 set @qry = @qry + ' Total Duration in secs: '
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
 

-- this procedure is used to drop only pacs supported table replication
-- if client is not using the supported version and replication 
-- needs to be dropped on a table - the client should do it themselves
-- to ensure they are aware and that we don't drop incorrectly.

if not exists (
	select *
	from sysobjects
	where name = @szTableName
      and xtype = 'U'
)
begin
    exec dbo.CurrentActivityLogInsert @proc, 'Info: Table did not exists',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_DropTableReplication Info: Table %s does not exists in this database.' , 0, 1,@szTableName) WITH NOWAIT
    return -1
end

declare @replicated bit
    set @replicated = (select dbo.fn_IsTableReplicated(@szTableName))

if @replicated = 0  -- table is not replicated, exit
   begin
      exec dbo.CurrentActivityLogInsert @proc, 'Info: Table is not replicated',@@ROWCOUNT,@@ERROR
      RAISERROR('sp_DropTableReplication Info: Table %s is not replicated.' , 0, 1,@szTableName) WITH NOWAIT
      return 0
   end


-- determine if this is a pacs supported replication, if not exit with error
-- if the publication name starts with the correc prefix and is the only article
-- for the publication - assume this is supported


declare @pubinfo table(pubid int,pubname sysname,prefix_compare varchar(255))
insert into @pubinfo(pubid,pubname,prefix_compare)
select distinct spub.pubid,spub.name
   ,replace(spub.name,@szTableName,'') 
  from sysarticles as sart
       join 
       syspublications as spub
    on sart.pubid = spub.pubid
 where sart.name = @szTableName

-- could be more than one publication on table, make sure
-- all have a prefix value that is considered PACS supported.
if exists(select * 
            from @pubinfo 
           where prefix_compare not in(select publication_prefix 
                                      from dbo.pacs_supported_replication_publication_prefix)
         )
   begin

    exec dbo.CurrentActivityLogInsert @proc, 'ERROR: At least one publication exists on table that does not have a supported prefix value',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_DropTableReplication Error: At least one publication exists on table that does not have a supported prefix value, unable to drop replication for Table: %s . Client will need to drop replication on this table before proceeding with upgrade.', 16, 1,@szTableName) WITH NOWAIT
    return -1
   end


-- make sure the publication only contains one article(table)
-- by querying for other table names in the publications


if exists(select p.pubname
			from sysarticles a
			     join
                 @pubinfo p
              on a.pubid = p.pubid
           where a.name <> @szTableName
         ) 
-- publication contains more than this table, not supported
   begin
    exec dbo.CurrentActivityLogInsert @proc, 'ERROR: A Publication contains more articles than this table, unable to drop replication',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_DropTableReplication Error: A Publication contains more articles than this table, unable to drop replication for Table: %s . Client will need to drop replication on this table before proceeding with upgrade.' , 16, 1,@szTableName) WITH NOWAIT
    return -1
   end

   
-- looks like we have a supported publication(s), 
-- gather required info for rebuild at end of upgrade

-- get distributor server name
declare @szDistServer varchar(255)
exec sp_helpdistributor @distributor = @szDistServer OUTPUT
if len(isnull(@szDistServer,'')) = 0
   begin
    exec dbo.CurrentActivityLogInsert @proc, 'ERROR: Unable to determine distributor server name, unable to drop replication',@@ROWCOUNT,@@ERROR
    RAISERROR('sp_DropTableReplication Error: Unable to determine distributor server name to drop replication for Table: %s' , 16, 1,@szTableName) WITH NOWAIT
    return -1
   end

-- Keep track of the subscriber info to the table
-- so that something can later add publications & subscriptions
insert dbo.replication_subscription_dropped 
      (szDistServer,
       szTableName, 
       szDestServer,
       szDestDB,
       publication_prefix)
select distinct  
       @szDistServer,
       @szTableName, 
       ssrv.srvname,
       ssub.dest_db,
       p.prefix_compare as publication_prefix
from syssubscriptions as ssub
join master.dbo.sysservers as ssrv on
	ssub.srvid = ssrv.srvid
join sysarticles as sart on
	ssub.artid = sart.artid
join syspublications as spub on
	sart.pubid = spub.pubid
join @pubinfo as p on
    p.pubid = spub.pubid

where
	sart.objid = object_id(@szTableName)

-- now drop pacs supported publication and subscriptions for this table

-- For each publication
declare @ret int
declare @loop_counter int
declare @min_id int
declare @szPublicationName sysname
declare @rep_publications table(Id int identity(1,1),pub_name sysname)

insert into @rep_publications(pub_name)
select distinct spub.name
  from syspublications as spub
       join 
       sysarticles as sart 
    on spub.pubid = sart.pubid
 where sart.objid = object_id(@szTableName)

set @loop_counter = @@ROWCOUNT

set @loop_counter = coalesce(@loop_counter,0)

while @loop_counter > 0
begin

    set @min_id = (select min(Id) from @rep_publications)

	set @szPublicationName = (select  pub_name
                                from @rep_publications where id = @min_id)

	exec @ret = sp_dropsubscription
		@publication = @szPublicationName,
		@article = 'all',
		@subscriber = 'all',
		@destination_db = null

    if @ret <> 0 
		begin
        exec dbo.CurrentActivityLogInsert @proc, 'ERROR: Error dropping subscription(s), unable to drop replication',@@ROWCOUNT,@@ERROR
		RAISERROR('sp_DropTableReplication Error: Error dropping subscription(s) on publication %s for Table: %s' , 16, 1,@szPublicationName,@szTableName) WITH NOWAIT
		return -1
	   end

	exec @ret =  sp_droppublication
		@publication = @szPublicationName

    if @ret <> 0 
		begin
        exec dbo.CurrentActivityLogInsert @proc, 'ERROR: Error dropping publication, unable to drop replication',@@ROWCOUNT,@@ERROR
		RAISERROR('sp_DropTableReplication Error: Error dropping publication %s for Table: %s' , 16, 1,@szPublicationName,@szTableName) WITH NOWAIT
		return -1
	   end

    delete from @rep_publications where Id = @min_id

	set @loop_counter = @loop_counter - 1
end

exec dbo.CurrentActivityLogInsert @proc, 'Info: Successfully dropped replication',@@ROWCOUNT,@@ERROR


RAISERROR('sp_DropTableReplication Info: Successfully dropped replication on publication %s for Table: %s' , 0, 1,@szPublicationName,@szTableName) WITH NOWAIT

GO

