CREATE TABLE [dbo].[pp_schedule_adj] (
    [pp_sched_id]       INT            NOT NULL,
    [pp_sched_adj_id]   INT            NOT NULL,
    [year]              NUMERIC (4)    NOT NULL,
    [pp_sched_adj_cd]   CHAR (5)       NULL,
    [pp_sched_adj_desc] VARCHAR (50)   NULL,
    [pp_sched_adj_pc]   NUMERIC (5, 2) NULL,
    [pp_sched_adj_amt]  NUMERIC (14)   NULL,
    [sys_flag]          CHAR (1)       NULL,
    CONSTRAINT [CPK_pp_schedule_adj] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_adj_id] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_pp_schedule_adj_delete_ChangeLog
on pp_schedule_adj
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
          chg_log_tables = 'pp_schedule_adj' and
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
declare @pp_sched_adj_id int
declare @year numeric(4,0)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_adj_id, case year when 0 then @tvar_lFutureYear else year end from deleted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_adj_id, @year
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + ppsa.pp_sched_adj_cd
     from pp_schedule_adj as ppsa with(nolock)
     join pp_schedule as pps with(nolock) on
          pps.pp_sched_id = @pp_sched_id
          and pps.year = @year
     where
          ppsa.pp_sched_id = @pp_sched_id and
          ppsa.pp_sched_adj_id = @pp_sched_adj_id and
          ppsa.year = @year
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 601, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
 
     fetch next from curRows into @pp_sched_id, @pp_sched_adj_id, @year
end
 
close curRows
deallocate curRows

GO



create trigger tr_pp_schedule_adj_delete_insert_update_MemTable
on pp_schedule_adj
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
where szTableName = 'pp_schedule_adj'

GO



create trigger tr_pp_schedule_adj_update_ChangeLog
on pp_schedule_adj
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
declare @old_pp_sched_adj_id int
declare @new_pp_sched_adj_id int
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_pp_sched_adj_cd char(5)
declare @new_pp_sched_adj_cd char(5)
declare @old_pp_sched_adj_desc varchar(50)
declare @new_pp_sched_adj_desc varchar(50)
declare @old_pp_sched_adj_pc numeric(5,2)
declare @new_pp_sched_adj_pc numeric(5,2)
declare @old_pp_sched_adj_amt numeric(14,0)
declare @new_pp_sched_adj_amt numeric(14,0)
declare @old_sys_flag char(1)
declare @new_sys_flag char(1)
 
declare curRows cursor
for
     select d.pp_sched_id, d.pp_sched_adj_id, case d.year when 0 then @tvar_lFutureYear else d.year end, d.pp_sched_adj_cd, d.pp_sched_adj_desc, d.pp_sched_adj_pc, d.pp_sched_adj_amt, d.sys_flag, i.pp_sched_id, i.pp_sched_adj_id, case i.year when 0 then @tvar_lFutureYear else i.year end, i.pp_sched_adj_cd, i.pp_sched_adj_desc, i.pp_sched_adj_pc, i.pp_sched_adj_amt, i.sys_flag
from deleted as d
join inserted as i on 
     d.pp_sched_id = i.pp_sched_id and
     d.pp_sched_adj_id = i.pp_sched_adj_id and
     d.year = i.year
for read only
 
