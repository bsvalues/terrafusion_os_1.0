CREATE TABLE [dbo].[pp_schedule_class] (
    [pp_sched_id]       INT             NOT NULL,
    [pp_sched_class_id] INT             NOT NULL,
    [year]              NUMERIC (4)     NOT NULL,
    [pp_class_cd]       CHAR (5)        NOT NULL,
    [pp_class_amt]      NUMERIC (14, 2) NULL,
    [pp_class_pct]      NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_pp_schedule_class] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_class_id] ASC, [year] ASC, [pp_class_cd] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_pp_schedule_class_insert_ChangeLog
on pp_schedule_class
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
declare @pp_sched_class_id int
declare @year numeric(4,0)
declare @pp_class_cd char(5)
declare @pp_class_amt numeric(14,2)
declare @pp_class_pct numeric(5,2)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_class_id, case year when 0 then @tvar_lFutureYear else year end, pp_class_cd, pp_class_amt, pp_class_pct from inserted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_class_id, @year, @pp_class_cd, @pp_class_amt, @pp_class_pct
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @pp_class_cd
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @pp_sched_id
     and pps.year = @year
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_class' and
               chg_log_columns = 'pp_sched_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 603, 3836, null, convert(varchar(255), @pp_sched_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @pp_sched_class_id), @pp_sched_class_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @pp_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_class' and
               chg_log_columns = 'pp_sched_class_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 603, 3833, null, convert(varchar(255), @pp_sched_class_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @pp_sched_class_id), @pp_sched_class_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @pp_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_class' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 603, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @pp_sched_class_id), @pp_sched_class_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @pp_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_class' and
               chg_log_columns = 'pp_class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 603, 3787, null, convert(varchar(255), @pp_class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @pp_sched_class_id), @pp_sched_class_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @pp_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_class' and
               chg_log_columns = 'pp_class_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 603, 3786, null, convert(varchar(255), @pp_class_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @pp_sched_class_id), @pp_sched_class_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @pp_class_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_class' and
               chg_log_columns = 'pp_class_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 603, 3789, null, convert(varchar(255), @pp_class_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @pp_sched_class_id), @pp_sched_class_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @pp_class_cd), 0)
     end
 
     fetch next from curRows into @pp_sched_id, @pp_sched_class_id, @year, @pp_class_cd, @pp_class_amt, @pp_class_pct
end
 
close curRows
deallocate curRows

GO



create trigger tr_pp_schedule_class_delete_insert_update_MemTable
on pp_schedule_class
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
where szTableName = 'pp_schedule_class'

GO



create trigger tr_pp_schedule_class_update_ChangeLog
on pp_schedule_class
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
declare @old_pp_sched_class_id int
declare @new_pp_sched_class_id int
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_pp_class_cd char(5)
declare @new_pp_class_cd char(5)
declare @old_pp_class_amt numeric(14,2)
declare @new_pp_class_amt numeric(14,2)
declare @old_pp_class_pct numeric(5,2)
declare @new_pp_class_pct numeric(5,2)
 
declare curRows cursor
for
     select d.pp_sched_id, d.pp_sched_class_id, case d.year when 0 then @tvar_lFutureYear else d.year end, d.pp_class_cd, d.pp_class_amt, d.pp_class_pct, i.pp_sched_id, i.pp_sched_class_id, case i.year when 0 then @tvar_lFutureYear else i.year end, i.pp_class_cd, i.pp_class_amt, i.pp_class_pct
from deleted as d
join inserted as i on 
     d.pp_sched_id = i.pp_sched_id and
     d.pp_sched_class_id = i.pp_sched_class_id and
     d.year = i.year and
     d.pp_class_cd = i.pp_class_cd
for read only
 
