CREATE TABLE [dbo].[land_sched_soil_detail] (
    [ls_id]          INT             NOT NULL,
    [ls_year]        NUMERIC (4)     NOT NULL,
    [land_soil_code] CHAR (10)       NOT NULL,
    [calculate_rate] BIT             NOT NULL,
    [rental_rate]    NUMERIC (18, 4) NOT NULL,
    [cap_rate]       NUMERIC (18, 4) NOT NULL,
    [rate_per_acre]  NUMERIC (6, 2)  NOT NULL,
    CONSTRAINT [CPK_land_sched_soil_detail] PRIMARY KEY CLUSTERED ([ls_id] ASC, [ls_year] ASC, [land_soil_code] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_land_sched_soil_detail_ls_id_ls_year] FOREIGN KEY ([ls_id], [ls_year]) REFERENCES [dbo].[land_sched] ([ls_id], [ls_year])
);


GO


create trigger tr_land_sched_soil_detail_delete_ChangeLog
on land_sched_soil_detail
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
          chg_log_tables = 'land_sched_soil_detail' and
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
 
declare @ls_id int
declare @ls_year numeric(4,0)
declare @land_soil_code char(10)
 
declare curRows cursor
for
     select ls_id, ls_year, land_soil_code from deleted
for read only
 
open curRows
fetch next from curRows into @ls_id, @ls_year, @land_soil_code
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1190, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @land_soil_code), 0)
 
     fetch next from curRows into @ls_id, @ls_year, @land_soil_code
end
 
close curRows
deallocate curRows

GO


create trigger tr_land_sched_soil_detail_update_ChangeLog
on land_sched_soil_detail
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
 
declare @old_ls_id int
declare @new_ls_id int
declare @old_ls_year numeric(4,0)
declare @new_ls_year numeric(4,0)
declare @old_land_soil_code char(10)
declare @new_land_soil_code char(10)
declare @old_calculate_rate bit
declare @new_calculate_rate bit
declare @old_rental_rate numeric(18,4)
declare @new_rental_rate numeric(18,4)
declare @old_cap_rate numeric(18,4)
declare @new_cap_rate numeric(18,4)
declare @old_rate_per_acre numeric(6,2)
declare @new_rate_per_acre numeric(6,2)
 
declare curRows cursor
for
     select d.ls_id, d.ls_year, d.land_soil_code, d.calculate_rate, d.rental_rate, d.cap_rate, d.rate_per_acre, i.ls_id, i.ls_year, i.land_soil_code, i.calculate_rate, i.rental_rate, i.cap_rate, i.rate_per_acre
from deleted as d
join inserted as i on 
     d.ls_id = i.ls_id and
     d.ls_year = i.ls_year and
     d.land_soil_code = i.land_soil_code
for read only
 
