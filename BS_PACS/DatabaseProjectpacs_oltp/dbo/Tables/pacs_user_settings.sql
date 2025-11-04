CREATE TABLE [dbo].[pacs_user_settings] (
    [pacs_user_id]   INT           NOT NULL,
    [settings_group] VARCHAR (65)  NOT NULL,
    [name]           VARCHAR (65)  NOT NULL,
    [value]          VARCHAR (255) NULL,
    CONSTRAINT [CPK_pacs_user_settings] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [settings_group] ASC, [name] ASC) WITH (FILLFACTOR = 100)
);


GO




create trigger tr_pacs_user_settings_update_ChangeLog
on pacs_user_settings
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
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
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
 
declare @old_pacs_user_id int
declare @new_pacs_user_id int
declare @old_settings_group varchar(65)
declare @new_settings_group varchar(65)
declare @old_name varchar(65)
declare @new_name varchar(65)
declare @old_value varchar(255)
declare @new_value varchar(255)
 
declare curRows cursor
for
     select d.pacs_user_id, d.settings_group, d.name, d.value, i.pacs_user_id, i.settings_group, i.name, i.value
from deleted as d
join inserted as i on 
     d.pacs_user_id = i.pacs_user_id and
     d.settings_group = i.settings_group and
     d.name = i.name
for read only
 
open curRows
fetch next from curRows into @old_pacs_user_id, @old_settings_group, @old_name, @old_value, @new_pacs_user_id, @new_settings_group, @new_name, @new_value
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_pacs_user_id <> @new_pacs_user_id
          or
          ( @old_pacs_user_id is null and @new_pacs_user_id is not null ) 
          or
          ( @old_pacs_user_id is not null and @new_pacs_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_user_settings' and
                    chg_log_columns = 'pacs_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1012, 3525, convert(varchar(255), @old_pacs_user_id), convert(varchar(255), @new_pacs_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3525, convert(varchar(24), @new_pacs_user_id), @new_pacs_user_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8968, convert(varchar(24), @new_settings_group), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3217, convert(varchar(24), @new_name), 0)
          end
     end
 
     if (
          @old_settings_group <> @new_settings_group
          or
          ( @old_settings_group is null and @new_settings_group is not null ) 
          or
          ( @old_settings_group is not null and @new_settings_group is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_user_settings' and
                    chg_log_columns = 'settings_group' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1012, 8968, convert(varchar(255), @old_settings_group), convert(varchar(255), @new_settings_group), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3525, convert(varchar(24), @new_pacs_user_id), @new_pacs_user_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8968, convert(varchar(24), @new_settings_group), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3217, convert(varchar(24), @new_name), 0)
          end
     end
 
     if (
          @old_name <> @new_name
          or
          ( @old_name is null and @new_name is not null ) 
          or
          ( @old_name is not null and @new_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_user_settings' and
                    chg_log_columns = 'name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1012, 3217, convert(varchar(255), @old_name), convert(varchar(255), @new_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3525, convert(varchar(24), @new_pacs_user_id), @new_pacs_user_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8968, convert(varchar(24), @new_settings_group), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3217, convert(varchar(24), @new_name), 0)
          end
     end
 
     if (
          @old_value <> @new_value
          or
          ( @old_value is null and @new_value is not null ) 
          or
          ( @old_value is not null and @new_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_user_settings' and
                    chg_log_columns = 'value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1012, 5481, convert(varchar(255), @old_value), convert(varchar(255), @new_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3525, convert(varchar(24), @new_pacs_user_id), @new_pacs_user_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8968, convert(varchar(24), @new_settings_group), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3217, convert(varchar(24), @new_name), 0)
          end
     end
 
     fetch next from curRows into @old_pacs_user_id, @old_settings_group, @old_name, @old_value, @new_pacs_user_id, @new_settings_group, @new_name, @new_value
end
 
close curRows
deallocate curRows

GO




create trigger tr_pacs_user_settings_insert_ChangeLog
on pacs_user_settings
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
declare @tvar_key_year int
select @tvar_lFutureYear = future_yr, @tvar_key_year = appr_yr
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
 
declare @pacs_user_id int
declare @settings_group varchar(65)
declare @name varchar(65)
declare @value varchar(255)
 
declare curRows cursor
for
     select pacs_user_id, settings_group, name, value from inserted
for read only
 
open curRows
fetch next from curRows into @pacs_user_id, @settings_group, @name, @value
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_user_settings' and
               chg_log_columns = 'pacs_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1012, 3525, null, convert(varchar(255), @pacs_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3525, convert(varchar(24), @pacs_user_id), @pacs_user_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8968, convert(varchar(24), @settings_group), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3217, convert(varchar(24), @name), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_user_settings' and
               chg_log_columns = 'settings_group' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1012, 8968, null, convert(varchar(255), @settings_group), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3525, convert(varchar(24), @pacs_user_id), @pacs_user_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8968, convert(varchar(24), @settings_group), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3217, convert(varchar(24), @name), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_user_settings' and
               chg_log_columns = 'name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1012, 3217, null, convert(varchar(255), @name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3525, convert(varchar(24), @pacs_user_id), @pacs_user_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8968, convert(varchar(24), @settings_group), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3217, convert(varchar(24), @name), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pacs_user_settings' and
               chg_log_columns = 'value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1012, 5481, null, convert(varchar(255), @value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3525, convert(varchar(24), @pacs_user_id), @pacs_user_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8968, convert(varchar(24), @settings_group), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3217, convert(varchar(24), @name), 0)
     end
 
     fetch next from curRows into @pacs_user_id, @settings_group, @name, @value
end
 
close curRows
deallocate curRows

GO