open curRows
fetch next from curRows into @old_pp_sched_id, @old_pp_sched_class_id, @old_year, @old_pp_class_cd, @old_pp_class_amt, @old_pp_class_pct, @new_pp_sched_id, @new_pp_sched_class_id, @new_year, @new_pp_class_cd, @new_pp_class_amt, @new_pp_class_pct
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @new_year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @new_pp_class_cd
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
                    chg_log_tables = 'pp_schedule_class' and
                    chg_log_columns = 'pp_sched_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 603, 3836, convert(varchar(255), @old_pp_sched_id), convert(varchar(255), @new_pp_sched_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @new_pp_sched_class_id), @new_pp_sched_class_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @new_pp_class_cd), 0)
          end
     end
 
     if (
          @old_pp_sched_class_id <> @new_pp_sched_class_id
          or
          ( @old_pp_sched_class_id is null and @new_pp_sched_class_id is not null ) 
          or
          ( @old_pp_sched_class_id is not null and @new_pp_sched_class_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_class' and
                    chg_log_columns = 'pp_sched_class_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 603, 3833, convert(varchar(255), @old_pp_sched_class_id), convert(varchar(255), @new_pp_sched_class_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @new_pp_sched_class_id), @new_pp_sched_class_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @new_pp_class_cd), 0)
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
                    chg_log_tables = 'pp_schedule_class' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 603, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @new_pp_sched_class_id), @new_pp_sched_class_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @new_pp_class_cd), 0)
          end
     end
 
     if (
          @old_pp_class_cd <> @new_pp_class_cd
          or
          ( @old_pp_class_cd is null and @new_pp_class_cd is not null ) 
          or
          ( @old_pp_class_cd is not null and @new_pp_class_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_class' and
                    chg_log_columns = 'pp_class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 603, 3787, convert(varchar(255), @old_pp_class_cd), convert(varchar(255), @new_pp_class_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @new_pp_sched_class_id), @new_pp_sched_class_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @new_pp_class_cd), 0)
          end
     end
 
     if (
          @old_pp_class_amt <> @new_pp_class_amt
          or
          ( @old_pp_class_amt is null and @new_pp_class_amt is not null ) 
          or
          ( @old_pp_class_amt is not null and @new_pp_class_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_class' and
                    chg_log_columns = 'pp_class_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 603, 3786, convert(varchar(255), @old_pp_class_amt), convert(varchar(255), @new_pp_class_amt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @new_pp_sched_class_id), @new_pp_sched_class_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @new_pp_class_cd), 0)
          end
     end
 
     if (
          @old_pp_class_pct <> @new_pp_class_pct
          or
          ( @old_pp_class_pct is null and @new_pp_class_pct is not null ) 
          or
          ( @old_pp_class_pct is not null and @new_pp_class_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_class' and
                    chg_log_columns = 'pp_class_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 603, 3789, convert(varchar(255), @old_pp_class_pct), convert(varchar(255), @new_pp_class_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @new_pp_sched_class_id), @new_pp_sched_class_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @new_pp_class_cd), 0)
          end
     end
 
     fetch next from curRows into @old_pp_sched_id, @old_pp_sched_class_id, @old_year, @old_pp_class_cd, @old_pp_class_amt, @old_pp_class_pct, @new_pp_sched_id, @new_pp_sched_class_id, @new_year, @new_pp_class_cd, @new_pp_class_amt, @new_pp_class_pct
end
 
close curRows
deallocate curRows

GO



create trigger tr_pp_schedule_class_delete_ChangeLog
on pp_schedule_class
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
          chg_log_tables = 'pp_schedule_class' and
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
declare @pp_sched_class_id int
declare @year numeric(4,0)
declare @pp_class_cd char(5)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_class_id, case year when 0 then @tvar_lFutureYear else year end, pp_class_cd from deleted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_class_id, @year, @pp_class_cd
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @pp_class_cd
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @pp_sched_id
     and pps.year = @year
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 603, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3833, convert(varchar(24), @pp_sched_class_id), @pp_sched_class_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3787, convert(varchar(24), @pp_class_cd), 0)
 
     fetch next from curRows into @pp_sched_id, @pp_sched_class_id, @year, @pp_class_cd
end
 
close curRows
deallocate curRows

GO

