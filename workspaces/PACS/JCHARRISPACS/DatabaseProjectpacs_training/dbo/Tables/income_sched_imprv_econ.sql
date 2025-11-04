CREATE TABLE [dbo].[income_sched_imprv_econ] (
    [year]                 NUMERIC (4)     NOT NULL,
    [economic_area]        VARCHAR (10)    NOT NULL,
    [imprv_det_type_cd]    CHAR (10)       NOT NULL,
    [imprv_det_meth_cd]    CHAR (5)        NOT NULL,
    [use_matrix]           BIT             DEFAULT ((0)) NOT NULL,
    [rent_rate]            NUMERIC (14, 2) NULL,
    [collection_loss]      NUMERIC (5, 2)  NULL,
    [occupancy_rate]       NUMERIC (5, 2)  NULL,
    [secondary_income_rsf] NUMERIC (14, 2) NULL,
    [cap_rate]             NUMERIC (7, 4)  NULL,
    [expense_rsf]          NUMERIC (14, 2) NULL,
    [expense_ratio]        NUMERIC (5, 2)  NULL,
    [do_not_use_tax_rate]  BIT             DEFAULT ((0)) NOT NULL,
    [rent_rate_period]     CHAR (1)        DEFAULT ('Y') NOT NULL,
    CONSTRAINT [CPK_income_sched_imprv_econ] PRIMARY KEY CLUSTERED ([year] ASC, [economic_area] ASC, [imprv_det_type_cd] ASC, [imprv_det_meth_cd] ASC),
    CONSTRAINT [CFK_income_sched_imprv_econ_economic_ara] FOREIGN KEY ([economic_area]) REFERENCES [dbo].[income_econ_area] ([econ_cd]),
    CONSTRAINT [CFK_income_sched_imprv_econ_imprv_det_meth] FOREIGN KEY ([imprv_det_meth_cd]) REFERENCES [dbo].[imprv_det_meth] ([imprv_det_meth_cd]),
    CONSTRAINT [CFK_income_sched_imprv_econ_imprv_det_type] FOREIGN KEY ([imprv_det_type_cd]) REFERENCES [dbo].[imprv_det_type] ([imprv_det_type_cd])
);


GO

 
create trigger tr_income_sched_imprv_econ_update_ChangeLog
on income_sched_imprv_econ
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
declare @old_economic_area varchar(10)
declare @new_economic_area varchar(10)
declare @old_imprv_det_type_cd char(10)
declare @new_imprv_det_type_cd char(10)
declare @old_imprv_det_meth_cd char(5)
declare @new_imprv_det_meth_cd char(5)
declare @old_use_matrix bit
declare @new_use_matrix bit
declare @old_rent_rate numeric(14,2)
declare @new_rent_rate numeric(14,2)
declare @old_collection_loss numeric(5,2)
declare @new_collection_loss numeric(5,2)
declare @old_occupancy_rate numeric(5,2)
declare @new_occupancy_rate numeric(5,2)
declare @old_secondary_income_rsf numeric(14,2)
declare @new_secondary_income_rsf numeric(14,2)
declare @old_cap_rate numeric(7,4)
declare @new_cap_rate numeric(7,4)
declare @old_expense_rsf numeric(14,2)
declare @new_expense_rsf numeric(14,2)
declare @old_expense_ratio numeric(5,2)
declare @new_expense_ratio numeric(5,2)
declare @old_do_not_use_tax_rate bit
declare @new_do_not_use_tax_rate bit
declare @old_rent_rate_period char(1)
declare @new_rent_rate_period char(1)
 
declare curRows cursor
for
     select d.year, d.economic_area, d.imprv_det_type_cd, d.imprv_det_meth_cd, d.use_matrix, d.rent_rate, d.collection_loss, d.occupancy_rate, d.secondary_income_rsf, d.cap_rate, d.expense_rsf, d.expense_ratio, d.do_not_use_tax_rate, d.rent_rate_period, 
            i.year, i.economic_area, i.imprv_det_type_cd, i.imprv_det_meth_cd, i.use_matrix, i.rent_rate, i.collection_loss, i.occupancy_rate, i.secondary_income_rsf, i.cap_rate, i.expense_rsf, i.expense_ratio, i.do_not_use_tax_rate, i.rent_rate_period
from deleted as d
join inserted as i on 
     d.year = i.year and
     d.economic_area = i.economic_area and
     d.imprv_det_type_cd = i.imprv_det_type_cd and
     d.imprv_det_meth_cd = i.imprv_det_meth_cd
for read only
 
