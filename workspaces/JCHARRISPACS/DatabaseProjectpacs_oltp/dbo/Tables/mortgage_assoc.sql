CREATE TABLE [dbo].[mortgage_assoc] (
    [prop_id]          INT          NOT NULL,
    [mortgage_co_id]   INT          NOT NULL,
    [mortgage_acct_id] VARCHAR (50) NULL,
    CONSTRAINT [CPK_mortgage_assoc] PRIMARY KEY CLUSTERED ([prop_id] ASC, [mortgage_co_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_mortgage_assoc_mortgage_co_id] FOREIGN KEY ([mortgage_co_id]) REFERENCES [dbo].[mortgage_co] ([mortgage_co_id]),
    CONSTRAINT [CFK_mortgage_assoc_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_mortgage_co_id]
    ON [dbo].[mortgage_assoc]([mortgage_co_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_mortgage_assoc_update_ChangeLog
on mortgage_assoc
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
declare @old_mortgage_co_id int
declare @new_mortgage_co_id int
declare @old_mortgage_acct_id varchar(50)
declare @new_mortgage_acct_id varchar(50)
 
declare curRows cursor
for
     select d.prop_id, d.mortgage_co_id, d.mortgage_acct_id, i.prop_id, i.mortgage_co_id, i.mortgage_acct_id
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.mortgage_co_id = i.mortgage_co_id
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_mortgage_co_id, @old_mortgage_acct_id, @new_prop_id, @new_mortgage_co_id, @new_mortgage_acct_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Mortgage: ' + a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @new_mortgage_co_id
 
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
                    chg_log_tables = 'mortgage_assoc' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 443, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3170, convert(varchar(24), @new_mortgage_co_id), @new_mortgage_co_id)
          end
     end
 
     if (
          @old_mortgage_co_id <> @new_mortgage_co_id
          or
          ( @old_mortgage_co_id is null and @new_mortgage_co_id is not null ) 
          or
          ( @old_mortgage_co_id is not null and @new_mortgage_co_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mortgage_assoc' and
                    chg_log_columns = 'mortgage_co_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 443, 3170, convert(varchar(255), @old_mortgage_co_id), convert(varchar(255), @new_mortgage_co_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3170, convert(varchar(24), @new_mortgage_co_id), @new_mortgage_co_id)
          end
     end
 
     if (
          @old_mortgage_acct_id <> @new_mortgage_acct_id
          or
          ( @old_mortgage_acct_id is null and @new_mortgage_acct_id is not null ) 
          or
          ( @old_mortgage_acct_id is not null and @new_mortgage_acct_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'mortgage_assoc' and
                    chg_log_columns = 'mortgage_acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 443, 3167, convert(varchar(255), @old_mortgage_acct_id), convert(varchar(255), @new_mortgage_acct_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3170, convert(varchar(24), @new_mortgage_co_id), @new_mortgage_co_id)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_mortgage_co_id, @old_mortgage_acct_id, @new_prop_id, @new_mortgage_co_id, @new_mortgage_acct_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_mortgage_assoc_delete_ChangeLog
on mortgage_assoc
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
          chg_log_tables = 'mortgage_assoc' and
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
declare @mortgage_co_id int
 
declare curRows cursor
for
     select prop_id, mortgage_co_id from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @mortgage_co_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Mortgage: ' + a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @mortgage_co_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 443, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3170, convert(varchar(24), @mortgage_co_id), @mortgage_co_id)
 
     fetch next from curRows into @prop_id, @mortgage_co_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_mortgage_assoc_insert_ChangeLog
on mortgage_assoc
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
declare @mortgage_co_id int
declare @mortgage_acct_id varchar(50)
 
declare curRows cursor
for
     select prop_id, mortgage_co_id, mortgage_acct_id from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @mortgage_co_id, @mortgage_acct_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Mortgage: ' + a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @mortgage_co_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mortgage_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 443, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3170, convert(varchar(24), @mortgage_co_id), @mortgage_co_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mortgage_assoc' and
               chg_log_columns = 'mortgage_co_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 443, 3170, null, convert(varchar(255), @mortgage_co_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3170, convert(varchar(24), @mortgage_co_id), @mortgage_co_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'mortgage_assoc' and
               chg_log_columns = 'mortgage_acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 443, 3167, null, convert(varchar(255), @mortgage_acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3170, convert(varchar(24), @mortgage_co_id), @mortgage_co_id)
     end
 
     fetch next from curRows into @prop_id, @mortgage_co_id, @mortgage_acct_id
end
 
close curRows
deallocate curRows

GO

