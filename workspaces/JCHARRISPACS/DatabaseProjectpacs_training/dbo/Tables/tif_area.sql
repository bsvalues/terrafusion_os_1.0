CREATE TABLE [dbo].[tif_area] (
    [tif_area_id]               INT           NOT NULL,
    [name]                      VARCHAR (50)  NOT NULL,
    [description]               VARCHAR (250) NULL,
    [ordinance_number]          VARCHAR (25)  NULL,
    [base_year]                 NUMERIC (4)   NOT NULL,
    [expiration_year]           NUMERIC (4)   NULL,
    [comment]                   VARCHAR (250) NULL,
    [created_date]              DATETIME      NULL,
    [created_by]                INT           NULL,
    [base_values_captured_date] DATETIME      NULL,
    [base_values_captured_by]   INT           NULL,
    [completed]                 BIT           CONSTRAINT [cd_ta_completed] DEFAULT ((0)) NOT NULL,
    [suspended]                 BIT           CONSTRAINT [cd_ta_suspended] DEFAULT ((0)) NOT NULL,
    [completed_comment]         VARCHAR (250) NULL,
    [suspended_comment]         VARCHAR (250) NULL,
    CONSTRAINT [cpk_tif_area] PRIMARY KEY CLUSTERED ([tif_area_id] ASC),
    CONSTRAINT [cu_tif_area_name] UNIQUE NONCLUSTERED ([tif_area_id] ASC)
);


GO

 
create trigger tr_tif_area_update_ChangeLog
on tif_area
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
 
declare @old_tif_area_id int
declare @new_tif_area_id int
declare @old_name varchar(50)
declare @new_name varchar(50)
declare @old_description varchar(250)
declare @new_description varchar(250)
declare @old_ordinance_number varchar(25)
declare @new_ordinance_number varchar(25)
declare @old_base_year numeric(4,0)
declare @new_base_year numeric(4,0)
declare @old_expiration_year numeric(4,0)
declare @new_expiration_year numeric(4,0)
declare @old_comment varchar(250)
declare @new_comment varchar(250)
declare @old_created_date datetime
declare @new_created_date datetime
declare @old_created_by int
declare @new_created_by int
declare @old_base_values_captured_date datetime
declare @new_base_values_captured_date datetime
declare @old_base_values_captured_by int
declare @new_base_values_captured_by int
declare @old_completed bit
declare @new_completed bit
declare @old_suspended bit
declare @new_suspended bit
declare @old_completed_comment varchar(250)
declare @new_completed_comment varchar(250)
declare @old_suspended_comment varchar(250)
declare @new_suspended_comment varchar(250)
 
declare curRows cursor
for
     select d.tif_area_id, d.name, d.description, d.ordinance_number, d.base_year, d.expiration_year, d.comment, d.created_date, d.created_by, d.base_values_captured_date, d.base_values_captured_by, d.completed, d.suspended, d.completed_comment, d.suspended_comment, 
            i.tif_area_id, i.name, i.description, i.ordinance_number, i.base_year, i.expiration_year, i.comment, i.created_date, i.created_by, i.base_values_captured_date, i.base_values_captured_by, i.completed, i.suspended, i.completed_comment, i.suspended_comment
from deleted as d
join inserted as i on 
     d.tif_area_id = i.tif_area_id
for read only
 
