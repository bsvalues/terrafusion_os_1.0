CREATE TABLE [dbo].[property_exemption_dor_detail] (
    [exmpt_tax_yr]  NUMERIC (4)    NOT NULL,
    [owner_tax_yr]  NUMERIC (4)    NOT NULL,
    [sup_num]       INT            NOT NULL,
    [prop_id]       INT            NOT NULL,
    [owner_id]      INT            NOT NULL,
    [exmpt_type_cd] VARCHAR (10)   NOT NULL,
    [item_type]     CHAR (1)       NOT NULL,
    [item_id]       INT            NOT NULL,
    [value_type]    CHAR (1)       NOT NULL,
    [exmpt_amount]  NUMERIC (12)   NULL,
    [exmpt_percent] NUMERIC (9, 6) NULL,
    CONSTRAINT [CPK_property_exemption_dor_detail] PRIMARY KEY CLUSTERED ([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC, [item_type] ASC, [item_id] ASC),
    CONSTRAINT [FK_property_exemption_dor_detail_property_exemption] FOREIGN KEY ([exmpt_tax_yr], [owner_tax_yr], [sup_num], [prop_id], [owner_id], [exmpt_type_cd]) REFERENCES [dbo].[property_exemption] ([exmpt_tax_yr], [owner_tax_yr], [sup_num], [prop_id], [owner_id], [exmpt_type_cd])
);


GO

 
create trigger tr_property_exemption_dor_detail_update_ChangeLog
on property_exemption_dor_detail
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
 
declare @old_exmpt_tax_yr numeric(4,0)
declare @new_exmpt_tax_yr numeric(4,0)
declare @old_owner_tax_yr numeric(4,0)
declare @new_owner_tax_yr numeric(4,0)
declare @old_sup_num int
declare @new_sup_num int
declare @old_prop_id int
declare @new_prop_id int
declare @old_owner_id int
declare @new_owner_id int
declare @old_exmpt_type_cd varchar(10)
declare @new_exmpt_type_cd varchar(10)
declare @old_item_type char(1)
declare @new_item_type char(1)
declare @old_item_id int
declare @new_item_id int
declare @old_value_type char(1)
declare @new_value_type char(1)
declare @old_exmpt_amount numeric(12,0)
declare @new_exmpt_amount numeric(12,0)
declare @old_exmpt_percent numeric(9,6)
declare @new_exmpt_percent numeric(9,6)
 
declare curRows cursor
for
     select d.exmpt_tax_yr, d.owner_tax_yr, d.sup_num, d.prop_id, d.owner_id, d.exmpt_type_cd, d.item_type, d.item_id, d.value_type, d.exmpt_amount, d.exmpt_percent, 
            i.exmpt_tax_yr, i.owner_tax_yr, i.sup_num, i.prop_id, i.owner_id, i.exmpt_type_cd, i.item_type, i.item_id, i.value_type, i.exmpt_amount, i.exmpt_percent
from deleted as d
join inserted as i on 
     d.exmpt_tax_yr = i.exmpt_tax_yr and
     d.owner_tax_yr = i.owner_tax_yr and
     d.sup_num = i.sup_num and
     d.prop_id = i.prop_id and
     d.owner_id = i.owner_id and
     d.exmpt_type_cd = i.exmpt_type_cd and
     d.item_type = i.item_type and
     d.item_id = i.item_id
for read only
 
open curRows
fetch next from curRows into @old_exmpt_tax_yr, @old_owner_tax_yr, @old_sup_num, @old_prop_id, @old_owner_id, @old_exmpt_type_cd, @old_item_type, @old_item_id, @old_value_type, @old_exmpt_amount, @old_exmpt_percent, 
                             @new_exmpt_tax_yr, @new_owner_tax_yr, @new_sup_num, @new_prop_id, @new_owner_id, @new_exmpt_type_cd, @new_item_type, @new_item_id, @new_value_type, @new_exmpt_amount, @new_exmpt_percent
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
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
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'exmpt_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 1829, convert(varchar(255), @old_exmpt_tax_yr), convert(varchar(255), @new_exmpt_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
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
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'owner_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 3505, convert(varchar(255), @old_owner_tax_yr), convert(varchar(255), @new_owner_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
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
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
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
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
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
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 3493, convert(varchar(255), @old_owner_id), convert(varchar(255), @new_owner_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
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
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'exmpt_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 1830, convert(varchar(255), @old_exmpt_type_cd), convert(varchar(255), @new_exmpt_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
          end
     end
 
     if (
          @old_item_type <> @new_item_type
          or
          ( @old_item_type is null and @new_item_type is not null ) 
          or
          ( @old_item_type is not null and @new_item_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'item_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 9981, convert(varchar(255), @old_item_type), convert(varchar(255), @new_item_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
          end
     end
 
     if (
          @old_item_id <> @new_item_id
          or
          ( @old_item_id is null and @new_item_id is not null ) 
          or
          ( @old_item_id is not null and @new_item_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'item_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 9982, convert(varchar(255), @old_item_id), convert(varchar(255), @new_item_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
          end
     end
 
     if (
          @old_value_type <> @new_value_type
          or
          ( @old_value_type is null and @new_value_type is not null ) 
          or
          ( @old_value_type is not null and @new_value_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'value_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 5494, convert(varchar(255), @old_value_type), convert(varchar(255), @new_value_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
          end
     end
 
     if (
          @old_exmpt_amount <> @new_exmpt_amount
          or
          ( @old_exmpt_amount is null and @new_exmpt_amount is not null ) 
          or
          ( @old_exmpt_amount is not null and @new_exmpt_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'exmpt_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 9983, convert(varchar(255), @old_exmpt_amount), convert(varchar(255), @new_exmpt_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
          end
     end
 
     if (
          @old_exmpt_percent <> @new_exmpt_percent
          or
          ( @old_exmpt_percent is null and @new_exmpt_percent is not null ) 
          or
          ( @old_exmpt_percent is not null and @new_exmpt_percent is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption_dor_detail' and
                    chg_log_columns = 'exmpt_percent' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1696, 9984, convert(varchar(255), @old_exmpt_percent), convert(varchar(255), @new_exmpt_percent), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @new_item_type), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @new_item_id), @new_item_id)
          end
     end
 
     fetch next from curRows into @old_exmpt_tax_yr, @old_owner_tax_yr, @old_sup_num, @old_prop_id, @old_owner_id, @old_exmpt_type_cd, @old_item_type, @old_item_id, @old_value_type, @old_exmpt_amount, @old_exmpt_percent, 
                                  @new_exmpt_tax_yr, @new_owner_tax_yr, @new_sup_num, @new_prop_id, @new_owner_id, @new_exmpt_type_cd, @new_item_type, @new_item_id, @new_value_type, @new_exmpt_amount, @new_exmpt_percent
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_property_exemption_dor_detail_insert_ChangeLog
on property_exemption_dor_detail
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
 
declare @exmpt_tax_yr numeric(4,0)
declare @owner_tax_yr numeric(4,0)
declare @sup_num int
declare @prop_id int
declare @owner_id int
declare @exmpt_type_cd varchar(10)
declare @item_type char(1)
declare @item_id int
declare @value_type char(1)
declare @exmpt_amount numeric(12,0)
declare @exmpt_percent numeric(9,6)
 
declare curRows cursor
for
     select exmpt_tax_yr, owner_tax_yr, sup_num, prop_id, owner_id, exmpt_type_cd, item_type, item_id, value_type, exmpt_amount, exmpt_percent from inserted
for read only
 
open curRows
fetch next from curRows into @exmpt_tax_yr, @owner_tax_yr, @sup_num, @prop_id, @owner_id, @exmpt_type_cd, @item_type, @item_id, @value_type, @exmpt_amount, @exmpt_percent
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'exmpt_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 1829, null, convert(varchar(255), @exmpt_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'owner_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 3505, null, convert(varchar(255), @owner_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 3493, null, convert(varchar(255), @owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'exmpt_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 1830, null, convert(varchar(255), @exmpt_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'item_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 9981, null, convert(varchar(255), @item_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'item_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 9982, null, convert(varchar(255), @item_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'value_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 5494, null, convert(varchar(255), @value_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'exmpt_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 9983, null, convert(varchar(255), @exmpt_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption_dor_detail' and
               chg_log_columns = 'exmpt_percent' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1696, 9984, null, convert(varchar(255), @exmpt_percent), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
     end
 
     fetch next from curRows into @exmpt_tax_yr, @owner_tax_yr, @sup_num, @prop_id, @owner_id, @exmpt_type_cd, @item_type, @item_id, @value_type, @exmpt_amount, @exmpt_percent
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_property_exemption_dor_detail_delete_ChangeLog
on property_exemption_dor_detail
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
          chg_log_tables = 'property_exemption_dor_detail' and
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
 
declare @exmpt_tax_yr numeric(4,0)
declare @owner_tax_yr numeric(4,0)
declare @sup_num int
declare @prop_id int
declare @owner_id int
declare @exmpt_type_cd varchar(10)
declare @item_type char(1)
declare @item_id int
 
declare curRows cursor
for
     select exmpt_tax_yr, owner_tax_yr, sup_num, prop_id, owner_id, exmpt_type_cd, item_type, item_id from deleted
for read only
 
open curRows
fetch next from curRows into @exmpt_tax_yr, @owner_tax_yr, @sup_num, @prop_id, @owner_id, @exmpt_type_cd, @item_type, @item_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1696, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9981, convert(varchar(24), @item_type), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9982, convert(varchar(24), @item_id), @item_id)
 
     fetch next from curRows into @exmpt_tax_yr, @owner_tax_yr, @sup_num, @prop_id, @owner_id, @exmpt_type_cd, @item_type, @item_id
end
 
close curRows
deallocate curRows

GO