open curRows
fetch next from curRows into @old_ls_id, @old_ls_year, @old_land_soil_code, @old_calculate_rate, @old_rental_rate, @old_cap_rate, @old_rate_per_acre, @new_ls_id, @new_ls_year, @new_land_soil_code, @new_calculate_rate, @new_rental_rate, @new_cap_rate, @new_rate_per_acre
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_ls_id <> @new_ls_id
          or
          ( @old_ls_id is null and @new_ls_id is not null ) 
          or
          ( @old_ls_id is not null and @new_ls_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_soil_detail' and
                    chg_log_columns = 'ls_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1190, 2932, convert(varchar(255), @old_ls_id), convert(varchar(255), @new_ls_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @new_land_soil_code), 0)
          end
     end
 
     if (
          @old_ls_year <> @new_ls_year
          or
          ( @old_ls_year is null and @new_ls_year is not null ) 
          or
          ( @old_ls_year is not null and @new_ls_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_soil_detail' and
                    chg_log_columns = 'ls_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1190, 2951, convert(varchar(255), @old_ls_year), convert(varchar(255), @new_ls_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @new_land_soil_code), 0)
          end
     end
 
     if (
          @old_land_soil_code <> @new_land_soil_code
          or
          ( @old_land_soil_code is null and @new_land_soil_code is not null ) 
          or
          ( @old_land_soil_code is not null and @new_land_soil_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_soil_detail' and
                    chg_log_columns = 'land_soil_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1190, 9248, convert(varchar(255), @old_land_soil_code), convert(varchar(255), @new_land_soil_code), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @new_land_soil_code), 0)
          end
     end
 
     if (
          @old_calculate_rate <> @new_calculate_rate
          or
          ( @old_calculate_rate is null and @new_calculate_rate is not null ) 
          or
          ( @old_calculate_rate is not null and @new_calculate_rate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_soil_detail' and
                    chg_log_columns = 'calculate_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1190, 9364, convert(varchar(255), @old_calculate_rate), convert(varchar(255), @new_calculate_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @new_land_soil_code), 0)
          end
     end
 
     if (
          @old_rental_rate <> @new_rental_rate
          or
          ( @old_rental_rate is null and @new_rental_rate is not null ) 
          or
          ( @old_rental_rate is not null and @new_rental_rate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_soil_detail' and
                    chg_log_columns = 'rental_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1190, 9365, convert(varchar(255), @old_rental_rate), convert(varchar(255), @new_rental_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @new_land_soil_code), 0)
          end
     end
 
     if (
          @old_cap_rate <> @new_cap_rate
          or
          ( @old_cap_rate is null and @new_cap_rate is not null ) 
          or
          ( @old_cap_rate is not null and @new_cap_rate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_soil_detail' and
                    chg_log_columns = 'cap_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1190, 9050, convert(varchar(255), @old_cap_rate), convert(varchar(255), @new_cap_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @new_land_soil_code), 0)
          end
     end
 
     if (
          @old_rate_per_acre <> @new_rate_per_acre
          or
          ( @old_rate_per_acre is null and @new_rate_per_acre is not null ) 
          or
          ( @old_rate_per_acre is not null and @new_rate_per_acre is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_sched_soil_detail' and
                    chg_log_columns = 'rate_per_acre' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1190, 9366, convert(varchar(255), @old_rate_per_acre), convert(varchar(255), @new_rate_per_acre), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @new_ls_id), @new_ls_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @new_ls_year), case when @new_ls_year > @tvar_intMin and @new_ls_year < @tvar_intMax then convert(int, round(@new_ls_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @new_land_soil_code), 0)
          end
     end
 
     fetch next from curRows into @old_ls_id, @old_ls_year, @old_land_soil_code, @old_calculate_rate, @old_rental_rate, @old_cap_rate, @old_rate_per_acre, @new_ls_id, @new_ls_year, @new_land_soil_code, @new_calculate_rate, @new_rental_rate, @new_cap_rate, @new_rate_per_acre
end
 
close curRows
deallocate curRows

GO


create trigger tr_land_sched_soil_detail_delete_insert_update_MemTable
on land_sched_soil_detail
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
where szTableName = 'land_sched_soil_detail'

GO


create trigger tr_land_sched_soil_detail_insert_ChangeLog
on land_sched_soil_detail
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
 
declare @ls_id int
declare @ls_year numeric(4,0)
declare @land_soil_code char(10)
declare @calculate_rate bit
declare @rental_rate numeric(18,4)
declare @cap_rate numeric(18,4)
declare @rate_per_acre numeric(6,2)
 
declare curRows cursor
for
     select ls_id, ls_year, land_soil_code, calculate_rate, rental_rate, cap_rate, rate_per_acre from inserted
for read only
 
open curRows
fetch next from curRows into @ls_id, @ls_year, @land_soil_code, @calculate_rate, @rental_rate, @cap_rate, @rate_per_acre
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_soil_detail' and
               chg_log_columns = 'ls_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1190, 2932, null, convert(varchar(255), @ls_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @land_soil_code), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_soil_detail' and
               chg_log_columns = 'ls_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1190, 2951, null, convert(varchar(255), @ls_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @land_soil_code), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_soil_detail' and
               chg_log_columns = 'land_soil_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1190, 9248, null, convert(varchar(255), @land_soil_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @land_soil_code), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_soil_detail' and
               chg_log_columns = 'calculate_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1190, 9364, null, convert(varchar(255), @calculate_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @land_soil_code), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_soil_detail' and
               chg_log_columns = 'rental_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1190, 9365, null, convert(varchar(255), @rental_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @land_soil_code), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_soil_detail' and
               chg_log_columns = 'cap_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1190, 9050, null, convert(varchar(255), @cap_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @land_soil_code), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_sched_soil_detail' and
               chg_log_columns = 'rate_per_acre' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1190, 9366, null, convert(varchar(255), @rate_per_acre), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2932, convert(varchar(24), @ls_id), @ls_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2951, convert(varchar(24), @ls_year), case when @ls_year > @tvar_intMin and @ls_year < @tvar_intMax then convert(int, round(@ls_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9248, convert(varchar(24), @land_soil_code), 0)
     end
 
     fetch next from curRows into @ls_id, @ls_year, @land_soil_code, @calculate_rate, @rental_rate, @cap_rate, @rate_per_acre
end
 
close curRows
deallocate curRows

GO

