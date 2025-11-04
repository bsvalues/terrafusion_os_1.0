CREATE TABLE [dbo].[property_freeze] (
    [prop_id]               INT             NOT NULL,
    [owner_id]              INT             NOT NULL,
    [exmpt_tax_yr]          NUMERIC (4)     NOT NULL,
    [owner_tax_yr]          NUMERIC (4)     NOT NULL,
    [sup_num]               INT             NOT NULL,
    [entity_id]             INT             NOT NULL,
    [exmpt_type_cd]         VARCHAR (10)    NOT NULL,
    [use_freeze]            CHAR (1)        NULL,
    [transfer_dt]           DATETIME        NULL,
    [prev_tax_due]          NUMERIC (14, 2) NULL,
    [prev_tax_nofrz]        NUMERIC (14, 2) NULL,
    [freeze_yr]             NUMERIC (4)     NULL,
    [freeze_ceiling]        NUMERIC (14, 2) NULL,
    [transfer_pct]          NUMERIC (9, 6)  NULL,
    [transfer_pct_override] CHAR (1)        NULL,
    [pacs_freeze]           CHAR (1)        NULL,
    [pacs_freeze_date]      DATETIME        NULL,
    [pacs_freeze_ceiling]   NUMERIC (14, 2) NULL,
    [pacs_freeze_run]       INT             NULL,
    [freeze_override]       BIT             CONSTRAINT [CDF_property_freeze_freeze_override] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_property_freeze] PRIMARY KEY CLUSTERED ([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [entity_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_freeze_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id]),
    CONSTRAINT [CFK_property_freeze_entity_id_exmpt_tax_yr_exmpt_type_cd] FOREIGN KEY ([entity_id], [exmpt_tax_yr], [exmpt_type_cd]) REFERENCES [dbo].[entity_exmpt] ([entity_id], [exmpt_tax_yr], [exmpt_type_cd]),
    CONSTRAINT [CFK_property_freeze_exmpt_tax_yr_sup_num_prop_id_entity_id] FOREIGN KEY ([exmpt_tax_yr], [sup_num], [prop_id], [entity_id]) REFERENCES [dbo].[entity_prop_assoc] ([tax_yr], [sup_num], [prop_id], [entity_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_property_freeze_exmpt_type_cd] FOREIGN KEY ([exmpt_type_cd]) REFERENCES [dbo].[exmpt_type] ([exmpt_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[property_freeze]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_property_freeze_insert_ChangeLog
on property_freeze
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
 
declare @prop_id int
declare @owner_id int
declare @exmpt_tax_yr numeric(4,0)
declare @owner_tax_yr numeric(4,0)
declare @sup_num int
declare @entity_id int
declare @exmpt_type_cd char(5)
declare @use_freeze char(1)
declare @transfer_dt datetime
declare @prev_tax_due numeric(14,2)
declare @prev_tax_nofrz numeric(14,2)
declare @freeze_yr numeric(4,0)
declare @freeze_ceiling numeric(14,2)
declare @transfer_pct numeric(9,6)
declare @transfer_pct_override char(1)
declare @pacs_freeze char(1)
declare @pacs_freeze_date datetime
declare @pacs_freeze_ceiling numeric(14,2)
declare @pacs_freeze_run int
declare @freeze_override bit
 
declare curRows cursor
for
     select prop_id, owner_id, case exmpt_tax_yr when 0 then @tvar_lFutureYear else exmpt_tax_yr end, case owner_tax_yr when 0 then @tvar_lFutureYear else owner_tax_yr end, sup_num, entity_id, exmpt_type_cd, use_freeze, transfer_dt, prev_tax_due, prev_tax_nofrz, freeze_yr, freeze_ceiling, transfer_pct, transfer_pct_override, pacs_freeze, pacs_freeze_date, pacs_freeze_ceiling, pacs_freeze_run, freeze_override from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @owner_id, @exmpt_tax_yr, @owner_tax_yr, @sup_num, @entity_id, @exmpt_type_cd, @use_freeze, @transfer_dt, @prev_tax_due, @prev_tax_nofrz, @freeze_yr, @freeze_ceiling, @transfer_pct, @transfer_pct_override, @pacs_freeze, @pacs_freeze_date, @pacs_freeze_ceiling, @pacs_freeze_run, @freeze_override
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Entity: ' + ltrim(rtrim(e.entity_cd)) + '; Exemption: ' + ltrim(rtrim(@exmpt_type_cd)) + '; Owner: ' + a.file_as_name
     from entity as e with (nolock)
     cross join account as a with (nolock)
     where e.entity_id = @entity_id
     and a.acct_id = @owner_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 3493, null, convert(varchar(255), @owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'exmpt_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 1829, null, convert(varchar(255), @exmpt_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'owner_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 3505, null, convert(varchar(255), @owner_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'entity_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 1757, null, convert(varchar(255), @entity_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'exmpt_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 1830, null, convert(varchar(255), @exmpt_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'use_freeze' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 5439, null, convert(varchar(255), @use_freeze), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'transfer_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 5379, null, convert(varchar(255), @transfer_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'prev_tax_due' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 3894, null, convert(varchar(255), @prev_tax_due), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'prev_tax_nofrz' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 3895, null, convert(varchar(255), @prev_tax_nofrz), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'freeze_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 1974, null, convert(varchar(255), @freeze_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'freeze_ceiling' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 1969, null, convert(varchar(255), @freeze_ceiling), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'transfer_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 5384, null, convert(varchar(255), @transfer_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'transfer_pct_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 5385, null, convert(varchar(255), @transfer_pct_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'pacs_freeze' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 3517, null, convert(varchar(255), @pacs_freeze), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'pacs_freeze_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 3519, null, convert(varchar(255), @pacs_freeze_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'pacs_freeze_ceiling' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 3518, null, convert(varchar(255), @pacs_freeze_ceiling), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'pacs_freeze_run' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 3520, null, convert(varchar(255), @pacs_freeze_run), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_freeze' and
               chg_log_columns = 'freeze_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 854, 9347, null, convert(varchar(255), @freeze_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     end
 
     fetch next from curRows into @prop_id, @owner_id, @exmpt_tax_yr, @owner_tax_yr, @sup_num, @entity_id, @exmpt_type_cd, @use_freeze, @transfer_dt, @prev_tax_due, @prev_tax_nofrz, @freeze_yr, @freeze_ceiling, @transfer_pct, @transfer_pct_override, @pacs_freeze, @pacs_freeze_date, @pacs_freeze_ceiling, @pacs_freeze_run, @freeze_override
end
 
close curRows
deallocate curRows

GO


create trigger tr_property_freeze_delete_ChangeLog
on property_freeze
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
          chg_log_tables = 'property_freeze' and
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
 
declare @prop_id int
declare @owner_id int
declare @exmpt_tax_yr numeric(4,0)
declare @owner_tax_yr numeric(4,0)
declare @sup_num int
declare @entity_id int
declare @exmpt_type_cd char(5)
 
declare curRows cursor
for
     select prop_id, owner_id, case exmpt_tax_yr when 0 then @tvar_lFutureYear else exmpt_tax_yr end, case owner_tax_yr when 0 then @tvar_lFutureYear else owner_tax_yr end, sup_num, entity_id, exmpt_type_cd from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @owner_id, @exmpt_tax_yr, @owner_tax_yr, @sup_num, @entity_id, @exmpt_type_cd
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Property Freeze - Year: ' + convert(varchar(4), @exmpt_tax_yr) + '; Entity: ' + ltrim(rtrim(e.entity_cd)) + '; Exemption: ' + ltrim(rtrim(@exmpt_type_cd))  + '; Owner: ' + a.file_as_name
     from entity as e with (nolock)
     cross join account as a with (nolock)
     where e.entity_id = @entity_id
     and a.acct_id = @owner_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 854, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
 
     fetch next from curRows into @prop_id, @owner_id, @exmpt_tax_yr, @owner_tax_yr, @sup_num, @entity_id, @exmpt_type_cd
end
 
close curRows
deallocate curRows

GO


create trigger tr_property_freeze_update_ChangeLog
on property_freeze
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
 
declare @old_prop_id int
declare @new_prop_id int
declare @old_owner_id int
declare @new_owner_id int
declare @old_exmpt_tax_yr numeric(4,0)
declare @new_exmpt_tax_yr numeric(4,0)
declare @old_owner_tax_yr numeric(4,0)
declare @new_owner_tax_yr numeric(4,0)
declare @old_sup_num int
declare @new_sup_num int
declare @old_entity_id int
declare @new_entity_id int
declare @old_exmpt_type_cd char(5)
declare @new_exmpt_type_cd char(5)
declare @old_use_freeze char(1)
declare @new_use_freeze char(1)
declare @old_transfer_dt datetime
declare @new_transfer_dt datetime
declare @old_prev_tax_due numeric(14,2)
declare @new_prev_tax_due numeric(14,2)
declare @old_prev_tax_nofrz numeric(14,2)
declare @new_prev_tax_nofrz numeric(14,2)
declare @old_freeze_yr numeric(4,0)
declare @new_freeze_yr numeric(4,0)
declare @old_freeze_ceiling numeric(14,2)
declare @new_freeze_ceiling numeric(14,2)
declare @old_transfer_pct numeric(9,6)
declare @new_transfer_pct numeric(9,6)
declare @old_transfer_pct_override char(1)
declare @new_transfer_pct_override char(1)
declare @old_pacs_freeze char(1)
declare @new_pacs_freeze char(1)
declare @old_pacs_freeze_date datetime
declare @new_pacs_freeze_date datetime
declare @old_pacs_freeze_ceiling numeric(14,2)
declare @new_pacs_freeze_ceiling numeric(14,2)
declare @old_pacs_freeze_run int
declare @new_pacs_freeze_run int
declare @old_freeze_override bit
declare @new_freeze_override bit
 
declare curRows cursor
for
     select d.prop_id, d.owner_id, case d.exmpt_tax_yr when 0 then @tvar_lFutureYear else d.exmpt_tax_yr end, case d.owner_tax_yr when 0 then @tvar_lFutureYear else d.owner_tax_yr end, d.sup_num, d.entity_id, d.exmpt_type_cd, d.use_freeze, d.transfer_dt, d.prev_tax_due, d.prev_tax_nofrz, d.freeze_yr, d.freeze_ceiling, d.transfer_pct, d.transfer_pct_override, d.pacs_freeze, d.pacs_freeze_date, d.pacs_freeze_ceiling, d.pacs_freeze_run, d.freeze_override, i.prop_id, i.owner_id, case i.exmpt_tax_yr when 0 then @tvar_lFutureYear else i.exmpt_tax_yr end, case i.owner_tax_yr when 0 then @tvar_lFutureYear else i.owner_tax_yr end, i.sup_num, i.entity_id, i.exmpt_type_cd, i.use_freeze, i.transfer_dt, i.prev_tax_due, i.prev_tax_nofrz, i.freeze_yr, i.freeze_ceiling, i.transfer_pct, i.transfer_pct_override, i.pacs_freeze, i.pacs_freeze_date, i.pacs_freeze_ceiling, i.pacs_freeze_run, i.freeze_override
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.owner_id = i.owner_id and
     d.exmpt_tax_yr = i.exmpt_tax_yr and
     d.owner_tax_yr = i.owner_tax_yr and
     d.sup_num = i.sup_num and
     d.entity_id = i.entity_id and
     d.exmpt_type_cd = i.exmpt_type_cd
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_owner_id, @old_exmpt_tax_yr, @old_owner_tax_yr, @old_sup_num, @old_entity_id, @old_exmpt_type_cd, @old_use_freeze, @old_transfer_dt, @old_prev_tax_due, @old_prev_tax_nofrz, @old_freeze_yr, @old_freeze_ceiling, @old_transfer_pct, @old_transfer_pct_override, @old_pacs_freeze, @old_pacs_freeze_date, @old_pacs_freeze_ceiling, @old_pacs_freeze_run, @old_freeze_override, @new_prop_id, @new_owner_id, @new_exmpt_tax_yr, @new_owner_tax_yr, @new_sup_num, @new_entity_id, @new_exmpt_type_cd, @new_use_freeze, @new_transfer_dt, @new_prev_tax_due, @new_prev_tax_nofrz, @new_freeze_yr, @new_freeze_ceiling, @new_transfer_pct, @new_transfer_pct_override, @new_pacs_freeze, @new_pacs_freeze_date, @new_pacs_freeze_ceiling, @new_pacs_freeze_run, @new_freeze_override
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = 'Entity: ' + ltrim(rtrim(e.entity_cd)) + '; Exemption: ' + ltrim(rtrim(@new_exmpt_type_cd)) + '; Owner: ' + a.file_as_name
     from entity as e with (nolock)
     cross join account as a with (nolock)
     where e.entity_id = @new_entity_id
     and a.acct_id = @new_owner_id
 
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
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_owner_id <> @new_owner_id
          or
          ( @old_owner_id is null and @new_owner_id is not null ) 
          or
          ( @old_owner_id is not null and @new_owner_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 3493, convert(varchar(255), @old_owner_id), convert(varchar(255), @new_owner_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_exmpt_tax_yr <> @new_exmpt_tax_yr
          or
          ( @old_exmpt_tax_yr is null and @new_exmpt_tax_yr is not null ) 
          or
          ( @old_exmpt_tax_yr is not null and @new_exmpt_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'exmpt_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 1829, convert(varchar(255), @old_exmpt_tax_yr), convert(varchar(255), @new_exmpt_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_owner_tax_yr <> @new_owner_tax_yr
          or
          ( @old_owner_tax_yr is null and @new_owner_tax_yr is not null ) 
          or
          ( @old_owner_tax_yr is not null and @new_owner_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'owner_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 3505, convert(varchar(255), @old_owner_tax_yr), convert(varchar(255), @new_owner_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
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
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
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
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'entity_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 1757, convert(varchar(255), @old_entity_id), convert(varchar(255), @new_entity_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_exmpt_type_cd <> @new_exmpt_type_cd
          or
          ( @old_exmpt_type_cd is null and @new_exmpt_type_cd is not null ) 
          or
          ( @old_exmpt_type_cd is not null and @new_exmpt_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'exmpt_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 1830, convert(varchar(255), @old_exmpt_type_cd), convert(varchar(255), @new_exmpt_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_use_freeze <> @new_use_freeze
          or
          ( @old_use_freeze is null and @new_use_freeze is not null ) 
          or
          ( @old_use_freeze is not null and @new_use_freeze is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'use_freeze' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 5439, convert(varchar(255), @old_use_freeze), convert(varchar(255), @new_use_freeze), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_transfer_dt <> @new_transfer_dt
          or
          ( @old_transfer_dt is null and @new_transfer_dt is not null ) 
          or
          ( @old_transfer_dt is not null and @new_transfer_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'transfer_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 5379, convert(varchar(255), @old_transfer_dt), convert(varchar(255), @new_transfer_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_prev_tax_due <> @new_prev_tax_due
          or
          ( @old_prev_tax_due is null and @new_prev_tax_due is not null ) 
          or
          ( @old_prev_tax_due is not null and @new_prev_tax_due is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'prev_tax_due' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 3894, convert(varchar(255), @old_prev_tax_due), convert(varchar(255), @new_prev_tax_due), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_prev_tax_nofrz <> @new_prev_tax_nofrz
          or
          ( @old_prev_tax_nofrz is null and @new_prev_tax_nofrz is not null ) 
          or
          ( @old_prev_tax_nofrz is not null and @new_prev_tax_nofrz is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'prev_tax_nofrz' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 3895, convert(varchar(255), @old_prev_tax_nofrz), convert(varchar(255), @new_prev_tax_nofrz), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_freeze_yr <> @new_freeze_yr
          or
          ( @old_freeze_yr is null and @new_freeze_yr is not null ) 
          or
          ( @old_freeze_yr is not null and @new_freeze_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'freeze_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 1974, convert(varchar(255), @old_freeze_yr), convert(varchar(255), @new_freeze_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_freeze_ceiling <> @new_freeze_ceiling
          or
          ( @old_freeze_ceiling is null and @new_freeze_ceiling is not null ) 
          or
          ( @old_freeze_ceiling is not null and @new_freeze_ceiling is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'freeze_ceiling' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 1969, convert(varchar(255), @old_freeze_ceiling), convert(varchar(255), @new_freeze_ceiling), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_transfer_pct <> @new_transfer_pct
          or
          ( @old_transfer_pct is null and @new_transfer_pct is not null ) 
          or
          ( @old_transfer_pct is not null and @new_transfer_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'transfer_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 5384, convert(varchar(255), @old_transfer_pct), convert(varchar(255), @new_transfer_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_transfer_pct_override <> @new_transfer_pct_override
          or
          ( @old_transfer_pct_override is null and @new_transfer_pct_override is not null ) 
          or
          ( @old_transfer_pct_override is not null and @new_transfer_pct_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'transfer_pct_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 5385, convert(varchar(255), @old_transfer_pct_override), convert(varchar(255), @new_transfer_pct_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_pacs_freeze <> @new_pacs_freeze
          or
          ( @old_pacs_freeze is null and @new_pacs_freeze is not null ) 
          or
          ( @old_pacs_freeze is not null and @new_pacs_freeze is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'pacs_freeze' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 3517, convert(varchar(255), @old_pacs_freeze), convert(varchar(255), @new_pacs_freeze), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_pacs_freeze_date <> @new_pacs_freeze_date
          or
          ( @old_pacs_freeze_date is null and @new_pacs_freeze_date is not null ) 
          or
          ( @old_pacs_freeze_date is not null and @new_pacs_freeze_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'pacs_freeze_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 3519, convert(varchar(255), @old_pacs_freeze_date), convert(varchar(255), @new_pacs_freeze_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_pacs_freeze_ceiling <> @new_pacs_freeze_ceiling
          or
          ( @old_pacs_freeze_ceiling is null and @new_pacs_freeze_ceiling is not null ) 
          or
          ( @old_pacs_freeze_ceiling is not null and @new_pacs_freeze_ceiling is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'pacs_freeze_ceiling' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 3518, convert(varchar(255), @old_pacs_freeze_ceiling), convert(varchar(255), @new_pacs_freeze_ceiling), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_pacs_freeze_run <> @new_pacs_freeze_run
          or
          ( @old_pacs_freeze_run is null and @new_pacs_freeze_run is not null ) 
          or
          ( @old_pacs_freeze_run is not null and @new_pacs_freeze_run is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'pacs_freeze_run' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 3520, convert(varchar(255), @old_pacs_freeze_run), convert(varchar(255), @new_pacs_freeze_run), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     if (
          @old_freeze_override <> @new_freeze_override
          or
          ( @old_freeze_override is null and @new_freeze_override is not null ) 
          or
          ( @old_freeze_override is not null and @new_freeze_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_freeze' and
                    chg_log_columns = 'freeze_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 854, 9347, convert(varchar(255), @old_freeze_override), convert(varchar(255), @new_freeze_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_owner_id, @old_exmpt_tax_yr, @old_owner_tax_yr, @old_sup_num, @old_entity_id, @old_exmpt_type_cd, @old_use_freeze, @old_transfer_dt, @old_prev_tax_due, @old_prev_tax_nofrz, @old_freeze_yr, @old_freeze_ceiling, @old_transfer_pct, @old_transfer_pct_override, @old_pacs_freeze, @old_pacs_freeze_date, @old_pacs_freeze_ceiling, @old_pacs_freeze_run, @old_freeze_override, @new_prop_id, @new_owner_id, @new_exmpt_tax_yr, @new_owner_tax_yr, @new_sup_num, @new_entity_id, @new_exmpt_type_cd, @new_use_freeze, @new_transfer_dt, @new_prev_tax_due, @new_prev_tax_nofrz, @new_freeze_yr, @new_freeze_ceiling, @new_transfer_pct, @new_transfer_pct_override, @new_pacs_freeze, @new_pacs_freeze_date, @new_pacs_freeze_ceiling, @new_pacs_freeze_run, @new_freeze_override
end
 
close curRows
deallocate curRows

GO

