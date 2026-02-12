CREATE TABLE [dbo].[_arb_protest_reason] (
    [prop_id]     INT          NOT NULL,
    [prop_val_yr] INT          NOT NULL,
    [case_id]     INT          NOT NULL,
    [reason_cd]   VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK__arb_protest_reason] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [case_id] ASC, [reason_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK__arb_protest_reason_reason_cd] FOREIGN KEY ([reason_cd]) REFERENCES [dbo].[_arb_protest_reason_cd] ([reason_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_reason_cd]
    ON [dbo].[_arb_protest_reason]([reason_cd] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr__arb_protest_reason_insert_ChangeLog
on _arb_protest_reason
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
 
declare @prop_id int
declare @prop_val_yr int
declare @case_id int
declare @reason_cd varchar(10)
 
declare curRows cursor
for
     select prop_id, prop_val_yr, case_id, reason_cd from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @case_id, @reason_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @case_id) + '-' + convert(varchar(4), @prop_val_yr)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_reason' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 38, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), @prop_val_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @reason_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_reason' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 38, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), @prop_val_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @reason_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_reason' and
               chg_log_columns = 'case_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 38, 612, null, convert(varchar(255), @case_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), @prop_val_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @reason_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_reason' and
               chg_log_columns = 'reason_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 38, 4308, null, convert(varchar(255), @reason_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), @prop_val_yr)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @reason_cd), 0)
     end
 
     fetch next from curRows into @prop_id, @prop_val_yr, @case_id, @reason_cd
end
 
close curRows
deallocate curRows

GO



create trigger tr__arb_protest_reason_update_ChangeLog
on _arb_protest_reason
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
 
declare @old_prop_id int
declare @new_prop_id int
declare @old_prop_val_yr int
declare @new_prop_val_yr int
declare @old_case_id int
declare @new_case_id int
declare @old_reason_cd varchar(10)
declare @new_reason_cd varchar(10)
 
declare curRows cursor
for
     select d.prop_id, d.prop_val_yr, d.case_id, d.reason_cd, i.prop_id, i.prop_val_yr, i.case_id, i.reason_cd
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.prop_val_yr = i.prop_val_yr and
     d.case_id = i.case_id and
     d.reason_cd = i.reason_cd
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_case_id, @old_reason_cd, @new_prop_id, @new_prop_val_yr, @new_case_id, @new_reason_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @new_case_id) + '-' + convert(varchar(4), @new_prop_val_yr)
 
     if (
          @old_prop_id <> @new_prop_id
          or
          ( @old_prop_id is null and @new_prop_id is not null ) 
          or
          ( @old_prop_id is not null and @new_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_reason' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 38, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), @new_prop_val_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @new_reason_cd), 0)
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
                    chg_log_tables = '_arb_protest_reason' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 38, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), @new_prop_val_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @new_reason_cd), 0)
          end
     end
 
     if (
          @old_case_id <> @new_case_id
          or
          ( @old_case_id is null and @new_case_id is not null ) 
          or
          ( @old_case_id is not null and @new_case_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_reason' and
                    chg_log_columns = 'case_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 38, 612, convert(varchar(255), @old_case_id), convert(varchar(255), @new_case_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), @new_prop_val_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @new_reason_cd), 0)
          end
     end
 
     if (
          @old_reason_cd <> @new_reason_cd
          or
          ( @old_reason_cd is null and @new_reason_cd is not null ) 
          or
          ( @old_reason_cd is not null and @new_reason_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_reason' and
                    chg_log_columns = 'reason_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 38, 4308, convert(varchar(255), @old_reason_cd), convert(varchar(255), @new_reason_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), @new_prop_val_yr)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @new_reason_cd), 0)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_prop_val_yr, @old_case_id, @old_reason_cd, @new_prop_id, @new_prop_val_yr, @new_case_id, @new_reason_cd
end
 
close curRows
deallocate curRows

GO



create trigger tr__arb_protest_reason_delete_ChangeLog
on _arb_protest_reason
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
          chg_log_tables = '_arb_protest_reason' and
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
 
declare @prop_id int
declare @prop_val_yr int
declare @case_id int
declare @reason_cd varchar(10)
 
declare curRows cursor
for
     select prop_id, prop_val_yr, case_id, reason_cd from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @prop_val_yr, @case_id, @reason_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @case_id) + '-' + convert(varchar(4), @prop_val_yr)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 38, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), @prop_val_yr)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4308, convert(varchar(24), @reason_cd), 0)
 
     fetch next from curRows into @prop_id, @prop_val_yr, @case_id, @reason_cd
end
 
close curRows
deallocate curRows

GO

