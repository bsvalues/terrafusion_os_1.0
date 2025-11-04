CREATE TABLE [dbo].[legal_build_rules] (
    [abs_subdv_ind] CHAR (1)     NOT NULL,
    [field_cd]      INT          NOT NULL,
    [prefix]        VARCHAR (32) NULL,
    [suffix]        VARCHAR (32) NULL,
    [pos]           INT          NULL,
    [delimiter]     VARCHAR (3)  NULL,
    CONSTRAINT [CPK_legal_build_rules] PRIMARY KEY CLUSTERED ([abs_subdv_ind] ASC, [field_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_legal_build_rules_insert_ChangeLog
on legal_build_rules
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
 
declare @abs_subdv_ind char(1)
declare @field_cd int
declare @prefix varchar(32)
declare @suffix varchar(32)
declare @pos int
declare @delimiter varchar(3)
 
declare curRows cursor
for
     select abs_subdv_ind, field_cd, prefix, suffix, pos, delimiter from inserted
for read only
 
open curRows
fetch next from curRows into @abs_subdv_ind, @field_cd, @prefix, @suffix, @pos, @delimiter
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Type/Field: ' + @abs_subdv_ind + '/' + (select szFieldDesc from legal_build_rules_field_code with(nolock) where lFieldCode = @field_cd)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'legal_build_rules' and
               chg_log_columns = 'abs_subdv_ind' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 908, 26, null, convert(varchar(255), @abs_subdv_ind), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @abs_subdv_ind), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @field_cd), @field_cd)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'legal_build_rules' and
               chg_log_columns = 'field_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 908, 1875, null, convert(varchar(255), @field_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @abs_subdv_ind), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @field_cd), @field_cd)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'legal_build_rules' and
               chg_log_columns = 'prefix' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 908, 8709, null, convert(varchar(255), @prefix), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @abs_subdv_ind), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @field_cd), @field_cd)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'legal_build_rules' and
               chg_log_columns = 'suffix' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 908, 8745, null, convert(varchar(255), @suffix), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @abs_subdv_ind), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @field_cd), @field_cd)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'legal_build_rules' and
               chg_log_columns = 'pos' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 908, 8707, null, convert(varchar(255), @pos), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @abs_subdv_ind), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @field_cd), @field_cd)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'legal_build_rules' and
               chg_log_columns = 'delimiter' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 908, 8535, null, convert(varchar(255), @delimiter), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @abs_subdv_ind), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @field_cd), @field_cd)
     end
 
     fetch next from curRows into @abs_subdv_ind, @field_cd, @prefix, @suffix, @pos, @delimiter
end
 
close curRows
deallocate curRows

GO



create trigger tr_legal_build_rules_delete_ChangeLog
on legal_build_rules
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
          chg_log_tables = 'legal_build_rules' and
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
 
declare @abs_subdv_ind char(1)
declare @field_cd int
 
declare curRows cursor
for
     select abs_subdv_ind, field_cd from deleted
for read only
 
open curRows
fetch next from curRows into @abs_subdv_ind, @field_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Type/Field: ' + @abs_subdv_ind + '/' + (select szFieldDesc from legal_build_rules_field_code with(nolock) where lFieldCode = @field_cd)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 908, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @abs_subdv_ind), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @field_cd), @field_cd)
 
     fetch next from curRows into @abs_subdv_ind, @field_cd
end
 
close curRows
deallocate curRows

GO



create trigger tr_legal_build_rules_update_ChangeLog
on legal_build_rules
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
 
declare @old_abs_subdv_ind char(1)
declare @new_abs_subdv_ind char(1)
declare @old_field_cd int
declare @new_field_cd int
declare @old_prefix varchar(32)
declare @new_prefix varchar(32)
declare @old_suffix varchar(32)
declare @new_suffix varchar(32)
declare @old_pos int
declare @new_pos int
declare @old_delimiter varchar(3)
declare @new_delimiter varchar(3)
 
declare curRows cursor
for
     select d.abs_subdv_ind, d.field_cd, d.prefix, d.suffix, d.pos, d.delimiter, i.abs_subdv_ind, i.field_cd, i.prefix, i.suffix, i.pos, i.delimiter
