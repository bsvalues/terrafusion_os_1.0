CREATE TABLE [dbo].[tax_rate] (
    [entity_id]                         INT              NOT NULL,
    [tax_rate_yr]                       NUMERIC (4)      NOT NULL,
    [discount_dt]                       DATETIME         NULL,
    [late_dt]                           DATETIME         NULL,
    [attorney_fee_dt]                   DATETIME         NULL,
    [bills_created_dt]                  DATETIME         NULL,
    [m_n_o_tax_pct]                     NUMERIC (13, 10) NULL,
    [i_n_s_tax_pct]                     NUMERIC (13, 10) NULL,
    [prot_i_n_s_tax_pct]                NUMERIC (13, 10) NULL,
    [sales_tax_pct]                     NUMERIC (13, 10) NULL,
    [levy_start_rct_num]                NUMERIC (18)     NULL,
    [supp_start_rct_num]                NUMERIC (18)     NULL,
    [stmnt_dt]                          DATETIME         NULL,
    [collect_for]                       CHAR (1)         NULL,
    [appraise_for]                      CHAR (1)         NULL,
    [ready_to_certify]                  CHAR (1)         NULL,
    [special_inv_entity]                CHAR (1)         NULL,
    [ready_to_create_bill]              CHAR (1)         NULL,
    [PLUS_1_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_1_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [PLUS_2_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_2_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [PLUS_3_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_3_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [PLUS_4_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_4_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [PLUS_5_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_5_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [PLUS_6_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_6_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [PLUS_7_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_7_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [PLUS_8_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_8_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [PLUS_9_INT_PCT]                    NUMERIC (13, 10) NULL,
    [PLUS_9_PENALTY_PCT]                NUMERIC (13, 10) NULL,
    [attorney_fee_pct]                  NUMERIC (4, 2)   NULL,
    [effective_due_dt]                  DATETIME         NULL,
    [collect_option]                    CHAR (5)         NULL,
    [weed_control]                      CHAR (1)         NULL,
    [weed_control_pct]                  NUMERIC (4, 2)   NULL,
    [ptd_option]                        CHAR (1)         NULL,
    [apply_bpp_attorney_fees]           BIT              CONSTRAINT [CDF_tax_rate_apply_bpp_attorney_fees] DEFAULT (0) NOT NULL,
    [bpp_attorney_fee_dt]               DATETIME         NULL,
    [enable_freeze_ceiling_calculation] BIT              CONSTRAINT [CDF_tax_rate_enable_freeze_ceiling_calculation] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_tax_rate] PRIMARY KEY CLUSTERED ([entity_id] ASC, [tax_rate_yr] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_tax_rate_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_tax_rate_yr]
    ON [dbo].[tax_rate]([tax_rate_yr] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_tax_rate_delete_insert_update_MemTable
on tax_rate
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
where szTableName = 'tax_rate'

GO



create trigger tr_tax_rate_delete_ChangeLog
on tax_rate
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
          chg_log_tables = 'tax_rate' and
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
 
declare @entity_id int
declare @tax_rate_yr numeric(4,0)
 
declare curRows cursor
for
     select entity_id, case tax_rate_yr when 0 then @tvar_lFutureYear else tax_rate_yr end from deleted
for read only
 
open curRows
fetch next from curRows into @entity_id, @tax_rate_yr
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = e.entity_cd + '-' + convert(varchar(4), @tax_rate_yr)
     from entity as e with(nolock)
     where entity_id = @entity_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 793, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @entity_id, @tax_rate_yr
end
 
close curRows
deallocate curRows

GO



create trigger tr_tax_rate_update_ChangeLog
on tax_rate
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
 
declare @old_entity_id int
declare @new_entity_id int
declare @old_tax_rate_yr numeric(4,0)
declare @new_tax_rate_yr numeric(4,0)
declare @old_discount_dt datetime
declare @new_discount_dt datetime
declare @old_late_dt datetime
declare @new_late_dt datetime
declare @old_attorney_fee_dt datetime
declare @new_attorney_fee_dt datetime
declare @old_bills_created_dt datetime
declare @new_bills_created_dt datetime
declare @old_m_n_o_tax_pct numeric(13,10)
declare @new_m_n_o_tax_pct numeric(13,10)
declare @old_i_n_s_tax_pct numeric(13,10)
declare @new_i_n_s_tax_pct numeric(13,10)
declare @old_prot_i_n_s_tax_pct numeric(13,10)
declare @new_prot_i_n_s_tax_pct numeric(13,10)
declare @old_sales_tax_pct numeric(13,10)
declare @new_sales_tax_pct numeric(13,10)
declare @old_levy_start_rct_num numeric(18,0)
declare @new_levy_start_rct_num numeric(18,0)
declare @old_supp_start_rct_num numeric(18,0)
declare @new_supp_start_rct_num numeric(18,0)
declare @old_stmnt_dt datetime
declare @new_stmnt_dt datetime
declare @old_collect_for char(1)
declare @new_collect_for char(1)
declare @old_appraise_for char(1)
declare @new_appraise_for char(1)
declare @old_ready_to_certify char(1)
declare @new_ready_to_certify char(1)
declare @old_special_inv_entity char(1)
declare @new_special_inv_entity char(1)
declare @old_ready_to_create_bill char(1)
declare @new_ready_to_create_bill char(1)
declare @old_PLUS_1_INT_PCT numeric(13,10)
declare @new_PLUS_1_INT_PCT numeric(13,10)
declare @old_PLUS_1_PENALTY_PCT numeric(13,10)
declare @new_PLUS_1_PENALTY_PCT numeric(13,10)
declare @old_PLUS_2_INT_PCT numeric(13,10)
declare @new_PLUS_2_INT_PCT numeric(13,10)
declare @old_PLUS_2_PENALTY_PCT numeric(13,10)
declare @new_PLUS_2_PENALTY_PCT numeric(13,10)
declare @old_PLUS_3_INT_PCT numeric(13,10)
declare @new_PLUS_3_INT_PCT numeric(13,10)
declare @old_PLUS_3_PENALTY_PCT numeric(13,10)
declare @new_PLUS_3_PENALTY_PCT numeric(13,10)
declare @old_PLUS_4_INT_PCT numeric(13,10)
declare @new_PLUS_4_INT_PCT numeric(13,10)
declare @old_PLUS_4_PENALTY_PCT numeric(13,10)
declare @new_PLUS_4_PENALTY_PCT numeric(13,10)
declare @old_PLUS_5_INT_PCT numeric(13,10)
declare @new_PLUS_5_INT_PCT numeric(13,10)
declare @old_PLUS_5_PENALTY_PCT numeric(13,10)
declare @new_PLUS_5_PENALTY_PCT numeric(13,10)
declare @old_PLUS_6_INT_PCT numeric(13,10)
declare @new_PLUS_6_INT_PCT numeric(13,10)
declare @old_PLUS_6_PENALTY_PCT numeric(13,10)
declare @new_PLUS_6_PENALTY_PCT numeric(13,10)
declare @old_PLUS_7_INT_PCT numeric(13,10)
declare @new_PLUS_7_INT_PCT numeric(13,10)
declare @old_PLUS_7_PENALTY_PCT numeric(13,10)
declare @new_PLUS_7_PENALTY_PCT numeric(13,10)
declare @old_PLUS_8_INT_PCT numeric(13,10)
declare @new_PLUS_8_INT_PCT numeric(13,10)
declare @old_PLUS_8_PENALTY_PCT numeric(13,10)
declare @new_PLUS_8_PENALTY_PCT numeric(13,10)
declare @old_PLUS_9_INT_PCT numeric(13,10)
declare @new_PLUS_9_INT_PCT numeric(13,10)
declare @old_PLUS_9_PENALTY_PCT numeric(13,10)
declare @new_PLUS_9_PENALTY_PCT numeric(13,10)
declare @old_attorney_fee_pct numeric(4,2)
declare @new_attorney_fee_pct numeric(4,2)
declare @old_effective_due_dt datetime
declare @new_effective_due_dt datetime
declare @old_collect_option char(5)
declare @new_collect_option char(5)
declare @old_weed_control char(1)
declare @new_weed_control char(1)
declare @old_weed_control_pct numeric(4,2)
declare @new_weed_control_pct numeric(4,2)
declare @old_ptd_option char(1)
declare @new_ptd_option char(1)
 
declare curRows cursor
for
     select d.entity_id, case d.tax_rate_yr when 0 then @tvar_lFutureYear else d.tax_rate_yr end, d.discount_dt, d.late_dt, d.attorney_fee_dt, d.bills_created_dt, d.m_n_o_tax_pct, d.i_n_s_tax_pct, d.prot_i_n_s_tax_pct, d.sales_tax_pct, d.levy_start_rct_num, d.supp_start_rct_num, d.stmnt_dt, d.collect_for, d.appraise_for, d.ready_to_certify, d.special_inv_entity, d.ready_to_create_bill, d.PLUS_1_INT_PCT, d.PLUS_1_PENALTY_PCT, d.PLUS_2_INT_PCT, d.PLUS_2_PENALTY_PCT, d.PLUS_3_INT_PCT, d.PLUS_3_PENALTY_PCT, d.PLUS_4_INT_PCT, d.PLUS_4_PENALTY_PCT, d.PLUS_5_INT_PCT, d.PLUS_5_PENALTY_PCT, d.PLUS_6_INT_PCT, d.PLUS_6_PENALTY_PCT, d.PLUS_7_INT_PCT, d.PLUS_7_PENALTY_PCT, d.PLUS_8_INT_PCT, d.PLUS_8_PENALTY_PCT, d.PLUS_9_INT_PCT, d.PLUS_9_PENALTY_PCT, d.attorney_fee_pct, d.effective_due_dt, d.collect_option, d.weed_control, d.weed_control_pct, d.ptd_option, i.entity_id, case i.tax_rate_yr when 0 then @tvar_lFutureYear else i.tax_rate_yr end, i.discount_dt, i.late_dt, i.attorney_fee_dt, i.bills_created_dt, i.m_n_o_tax_pct, i.i_n_s_tax_pct, i.prot_i_n_s_tax_pct, i.sales_tax_pct, i.levy_start_rct_num, i.supp_start_rct_num, i.stmnt_dt, i.collect_for, i.appraise_for, i.ready_to_certify, i.special_inv_entity, i.ready_to_create_bill, i.PLUS_1_INT_PCT, i.PLUS_1_PENALTY_PCT, i.PLUS_2_INT_PCT, i.PLUS_2_PENALTY_PCT, i.PLUS_3_INT_PCT, i.PLUS_3_PENALTY_PCT, i.PLUS_4_INT_PCT, i.PLUS_4_PENALTY_PCT, i.PLUS_5_INT_PCT, i.PLUS_5_PENALTY_PCT, i.PLUS_6_INT_PCT, i.PLUS_6_PENALTY_PCT, i.PLUS_7_INT_PCT, i.PLUS_7_PENALTY_PCT, i.PLUS_8_INT_PCT, i.PLUS_8_PENALTY_PCT, i.PLUS_9_INT_PCT, i.PLUS_9_PENALTY_PCT, i.attorney_fee_pct, i.effective_due_dt, i.collect_option, i.weed_control, i.weed_control_pct, i.ptd_option
from deleted as d
join inserted as i on 
     d.entity_id = i.entity_id and
     d.tax_rate_yr = i.tax_rate_yr
for read only
 
open curRows
fetch next from curRows into @old_entity_id, @old_tax_rate_yr, @old_discount_dt, @old_late_dt, @old_attorney_fee_dt, @old_bills_created_dt, @old_m_n_o_tax_pct, @old_i_n_s_tax_pct, @old_prot_i_n_s_tax_pct, @old_sales_tax_pct, @old_levy_start_rct_num, @old_supp_start_rct_num, @old_stmnt_dt, @old_collect_for, @old_appraise_for, @old_ready_to_certify, @old_special_inv_entity, @old_ready_to_create_bill, @old_PLUS_1_INT_PCT, @old_PLUS_1_PENALTY_PCT, @old_PLUS_2_INT_PCT, @old_PLUS_2_PENALTY_PCT, @old_PLUS_3_INT_PCT, @old_PLUS_3_PENALTY_PCT, @old_PLUS_4_INT_PCT, @old_PLUS_4_PENALTY_PCT, @old_PLUS_5_INT_PCT, @old_PLUS_5_PENALTY_PCT, @old_PLUS_6_INT_PCT, @old_PLUS_6_PENALTY_PCT, @old_PLUS_7_INT_PCT, @old_PLUS_7_PENALTY_PCT, @old_PLUS_8_INT_PCT, @old_PLUS_8_PENALTY_PCT, @old_PLUS_9_INT_PCT, @old_PLUS_9_PENALTY_PCT, @old_attorney_fee_pct, @old_effective_due_dt, @old_collect_option, @old_weed_control, @old_weed_control_pct, @old_ptd_option, @new_entity_id, @new_tax_rate_yr, @new_discount_dt, @new_late_dt, @new_attorney_fee_dt, @new_bills_created_dt, @new_m_n_o_tax_pct, @new_i_n_s_tax_pct, @new_prot_i_n_s_tax_pct, @new_sales_tax_pct, @new_levy_start_rct_num, @new_supp_start_rct_num, @new_stmnt_dt, @new_collect_for, @new_appraise_for, @new_ready_to_certify, @new_special_inv_entity, @new_ready_to_create_bill, @new_PLUS_1_INT_PCT, @new_PLUS_1_PENALTY_PCT, @new_PLUS_2_INT_PCT, @new_PLUS_2_PENALTY_PCT, @new_PLUS_3_INT_PCT, @new_PLUS_3_PENALTY_PCT, @new_PLUS_4_INT_PCT, @new_PLUS_4_PENALTY_PCT, @new_PLUS_5_INT_PCT, @new_PLUS_5_PENALTY_PCT, @new_PLUS_6_INT_PCT, @new_PLUS_6_PENALTY_PCT, @new_PLUS_7_INT_PCT, @new_PLUS_7_PENALTY_PCT, @new_PLUS_8_INT_PCT, @new_PLUS_8_PENALTY_PCT, @new_PLUS_9_INT_PCT, @new_PLUS_9_PENALTY_PCT, @new_attorney_fee_pct, @new_effective_due_dt, @new_collect_option, @new_weed_control, @new_weed_control_pct, @new_ptd_option
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = e.entity_cd + '-' + convert(varchar(4), @new_tax_rate_yr)
     from entity as e with(nolock)
     where entity_id = @new_entity_id
 
     if (
          @old_entity_id <> @new_entity_id
          or
          ( @old_entity_id is null and @new_entity_id is not null ) 
          or
          ( @old_entity_id is not null and @new_entity_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'entity_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 1757, convert(varchar(255), @old_entity_id), convert(varchar(255), @new_entity_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_tax_rate_yr <> @new_tax_rate_yr
          or
          ( @old_tax_rate_yr is null and @new_tax_rate_yr is not null ) 
          or
          ( @old_tax_rate_yr is not null and @new_tax_rate_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'tax_rate_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 5129, convert(varchar(255), @old_tax_rate_yr), convert(varchar(255), @new_tax_rate_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_discount_dt <> @new_discount_dt
          or
          ( @old_discount_dt is null and @new_discount_dt is not null ) 
          or
          ( @old_discount_dt is not null and @new_discount_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'discount_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 1343, convert(varchar(255), @old_discount_dt), convert(varchar(255), @new_discount_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_late_dt <> @new_late_dt
          or
          ( @old_late_dt is null and @new_late_dt is not null ) 
          or
          ( @old_late_dt is not null and @new_late_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'late_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 2727, convert(varchar(255), @old_late_dt), convert(varchar(255), @new_late_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_attorney_fee_dt <> @new_attorney_fee_dt
          or
          ( @old_attorney_fee_dt is null and @new_attorney_fee_dt is not null ) 
          or
          ( @old_attorney_fee_dt is not null and @new_attorney_fee_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'attorney_fee_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 364, convert(varchar(255), @old_attorney_fee_dt), convert(varchar(255), @new_attorney_fee_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_bills_created_dt <> @new_bills_created_dt
          or
          ( @old_bills_created_dt is null and @new_bills_created_dt is not null ) 
          or
          ( @old_bills_created_dt is not null and @new_bills_created_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'bills_created_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 517, convert(varchar(255), @old_bills_created_dt), convert(varchar(255), @new_bills_created_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_m_n_o_tax_pct <> @new_m_n_o_tax_pct
          or
          ( @old_m_n_o_tax_pct is null and @new_m_n_o_tax_pct is not null ) 
          or
          ( @old_m_n_o_tax_pct is not null and @new_m_n_o_tax_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'm_n_o_tax_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 2979, convert(varchar(255), @old_m_n_o_tax_pct), convert(varchar(255), @new_m_n_o_tax_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_i_n_s_tax_pct <> @new_i_n_s_tax_pct
          or
          ( @old_i_n_s_tax_pct is null and @new_i_n_s_tax_pct is not null ) 
          or
          ( @old_i_n_s_tax_pct is not null and @new_i_n_s_tax_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'i_n_s_tax_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 2115, convert(varchar(255), @old_i_n_s_tax_pct), convert(varchar(255), @new_i_n_s_tax_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_prot_i_n_s_tax_pct <> @new_prot_i_n_s_tax_pct
          or
          ( @old_prot_i_n_s_tax_pct is null and @new_prot_i_n_s_tax_pct is not null ) 
          or
          ( @old_prot_i_n_s_tax_pct is not null and @new_prot_i_n_s_tax_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'prot_i_n_s_tax_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 4127, convert(varchar(255), @old_prot_i_n_s_tax_pct), convert(varchar(255), @new_prot_i_n_s_tax_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_sales_tax_pct <> @new_sales_tax_pct
          or
          ( @old_sales_tax_pct is null and @new_sales_tax_pct is not null ) 
          or
          ( @old_sales_tax_pct is not null and @new_sales_tax_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'sales_tax_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 4611, convert(varchar(255), @old_sales_tax_pct), convert(varchar(255), @new_sales_tax_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_levy_start_rct_num <> @new_levy_start_rct_num
          or
          ( @old_levy_start_rct_num is null and @new_levy_start_rct_num is not null ) 
          or
          ( @old_levy_start_rct_num is not null and @new_levy_start_rct_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'levy_start_rct_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 2825, convert(varchar(255), @old_levy_start_rct_num), convert(varchar(255), @new_levy_start_rct_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_supp_start_rct_num <> @new_supp_start_rct_num
          or
          ( @old_supp_start_rct_num is null and @new_supp_start_rct_num is not null ) 
          or
          ( @old_supp_start_rct_num is not null and @new_supp_start_rct_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'supp_start_rct_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 5010, convert(varchar(255), @old_supp_start_rct_num), convert(varchar(255), @new_supp_start_rct_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_stmnt_dt <> @new_stmnt_dt
          or
          ( @old_stmnt_dt is null and @new_stmnt_dt is not null ) 
          or
          ( @old_stmnt_dt is not null and @new_stmnt_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'stmnt_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 4955, convert(varchar(255), @old_stmnt_dt), convert(varchar(255), @new_stmnt_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_collect_for <> @new_collect_for
          or
          ( @old_collect_for is null and @new_collect_for is not null ) 
          or
          ( @old_collect_for is not null and @new_collect_for is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'collect_for' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 805, convert(varchar(255), @old_collect_for), convert(varchar(255), @new_collect_for) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_appraise_for <> @new_appraise_for
          or
          ( @old_appraise_for is null and @new_appraise_for is not null ) 
          or
          ( @old_appraise_for is not null and @new_appraise_for is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'appraise_for' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 243, convert(varchar(255), @old_appraise_for), convert(varchar(255), @new_appraise_for) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ready_to_certify <> @new_ready_to_certify
          or
          ( @old_ready_to_certify is null and @new_ready_to_certify is not null ) 
          or
          ( @old_ready_to_certify is not null and @new_ready_to_certify is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'ready_to_certify' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 4299, convert(varchar(255), @old_ready_to_certify), convert(varchar(255), @new_ready_to_certify) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_special_inv_entity <> @new_special_inv_entity
          or
          ( @old_special_inv_entity is null and @new_special_inv_entity is not null ) 
          or
          ( @old_special_inv_entity is not null and @new_special_inv_entity is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'special_inv_entity' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 4906, convert(varchar(255), @old_special_inv_entity), convert(varchar(255), @new_special_inv_entity) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ready_to_create_bill <> @new_ready_to_create_bill
          or
          ( @old_ready_to_create_bill is null and @new_ready_to_create_bill is not null ) 
          or
          ( @old_ready_to_create_bill is not null and @new_ready_to_create_bill is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'ready_to_create_bill' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 4300, convert(varchar(255), @old_ready_to_create_bill), convert(varchar(255), @new_ready_to_create_bill) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_1_INT_PCT <> @new_PLUS_1_INT_PCT
          or
          ( @old_PLUS_1_INT_PCT is null and @new_PLUS_1_INT_PCT is not null ) 
          or
          ( @old_PLUS_1_INT_PCT is not null and @new_PLUS_1_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_1_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3747, convert(varchar(255), @old_PLUS_1_INT_PCT), convert(varchar(255), @new_PLUS_1_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_1_PENALTY_PCT <> @new_PLUS_1_PENALTY_PCT
          or
          ( @old_PLUS_1_PENALTY_PCT is null and @new_PLUS_1_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_1_PENALTY_PCT is not null and @new_PLUS_1_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_1_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3748, convert(varchar(255), @old_PLUS_1_PENALTY_PCT), convert(varchar(255), @new_PLUS_1_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_2_INT_PCT <> @new_PLUS_2_INT_PCT
          or
          ( @old_PLUS_2_INT_PCT is null and @new_PLUS_2_INT_PCT is not null ) 
          or
          ( @old_PLUS_2_INT_PCT is not null and @new_PLUS_2_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_2_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3749, convert(varchar(255), @old_PLUS_2_INT_PCT), convert(varchar(255), @new_PLUS_2_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_2_PENALTY_PCT <> @new_PLUS_2_PENALTY_PCT
          or
          ( @old_PLUS_2_PENALTY_PCT is null and @new_PLUS_2_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_2_PENALTY_PCT is not null and @new_PLUS_2_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_2_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3750, convert(varchar(255), @old_PLUS_2_PENALTY_PCT), convert(varchar(255), @new_PLUS_2_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_3_INT_PCT <> @new_PLUS_3_INT_PCT
          or
          ( @old_PLUS_3_INT_PCT is null and @new_PLUS_3_INT_PCT is not null ) 
          or
          ( @old_PLUS_3_INT_PCT is not null and @new_PLUS_3_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_3_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3751, convert(varchar(255), @old_PLUS_3_INT_PCT), convert(varchar(255), @new_PLUS_3_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_3_PENALTY_PCT <> @new_PLUS_3_PENALTY_PCT
          or
          ( @old_PLUS_3_PENALTY_PCT is null and @new_PLUS_3_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_3_PENALTY_PCT is not null and @new_PLUS_3_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_3_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3752, convert(varchar(255), @old_PLUS_3_PENALTY_PCT), convert(varchar(255), @new_PLUS_3_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_4_INT_PCT <> @new_PLUS_4_INT_PCT
          or
          ( @old_PLUS_4_INT_PCT is null and @new_PLUS_4_INT_PCT is not null ) 
          or
          ( @old_PLUS_4_INT_PCT is not null and @new_PLUS_4_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_4_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3753, convert(varchar(255), @old_PLUS_4_INT_PCT), convert(varchar(255), @new_PLUS_4_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_4_PENALTY_PCT <> @new_PLUS_4_PENALTY_PCT
          or
          ( @old_PLUS_4_PENALTY_PCT is null and @new_PLUS_4_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_4_PENALTY_PCT is not null and @new_PLUS_4_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_4_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3754, convert(varchar(255), @old_PLUS_4_PENALTY_PCT), convert(varchar(255), @new_PLUS_4_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_5_INT_PCT <> @new_PLUS_5_INT_PCT
          or
          ( @old_PLUS_5_INT_PCT is null and @new_PLUS_5_INT_PCT is not null ) 
          or
          ( @old_PLUS_5_INT_PCT is not null and @new_PLUS_5_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_5_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3755, convert(varchar(255), @old_PLUS_5_INT_PCT), convert(varchar(255), @new_PLUS_5_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_5_PENALTY_PCT <> @new_PLUS_5_PENALTY_PCT
          or
          ( @old_PLUS_5_PENALTY_PCT is null and @new_PLUS_5_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_5_PENALTY_PCT is not null and @new_PLUS_5_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_5_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3756, convert(varchar(255), @old_PLUS_5_PENALTY_PCT), convert(varchar(255), @new_PLUS_5_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_6_INT_PCT <> @new_PLUS_6_INT_PCT
          or
          ( @old_PLUS_6_INT_PCT is null and @new_PLUS_6_INT_PCT is not null ) 
          or
          ( @old_PLUS_6_INT_PCT is not null and @new_PLUS_6_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_6_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3757, convert(varchar(255), @old_PLUS_6_INT_PCT), convert(varchar(255), @new_PLUS_6_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_6_PENALTY_PCT <> @new_PLUS_6_PENALTY_PCT
          or
          ( @old_PLUS_6_PENALTY_PCT is null and @new_PLUS_6_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_6_PENALTY_PCT is not null and @new_PLUS_6_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_6_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3758, convert(varchar(255), @old_PLUS_6_PENALTY_PCT), convert(varchar(255), @new_PLUS_6_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_7_INT_PCT <> @new_PLUS_7_INT_PCT
          or
          ( @old_PLUS_7_INT_PCT is null and @new_PLUS_7_INT_PCT is not null ) 
          or
          ( @old_PLUS_7_INT_PCT is not null and @new_PLUS_7_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_7_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3759, convert(varchar(255), @old_PLUS_7_INT_PCT), convert(varchar(255), @new_PLUS_7_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_7_PENALTY_PCT <> @new_PLUS_7_PENALTY_PCT
          or
          ( @old_PLUS_7_PENALTY_PCT is null and @new_PLUS_7_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_7_PENALTY_PCT is not null and @new_PLUS_7_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_7_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3760, convert(varchar(255), @old_PLUS_7_PENALTY_PCT), convert(varchar(255), @new_PLUS_7_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_8_INT_PCT <> @new_PLUS_8_INT_PCT
          or
          ( @old_PLUS_8_INT_PCT is null and @new_PLUS_8_INT_PCT is not null ) 
          or
          ( @old_PLUS_8_INT_PCT is not null and @new_PLUS_8_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_8_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3761, convert(varchar(255), @old_PLUS_8_INT_PCT), convert(varchar(255), @new_PLUS_8_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_8_PENALTY_PCT <> @new_PLUS_8_PENALTY_PCT
          or
          ( @old_PLUS_8_PENALTY_PCT is null and @new_PLUS_8_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_8_PENALTY_PCT is not null and @new_PLUS_8_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_8_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3762, convert(varchar(255), @old_PLUS_8_PENALTY_PCT), convert(varchar(255), @new_PLUS_8_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_9_INT_PCT <> @new_PLUS_9_INT_PCT
          or
          ( @old_PLUS_9_INT_PCT is null and @new_PLUS_9_INT_PCT is not null ) 
          or
          ( @old_PLUS_9_INT_PCT is not null and @new_PLUS_9_INT_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_9_INT_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3763, convert(varchar(255), @old_PLUS_9_INT_PCT), convert(varchar(255), @new_PLUS_9_INT_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_PLUS_9_PENALTY_PCT <> @new_PLUS_9_PENALTY_PCT
          or
          ( @old_PLUS_9_PENALTY_PCT is null and @new_PLUS_9_PENALTY_PCT is not null ) 
          or
          ( @old_PLUS_9_PENALTY_PCT is not null and @new_PLUS_9_PENALTY_PCT is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'PLUS_9_PENALTY_PCT' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 3764, convert(varchar(255), @old_PLUS_9_PENALTY_PCT), convert(varchar(255), @new_PLUS_9_PENALTY_PCT) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_attorney_fee_pct <> @new_attorney_fee_pct
          or
          ( @old_attorney_fee_pct is null and @new_attorney_fee_pct is not null ) 
          or
          ( @old_attorney_fee_pct is not null and @new_attorney_fee_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'attorney_fee_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 365, convert(varchar(255), @old_attorney_fee_pct), convert(varchar(255), @new_attorney_fee_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_effective_due_dt <> @new_effective_due_dt
          or
          ( @old_effective_due_dt is null and @new_effective_due_dt is not null ) 
          or
          ( @old_effective_due_dt is not null and @new_effective_due_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'effective_due_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 1428, convert(varchar(255), @old_effective_due_dt), convert(varchar(255), @new_effective_due_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_collect_option <> @new_collect_option
          or
          ( @old_collect_option is null and @new_collect_option is not null ) 
          or
          ( @old_collect_option is not null and @new_collect_option is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'collect_option' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 806, convert(varchar(255), @old_collect_option), convert(varchar(255), @new_collect_option) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_weed_control <> @new_weed_control
          or
          ( @old_weed_control is null and @new_weed_control is not null ) 
          or
          ( @old_weed_control is not null and @new_weed_control is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'weed_control' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 5529, convert(varchar(255), @old_weed_control), convert(varchar(255), @new_weed_control) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_weed_control_pct <> @new_weed_control_pct
          or
          ( @old_weed_control_pct is null and @new_weed_control_pct is not null ) 
          or
          ( @old_weed_control_pct is not null and @new_weed_control_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'weed_control_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 5530, convert(varchar(255), @old_weed_control_pct), convert(varchar(255), @new_weed_control_pct) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ptd_option <> @new_ptd_option
          or
          ( @old_ptd_option is null and @new_ptd_option is not null ) 
          or
          ( @old_ptd_option is not null and @new_ptd_option is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'tax_rate' and
                    chg_log_columns = 'ptd_option' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 793, 4178, convert(varchar(255), @old_ptd_option), convert(varchar(255), @new_ptd_option) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @new_tax_rate_yr), case when @new_tax_rate_yr > @tvar_intMin and @new_tax_rate_yr < @tvar_intMax then convert(int, round(@new_tax_rate_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_entity_id, @old_tax_rate_yr, @old_discount_dt, @old_late_dt, @old_attorney_fee_dt, @old_bills_created_dt, @old_m_n_o_tax_pct, @old_i_n_s_tax_pct, @old_prot_i_n_s_tax_pct, @old_sales_tax_pct, @old_levy_start_rct_num, @old_supp_start_rct_num, @old_stmnt_dt, @old_collect_for, @old_appraise_for, @old_ready_to_certify, @old_special_inv_entity, @old_ready_to_create_bill, @old_PLUS_1_INT_PCT, @old_PLUS_1_PENALTY_PCT, @old_PLUS_2_INT_PCT, @old_PLUS_2_PENALTY_PCT, @old_PLUS_3_INT_PCT, @old_PLUS_3_PENALTY_PCT, @old_PLUS_4_INT_PCT, @old_PLUS_4_PENALTY_PCT, @old_PLUS_5_INT_PCT, @old_PLUS_5_PENALTY_PCT, @old_PLUS_6_INT_PCT, @old_PLUS_6_PENALTY_PCT, @old_PLUS_7_INT_PCT, @old_PLUS_7_PENALTY_PCT, @old_PLUS_8_INT_PCT, @old_PLUS_8_PENALTY_PCT, @old_PLUS_9_INT_PCT, @old_PLUS_9_PENALTY_PCT, @old_attorney_fee_pct, @old_effective_due_dt, @old_collect_option, @old_weed_control, @old_weed_control_pct, @old_ptd_option, @new_entity_id, @new_tax_rate_yr, @new_discount_dt, @new_late_dt, @new_attorney_fee_dt, @new_bills_created_dt, @new_m_n_o_tax_pct, @new_i_n_s_tax_pct, @new_prot_i_n_s_tax_pct, @new_sales_tax_pct, @new_levy_start_rct_num, @new_supp_start_rct_num, @new_stmnt_dt, @new_collect_for, @new_appraise_for, @new_ready_to_certify, @new_special_inv_entity, @new_ready_to_create_bill, @new_PLUS_1_INT_PCT, @new_PLUS_1_PENALTY_PCT, @new_PLUS_2_INT_PCT, @new_PLUS_2_PENALTY_PCT, @new_PLUS_3_INT_PCT, @new_PLUS_3_PENALTY_PCT, @new_PLUS_4_INT_PCT, @new_PLUS_4_PENALTY_PCT, @new_PLUS_5_INT_PCT, @new_PLUS_5_PENALTY_PCT, @new_PLUS_6_INT_PCT, @new_PLUS_6_PENALTY_PCT, @new_PLUS_7_INT_PCT, @new_PLUS_7_PENALTY_PCT, @new_PLUS_8_INT_PCT, @new_PLUS_8_PENALTY_PCT, @new_PLUS_9_INT_PCT, @new_PLUS_9_PENALTY_PCT, @new_attorney_fee_pct, @new_effective_due_dt, @new_collect_option, @new_weed_control, @new_weed_control_pct, @new_ptd_option
end
 
close curRows
deallocate curRows

GO



create trigger tr_tax_rate_insert_ChangeLog
on tax_rate
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
 
declare @entity_id int
declare @tax_rate_yr numeric(4,0)
declare @discount_dt datetime
declare @late_dt datetime
declare @attorney_fee_dt datetime
declare @bills_created_dt datetime
declare @m_n_o_tax_pct numeric(13,10)
declare @i_n_s_tax_pct numeric(13,10)
declare @prot_i_n_s_tax_pct numeric(13,10)
declare @sales_tax_pct numeric(13,10)
declare @levy_start_rct_num numeric(18,0)
declare @supp_start_rct_num numeric(18,0)
declare @stmnt_dt datetime
declare @collect_for char(1)
declare @appraise_for char(1)
declare @ready_to_certify char(1)
declare @special_inv_entity char(1)
declare @ready_to_create_bill char(1)
declare @PLUS_1_INT_PCT numeric(13,10)
declare @PLUS_1_PENALTY_PCT numeric(13,10)
declare @PLUS_2_INT_PCT numeric(13,10)
declare @PLUS_2_PENALTY_PCT numeric(13,10)
declare @PLUS_3_INT_PCT numeric(13,10)
declare @PLUS_3_PENALTY_PCT numeric(13,10)
declare @PLUS_4_INT_PCT numeric(13,10)
declare @PLUS_4_PENALTY_PCT numeric(13,10)
declare @PLUS_5_INT_PCT numeric(13,10)
declare @PLUS_5_PENALTY_PCT numeric(13,10)
declare @PLUS_6_INT_PCT numeric(13,10)
declare @PLUS_6_PENALTY_PCT numeric(13,10)
declare @PLUS_7_INT_PCT numeric(13,10)
declare @PLUS_7_PENALTY_PCT numeric(13,10)
declare @PLUS_8_INT_PCT numeric(13,10)
declare @PLUS_8_PENALTY_PCT numeric(13,10)
declare @PLUS_9_INT_PCT numeric(13,10)
declare @PLUS_9_PENALTY_PCT numeric(13,10)
declare @attorney_fee_pct numeric(4,2)
declare @effective_due_dt datetime
declare @collect_option char(5)
declare @weed_control char(1)
declare @weed_control_pct numeric(4,2)
declare @ptd_option char(1)
 
declare curRows cursor
for
     select entity_id, case tax_rate_yr when 0 then @tvar_lFutureYear else tax_rate_yr end, discount_dt, late_dt, attorney_fee_dt, bills_created_dt, m_n_o_tax_pct, i_n_s_tax_pct, prot_i_n_s_tax_pct, sales_tax_pct, levy_start_rct_num, supp_start_rct_num, stmnt_dt, collect_for, appraise_for, ready_to_certify, special_inv_entity, ready_to_create_bill, PLUS_1_INT_PCT, PLUS_1_PENALTY_PCT, PLUS_2_INT_PCT, PLUS_2_PENALTY_PCT, PLUS_3_INT_PCT, PLUS_3_PENALTY_PCT, PLUS_4_INT_PCT, PLUS_4_PENALTY_PCT, PLUS_5_INT_PCT, PLUS_5_PENALTY_PCT, PLUS_6_INT_PCT, PLUS_6_PENALTY_PCT, PLUS_7_INT_PCT, PLUS_7_PENALTY_PCT, PLUS_8_INT_PCT, PLUS_8_PENALTY_PCT, PLUS_9_INT_PCT, PLUS_9_PENALTY_PCT, attorney_fee_pct, effective_due_dt, collect_option, weed_control, weed_control_pct, ptd_option from inserted
for read only
 
open curRows
fetch next from curRows into @entity_id, @tax_rate_yr, @discount_dt, @late_dt, @attorney_fee_dt, @bills_created_dt, @m_n_o_tax_pct, @i_n_s_tax_pct, @prot_i_n_s_tax_pct, @sales_tax_pct, @levy_start_rct_num, @supp_start_rct_num, @stmnt_dt, @collect_for, @appraise_for, @ready_to_certify, @special_inv_entity, @ready_to_create_bill, @PLUS_1_INT_PCT, @PLUS_1_PENALTY_PCT, @PLUS_2_INT_PCT, @PLUS_2_PENALTY_PCT, @PLUS_3_INT_PCT, @PLUS_3_PENALTY_PCT, @PLUS_4_INT_PCT, @PLUS_4_PENALTY_PCT, @PLUS_5_INT_PCT, @PLUS_5_PENALTY_PCT, @PLUS_6_INT_PCT, @PLUS_6_PENALTY_PCT, @PLUS_7_INT_PCT, @PLUS_7_PENALTY_PCT, @PLUS_8_INT_PCT, @PLUS_8_PENALTY_PCT, @PLUS_9_INT_PCT, @PLUS_9_PENALTY_PCT, @attorney_fee_pct, @effective_due_dt, @collect_option, @weed_control, @weed_control_pct, @ptd_option
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = e.entity_cd + '-' + convert(varchar(4), @tax_rate_yr)
     from entity as e with(nolock)
     where entity_id = @entity_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'entity_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 1757, null, convert(varchar(255), @entity_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'tax_rate_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 5129, null, convert(varchar(255), @tax_rate_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'discount_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 1343, null, convert(varchar(255), @discount_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'late_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 2727, null, convert(varchar(255), @late_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'attorney_fee_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 364, null, convert(varchar(255), @attorney_fee_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'bills_created_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 517, null, convert(varchar(255), @bills_created_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'm_n_o_tax_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 2979, null, convert(varchar(255), @m_n_o_tax_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'i_n_s_tax_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 2115, null, convert(varchar(255), @i_n_s_tax_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'prot_i_n_s_tax_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 4127, null, convert(varchar(255), @prot_i_n_s_tax_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'sales_tax_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 4611, null, convert(varchar(255), @sales_tax_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'levy_start_rct_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 2825, null, convert(varchar(255), @levy_start_rct_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'supp_start_rct_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 5010, null, convert(varchar(255), @supp_start_rct_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'stmnt_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 4955, null, convert(varchar(255), @stmnt_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'collect_for' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 805, null, convert(varchar(255), @collect_for), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'appraise_for' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 243, null, convert(varchar(255), @appraise_for), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'ready_to_certify' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 4299, null, convert(varchar(255), @ready_to_certify), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'special_inv_entity' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 4906, null, convert(varchar(255), @special_inv_entity), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'ready_to_create_bill' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 4300, null, convert(varchar(255), @ready_to_create_bill), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_1_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3747, null, convert(varchar(255), @PLUS_1_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_1_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3748, null, convert(varchar(255), @PLUS_1_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_2_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3749, null, convert(varchar(255), @PLUS_2_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_2_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3750, null, convert(varchar(255), @PLUS_2_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_3_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3751, null, convert(varchar(255), @PLUS_3_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_3_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3752, null, convert(varchar(255), @PLUS_3_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_4_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3753, null, convert(varchar(255), @PLUS_4_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_4_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3754, null, convert(varchar(255), @PLUS_4_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_5_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3755, null, convert(varchar(255), @PLUS_5_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_5_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3756, null, convert(varchar(255), @PLUS_5_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_6_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3757, null, convert(varchar(255), @PLUS_6_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_6_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3758, null, convert(varchar(255), @PLUS_6_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_7_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3759, null, convert(varchar(255), @PLUS_7_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_7_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3760, null, convert(varchar(255), @PLUS_7_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_8_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3761, null, convert(varchar(255), @PLUS_8_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_8_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3762, null, convert(varchar(255), @PLUS_8_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_9_INT_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3763, null, convert(varchar(255), @PLUS_9_INT_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'PLUS_9_PENALTY_PCT' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 3764, null, convert(varchar(255), @PLUS_9_PENALTY_PCT), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'attorney_fee_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 365, null, convert(varchar(255), @attorney_fee_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'effective_due_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 1428, null, convert(varchar(255), @effective_due_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'collect_option' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 806, null, convert(varchar(255), @collect_option), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'weed_control' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 5529, null, convert(varchar(255), @weed_control), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'weed_control_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 5530, null, convert(varchar(255), @weed_control_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'tax_rate' and
               chg_log_columns = 'ptd_option' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 793, 4178, null, convert(varchar(255), @ptd_option), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5129, convert(varchar(24), @tax_rate_yr), case when @tax_rate_yr > @tvar_intMin and @tax_rate_yr < @tvar_intMax then convert(int, round(@tax_rate_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @entity_id, @tax_rate_yr, @discount_dt, @late_dt, @attorney_fee_dt, @bills_created_dt, @m_n_o_tax_pct, @i_n_s_tax_pct, @prot_i_n_s_tax_pct, @sales_tax_pct, @levy_start_rct_num, @supp_start_rct_num, @stmnt_dt, @collect_for, @appraise_for, @ready_to_certify, @special_inv_entity, @ready_to_create_bill, @PLUS_1_INT_PCT, @PLUS_1_PENALTY_PCT, @PLUS_2_INT_PCT, @PLUS_2_PENALTY_PCT, @PLUS_3_INT_PCT, @PLUS_3_PENALTY_PCT, @PLUS_4_INT_PCT, @PLUS_4_PENALTY_PCT, @PLUS_5_INT_PCT, @PLUS_5_PENALTY_PCT, @PLUS_6_INT_PCT, @PLUS_6_PENALTY_PCT, @PLUS_7_INT_PCT, @PLUS_7_PENALTY_PCT, @PLUS_8_INT_PCT, @PLUS_8_PENALTY_PCT, @PLUS_9_INT_PCT, @PLUS_9_PENALTY_PCT, @attorney_fee_pct, @effective_due_dt, @collect_option, @weed_control, @weed_control_pct, @ptd_option
end
 
close curRows
deallocate curRows

GO

