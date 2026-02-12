CREATE TABLE [dbo].[imprv_detail_cms_addition] (
    [prop_val_yr]                   NUMERIC (4)     NOT NULL,
    [sup_num]                       INT             NOT NULL,
    [sale_id]                       INT             NOT NULL,
    [prop_id]                       INT             NOT NULL,
    [imprv_id]                      INT             NOT NULL,
    [imprv_det_id]                  INT             NOT NULL,
    [section_id]                    INT             NOT NULL,
    [addition_id]                   INT             NOT NULL,
    [addition_system_code]          VARCHAR (5)     NOT NULL,
    [addition_system_description]   VARCHAR (50)    NOT NULL,
    [addition_description]          VARCHAR (50)    NOT NULL,
    [units]                         NUMERIC (8, 2)  NOT NULL,
    [unit_cost]                     NUMERIC (14, 2) NOT NULL,
    [depreciation_pct]              NUMERIC (5, 2)  NOT NULL,
    [effective_year_built]          NUMERIC (4)     NOT NULL,
    [effective_year_built_override] BIT             DEFAULT ((0)) NOT NULL,
    [typical_life]                  INT             NULL,
    [use_local_multiplier]          BIT             DEFAULT ((0)) NOT NULL,
    [apply_trend]                   BIT             DEFAULT ((0)) NOT NULL,
    [base_date]                     DATETIME        NULL,
    [total_cost_new]                NUMERIC (14)    NULL,
    [calc_unit_cost]                NUMERIC (14, 2) NULL,
    [depreciation_amount]           NUMERIC (14)    NULL,
    [depreciated_cost]              NUMERIC (14)    NULL,
    [depreciation_pct_override]     BIT             CONSTRAINT [CDF_imprv_detail_cms_addition_depreciation_pct_override] DEFAULT ((0)) NOT NULL,
    [apply_architects_fees]         BIT             CONSTRAINT [CDF_imprv_detail_cms_addition_apply_architects_fees] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_imprv_detail_cms_addition] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [sale_id] ASC, [prop_id] ASC, [imprv_id] ASC, [imprv_det_id] ASC, [section_id] ASC, [addition_id] ASC),
    CONSTRAINT [CFK_imprv_detail_cms_addition_section] FOREIGN KEY ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id], [imprv_det_id], [section_id]) REFERENCES [dbo].[imprv_detail_cms_section] ([prop_val_yr], [sup_num], [sale_id], [prop_id], [imprv_id], [imprv_det_id], [section_id])
);


GO

 
create trigger tr_imprv_detail_cms_addition_update_ChangeLog
on imprv_detail_cms_addition
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
 
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_sup_num int
declare @new_sup_num int
declare @old_sale_id int
declare @new_sale_id int
declare @old_prop_id int
declare @new_prop_id int
declare @old_imprv_id int
declare @new_imprv_id int
declare @old_imprv_det_id int
declare @new_imprv_det_id int
declare @old_section_id int
declare @new_section_id int
declare @old_addition_id int
declare @new_addition_id int
declare @old_addition_system_code varchar(5)
declare @new_addition_system_code varchar(5)
declare @old_addition_system_description varchar(50)
declare @new_addition_system_description varchar(50)
declare @old_addition_description varchar(50)
declare @new_addition_description varchar(50)
declare @old_units numeric(8,2)
declare @new_units numeric(8,2)
declare @old_unit_cost numeric(14,2)
declare @new_unit_cost numeric(14,2)
declare @old_depreciation_pct numeric(5,2)
declare @new_depreciation_pct numeric(5,2)
declare @old_effective_year_built numeric(4,0)
declare @new_effective_year_built numeric(4,0)
declare @old_effective_year_built_override bit
declare @new_effective_year_built_override bit
declare @old_typical_life int
declare @new_typical_life int
declare @old_use_local_multiplier bit
declare @new_use_local_multiplier bit
declare @old_apply_trend bit
declare @new_apply_trend bit
declare @old_base_date datetime
declare @new_base_date datetime
declare @old_total_cost_new numeric(14,0)
declare @new_total_cost_new numeric(14,0)
declare @old_calc_unit_cost numeric(14,2)
declare @new_calc_unit_cost numeric(14,2)
declare @old_depreciation_amount numeric(14,0)
declare @new_depreciation_amount numeric(14,0)
declare @old_depreciated_cost numeric(14,0)
declare @new_depreciated_cost numeric(14,0)
 
