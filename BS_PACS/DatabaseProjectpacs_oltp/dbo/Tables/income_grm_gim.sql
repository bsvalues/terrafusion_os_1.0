CREATE TABLE [dbo].[income_grm_gim] (
    [income_yr]                   NUMERIC (4)    NOT NULL,
    [sup_num]                     INT            NOT NULL,
    [income_id]                   INT            NOT NULL,
    [sch_pgi_annual]              NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_sch_pgi_annual] DEFAULT ((0)) NOT NULL,
    [sch_pgi_monthly]             NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_sch_pgi_monthly] DEFAULT ((0)) NOT NULL,
    [sch_gim]                     NUMERIC (5, 2) CONSTRAINT [CDF_income_grm_gim_sch_gim] DEFAULT ((0)) NOT NULL,
    [sch_grm]                     NUMERIC (5, 2) CONSTRAINT [CDF_income_grm_gim_sch_grm] DEFAULT ((0)) NOT NULL,
    [sch_indicated_value_gim]     NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_sch_indicated_value_gim] DEFAULT ((0)) NOT NULL,
    [sch_indicated_value_grm]     NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_sch_indicated_value_grm] DEFAULT ((0)) NOT NULL,
    [sch_personal_property_value] NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_sch_personal_property_value] DEFAULT ((0)) NOT NULL,
    [sch_other_value]             NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_sch_other_value] DEFAULT ((0)) NOT NULL,
    [sch_base_indicated_value]    NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_sch_base_indicated_value] DEFAULT ((0)) NOT NULL,
    [sch_indicated_value]         NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_sch_indicated_value] DEFAULT ((0)) NOT NULL,
    [pf_pgi_annual]               NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_pf_pgi_annual] DEFAULT ((0)) NOT NULL,
    [pf_pgi_monthly]              NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_pf_pgi_monthly] DEFAULT ((0)) NOT NULL,
    [pf_gim]                      NUMERIC (5, 2) CONSTRAINT [CDF_income_grm_gim_pf_gim] DEFAULT ((0)) NOT NULL,
    [pf_grm]                      NUMERIC (5, 2) CONSTRAINT [CDF_income_grm_gim_pf_grm] DEFAULT ((0)) NOT NULL,
    [pf_indicated_value_gim]      NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_pf_indicated_value_gim] DEFAULT ((0)) NOT NULL,
    [pf_indicated_value_grm]      NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_pf_indicated_value_grm] DEFAULT ((0)) NOT NULL,
    [pf_personal_property_value]  NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_pf_personal_property_value] DEFAULT ((0)) NOT NULL,
    [pf_other_value]              NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_pf_other_value] DEFAULT ((0)) NOT NULL,
    [pf_base_indicated_value]     NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_pf_base_indicated_value] DEFAULT ((0)) NOT NULL,
    [pf_indicated_value]          NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_pf_indicated_value] DEFAULT ((0)) NOT NULL,
    [dc_pgi_annual]               NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_dc_pgi_annual] DEFAULT ((0)) NOT NULL,
    [dc_pgi_monthly]              NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_dc_pgi_monthly] DEFAULT ((0)) NOT NULL,
    [dc_gim]                      NUMERIC (5, 2) CONSTRAINT [CDF_income_grm_gim_dc_gim] DEFAULT ((0)) NOT NULL,
    [dc_grm]                      NUMERIC (5, 2) CONSTRAINT [CDF_income_grm_gim_dc_grm] DEFAULT ((0)) NOT NULL,
    [dc_indicated_value_gim]      NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_dc_indicated_value_gim] DEFAULT ((0)) NOT NULL,
    [dc_indicated_value_grm]      NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_dc_indicated_value_grm] DEFAULT ((0)) NOT NULL,
    [dc_personal_property_value]  NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_dc_personal_property_value] DEFAULT ((0)) NOT NULL,
    [dc_other_value]              NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_dc_other_value] DEFAULT ((0)) NOT NULL,
    [dc_base_indicated_value]     NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_dc_base_indicated_value] DEFAULT ((0)) NOT NULL,
    [dc_indicated_value]          NUMERIC (14)   CONSTRAINT [CDF_income_grm_gim_dc_indicated_value] DEFAULT ((0)) NOT NULL,
    [tsRowVersion]                ROWVERSION     NOT NULL,
    CONSTRAINT [CPK_income_grm_gim] PRIMARY KEY CLUSTERED ([income_yr] ASC, [sup_num] ASC, [income_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_income_grm_gim_income] FOREIGN KEY ([income_yr], [sup_num], [income_id]) REFERENCES [dbo].[income] ([income_yr], [sup_num], [income_id]) ON DELETE CASCADE
);


