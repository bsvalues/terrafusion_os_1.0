
/*
 * This procedure builds the web_internet_<countyname> database for the
 * True Automation PropertyAccess website.  Formerly ClientDB.
 */

CREATE PROCEDURE [dbo].[ExportPropertyAccessReplicate]

@input_database_name	varchar(50) = ''

WITH RECOMPILE

AS


declare @sql varchar(8000)

declare @log_id int
declare @subscriber_server varchar(255)
declare @distributor_server varchar(255)

-- Get subscriber and date of last export.
select @subscriber_server = szConfigValue from pacs_config where szGroup = 'Property Access' and szConfigName = 'Subscriber'
select @log_id = max(id) from _clientdb_log

if (select category from master..sysdatabases where name = @input_database_name) > 0 and
	(@subscriber_server is not null)
begin
	if not exists (select * from _clientdb_log where id = @log_id and error <> 0)
	begin
		-- Start: Run Snap shot
		print 'Running Snapshot'
		-- Start snap shot
		select @distributor_server = RTRIM (srvnetname)
		from master.dbo.sysservers
		where dist = 1
		
		
		-- Check for subscription before publishing.
		set @sql = '
			DECLARE @jobid uniqueidentifier
			select @jobid = convert(uniqueidentifier, snapshot_jobid) from ' + @input_database_name + '..syspublications where name = ''' + @input_database_name + '''
			--exec [' + @distributor_server + '].msdb..sp_start_job @job_id = @jobid
			xp_cmdshell ''osql -S ' + @distributor_server + ' -d msdb -E -Q "exec msdb..sp_start_job @job_id = @jobid"''
			'
		--exec (@sql)
		
		--  Running sp_start job through compand prompt "osql" to avoid problems with Remote Servers
		set @sql = '
			DECLARE @jobid varchar(100)
			declare @sql varchar(8000)
			select @jobid = convert(uniqueidentifier, snapshot_jobid) from ' + @input_database_name + '..syspublications where name = ''' + @input_database_name + '''
			set @sql = ''
				master..xp_cmdshell ''''osql -S ' + @distributor_server + ' -d msdb -E -Q "exec msdb..sp_start_job @job_id = ''''''''''  + @jobid +   ''''''''''"''''
				    ''
			exec (@sql)
			'
		exec (@sql)
		

			
		print '    Done Running Snapshot at ' + convert(varchar(30), getdate(), 109)
		-- Stop: Run Snap shot
	end
	else
	begin
		RAISERROR ('Errors in export: Snapshot NOT run', 16, 1) 
	end
end
else
begin
	RAISERROR ('Database not configured for Replication: Snapshot NOT run', 16, 1) 
	Return -1
end

GO

