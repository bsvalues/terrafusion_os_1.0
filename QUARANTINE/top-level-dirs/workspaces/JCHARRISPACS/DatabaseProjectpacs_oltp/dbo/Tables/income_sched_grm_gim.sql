CREATE TABLE [dbo].[income_sched_grm_gim] (
    [year]                           NUMERIC (4)    NOT NULL,
    [prop_type_cd]                   VARCHAR (10)   NOT NULL,
    [class_cd]                       VARCHAR (10)   NOT NULL,
    [econ_cd]                        VARCHAR (10)   NOT NULL,
    [level_cd]                       VARCHAR (10)   NOT NULL,
    [potential_gross_income_annual]  NUMERIC (14)   CONSTRAINT [CDF_income_sched_grm_gim_potential_gross_income_annual] DEFAULT ((0)) NOT NULL,
    [potential_gross_income_monthly] NUMERIC (14)   CONSTRAINT [CDF_income_sched_grm_gim_potential_gross_income_monthly] DEFAULT ((0)) NOT NULL,
    [gross_income_multiplier]        NUMERIC (5, 2) CONSTRAINT [CDF_income_sched_grm_gim_gross_income_multiplier] DEFAULT ((0)) NOT NULL,
    [gross_rent_multiplier]          NUMERIC (5, 2) CONSTRAINT [CDF_income_sched_grm_gim_gross_rent_multiplier] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_income_sched_grm_gim] PRIMARY KEY CLUSTERED ([year] ASC, [prop_type_cd] ASC, [class_cd] ASC, [econ_cd] ASC, [level_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_income_sched_grm_gim_income_class] FOREIGN KEY ([class_cd]) REFERENCES [dbo].[income_class] ([class_cd]),
    CONSTRAINT [CFK_income_sched_grm_gim_income_econ_area] FOREIGN KEY ([econ_cd]) REFERENCES [dbo].[income_econ_area] ([econ_cd]),
    CONSTRAINT [CFK_income_sched_grm_gim_income_level] FOREIGN KEY ([level_cd]) REFERENCES [dbo].[income_level] ([level_cd]),
    CONSTRAINT [CFK_income_sched_grm_gim_income_prop_type] FOREIGN KEY ([prop_type_cd]) REFERENCES [dbo].[income_prop_type] ([prop_type_cd])
);


GO


create trigger tr_income_sched_grm_gim_delete_insert_update_MemTable
on income_sched_grm_gim
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
where szTableName = 'income_sched_grm_gim'

GO

 
create trigger tr_income_sched_grm_gim_insert_ChangeLog
on income_sched_grm_gim
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
 
declare @year numeric(4,0)
declare @prop_type_cd char(5)
declare @class_cd varchar(10)
declare @econ_cd varchar(10)
declare @level_cd varchar(10)
declare @potential_gross_income_annual numeric(14,0)
declare @potential_gross_income_monthly numeric(14,0)
declare @gross_income_multiplier numeric(5,2)
declare @gross_rent_multiplier numeric(5,2)
 
declare curRows cursor
for
     select year, prop_type_cd, class_cd, econ_cd, level_cd, potential_gross_income_annual, potential_gross_income_monthly, gross_income_multiplier, gross_rent_multiplier from inserted
for read only
 
