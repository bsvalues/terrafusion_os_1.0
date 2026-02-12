CREATE TABLE [dbo].[forms_maintenance] (
    [Form_type]   VARCHAR (5)  NOT NULL,
    [Image_type]  VARCHAR (10) NOT NULL,
    [Record_type] VARCHAR (10) NOT NULL,
    [Sub_type]    VARCHAR (10) NOT NULL,
    [lKey]        INT          IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_forms_maintenance] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_forms_maintenance_insert_ChangeLog
on forms_maintenance
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
 
declare @Form_type varchar(5)
declare @Image_type varchar(10)
declare @Record_type varchar(10)
declare @Sub_type varchar(10)
declare @lKey int
 
declare curRows cursor
for
     select Form_type, Image_type, Record_type, Sub_type, lKey from inserted
for read only
 
open curRows
fetch next from curRows into @Form_type, @Image_type, @Record_type, @Sub_type, @lKey
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Form Type: ' + @form_type
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'forms_maintenance' and
               chg_log_columns = 'Form_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 293, 1946, null, convert(varchar(255), @Form_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @lKey), @lKey)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'forms_maintenance' and
               chg_log_columns = 'Image_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 293, 2160, null, convert(varchar(255), @Image_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @lKey), @lKey)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'forms_maintenance' and
               chg_log_columns = 'Record_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 293, 4320, null, convert(varchar(255), @Record_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @lKey), @lKey)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'forms_maintenance' and
               chg_log_columns = 'Sub_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 293, 4969, null, convert(varchar(255), @Sub_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @lKey), @lKey)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'forms_maintenance' and
               chg_log_columns = 'lKey' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 293, 8914, null, convert(varchar(255), @lKey), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @lKey), @lKey)
     end
 
     fetch next from curRows into @Form_type, @Image_type, @Record_type, @Sub_type, @lKey
end
 
close curRows
deallocate curRows

GO



create trigger tr_forms_maintenance_update_ChangeLog
on forms_maintenance
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
 
declare @old_Form_type varchar(5)
declare @new_Form_type varchar(5)
declare @old_Image_type varchar(10)
declare @new_Image_type varchar(10)
declare @old_Record_type varchar(10)
declare @new_Record_type varchar(10)
declare @old_Sub_type varchar(10)
declare @new_Sub_type varchar(10)
declare @old_lKey int
declare @new_lKey int
 
declare curRows cursor
for
     select d.Form_type, d.Image_type, d.Record_type, d.Sub_type, d.lKey, i.Form_type, i.Image_type, i.Record_type, i.Sub_type, i.lKey
from deleted as d
join inserted as i on 
     d.lKey = i.lKey
for read only
 
open curRows
fetch next from curRows into @old_Form_type, @old_Image_type, @old_Record_type, @old_Sub_type, @old_lKey, @new_Form_type, @new_Image_type, @new_Record_type, @new_Sub_type, @new_lKey
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Form Type: ' + @new_form_type
 
     if (
          @old_Form_type <> @new_Form_type
          or
          ( @old_Form_type is null and @new_Form_type is not null ) 
          or
          ( @old_Form_type is not null and @new_Form_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'forms_maintenance' and
                    chg_log_columns = 'Form_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 293, 1946, convert(varchar(255), @old_Form_type), convert(varchar(255), @new_Form_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @new_lKey), @new_lKey)
          end
     end
 
     if (
          @old_Image_type <> @new_Image_type
          or
          ( @old_Image_type is null and @new_Image_type is not null ) 
          or
          ( @old_Image_type is not null and @new_Image_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'forms_maintenance' and
                    chg_log_columns = 'Image_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 293, 2160, convert(varchar(255), @old_Image_type), convert(varchar(255), @new_Image_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @new_lKey), @new_lKey)
          end
     end
 
     if (
          @old_Record_type <> @new_Record_type
          or
          ( @old_Record_type is null and @new_Record_type is not null ) 
          or
          ( @old_Record_type is not null and @new_Record_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'forms_maintenance' and
                    chg_log_columns = 'Record_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 293, 4320, convert(varchar(255), @old_Record_type), convert(varchar(255), @new_Record_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @new_lKey), @new_lKey)
          end
     end
 
     if (
          @old_Sub_type <> @new_Sub_type
          or
          ( @old_Sub_type is null and @new_Sub_type is not null ) 
          or
          ( @old_Sub_type is not null and @new_Sub_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'forms_maintenance' and
                    chg_log_columns = 'Sub_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 293, 4969, convert(varchar(255), @old_Sub_type), convert(varchar(255), @new_Sub_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @new_lKey), @new_lKey)
          end
     end
 
     if (
          @old_lKey <> @new_lKey
          or
          ( @old_lKey is null and @new_lKey is not null ) 
          or
          ( @old_lKey is not null and @new_lKey is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'forms_maintenance' and
                    chg_log_columns = 'lKey' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 293, 8914, convert(varchar(255), @old_lKey), convert(varchar(255), @new_lKey), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @new_lKey), @new_lKey)
          end
     end
 
     fetch next from curRows into @old_Form_type, @old_Image_type, @old_Record_type, @old_Sub_type, @old_lKey, @new_Form_type, @new_Image_type, @new_Record_type, @new_Sub_type, @new_lKey
end
 
close curRows
deallocate curRows

GO



create trigger tr_forms_maintenance_delete_ChangeLog
on forms_maintenance
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
          chg_log_tables = 'forms_maintenance' and
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
 
declare @lKey int
 
declare curRows cursor
for
     select lKey from deleted
for read only
 
open curRows
fetch next from curRows into @lKey
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Form Type: ' + (select form_type from deleted where lKey = @lKey)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 293, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @lKey), @lKey)
 
     fetch next from curRows into @lKey
end
 
close curRows
deallocate curRows

GO