open curRows
fetch next from curRows into @old_pp_sched_id, @old_pp_sched_adj_id, @old_year, @old_pp_sched_adj_cd, @old_pp_sched_adj_desc, @old_pp_sched_adj_pc, @old_pp_sched_adj_amt, @old_sys_flag, @new_pp_sched_id, @new_pp_sched_adj_id, @new_year, @new_pp_sched_adj_cd, @new_pp_sched_adj_desc, @new_pp_sched_adj_pc, @new_pp_sched_adj_amt, @new_sys_flag
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @new_year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @new_pp_sched_adj_cd
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
                    chg_log_tables = 'pp_schedule_adj' and
                    chg_log_columns = 'pp_sched_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 601, 3836, convert(varchar(255), @old_pp_sched_id), convert(varchar(255), @new_pp_sched_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @new_pp_sched_adj_id), @new_pp_sched_adj_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_adj_id <> @new_pp_sched_adj_id
          or
          ( @old_pp_sched_adj_id is null and @new_pp_sched_adj_id is not null ) 
          or
          ( @old_pp_sched_adj_id is not null and @new_pp_sched_adj_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_adj' and
                    chg_log_columns = 'pp_sched_adj_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 601, 3829, convert(varchar(255), @old_pp_sched_adj_id), convert(varchar(255), @new_pp_sched_adj_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @new_pp_sched_adj_id), @new_pp_sched_adj_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
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
                    chg_log_tables = 'pp_schedule_adj' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 601, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @new_pp_sched_adj_id), @new_pp_sched_adj_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_adj_cd <> @new_pp_sched_adj_cd
          or
          ( @old_pp_sched_adj_cd is null and @new_pp_sched_adj_cd is not null ) 
          or
          ( @old_pp_sched_adj_cd is not null and @new_pp_sched_adj_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_adj' and
                    chg_log_columns = 'pp_sched_adj_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 601, 3827, convert(varchar(255), @old_pp_sched_adj_cd), convert(varchar(255), @new_pp_sched_adj_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @new_pp_sched_adj_id), @new_pp_sched_adj_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_adj_desc <> @new_pp_sched_adj_desc
          or
          ( @old_pp_sched_adj_desc is null and @new_pp_sched_adj_desc is not null ) 
          or
          ( @old_pp_sched_adj_desc is not null and @new_pp_sched_adj_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_adj' and
                    chg_log_columns = 'pp_sched_adj_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 601, 3828, convert(varchar(255), @old_pp_sched_adj_desc), convert(varchar(255), @new_pp_sched_adj_desc) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @new_pp_sched_adj_id), @new_pp_sched_adj_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_adj_pc <> @new_pp_sched_adj_pc
          or
          ( @old_pp_sched_adj_pc is null and @new_pp_sched_adj_pc is not null ) 
          or
          ( @old_pp_sched_adj_pc is not null and @new_pp_sched_adj_pc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_adj' and
                    chg_log_columns = 'pp_sched_adj_pc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 601, 3830, convert(varchar(255), @old_pp_sched_adj_pc), convert(varchar(255), @new_pp_sched_adj_pc) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @new_pp_sched_adj_id), @new_pp_sched_adj_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_adj_amt <> @new_pp_sched_adj_amt
          or
          ( @old_pp_sched_adj_amt is null and @new_pp_sched_adj_amt is not null ) 
          or
          ( @old_pp_sched_adj_amt is not null and @new_pp_sched_adj_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_adj' and
                    chg_log_columns = 'pp_sched_adj_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 601, 3826, convert(varchar(255), @old_pp_sched_adj_amt), convert(varchar(255), @new_pp_sched_adj_amt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @new_pp_sched_adj_id), @new_pp_sched_adj_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
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
                    chg_log_tables = 'pp_schedule_adj' and
                    chg_log_columns = 'sys_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 601, 5025, convert(varchar(255), @old_sys_flag), convert(varchar(255), @new_sys_flag) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @new_pp_sched_adj_id), @new_pp_sched_adj_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_pp_sched_id, @old_pp_sched_adj_id, @old_year, @old_pp_sched_adj_cd, @old_pp_sched_adj_desc, @old_pp_sched_adj_pc, @old_pp_sched_adj_amt, @old_sys_flag, @new_pp_sched_id, @new_pp_sched_adj_id, @new_year, @new_pp_sched_adj_cd, @new_pp_sched_adj_desc, @new_pp_sched_adj_pc, @new_pp_sched_adj_amt, @new_sys_flag
end
 
close curRows
deallocate curRows

GO



create trigger tr_pp_schedule_adj_insert_ChangeLog
on pp_schedule_adj
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
declare @pp_sched_adj_id int
declare @year numeric(4,0)
declare @pp_sched_adj_cd char(5)
declare @pp_sched_adj_desc varchar(50)
declare @pp_sched_adj_pc numeric(5,2)
declare @pp_sched_adj_amt numeric(14,0)
declare @sys_flag char(1)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_adj_id, case year when 0 then @tvar_lFutureYear else year end, pp_sched_adj_cd, pp_sched_adj_desc, pp_sched_adj_pc, pp_sched_adj_amt, sys_flag from inserted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_adj_id, @year, @pp_sched_adj_cd, @pp_sched_adj_desc, @pp_sched_adj_pc, @pp_sched_adj_amt, @sys_flag
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @pp_sched_adj_cd
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @pp_sched_id
     and pps.year = @year
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_adj' and
               chg_log_columns = 'pp_sched_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 601, 3836, null, convert(varchar(255), @pp_sched_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_adj' and
               chg_log_columns = 'pp_sched_adj_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 601, 3829, null, convert(varchar(255), @pp_sched_adj_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_adj' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 601, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_adj' and
               chg_log_columns = 'pp_sched_adj_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 601, 3827, null, convert(varchar(255), @pp_sched_adj_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_adj' and
               chg_log_columns = 'pp_sched_adj_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 601, 3828, null, convert(varchar(255), @pp_sched_adj_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_adj' and
               chg_log_columns = 'pp_sched_adj_pc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 601, 3830, null, convert(varchar(255), @pp_sched_adj_pc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_adj' and
               chg_log_columns = 'pp_sched_adj_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 601, 3826, null, convert(varchar(255), @pp_sched_adj_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_adj' and
               chg_log_columns = 'sys_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 601, 5025, null, convert(varchar(255), @sys_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3829, convert(varchar(24), @pp_sched_adj_id), @pp_sched_adj_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @pp_sched_id, @pp_sched_adj_id, @year, @pp_sched_adj_cd, @pp_sched_adj_desc, @pp_sched_adj_pc, @pp_sched_adj_amt, @sys_flag
end
 
close curRows
deallocate curRows

GO

