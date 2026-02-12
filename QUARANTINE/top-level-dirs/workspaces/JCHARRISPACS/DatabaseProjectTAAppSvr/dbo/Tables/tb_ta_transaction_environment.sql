CREATE TABLE [dbo].[tb_ta_transaction_environment] (
    [lEnvironmentID]        TINYINT       NOT NULL,
    [szEnvironmentName]     VARCHAR (63)  NOT NULL,
    [szEnvironmentPath]     VARCHAR (255) NOT NULL,
    [szSQLServerName]       VARCHAR (128) NOT NULL,
    [szSQLServerDBName]     VARCHAR (128) NOT NULL,
    [szSQLServerLogin]      VARCHAR (128) NOT NULL,
    [szSQLServerPassword]   VARCHAR (128) NOT NULL,
    [bEnabled]              BIT           NOT NULL,
    [szVersion]             VARCHAR (23)  NULL,
    [szSQLLoginNonPrivy]    VARCHAR (128) NOT NULL,
    [szSQLPasswordNonPrivy] VARCHAR (128) NOT NULL,
    [szType]                VARCHAR (23)  NULL,
    CONSTRAINT [CPK_tb_ta_transaction_environment] PRIMARY KEY CLUSTERED ([lEnvironmentID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_tb_ta_transaction_environment_lEnvironmentID] CHECK ([lEnvironmentID]>(-1) AND [lEnvironmentID]<(248))
);


GO


create trigger tr_tb_ta_transaction_environment_update
on tb_ta_transaction_environment
for update
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on

	declare @szTable sysname
	set @szTable = 'tb_ta_transaction_environment'

	declare @szRefID varchar(511)
	
	declare
		@lEnvironmentID tinyint,
		@old_szEnvironmentName varchar(63),
		@old_szSQLServerName varchar(128),
		@old_szSQLServerDBName varchar(128),
		@new_szEnvironmentName varchar(63),
		@new_szSQLServerName varchar(128),
		@new_szSQLServerDBName varchar(128)
	
	declare curRows cursor
	for
		select
			d.lEnvironmentID,
			d.szEnvironmentName, d.szSQLServerName, d.szSQLServerDBName,
			i.szEnvironmentName, i.szSQLServerName, i.szSQLServerDBName
		from deleted as d
		join inserted as i on
			i.lEnvironmentID = d.lEnvironmentID
	for read only

	open curRows
	fetch next from curRows into
		@lEnvironmentID,
		@old_szEnvironmentName, @old_szSQLServerName, @old_szSQLServerDBName,
		@new_szEnvironmentName, @new_szSQLServerName, @new_szSQLServerDBName
	
	while ( @@fetch_status = 0 )
	begin
		
		set @szRefID = 'EnvID: ' + convert(varchar(3), @lEnvironmentID)
		
		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('U', @szTable, 'szEnvironmentName', @old_szEnvironmentName, @new_szEnvironmentName, @szRefID)
		
		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('U', @szTable, 'szSQLServerName', @old_szSQLServerName, @new_szSQLServerName, @szRefID)

		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('U', @szTable, 'szSQLServerDBName', @old_szSQLServerDBName, @new_szSQLServerDBName, @szRefID)

		fetch next from curRows into
			@lEnvironmentID,
			@old_szEnvironmentName, @old_szSQLServerName, @old_szSQLServerDBName,
			@new_szEnvironmentName, @new_szSQLServerName, @new_szSQLServerDBName
	end
	
	close curRows
	deallocate curRows

GO


create trigger tr_tb_ta_transaction_environment_delete
on tb_ta_transaction_environment
for delete
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on

	declare @szTable sysname
	set @szTable = 'tb_ta_transaction_environment'

	declare @szRefID varchar(511)
	
	declare
		@lEnvironmentID tinyint,
		@szEnvironmentName varchar(63),
		@szSQLServerName varchar(128),
		@szSQLServerDBName varchar(128)
	
	declare curRows cursor
	for
		select lEnvironmentID, szEnvironmentName, szSQLServerName, szSQLServerDBName
		from deleted
	for read only

	open curRows
	fetch next from curRows into @lEnvironmentID, @szEnvironmentName, @szSQLServerName, @szSQLServerDBName
	
	while ( @@fetch_status = 0 )
	begin
		
		set @szRefID = 'EnvID: ' + convert(varchar(3), @lEnvironmentID)
		
		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('D', @szTable, 'szEnvironmentName', @szEnvironmentName, null, @szRefID)
		
		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('D', @szTable, 'szSQLServerName', @szSQLServerName, null, @szRefID)

		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('D', @szTable, 'szSQLServerDBName', @szSQLServerDBName, null, @szRefID)

		fetch next from curRows into @lEnvironmentID, @szEnvironmentName, @szSQLServerName, @szSQLServerDBName
	end
	
	close curRows
	deallocate curRows

GO


create trigger tr_tb_ta_transaction_environment_insert
on tb_ta_transaction_environment
for insert
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on

	declare @szTable sysname
	set @szTable = 'tb_ta_transaction_environment'

	declare @szRefID varchar(511)
	
	declare
		@lEnvironmentID tinyint,
		@szEnvironmentName varchar(63),
		@szSQLServerName varchar(128),
		@szSQLServerDBName varchar(128)
	
	declare curRows cursor
	for
		select lEnvironmentID, szEnvironmentName, szSQLServerName, szSQLServerDBName
		from inserted
	for read only

	open curRows
	fetch next from curRows into @lEnvironmentID, @szEnvironmentName, @szSQLServerName, @szSQLServerDBName
	
	while ( @@fetch_status = 0 )
	begin
		
		set @szRefID = 'EnvID: ' + convert(varchar(3), @lEnvironmentID)
		
		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('I', @szTable, 'szEnvironmentName', null, @szEnvironmentName, @szRefID)
		
		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('I', @szTable, 'szSQLServerName', null, @szSQLServerName, @szRefID)

		insert dbo.tb_ta_log_change (szChangeType, szTable, szColumn, szOldValue, szNewValue, szRefID)
		values ('I', @szTable, 'szSQLServerDBName', null, @szSQLServerDBName, @szRefID)

		fetch next from curRows into @lEnvironmentID, @szEnvironmentName, @szSQLServerName, @szSQLServerDBName
	end
	
	close curRows
	deallocate curRows

GO