open curRows
fetch next from curRows into @old_tif_area_id, @old_name, @old_description, @old_ordinance_number, @old_base_year, @old_expiration_year, @old_comment, @old_created_date, @old_created_by, @old_base_values_captured_date, @old_base_values_captured_by, @old_completed, @old_suspended, @old_completed_comment, @old_suspended_comment, 
                             @new_tif_area_id, @new_name, @new_description, @new_ordinance_number, @new_base_year, @new_expiration_year, @new_comment, @new_created_date, @new_created_by, @new_base_values_captured_date, @new_base_values_captured_by, @new_completed, @new_suspended, @new_completed_comment, @new_suspended_comment
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_tif_area_id <> @new_tif_area_id
          or
          ( @old_tif_area_id is null and @new_tif_area_id is not null ) 
          or
          ( @old_tif_area_id is not null and @new_tif_area_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'tif_area_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 9992, convert(varchar(255), @old_tif_area_id), convert(varchar(255), @new_tif_area_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
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
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 3217, convert(varchar(255), @old_name), convert(varchar(255), @new_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
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
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'description' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 1318, convert(varchar(255), @old_description), convert(varchar(255), @new_description), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_ordinance_number <> @new_ordinance_number
          or
          ( @old_ordinance_number is null and @new_ordinance_number is not null ) 
          or
          ( @old_ordinance_number is not null and @new_ordinance_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'ordinance_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 9993, convert(varchar(255), @old_ordinance_number), convert(varchar(255), @new_ordinance_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_base_year <> @new_base_year
          or
          ( @old_base_year is null and @new_base_year is not null ) 
          or
          ( @old_base_year is not null and @new_base_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'base_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 9994, convert(varchar(255), @old_base_year), convert(varchar(255), @new_base_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_expiration_year <> @new_expiration_year
          or
          ( @old_expiration_year is null and @new_expiration_year is not null ) 
          or
          ( @old_expiration_year is not null and @new_expiration_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'expiration_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 9995, convert(varchar(255), @old_expiration_year), convert(varchar(255), @new_expiration_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_comment <> @new_comment
          or
          ( @old_comment is null and @new_comment is not null ) 
          or
          ( @old_comment is not null and @new_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 827, convert(varchar(255), @old_comment), convert(varchar(255), @new_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_created_date <> @new_created_date
          or
          ( @old_created_date is null and @new_created_date is not null ) 
          or
          ( @old_created_date is not null and @new_created_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'created_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 919, convert(varchar(255), @old_created_date), convert(varchar(255), @new_created_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
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
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'created_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 918, convert(varchar(255), @old_created_by), convert(varchar(255), @new_created_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_base_values_captured_date <> @new_base_values_captured_date
          or
          ( @old_base_values_captured_date is null and @new_base_values_captured_date is not null ) 
          or
          ( @old_base_values_captured_date is not null and @new_base_values_captured_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'base_values_captured_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 9996, convert(varchar(255), @old_base_values_captured_date), convert(varchar(255), @new_base_values_captured_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_base_values_captured_by <> @new_base_values_captured_by
          or
          ( @old_base_values_captured_by is null and @new_base_values_captured_by is not null ) 
          or
          ( @old_base_values_captured_by is not null and @new_base_values_captured_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'base_values_captured_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 9997, convert(varchar(255), @old_base_values_captured_by), convert(varchar(255), @new_base_values_captured_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_completed <> @new_completed
          or
          ( @old_completed is null and @new_completed is not null ) 
          or
          ( @old_completed is not null and @new_completed is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'completed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 9998, convert(varchar(255), @old_completed), convert(varchar(255), @new_completed), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_suspended <> @new_suspended
          or
          ( @old_suspended is null and @new_suspended is not null ) 
          or
          ( @old_suspended is not null and @new_suspended is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'suspended' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 9999, convert(varchar(255), @old_suspended), convert(varchar(255), @new_suspended), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_completed_comment <> @new_completed_comment
          or
          ( @old_completed_comment is null and @new_completed_comment is not null ) 
          or
          ( @old_completed_comment is not null and @new_completed_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'completed_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 10000, convert(varchar(255), @old_completed_comment), convert(varchar(255), @new_completed_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     if (
          @old_suspended_comment <> @new_suspended_comment
          or
          ( @old_suspended_comment is null and @new_suspended_comment is not null ) 
          or
          ( @old_suspended_comment is not null and @new_suspended_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tif_area' and
                    chg_log_columns = 'suspended_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1697, 10001, convert(varchar(255), @old_suspended_comment), convert(varchar(255), @new_suspended_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @new_tif_area_id), @new_tif_area_id)
          end
     end
 
     fetch next from curRows into @old_tif_area_id, @old_name, @old_description, @old_ordinance_number, @old_base_year, @old_expiration_year, @old_comment, @old_created_date, @old_created_by, @old_base_values_captured_date, @old_base_values_captured_by, @old_completed, @old_suspended, @old_completed_comment, @old_suspended_comment, 
                                  @new_tif_area_id, @new_name, @new_description, @new_ordinance_number, @new_base_year, @new_expiration_year, @new_comment, @new_created_date, @new_created_by, @new_base_values_captured_date, @new_base_values_captured_by, @new_completed, @new_suspended, @new_completed_comment, @new_suspended_comment
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_tif_area_delete_ChangeLog
on tif_area
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
          chg_log_tables = 'tif_area' and
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
declare @tvar_szOldValue varchar(255)
set @tvar_szOldValue = 'DELETED'
 
declare @tvar_key_prop_id int
 
declare @tif_area_id int
 
declare curRows cursor
for
     select tif_area_id from deleted
for read only
 
open curRows
fetch next from curRows into @tif_area_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1697, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
 
     fetch next from curRows into @tif_area_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_tif_area_insert_ChangeLog
on tif_area
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
 
declare @tif_area_id int
declare @name varchar(50)
declare @description varchar(250)
declare @ordinance_number varchar(25)
declare @base_year numeric(4,0)
declare @expiration_year numeric(4,0)
declare @comment varchar(250)
declare @created_date datetime
declare @created_by int
declare @base_values_captured_date datetime
declare @base_values_captured_by int
declare @completed bit
declare @suspended bit
declare @completed_comment varchar(250)
declare @suspended_comment varchar(250)
 
declare curRows cursor
for
     select tif_area_id, name, description, ordinance_number, base_year, expiration_year, comment, created_date, created_by, base_values_captured_date, base_values_captured_by, completed, suspended, completed_comment, suspended_comment from inserted
for read only
 
open curRows
fetch next from curRows into @tif_area_id, @name, @description, @ordinance_number, @base_year, @expiration_year, @comment, @created_date, @created_by, @base_values_captured_date, @base_values_captured_by, @completed, @suspended, @completed_comment, @suspended_comment
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'tif_area_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 9992, null, convert(varchar(255), @tif_area_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 3217, null, convert(varchar(255), @name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'description' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 1318, null, convert(varchar(255), @description), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'ordinance_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 9993, null, convert(varchar(255), @ordinance_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'base_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 9994, null, convert(varchar(255), @base_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'expiration_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 9995, null, convert(varchar(255), @expiration_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 827, null, convert(varchar(255), @comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'created_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 919, null, convert(varchar(255), @created_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'created_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 918, null, convert(varchar(255), @created_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'base_values_captured_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 9996, null, convert(varchar(255), @base_values_captured_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'base_values_captured_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 9997, null, convert(varchar(255), @base_values_captured_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'completed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 9998, null, convert(varchar(255), @completed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'suspended' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 9999, null, convert(varchar(255), @suspended), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'completed_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 10000, null, convert(varchar(255), @completed_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tif_area' and
               chg_log_columns = 'suspended_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1697, 10001, null, convert(varchar(255), @suspended_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9992, convert(varchar(24), @tif_area_id), @tif_area_id)
     end
 
     fetch next from curRows into @tif_area_id, @name, @description, @ordinance_number, @base_year, @expiration_year, @comment, @created_date, @created_by, @base_values_captured_date, @base_values_captured_by, @completed, @suspended, @completed_comment, @suspended_comment
end
 
close curRows
deallocate curRows

GO

