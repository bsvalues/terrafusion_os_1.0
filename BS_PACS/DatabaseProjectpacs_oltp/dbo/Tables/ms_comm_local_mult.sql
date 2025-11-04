CREATE TABLE [dbo].[ms_comm_local_mult] (
    [ms_year]     NUMERIC (4)    NOT NULL,
    [local_class] VARCHAR (10)   NOT NULL,
    [local_value] NUMERIC (6, 4) NULL,
    CONSTRAINT [CPK_ms_comm_local_mult] PRIMARY KEY CLUSTERED ([ms_year] ASC, [local_class] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_ms_comm_local_mult_insert_ChangeLog
on ms_comm_local_mult
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
 
declare @ms_year numeric(4,0)
declare @local_class varchar(10)
declare @local_value numeric(6,4)
 
declare curRows cursor
for
     select case ms_year when 0 then @tvar_lFutureYear else ms_year end, local_class, local_value from inserted
for read only
 
open curRows
fetch next from curRows into @ms_year, @local_class, @local_value
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @ms_year) + '-' + @local_class
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'ms_comm_local_mult' and
               chg_log_columns = 'ms_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 449, 3211, null, convert(varchar(255), @ms_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @ms_year), case when @ms_year > @tvar_intMin and @ms_year < @tvar_intMax then convert(int, round(@ms_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2886, convert(varchar(24), @local_class), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'ms_comm_local_mult' and
               chg_log_columns = 'local_class' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 449, 2886, null, convert(varchar(255), @local_class), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @ms_year), case when @ms_year > @tvar_intMin and @ms_year < @tvar_intMax then convert(int, round(@ms_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2886, convert(varchar(24), @local_class), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'ms_comm_local_mult' and
               chg_log_columns = 'local_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 449, 2902, null, convert(varchar(255), @local_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @ms_year), case when @ms_year > @tvar_intMin and @ms_year < @tvar_intMax then convert(int, round(@ms_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2886, convert(varchar(24), @local_class), 0)
     end
 
     fetch next from curRows into @ms_year, @local_class, @local_value
end
 
close curRows
deallocate curRows

GO



create trigger tr_ms_comm_local_mult_update_ChangeLog
on ms_comm_local_mult
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
 
declare @old_ms_year numeric(4,0)
declare @new_ms_year numeric(4,0)
declare @old_local_class varchar(10)
declare @new_local_class varchar(10)
declare @old_local_value numeric(6,4)
declare @new_local_value numeric(6,4)
 
declare curRows cursor
for
     select case d.ms_year when 0 then @tvar_lFutureYear else d.ms_year end, d.local_class, d.local_value, case i.ms_year when 0 then @tvar_lFutureYear else i.ms_year end, i.local_class, i.local_value
from deleted as d
join inserted as i on 
     d.ms_year = i.ms_year and
     d.local_class = i.local_class
for read only
 
open curRows
fetch next from curRows into @old_ms_year, @old_local_class, @old_local_value, @new_ms_year, @new_local_class, @new_local_value
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @new_ms_year) + '-' + @new_local_class
 
     if (
          @old_ms_year <> @new_ms_year
          or
          ( @old_ms_year is null and @new_ms_year is not null ) 
          or
          ( @old_ms_year is not null and @new_ms_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'ms_comm_local_mult' and
                    chg_log_columns = 'ms_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 449, 3211, convert(varchar(255), @old_ms_year), convert(varchar(255), @new_ms_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @new_ms_year), case when @new_ms_year > @tvar_intMin and @new_ms_year < @tvar_intMax then convert(int, round(@new_ms_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2886, convert(varchar(24), @new_local_class), 0)
          end
     end
 
     if (
          @old_local_class <> @new_local_class
          or
          ( @old_local_class is null and @new_local_class is not null ) 
          or
          ( @old_local_class is not null and @new_local_class is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'ms_comm_local_mult' and
                    chg_log_columns = 'local_class' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 449, 2886, convert(varchar(255), @old_local_class), convert(varchar(255), @new_local_class) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @new_ms_year), case when @new_ms_year > @tvar_intMin and @new_ms_year < @tvar_intMax then convert(int, round(@new_ms_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2886, convert(varchar(24), @new_local_class), 0)
          end
     end
 
     if (
          @old_local_value <> @new_local_value
          or
          ( @old_local_value is null and @new_local_value is not null ) 
          or
          ( @old_local_value is not null and @new_local_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'ms_comm_local_mult' and
                    chg_log_columns = 'local_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 449, 2902, convert(varchar(255), @old_local_value), convert(varchar(255), @new_local_value) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @new_ms_year), case when @new_ms_year > @tvar_intMin and @new_ms_year < @tvar_intMax then convert(int, round(@new_ms_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2886, convert(varchar(24), @new_local_class), 0)
          end
     end
 
     fetch next from curRows into @old_ms_year, @old_local_class, @old_local_value, @new_ms_year, @new_local_class, @new_local_value
end
 
close curRows
deallocate curRows

GO



create trigger tr_ms_comm_local_mult_delete_ChangeLog
on ms_comm_local_mult
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
          chg_log_tables = 'ms_comm_local_mult' and
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
 
declare @ms_year numeric(4,0)
declare @local_class varchar(10)
 
declare curRows cursor
for
     select case ms_year when 0 then @tvar_lFutureYear else ms_year end, local_class from deleted
for read only
 
open curRows
fetch next from curRows into @ms_year, @local_class
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @ms_year) + '-' + @local_class
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 449, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3211, convert(varchar(24), @ms_year), case when @ms_year > @tvar_intMin and @ms_year < @tvar_intMax then convert(int, round(@ms_year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2886, convert(varchar(24), @local_class), 0)
 
     fetch next from curRows into @ms_year, @local_class
end
 
close curRows
deallocate curRows

GO


create trigger tr_ms_comm_local_mult_delete_insert_update_MemTable
on ms_comm_local_mult
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
where szTableName = 'ms_comm_local_mult'

GO