declare curRows cursor
for
     select d.prop_val_yr, d.sup_num, d.sale_id, d.prop_id, d.imprv_id, d.imprv_det_id, d.section_id, d.addition_id, d.addition_system_code, d.addition_system_description, d.addition_description, d.units, d.unit_cost, d.depreciation_pct, d.effective_year_built, d.effective_year_built_override, d.typical_life, d.use_local_multiplier, d.apply_trend, d.base_date, d.total_cost_new, d.calc_unit_cost, d.depreciation_amount, d.depreciated_cost, 
            i.prop_val_yr, i.sup_num, i.sale_id, i.prop_id, i.imprv_id, i.imprv_det_id, i.section_id, i.addition_id, i.addition_system_code, i.addition_system_description, i.addition_description, i.units, i.unit_cost, i.depreciation_pct, i.effective_year_built, i.effective_year_built_override, i.typical_life, i.use_local_multiplier, i.apply_trend, i.base_date, i.total_cost_new, i.calc_unit_cost, i.depreciation_amount, i.depreciated_cost
from deleted as d
join inserted as i on 
     d.prop_val_yr = i.prop_val_yr and
     d.sup_num = i.sup_num and
     d.sale_id = i.sale_id and
     d.prop_id = i.prop_id and
     d.imprv_id = i.imprv_id and
     d.imprv_det_id = i.imprv_det_id and
     d.section_id = i.section_id and
     d.addition_id = i.addition_id
for read only
 
