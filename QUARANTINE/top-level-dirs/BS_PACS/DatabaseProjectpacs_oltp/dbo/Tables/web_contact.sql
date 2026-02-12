CREATE TABLE [dbo].[web_contact] (
    [acct_id]             INT           NOT NULL,
    [web_contact_type_cd] VARCHAR (5)   NULL,
    [contact_text]        VARCHAR (255) NULL,
    [is_primary]          BIT           NULL,
    [web_contact_id]      INT           NOT NULL,
    CONSTRAINT [CPK_web_contact] PRIMARY KEY CLUSTERED ([acct_id] ASC, [web_contact_id] ASC),
    CONSTRAINT [CFK_web_contact_acct_id] FOREIGN KEY ([acct_id]) REFERENCES [dbo].[account] ([acct_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_web_contact_web_contact_type_cd] FOREIGN KEY ([web_contact_type_cd]) REFERENCES [dbo].[web_contact_type] ([web_contact_type_cd]),
    CONSTRAINT [CUQ_web_contact_web_contact_id] UNIQUE NONCLUSTERED ([web_contact_id] ASC)
);


GO

 
create trigger tr_web_contact_delete_ChangeLog
on web_contact
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
          chg_log_tables = 'web_contact' and
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
declare @web_contact_id int
 
declare curRows cursor
for
     select acct_id, web_contact_id from deleted
for read only
 
open curRows
fetch next from curRows into @acct_id, @web_contact_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1193, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @web_contact_id), @web_contact_id)
 
     fetch next from curRows into @acct_id, @web_contact_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_web_contact_insert_ChangeLog
on web_contact
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
 
declare @acct_id int
declare @web_contact_id int
declare @web_contact_type_cd varchar(5)
declare @contact_text varchar(255)
declare @is_primary bit
 
declare curRows cursor
for
     select acct_id, web_contact_id, web_contact_type_cd, contact_text, is_primary from inserted
for read only
 
open curRows
fetch next from curRows into @acct_id, @web_contact_id, @web_contact_type_cd, @contact_text, @is_primary
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'web_contact' and
               chg_log_columns = 'acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1193, 42, null, convert(varchar(255), @acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @web_contact_id), @web_contact_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'web_contact' and
               chg_log_columns = 'web_contact_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1193, 9373, null, convert(varchar(255), @web_contact_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @web_contact_id), @web_contact_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'web_contact' and
               chg_log_columns = 'web_contact_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1193, 9374, null, convert(varchar(255), @web_contact_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @web_contact_id), @web_contact_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'web_contact' and
               chg_log_columns = 'contact_text' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1193, 9370, null, convert(varchar(255), @contact_text), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @web_contact_id), @web_contact_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'web_contact' and
               chg_log_columns = 'is_primary' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1193, 9372, null, convert(varchar(255), @is_primary), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @web_contact_id), @web_contact_id)
     end
 
     fetch next from curRows into @acct_id, @web_contact_id, @web_contact_type_cd, @contact_text, @is_primary
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_web_contact_update_ChangeLog
on web_contact
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
declare @old_web_contact_id int
declare @new_web_contact_id int
declare @old_web_contact_type_cd varchar(5)
declare @new_web_contact_type_cd varchar(5)
declare @old_contact_text varchar(255)
declare @new_contact_text varchar(255)
declare @old_is_primary bit
declare @new_is_primary bit
 
declare curRows cursor
for
     select d.acct_id, d.web_contact_id, d.web_contact_type_cd, d.contact_text, d.is_primary, i.acct_id, i.web_contact_id, i.web_contact_type_cd, i.contact_text, i.is_primary
from deleted as d
join inserted as i on 
     d.acct_id = i.acct_id and
     d.web_contact_id = i.web_contact_id
for read only
 
open curRows
fetch next from curRows into @old_acct_id, @old_web_contact_id, @old_web_contact_type_cd, @old_contact_text, @old_is_primary, @new_acct_id, @new_web_contact_id, @new_web_contact_type_cd, @new_contact_text, @new_is_primary
 
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
                    chg_log_tables = 'web_contact' and
                    chg_log_columns = 'acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1193, 42, convert(varchar(255), @old_acct_id), convert(varchar(255), @new_acct_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @new_web_contact_id), @new_web_contact_id)
          end
     end
 
     if (
          @old_web_contact_id <> @new_web_contact_id
          or
          ( @old_web_contact_id is null and @new_web_contact_id is not null ) 
          or
          ( @old_web_contact_id is not null and @new_web_contact_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'web_contact' and
                    chg_log_columns = 'web_contact_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1193, 9373, convert(varchar(255), @old_web_contact_id), convert(varchar(255), @new_web_contact_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @new_web_contact_id), @new_web_contact_id)
          end
     end
 
     if (
          @old_web_contact_type_cd <> @new_web_contact_type_cd
          or
          ( @old_web_contact_type_cd is null and @new_web_contact_type_cd is not null ) 
          or
          ( @old_web_contact_type_cd is not null and @new_web_contact_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'web_contact' and
                    chg_log_columns = 'web_contact_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1193, 9374, convert(varchar(255), @old_web_contact_type_cd), convert(varchar(255), @new_web_contact_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @new_web_contact_id), @new_web_contact_id)
          end
     end
 
     if (
          @old_contact_text <> @new_contact_text
          or
          ( @old_contact_text is null and @new_contact_text is not null ) 
          or
          ( @old_contact_text is not null and @new_contact_text is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'web_contact' and
                    chg_log_columns = 'contact_text' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1193, 9370, convert(varchar(255), @old_contact_text), convert(varchar(255), @new_contact_text), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @new_web_contact_id), @new_web_contact_id)
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
                    chg_log_tables = 'web_contact' and
                    chg_log_columns = 'is_primary' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1193, 9372, convert(varchar(255), @old_is_primary), convert(varchar(255), @new_is_primary), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9373, convert(varchar(24), @new_web_contact_id), @new_web_contact_id)
          end
     end
 
     fetch next from curRows into @old_acct_id, @old_web_contact_id, @old_web_contact_type_cd, @old_contact_text, @old_is_primary, @new_acct_id, @new_web_contact_id, @new_web_contact_type_cd, @new_contact_text, @new_is_primary
end
 
close curRows
deallocate curRows

GO

