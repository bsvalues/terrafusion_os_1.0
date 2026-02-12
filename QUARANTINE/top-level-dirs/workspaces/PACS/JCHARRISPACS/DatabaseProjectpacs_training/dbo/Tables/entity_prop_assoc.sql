CREATE TABLE [dbo].[entity_prop_assoc] (
    [entity_id]                   INT              NOT NULL,
    [prop_id]                     INT              NOT NULL,
    [entity_prop_id]              VARCHAR (50)     NULL,
    [entity_prop_pct]             NUMERIC (13, 10) NULL,
    [conv_taxable_val]            INT              NULL,
    [conv_taxable_value]          NUMERIC (14, 2)  NULL,
    [sup_num]                     INT              NOT NULL,
    [tax_yr]                      NUMERIC (4)      NOT NULL,
    [annex_yr]                    NUMERIC (4)      NULL,
    [entity_taxable_val]          NUMERIC (14)     NULL,
    [pct_imprv_hs]                NUMERIC (13, 10) CONSTRAINT [CDF_entity_prop_assoc_pct_imprv_hs] DEFAULT (0) NULL,
    [pct_imprv_nhs]               NUMERIC (13, 10) CONSTRAINT [CDF_entity_prop_assoc_pct_imprv_nhs] DEFAULT (0) NULL,
    [pct_land_hs]                 NUMERIC (13, 10) CONSTRAINT [CDF_entity_prop_assoc_pct_land_hs] DEFAULT (0) NULL,
    [pct_land_nhs]                NUMERIC (13, 10) CONSTRAINT [CDF_entity_prop_assoc_pct_land_nhs] DEFAULT (0) NULL,
    [pct_ag_use]                  NUMERIC (13, 10) CONSTRAINT [CDF_entity_prop_assoc_pct_ag_use] DEFAULT (0) NULL,
    [pct_ag_mkt]                  NUMERIC (13, 10) CONSTRAINT [CDF_entity_prop_assoc_pct_ag_mkt] DEFAULT (0) NULL,
    [pct_tim_use]                 NUMERIC (13, 10) CONSTRAINT [CDF_entity_prop_assoc_pct_tim_use] DEFAULT (0) NULL,
    [pct_tim_mkt]                 NUMERIC (13, 10) CONSTRAINT [CDF_entity_prop_assoc_pct_tim_mkt] DEFAULT (0) NULL,
    [new_val_hs]                  NUMERIC (14)     NULL,
    [new_val_hs_override]         BIT              CONSTRAINT [CDF_entity_prop_assoc_new_val_hs_override] DEFAULT (0) NOT NULL,
    [new_val_hs_override_amount]  NUMERIC (14)     NULL,
    [new_val_nhs]                 NUMERIC (14)     NULL,
    [new_val_nhs_override]        BIT              CONSTRAINT [CDF_entity_prop_assoc_new_val_nhs_override] DEFAULT (0) NOT NULL,
    [new_val_nhs_override_amount] NUMERIC (14)     NULL,
    [new_val_p]                   NUMERIC (14)     NULL,
    [new_val_p_override]          BIT              CONSTRAINT [CDF_entity_prop_assoc_new_val_p_override] DEFAULT (0) NOT NULL,
    [new_val_p_override_amount]   NUMERIC (14)     NULL,
    [tsRowVersion]                ROWVERSION       NOT NULL,
    CONSTRAINT [CPK_entity_prop_assoc] PRIMARY KEY CLUSTERED ([tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_entity_prop_assoc_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[entity_prop_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_entity_prop_assoc_update_ChangeLog
on entity_prop_assoc
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
 
declare @old_entity_id int
declare @new_entity_id int
declare @old_prop_id int
declare @new_prop_id int
declare @old_entity_prop_id varchar(50)
declare @new_entity_prop_id varchar(50)
declare @old_entity_prop_pct numeric(13,10)
declare @new_entity_prop_pct numeric(13,10)
declare @old_conv_taxable_val int
declare @new_conv_taxable_val int
declare @old_conv_taxable_value numeric(14,2)
declare @new_conv_taxable_value numeric(14,2)
declare @old_sup_num int
declare @new_sup_num int
declare @old_tax_yr numeric(4,0)
declare @new_tax_yr numeric(4,0)
declare @old_annex_yr numeric(4,0)
declare @new_annex_yr numeric(4,0)
declare @old_entity_taxable_val numeric(14,0)
declare @new_entity_taxable_val numeric(14,0)
declare @old_pct_imprv_hs numeric(13,10)
declare @new_pct_imprv_hs numeric(13,10)
declare @old_pct_imprv_nhs numeric(13,10)
declare @new_pct_imprv_nhs numeric(13,10)
declare @old_pct_land_hs numeric(13,10)
declare @new_pct_land_hs numeric(13,10)
declare @old_pct_land_nhs numeric(13,10)
declare @new_pct_land_nhs numeric(13,10)
declare @old_pct_ag_use numeric(13,10)
declare @new_pct_ag_use numeric(13,10)
declare @old_pct_ag_mkt numeric(13,10)
declare @new_pct_ag_mkt numeric(13,10)
declare @old_pct_tim_use numeric(13,10)
declare @new_pct_tim_use numeric(13,10)
declare @old_pct_tim_mkt numeric(13,10)
declare @new_pct_tim_mkt numeric(13,10)
declare @old_new_val_hs numeric(14,0)
declare @new_new_val_hs numeric(14,0)
declare @old_new_val_hs_override bit
declare @new_new_val_hs_override bit
declare @old_new_val_hs_override_amount numeric(14,0)
declare @new_new_val_hs_override_amount numeric(14,0)
declare @old_new_val_nhs numeric(14,0)
declare @new_new_val_nhs numeric(14,0)
declare @old_new_val_nhs_override bit
declare @new_new_val_nhs_override bit
declare @old_new_val_nhs_override_amount numeric(14,0)
declare @new_new_val_nhs_override_amount numeric(14,0)
declare @old_new_val_p numeric(14,0)
declare @new_new_val_p numeric(14,0)
declare @old_new_val_p_override bit
declare @new_new_val_p_override bit
declare @old_new_val_p_override_amount numeric(14,0)
declare @new_new_val_p_override_amount numeric(14,0)
 
declare curRows cursor
for
     select d.entity_id, d.prop_id, d.entity_prop_id, d.entity_prop_pct, d.conv_taxable_val, d.conv_taxable_value, d.sup_num, case d.tax_yr when 0 then @tvar_lFutureYear else d.tax_yr end, d.annex_yr, d.entity_taxable_val, d.pct_imprv_hs, d.pct_imprv_nhs, d.pct_land_hs, d.pct_land_nhs, d.pct_ag_use, d.pct_ag_mkt, d.pct_tim_use, d.pct_tim_mkt, d.new_val_hs, d.new_val_hs_override, d.new_val_hs_override_amount, d.new_val_nhs, d.new_val_nhs_override, d.new_val_nhs_override_amount, d.new_val_p, d.new_val_p_override, d.new_val_p_override_amount, i.entity_id, i.prop_id, i.entity_prop_id, i.entity_prop_pct, i.conv_taxable_val, i.conv_taxable_value, i.sup_num, case i.tax_yr when 0 then @tvar_lFutureYear else i.tax_yr end, i.annex_yr, i.entity_taxable_val, i.pct_imprv_hs, i.pct_imprv_nhs, i.pct_land_hs, i.pct_land_nhs, i.pct_ag_use, i.pct_ag_mkt, i.pct_tim_use, i.pct_tim_mkt, i.new_val_hs, i.new_val_hs_override, i.new_val_hs_override_amount, i.new_val_nhs, i.new_val_nhs_override, i.new_val_nhs_override_amount, i.new_val_p, i.new_val_p_override, i.new_val_p_override_amount
from deleted as d
join inserted as i on 
     d.entity_id = i.entity_id and
     d.prop_id = i.prop_id and
     d.sup_num = i.sup_num and
     d.tax_yr = i.tax_yr
for read only
 
open curRows
fetch next from curRows into @old_entity_id, @old_prop_id, @old_entity_prop_id, @old_entity_prop_pct, @old_conv_taxable_val, @old_conv_taxable_value, @old_sup_num, @old_tax_yr, @old_annex_yr, @old_entity_taxable_val, @old_pct_imprv_hs, @old_pct_imprv_nhs, @old_pct_land_hs, @old_pct_land_nhs, @old_pct_ag_use, @old_pct_ag_mkt, @old_pct_tim_use, @old_pct_tim_mkt, @old_new_val_hs, @old_new_val_hs_override, @old_new_val_hs_override_amount, @old_new_val_nhs, @old_new_val_nhs_override, @old_new_val_nhs_override_amount, @old_new_val_p, @old_new_val_p_override, @old_new_val_p_override_amount, @new_entity_id, @new_prop_id, @new_entity_prop_id, @new_entity_prop_pct, @new_conv_taxable_val, @new_conv_taxable_value, @new_sup_num, @new_tax_yr, @new_annex_yr, @new_entity_taxable_val, @new_pct_imprv_hs, @new_pct_imprv_nhs, @new_pct_land_hs, @new_pct_land_nhs, @new_pct_ag_use, @new_pct_ag_mkt, @new_pct_tim_use, @new_pct_tim_mkt, @new_new_val_hs, @new_new_val_hs_override, @new_new_val_hs_override_amount, @new_new_val_nhs, @new_new_val_nhs_override, @new_new_val_nhs_override_amount, @new_new_val_p, @new_new_val_p_override, @new_new_val_p_override_amount
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = entity.entity_cd
     from entity with(nolock)
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
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'entity_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 1757, convert(varchar(255), @old_entity_id), convert(varchar(255), @new_entity_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
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
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_entity_prop_id <> @new_entity_prop_id
          or
          ( @old_entity_prop_id is null and @new_entity_prop_id is not null ) 
          or
          ( @old_entity_prop_id is not null and @new_entity_prop_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'entity_prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 1761, convert(varchar(255), @old_entity_prop_id), convert(varchar(255), @new_entity_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_entity_prop_pct <> @new_entity_prop_pct
          or
          ( @old_entity_prop_pct is null and @new_entity_prop_pct is not null ) 
          or
          ( @old_entity_prop_pct is not null and @new_entity_prop_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'entity_prop_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 1762, convert(varchar(255), @old_entity_prop_pct), convert(varchar(255), @new_entity_prop_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_conv_taxable_val <> @new_conv_taxable_val
          or
          ( @old_conv_taxable_val is null and @new_conv_taxable_val is not null ) 
          or
          ( @old_conv_taxable_val is not null and @new_conv_taxable_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'conv_taxable_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 883, convert(varchar(255), @old_conv_taxable_val), convert(varchar(255), @new_conv_taxable_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_conv_taxable_value <> @new_conv_taxable_value
          or
          ( @old_conv_taxable_value is null and @new_conv_taxable_value is not null ) 
          or
          ( @old_conv_taxable_value is not null and @new_conv_taxable_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'conv_taxable_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 884, convert(varchar(255), @old_conv_taxable_value), convert(varchar(255), @new_conv_taxable_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
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
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_tax_yr <> @new_tax_yr
          or
          ( @old_tax_yr is null and @new_tax_yr is not null ) 
          or
          ( @old_tax_yr is not null and @new_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5136, convert(varchar(255), @old_tax_yr), convert(varchar(255), @new_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_annex_yr <> @new_annex_yr
          or
          ( @old_annex_yr is null and @new_annex_yr is not null ) 
          or
          ( @old_annex_yr is not null and @new_annex_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'annex_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 215, convert(varchar(255), @old_annex_yr), convert(varchar(255), @new_annex_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_entity_taxable_val <> @new_entity_taxable_val
          or
          ( @old_entity_taxable_val is null and @new_entity_taxable_val is not null ) 
          or
          ( @old_entity_taxable_val is not null and @new_entity_taxable_val is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'entity_taxable_val' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 1764, convert(varchar(255), @old_entity_taxable_val), convert(varchar(255), @new_entity_taxable_val), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pct_imprv_hs <> @new_pct_imprv_hs
          or
          ( @old_pct_imprv_hs is null and @new_pct_imprv_hs is not null ) 
          or
          ( @old_pct_imprv_hs is not null and @new_pct_imprv_hs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'pct_imprv_hs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5926, convert(varchar(255), @old_pct_imprv_hs), convert(varchar(255), @new_pct_imprv_hs), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pct_imprv_nhs <> @new_pct_imprv_nhs
          or
          ( @old_pct_imprv_nhs is null and @new_pct_imprv_nhs is not null ) 
          or
          ( @old_pct_imprv_nhs is not null and @new_pct_imprv_nhs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'pct_imprv_nhs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5927, convert(varchar(255), @old_pct_imprv_nhs), convert(varchar(255), @new_pct_imprv_nhs), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pct_land_hs <> @new_pct_land_hs
          or
          ( @old_pct_land_hs is null and @new_pct_land_hs is not null ) 
          or
          ( @old_pct_land_hs is not null and @new_pct_land_hs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'pct_land_hs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5928, convert(varchar(255), @old_pct_land_hs), convert(varchar(255), @new_pct_land_hs), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pct_land_nhs <> @new_pct_land_nhs
          or
          ( @old_pct_land_nhs is null and @new_pct_land_nhs is not null ) 
          or
          ( @old_pct_land_nhs is not null and @new_pct_land_nhs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'pct_land_nhs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5929, convert(varchar(255), @old_pct_land_nhs), convert(varchar(255), @new_pct_land_nhs), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pct_ag_use <> @new_pct_ag_use
          or
          ( @old_pct_ag_use is null and @new_pct_ag_use is not null ) 
          or
          ( @old_pct_ag_use is not null and @new_pct_ag_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'pct_ag_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5925, convert(varchar(255), @old_pct_ag_use), convert(varchar(255), @new_pct_ag_use), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pct_ag_mkt <> @new_pct_ag_mkt
          or
          ( @old_pct_ag_mkt is null and @new_pct_ag_mkt is not null ) 
          or
          ( @old_pct_ag_mkt is not null and @new_pct_ag_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'pct_ag_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5924, convert(varchar(255), @old_pct_ag_mkt), convert(varchar(255), @new_pct_ag_mkt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pct_tim_use <> @new_pct_tim_use
          or
          ( @old_pct_tim_use is null and @new_pct_tim_use is not null ) 
          or
          ( @old_pct_tim_use is not null and @new_pct_tim_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'pct_tim_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5931, convert(varchar(255), @old_pct_tim_use), convert(varchar(255), @new_pct_tim_use), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_pct_tim_mkt <> @new_pct_tim_mkt
          or
          ( @old_pct_tim_mkt is null and @new_pct_tim_mkt is not null ) 
          or
          ( @old_pct_tim_mkt is not null and @new_pct_tim_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'pct_tim_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 5930, convert(varchar(255), @old_pct_tim_mkt), convert(varchar(255), @new_pct_tim_mkt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_hs <> @new_new_val_hs
          or
          ( @old_new_val_hs is null and @new_new_val_hs is not null ) 
          or
          ( @old_new_val_hs is not null and @new_new_val_hs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_hs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 3244, convert(varchar(255), @old_new_val_hs), convert(varchar(255), @new_new_val_hs), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_hs_override <> @new_new_val_hs_override
          or
          ( @old_new_val_hs_override is null and @new_new_val_hs_override is not null ) 
          or
          ( @old_new_val_hs_override is not null and @new_new_val_hs_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_hs_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 9351, convert(varchar(255), @old_new_val_hs_override), convert(varchar(255), @new_new_val_hs_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_hs_override_amount <> @new_new_val_hs_override_amount
          or
          ( @old_new_val_hs_override_amount is null and @new_new_val_hs_override_amount is not null ) 
          or
          ( @old_new_val_hs_override_amount is not null and @new_new_val_hs_override_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_hs_override_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 9352, convert(varchar(255), @old_new_val_hs_override_amount), convert(varchar(255), @new_new_val_hs_override_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_nhs <> @new_new_val_nhs
          or
          ( @old_new_val_nhs is null and @new_new_val_nhs is not null ) 
          or
          ( @old_new_val_nhs is not null and @new_new_val_nhs is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_nhs' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 3245, convert(varchar(255), @old_new_val_nhs), convert(varchar(255), @new_new_val_nhs), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_nhs_override <> @new_new_val_nhs_override
          or
          ( @old_new_val_nhs_override is null and @new_new_val_nhs_override is not null ) 
          or
          ( @old_new_val_nhs_override is not null and @new_new_val_nhs_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_nhs_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 9353, convert(varchar(255), @old_new_val_nhs_override), convert(varchar(255), @new_new_val_nhs_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_nhs_override_amount <> @new_new_val_nhs_override_amount
          or
          ( @old_new_val_nhs_override_amount is null and @new_new_val_nhs_override_amount is not null ) 
          or
          ( @old_new_val_nhs_override_amount is not null and @new_new_val_nhs_override_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_nhs_override_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 9354, convert(varchar(255), @old_new_val_nhs_override_amount), convert(varchar(255), @new_new_val_nhs_override_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_p <> @new_new_val_p
          or
          ( @old_new_val_p is null and @new_new_val_p is not null ) 
          or
          ( @old_new_val_p is not null and @new_new_val_p is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_p' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 3246, convert(varchar(255), @old_new_val_p), convert(varchar(255), @new_new_val_p), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_p_override <> @new_new_val_p_override
          or
          ( @old_new_val_p_override is null and @new_new_val_p_override is not null ) 
          or
          ( @old_new_val_p_override is not null and @new_new_val_p_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_p_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 9355, convert(varchar(255), @old_new_val_p_override), convert(varchar(255), @new_new_val_p_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_new_val_p_override_amount <> @new_new_val_p_override_amount
          or
          ( @old_new_val_p_override_amount is null and @new_new_val_p_override_amount is not null ) 
          or
          ( @old_new_val_p_override_amount is not null and @new_new_val_p_override_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity_prop_assoc' and
                    chg_log_columns = 'new_val_p_override_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 250, 9356, convert(varchar(255), @old_new_val_p_override_amount), convert(varchar(255), @new_new_val_p_override_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @new_tax_yr), case when @new_tax_yr > @tvar_intMin and @new_tax_yr < @tvar_intMax then convert(int, round(@new_tax_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_entity_id, @old_prop_id, @old_entity_prop_id, @old_entity_prop_pct, @old_conv_taxable_val, @old_conv_taxable_value, @old_sup_num, @old_tax_yr, @old_annex_yr, @old_entity_taxable_val, @old_pct_imprv_hs, @old_pct_imprv_nhs, @old_pct_land_hs, @old_pct_land_nhs, @old_pct_ag_use, @old_pct_ag_mkt, @old_pct_tim_use, @old_pct_tim_mkt, @old_new_val_hs, @old_new_val_hs_override, @old_new_val_hs_override_amount, @old_new_val_nhs, @old_new_val_nhs_override, @old_new_val_nhs_override_amount, @old_new_val_p, @old_new_val_p_override, @old_new_val_p_override_amount, @new_entity_id, @new_prop_id, @new_entity_prop_id, @new_entity_prop_pct, @new_conv_taxable_val, @new_conv_taxable_value, @new_sup_num, @new_tax_yr, @new_annex_yr, @new_entity_taxable_val, @new_pct_imprv_hs, @new_pct_imprv_nhs, @new_pct_land_hs, @new_pct_land_nhs, @new_pct_ag_use, @new_pct_ag_mkt, @new_pct_tim_use, @new_pct_tim_mkt, @new_new_val_hs, @new_new_val_hs_override, @new_new_val_hs_override_amount, @new_new_val_nhs, @new_new_val_nhs_override, @new_new_val_nhs_override_amount, @new_new_val_p, @new_new_val_p_override, @new_new_val_p_override_amount
end
 
close curRows
deallocate curRows

GO


create trigger tr_entity_prop_assoc_insert_ChangeLog
on entity_prop_assoc
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
 
declare @entity_id int
declare @prop_id int
declare @entity_prop_id varchar(50)
declare @entity_prop_pct numeric(13,10)
declare @conv_taxable_val int
declare @conv_taxable_value numeric(14,2)
declare @sup_num int
declare @tax_yr numeric(4,0)
declare @annex_yr numeric(4,0)
declare @entity_taxable_val numeric(14,0)
declare @pct_imprv_hs numeric(13,10)
declare @pct_imprv_nhs numeric(13,10)
declare @pct_land_hs numeric(13,10)
declare @pct_land_nhs numeric(13,10)
declare @pct_ag_use numeric(13,10)
declare @pct_ag_mkt numeric(13,10)
declare @pct_tim_use numeric(13,10)
declare @pct_tim_mkt numeric(13,10)
declare @new_val_hs numeric(14,0)
declare @new_val_hs_override bit
declare @new_val_hs_override_amount numeric(14,0)
declare @new_val_nhs numeric(14,0)
declare @new_val_nhs_override bit
declare @new_val_nhs_override_amount numeric(14,0)
declare @new_val_p numeric(14,0)
declare @new_val_p_override bit
declare @new_val_p_override_amount numeric(14,0)
 
declare curRows cursor
for
     select entity_id, prop_id, entity_prop_id, entity_prop_pct, conv_taxable_val, conv_taxable_value, sup_num, case tax_yr when 0 then @tvar_lFutureYear else tax_yr end, annex_yr, entity_taxable_val, pct_imprv_hs, pct_imprv_nhs, pct_land_hs, pct_land_nhs, pct_ag_use, pct_ag_mkt, pct_tim_use, pct_tim_mkt, new_val_hs, new_val_hs_override, new_val_hs_override_amount, new_val_nhs, new_val_nhs_override, new_val_nhs_override_amount, new_val_p, new_val_p_override, new_val_p_override_amount from inserted
for read only
 
open curRows
fetch next from curRows into @entity_id, @prop_id, @entity_prop_id, @entity_prop_pct, @conv_taxable_val, @conv_taxable_value, @sup_num, @tax_yr, @annex_yr, @entity_taxable_val, @pct_imprv_hs, @pct_imprv_nhs, @pct_land_hs, @pct_land_nhs, @pct_ag_use, @pct_ag_mkt, @pct_tim_use, @pct_tim_mkt, @new_val_hs, @new_val_hs_override, @new_val_hs_override_amount, @new_val_nhs, @new_val_nhs_override, @new_val_nhs_override_amount, @new_val_p, @new_val_p_override, @new_val_p_override_amount
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = entity.entity_cd
     from entity with(nolock)
     where entity_id = @entity_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'entity_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 1757, null, convert(varchar(255), @entity_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'entity_prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 1761, null, convert(varchar(255), @entity_prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'entity_prop_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 1762, null, convert(varchar(255), @entity_prop_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'conv_taxable_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 883, null, convert(varchar(255), @conv_taxable_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'conv_taxable_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 884, null, convert(varchar(255), @conv_taxable_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5136, null, convert(varchar(255), @tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'annex_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 215, null, convert(varchar(255), @annex_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'entity_taxable_val' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 1764, null, convert(varchar(255), @entity_taxable_val), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'pct_imprv_hs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5926, null, convert(varchar(255), @pct_imprv_hs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'pct_imprv_nhs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5927, null, convert(varchar(255), @pct_imprv_nhs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'pct_land_hs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5928, null, convert(varchar(255), @pct_land_hs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'pct_land_nhs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5929, null, convert(varchar(255), @pct_land_nhs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'pct_ag_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5925, null, convert(varchar(255), @pct_ag_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'pct_ag_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5924, null, convert(varchar(255), @pct_ag_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'pct_tim_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5931, null, convert(varchar(255), @pct_tim_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'pct_tim_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 5930, null, convert(varchar(255), @pct_tim_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_hs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 3244, null, convert(varchar(255), @new_val_hs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_hs_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 9351, null, convert(varchar(255), @new_val_hs_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_hs_override_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 9352, null, convert(varchar(255), @new_val_hs_override_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_nhs' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 3245, null, convert(varchar(255), @new_val_nhs), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_nhs_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 9353, null, convert(varchar(255), @new_val_nhs_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_nhs_override_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 9354, null, convert(varchar(255), @new_val_nhs_override_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_p' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 3246, null, convert(varchar(255), @new_val_p), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_p_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 9355, null, convert(varchar(255), @new_val_p_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity_prop_assoc' and
               chg_log_columns = 'new_val_p_override_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 250, 9356, null, convert(varchar(255), @new_val_p_override_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @entity_id, @prop_id, @entity_prop_id, @entity_prop_pct, @conv_taxable_val, @conv_taxable_value, @sup_num, @tax_yr, @annex_yr, @entity_taxable_val, @pct_imprv_hs, @pct_imprv_nhs, @pct_land_hs, @pct_land_nhs, @pct_ag_use, @pct_ag_mkt, @pct_tim_use, @pct_tim_mkt, @new_val_hs, @new_val_hs_override, @new_val_hs_override_amount, @new_val_nhs, @new_val_nhs_override, @new_val_nhs_override_amount, @new_val_p, @new_val_p_override, @new_val_p_override_amount
end
 
close curRows
deallocate curRows

GO



create trigger tr_entity_prop_assoc_delete_ChangeLog
on entity_prop_assoc
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
          chg_log_tables = 'entity_prop_assoc' and
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
declare @prop_id int
declare @sup_num int
declare @tax_yr numeric(4,0)
 
declare curRows cursor
for
     select entity_id, prop_id, sup_num, case tax_yr when 0 then @tvar_lFutureYear else tax_yr end from deleted
for read only
 
open curRows
fetch next from curRows into @entity_id, @prop_id, @sup_num, @tax_yr
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = entity.entity_cd
     from entity with(nolock)
     where entity_id = @entity_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 250, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5136, convert(varchar(24), @tax_yr), case when @tax_yr > @tvar_intMin and @tax_yr < @tvar_intMax then convert(int, round(@tax_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @entity_id, @prop_id, @sup_num, @tax_yr
end
 
close curRows
deallocate curRows

GO

