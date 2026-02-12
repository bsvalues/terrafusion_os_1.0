CREATE TABLE [dbo].[pacs_imaging] (
    [base_dir]        VARCHAR (255) NOT NULL,
    [sub_dir]         VARCHAR (255) NOT NULL,
    [next_picture_id] INT           NOT NULL,
    [lKey]            INT           NOT NULL,
    CONSTRAINT [CPK_pacs_imaging] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_pacs_imaging_lKey] CHECK ([lKey] = 0)
);


GO



create trigger tr_pacs_imaging_update_ChangeLog
on pacs_imaging
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
 
declare @old_base_dir varchar(255)
declare @new_base_dir varchar(255)
declare @old_sub_dir varchar(255)
declare @new_sub_dir varchar(255)
declare @old_next_picture_id int
declare @new_next_picture_id int
declare @old_lKey int
declare @new_lKey int
 
declare curRows cursor
for
     select d.base_dir, d.sub_dir, d.next_picture_id, d.lKey, i.base_dir, i.sub_dir, i.next_picture_id, i.lKey
from deleted as d
join inserted as i on 
     d.lKey = i.lKey
for read only
 
open curRows
fetch next from curRows into @old_base_dir, @old_sub_dir, @old_next_picture_id, @old_lKey, @new_base_dir, @new_sub_dir, @new_next_picture_id, @new_lKey
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_base_dir <> @new_base_dir
          or
          ( @old_base_dir is null and @new_base_dir is not null ) 
          or
          ( @old_base_dir is not null and @new_base_dir is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_imaging' and
                    chg_log_columns = 'base_dir' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 552, 410, convert(varchar(255), @old_base_dir), convert(varchar(255), @new_base_dir) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @new_lKey), @new_lKey)
          end
     end
 
     if (
          @old_sub_dir <> @new_sub_dir
          or
          ( @old_sub_dir is null and @new_sub_dir is not null ) 
          or
          ( @old_sub_dir is not null and @new_sub_dir is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_imaging' and
                    chg_log_columns = 'sub_dir' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 552, 4966, convert(varchar(255), @old_sub_dir), convert(varchar(255), @new_sub_dir) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @new_lKey), @new_lKey)
          end
     end
 
     if (
          @old_next_picture_id <> @new_next_picture_id
          or
          ( @old_next_picture_id is null and @new_next_picture_id is not null ) 
          or
          ( @old_next_picture_id is not null and @new_next_picture_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pacs_imaging' and
                    chg_log_columns = 'next_picture_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 552, 3301, convert(varchar(255), @old_next_picture_id), convert(varchar(255), @new_next_picture_id) )
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
                    chg_log_tables = 'pacs_imaging' and
                    chg_log_columns = 'lKey' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 552, 8914, convert(varchar(255), @old_lKey), convert(varchar(255), @new_lKey) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 8914, convert(varchar(24), @new_lKey), @new_lKey)
          end
     end
 
     fetch next from curRows into @old_base_dir, @old_sub_dir, @old_next_picture_id, @old_lKey, @new_base_dir, @new_sub_dir, @new_next_picture_id, @new_lKey
end
 
close curRows
deallocate curRows

GO

