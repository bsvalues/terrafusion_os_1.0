CREATE TABLE [dbo].[buyer_assoc] (
    [chg_of_owner_id] INT NOT NULL,
    [buyer_id]        INT NOT NULL,
    CONSTRAINT [CPK_buyer_assoc] PRIMARY KEY CLUSTERED ([chg_of_owner_id] ASC, [buyer_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_buyer_assoc_buyer_id] FOREIGN KEY ([buyer_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_buyer_assoc_chg_of_owner_id] FOREIGN KEY ([chg_of_owner_id]) REFERENCES [dbo].[chg_of_owner] ([chg_of_owner_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_buyer_id]
    ON [dbo].[buyer_assoc]([buyer_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_buyer_assoc_delete_ChangeLog
on buyer_assoc
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
          chg_log_tables = 'buyer_assoc' and
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
 
declare @chg_of_owner_id int
declare @buyer_id int
 
declare curRows cursor
for
     select chg_of_owner_id, buyer_id from deleted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @buyer_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_key_prop_id = null
     select @tvar_key_prop_id = prop_id
     from chg_of_owner_prop_assoc with(nolock)
     where
          chg_of_owner_id = @chg_of_owner_id
     if ( @tvar_key_prop_id is null )
     begin
          set @tvar_key_prop_id = 0
     end
 
     select @tvar_szRefID = file_as_name
     from account with(nolock)
     where acct_id = @buyer_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 144, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 567, convert(varchar(24), @buyer_id), @buyer_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
 
     fetch next from curRows into @chg_of_owner_id, @buyer_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_buyer_assoc_update_ChangeLog
on buyer_assoc
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
 
declare @old_chg_of_owner_id int
declare @new_chg_of_owner_id int
declare @old_buyer_id int
declare @new_buyer_id int
 
declare curRows cursor
for
     select d.chg_of_owner_id, d.buyer_id, i.chg_of_owner_id, i.buyer_id
from deleted as d
join inserted as i on 
     d.chg_of_owner_id = i.chg_of_owner_id and
     d.buyer_id = i.buyer_id
for read only
 
open curRows
fetch next from curRows into @old_chg_of_owner_id, @old_buyer_id, @new_chg_of_owner_id, @new_buyer_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_key_prop_id = null
     select @tvar_key_prop_id = prop_id
     from chg_of_owner_prop_assoc with(nolock)
     where
          chg_of_owner_id = @new_chg_of_owner_id
     if ( @tvar_key_prop_id is null )
     begin
          set @tvar_key_prop_id = 0
     end
 
     select @tvar_szRefID = file_as_name
     from account with(nolock)
     where acct_id = @new_buyer_id
 
     if (
          @old_chg_of_owner_id <> @new_chg_of_owner_id
          or
          ( @old_chg_of_owner_id is null and @new_chg_of_owner_id is not null ) 
          or
          ( @old_chg_of_owner_id is not null and @new_chg_of_owner_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'buyer_assoc' and
                    chg_log_columns = 'chg_of_owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 144, 713, convert(varchar(255), @old_chg_of_owner_id), convert(varchar(255), @new_chg_of_owner_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 567, convert(varchar(24), @new_buyer_id), @new_buyer_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_buyer_id <> @new_buyer_id
          or
          ( @old_buyer_id is null and @new_buyer_id is not null ) 
          or
          ( @old_buyer_id is not null and @new_buyer_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'buyer_assoc' and
                    chg_log_columns = 'buyer_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 144, 567, convert(varchar(255), @old_buyer_id), convert(varchar(255), @new_buyer_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @new_chg_of_owner_id), @new_chg_of_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 567, convert(varchar(24), @new_buyer_id), @new_buyer_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     fetch next from curRows into @old_chg_of_owner_id, @old_buyer_id, @new_chg_of_owner_id, @new_buyer_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_buyer_assoc_insert_ChangeLog
on buyer_assoc
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
 
declare @chg_of_owner_id int
declare @buyer_id int
 
declare curRows cursor
for
     select chg_of_owner_id, buyer_id from inserted
for read only
 
open curRows
fetch next from curRows into @chg_of_owner_id, @buyer_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_key_prop_id = null
     select @tvar_key_prop_id = prop_id
     from chg_of_owner_prop_assoc with(nolock)
     where
          chg_of_owner_id = @chg_of_owner_id
     if ( @tvar_key_prop_id is null )
     begin
          set @tvar_key_prop_id = 0
     end
 
     select @tvar_szRefID = file_as_name
     from account with(nolock)
     where acct_id = @buyer_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'buyer_assoc' and
               chg_log_columns = 'chg_of_owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 144, 713, null, convert(varchar(255), @chg_of_owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 567, convert(varchar(24), @buyer_id), @buyer_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'buyer_assoc' and
               chg_log_columns = 'buyer_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 144, 567, null, convert(varchar(255), @buyer_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 713, convert(varchar(24), @chg_of_owner_id), @chg_of_owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 567, convert(varchar(24), @buyer_id), @buyer_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     fetch next from curRows into @chg_of_owner_id, @buyer_id
end
 
close curRows
deallocate curRows

GO

