CREATE TABLE [dbo].[income_sched] (
    [income_yr]           NUMERIC (4)     NOT NULL,
    [econ_area]           VARCHAR (10)    NOT NULL,
    [prop_type]           VARCHAR (10)    NOT NULL,
    [class_cd]            VARCHAR (10)    NOT NULL,
    [level_cd]            VARCHAR (10)    NOT NULL,
    [ocr]                 NUMERIC (5, 2)  NULL,
    [mgmtr]               NUMERIC (5, 2)  NULL,
    [exp_rsf]             NUMERIC (14, 2) NULL,
    [si_rsf]              NUMERIC (14, 2) NULL,
    [tir]                 NUMERIC (5, 2)  NULL,
    [rrr]                 NUMERIC (5, 2)  NULL,
    [capr]                NUMERIC (5, 2)  NULL,
    [lease_rsf]           NUMERIC (14, 2) NULL,
    [vacancy]             NUMERIC (5, 2)  NULL,
    [do_not_use_tax_rate] BIT             CONSTRAINT [CDF_income_sched_do_not_use_tax_rate] DEFAULT ((0)) NOT NULL,
    [triple_net_schedule] BIT             CONSTRAINT [CDF_income_sched_triple_net_schedule] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income_sched] PRIMARY KEY CLUSTERED ([income_yr] ASC, [econ_area] ASC, [prop_type] ASC, [class_cd] ASC, [level_cd] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_income_sched_delete_ChangeLog
on income_sched
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
          chg_log_tables = 'income_sched' and
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
 
declare @income_yr numeric(4,0)
declare @econ_area varchar(10)
declare @prop_type varchar(10)
declare @class_cd varchar(10)
declare @level_cd varchar(10)
 
declare curRows cursor
for
     select income_yr, econ_area, prop_type, class_cd, level_cd from deleted
for read only
 
open curRows
fetch next from curRows into @income_yr, @econ_area, @prop_type, @class_cd, @level_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @prop_type + '-' + @class_cd + '-' + @econ_area + '-' + @level_cd + '-' + convert(varchar(4), @income_yr)
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 343, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
 
     fetch next from curRows into @income_yr, @econ_area, @prop_type, @class_cd, @level_cd
end
 
close curRows
deallocate curRows

GO


create trigger tr_income_sched_delete_insert_update_MemTable
on income_sched
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
where szTableName = 'income_sched'

GO

 
create trigger tr_income_sched_insert_ChangeLog
on income_sched
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
 
declare @income_yr numeric(4,0)
declare @econ_area varchar(10)
declare @prop_type varchar(10)
declare @class_cd varchar(10)
declare @level_cd varchar(10)
declare @ocr numeric(5,2)
declare @mgmtr numeric(5,2)
declare @exp_rsf numeric(14,2)
declare @si_rsf numeric(14,2)
declare @tir numeric(5,2)
declare @rrr numeric(5,2)
declare @capr numeric(5,2)
declare @lease_rsf numeric(14,2)
declare @vacancy numeric(5,2)
declare @do_not_use_tax_rate bit
declare @triple_net_schedule bit
 
declare curRows cursor
for
     select income_yr, econ_area, prop_type, class_cd, level_cd, ocr, mgmtr, exp_rsf, si_rsf, tir, rrr, capr, lease_rsf, vacancy, do_not_use_tax_rate, triple_net_schedule from inserted
for read only
 
open curRows
fetch next from curRows into @income_yr, @econ_area, @prop_type, @class_cd, @level_cd, @ocr, @mgmtr, @exp_rsf, @si_rsf, @tir, @rrr, @capr, @lease_rsf, @vacancy, @do_not_use_tax_rate, @triple_net_schedule
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @prop_type + '-' + @class_cd + '-' + @econ_area + '-' + @level_cd + '-' + convert(varchar(4), @income_yr)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'income_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 2357, null, convert(varchar(255), @income_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'econ_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 1408, null, convert(varchar(255), @econ_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'prop_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 4078, null, convert(varchar(255), @prop_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 762, null, convert(varchar(255), @class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'level_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 2811, null, convert(varchar(255), @level_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'ocr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 3396, null, convert(varchar(255), @ocr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'mgmtr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 3051, null, convert(varchar(255), @mgmtr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'exp_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 1839, null, convert(varchar(255), @exp_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'si_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 4727, null, convert(varchar(255), @si_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'tir' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 5235, null, convert(varchar(255), @tir), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'rrr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 4455, null, convert(varchar(255), @rrr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'capr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 610, null, convert(varchar(255), @capr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'lease_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 2766, null, convert(varchar(255), @lease_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'vacancy' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 5471, null, convert(varchar(255), @vacancy), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'do_not_use_tax_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 9744, null, convert(varchar(255), @do_not_use_tax_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched' and
               chg_log_columns = 'triple_net_schedule' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 343, 9802, null, convert(varchar(255), @triple_net_schedule), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @econ_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @prop_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     fetch next from curRows into @income_yr, @econ_area, @prop_type, @class_cd, @level_cd, @ocr, @mgmtr, @exp_rsf, @si_rsf, @tir, @rrr, @capr, @lease_rsf, @vacancy, @do_not_use_tax_rate, @triple_net_schedule
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_income_sched_update_ChangeLog
on income_sched
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
 
declare @old_income_yr numeric(4,0)
declare @new_income_yr numeric(4,0)
declare @old_econ_area varchar(10)
declare @new_econ_area varchar(10)
declare @old_prop_type varchar(10)
declare @new_prop_type varchar(10)
declare @old_class_cd varchar(10)
declare @new_class_cd varchar(10)
declare @old_level_cd varchar(10)
declare @new_level_cd varchar(10)
declare @old_ocr numeric(5,2)
declare @new_ocr numeric(5,2)
declare @old_mgmtr numeric(5,2)
declare @new_mgmtr numeric(5,2)
declare @old_exp_rsf numeric(14,2)
declare @new_exp_rsf numeric(14,2)
declare @old_si_rsf numeric(14,2)
declare @new_si_rsf numeric(14,2)
declare @old_tir numeric(5,2)
declare @new_tir numeric(5,2)
declare @old_rrr numeric(5,2)
declare @new_rrr numeric(5,2)
declare @old_capr numeric(5,2)
declare @new_capr numeric(5,2)
declare @old_lease_rsf numeric(14,2)
declare @new_lease_rsf numeric(14,2)
declare @old_vacancy numeric(5,2)
declare @new_vacancy numeric(5,2)
declare @old_do_not_use_tax_rate bit
declare @new_do_not_use_tax_rate bit
declare @old_triple_net_schedule bit
declare @new_triple_net_schedule bit
 
declare curRows cursor
for
     select d.income_yr, d.econ_area, d.prop_type, d.class_cd, d.level_cd, d.ocr, d.mgmtr, d.exp_rsf, d.si_rsf, d.tir, d.rrr, d.capr, d.lease_rsf, d.vacancy, d.do_not_use_tax_rate, d.triple_net_schedule, 
            i.income_yr, i.econ_area, i.prop_type, i.class_cd, i.level_cd, i.ocr, i.mgmtr, i.exp_rsf, i.si_rsf, i.tir, i.rrr, i.capr, i.lease_rsf, i.vacancy, i.do_not_use_tax_rate, i.triple_net_schedule
from deleted as d
join inserted as i on 
     d.income_yr = i.income_yr and
     d.econ_area = i.econ_area and
     d.prop_type = i.prop_type and
     d.class_cd = i.class_cd and
     d.level_cd = i.level_cd
for read only
 
open curRows
fetch next from curRows into @old_income_yr, @old_econ_area, @old_prop_type, @old_class_cd, @old_level_cd, @old_ocr, @old_mgmtr, @old_exp_rsf, @old_si_rsf, @old_tir, @old_rrr, @old_capr, @old_lease_rsf, @old_vacancy, @old_do_not_use_tax_rate, @old_triple_net_schedule, 
                             @new_income_yr, @new_econ_area, @new_prop_type, @new_class_cd, @new_level_cd, @new_ocr, @new_mgmtr, @new_exp_rsf, @new_si_rsf, @new_tir, @new_rrr, @new_capr, @new_lease_rsf, @new_vacancy, @new_do_not_use_tax_rate, @new_triple_net_schedule
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_prop_type + '-' + @new_class_cd + '-' + @new_econ_area + '-' + @new_level_cd + '-' + convert(varchar(4), @new_income_yr)
 
     if (
          @old_income_yr <> @new_income_yr
          or
          ( @old_income_yr is null and @new_income_yr is not null ) 
          or
          ( @old_income_yr is not null and @new_income_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'income_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 2357, convert(varchar(255), @old_income_yr), convert(varchar(255), @new_income_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_econ_area <> @new_econ_area
          or
          ( @old_econ_area is null and @new_econ_area is not null ) 
          or
          ( @old_econ_area is not null and @new_econ_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'econ_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 1408, convert(varchar(255), @old_econ_area), convert(varchar(255), @new_econ_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_prop_type <> @new_prop_type
          or
          ( @old_prop_type is null and @new_prop_type is not null ) 
          or
          ( @old_prop_type is not null and @new_prop_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'prop_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 4078, convert(varchar(255), @old_prop_type), convert(varchar(255), @new_prop_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_class_cd <> @new_class_cd
          or
          ( @old_class_cd is null and @new_class_cd is not null ) 
          or
          ( @old_class_cd is not null and @new_class_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 762, convert(varchar(255), @old_class_cd), convert(varchar(255), @new_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_level_cd <> @new_level_cd
          or
          ( @old_level_cd is null and @new_level_cd is not null ) 
          or
          ( @old_level_cd is not null and @new_level_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'level_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 2811, convert(varchar(255), @old_level_cd), convert(varchar(255), @new_level_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_ocr <> @new_ocr
          or
          ( @old_ocr is null and @new_ocr is not null ) 
          or
          ( @old_ocr is not null and @new_ocr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'ocr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 3396, convert(varchar(255), @old_ocr), convert(varchar(255), @new_ocr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_mgmtr <> @new_mgmtr
          or
          ( @old_mgmtr is null and @new_mgmtr is not null ) 
          or
          ( @old_mgmtr is not null and @new_mgmtr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'mgmtr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 3051, convert(varchar(255), @old_mgmtr), convert(varchar(255), @new_mgmtr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_exp_rsf <> @new_exp_rsf
          or
          ( @old_exp_rsf is null and @new_exp_rsf is not null ) 
          or
          ( @old_exp_rsf is not null and @new_exp_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'exp_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 1839, convert(varchar(255), @old_exp_rsf), convert(varchar(255), @new_exp_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_si_rsf <> @new_si_rsf
          or
          ( @old_si_rsf is null and @new_si_rsf is not null ) 
          or
          ( @old_si_rsf is not null and @new_si_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'si_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 4727, convert(varchar(255), @old_si_rsf), convert(varchar(255), @new_si_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_tir <> @new_tir
          or
          ( @old_tir is null and @new_tir is not null ) 
          or
          ( @old_tir is not null and @new_tir is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'tir' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 5235, convert(varchar(255), @old_tir), convert(varchar(255), @new_tir), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_rrr <> @new_rrr
          or
          ( @old_rrr is null and @new_rrr is not null ) 
          or
          ( @old_rrr is not null and @new_rrr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'rrr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 4455, convert(varchar(255), @old_rrr), convert(varchar(255), @new_rrr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_capr <> @new_capr
          or
          ( @old_capr is null and @new_capr is not null ) 
          or
          ( @old_capr is not null and @new_capr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'capr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 610, convert(varchar(255), @old_capr), convert(varchar(255), @new_capr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_lease_rsf <> @new_lease_rsf
          or
          ( @old_lease_rsf is null and @new_lease_rsf is not null ) 
          or
          ( @old_lease_rsf is not null and @new_lease_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'lease_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 2766, convert(varchar(255), @old_lease_rsf), convert(varchar(255), @new_lease_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_vacancy <> @new_vacancy
          or
          ( @old_vacancy is null and @new_vacancy is not null ) 
          or
          ( @old_vacancy is not null and @new_vacancy is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'vacancy' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 5471, convert(varchar(255), @old_vacancy), convert(varchar(255), @new_vacancy), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_do_not_use_tax_rate <> @new_do_not_use_tax_rate
          or
          ( @old_do_not_use_tax_rate is null and @new_do_not_use_tax_rate is not null ) 
          or
          ( @old_do_not_use_tax_rate is not null and @new_do_not_use_tax_rate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'do_not_use_tax_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 9744, convert(varchar(255), @old_do_not_use_tax_rate), convert(varchar(255), @new_do_not_use_tax_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_triple_net_schedule <> @new_triple_net_schedule
          or
          ( @old_triple_net_schedule is null and @new_triple_net_schedule is not null ) 
          or
          ( @old_triple_net_schedule is not null and @new_triple_net_schedule is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched' and
                    chg_log_columns = 'triple_net_schedule' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 343, 9802, convert(varchar(255), @old_triple_net_schedule), convert(varchar(255), @new_triple_net_schedule), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1408, convert(varchar(24), @new_econ_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4078, convert(varchar(24), @new_prop_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     fetch next from curRows into @old_income_yr, @old_econ_area, @old_prop_type, @old_class_cd, @old_level_cd, @old_ocr, @old_mgmtr, @old_exp_rsf, @old_si_rsf, @old_tir, @old_rrr, @old_capr, @old_lease_rsf, @old_vacancy, @old_do_not_use_tax_rate, @old_triple_net_schedule, 
                                  @new_income_yr, @new_econ_area, @new_prop_type, @new_class_cd, @new_level_cd, @new_ocr, @new_mgmtr, @new_exp_rsf, @new_si_rsf, @new_tir, @new_rrr, @new_capr, @new_lease_rsf, @new_vacancy, @new_do_not_use_tax_rate, @new_triple_net_schedule
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Do not use Tax Rate in Overall Rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_sched', @level2type = N'COLUMN', @level2name = N'do_not_use_tax_rate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Income Schedule Triple Net Schedule Indicator', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'income_sched', @level2type = N'COLUMN', @level2name = N'triple_net_schedule';


GO