GO

 
create trigger tr_income_grm_gim_delete_ChangeLog
on income_grm_gim
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
          chg_log_tables = 'income_grm_gim' and
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
 
declare @income_id int
declare @sup_num int
declare @income_yr numeric(4,0)
 
declare curRows cursor
for
     select income_id, sup_num, income_yr from deleted
for read only
 
open curRows
fetch next from curRows into @income_id, @sup_num, @income_yr
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1681, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @income_id, @sup_num, @income_yr
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_income_grm_gim_update_ChangeLog
on income_grm_gim
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
 
declare @old_income_id int
declare @new_income_id int
declare @old_sup_num int
declare @new_sup_num int
declare @old_income_yr numeric(4,0)
declare @new_income_yr numeric(4,0)
declare @old_sch_pgi_annual numeric(14,0)
declare @new_sch_pgi_annual numeric(14,0)
declare @old_sch_pgi_monthly numeric(14,0)
declare @new_sch_pgi_monthly numeric(14,0)
declare @old_sch_gim numeric(5,2)
declare @new_sch_gim numeric(5,2)
declare @old_sch_grm numeric(5,2)
declare @new_sch_grm numeric(5,2)
declare @old_sch_indicated_value_gim numeric(14,0)
declare @new_sch_indicated_value_gim numeric(14,0)
declare @old_sch_indicated_value_grm numeric(14,0)
declare @new_sch_indicated_value_grm numeric(14,0)
declare @old_sch_personal_property_value numeric(14,0)
declare @new_sch_personal_property_value numeric(14,0)
declare @old_sch_other_value numeric(14,0)
declare @new_sch_other_value numeric(14,0)
declare @old_sch_base_indicated_value numeric(14,0)
declare @new_sch_base_indicated_value numeric(14,0)
declare @old_sch_indicated_value numeric(14,0)
declare @new_sch_indicated_value numeric(14,0)
declare @old_pf_pgi_annual numeric(14,0)
declare @new_pf_pgi_annual numeric(14,0)
declare @old_pf_pgi_monthly numeric(14,0)
declare @new_pf_pgi_monthly numeric(14,0)
declare @old_pf_gim numeric(5,2)
declare @new_pf_gim numeric(5,2)
declare @old_pf_grm numeric(5,2)
declare @new_pf_grm numeric(5,2)
declare @old_pf_indicated_value_gim numeric(14,0)
declare @new_pf_indicated_value_gim numeric(14,0)
declare @old_pf_indicated_value_grm numeric(14,0)
declare @new_pf_indicated_value_grm numeric(14,0)
declare @old_pf_personal_property_value numeric(14,0)
declare @new_pf_personal_property_value numeric(14,0)
declare @old_pf_other_value numeric(14,0)
declare @new_pf_other_value numeric(14,0)
declare @old_pf_base_indicated_value numeric(14,0)
declare @new_pf_base_indicated_value numeric(14,0)
declare @old_pf_indicated_value numeric(14,0)
declare @new_pf_indicated_value numeric(14,0)
declare @old_dc_pgi_annual numeric(14,0)
declare @new_dc_pgi_annual numeric(14,0)
declare @old_dc_pgi_monthly numeric(14,0)
declare @new_dc_pgi_monthly numeric(14,0)
declare @old_dc_gim numeric(5,2)
declare @new_dc_gim numeric(5,2)
declare @old_dc_grm numeric(5,2)
declare @new_dc_grm numeric(5,2)
declare @old_dc_indicated_value_gim numeric(14,0)
declare @new_dc_indicated_value_gim numeric(14,0)
declare @old_dc_indicated_value_grm numeric(14,0)
declare @new_dc_indicated_value_grm numeric(14,0)
declare @old_dc_personal_property_value numeric(14,0)
declare @new_dc_personal_property_value numeric(14,0)
declare @old_dc_other_value numeric(14,0)
declare @new_dc_other_value numeric(14,0)
declare @old_dc_base_indicated_value numeric(14,0)
declare @new_dc_base_indicated_value numeric(14,0)
declare @old_dc_indicated_value numeric(14,0)
declare @new_dc_indicated_value numeric(14,0)
 
