CREATE TABLE [dbo].[effective_acres_group] (
    [group_id]    INT             NOT NULL,
    [prop_val_yr] NUMERIC (4)     NOT NULL,
    [description] VARCHAR (100)   NULL,
    [acreage]     NUMERIC (14, 4) NULL,
    [created_dt]  DATETIME        NOT NULL,
    [created_by]  INT             NOT NULL,
    CONSTRAINT [CPK_effective_acres_group] PRIMARY KEY CLUSTERED ([group_id] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_effective_acres_group_delete_ChangeLog
on effective_acres_group
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
          chg_log_tables = 'effective_acres_group' and
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
 
declare @group_id int
declare @prop_val_yr numeric(4,0)
 
declare curRows cursor
for
     select group_id, prop_val_yr from deleted
for read only
 
open curRows
fetch next from curRows into @group_id, @prop_val_yr
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 847, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @group_id, @prop_val_yr
end
 
close curRows
deallocate curRows

GO



create trigger tr_effective_acres_group_insert_ChangeLog
on effective_acres_group
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
 
declare @group_id int
declare @prop_val_yr numeric(4,0)
declare @description varchar(100)
declare @acreage numeric(14,4)
declare @created_dt datetime
declare @created_by int
 
declare curRows cursor
for
     select group_id, prop_val_yr, description, acreage, created_dt, created_by from inserted
for read only
 
open curRows
fetch next from curRows into @group_id, @prop_val_yr, @description, @acreage, @created_dt, @created_by
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_group' and
               chg_log_columns = 'group_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 847, 2033, null, convert(varchar(255), @group_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_group' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 847, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_group' and
               chg_log_columns = 'description' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 847, 1318, null, convert(varchar(255), @description), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_group' and
               chg_log_columns = 'acreage' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 847, 6008, null, convert(varchar(255), @acreage), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_group' and
               chg_log_columns = 'created_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 847, 920, null, convert(varchar(255), @created_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'effective_acres_group' and
               chg_log_columns = 'created_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 847, 918, null, convert(varchar(255), @created_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @group_id), @group_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @group_id, @prop_val_yr, @description, @acreage, @created_dt, @created_by
end
 
close curRows
deallocate curRows

GO



create trigger tr_effective_acres_group_update_ChangeLog
on effective_acres_group
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
 
declare @old_group_id int
declare @new_group_id int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_description varchar(100)
declare @new_description varchar(100)
declare @old_acreage numeric(14,4)
declare @new_acreage numeric(14,4)
declare @old_created_dt datetime
declare @new_created_dt datetime
declare @old_created_by int
declare @new_created_by int
 
declare curRows cursor
for
     select d.group_id, d.prop_val_yr, d.description, d.acreage, d.created_dt, d.created_by, i.group_id, i.prop_val_yr, i.description, i.acreage, i.created_dt, i.created_by
from deleted as d
join inserted as i on 
     d.group_id = i.group_id and
     d.prop_val_yr = i.prop_val_yr
for read only
 
open curRows
fetch next from curRows into @old_group_id, @old_prop_val_yr, @old_description, @old_acreage, @old_created_dt, @old_created_by, @new_group_id, @new_prop_val_yr, @new_description, @new_acreage, @new_created_dt, @new_created_by
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_group_id <> @new_group_id
          or
          ( @old_group_id is null and @new_group_id is not null ) 
          or
          ( @old_group_id is not null and @new_group_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_group' and
                    chg_log_columns = 'group_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 847, 2033, convert(varchar(255), @old_group_id), convert(varchar(255), @new_group_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_prop_val_yr <> @new_prop_val_yr
          or
          ( @old_prop_val_yr is null and @new_prop_val_yr is not null ) 
          or
          ( @old_prop_val_yr is not null and @new_prop_val_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_group' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 847, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_description <> @new_description
          or
          ( @old_description is null and @new_description is not null ) 
          or
          ( @old_description is not null and @new_description is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_group' and
                    chg_log_columns = 'description' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 847, 1318, convert(varchar(255), @old_description), convert(varchar(255), @new_description) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_acreage <> @new_acreage
          or
          ( @old_acreage is null and @new_acreage is not null ) 
          or
          ( @old_acreage is not null and @new_acreage is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_group' and
                    chg_log_columns = 'acreage' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 847, 6008, convert(varchar(255), @old_acreage), convert(varchar(255), @new_acreage) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_created_dt <> @new_created_dt
          or
          ( @old_created_dt is null and @new_created_dt is not null ) 
          or
          ( @old_created_dt is not null and @new_created_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_group' and
                    chg_log_columns = 'created_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 847, 920, convert(varchar(255), @old_created_dt), convert(varchar(255), @new_created_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_created_by <> @new_created_by
          or
          ( @old_created_by is null and @new_created_by is not null ) 
          or
          ( @old_created_by is not null and @new_created_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'effective_acres_group' and
                    chg_log_columns = 'created_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 847, 918, convert(varchar(255), @old_created_by), convert(varchar(255), @new_created_by) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2033, convert(varchar(24), @new_group_id), @new_group_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_group_id, @old_prop_val_yr, @old_description, @old_acreage, @old_created_dt, @old_created_by, @new_group_id, @new_prop_val_yr, @new_description, @new_acreage, @new_created_dt, @new_created_by
end
 
close curRows
deallocate curRows

GO

