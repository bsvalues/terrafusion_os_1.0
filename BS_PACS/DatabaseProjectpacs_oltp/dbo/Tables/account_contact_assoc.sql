CREATE TABLE [dbo].[account_contact_assoc] (
    [acct_id]         INT          NOT NULL,
    [acct_contact_id] INT          NOT NULL,
    [is_primary]      BIT          NULL,
    [contact_type_cd] VARCHAR (10) NULL,
    CONSTRAINT [CPK_account_contact_assoc] PRIMARY KEY CLUSTERED ([acct_id] ASC, [acct_contact_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_account_contact_assoc_acct_contact_id] FOREIGN KEY ([acct_contact_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_account_contact_assoc_acct_id] FOREIGN KEY ([acct_id]) REFERENCES [dbo].[account] ([acct_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_account_contact_assoc_contact_type_cd] FOREIGN KEY ([contact_type_cd]) REFERENCES [dbo].[contact_type] ([contact_type_cd])
);


GO

 
create trigger tr_account_contact_assoc_delete_ChangeLog
on account_contact_assoc
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
          chg_log_tables = 'account_contact_assoc' and
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
 
declare @acct_id int
declare @acct_contact_id int
 
declare curRows cursor
for
     select acct_id, acct_contact_id from deleted
for read only
 
open curRows
fetch next from curRows into @acct_id, @acct_contact_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1192, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9371, convert(varchar(24), @acct_contact_id), @acct_contact_id)
 
     fetch next from curRows into @acct_id, @acct_contact_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_account_contact_assoc_update_ChangeLog
on account_contact_assoc
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
 
declare @old_acct_id int
declare @new_acct_id int
declare @old_acct_contact_id int
declare @new_acct_contact_id int
declare @old_is_primary bit
declare @new_is_primary bit
declare @old_contact_type_cd varchar(10)
declare @new_contact_type_cd varchar(10)
 
declare curRows cursor
for
     select d.acct_id, d.acct_contact_id, d.is_primary, d.contact_type_cd, i.acct_id, i.acct_contact_id, i.is_primary, i.contact_type_cd
from deleted as d
join inserted as i on 
     d.acct_id = i.acct_id and
     d.acct_contact_id = i.acct_contact_id
for read only
 
open curRows
fetch next from curRows into @old_acct_id, @old_acct_contact_id, @old_is_primary, @old_contact_type_cd, @new_acct_id, @new_acct_contact_id, @new_is_primary, @new_contact_type_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_acct_id <> @new_acct_id
          or
          ( @old_acct_id is null and @new_acct_id is not null ) 
          or
          ( @old_acct_id is not null and @new_acct_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account_contact_assoc' and
                    chg_log_columns = 'acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1192, 42, convert(varchar(255), @old_acct_id), convert(varchar(255), @new_acct_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9371, convert(varchar(24), @new_acct_contact_id), @new_acct_contact_id)
          end
     end
 
     if (
          @old_acct_contact_id <> @new_acct_contact_id
          or
          ( @old_acct_contact_id is null and @new_acct_contact_id is not null ) 
          or
          ( @old_acct_contact_id is not null and @new_acct_contact_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account_contact_assoc' and
                    chg_log_columns = 'acct_contact_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1192, 9371, convert(varchar(255), @old_acct_contact_id), convert(varchar(255), @new_acct_contact_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9371, convert(varchar(24), @new_acct_contact_id), @new_acct_contact_id)
          end
     end
 
     if (
          @old_is_primary <> @new_is_primary
          or
          ( @old_is_primary is null and @new_is_primary is not null ) 
          or
          ( @old_is_primary is not null and @new_is_primary is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account_contact_assoc' and
                    chg_log_columns = 'is_primary' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1192, 9372, convert(varchar(255), @old_is_primary), convert(varchar(255), @new_is_primary), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9371, convert(varchar(24), @new_acct_contact_id), @new_acct_contact_id)
          end
     end
 
     if (
          @old_contact_type_cd <> @new_contact_type_cd
          or
          ( @old_contact_type_cd is null and @new_contact_type_cd is not null ) 
          or
          ( @old_contact_type_cd is not null and @new_contact_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account_contact_assoc' and
                    chg_log_columns = 'contact_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1192, 874, convert(varchar(255), @old_contact_type_cd), convert(varchar(255), @new_contact_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9371, convert(varchar(24), @new_acct_contact_id), @new_acct_contact_id)
          end
     end
 
     fetch next from curRows into @old_acct_id, @old_acct_contact_id, @old_is_primary, @old_contact_type_cd, @new_acct_id, @new_acct_contact_id, @new_is_primary, @new_contact_type_cd
end
 
close curRows
deallocate curRows

GO

