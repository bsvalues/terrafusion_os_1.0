CREATE TABLE [dbo].[phone] (
    [acct_id]       INT          NOT NULL,
    [phone_id]      INT          NOT NULL,
    [phone_type_cd] CHAR (5)     NOT NULL,
    [phone_num]     VARCHAR (20) NULL,
    [is_primary]    BIT          NULL,
    CONSTRAINT [CPK_phone] PRIMARY KEY CLUSTERED ([phone_id] ASC, [phone_type_cd] ASC, [acct_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_phone_acct_id] FOREIGN KEY ([acct_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_phone_phone_type_cd] FOREIGN KEY ([phone_type_cd]) REFERENCES [dbo].[phone_type] ([phone_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_phone_type_cd]
    ON [dbo].[phone]([phone_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_acct_id_phone_type_cd_phone_num]
    ON [dbo].[phone]([acct_id] ASC, [phone_type_cd] ASC, [phone_num] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_phone_insert_ChangeLog
on phone
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
 
declare @acct_id int
declare @phone_id int
declare @phone_type_cd char(5)
declare @phone_num varchar(20)
 
declare curRows cursor
for
     select acct_id, phone_id, phone_type_cd, phone_num from inserted
for read only
 
open curRows
fetch next from curRows into @acct_id, @phone_id, @phone_type_cd, @phone_num
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'phone' and
               chg_log_columns = 'acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 589, 42, null, convert(varchar(255), @acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @phone_id), @phone_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @phone_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'phone' and
               chg_log_columns = 'phone_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 589, 3733, null, convert(varchar(255), @phone_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @phone_id), @phone_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @phone_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'phone' and
               chg_log_columns = 'phone_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 589, 3736, null, convert(varchar(255), @phone_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @phone_id), @phone_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @phone_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'phone' and
               chg_log_columns = 'phone_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 589, 3734, null, convert(varchar(255), @phone_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @phone_id), @phone_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @phone_type_cd), 0)
     end
 
     fetch next from curRows into @acct_id, @phone_id, @phone_type_cd, @phone_num
end
 
close curRows
deallocate curRows

GO



create trigger tr_phone_update_ChangeLog
on phone
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
 
declare @old_acct_id int
declare @new_acct_id int
declare @old_phone_id int
declare @new_phone_id int
declare @old_phone_type_cd char(5)
declare @new_phone_type_cd char(5)
declare @old_phone_num varchar(20)
declare @new_phone_num varchar(20)
 
declare curRows cursor
for
     select d.acct_id, d.phone_id, d.phone_type_cd, d.phone_num, i.acct_id, i.phone_id, i.phone_type_cd, i.phone_num
from deleted as d
join inserted as i on 
     d.acct_id = i.acct_id and
     d.phone_id = i.phone_id and
     d.phone_type_cd = i.phone_type_cd
for read only
 
open curRows
fetch next from curRows into @old_acct_id, @old_phone_id, @old_phone_type_cd, @old_phone_num, @new_acct_id, @new_phone_id, @new_phone_type_cd, @new_phone_num
 
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
                    chg_log_tables = 'phone' and
                    chg_log_columns = 'acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 589, 42, convert(varchar(255), @old_acct_id), convert(varchar(255), @new_acct_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @new_phone_id), @new_phone_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @new_phone_type_cd), 0)
          end
     end
 
     if (
          @old_phone_id <> @new_phone_id
          or
          ( @old_phone_id is null and @new_phone_id is not null ) 
          or
          ( @old_phone_id is not null and @new_phone_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'phone' and
                    chg_log_columns = 'phone_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 589, 3733, convert(varchar(255), @old_phone_id), convert(varchar(255), @new_phone_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @new_phone_id), @new_phone_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @new_phone_type_cd), 0)
          end
     end
 
     if (
          @old_phone_type_cd <> @new_phone_type_cd
          or
          ( @old_phone_type_cd is null and @new_phone_type_cd is not null ) 
          or
          ( @old_phone_type_cd is not null and @new_phone_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'phone' and
                    chg_log_columns = 'phone_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 589, 3736, convert(varchar(255), @old_phone_type_cd), convert(varchar(255), @new_phone_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @new_phone_id), @new_phone_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @new_phone_type_cd), 0)
          end
     end
 
     if (
          @old_phone_num <> @new_phone_num
          or
          ( @old_phone_num is null and @new_phone_num is not null ) 
          or
          ( @old_phone_num is not null and @new_phone_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'phone' and
                    chg_log_columns = 'phone_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 589, 3734, convert(varchar(255), @old_phone_num), convert(varchar(255), @new_phone_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @new_phone_id), @new_phone_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @new_phone_type_cd), 0)
          end
     end
 
     fetch next from curRows into @old_acct_id, @old_phone_id, @old_phone_type_cd, @old_phone_num, @new_acct_id, @new_phone_id, @new_phone_type_cd, @new_phone_num
end
 
close curRows
deallocate curRows

GO



create trigger tr_phone_delete_ChangeLog
on phone
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
          chg_log_tables = 'phone' and
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
 
declare @acct_id int
declare @phone_id int
declare @phone_type_cd char(5)
 
declare curRows cursor
for
     select acct_id, phone_id, phone_type_cd from deleted
for read only
 
open curRows
fetch next from curRows into @acct_id, @phone_id, @phone_type_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 589, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3733, convert(varchar(24), @phone_id), @phone_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3736, convert(varchar(24), @phone_type_cd), 0)
 
     fetch next from curRows into @acct_id, @phone_id, @phone_type_cd
end
 
close curRows
deallocate curRows

GO

