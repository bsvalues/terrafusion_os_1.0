CREATE TABLE [dbo].[pp_schedule_unit_count] (
    [pp_sched_id]            INT             NOT NULL,
    [pp_sched_unit_count_id] INT             NOT NULL,
    [year]                   NUMERIC (4)     NOT NULL,
    [unit_count_max]         NUMERIC (16, 4) NOT NULL,
    [unit_price]             NUMERIC (14, 2) NULL,
    [unit_percent]           NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_pp_schedule_unit_count] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_unit_count_id] ASC, [year] ASC, [unit_count_max] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_pp_schedule_unit_count_delete_ChangeLog
on pp_schedule_unit_count
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
          chg_log_tables = 'pp_schedule_unit_count' and
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
 
declare @pp_sched_id int
declare @pp_sched_unit_count_id int
declare @year numeric(4,0)
declare @unit_count_max numeric(16,4)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_unit_count_id, case year when 0 then @tvar_lFutureYear else year end, unit_count_max from deleted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_unit_count_id, @year, @unit_count_max
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + convert(varchar(24), @unit_count_max)
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @pp_sched_id
     and pps.year = @year
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 607, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @pp_sched_unit_count_id), @pp_sched_unit_count_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @unit_count_max), case when @unit_count_max > @tvar_intMin and @unit_count_max < @tvar_intMax then convert(int, round(@unit_count_max, 0, 1)) else 0 end)
 
     fetch next from curRows into @pp_sched_id, @pp_sched_unit_count_id, @year, @unit_count_max
end
 
close curRows
deallocate curRows

GO



create trigger tr_pp_schedule_unit_count_update_ChangeLog
on pp_schedule_unit_count
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
 
declare @old_pp_sched_id int
declare @new_pp_sched_id int
declare @old_pp_sched_unit_count_id int
declare @new_pp_sched_unit_count_id int
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_unit_count_max numeric(16,4)
declare @new_unit_count_max numeric(16,4)
declare @old_unit_price numeric(14,2)
declare @new_unit_price numeric(14,2)
declare @old_unit_percent numeric(5,2)
declare @new_unit_percent numeric(5,2)
 
declare curRows cursor
for
     select d.pp_sched_id, d.pp_sched_unit_count_id, case d.year when 0 then @tvar_lFutureYear else d.year end, d.unit_count_max, d.unit_price, d.unit_percent, i.pp_sched_id, i.pp_sched_unit_count_id, case i.year when 0 then @tvar_lFutureYear else i.year end, i.unit_count_max, i.unit_price, i.unit_percent
from deleted as d
join inserted as i on 
     d.pp_sched_id = i.pp_sched_id and
     d.pp_sched_unit_count_id = i.pp_sched_unit_count_id and
     d.year = i.year and
     d.unit_count_max = i.unit_count_max
for read only
 