open curRows
fetch next from curRows into @old_prop_val_yr, @old_sup_num, @old_sale_id, @old_prop_id, @old_imprv_id, @old_imprv_det_id, @old_section_id, @old_addition_id, @old_addition_system_code, @old_addition_system_description, @old_addition_description, @old_units, @old_unit_cost, @old_depreciation_pct, @old_effective_year_built, @old_effective_year_built_override, @old_typical_life, @old_use_local_multiplier, @old_apply_trend, @old_base_date, @old_total_cost_new, @old_calc_unit_cost, @old_depreciation_amount, @old_depreciated_cost, 
                             @new_prop_val_yr, @new_sup_num, @new_sale_id, @new_prop_id, @new_imprv_id, @new_imprv_det_id, @new_section_id, @new_addition_id, @new_addition_system_code, @new_addition_system_description, @new_addition_description, @new_units, @new_unit_cost, @new_depreciation_pct, @new_effective_year_built, @new_effective_year_built_override, @new_typical_life, @new_use_local_multiplier, @new_apply_trend, @new_base_date, @new_total_cost_new, @new_calc_unit_cost, @new_depreciation_amount, @new_depreciated_cost
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_prop_val_yr <> @new_prop_val_yr
          or
          ( @old_prop_val_yr is null and @new_prop_val_yr is not null ) 
          or
          ( @old_prop_val_yr is not null and @new_prop_val_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
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
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_sale_id <> @new_sale_id
          or
          ( @old_sale_id is null and @new_sale_id is not null ) 
          or
          ( @old_sale_id is not null and @new_sale_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'sale_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 4485, convert(varchar(255), @old_sale_id), convert(varchar(255), @new_sale_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_prop_id <> @new_prop_id
          or
          ( @old_prop_id is null and @new_prop_id is not null ) 
          or
          ( @old_prop_id is not null and @new_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_imprv_id <> @new_imprv_id
          or
          ( @old_imprv_id is null and @new_imprv_id is not null ) 
          or
          ( @old_imprv_id is not null and @new_imprv_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'imprv_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 2275, convert(varchar(255), @old_imprv_id), convert(varchar(255), @new_imprv_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_imprv_det_id <> @new_imprv_det_id
          or
          ( @old_imprv_det_id is null and @new_imprv_det_id is not null ) 
          or
          ( @old_imprv_det_id is not null and @new_imprv_det_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'imprv_det_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 2256, convert(varchar(255), @old_imprv_det_id), convert(varchar(255), @new_imprv_det_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_section_id <> @new_section_id
          or
          ( @old_section_id is null and @new_section_id is not null ) 
          or
          ( @old_section_id is not null and @new_section_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'section_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9678, convert(varchar(255), @old_section_id), convert(varchar(255), @new_section_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_addition_id <> @new_addition_id
          or
          ( @old_addition_id is null and @new_addition_id is not null ) 
          or
          ( @old_addition_id is not null and @new_addition_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'addition_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9699, convert(varchar(255), @old_addition_id), convert(varchar(255), @new_addition_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_addition_system_code <> @new_addition_system_code
          or
          ( @old_addition_system_code is null and @new_addition_system_code is not null ) 
          or
          ( @old_addition_system_code is not null and @new_addition_system_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'addition_system_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9701, convert(varchar(255), @old_addition_system_code), convert(varchar(255), @new_addition_system_code), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_addition_system_description <> @new_addition_system_description
          or
          ( @old_addition_system_description is null and @new_addition_system_description is not null ) 
          or
          ( @old_addition_system_description is not null and @new_addition_system_description is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'addition_system_description' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9695, convert(varchar(255), @old_addition_system_description), convert(varchar(255), @new_addition_system_description), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_addition_description <> @new_addition_description
          or
          ( @old_addition_description is null and @new_addition_description is not null ) 
          or
          ( @old_addition_description is not null and @new_addition_description is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'addition_description' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9700, convert(varchar(255), @old_addition_description), convert(varchar(255), @new_addition_description), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_units <> @new_units
          or
          ( @old_units is null and @new_units is not null ) 
          or
          ( @old_units is not null and @new_units is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'units' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9584, convert(varchar(255), @old_units), convert(varchar(255), @new_units), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_unit_cost <> @new_unit_cost
          or
          ( @old_unit_cost is null and @new_unit_cost is not null ) 
          or
          ( @old_unit_cost is not null and @new_unit_cost is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'unit_cost' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9697, convert(varchar(255), @old_unit_cost), convert(varchar(255), @new_unit_cost), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_depreciation_pct <> @new_depreciation_pct
          or
          ( @old_depreciation_pct is null and @new_depreciation_pct is not null ) 
          or
          ( @old_depreciation_pct is not null and @new_depreciation_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'depreciation_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9585, convert(varchar(255), @old_depreciation_pct), convert(varchar(255), @new_depreciation_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_effective_year_built <> @new_effective_year_built
          or
          ( @old_effective_year_built is null and @new_effective_year_built is not null ) 
          or
          ( @old_effective_year_built is not null and @new_effective_year_built is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'effective_year_built' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9662, convert(varchar(255), @old_effective_year_built), convert(varchar(255), @new_effective_year_built), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_effective_year_built_override <> @new_effective_year_built_override
          or
          ( @old_effective_year_built_override is null and @new_effective_year_built_override is not null ) 
          or
          ( @old_effective_year_built_override is not null and @new_effective_year_built_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'effective_year_built_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9672, convert(varchar(255), @old_effective_year_built_override), convert(varchar(255), @new_effective_year_built_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_typical_life <> @new_typical_life
          or
          ( @old_typical_life is null and @new_typical_life is not null ) 
          or
          ( @old_typical_life is not null and @new_typical_life is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'typical_life' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9694, convert(varchar(255), @old_typical_life), convert(varchar(255), @new_typical_life), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_use_local_multiplier <> @new_use_local_multiplier
          or
          ( @old_use_local_multiplier is null and @new_use_local_multiplier is not null ) 
          or
          ( @old_use_local_multiplier is not null and @new_use_local_multiplier is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'use_local_multiplier' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9698, convert(varchar(255), @old_use_local_multiplier), convert(varchar(255), @new_use_local_multiplier), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_apply_trend <> @new_apply_trend
          or
          ( @old_apply_trend is null and @new_apply_trend is not null ) 
          or
          ( @old_apply_trend is not null and @new_apply_trend is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'apply_trend' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9696, convert(varchar(255), @old_apply_trend), convert(varchar(255), @new_apply_trend), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_base_date <> @new_base_date
          or
          ( @old_base_date is null and @new_base_date is not null ) 
          or
          ( @old_base_date is not null and @new_base_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'base_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9563, convert(varchar(255), @old_base_date), convert(varchar(255), @new_base_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_total_cost_new <> @new_total_cost_new
          or
          ( @old_total_cost_new is null and @new_total_cost_new is not null ) 
          or
          ( @old_total_cost_new is not null and @new_total_cost_new is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'total_cost_new' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9659, convert(varchar(255), @old_total_cost_new), convert(varchar(255), @new_total_cost_new), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_calc_unit_cost <> @new_calc_unit_cost
          or
          ( @old_calc_unit_cost is null and @new_calc_unit_cost is not null ) 
          or
          ( @old_calc_unit_cost is not null and @new_calc_unit_cost is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'calc_unit_cost' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9693, convert(varchar(255), @old_calc_unit_cost), convert(varchar(255), @new_calc_unit_cost), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_depreciation_amount <> @new_depreciation_amount
          or
          ( @old_depreciation_amount is null and @new_depreciation_amount is not null ) 
          or
          ( @old_depreciation_amount is not null and @new_depreciation_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'depreciation_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9669, convert(varchar(255), @old_depreciation_amount), convert(varchar(255), @new_depreciation_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     if (
          @old_depreciated_cost <> @new_depreciated_cost
          or
          ( @old_depreciated_cost is null and @new_depreciated_cost is not null ) 
          or
          ( @old_depreciated_cost is not null and @new_depreciated_cost is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'imprv_detail_cms_addition' and
                    chg_log_columns = 'depreciated_cost' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1678, 9667, convert(varchar(255), @old_depreciated_cost), convert(varchar(255), @new_depreciated_cost), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @new_sale_id), @new_sale_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @new_imprv_id), @new_imprv_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @new_imprv_det_id), @new_imprv_det_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @new_section_id), @new_section_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @new_addition_id), @new_addition_id)
          end
     end
 
     fetch next from curRows into @old_prop_val_yr, @old_sup_num, @old_sale_id, @old_prop_id, @old_imprv_id, @old_imprv_det_id, @old_section_id, @old_addition_id, @old_addition_system_code, @old_addition_system_description, @old_addition_description, @old_units, @old_unit_cost, @old_depreciation_pct, @old_effective_year_built, @old_effective_year_built_override, @old_typical_life, @old_use_local_multiplier, @old_apply_trend, @old_base_date, @old_total_cost_new, @old_calc_unit_cost, @old_depreciation_amount, @old_depreciated_cost, 
                                  @new_prop_val_yr, @new_sup_num, @new_sale_id, @new_prop_id, @new_imprv_id, @new_imprv_det_id, @new_section_id, @new_addition_id, @new_addition_system_code, @new_addition_system_description, @new_addition_description, @new_units, @new_unit_cost, @new_depreciation_pct, @new_effective_year_built, @new_effective_year_built_override, @new_typical_life, @new_use_local_multiplier, @new_apply_trend, @new_base_date, @new_total_cost_new, @new_calc_unit_cost, @new_depreciation_amount, @new_depreciated_cost
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_imprv_detail_cms_addition_delete_ChangeLog
on imprv_detail_cms_addition
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
          chg_log_tables = 'imprv_detail_cms_addition' and
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
 
declare @prop_val_yr numeric(4,0)
declare @sup_num int
declare @sale_id int
declare @prop_id int
declare @imprv_id int
declare @imprv_det_id int
declare @section_id int
declare @addition_id int
 
declare curRows cursor
for
     select prop_val_yr, sup_num, sale_id, prop_id, imprv_id, imprv_det_id, section_id, addition_id from deleted
for read only
 
open curRows
fetch next from curRows into @prop_val_yr, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @section_id, @addition_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1678, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
 
     fetch next from curRows into @prop_val_yr, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @section_id, @addition_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_imprv_detail_cms_addition_insert_ChangeLog
on imprv_detail_cms_addition
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
 
declare @prop_val_yr numeric(4,0)
declare @sup_num int
declare @sale_id int
declare @prop_id int
declare @imprv_id int
declare @imprv_det_id int
declare @section_id int
declare @addition_id int
declare @addition_system_code varchar(5)
declare @addition_system_description varchar(50)
declare @addition_description varchar(50)
declare @units numeric(8,2)
declare @unit_cost numeric(14,2)
declare @depreciation_pct numeric(5,2)
declare @effective_year_built numeric(4,0)
declare @effective_year_built_override bit
declare @typical_life int
declare @use_local_multiplier bit
declare @apply_trend bit
declare @base_date datetime
declare @total_cost_new numeric(14,0)
declare @calc_unit_cost numeric(14,2)
declare @depreciation_amount numeric(14,0)
declare @depreciated_cost numeric(14,0)
 
declare curRows cursor
for
     select prop_val_yr, sup_num, sale_id, prop_id, imprv_id, imprv_det_id, section_id, addition_id, addition_system_code, addition_system_description, addition_description, units, unit_cost, depreciation_pct, effective_year_built, effective_year_built_override, typical_life, use_local_multiplier, apply_trend, base_date, total_cost_new, calc_unit_cost, depreciation_amount, depreciated_cost from inserted
for read only
 
open curRows
fetch next from curRows into @prop_val_yr, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @section_id, @addition_id, @addition_system_code, @addition_system_description, @addition_description, @units, @unit_cost, @depreciation_pct, @effective_year_built, @effective_year_built_override, @typical_life, @use_local_multiplier, @apply_trend, @base_date, @total_cost_new, @calc_unit_cost, @depreciation_amount, @depreciated_cost
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'sale_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 4485, null, convert(varchar(255), @sale_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'imprv_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 2275, null, convert(varchar(255), @imprv_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'imprv_det_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 2256, null, convert(varchar(255), @imprv_det_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'section_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9678, null, convert(varchar(255), @section_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'addition_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9699, null, convert(varchar(255), @addition_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'addition_system_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9701, null, convert(varchar(255), @addition_system_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'addition_system_description' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9695, null, convert(varchar(255), @addition_system_description), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'addition_description' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9700, null, convert(varchar(255), @addition_description), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'units' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9584, null, convert(varchar(255), @units), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'unit_cost' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9697, null, convert(varchar(255), @unit_cost), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'depreciation_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9585, null, convert(varchar(255), @depreciation_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'effective_year_built' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9662, null, convert(varchar(255), @effective_year_built), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'effective_year_built_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9672, null, convert(varchar(255), @effective_year_built_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'typical_life' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9694, null, convert(varchar(255), @typical_life), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'use_local_multiplier' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9698, null, convert(varchar(255), @use_local_multiplier), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'apply_trend' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9696, null, convert(varchar(255), @apply_trend), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'base_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9563, null, convert(varchar(255), @base_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'total_cost_new' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9659, null, convert(varchar(255), @total_cost_new), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'calc_unit_cost' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9693, null, convert(varchar(255), @calc_unit_cost), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'depreciation_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9669, null, convert(varchar(255), @depreciation_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'imprv_detail_cms_addition' and
               chg_log_columns = 'depreciated_cost' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1678, 9667, null, convert(varchar(255), @depreciated_cost), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4485, convert(varchar(24), @sale_id), @sale_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2275, convert(varchar(24), @imprv_id), @imprv_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 2256, convert(varchar(24), @imprv_det_id), @imprv_det_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9678, convert(varchar(24), @section_id), @section_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9699, convert(varchar(24), @addition_id), @addition_id)
     end
 
     fetch next from curRows into @prop_val_yr, @sup_num, @sale_id, @prop_id, @imprv_id, @imprv_det_id, @section_id, @addition_id, @addition_system_code, @addition_system_description, @addition_description, @units, @unit_cost, @depreciation_pct, @effective_year_built, @effective_year_built_override, @typical_life, @use_local_multiplier, @apply_trend, @base_date, @total_cost_new, @calc_unit_cost, @depreciation_amount, @depreciated_cost
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Inddicator for applying architects fees', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_detail_cms_addition', @level2type = N'COLUMN', @level2name = N'apply_architects_fees';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Depreciation Percent Override', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'imprv_detail_cms_addition', @level2type = N'COLUMN', @level2name = N'depreciation_pct_override';


GO

