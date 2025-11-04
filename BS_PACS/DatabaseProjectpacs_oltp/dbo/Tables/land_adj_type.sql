CREATE TABLE [dbo].[land_adj_type] (
    [land_adj_type_year]  NUMERIC (4)    NOT NULL,
    [land_adj_type_cd]    CHAR (5)       NOT NULL,
    [land_adj_type_desc]  VARCHAR (50)   NULL,
    [land_adj_type_usage] VARCHAR (5)    NULL,
    [land_adj_type_amt]   NUMERIC (10)   NULL,
    [land_adj_type_pct]   NUMERIC (5, 2) NULL,
    [rc_type]             CHAR (1)       NULL,
    [inactive]            BIT            CONSTRAINT [CDF_land_adj_type_inactive] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_land_adj_type] PRIMARY KEY CLUSTERED ([land_adj_type_year] ASC, [land_adj_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

 
create trigger tr_land_adj_type_delete_ChangeLog
on land_adj_type
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
          chg_log_tables = 'land_adj_type' and
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
declare @tvar_szOldValue varchar(255)
set @tvar_szOldValue = 'DELETED'
 
declare @tvar_key_prop_id int
 
declare @land_adj_type_year numeric(4,0)
declare @land_adj_type_cd char(5)
 
declare curRows cursor
for
     select case land_adj_type_year when 0 then @tvar_lFutureYear else land_adj_type_year end, land_adj_type_cd from deleted
for read only
 
open curRows
fetch next from curRows into @land_adj_type_year, @land_adj_type_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @land_adj_type_cd + '-' + convert(varchar(4), @land_adj_type_year)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 357, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
 
     fetch next from curRows into @land_adj_type_year, @land_adj_type_cd
end
 
close curRows
deallocate curRows

GO


create trigger tr_land_adj_type_delete_insert_update_MemTable
on land_adj_type
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
-- the cached MMTableField reader also returns data from this table
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName in ('land_adj_type', 'mm_table_field')

GO

 
create trigger tr_land_adj_type_update_ChangeLog
on land_adj_type
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
 
declare @old_land_adj_type_year numeric(4,0)
declare @new_land_adj_type_year numeric(4,0)
declare @old_land_adj_type_cd char(5)
declare @new_land_adj_type_cd char(5)
declare @old_land_adj_type_desc varchar(50)
declare @new_land_adj_type_desc varchar(50)
declare @old_land_adj_type_usage varchar(5)
declare @new_land_adj_type_usage varchar(5)
declare @old_land_adj_type_amt numeric(10,0)
declare @new_land_adj_type_amt numeric(10,0)
declare @old_land_adj_type_pct numeric(5,2)
declare @new_land_adj_type_pct numeric(5,2)
declare @old_rc_type char(1)
declare @new_rc_type char(1)
declare @old_inactive bit
declare @new_inactive bit
 
declare curRows cursor
for
     select case d.land_adj_type_year when 0 then @tvar_lFutureYear else d.land_adj_type_year end, d.land_adj_type_cd, d.land_adj_type_desc, d.land_adj_type_usage, d.land_adj_type_amt, d.land_adj_type_pct, d.rc_type, d.inactive, 
            case i.land_adj_type_year when 0 then @tvar_lFutureYear else i.land_adj_type_year end, i.land_adj_type_cd, i.land_adj_type_desc, i.land_adj_type_usage, i.land_adj_type_amt, i.land_adj_type_pct, i.rc_type, i.inactive
from deleted as d
join inserted as i on 
     d.land_adj_type_year = i.land_adj_type_year and
     d.land_adj_type_cd = i.land_adj_type_cd
for read only
 
open curRows
fetch next from curRows into @old_land_adj_type_year, @old_land_adj_type_cd, @old_land_adj_type_desc, @old_land_adj_type_usage, @old_land_adj_type_amt, @old_land_adj_type_pct, @old_rc_type, @old_inactive, 
                             @new_land_adj_type_year, @new_land_adj_type_cd, @new_land_adj_type_desc, @new_land_adj_type_usage, @new_land_adj_type_amt, @new_land_adj_type_pct, @new_rc_type, @new_inactive
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_land_adj_type_cd + '-' + convert(varchar(4), @new_land_adj_type_year)
 
     if (
          @old_land_adj_type_year <> @new_land_adj_type_year
          or
          ( @old_land_adj_type_year is null and @new_land_adj_type_year is not null ) 
          or
          ( @old_land_adj_type_year is not null and @new_land_adj_type_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj_type' and
                    chg_log_columns = 'land_adj_type_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 357, 2531, convert(varchar(255), @old_land_adj_type_year), convert(varchar(255), @new_land_adj_type_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @new_land_adj_type_year), case when @new_land_adj_type_year > @tvar_intMin and @new_land_adj_type_year < @tvar_intMax then convert(int, round(@new_land_adj_type_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @new_land_adj_type_cd), 0)
          end
     end
 
     if (
          @old_land_adj_type_cd <> @new_land_adj_type_cd
          or
          ( @old_land_adj_type_cd is null and @new_land_adj_type_cd is not null ) 
          or
          ( @old_land_adj_type_cd is not null and @new_land_adj_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj_type' and
                    chg_log_columns = 'land_adj_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 357, 2527, convert(varchar(255), @old_land_adj_type_cd), convert(varchar(255), @new_land_adj_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @new_land_adj_type_year), case when @new_land_adj_type_year > @tvar_intMin and @new_land_adj_type_year < @tvar_intMax then convert(int, round(@new_land_adj_type_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @new_land_adj_type_cd), 0)
          end
     end
 
     if (
          @old_land_adj_type_desc <> @new_land_adj_type_desc
          or
          ( @old_land_adj_type_desc is null and @new_land_adj_type_desc is not null ) 
          or
          ( @old_land_adj_type_desc is not null and @new_land_adj_type_desc is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj_type' and
                    chg_log_columns = 'land_adj_type_desc' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 357, 2528, convert(varchar(255), @old_land_adj_type_desc), convert(varchar(255), @new_land_adj_type_desc), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @new_land_adj_type_year), case when @new_land_adj_type_year > @tvar_intMin and @new_land_adj_type_year < @tvar_intMax then convert(int, round(@new_land_adj_type_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @new_land_adj_type_cd), 0)
          end
     end
 
     if (
          @old_land_adj_type_usage <> @new_land_adj_type_usage
          or
          ( @old_land_adj_type_usage is null and @new_land_adj_type_usage is not null ) 
          or
          ( @old_land_adj_type_usage is not null and @new_land_adj_type_usage is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj_type' and
                    chg_log_columns = 'land_adj_type_usage' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 357, 2530, convert(varchar(255), @old_land_adj_type_usage), convert(varchar(255), @new_land_adj_type_usage), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @new_land_adj_type_year), case when @new_land_adj_type_year > @tvar_intMin and @new_land_adj_type_year < @tvar_intMax then convert(int, round(@new_land_adj_type_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @new_land_adj_type_cd), 0)
          end
     end
 
     if (
          @old_land_adj_type_amt <> @new_land_adj_type_amt
          or
          ( @old_land_adj_type_amt is null and @new_land_adj_type_amt is not null ) 
          or
          ( @old_land_adj_type_amt is not null and @new_land_adj_type_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj_type' and
                    chg_log_columns = 'land_adj_type_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 357, 2526, convert(varchar(255), @old_land_adj_type_amt), convert(varchar(255), @new_land_adj_type_amt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @new_land_adj_type_year), case when @new_land_adj_type_year > @tvar_intMin and @new_land_adj_type_year < @tvar_intMax then convert(int, round(@new_land_adj_type_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @new_land_adj_type_cd), 0)
          end
     end
 
     if (
          @old_land_adj_type_pct <> @new_land_adj_type_pct
          or
          ( @old_land_adj_type_pct is null and @new_land_adj_type_pct is not null ) 
          or
          ( @old_land_adj_type_pct is not null and @new_land_adj_type_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj_type' and
                    chg_log_columns = 'land_adj_type_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 357, 2529, convert(varchar(255), @old_land_adj_type_pct), convert(varchar(255), @new_land_adj_type_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @new_land_adj_type_year), case when @new_land_adj_type_year > @tvar_intMin and @new_land_adj_type_year < @tvar_intMax then convert(int, round(@new_land_adj_type_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @new_land_adj_type_cd), 0)
          end
     end
 
     if (
          @old_rc_type <> @new_rc_type
          or
          ( @old_rc_type is null and @new_rc_type is not null ) 
          or
          ( @old_rc_type is not null and @new_rc_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj_type' and
                    chg_log_columns = 'rc_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 357, 9943, convert(varchar(255), @old_rc_type), convert(varchar(255), @new_rc_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @new_land_adj_type_year), case when @new_land_adj_type_year > @tvar_intMin and @new_land_adj_type_year < @tvar_intMax then convert(int, round(@new_land_adj_type_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @new_land_adj_type_cd), 0)
          end
     end
 
     if (
          @old_inactive <> @new_inactive
          or
          ( @old_inactive is null and @new_inactive is not null ) 
          or
          ( @old_inactive is not null and @new_inactive is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'land_adj_type' and
                    chg_log_columns = 'inactive' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 357, 8647, convert(varchar(255), @old_inactive), convert(varchar(255), @new_inactive), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @new_land_adj_type_year), case when @new_land_adj_type_year > @tvar_intMin and @new_land_adj_type_year < @tvar_intMax then convert(int, round(@new_land_adj_type_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @new_land_adj_type_cd), 0)
          end
     end
 
     fetch next from curRows into @old_land_adj_type_year, @old_land_adj_type_cd, @old_land_adj_type_desc, @old_land_adj_type_usage, @old_land_adj_type_amt, @old_land_adj_type_pct, @old_rc_type, @old_inactive, 
                                  @new_land_adj_type_year, @new_land_adj_type_cd, @new_land_adj_type_desc, @new_land_adj_type_usage, @new_land_adj_type_amt, @new_land_adj_type_pct, @new_rc_type, @new_inactive
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_land_adj_type_insert_ChangeLog
on land_adj_type
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
 
declare @land_adj_type_year numeric(4,0)
declare @land_adj_type_cd char(5)
declare @land_adj_type_desc varchar(50)
declare @land_adj_type_usage varchar(5)
declare @land_adj_type_amt numeric(10,0)
declare @land_adj_type_pct numeric(5,2)
declare @rc_type char(1)
declare @inactive bit
 
declare curRows cursor
for
     select case land_adj_type_year when 0 then @tvar_lFutureYear else land_adj_type_year end, land_adj_type_cd, land_adj_type_desc, land_adj_type_usage, land_adj_type_amt, land_adj_type_pct, rc_type, inactive from inserted
for read only
 
open curRows
fetch next from curRows into @land_adj_type_year, @land_adj_type_cd, @land_adj_type_desc, @land_adj_type_usage, @land_adj_type_amt, @land_adj_type_pct, @rc_type, @inactive
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @land_adj_type_cd + '-' + convert(varchar(4), @land_adj_type_year)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj_type' and
               chg_log_columns = 'land_adj_type_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 357, 2531, null, convert(varchar(255), @land_adj_type_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj_type' and
               chg_log_columns = 'land_adj_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 357, 2527, null, convert(varchar(255), @land_adj_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj_type' and
               chg_log_columns = 'land_adj_type_desc' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 357, 2528, null, convert(varchar(255), @land_adj_type_desc), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj_type' and
               chg_log_columns = 'land_adj_type_usage' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 357, 2530, null, convert(varchar(255), @land_adj_type_usage), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj_type' and
               chg_log_columns = 'land_adj_type_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 357, 2526, null, convert(varchar(255), @land_adj_type_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj_type' and
               chg_log_columns = 'land_adj_type_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 357, 2529, null, convert(varchar(255), @land_adj_type_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj_type' and
               chg_log_columns = 'rc_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 357, 9943, null, convert(varchar(255), @rc_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'land_adj_type' and
               chg_log_columns = 'inactive' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 357, 8647, null, convert(varchar(255), @inactive), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2531, convert(varchar(24), @land_adj_type_year), case when @land_adj_type_year > @tvar_intMin and @land_adj_type_year < @tvar_intMax then convert(int, round(@land_adj_type_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2527, convert(varchar(24), @land_adj_type_cd), 0)
     end
 
     fetch next from curRows into @land_adj_type_year, @land_adj_type_cd, @land_adj_type_desc, @land_adj_type_usage, @land_adj_type_amt, @land_adj_type_pct, @rc_type, @inactive
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Residential/Commercial type indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_adj_type', @level2type = N'COLUMN', @level2name = N'rc_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Specifies whether the land adjustment type code is inactive', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'land_adj_type', @level2type = N'COLUMN', @level2name = N'inactive';


GO

