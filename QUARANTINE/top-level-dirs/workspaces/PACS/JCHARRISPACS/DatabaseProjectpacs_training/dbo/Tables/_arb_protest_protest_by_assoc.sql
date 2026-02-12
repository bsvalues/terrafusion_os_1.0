CREATE TABLE [dbo].[_arb_protest_protest_by_assoc] (
    [case_id]           INT          NOT NULL,
    [prop_val_yr]       NUMERIC (4)  NOT NULL,
    [prop_id]           INT          NOT NULL,
    [prot_by_id]        INT          NOT NULL,
    [prot_by_id_type]   INT          NULL,
    [prot_by_type]      VARCHAR (10) NULL,
    [primary_protester] BIT          NULL,
    [withdrew]          BIT          NULL,
    [at_hearing]        BIT          NULL,
    [prot_by_create_dt] DATETIME     NOT NULL,
    CONSTRAINT [CPK__arb_protest_protest_by_assoc] PRIMARY KEY CLUSTERED ([case_id] ASC, [prop_val_yr] ASC, [prop_id] ASC, [prot_by_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK__arb_protest_protest_by_assoc_prop_id_prop_val_yr_case_id] FOREIGN KEY ([prop_id], [prop_val_yr], [case_id]) REFERENCES [dbo].[_arb_protest] ([prop_id], [prop_val_yr], [case_id]) NOT FOR REPLICATION,
    CONSTRAINT [CFK__arb_protest_protest_by_assoc_prot_by_type] FOREIGN KEY ([prot_by_type]) REFERENCES [dbo].[_arb_protest_by] ([protest_by_cd])
);


GO


create trigger tr__arb_protest_protest_by_assoc_delete_ChangeLog
on _arb_protest_protest_by_assoc
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
          chg_log_tables = '_arb_protest_protest_by_assoc' and
          chg_log_audit = 1
)
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
 
declare @case_id int
declare @prop_val_yr numeric(4,0)
declare @prop_id int
declare @prot_by_id int
 
declare curRows cursor
for
     select case_id, prop_val_yr, prop_id, prot_by_id from deleted
for read only
 
open curRows
fetch next from curRows into @case_id, @prop_val_yr, @prop_id, @prot_by_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1083, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
 
     fetch next from curRows into @case_id, @prop_val_yr, @prop_id, @prot_by_id
end
 
close curRows
deallocate curRows

GO


create trigger tr__arb_protest_protest_by_assoc_insert_ChangeLog
on _arb_protest_protest_by_assoc
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
 
declare @case_id int
declare @prop_val_yr numeric(4,0)
declare @prop_id int
declare @prot_by_id int
declare @prot_by_id_type int
declare @prot_by_type varchar(10)
declare @primary_protester bit
declare @withdrew bit
declare @at_hearing bit
declare @prot_by_create_dt datetime
 
declare curRows cursor
for
     select case_id, prop_val_yr, prop_id, prot_by_id, prot_by_id_type, prot_by_type, primary_protester, withdrew, at_hearing, prot_by_create_dt from inserted
for read only
 
