CREATE TABLE [dbo].[pp_schedule_deprec] (
    [pp_sched_id]               INT          NOT NULL,
    [pp_sched_deprec_type_cd]   CHAR (10)    NOT NULL,
    [pp_sched_deprec_deprec_cd] CHAR (10)    NOT NULL,
    [year]                      NUMERIC (4)  NOT NULL,
    [description]               VARCHAR (50) NULL,
    CONSTRAINT [CPK_pp_schedule_deprec] PRIMARY KEY CLUSTERED ([pp_sched_id] ASC, [pp_sched_deprec_type_cd] ASC, [pp_sched_deprec_deprec_cd] ASC, [year] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_pp_schedule_deprec_delete_ChangeLog
on pp_schedule_deprec
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
          chg_log_tables = 'pp_schedule_deprec' and
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
declare @pp_sched_deprec_type_cd char(10)
declare @pp_sched_deprec_deprec_cd char(10)
declare @year numeric(4,0)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_deprec_type_cd, pp_sched_deprec_deprec_cd, case year when 0 then @tvar_lFutureYear else year end from deleted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_deprec_type_cd, @pp_sched_deprec_deprec_cd, @year
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @pp_sched_deprec_type_cd + '-' + @pp_sched_deprec_deprec_cd
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @pp_sched_id
     and pps.year = @year
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 604, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @pp_sched_deprec_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @pp_sched_deprec_deprec_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)

     fetch next from curRows into @pp_sched_id, @pp_sched_deprec_type_cd, @pp_sched_deprec_deprec_cd, @year
end
 
close curRows
deallocate curRows

GO


create trigger tr_pp_schedule_deprec_update_ChangeLog
on pp_schedule_deprec
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
declare @old_pp_sched_deprec_type_cd char(10)
declare @new_pp_sched_deprec_type_cd char(10)
declare @old_pp_sched_deprec_deprec_cd char(10)
declare @new_pp_sched_deprec_deprec_cd char(10)
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_description varchar(50)
declare @new_description varchar(50)
 
declare curRows cursor
for
     select d.pp_sched_id, d.pp_sched_deprec_type_cd, d.pp_sched_deprec_deprec_cd, case d.year when 0 then @tvar_lFutureYear else d.year end, d.description, i.pp_sched_id, i.pp_sched_deprec_type_cd, i.pp_sched_deprec_deprec_cd, case i.year when 0 then @tvar_lFutureYear else i.year end, i.description
from deleted as d
join inserted as i on 
     d.pp_sched_id = i.pp_sched_id and
     d.pp_sched_deprec_type_cd = i.pp_sched_deprec_type_cd and
     d.pp_sched_deprec_deprec_cd = i.pp_sched_deprec_deprec_cd and
     d.year = i.year
for read only
 
open curRows
fetch next from curRows into @old_pp_sched_id, @old_pp_sched_deprec_type_cd, @old_pp_sched_deprec_deprec_cd, @old_year, @old_description, @new_pp_sched_id, @new_pp_sched_deprec_type_cd, @new_pp_sched_deprec_deprec_cd, @new_year, @new_description
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @new_year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @new_pp_sched_deprec_type_cd + '-' + @new_pp_sched_deprec_deprec_cd
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
                    chg_log_tables = 'pp_schedule_deprec' and
                    chg_log_columns = 'pp_sched_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 604, 3836, convert(varchar(255), @old_pp_sched_id), convert(varchar(255), @new_pp_sched_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @new_pp_sched_deprec_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @new_pp_sched_deprec_deprec_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_deprec_type_cd <> @new_pp_sched_deprec_type_cd
          or
          ( @old_pp_sched_deprec_type_cd is null and @new_pp_sched_deprec_type_cd is not null ) 
          or
          ( @old_pp_sched_deprec_type_cd is not null and @new_pp_sched_deprec_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_deprec' and
                    chg_log_columns = 'pp_sched_deprec_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 604, 3835, convert(varchar(255), @old_pp_sched_deprec_type_cd), convert(varchar(255), @new_pp_sched_deprec_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @new_pp_sched_deprec_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @new_pp_sched_deprec_deprec_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pp_sched_deprec_deprec_cd <> @new_pp_sched_deprec_deprec_cd
          or
          ( @old_pp_sched_deprec_deprec_cd is null and @new_pp_sched_deprec_deprec_cd is not null ) 
          or
          ( @old_pp_sched_deprec_deprec_cd is not null and @new_pp_sched_deprec_deprec_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_deprec' and
                    chg_log_columns = 'pp_sched_deprec_deprec_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 604, 3834, convert(varchar(255), @old_pp_sched_deprec_deprec_cd), convert(varchar(255), @new_pp_sched_deprec_deprec_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @new_pp_sched_deprec_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @new_pp_sched_deprec_deprec_cd), 0)
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
                    chg_log_tables = 'pp_schedule_deprec' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 604, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @new_pp_sched_deprec_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @new_pp_sched_deprec_deprec_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_description <> @new_description
          or
          ( @old_description is null and @new_description is not null ) 
          or
          ( @old_description is not null and @new_description is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'pp_schedule_deprec' and
                    chg_log_columns = 'description' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 604, 1318, convert(varchar(255), @old_description), convert(varchar(255), @new_description) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @new_pp_sched_id), @new_pp_sched_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @new_pp_sched_deprec_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @new_pp_sched_deprec_deprec_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_pp_sched_id, @old_pp_sched_deprec_type_cd, @old_pp_sched_deprec_deprec_cd, @old_year, @old_description, @new_pp_sched_id, @new_pp_sched_deprec_type_cd, @new_pp_sched_deprec_deprec_cd, @new_year, @new_description
end
 
close curRows
deallocate curRows

GO

create trigger tr_pp_schedule_deprec_delete_insert_update_MemTable
on dbo.pp_schedule_deprec
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
where szTableName = 'pp_schedule_deprec'

GO


create trigger tr_pp_schedule_deprec_insert_ChangeLog
on pp_schedule_deprec
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
declare @pp_sched_deprec_type_cd char(10)
declare @pp_sched_deprec_deprec_cd char(10)
declare @year numeric(4,0)
declare @description varchar(50)
 
declare curRows cursor
for
     select pp_sched_id, pp_sched_deprec_type_cd, pp_sched_deprec_deprec_cd, case year when 0 then @tvar_lFutureYear else year end, description from inserted
for read only
 
open curRows
fetch next from curRows into @pp_sched_id, @pp_sched_deprec_type_cd, @pp_sched_deprec_deprec_cd, @year, @description
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = convert(varchar(4), @year) + '-' + pps.value_method + '-' + pps.table_code + '-' + pps.segment_type + ':' + @pp_sched_deprec_type_cd + '-' + @pp_sched_deprec_deprec_cd
     from pp_schedule as pps with(nolock)
     where pps.pp_sched_id = @pp_sched_id
     and pps.year = @year
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_deprec' and
               chg_log_columns = 'pp_sched_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 604, 3836, null, convert(varchar(255), @pp_sched_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @pp_sched_deprec_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @pp_sched_deprec_deprec_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_deprec' and
               chg_log_columns = 'pp_sched_deprec_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 604, 3835, null, convert(varchar(255), @pp_sched_deprec_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @pp_sched_deprec_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @pp_sched_deprec_deprec_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_deprec' and
               chg_log_columns = 'pp_sched_deprec_deprec_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 604, 3834, null, convert(varchar(255), @pp_sched_deprec_deprec_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @pp_sched_deprec_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @pp_sched_deprec_deprec_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_deprec' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 604, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @pp_sched_deprec_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @pp_sched_deprec_deprec_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'pp_schedule_deprec' and
               chg_log_columns = 'description' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 604, 1318, null, convert(varchar(255), @description), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3836, convert(varchar(24), @pp_sched_id), @pp_sched_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3835, convert(varchar(24), @pp_sched_deprec_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3834, convert(varchar(24), @pp_sched_deprec_deprec_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @pp_sched_id, @pp_sched_deprec_type_cd, @pp_sched_deprec_deprec_cd, @year, @description
end
 
close curRows
deallocate curRows

GO

