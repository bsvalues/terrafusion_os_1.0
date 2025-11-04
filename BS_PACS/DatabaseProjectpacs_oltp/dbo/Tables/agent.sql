CREATE TABLE [dbo].[agent] (
    [agent_id]      INT          NOT NULL,
    [agent_cd]      VARCHAR (10) NULL,
    [arb_docket_id] INT          NULL,
    [inactive_flag] BIT          CONSTRAINT [CDF_agent_inactive_flag] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_agent] PRIMARY KEY CLUSTERED ([agent_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_agent_agent_id] FOREIGN KEY ([agent_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_agent_arb_docket_id] FOREIGN KEY ([arb_docket_id]) REFERENCES [dbo].[_arb_protest_hearing_docket] ([docket_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_arb_docket_id]
    ON [dbo].[agent]([arb_docket_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_agent_insert
	on agent
	for insert
as

set nocount on

	declare @lDocketID int

	select
		@lDocketID = arb_docket_id
	from inserted
	
	/* If the agent has a docket */
	if ( @lDocketID is not null )
	begin
		/* Maintain the count of assigned agents for the docket */
		update _arb_protest_hearing_docket with(rowlock) set
			assigned_agent_count = assigned_agent_count + 1
		where
			docket_id = @lDocketID
	end

set nocount off

GO



create trigger tr_agent_insert_ChangeLog
on agent
for insert
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
select @tvar_lFutureYear = future_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @agent_id int
declare @agent_cd varchar(10)
declare @arb_docket_id int
declare @inactive_flag bit
 
declare curRows cursor
for
     select agent_id, agent_cd, arb_docket_id, inactive_flag from inserted
for read only
 
open curRows
fetch next from curRows into @agent_id, @agent_cd, @arb_docket_id, @inactive_flag
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent' and
               chg_log_columns = 'agent_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 72, 160, null, convert(varchar(255), @agent_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent' and
               chg_log_columns = 'agent_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 72, 157, null, convert(varchar(255), @agent_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent' and
               chg_log_columns = 'arb_docket_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 72, 297, null, convert(varchar(255), @arb_docket_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'agent' and
               chg_log_columns = 'inactive_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 72, 2335, null, convert(varchar(255), @inactive_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
     end
 
     fetch next from curRows into @agent_id, @agent_cd, @arb_docket_id, @inactive_flag
end
 
close curRows
deallocate curRows

GO



create trigger tr_agent_delete_ChangeLog
on agent
for delete
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
if not exists (
     select chg_log_audit
     from chg_log_columns with(nolock)
     where
          chg_log_tables = 'agent' and
          chg_log_audit = 1
)
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
select @tvar_lFutureYear = future_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @agent_id int
 
declare curRows cursor
for
     select agent_id from deleted
for read only
 
open curRows
fetch next from curRows into @agent_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 72, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @agent_id), @agent_id)
 
     fetch next from curRows into @agent_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_agent_delete
	on agent
	for delete
as

set nocount on

	declare @lDocketID int

	select
		@lDocketID = arb_docket_id
	from deleted
	
	/* If the agent was assigned a docket */
	if ( @lDocketID is not null )
	begin
		/* Maintain the count of assigned agents for the docket */
		update _arb_protest_hearing_docket with(rowlock) set
			assigned_agent_count = assigned_agent_count - 1
		where
			docket_id = @lDocketID
	end

set nocount off

GO



create trigger tr_agent_update
	on agent
	for update
as

set nocount on

	declare
		@lOldDocketID int,
		@lNewDocketID int

	select
		@lOldDocketID = arb_docket_id
	from deleted
	
	select
		@lNewDocketID = arb_docket_id
	from inserted

	/* If the agent's docket has changed */
	if (
		@lOldDocketID <> @lNewDocketID
		or
		(@lOldDocketID is null and @lNewDocketID is not null)
		or
		(@lOldDocketID is not null and @lNewDocketID is null)
	)
	begin
		/* Maintain the count of assigned agents for the docket(s) */
		if ( @lOldDocketID is not null )
		begin
			update _arb_protest_hearing_docket with(rowlock) set
				assigned_agent_count = assigned_agent_count - 1
			where
				docket_id = @lOldDocketID
		end

		if ( @lNewDocketID is not null )
		begin
			update _arb_protest_hearing_docket with(rowlock) set
				assigned_agent_count = assigned_agent_count + 1
			where
				docket_id = @lNewDocketID
		end
	end

set nocount off

GO


create trigger tr_agent_delete_insert_update_MemTable
on agent
for delete, insert, update
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end

set nocount on

update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'agent'

GO



create trigger tr_agent_update_ChangeLog
on agent
for update
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on
 
declare @tvar_lLogChanges int
declare @tvar_lPacsUserID int
exec GetMachineLogChanges @tvar_lLogChanges output, @tvar_lPacsUserID output
if ( @tvar_lLogChanges = 0 )
begin
     return
end
 
declare @tvar_dtNow datetime
set @tvar_dtNow = getdate()
 
declare @tvar_lChangeID int
 
declare @tvar_lFutureYear int
select @tvar_lFutureYear = future_yr
from pacs_system with(nolock)
if ( @tvar_lFutureYear is null )
begin
     set @tvar_lFutureYear = 0
end
 
declare @tvar_intMin numeric(28,0)
declare @tvar_intMax numeric(28,0)
set @tvar_intMin = -2147483649
set @tvar_intMax = 2147483648
 
declare @tvar_szRefID varchar(255)
 
declare @tvar_key_prop_id int
 
declare @old_agent_id int
declare @new_agent_id int
declare @old_agent_cd varchar(10)
declare @new_agent_cd varchar(10)
declare @old_arb_docket_id int
declare @new_arb_docket_id int
declare @old_inactive_flag bit
declare @new_inactive_flag bit
 
declare curRows cursor
for
     select d.agent_id, d.agent_cd, d.arb_docket_id, d.inactive_flag, i.agent_id, i.agent_cd, i.arb_docket_id, i.inactive_flag
from deleted as d
join inserted as i on 
     d.agent_id = i.agent_id
for read only
 
open curRows
fetch next from curRows into @old_agent_id, @old_agent_cd, @old_arb_docket_id, @old_inactive_flag, @new_agent_id, @new_agent_cd, @new_arb_docket_id, @new_inactive_flag
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_agent_id <> @new_agent_id
          or
          ( @old_agent_id is null and @new_agent_id is not null ) 
          or
          ( @old_agent_id is not null and @new_agent_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent' and
                    chg_log_columns = 'agent_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 72, 160, convert(varchar(255), @old_agent_id), convert(varchar(255), @new_agent_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
          end
     end
 
     if (
          @old_agent_cd <> @new_agent_cd
          or
          ( @old_agent_cd is null and @new_agent_cd is not null ) 
          or
          ( @old_agent_cd is not null and @new_agent_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent' and
                    chg_log_columns = 'agent_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 72, 157, convert(varchar(255), @old_agent_cd), convert(varchar(255), @new_agent_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
          end
     end
 
     if (
          @old_arb_docket_id <> @new_arb_docket_id
          or
          ( @old_arb_docket_id is null and @new_arb_docket_id is not null ) 
          or
          ( @old_arb_docket_id is not null and @new_arb_docket_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent' and
                    chg_log_columns = 'arb_docket_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 72, 297, convert(varchar(255), @old_arb_docket_id), convert(varchar(255), @new_arb_docket_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
          end
     end
 
     if (
          @old_inactive_flag <> @new_inactive_flag
          or
          ( @old_inactive_flag is null and @new_inactive_flag is not null ) 
          or
          ( @old_inactive_flag is not null and @new_inactive_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'agent' and
                    chg_log_columns = 'inactive_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 72, 2335, convert(varchar(255), @old_inactive_flag), convert(varchar(255), @new_inactive_flag) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 160, convert(varchar(24), @new_agent_id), @new_agent_id)
          end
     end
 
     fetch next from curRows into @old_agent_id, @old_agent_cd, @old_arb_docket_id, @old_inactive_flag, @new_agent_id, @new_agent_cd, @new_arb_docket_id, @new_inactive_flag
end
 
close curRows
deallocate curRows

GO