open curRows
fetch next from curRows into @old_year, @old_economic_area, @old_imprv_det_type_cd, @old_imprv_det_meth_cd, @old_use_matrix, @old_rent_rate, @old_collection_loss, @old_occupancy_rate, @old_secondary_income_rsf, @old_cap_rate, @old_expense_rsf, @old_expense_ratio, @old_do_not_use_tax_rate, @old_rent_rate_period, 
                             @new_year, @new_economic_area, @new_imprv_det_type_cd, @new_imprv_det_meth_cd, @new_use_matrix, @new_rent_rate, @new_collection_loss, @new_occupancy_rate, @new_secondary_income_rsf, @new_cap_rate, @new_expense_rsf, @new_expense_ratio, @new_do_not_use_tax_rate, @new_rent_rate_period
 
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
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 5550, convert(varchar(255), @old_year), convert(varchar(255), @new_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_economic_area <> @new_economic_area
          or
          ( @old_economic_area is null and @new_economic_area is not null ) 
          or
          ( @old_economic_area is not null and @new_economic_area is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'economic_area' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9941, convert(varchar(255), @old_economic_area), convert(varchar(255), @new_economic_area), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_imprv_det_type_cd <> @new_imprv_det_type_cd
          or
          ( @old_imprv_det_type_cd is null and @new_imprv_det_type_cd is not null ) 
          or
          ( @old_imprv_det_type_cd is not null and @new_imprv_det_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'imprv_det_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 2263, convert(varchar(255), @old_imprv_det_type_cd), convert(varchar(255), @new_imprv_det_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_imprv_det_meth_cd <> @new_imprv_det_meth_cd
          or
          ( @old_imprv_det_meth_cd is null and @new_imprv_det_meth_cd is not null ) 
          or
          ( @old_imprv_det_meth_cd is not null and @new_imprv_det_meth_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'imprv_det_meth_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 2257, convert(varchar(255), @old_imprv_det_meth_cd), convert(varchar(255), @new_imprv_det_meth_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_use_matrix <> @new_use_matrix
          or
          ( @old_use_matrix is null and @new_use_matrix is not null ) 
          or
          ( @old_use_matrix is not null and @new_use_matrix is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'use_matrix' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9793, convert(varchar(255), @old_use_matrix), convert(varchar(255), @new_use_matrix), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_rent_rate <> @new_rent_rate
          or
          ( @old_rent_rate is null and @new_rent_rate is not null ) 
          or
          ( @old_rent_rate is not null and @new_rent_rate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'rent_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9768, convert(varchar(255), @old_rent_rate), convert(varchar(255), @new_rent_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_collection_loss <> @new_collection_loss
          or
          ( @old_collection_loss is null and @new_collection_loss is not null ) 
          or
          ( @old_collection_loss is not null and @new_collection_loss is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'collection_loss' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9798, convert(varchar(255), @old_collection_loss), convert(varchar(255), @new_collection_loss), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_occupancy_rate <> @new_occupancy_rate
          or
          ( @old_occupancy_rate is null and @new_occupancy_rate is not null ) 
          or
          ( @old_occupancy_rate is not null and @new_occupancy_rate is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'occupancy_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9753, convert(varchar(255), @old_occupancy_rate), convert(varchar(255), @new_occupancy_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_secondary_income_rsf <> @new_secondary_income_rsf
          or
          ( @old_secondary_income_rsf is null and @new_secondary_income_rsf is not null ) 
          or
          ( @old_secondary_income_rsf is not null and @new_secondary_income_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'secondary_income_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9791, convert(varchar(255), @old_secondary_income_rsf), convert(varchar(255), @new_secondary_income_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
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
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'cap_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9050, convert(varchar(255), @old_cap_rate), convert(varchar(255), @new_cap_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_expense_rsf <> @new_expense_rsf
          or
          ( @old_expense_rsf is null and @new_expense_rsf is not null ) 
          or
          ( @old_expense_rsf is not null and @new_expense_rsf is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'expense_rsf' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9745, convert(varchar(255), @old_expense_rsf), convert(varchar(255), @new_expense_rsf), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_expense_ratio <> @new_expense_ratio
          or
          ( @old_expense_ratio is null and @new_expense_ratio is not null ) 
          or
          ( @old_expense_ratio is not null and @new_expense_ratio is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'expense_ratio' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9799, convert(varchar(255), @old_expense_ratio), convert(varchar(255), @new_expense_ratio), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
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
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'do_not_use_tax_rate' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9744, convert(varchar(255), @old_do_not_use_tax_rate), convert(varchar(255), @new_do_not_use_tax_rate), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     if (
          @old_rent_rate_period <> @new_rent_rate_period
          or
          ( @old_rent_rate_period is null and @new_rent_rate_period is not null ) 
          or
          ( @old_rent_rate_period is not null and @new_rent_rate_period is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_sched_imprv_econ' and
                    chg_log_columns = 'rent_rate_period' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1688, 9940, convert(varchar(255), @old_rent_rate_period), convert(varchar(255), @new_rent_rate_period), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @new_year), case when @new_year > @tvar_intMin and @new_year < @tvar_intMax then convert(int, round(@new_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @new_economic_area), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @new_imprv_det_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @new_imprv_det_meth_cd), 0)
          end
     end
 
     fetch next from curRows into @old_year, @old_economic_area, @old_imprv_det_type_cd, @old_imprv_det_meth_cd, @old_use_matrix, @old_rent_rate, @old_collection_loss, @old_occupancy_rate, @old_secondary_income_rsf, @old_cap_rate, @old_expense_rsf, @old_expense_ratio, @old_do_not_use_tax_rate, @old_rent_rate_period, 
                                  @new_year, @new_economic_area, @new_imprv_det_type_cd, @new_imprv_det_meth_cd, @new_use_matrix, @new_rent_rate, @new_collection_loss, @new_occupancy_rate, @new_secondary_income_rsf, @new_cap_rate, @new_expense_rsf, @new_expense_ratio, @new_do_not_use_tax_rate, @new_rent_rate_period
end
 
close curRows
deallocate curRows

GO


create trigger tr_income_sched_imprv_econ_delete_insert_update_MemTable
on income_sched_imprv_econ
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
where szTableName = 'income_sched_imprv_econ'

GO

 
create trigger tr_income_sched_imprv_econ_insert_ChangeLog
on income_sched_imprv_econ
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
declare @economic_area varchar(10)
declare @imprv_det_type_cd char(10)
declare @imprv_det_meth_cd char(5)
declare @use_matrix bit
declare @rent_rate numeric(14,2)
declare @collection_loss numeric(5,2)
declare @occupancy_rate numeric(5,2)
declare @secondary_income_rsf numeric(14,2)
declare @cap_rate numeric(7,4)
declare @expense_rsf numeric(14,2)
declare @expense_ratio numeric(5,2)
declare @do_not_use_tax_rate bit
declare @rent_rate_period char(1)
 
declare curRows cursor
for
     select year, economic_area, imprv_det_type_cd, imprv_det_meth_cd, use_matrix, rent_rate, collection_loss, occupancy_rate, secondary_income_rsf, cap_rate, expense_rsf, expense_ratio, do_not_use_tax_rate, rent_rate_period from inserted
for read only
 
open curRows
fetch next from curRows into @year, @economic_area, @imprv_det_type_cd, @imprv_det_meth_cd, @use_matrix, @rent_rate, @collection_loss, @occupancy_rate, @secondary_income_rsf, @cap_rate, @expense_rsf, @expense_ratio, @do_not_use_tax_rate, @rent_rate_period
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 5550, null, convert(varchar(255), @year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'economic_area' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9941, null, convert(varchar(255), @economic_area), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'imprv_det_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 2263, null, convert(varchar(255), @imprv_det_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'imprv_det_meth_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 2257, null, convert(varchar(255), @imprv_det_meth_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'use_matrix' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9793, null, convert(varchar(255), @use_matrix), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'rent_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9768, null, convert(varchar(255), @rent_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'collection_loss' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9798, null, convert(varchar(255), @collection_loss), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'occupancy_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9753, null, convert(varchar(255), @occupancy_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'secondary_income_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9791, null, convert(varchar(255), @secondary_income_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'cap_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9050, null, convert(varchar(255), @cap_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'expense_rsf' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9745, null, convert(varchar(255), @expense_rsf), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'expense_ratio' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9799, null, convert(varchar(255), @expense_ratio), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'do_not_use_tax_rate' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9744, null, convert(varchar(255), @do_not_use_tax_rate), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_sched_imprv_econ' and
               chg_log_columns = 'rent_rate_period' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1688, 9940, null, convert(varchar(255), @rent_rate_period), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
     end
 
     fetch next from curRows into @year, @economic_area, @imprv_det_type_cd, @imprv_det_meth_cd, @use_matrix, @rent_rate, @collection_loss, @occupancy_rate, @secondary_income_rsf, @cap_rate, @expense_rsf, @expense_ratio, @do_not_use_tax_rate, @rent_rate_period
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_income_sched_imprv_econ_delete_ChangeLog
on income_sched_imprv_econ
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
          chg_log_tables = 'income_sched_imprv_econ' and
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
declare @economic_area varchar(10)
declare @imprv_det_type_cd char(10)
declare @imprv_det_meth_cd char(5)
 
declare curRows cursor
for
     select year, economic_area, imprv_det_type_cd, imprv_det_meth_cd from deleted
for read only
 
open curRows
fetch next from curRows into @year, @economic_area, @imprv_det_type_cd, @imprv_det_meth_cd
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1688, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5550, convert(varchar(24), @year), case when @year > @tvar_intMin and @year < @tvar_intMax then convert(int, round(@year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9941, convert(varchar(24), @economic_area), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2263, convert(varchar(24), @imprv_det_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2257, convert(varchar(24), @imprv_det_meth_cd), 0)
 
     fetch next from curRows into @year, @economic_area, @imprv_det_type_cd, @imprv_det_meth_cd
end
 
close curRows
deallocate curRows

GO