declare curRows cursor
for
     select d.income_id, d.sup_num, d.income_yr, d.sch_pgi_annual, d.sch_pgi_monthly, d.sch_gim, d.sch_grm, d.sch_indicated_value_gim, d.sch_indicated_value_grm, d.sch_personal_property_value, d.sch_other_value, d.sch_base_indicated_value, d.sch_indicated_value, d.pf_pgi_annual, d.pf_pgi_monthly, d.pf_gim, d.pf_grm, d.pf_indicated_value_gim, d.pf_indicated_value_grm, d.pf_personal_property_value, d.pf_other_value, d.pf_base_indicated_value, d.pf_indicated_value, d.dc_pgi_annual, d.dc_pgi_monthly, d.dc_gim, d.dc_grm, d.dc_indicated_value_gim, d.dc_indicated_value_grm, d.dc_personal_property_value, d.dc_other_value, d.dc_base_indicated_value, d.dc_indicated_value, 
            i.income_id, i.sup_num, i.income_yr, i.sch_pgi_annual, i.sch_pgi_monthly, i.sch_gim, i.sch_grm, i.sch_indicated_value_gim, i.sch_indicated_value_grm, i.sch_personal_property_value, i.sch_other_value, i.sch_base_indicated_value, i.sch_indicated_value, i.pf_pgi_annual, i.pf_pgi_monthly, i.pf_gim, i.pf_grm, i.pf_indicated_value_gim, i.pf_indicated_value_grm, i.pf_personal_property_value, i.pf_other_value, i.pf_base_indicated_value, i.pf_indicated_value, i.dc_pgi_annual, i.dc_pgi_monthly, i.dc_gim, i.dc_grm, i.dc_indicated_value_gim, i.dc_indicated_value_grm, i.dc_personal_property_value, i.dc_other_value, i.dc_base_indicated_value, i.dc_indicated_value
from deleted as d
join inserted as i on 
     d.income_id = i.income_id and
     d.sup_num = i.sup_num and
     d.income_yr = i.income_yr
for read only
 