from deleted as d
join inserted as i on 
     d.abs_subdv_ind = i.abs_subdv_ind and
     d.field_cd = i.field_cd
for read only
 
open curRows
fetch next from curRows into @old_abs_subdv_ind, @old_field_cd, @old_prefix, @old_suffix, @old_pos, @old_delimiter, @new_abs_subdv_ind, @new_field_cd, @new_prefix, @new_suffix, @new_pos, @new_delimiter
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = 'Type/Field: ' + @new_abs_subdv_ind + '/' + (select szFieldDesc from legal_build_rules_field_code with(nolock) where lFieldCode = @new_field_cd)
 
     if (
          @old_abs_subdv_ind <> @new_abs_subdv_ind
          or
          ( @old_abs_subdv_ind is null and @new_abs_subdv_ind is not null ) 
          or
          ( @old_abs_subdv_ind is not null and @new_abs_subdv_ind is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'legal_build_rules' and
                    chg_log_columns = 'abs_subdv_ind' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 908, 26, convert(varchar(255), @old_abs_subdv_ind), convert(varchar(255), @new_abs_subdv_ind), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @new_abs_subdv_ind), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @new_field_cd), @new_field_cd)
          end
     end
 
     if (
          @old_field_cd <> @new_field_cd
          or
          ( @old_field_cd is null and @new_field_cd is not null ) 
          or
          ( @old_field_cd is not null and @new_field_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'legal_build_rules' and
                    chg_log_columns = 'field_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 908, 1875, convert(varchar(255), @old_field_cd), convert(varchar(255), @new_field_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @new_abs_subdv_ind), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @new_field_cd), @new_field_cd)
          end
     end
 
     if (
          @old_prefix <> @new_prefix
          or
          ( @old_prefix is null and @new_prefix is not null ) 
          or
          ( @old_prefix is not null and @new_prefix is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'legal_build_rules' and
                    chg_log_columns = 'prefix' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 908, 8709, convert(varchar(255), @old_prefix), convert(varchar(255), @new_prefix), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @new_abs_subdv_ind), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @new_field_cd), @new_field_cd)
          end
     end
 
     if (
          @old_suffix <> @new_suffix
          or
          ( @old_suffix is null and @new_suffix is not null ) 
          or
          ( @old_suffix is not null and @new_suffix is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'legal_build_rules' and
                    chg_log_columns = 'suffix' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 908, 8745, convert(varchar(255), @old_suffix), convert(varchar(255), @new_suffix), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @new_abs_subdv_ind), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @new_field_cd), @new_field_cd)
          end
     end
 
     if (
          @old_pos <> @new_pos
          or
          ( @old_pos is null and @new_pos is not null ) 
          or
          ( @old_pos is not null and @new_pos is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'legal_build_rules' and
                    chg_log_columns = 'pos' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 908, 8707, convert(varchar(255), @old_pos), convert(varchar(255), @new_pos), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @new_abs_subdv_ind), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @new_field_cd), @new_field_cd)
          end
     end
 
     if (
          @old_delimiter <> @new_delimiter
          or
          ( @old_delimiter is null and @new_delimiter is not null ) 
          or
          ( @old_delimiter is not null and @new_delimiter is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'legal_build_rules' and
                    chg_log_columns = 'delimiter' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 908, 8535, convert(varchar(255), @old_delimiter), convert(varchar(255), @new_delimiter), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 26, convert(varchar(24), @new_abs_subdv_ind), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1875, convert(varchar(24), @new_field_cd), @new_field_cd)
          end
     end
 
     fetch next from curRows into @old_abs_subdv_ind, @old_field_cd, @old_prefix, @old_suffix, @old_pos, @old_delimiter, @new_abs_subdv_ind, @new_field_cd, @new_prefix, @new_suffix, @new_pos, @new_delimiter
end
 
close curRows
deallocate curRows

GO


create trigger tr_legal_build_rules_delete_insert_update_MemTable
on legal_build_rules
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
where szTableName = 'legal_build_rules'

GO