open curRows
fetch next from curRows into @year, @prop_type_cd, @class_cd, @econ_cd, @level_cd, @potential_gross_income_annual, @potential_gross_income_monthly, @gross_income_multiplier, @gross_rent_multiplier
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'prop_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 4079, null, convert(varchar(255), @prop_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'class_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 762, null, convert(varchar(255), @class_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'econ_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 1409, null, convert(varchar(255), @econ_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'level_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 2811, null, convert(varchar(255), @level_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'potential_gross_income_annual' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 9766, null, convert(varchar(255), @potential_gross_income_annual), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'potential_gross_income_monthly' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 9767, null, convert(varchar(255), @potential_gross_income_monthly), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'gross_income_multiplier' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 9746, null, convert(varchar(255), @gross_income_multiplier), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_grm_gim' and
               chg_log_columns = 'gross_rent_multiplier' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1693, 9747, null, convert(varchar(255), @gross_rent_multiplier), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
     end
 
     fetch next from curRows into @year, @prop_type_cd, @class_cd, @econ_cd, @level_cd, @potential_gross_income_annual, @potential_gross_income_monthly, @gross_income_multiplier, @gross_rent_multiplier
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_income_sched_grm_gim_update_ChangeLog
on income_sched_grm_gim
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
 
declare @old_year numeric(4,0)
declare @new_year numeric(4,0)
declare @old_prop_type_cd char(5)
declare @new_prop_type_cd char(5)
declare @old_class_cd varchar(10)
declare @new_class_cd varchar(10)
declare @old_econ_cd varchar(10)
declare @new_econ_cd varchar(10)
declare @old_level_cd varchar(10)
declare @new_level_cd varchar(10)
declare @old_potential_gross_income_annual numeric(14,0)
declare @new_potential_gross_income_annual numeric(14,0)
declare @old_potential_gross_income_monthly numeric(14,0)
declare @new_potential_gross_income_monthly numeric(14,0)
declare @old_gross_income_multiplier numeric(5,2)
declare @new_gross_income_multiplier numeric(5,2)
declare @old_gross_rent_multiplier numeric(5,2)
declare @new_gross_rent_multiplier numeric(5,2)
 
declare curRows cursor
for
     select d.year, d.prop_type_cd, d.class_cd, d.econ_cd, d.level_cd, d.potential_gross_income_annual, d.potential_gross_income_monthly, d.gross_income_multiplier, d.gross_rent_multiplier, 
            i.year, i.prop_type_cd, i.class_cd, i.econ_cd, i.level_cd, i.potential_gross_income_annual, i.potential_gross_income_monthly, i.gross_income_multiplier, i.gross_rent_multiplier
from deleted as d
join inserted as i on 
     d.year = i.year and
     d.prop_type_cd = i.prop_type_cd and
     d.class_cd = i.class_cd and
     d.econ_cd = i.econ_cd and
     d.level_cd = i.level_cd
for read only
 
open curRows
fetch next from curRows into @old_year, @old_prop_type_cd, @old_class_cd, @old_econ_cd, @old_level_cd, @old_potential_gross_income_annual, @old_potential_gross_income_monthly, @old_gross_income_multiplier, @old_gross_rent_multiplier, 
                             @new_year, @new_prop_type_cd, @new_class_cd, @new_econ_cd, @new_level_cd, @new_potential_gross_income_annual, @new_potential_gross_income_monthly, @new_gross_income_multiplier, @new_gross_rent_multiplier
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
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
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_prop_type_cd <> @new_prop_type_cd
          or
          ( @old_prop_type_cd is null and @new_prop_type_cd is not null ) 
          or
          ( @old_prop_type_cd is not null and @new_prop_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'prop_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 4079, convert(varchar(255), @old_prop_type_cd), convert(varchar(255), @new_prop_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
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
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'class_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 762, convert(varchar(255), @old_class_cd), convert(varchar(255), @new_class_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_econ_cd <> @new_econ_cd
          or
          ( @old_econ_cd is null and @new_econ_cd is not null ) 
          or
          ( @old_econ_cd is not null and @new_econ_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'econ_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 1409, convert(varchar(255), @old_econ_cd), convert(varchar(255), @new_econ_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
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
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'level_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 2811, convert(varchar(255), @old_level_cd), convert(varchar(255), @new_level_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_potential_gross_income_annual <> @new_potential_gross_income_annual
          or
          ( @old_potential_gross_income_annual is null and @new_potential_gross_income_annual is not null ) 
          or
          ( @old_potential_gross_income_annual is not null and @new_potential_gross_income_annual is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'potential_gross_income_annual' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 9766, convert(varchar(255), @old_potential_gross_income_annual), convert(varchar(255), @new_potential_gross_income_annual), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_potential_gross_income_monthly <> @new_potential_gross_income_monthly
          or
          ( @old_potential_gross_income_monthly is null and @new_potential_gross_income_monthly is not null ) 
          or
          ( @old_potential_gross_income_monthly is not null and @new_potential_gross_income_monthly is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'potential_gross_income_monthly' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 9767, convert(varchar(255), @old_potential_gross_income_monthly), convert(varchar(255), @new_potential_gross_income_monthly), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_gross_income_multiplier <> @new_gross_income_multiplier
          or
          ( @old_gross_income_multiplier is null and @new_gross_income_multiplier is not null ) 
          or
          ( @old_gross_income_multiplier is not null and @new_gross_income_multiplier is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'gross_income_multiplier' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 9746, convert(varchar(255), @old_gross_income_multiplier), convert(varchar(255), @new_gross_income_multiplier), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     if (
          @old_gross_rent_multiplier <> @new_gross_rent_multiplier
          or
          ( @old_gross_rent_multiplier is null and @new_gross_rent_multiplier is not null ) 
          or
          ( @old_gross_rent_multiplier is not null and @new_gross_rent_multiplier is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_grm_gim' and
                    chg_log_columns = 'gross_rent_multiplier' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1693, 9747, convert(varchar(255), @old_gross_rent_multiplier), convert(varchar(255), @new_gross_rent_multiplier), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @new_prop_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @new_class_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @new_econ_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @new_level_cd), 0)
          end
     end
 
     fetch next from curRows into @old_year, @old_prop_type_cd, @old_class_cd, @old_econ_cd, @old_level_cd, @old_potential_gross_income_annual, @old_potential_gross_income_monthly, @old_gross_income_multiplier, @old_gross_rent_multiplier, 
                                  @new_year, @new_prop_type_cd, @new_class_cd, @new_econ_cd, @new_level_cd, @new_potential_gross_income_annual, @new_potential_gross_income_monthly, @new_gross_income_multiplier, @new_gross_rent_multiplier
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_income_sched_grm_gim_delete_ChangeLog
on income_sched_grm_gim
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
          chg_log_tables = 'income_sched_grm_gim' and
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
 
declare @year numeric(4,0)
declare @prop_type_cd char(5)
declare @class_cd varchar(10)
declare @econ_cd varchar(10)
declare @level_cd varchar(10)
 
declare curRows cursor
for
     select year, prop_type_cd, class_cd, econ_cd, level_cd from deleted
for read only
 
open curRows
fetch next from curRows into @year, @prop_type_cd, @class_cd, @econ_cd, @level_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1693, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4079, convert(varchar(24), @prop_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 762, convert(varchar(24), @class_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1409, convert(varchar(24), @econ_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2811, convert(varchar(24), @level_cd), 0)
 
     fetch next from curRows into @year, @prop_type_cd, @class_cd, @econ_cd, @level_cd
end
 
close curRows
deallocate curRows

GO