open curRows
fetch next from curRows into @old_income_id, @old_sup_num, @old_income_yr, @old_sch_pgi_annual, @old_sch_pgi_monthly, @old_sch_gim, @old_sch_grm, @old_sch_indicated_value_gim, @old_sch_indicated_value_grm, @old_sch_personal_property_value, @old_sch_other_value, @old_sch_base_indicated_value, @old_sch_indicated_value, @old_pf_pgi_annual, @old_pf_pgi_monthly, @old_pf_gim, @old_pf_grm, @old_pf_indicated_value_gim, @old_pf_indicated_value_grm, @old_pf_personal_property_value, @old_pf_other_value, @old_pf_base_indicated_value, @old_pf_indicated_value, @old_dc_pgi_annual, @old_dc_pgi_monthly, @old_dc_gim, @old_dc_grm, @old_dc_indicated_value_gim, @old_dc_indicated_value_grm, @old_dc_personal_property_value, @old_dc_other_value, @old_dc_base_indicated_value, @old_dc_indicated_value, 
                             @new_income_id, @new_sup_num, @new_income_yr, @new_sch_pgi_annual, @new_sch_pgi_monthly, @new_sch_gim, @new_sch_grm, @new_sch_indicated_value_gim, @new_sch_indicated_value_grm, @new_sch_personal_property_value, @new_sch_other_value, @new_sch_base_indicated_value, @new_sch_indicated_value, @new_pf_pgi_annual, @new_pf_pgi_monthly, @new_pf_gim, @new_pf_grm, @new_pf_indicated_value_gim, @new_pf_indicated_value_grm, @new_pf_personal_property_value, @new_pf_other_value, @new_pf_base_indicated_value, @new_pf_indicated_value, @new_dc_pgi_annual, @new_dc_pgi_monthly, @new_dc_gim, @new_dc_grm, @new_dc_indicated_value_gim, @new_dc_indicated_value_grm, @new_dc_personal_property_value, @new_dc_other_value, @new_dc_base_indicated_value, @new_dc_indicated_value
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_income_id <> @new_income_id
          or
          ( @old_income_id is null and @new_income_id is not null ) 
          or
          ( @old_income_id is not null and @new_income_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'income_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 2344, convert(varchar(255), @old_income_id), convert(varchar(255), @new_income_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sup_num <> @new_sup_num
          or
          ( @old_sup_num is null and @new_sup_num is not null ) 
          or
          ( @old_sup_num is not null and @new_sup_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
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
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'income_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 2357, convert(varchar(255), @old_income_yr), convert(varchar(255), @new_income_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_pgi_annual <> @new_sch_pgi_annual
          or
          ( @old_sch_pgi_annual is null and @new_sch_pgi_annual is not null ) 
          or
          ( @old_sch_pgi_annual is not null and @new_sch_pgi_annual is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_pgi_annual' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9779, convert(varchar(255), @old_sch_pgi_annual), convert(varchar(255), @new_sch_pgi_annual), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_pgi_monthly <> @new_sch_pgi_monthly
          or
          ( @old_sch_pgi_monthly is null and @new_sch_pgi_monthly is not null ) 
          or
          ( @old_sch_pgi_monthly is not null and @new_sch_pgi_monthly is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_pgi_monthly' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9780, convert(varchar(255), @old_sch_pgi_monthly), convert(varchar(255), @new_sch_pgi_monthly), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_gim <> @new_sch_gim
          or
          ( @old_sch_gim is null and @new_sch_gim is not null ) 
          or
          ( @old_sch_gim is not null and @new_sch_gim is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_gim' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9771, convert(varchar(255), @old_sch_gim), convert(varchar(255), @new_sch_gim), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_grm <> @new_sch_grm
          or
          ( @old_sch_grm is null and @new_sch_grm is not null ) 
          or
          ( @old_sch_grm is not null and @new_sch_grm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_grm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9772, convert(varchar(255), @old_sch_grm), convert(varchar(255), @new_sch_grm), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_indicated_value_gim <> @new_sch_indicated_value_gim
          or
          ( @old_sch_indicated_value_gim is null and @new_sch_indicated_value_gim is not null ) 
          or
          ( @old_sch_indicated_value_gim is not null and @new_sch_indicated_value_gim is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_indicated_value_gim' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9774, convert(varchar(255), @old_sch_indicated_value_gim), convert(varchar(255), @new_sch_indicated_value_gim), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_indicated_value_grm <> @new_sch_indicated_value_grm
          or
          ( @old_sch_indicated_value_grm is null and @new_sch_indicated_value_grm is not null ) 
          or
          ( @old_sch_indicated_value_grm is not null and @new_sch_indicated_value_grm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_indicated_value_grm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9775, convert(varchar(255), @old_sch_indicated_value_grm), convert(varchar(255), @new_sch_indicated_value_grm), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_personal_property_value <> @new_sch_personal_property_value
          or
          ( @old_sch_personal_property_value is null and @new_sch_personal_property_value is not null ) 
          or
          ( @old_sch_personal_property_value is not null and @new_sch_personal_property_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_personal_property_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9778, convert(varchar(255), @old_sch_personal_property_value), convert(varchar(255), @new_sch_personal_property_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_other_value <> @new_sch_other_value
          or
          ( @old_sch_other_value is null and @new_sch_other_value is not null ) 
          or
          ( @old_sch_other_value is not null and @new_sch_other_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_other_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9776, convert(varchar(255), @old_sch_other_value), convert(varchar(255), @new_sch_other_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_base_indicated_value <> @new_sch_base_indicated_value
          or
          ( @old_sch_base_indicated_value is null and @new_sch_base_indicated_value is not null ) 
          or
          ( @old_sch_base_indicated_value is not null and @new_sch_base_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_base_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9770, convert(varchar(255), @old_sch_base_indicated_value), convert(varchar(255), @new_sch_base_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sch_indicated_value <> @new_sch_indicated_value
          or
          ( @old_sch_indicated_value is null and @new_sch_indicated_value is not null ) 
          or
          ( @old_sch_indicated_value is not null and @new_sch_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'sch_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9773, convert(varchar(255), @old_sch_indicated_value), convert(varchar(255), @new_sch_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_pgi_annual <> @new_pf_pgi_annual
          or
          ( @old_pf_pgi_annual is null and @new_pf_pgi_annual is not null ) 
          or
          ( @old_pf_pgi_annual is not null and @new_pf_pgi_annual is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_pgi_annual' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9764, convert(varchar(255), @old_pf_pgi_annual), convert(varchar(255), @new_pf_pgi_annual), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_pgi_monthly <> @new_pf_pgi_monthly
          or
          ( @old_pf_pgi_monthly is null and @new_pf_pgi_monthly is not null ) 
          or
          ( @old_pf_pgi_monthly is not null and @new_pf_pgi_monthly is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_pgi_monthly' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9765, convert(varchar(255), @old_pf_pgi_monthly), convert(varchar(255), @new_pf_pgi_monthly), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_gim <> @new_pf_gim
          or
          ( @old_pf_gim is null and @new_pf_gim is not null ) 
          or
          ( @old_pf_gim is not null and @new_pf_gim is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_gim' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9756, convert(varchar(255), @old_pf_gim), convert(varchar(255), @new_pf_gim), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_grm <> @new_pf_grm
          or
          ( @old_pf_grm is null and @new_pf_grm is not null ) 
          or
          ( @old_pf_grm is not null and @new_pf_grm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_grm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9757, convert(varchar(255), @old_pf_grm), convert(varchar(255), @new_pf_grm), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_indicated_value_gim <> @new_pf_indicated_value_gim
          or
          ( @old_pf_indicated_value_gim is null and @new_pf_indicated_value_gim is not null ) 
          or
          ( @old_pf_indicated_value_gim is not null and @new_pf_indicated_value_gim is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_indicated_value_gim' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9759, convert(varchar(255), @old_pf_indicated_value_gim), convert(varchar(255), @new_pf_indicated_value_gim), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_indicated_value_grm <> @new_pf_indicated_value_grm
          or
          ( @old_pf_indicated_value_grm is null and @new_pf_indicated_value_grm is not null ) 
          or
          ( @old_pf_indicated_value_grm is not null and @new_pf_indicated_value_grm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_indicated_value_grm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9760, convert(varchar(255), @old_pf_indicated_value_grm), convert(varchar(255), @new_pf_indicated_value_grm), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_personal_property_value <> @new_pf_personal_property_value
          or
          ( @old_pf_personal_property_value is null and @new_pf_personal_property_value is not null ) 
          or
          ( @old_pf_personal_property_value is not null and @new_pf_personal_property_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_personal_property_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9763, convert(varchar(255), @old_pf_personal_property_value), convert(varchar(255), @new_pf_personal_property_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_other_value <> @new_pf_other_value
          or
          ( @old_pf_other_value is null and @new_pf_other_value is not null ) 
          or
          ( @old_pf_other_value is not null and @new_pf_other_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_other_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9761, convert(varchar(255), @old_pf_other_value), convert(varchar(255), @new_pf_other_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_base_indicated_value <> @new_pf_base_indicated_value
          or
          ( @old_pf_base_indicated_value is null and @new_pf_base_indicated_value is not null ) 
          or
          ( @old_pf_base_indicated_value is not null and @new_pf_base_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_base_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9755, convert(varchar(255), @old_pf_base_indicated_value), convert(varchar(255), @new_pf_base_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pf_indicated_value <> @new_pf_indicated_value
          or
          ( @old_pf_indicated_value is null and @new_pf_indicated_value is not null ) 
          or
          ( @old_pf_indicated_value is not null and @new_pf_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'pf_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9758, convert(varchar(255), @old_pf_indicated_value), convert(varchar(255), @new_pf_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_pgi_annual <> @new_dc_pgi_annual
          or
          ( @old_dc_pgi_annual is null and @new_dc_pgi_annual is not null ) 
          or
          ( @old_dc_pgi_annual is not null and @new_dc_pgi_annual is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_pgi_annual' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9742, convert(varchar(255), @old_dc_pgi_annual), convert(varchar(255), @new_dc_pgi_annual), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_pgi_monthly <> @new_dc_pgi_monthly
          or
          ( @old_dc_pgi_monthly is null and @new_dc_pgi_monthly is not null ) 
          or
          ( @old_dc_pgi_monthly is not null and @new_dc_pgi_monthly is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_pgi_monthly' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9743, convert(varchar(255), @old_dc_pgi_monthly), convert(varchar(255), @new_dc_pgi_monthly), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_gim <> @new_dc_gim
          or
          ( @old_dc_gim is null and @new_dc_gim is not null ) 
          or
          ( @old_dc_gim is not null and @new_dc_gim is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_gim' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9734, convert(varchar(255), @old_dc_gim), convert(varchar(255), @new_dc_gim), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_grm <> @new_dc_grm
          or
          ( @old_dc_grm is null and @new_dc_grm is not null ) 
          or
          ( @old_dc_grm is not null and @new_dc_grm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_grm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9735, convert(varchar(255), @old_dc_grm), convert(varchar(255), @new_dc_grm), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_indicated_value_gim <> @new_dc_indicated_value_gim
          or
          ( @old_dc_indicated_value_gim is null and @new_dc_indicated_value_gim is not null ) 
          or
          ( @old_dc_indicated_value_gim is not null and @new_dc_indicated_value_gim is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_indicated_value_gim' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9737, convert(varchar(255), @old_dc_indicated_value_gim), convert(varchar(255), @new_dc_indicated_value_gim), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_indicated_value_grm <> @new_dc_indicated_value_grm
          or
          ( @old_dc_indicated_value_grm is null and @new_dc_indicated_value_grm is not null ) 
          or
          ( @old_dc_indicated_value_grm is not null and @new_dc_indicated_value_grm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_indicated_value_grm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9738, convert(varchar(255), @old_dc_indicated_value_grm), convert(varchar(255), @new_dc_indicated_value_grm), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_personal_property_value <> @new_dc_personal_property_value
          or
          ( @old_dc_personal_property_value is null and @new_dc_personal_property_value is not null ) 
          or
          ( @old_dc_personal_property_value is not null and @new_dc_personal_property_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_personal_property_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9741, convert(varchar(255), @old_dc_personal_property_value), convert(varchar(255), @new_dc_personal_property_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_other_value <> @new_dc_other_value
          or
          ( @old_dc_other_value is null and @new_dc_other_value is not null ) 
          or
          ( @old_dc_other_value is not null and @new_dc_other_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_other_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9739, convert(varchar(255), @old_dc_other_value), convert(varchar(255), @new_dc_other_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_base_indicated_value <> @new_dc_base_indicated_value
          or
          ( @old_dc_base_indicated_value is null and @new_dc_base_indicated_value is not null ) 
          or
          ( @old_dc_base_indicated_value is not null and @new_dc_base_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_base_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9733, convert(varchar(255), @old_dc_base_indicated_value), convert(varchar(255), @new_dc_base_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_dc_indicated_value <> @new_dc_indicated_value
          or
          ( @old_dc_indicated_value is null and @new_dc_indicated_value is not null ) 
          or
          ( @old_dc_indicated_value is not null and @new_dc_indicated_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'income_grm_gim' and
                    chg_log_columns = 'dc_indicated_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1681, 9736, convert(varchar(255), @old_dc_indicated_value), convert(varchar(255), @new_dc_indicated_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @new_income_id), @new_income_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @new_income_yr), case when @new_income_yr > @tvar_intMin and @new_income_yr < @tvar_intMax then convert(int, round(@new_income_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_income_id, @old_sup_num, @old_income_yr, @old_sch_pgi_annual, @old_sch_pgi_monthly, @old_sch_gim, @old_sch_grm, @old_sch_indicated_value_gim, @old_sch_indicated_value_grm, @old_sch_personal_property_value, @old_sch_other_value, @old_sch_base_indicated_value, @old_sch_indicated_value, @old_pf_pgi_annual, @old_pf_pgi_monthly, @old_pf_gim, @old_pf_grm, @old_pf_indicated_value_gim, @old_pf_indicated_value_grm, @old_pf_personal_property_value, @old_pf_other_value, @old_pf_base_indicated_value, @old_pf_indicated_value, @old_dc_pgi_annual, @old_dc_pgi_monthly, @old_dc_gim, @old_dc_grm, @old_dc_indicated_value_gim, @old_dc_indicated_value_grm, @old_dc_personal_property_value, @old_dc_other_value, @old_dc_base_indicated_value, @old_dc_indicated_value, 
                                  @new_income_id, @new_sup_num, @new_income_yr, @new_sch_pgi_annual, @new_sch_pgi_monthly, @new_sch_gim, @new_sch_grm, @new_sch_indicated_value_gim, @new_sch_indicated_value_grm, @new_sch_personal_property_value, @new_sch_other_value, @new_sch_base_indicated_value, @new_sch_indicated_value, @new_pf_pgi_annual, @new_pf_pgi_monthly, @new_pf_gim, @new_pf_grm, @new_pf_indicated_value_gim, @new_pf_indicated_value_grm, @new_pf_personal_property_value, @new_pf_other_value, @new_pf_base_indicated_value, @new_pf_indicated_value, @new_dc_pgi_annual, @new_dc_pgi_monthly, @new_dc_gim, @new_dc_grm, @new_dc_indicated_value_gim, @new_dc_indicated_value_grm, @new_dc_personal_property_value, @new_dc_other_value, @new_dc_base_indicated_value, @new_dc_indicated_value
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_income_grm_gim_insert_ChangeLog
on income_grm_gim
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
 
declare @income_id int
declare @sup_num int
declare @income_yr numeric(4,0)
declare @sch_pgi_annual numeric(14,0)
declare @sch_pgi_monthly numeric(14,0)
declare @sch_gim numeric(5,2)
declare @sch_grm numeric(5,2)
declare @sch_indicated_value_gim numeric(14,0)
declare @sch_indicated_value_grm numeric(14,0)
declare @sch_personal_property_value numeric(14,0)
declare @sch_other_value numeric(14,0)
declare @sch_base_indicated_value numeric(14,0)
declare @sch_indicated_value numeric(14,0)
declare @pf_pgi_annual numeric(14,0)
declare @pf_pgi_monthly numeric(14,0)
declare @pf_gim numeric(5,2)
declare @pf_grm numeric(5,2)
declare @pf_indicated_value_gim numeric(14,0)
declare @pf_indicated_value_grm numeric(14,0)
declare @pf_personal_property_value numeric(14,0)
declare @pf_other_value numeric(14,0)
declare @pf_base_indicated_value numeric(14,0)
declare @pf_indicated_value numeric(14,0)
declare @dc_pgi_annual numeric(14,0)
declare @dc_pgi_monthly numeric(14,0)
declare @dc_gim numeric(5,2)
declare @dc_grm numeric(5,2)
declare @dc_indicated_value_gim numeric(14,0)
declare @dc_indicated_value_grm numeric(14,0)
declare @dc_personal_property_value numeric(14,0)
declare @dc_other_value numeric(14,0)
declare @dc_base_indicated_value numeric(14,0)
declare @dc_indicated_value numeric(14,0)
 
declare curRows cursor
for
     select income_id, sup_num, income_yr, sch_pgi_annual, sch_pgi_monthly, sch_gim, sch_grm, sch_indicated_value_gim, sch_indicated_value_grm, sch_personal_property_value, sch_other_value, sch_base_indicated_value, sch_indicated_value, pf_pgi_annual, pf_pgi_monthly, pf_gim, pf_grm, pf_indicated_value_gim, pf_indicated_value_grm, pf_personal_property_value, pf_other_value, pf_base_indicated_value, pf_indicated_value, dc_pgi_annual, dc_pgi_monthly, dc_gim, dc_grm, dc_indicated_value_gim, dc_indicated_value_grm, dc_personal_property_value, dc_other_value, dc_base_indicated_value, dc_indicated_value from inserted
for read only
 
open curRows
fetch next from curRows into @income_id, @sup_num, @income_yr, @sch_pgi_annual, @sch_pgi_monthly, @sch_gim, @sch_grm, @sch_indicated_value_gim, @sch_indicated_value_grm, @sch_personal_property_value, @sch_other_value, @sch_base_indicated_value, @sch_indicated_value, @pf_pgi_annual, @pf_pgi_monthly, @pf_gim, @pf_grm, @pf_indicated_value_gim, @pf_indicated_value_grm, @pf_personal_property_value, @pf_other_value, @pf_base_indicated_value, @pf_indicated_value, @dc_pgi_annual, @dc_pgi_monthly, @dc_gim, @dc_grm, @dc_indicated_value_gim, @dc_indicated_value_grm, @dc_personal_property_value, @dc_other_value, @dc_base_indicated_value, @dc_indicated_value
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'income_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 2344, null, convert(varchar(255), @income_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'income_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 2357, null, convert(varchar(255), @income_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_pgi_annual' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9779, null, convert(varchar(255), @sch_pgi_annual), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_pgi_monthly' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9780, null, convert(varchar(255), @sch_pgi_monthly), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_gim' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9771, null, convert(varchar(255), @sch_gim), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_grm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9772, null, convert(varchar(255), @sch_grm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_indicated_value_gim' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9774, null, convert(varchar(255), @sch_indicated_value_gim), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_indicated_value_grm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9775, null, convert(varchar(255), @sch_indicated_value_grm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_personal_property_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9778, null, convert(varchar(255), @sch_personal_property_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_other_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9776, null, convert(varchar(255), @sch_other_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_base_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9770, null, convert(varchar(255), @sch_base_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'sch_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9773, null, convert(varchar(255), @sch_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_pgi_annual' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9764, null, convert(varchar(255), @pf_pgi_annual), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_pgi_monthly' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9765, null, convert(varchar(255), @pf_pgi_monthly), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_gim' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9756, null, convert(varchar(255), @pf_gim), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_grm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9757, null, convert(varchar(255), @pf_grm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_indicated_value_gim' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9759, null, convert(varchar(255), @pf_indicated_value_gim), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_indicated_value_grm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9760, null, convert(varchar(255), @pf_indicated_value_grm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_personal_property_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9763, null, convert(varchar(255), @pf_personal_property_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_other_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9761, null, convert(varchar(255), @pf_other_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_base_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9755, null, convert(varchar(255), @pf_base_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'pf_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9758, null, convert(varchar(255), @pf_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_pgi_annual' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9742, null, convert(varchar(255), @dc_pgi_annual), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_pgi_monthly' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9743, null, convert(varchar(255), @dc_pgi_monthly), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_gim' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9734, null, convert(varchar(255), @dc_gim), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_grm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9735, null, convert(varchar(255), @dc_grm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_indicated_value_gim' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9737, null, convert(varchar(255), @dc_indicated_value_gim), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_indicated_value_grm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9738, null, convert(varchar(255), @dc_indicated_value_grm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_personal_property_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9741, null, convert(varchar(255), @dc_personal_property_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_other_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9739, null, convert(varchar(255), @dc_other_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_base_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9733, null, convert(varchar(255), @dc_base_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'income_grm_gim' and
               chg_log_columns = 'dc_indicated_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1681, 9736, null, convert(varchar(255), @dc_indicated_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2344, convert(varchar(24), @income_id), @income_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2357, convert(varchar(24), @income_yr), case when @income_yr > @tvar_intMin and @income_yr < @tvar_intMax then convert(int, round(@income_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @income_id, @sup_num, @income_yr, @sch_pgi_annual, @sch_pgi_monthly, @sch_gim, @sch_grm, @sch_indicated_value_gim, @sch_indicated_value_grm, @sch_personal_property_value, @sch_other_value, @sch_base_indicated_value, @sch_indicated_value, @pf_pgi_annual, @pf_pgi_monthly, @pf_gim, @pf_grm, @pf_indicated_value_gim, @pf_indicated_value_grm, @pf_personal_property_value, @pf_other_value, @pf_base_indicated_value, @pf_indicated_value, @dc_pgi_annual, @dc_pgi_monthly, @dc_gim, @dc_grm, @dc_indicated_value_gim, @dc_indicated_value_grm, @dc_personal_property_value, @dc_other_value, @dc_base_indicated_value, @dc_indicated_value
end
 
close curRows
deallocate curRows

GO

