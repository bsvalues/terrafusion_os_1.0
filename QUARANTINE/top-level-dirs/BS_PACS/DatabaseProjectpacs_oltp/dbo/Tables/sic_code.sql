CREATE TABLE [dbo].[sic_code] (
    [sic_cd]             VARCHAR (10) NOT NULL,
    [sic_desc]           VARCHAR (50) NULL,
    [sys_flag]           CHAR (1)     NULL,
    [category_appraiser] INT          NULL,
    CONSTRAINT [CPK_sic_code] PRIMARY KEY CLUSTERED ([sic_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_sic_code_insert_ChangeLog
on sic_code
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
 
declare @sic_cd varchar(10)
declare @sic_desc varchar(50)
declare @sys_flag char(1)
declare @category_appraiser int
 
declare curRows cursor
for
     select sic_cd, sic_desc, sys_flag, category_appraiser from inserted
for read only
 
open curRows
fetch next from curRows into @sic_cd, @sic_desc, @sys_flag, @category_appraiser
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sic_code' and
               chg_log_columns = 'sic_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 762, 4729, null, convert(varchar(255), @sic_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4729, convert(varchar(24), @sic_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sic_code' and
               chg_log_columns = 'sic_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 762, 4730, null, convert(varchar(255), @sic_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4729, convert(varchar(24), @sic_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sic_code' and
               chg_log_columns = 'sys_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 762, 5025, null, convert(varchar(255), @sys_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4729, convert(varchar(24), @sic_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'sic_code' and
               chg_log_columns = 'category_appraiser' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 762, 6012, null, convert(varchar(255), @category_appraiser), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4729, convert(varchar(24), @sic_cd), 0)
     end
 
     fetch next from curRows into @sic_cd, @sic_desc, @sys_flag, @category_appraiser
end
 
close curRows
deallocate curRows

GO



create trigger tr_sic_code_delete_insert_update_MemTable
on sic_code
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'sic_code'

GO



create trigger tr_sic_code_update_ChangeLog
on sic_code
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
 
declare @old_sic_cd varchar(10)
declare @new_sic_cd varchar(10)
declare @old_sic_desc varchar(50)
declare @new_sic_desc varchar(50)
declare @old_sys_flag char(1)
declare @new_sys_flag char(1)
declare @old_category_appraiser int
declare @new_category_appraiser int
 
declare curRows cursor
for
     select d.sic_cd, d.sic_desc, d.sys_flag, d.category_appraiser, i.sic_cd, i.sic_desc, i.sys_flag, i.category_appraiser
from deleted as d
join inserted as i on 
     d.sic_cd = i.sic_cd
for read only
 
open curRows
fetch next from curRows into @old_sic_cd, @old_sic_desc, @old_sys_flag, @old_category_appraiser, @new_sic_cd, @new_sic_desc, @new_sys_flag, @new_category_appraiser
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_sic_cd <> @new_sic_cd
          or
          ( @old_sic_cd is null and @new_sic_cd is not null ) 
          or
          ( @old_sic_cd is not null and @new_sic_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sic_code' and
                    chg_log_columns = 'sic_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 762, 4729, convert(varchar(255), @old_sic_cd), convert(varchar(255), @new_sic_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4729, convert(varchar(24), @new_sic_cd), 0)
          end
     end
 
     if (
          @old_sic_desc <> @new_sic_desc
          or
          ( @old_sic_desc is null and @new_sic_desc is not null ) 
          or
          ( @old_sic_desc is not null and @new_sic_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sic_code' and
                    chg_log_columns = 'sic_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 762, 4730, convert(varchar(255), @old_sic_desc), convert(varchar(255), @new_sic_desc) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4729, convert(varchar(24), @new_sic_cd), 0)
          end
     end
 
     if (
          @old_sys_flag <> @new_sys_flag
          or
          ( @old_sys_flag is null and @new_sys_flag is not null ) 
          or
          ( @old_sys_flag is not null and @new_sys_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sic_code' and
                    chg_log_columns = 'sys_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 762, 5025, convert(varchar(255), @old_sys_flag), convert(varchar(255), @new_sys_flag) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4729, convert(varchar(24), @new_sic_cd), 0)
          end
     end
 
     if (
          @old_category_appraiser <> @new_category_appraiser
          or
          ( @old_category_appraiser is null and @new_category_appraiser is not null ) 
          or
          ( @old_category_appraiser is not null and @new_category_appraiser is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'sic_code' and
                    chg_log_columns = 'category_appraiser' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 762, 6012, convert(varchar(255), @old_category_appraiser), convert(varchar(255), @new_category_appraiser) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4729, convert(varchar(24), @new_sic_cd), 0)
          end
     end
 
     fetch next from curRows into @old_sic_cd, @old_sic_desc, @old_sys_flag, @old_category_appraiser, @new_sic_cd, @new_sic_desc, @new_sys_flag, @new_category_appraiser
end
 
close curRows
deallocate curRows

GO

