CREATE TABLE [dbo].[pp_schedule] (
    [pp_sched_id]  INT         NOT NULL,
    [year]         NUMERIC (4) NOT NULL,
    [value_method] CHAR (5)    NOT NULL,
    [table_code]   CHAR (10)   NOT NULL,
    [segment_type] CHAR (10)   NOT NULL,
    CONSTRAINT [CPK_pp_schedule] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [year] ASC, [value_method] ASC, [table_code] ASC, [segment_type] ASC) WITH (FILLFACTOR = 100)
);


GO

 
create trigger tr_pp_schedule_insert_ChangeLog
on pp_schedule
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
 
declare @pp_sched_id int
declare @year numeric(4,0)
declare @value_method char(5)
declare @table_code char(10)
declare @segment_type char(10)
 
declare curRows cursor
for
     select pp_sched_id, case year when 0 then @tvar_lFutureYear else year end, value_method, table_code, segment_type from inserted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @year, @value_method, @table_code, @segment_type
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @year) + '-' + @value_method + '-' + @table_code + '-' + @segment_type
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule' and
               chg_log_columns = 'pp_sched_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 600, 3836, null, convert(varchar(255), @pp_sched_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @value_method), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @table_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @segment_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 600, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @value_method), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @table_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @segment_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule' and
               chg_log_columns = 'value_method' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 600, 5491, null, convert(varchar(255), @value_method), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @value_method), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @table_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @segment_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule' and
               chg_log_columns = 'table_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 600, 5081, null, convert(varchar(255), @table_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @value_method), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @table_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @segment_type), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule' and
               chg_log_columns = 'segment_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 600, 4690, null, convert(varchar(255), @segment_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @value_method), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @table_code), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @segment_type), 0)
     end
 
     fetch next from curRows into @pp_sched_id, @year, @value_method, @table_code, @segment_type
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_pp_schedule_delete_ChangeLog
on pp_schedule
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
          chg_log_tables = 'pp_schedule' and
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
 
declare @pp_sched_id int
declare @year numeric(4,0)
declare @value_method char(5)
declare @table_code char(10)
declare @segment_type char(10)
 
declare curRows cursor
for
     select pp_sched_id, case year when 0 then @tvar_lFutureYear else year end, value_method, table_code, segment_type from deleted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @year, @value_method, @table_code, @segment_type
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @year) + '-' + @value_method + '-' + @table_code + '-' + @segment_type
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 600, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @value_method), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @table_code), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @segment_type), 0)
 
     fetch next from curRows into @pp_sched_id, @year, @value_method, @table_code, @segment_type
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_pp_schedule_update_ChangeLog
on pp_schedule
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
 
declare @old_pp_sched_id int
declare @new_pp_sched_id int
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_value_method char(5)
declare @new_value_method char(5)
declare @old_table_code char(10)
declare @new_table_code char(10)
declare @old_segment_type char(10)
declare @new_segment_type char(10)
 
declare curRows cursor
for
     select d.pp_sched_id, case d.year when 0 then @tvar_lFutureYear else d.year end, d.value_method, d.table_code, d.segment_type, 
            i.pp_sched_id, case i.year when 0 then @tvar_lFutureYear else i.year end, i.value_method, i.table_code, i.segment_type
from deleted as d
join inserted as i on 
     d.pp_sched_id = i.pp_sched_id and
     d.year = i.year and
     d.value_method = i.value_method and
     d.table_code = i.table_code and
     d.segment_type = i.segment_type
for read only
 
open curRows
fetch next from curRows into @old_pp_sched_id, @old_year, @old_value_method, @old_table_code, @old_segment_type, 
                             @new_pp_sched_id, @new_year, @new_value_method, @new_table_code, @new_segment_type
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = convert(varchar(4), @new_year) + '-' + @new_value_method + '-' + @new_table_code + '-' + @new_segment_type
 
     if (
          @old_pp_sched_id <> @new_pp_sched_id
          or
          ( @old_pp_sched_id is null and @new_pp_sched_id is not null ) 
          or
          ( @old_pp_sched_id is not null and @new_pp_sched_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule' and
                    chg_log_columns = 'pp_sched_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 600, 3836, convert(varchar(255), @old_pp_sched_id), convert(varchar(255), @new_pp_sched_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @new_value_method), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @new_table_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @new_segment_type), 0)
          end
     end
 
     if (
          @old_year <> @new_year
          or
          ( @old_year is null and @new_year is not null ) 
          or
          ( @old_year is not null and @new_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 600, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @new_value_method), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @new_table_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @new_segment_type), 0)
          end
     end
 
     if (
          @old_value_method <> @new_value_method
          or
          ( @old_value_method is null and @new_value_method is not null ) 
          or
          ( @old_value_method is not null and @new_value_method is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule' and
                    chg_log_columns = 'value_method' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 600, 5491, convert(varchar(255), @old_value_method), convert(varchar(255), @new_value_method), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @new_value_method), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @new_table_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @new_segment_type), 0)
          end
     end
 
     if (
          @old_table_code <> @new_table_code
          or
          ( @old_table_code is null and @new_table_code is not null ) 
          or
          ( @old_table_code is not null and @new_table_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule' and
                    chg_log_columns = 'table_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 600, 5081, convert(varchar(255), @old_table_code), convert(varchar(255), @new_table_code), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @new_value_method), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @new_table_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @new_segment_type), 0)
          end
     end
 
     if (
          @old_segment_type <> @new_segment_type
          or
          ( @old_segment_type is null and @new_segment_type is not null ) 
          or
          ( @old_segment_type is not null and @new_segment_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule' and
                    chg_log_columns = 'segment_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 600, 4690, convert(varchar(255), @old_segment_type), convert(varchar(255), @new_segment_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5491, convert(varchar(24), @new_value_method), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5081, convert(varchar(24), @new_table_code), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4690, convert(varchar(24), @new_segment_type), 0)
          end
     end
 
     fetch next from curRows into @old_pp_sched_id, @old_year, @old_value_method, @old_table_code, @old_segment_type, 
                                  @new_pp_sched_id, @new_year, @new_value_method, @new_table_code, @new_segment_type
end
 
close curRows
deallocate curRows

GO