open curRows
fetch next from curRows into @case_id, @prop_val_yr, @prop_id, @prot_by_id, @prot_by_id_type, @prot_by_type, @primary_protester, @withdrew, @at_hearing, @prot_by_create_dt
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'case_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 612, null, convert(varchar(255), @case_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'prot_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 4107, null, convert(varchar(255), @prot_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'prot_by_id_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 4108, null, convert(varchar(255), @prot_by_id_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'prot_by_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 4109, null, convert(varchar(255), @prot_by_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'primary_protester' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 9279, null, convert(varchar(255), @primary_protester), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'withdrew' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 9280, null, convert(varchar(255), @withdrew), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'at_hearing' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 9281, null, convert(varchar(255), @at_hearing), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = '_arb_protest_protest_by_assoc' and
               chg_log_columns = 'prot_by_create_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1083, 9282, null, convert(varchar(255), @prot_by_create_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @prot_by_id), @prot_by_id)
     end
 
     fetch next from curRows into @case_id, @prop_val_yr, @prop_id, @prot_by_id, @prot_by_id_type, @prot_by_type, @primary_protester, @withdrew, @at_hearing, @prot_by_create_dt
end
 
close curRows
deallocate curRows

GO


create trigger tr__arb_protest_protest_by_assoc_update_ChangeLog
on _arb_protest_protest_by_assoc
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
 
declare @old_case_id int
declare @new_case_id int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_prop_id int
declare @new_prop_id int
declare @old_prot_by_id int
declare @new_prot_by_id int
declare @old_prot_by_id_type int
declare @new_prot_by_id_type int
declare @old_prot_by_type varchar(10)
declare @new_prot_by_type varchar(10)
declare @old_primary_protester bit
declare @new_primary_protester bit
declare @old_withdrew bit
declare @new_withdrew bit
declare @old_at_hearing bit
declare @new_at_hearing bit
declare @old_prot_by_create_dt datetime
declare @new_prot_by_create_dt datetime
 
declare curRows cursor
for
     select d.case_id, d.prop_val_yr, d.prop_id, d.prot_by_id, d.prot_by_id_type, d.prot_by_type, d.primary_protester, d.withdrew, d.at_hearing, d.prot_by_create_dt, i.case_id, i.prop_val_yr, i.prop_id, i.prot_by_id, i.prot_by_id_type, i.prot_by_type, i.primary_protester, i.withdrew, i.at_hearing, i.prot_by_create_dt
from deleted as d
join inserted as i on 
     d.case_id = i.case_id and
     d.prop_val_yr = i.prop_val_yr and
     d.prop_id = i.prop_id and
     d.prot_by_id = i.prot_by_id
for read only
 
open curRows
fetch next from curRows into @old_case_id, @old_prop_val_yr, @old_prop_id, @old_prot_by_id, @old_prot_by_id_type, @old_prot_by_type, @old_primary_protester, @old_withdrew, @old_at_hearing, @old_prot_by_create_dt, @new_case_id, @new_prop_val_yr, @new_prop_id, @new_prot_by_id, @new_prot_by_id_type, @new_prot_by_type, @new_primary_protester, @new_withdrew, @new_at_hearing, @new_prot_by_create_dt
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
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
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'case_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 612, convert(varchar(255), @old_case_id), convert(varchar(255), @new_case_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
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
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
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
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
     if (
          @old_prot_by_id <> @new_prot_by_id
          or
          ( @old_prot_by_id is null and @new_prot_by_id is not null ) 
          or
          ( @old_prot_by_id is not null and @new_prot_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'prot_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 4107, convert(varchar(255), @old_prot_by_id), convert(varchar(255), @new_prot_by_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
     if (
          @old_prot_by_id_type <> @new_prot_by_id_type
          or
          ( @old_prot_by_id_type is null and @new_prot_by_id_type is not null ) 
          or
          ( @old_prot_by_id_type is not null and @new_prot_by_id_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'prot_by_id_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 4108, convert(varchar(255), @old_prot_by_id_type), convert(varchar(255), @new_prot_by_id_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
     if (
          @old_prot_by_type <> @new_prot_by_type
          or
          ( @old_prot_by_type is null and @new_prot_by_type is not null ) 
          or
          ( @old_prot_by_type is not null and @new_prot_by_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'prot_by_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 4109, convert(varchar(255), @old_prot_by_type), convert(varchar(255), @new_prot_by_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
     if (
          @old_primary_protester <> @new_primary_protester
          or
          ( @old_primary_protester is null and @new_primary_protester is not null ) 
          or
          ( @old_primary_protester is not null and @new_primary_protester is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'primary_protester' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 9279, convert(varchar(255), @old_primary_protester), convert(varchar(255), @new_primary_protester), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
     if (
          @old_withdrew <> @new_withdrew
          or
          ( @old_withdrew is null and @new_withdrew is not null ) 
          or
          ( @old_withdrew is not null and @new_withdrew is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'withdrew' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 9280, convert(varchar(255), @old_withdrew), convert(varchar(255), @new_withdrew), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
     if (
          @old_at_hearing <> @new_at_hearing
          or
          ( @old_at_hearing is null and @new_at_hearing is not null ) 
          or
          ( @old_at_hearing is not null and @new_at_hearing is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'at_hearing' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 9281, convert(varchar(255), @old_at_hearing), convert(varchar(255), @new_at_hearing), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
     if (
          @old_prot_by_create_dt <> @new_prot_by_create_dt
          or
          ( @old_prot_by_create_dt is null and @new_prot_by_create_dt is not null ) 
          or
          ( @old_prot_by_create_dt is not null and @new_prot_by_create_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = '_arb_protest_protest_by_assoc' and
                    chg_log_columns = 'prot_by_create_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1083, 9282, convert(varchar(255), @old_prot_by_create_dt), convert(varchar(255), @new_prot_by_create_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4107, convert(varchar(24), @new_prot_by_id), @new_prot_by_id)
          end
     end
 
     fetch next from curRows into @old_case_id, @old_prop_val_yr, @old_prop_id, @old_prot_by_id, @old_prot_by_id_type, @old_prot_by_type, @old_primary_protester, @old_withdrew, @old_at_hearing, @old_prot_by_create_dt, @new_case_id, @new_prop_val_yr, @new_prop_id, @new_prot_by_id, @new_prot_by_id_type, @new_prot_by_type, @new_primary_protester, @new_withdrew, @new_at_hearing, @new_prot_by_create_dt
end
 
close curRows
deallocate curRows

GO

