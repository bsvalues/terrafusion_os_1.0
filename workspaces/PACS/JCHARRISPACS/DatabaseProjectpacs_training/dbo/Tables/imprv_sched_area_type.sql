CREATE TABLE [dbo].[imprv_sched_area_type] (
    [imprv_sched_area_type_cd]   CHAR (10)     NOT NULL,
    [imprv_sched_area_type_desc] VARCHAR (100) NULL,
    CONSTRAINT [CPK_imprv_sched_area_type] PRIMARY KEY CLUSTERED ([imprv_sched_area_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_imprv_sched_area_type_delete_ChangeLog
on imprv_sched_area_type
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
          chg_log_tables = 'imprv_sched_area_type' and
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
 
declare @imprv_sched_area_type_cd char(10)
 
declare curRows cursor
for
     select imprv_sched_area_type_cd from deleted
for read only
 
open curRows
fetch next from curRows into @imprv_sched_area_type_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @imprv_sched_area_type_cd
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 327, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2301, convert(varchar(24), @imprv_sched_area_type_cd), 0)
 
     fetch next from curRows into @imprv_sched_area_type_cd
end
 
close curRows
deallocate curRows

GO



create trigger tr_imprv_sched_area_type_update_ChangeLog
on imprv_sched_area_type
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
 
declare @old_imprv_sched_area_type_cd char(10)
declare @new_imprv_sched_area_type_cd char(10)
declare @old_imprv_sched_area_type_desc varchar(100)
declare @new_imprv_sched_area_type_desc varchar(100)
 
declare curRows cursor
for
     select d.imprv_sched_area_type_cd, d.imprv_sched_area_type_desc, i.imprv_sched_area_type_cd, i.imprv_sched_area_type_desc
from deleted as d
join inserted as i on 
     d.imprv_sched_area_type_cd = i.imprv_sched_area_type_cd
for read only
 
open curRows
fetch next from curRows into @old_imprv_sched_area_type_cd, @old_imprv_sched_area_type_desc, @new_imprv_sched_area_type_cd, @new_imprv_sched_area_type_desc
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_imprv_sched_area_type_cd
 
     if (
          @old_imprv_sched_area_type_cd <> @new_imprv_sched_area_type_cd
          or
          ( @old_imprv_sched_area_type_cd is null and @new_imprv_sched_area_type_cd is not null ) 
          or
          ( @old_imprv_sched_area_type_cd is not null and @new_imprv_sched_area_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_area_type' and
                    chg_log_columns = 'imprv_sched_area_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 327, 2301, convert(varchar(255), @old_imprv_sched_area_type_cd), convert(varchar(255), @new_imprv_sched_area_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2301, convert(varchar(24), @new_imprv_sched_area_type_cd), 0)
          end
     end
 
     if (
          @old_imprv_sched_area_type_desc <> @new_imprv_sched_area_type_desc
          or
          ( @old_imprv_sched_area_type_desc is null and @new_imprv_sched_area_type_desc is not null ) 
          or
          ( @old_imprv_sched_area_type_desc is not null and @new_imprv_sched_area_type_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_sched_area_type' and
                    chg_log_columns = 'imprv_sched_area_type_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 327, 2302, convert(varchar(255), @old_imprv_sched_area_type_desc), convert(varchar(255), @new_imprv_sched_area_type_desc) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2301, convert(varchar(24), @new_imprv_sched_area_type_cd), 0)
          end
     end
 
     fetch next from curRows into @old_imprv_sched_area_type_cd, @old_imprv_sched_area_type_desc, @new_imprv_sched_area_type_cd, @new_imprv_sched_area_type_desc
end
 
close curRows
deallocate curRows

GO


create trigger tr_imprv_sched_area_type_delete_insert_update_MemTable
on imprv_sched_area_type
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
where szTableName = 'imprv_sched_area_type'

GO



create trigger tr_imprv_sched_area_type_insert_ChangeLog
on imprv_sched_area_type
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
 
declare @imprv_sched_area_type_cd char(10)
declare @imprv_sched_area_type_desc varchar(100)
 
declare curRows cursor
for
     select imprv_sched_area_type_cd, imprv_sched_area_type_desc from inserted
for read only
 
open curRows
fetch next from curRows into @imprv_sched_area_type_cd, @imprv_sched_area_type_desc
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @imprv_sched_area_type_cd
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_area_type' and
               chg_log_columns = 'imprv_sched_area_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 327, 2301, null, convert(varchar(255), @imprv_sched_area_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2301, convert(varchar(24), @imprv_sched_area_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_sched_area_type' and
               chg_log_columns = 'imprv_sched_area_type_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 327, 2302, null, convert(varchar(255), @imprv_sched_area_type_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2301, convert(varchar(24), @imprv_sched_area_type_cd), 0)
     end
 
     fetch next from curRows into @imprv_sched_area_type_cd, @imprv_sched_area_type_desc
end
 
close curRows
deallocate curRows

GO

