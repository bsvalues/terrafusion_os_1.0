CREATE TABLE [dbo].[pp_schedule_quality_density] (
    [pp_sched_id]    INT             NOT NULL,
    [pp_sched_qd_id] INT             NOT NULL,
    [year]           NUMERIC (4)     NOT NULL,
    [quality_cd]     CHAR (5)        NULL,
    [density_cd]     CHAR (5)        NULL,
    [qd_unit_price]  NUMERIC (14, 2) NULL,
    [qd_percent]     NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_pp_schedule_quality_density] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_qd_id] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_pp_schedule_quality_density_update_ChangeLog
on pp_schedule_quality_density
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
declare @old_pp_sched_qd_id int
declare @new_pp_sched_qd_id int
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_quality_cd char(5)
declare @new_quality_cd char(5)
declare @old_density_cd char(5)
declare @new_density_cd char(5)
declare @old_qd_unit_price numeric(14,2)
declare @new_qd_unit_price numeric(14,2)
declare @old_qd_percent numeric(5,2)
declare @new_qd_percent numeric(5,2)
 
declare curRows cursor
for
     select d.pp_sched_id, d.pp_sched_qd_id, case d.year when 0 then @tvar_lFutureYear else d.year end, d.quality_cd, d.density_cd, d.qd_unit_price, d.qd_percent, i.pp_sched_id, i.pp_sched_qd_id, case i.year when 0 then @tvar_lFutureYear else i.year end, i.quality_cd, i.density_cd, i.qd_unit_price, i.qd_percent
from deleted as d
join inserted as i on 
     d.pp_sched_id = i.pp_sched_id and
     d.pp_sched_qd_id = i.pp_sched_qd_id and
     d.year = i.year
for read only
 