open curRows
fetch next from curRows into @old_pp_sched_id, @old_pp_sched_unit_count_id, @old_year, @old_unit_count_max, @old_unit_price, @old_unit_percent, @new_pp_sched_id, @new_pp_sched_unit_count_id, @new_year, @new_unit_count_max, @new_unit_price, @new_unit_percent
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @new_year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + convert(varchar(24), @new_unit_count_max)
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @new_pp_sched_id
     and pps.year = @new_year
 
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
                    chg_log_tables = 'pp_schedule_unit_count' and
                    chg_log_columns = 'pp_sched_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 607, 3836, convert(varchar(255), @old_pp_sched_id), convert(varchar(255), @new_pp_sched_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @new_pp_sched_unit_count_id), @new_pp_sched_unit_count_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @new_unit_count_max), case when @new_unit_count_max > @tvar_intMin and @new_unit_count_max < @tvar_intMax then convert(int, round(@new_unit_count_max, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_unit_count_id <> @new_pp_sched_unit_count_id
          or
          ( @old_pp_sched_unit_count_id is null and @new_pp_sched_unit_count_id is not null ) 
          or
          ( @old_pp_sched_unit_count_id is not null and @new_pp_sched_unit_count_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_unit_count' and
                    chg_log_columns = 'pp_sched_unit_count_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 607, 3838, convert(varchar(255), @old_pp_sched_unit_count_id), convert(varchar(255), @new_pp_sched_unit_count_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @new_pp_sched_unit_count_id), @new_pp_sched_unit_count_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @new_unit_count_max), case when @new_unit_count_max > @tvar_intMin and @new_unit_count_max < @tvar_intMax then convert(int, round(@new_unit_count_max, 0, 1)) else 0 end)
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
                    chg_log_tables = 'pp_schedule_unit_count' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 607, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @new_pp_sched_unit_count_id), @new_pp_sched_unit_count_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @new_unit_count_max), case when @new_unit_count_max > @tvar_intMin and @new_unit_count_max < @tvar_intMax then convert(int, round(@new_unit_count_max, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_unit_count_max <> @new_unit_count_max
          or
          ( @old_unit_count_max is null and @new_unit_count_max is not null ) 
          or
          ( @old_unit_count_max is not null and @new_unit_count_max is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_unit_count' and
                    chg_log_columns = 'unit_count_max' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 607, 5414, convert(varchar(255), @old_unit_count_max), convert(varchar(255), @new_unit_count_max) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @new_pp_sched_unit_count_id), @new_pp_sched_unit_count_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @new_unit_count_max), case when @new_unit_count_max > @tvar_intMin and @new_unit_count_max < @tvar_intMax then convert(int, round(@new_unit_count_max, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_unit_price <> @new_unit_price
          or
          ( @old_unit_price is null and @new_unit_price is not null ) 
          or
          ( @old_unit_price is not null and @new_unit_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_unit_count' and
                    chg_log_columns = 'unit_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 607, 5416, convert(varchar(255), @old_unit_price), convert(varchar(255), @new_unit_price) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @new_pp_sched_unit_count_id), @new_pp_sched_unit_count_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @new_unit_count_max), case when @new_unit_count_max > @tvar_intMin and @new_unit_count_max < @tvar_intMax then convert(int, round(@new_unit_count_max, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_unit_percent <> @new_unit_percent
          or
          ( @old_unit_percent is null and @new_unit_percent is not null ) 
          or
          ( @old_unit_percent is not null and @new_unit_percent is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_unit_count' and
                    chg_log_columns = 'unit_percent' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 607, 5415, convert(varchar(255), @old_unit_percent), convert(varchar(255), @new_unit_percent) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @new_pp_sched_unit_count_id), @new_pp_sched_unit_count_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @new_unit_count_max), case when @new_unit_count_max > @tvar_intMin and @new_unit_count_max < @tvar_intMax then convert(int, round(@new_unit_count_max, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_pp_sched_id, @old_pp_sched_unit_count_id, @old_year, @old_unit_count_max, @old_unit_price, @old_unit_percent, @new_pp_sched_id, @new_pp_sched_unit_count_id, @new_year, @new_unit_count_max, @new_unit_price, @new_unit_percent
end
 
close curRows
deallocate curRows

GO



create trigger tr_pp_schedule_unit_count_delete_insert_update_MemTable
on pp_schedule_unit_count
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
where szTableName = 'pp_schedule_unit_count'

GO



create trigger tr_pp_schedule_unit_count_insert_ChangeLog
on pp_schedule_unit_count
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
 
declare @pp_sched_id int
declare @pp_sched_unit_count_id int
declare @year numeric(4,0)
declare @unit_count_max numeric(16,4)
declare @unit_price numeric(14,2)
declare @unit_percent numeric(5,2)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_unit_count_id, case year when 0 then @tvar_lFutureYear else year end, unit_count_max, unit_price, unit_percent from inserted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_unit_count_id, @year, @unit_count_max, @unit_price, @unit_percent
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + convert(varchar(24), @unit_count_max)
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @pp_sched_id
     and pps.year = @year
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_unit_count' and
               chg_log_columns = 'pp_sched_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 607, 3836, null, convert(varchar(255), @pp_sched_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @pp_sched_unit_count_id), @pp_sched_unit_count_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @unit_count_max), case when @unit_count_max > @tvar_intMin and @unit_count_max < @tvar_intMax then convert(int, round(@unit_count_max, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_unit_count' and
               chg_log_columns = 'pp_sched_unit_count_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 607, 3838, null, convert(varchar(255), @pp_sched_unit_count_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @pp_sched_unit_count_id), @pp_sched_unit_count_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @unit_count_max), case when @unit_count_max > @tvar_intMin and @unit_count_max < @tvar_intMax then convert(int, round(@unit_count_max, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_unit_count' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 607, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @pp_sched_unit_count_id), @pp_sched_unit_count_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @unit_count_max), case when @unit_count_max > @tvar_intMin and @unit_count_max < @tvar_intMax then convert(int, round(@unit_count_max, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_unit_count' and
               chg_log_columns = 'unit_count_max' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 607, 5414, null, convert(varchar(255), @unit_count_max), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @pp_sched_unit_count_id), @pp_sched_unit_count_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @unit_count_max), case when @unit_count_max > @tvar_intMin and @unit_count_max < @tvar_intMax then convert(int, round(@unit_count_max, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_unit_count' and
               chg_log_columns = 'unit_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 607, 5416, null, convert(varchar(255), @unit_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @pp_sched_unit_count_id), @pp_sched_unit_count_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @unit_count_max), case when @unit_count_max > @tvar_intMin and @unit_count_max < @tvar_intMax then convert(int, round(@unit_count_max, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_unit_count' and
               chg_log_columns = 'unit_percent' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 607, 5415, null, convert(varchar(255), @unit_percent), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3838, convert(varchar(24), @pp_sched_unit_count_id), @pp_sched_unit_count_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5414, convert(varchar(24), @unit_count_max), case when @unit_count_max > @tvar_intMin and @unit_count_max < @tvar_intMax then convert(int, round(@unit_count_max, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @pp_sched_id, @pp_sched_unit_count_id, @year, @unit_count_max, @unit_price, @unit_percent
end
 
close curRows
deallocate curRows

GO