open curRows
fetch next from curRows into @old_pp_sched_id, @old_pp_sched_qd_id, @old_year, @old_quality_cd, @old_density_cd, @old_qd_unit_price, @old_qd_percent, @new_pp_sched_id, @new_pp_sched_qd_id, @new_year, @new_quality_cd, @new_density_cd, @new_qd_unit_price, @new_qd_percent
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @new_year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @new_quality_cd + '-' + @new_density_cd
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
                    chg_log_tables = 'pp_schedule_quality_density' and
                    chg_log_columns = 'pp_sched_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 606, 3836, convert(varchar(255), @old_pp_sched_id), convert(varchar(255), @new_pp_sched_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @new_pp_sched_qd_id), @new_pp_sched_qd_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_qd_id <> @new_pp_sched_qd_id
          or
          ( @old_pp_sched_qd_id is null and @new_pp_sched_qd_id is not null ) 
          or
          ( @old_pp_sched_qd_id is not null and @new_pp_sched_qd_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_quality_density' and
                    chg_log_columns = 'pp_sched_qd_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 606, 3837, convert(varchar(255), @old_pp_sched_qd_id), convert(varchar(255), @new_pp_sched_qd_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @new_pp_sched_qd_id), @new_pp_sched_qd_id)
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
                    chg_log_tables = 'pp_schedule_quality_density' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 606, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @new_pp_sched_qd_id), @new_pp_sched_qd_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_quality_cd <> @new_quality_cd
          or
          ( @old_quality_cd is null and @new_quality_cd is not null ) 
          or
          ( @old_quality_cd is not null and @new_quality_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_quality_density' and
                    chg_log_columns = 'quality_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 606, 4240, convert(varchar(255), @old_quality_cd), convert(varchar(255), @new_quality_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @new_pp_sched_qd_id), @new_pp_sched_qd_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_density_cd <> @new_density_cd
          or
          ( @old_density_cd is null and @new_density_cd is not null ) 
          or
          ( @old_density_cd is not null and @new_density_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_quality_density' and
                    chg_log_columns = 'density_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 606, 1305, convert(varchar(255), @old_density_cd), convert(varchar(255), @new_density_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @new_pp_sched_qd_id), @new_pp_sched_qd_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_qd_unit_price <> @new_qd_unit_price
          or
          ( @old_qd_unit_price is null and @new_qd_unit_price is not null ) 
          or
          ( @old_qd_unit_price is not null and @new_qd_unit_price is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_quality_density' and
                    chg_log_columns = 'qd_unit_price' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 606, 4237, convert(varchar(255), @old_qd_unit_price), convert(varchar(255), @new_qd_unit_price) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @new_pp_sched_qd_id), @new_pp_sched_qd_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_qd_percent <> @new_qd_percent
          or
          ( @old_qd_percent is null and @new_qd_percent is not null ) 
          or
          ( @old_qd_percent is not null and @new_qd_percent is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_quality_density' and
                    chg_log_columns = 'qd_percent' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 606, 4236, convert(varchar(255), @old_qd_percent), convert(varchar(255), @new_qd_percent) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @new_pp_sched_qd_id), @new_pp_sched_qd_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_pp_sched_id, @old_pp_sched_qd_id, @old_year, @old_quality_cd, @old_density_cd, @old_qd_unit_price, @old_qd_percent, @new_pp_sched_id, @new_pp_sched_qd_id, @new_year, @new_quality_cd, @new_density_cd, @new_qd_unit_price, @new_qd_percent
end
 
close curRows
deallocate curRows

GO



create trigger tr_pp_schedule_quality_density_insert_ChangeLog
on pp_schedule_quality_density
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
declare @pp_sched_qd_id int
declare @year numeric(4,0)
declare @quality_cd char(5)
declare @density_cd char(5)
declare @qd_unit_price numeric(14,2)
declare @qd_percent numeric(5,2)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_qd_id, case year when 0 then @tvar_lFutureYear else year end, quality_cd, density_cd, qd_unit_price, qd_percent from inserted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_qd_id, @year, @quality_cd, @density_cd, @qd_unit_price, @qd_percent
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @quality_cd + '-' + @density_cd
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @pp_sched_id
     and pps.year = @year
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_quality_density' and
               chg_log_columns = 'pp_sched_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 606, 3836, null, convert(varchar(255), @pp_sched_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @pp_sched_qd_id), @pp_sched_qd_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_quality_density' and
               chg_log_columns = 'pp_sched_qd_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 606, 3837, null, convert(varchar(255), @pp_sched_qd_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @pp_sched_qd_id), @pp_sched_qd_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_quality_density' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 606, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @pp_sched_qd_id), @pp_sched_qd_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_quality_density' and
               chg_log_columns = 'quality_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 606, 4240, null, convert(varchar(255), @quality_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @pp_sched_qd_id), @pp_sched_qd_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_quality_density' and
               chg_log_columns = 'density_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 606, 1305, null, convert(varchar(255), @density_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @pp_sched_qd_id), @pp_sched_qd_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_quality_density' and
               chg_log_columns = 'qd_unit_price' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 606, 4237, null, convert(varchar(255), @qd_unit_price), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @pp_sched_qd_id), @pp_sched_qd_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_quality_density' and
               chg_log_columns = 'qd_percent' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 606, 4236, null, convert(varchar(255), @qd_percent), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @pp_sched_qd_id), @pp_sched_qd_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @pp_sched_id, @pp_sched_qd_id, @year, @quality_cd, @density_cd, @qd_unit_price, @qd_percent
end
 
close curRows
deallocate curRows

GO



create trigger tr_pp_schedule_quality_density_delete_insert_update_MemTable
on pp_schedule_quality_density
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
where szTableName = 'pp_schedule_quality_density'

GO



create trigger tr_pp_schedule_quality_density_delete_ChangeLog
on pp_schedule_quality_density
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
          chg_log_tables = 'pp_schedule_quality_density' and
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
declare @pp_sched_qd_id int
declare @year numeric(4,0)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_qd_id, case year when 0 then @tvar_lFutureYear else year end from deleted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_qd_id, @year
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + ppsqd.quality_cd + '-' + ppsqd.density_cd
     from pp_schedule_quality_density as ppsqd with(nolock)
     join pp_schedule as pps with(nolock) on
          pps.pp_sched_id = @pp_sched_id
          and pps.year = @year
     where
          ppsqd.pp_sched_id = @pp_sched_id and
          ppsqd.pp_sched_qd_id = @pp_sched_qd_id and
          ppsqd.year = @year
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 606, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3837, convert(varchar(24), @pp_sched_qd_id), @pp_sched_qd_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
 
     fetch next from curRows into @pp_sched_id, @pp_sched_qd_id, @year
end
 
close curRows
deallocate curRows

GO

