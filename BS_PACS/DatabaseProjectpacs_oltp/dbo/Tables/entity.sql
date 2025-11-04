CREATE TABLE [dbo].[entity] (
    [entity_id]              INT             NOT NULL,
    [entity_cd]              CHAR (5)        NOT NULL,
    [entity_type_cd]         CHAR (5)        NOT NULL,
    [entity_disb_bal]        NUMERIC (14, 2) NULL,
    [taxing_unit_num]        VARCHAR (50)    NULL,
    [mbl_hm_submission]      CHAR (1)        NULL,
    [freeports_allowed]      CHAR (1)        NULL,
    [ptd_multi_unit]         CHAR (1)        NULL,
    [appr_company_entity_cd] CHAR (5)        NULL,
    [refund_default_flag]    CHAR (1)        NULL,
    [weed_control]           CHAR (1)        NULL,
    [fiscal_begin_date]      DATETIME        NULL,
    [fiscal_end_date]        DATETIME        NULL,
    [fiscal_year]            VARCHAR (10)    NULL,
    [county_taxing_unit_ind] VARCHAR (1)     NULL,
    [collector_id]           INT             NULL,
    [rendition_entity]       BIT             NULL,
    [enable_timber_78]       BIT             NULL,
    CONSTRAINT [CPK_entity] PRIMARY KEY CLUSTERED ([entity_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_entity_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_entity_entity_type_cd] FOREIGN KEY ([entity_type_cd]) REFERENCES [dbo].[entity_type] ([entity_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_taxing_unit_num]
    ON [dbo].[entity]([taxing_unit_num] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_entity_type_cd]
    ON [dbo].[entity]([entity_type_cd] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_entity_delete_ChangeLog
on entity
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
          chg_log_tables = 'entity' and
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
 
declare curRows cursor
for
     select entity_id from deleted
for read only
 
open curRows
fetch next from curRows into @entity_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = entity_cd
     from entity with(nolock)
     where entity_id = @entity_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 244, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
 
     fetch next from curRows into @entity_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_entity_delete_insert_update_MemTable
on entity
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
where szTableName = 'entity'

GO



create trigger tr_entity_update_ChangeLog
on entity
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
declare @old_entity_cd char(5)
declare @new_entity_cd char(5)
declare @old_entity_type_cd char(5)
declare @new_entity_type_cd char(5)
declare @old_entity_disb_bal numeric(14,2)
declare @new_entity_disb_bal numeric(14,2)
declare @old_taxing_unit_num varchar(50)
declare @new_taxing_unit_num varchar(50)
declare @old_mbl_hm_submission char(1)
declare @new_mbl_hm_submission char(1)
declare @old_freeports_allowed char(1)
declare @new_freeports_allowed char(1)
declare @old_ptd_multi_unit char(1)
declare @new_ptd_multi_unit char(1)
declare @old_appr_company_entity_cd char(5)
declare @new_appr_company_entity_cd char(5)
declare @old_refund_default_flag char(1)
declare @new_refund_default_flag char(1)
declare @old_weed_control char(1)
declare @new_weed_control char(1)
declare @old_fiscal_begin_date datetime
declare @new_fiscal_begin_date datetime
declare @old_fiscal_end_date datetime
declare @new_fiscal_end_date datetime
declare @old_fiscal_year varchar(10)
declare @new_fiscal_year varchar(10)
declare @old_county_taxing_unit_ind varchar(1)
declare @new_county_taxing_unit_ind varchar(1)
declare @old_collector_id int
declare @new_collector_id int
 
declare curRows cursor
for
     select d.entity_id, d.entity_cd, d.entity_type_cd, d.entity_disb_bal, d.taxing_unit_num, d.mbl_hm_submission, d.freeports_allowed, d.ptd_multi_unit, d.appr_company_entity_cd, d.refund_default_flag, d.weed_control, d.fiscal_begin_date, d.fiscal_end_date, d.fiscal_year, d.county_taxing_unit_ind, d.collector_id, i.entity_id, i.entity_cd, i.entity_type_cd, i.entity_disb_bal, i.taxing_unit_num, i.mbl_hm_submission, i.freeports_allowed, i.ptd_multi_unit, i.appr_company_entity_cd, i.refund_default_flag, i.weed_control, i.fiscal_begin_date, i.fiscal_end_date, i.fiscal_year, i.county_taxing_unit_ind, i.collector_id
from deleted as d
join inserted as i on 
     d.entity_id = i.entity_id
for read only
 
open curRows
fetch next from curRows into @old_entity_id, @old_entity_cd, @old_entity_type_cd, @old_entity_disb_bal, @old_taxing_unit_num, @old_mbl_hm_submission, @old_freeports_allowed, @old_ptd_multi_unit, @old_appr_company_entity_cd, @old_refund_default_flag, @old_weed_control, @old_fiscal_begin_date, @old_fiscal_end_date, @old_fiscal_year, @old_county_taxing_unit_ind, @old_collector_id, @new_entity_id, @new_entity_cd, @new_entity_type_cd, @new_entity_disb_bal, @new_taxing_unit_num, @new_mbl_hm_submission, @new_freeports_allowed, @new_ptd_multi_unit, @new_appr_company_entity_cd, @new_refund_default_flag, @new_weed_control, @new_fiscal_begin_date, @new_fiscal_end_date, @new_fiscal_year, @new_county_taxing_unit_ind, @new_collector_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_entity_cd
 
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
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'entity_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 1757, convert(varchar(255), @old_entity_id), convert(varchar(255), @new_entity_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_entity_cd <> @new_entity_cd
          or
          ( @old_entity_cd is null and @new_entity_cd is not null ) 
          or
          ( @old_entity_cd is not null and @new_entity_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'entity_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 1750, convert(varchar(255), @old_entity_cd), convert(varchar(255), @new_entity_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_entity_type_cd <> @new_entity_type_cd
          or
          ( @old_entity_type_cd is null and @new_entity_type_cd is not null ) 
          or
          ( @old_entity_type_cd is not null and @new_entity_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'entity_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 1766, convert(varchar(255), @old_entity_type_cd), convert(varchar(255), @new_entity_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_entity_disb_bal <> @new_entity_disb_bal
          or
          ( @old_entity_disb_bal is null and @new_entity_disb_bal is not null ) 
          or
          ( @old_entity_disb_bal is not null and @new_entity_disb_bal is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'entity_disb_bal' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 1753, convert(varchar(255), @old_entity_disb_bal), convert(varchar(255), @new_entity_disb_bal) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_taxing_unit_num <> @new_taxing_unit_num
          or
          ( @old_taxing_unit_num is null and @new_taxing_unit_num is not null ) 
          or
          ( @old_taxing_unit_num is not null and @new_taxing_unit_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'taxing_unit_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 5174, convert(varchar(255), @old_taxing_unit_num), convert(varchar(255), @new_taxing_unit_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_mbl_hm_submission <> @new_mbl_hm_submission
          or
          ( @old_mbl_hm_submission is null and @new_mbl_hm_submission is not null ) 
          or
          ( @old_mbl_hm_submission is not null and @new_mbl_hm_submission is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'mbl_hm_submission' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 3035, convert(varchar(255), @old_mbl_hm_submission), convert(varchar(255), @new_mbl_hm_submission) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_freeports_allowed <> @new_freeports_allowed
          or
          ( @old_freeports_allowed is null and @new_freeports_allowed is not null ) 
          or
          ( @old_freeports_allowed is not null and @new_freeports_allowed is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'freeports_allowed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 1967, convert(varchar(255), @old_freeports_allowed), convert(varchar(255), @new_freeports_allowed) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_ptd_multi_unit <> @new_ptd_multi_unit
          or
          ( @old_ptd_multi_unit is null and @new_ptd_multi_unit is not null ) 
          or
          ( @old_ptd_multi_unit is not null and @new_ptd_multi_unit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'ptd_multi_unit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 4177, convert(varchar(255), @old_ptd_multi_unit), convert(varchar(255), @new_ptd_multi_unit) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_appr_company_entity_cd <> @new_appr_company_entity_cd
          or
          ( @old_appr_company_entity_cd is null and @new_appr_company_entity_cd is not null ) 
          or
          ( @old_appr_company_entity_cd is not null and @new_appr_company_entity_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'appr_company_entity_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 229, convert(varchar(255), @old_appr_company_entity_cd), convert(varchar(255), @new_appr_company_entity_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_refund_default_flag <> @new_refund_default_flag
          or
          ( @old_refund_default_flag is null and @new_refund_default_flag is not null ) 
          or
          ( @old_refund_default_flag is not null and @new_refund_default_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'refund_default_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 4341, convert(varchar(255), @old_refund_default_flag), convert(varchar(255), @new_refund_default_flag) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
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
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'weed_control' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 5529, convert(varchar(255), @old_weed_control), convert(varchar(255), @new_weed_control) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_fiscal_begin_date <> @new_fiscal_begin_date
          or
          ( @old_fiscal_begin_date is null and @new_fiscal_begin_date is not null ) 
          or
          ( @old_fiscal_begin_date is not null and @new_fiscal_begin_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'fiscal_begin_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 1922, convert(varchar(255), @old_fiscal_begin_date), convert(varchar(255), @new_fiscal_begin_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_fiscal_end_date <> @new_fiscal_end_date
          or
          ( @old_fiscal_end_date is null and @new_fiscal_end_date is not null ) 
          or
          ( @old_fiscal_end_date is not null and @new_fiscal_end_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'fiscal_end_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 1924, convert(varchar(255), @old_fiscal_end_date), convert(varchar(255), @new_fiscal_end_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_fiscal_year <> @new_fiscal_year
          or
          ( @old_fiscal_year is null and @new_fiscal_year is not null ) 
          or
          ( @old_fiscal_year is not null and @new_fiscal_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'fiscal_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 1928, convert(varchar(255), @old_fiscal_year), convert(varchar(255), @new_fiscal_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_county_taxing_unit_ind <> @new_county_taxing_unit_ind
          or
          ( @old_county_taxing_unit_ind is null and @new_county_taxing_unit_ind is not null ) 
          or
          ( @old_county_taxing_unit_ind is not null and @new_county_taxing_unit_ind is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'county_taxing_unit_ind' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 915, convert(varchar(255), @old_county_taxing_unit_ind), convert(varchar(255), @new_county_taxing_unit_ind) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     if (
          @old_collector_id <> @new_collector_id
          or
          ( @old_collector_id is null and @new_collector_id is not null ) 
          or
          ( @old_collector_id is not null and @new_collector_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'entity' and
                    chg_log_columns = 'collector_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 244, 810, convert(varchar(255), @old_collector_id), convert(varchar(255), @new_collector_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @new_entity_id), @new_entity_id)
          end
     end
 
     fetch next from curRows into @old_entity_id, @old_entity_cd, @old_entity_type_cd, @old_entity_disb_bal, @old_taxing_unit_num, @old_mbl_hm_submission, @old_freeports_allowed, @old_ptd_multi_unit, @old_appr_company_entity_cd, @old_refund_default_flag, @old_weed_control, @old_fiscal_begin_date, @old_fiscal_end_date, @old_fiscal_year, @old_county_taxing_unit_ind, @old_collector_id, @new_entity_id, @new_entity_cd, @new_entity_type_cd, @new_entity_disb_bal, @new_taxing_unit_num, @new_mbl_hm_submission, @new_freeports_allowed, @new_ptd_multi_unit, @new_appr_company_entity_cd, @new_refund_default_flag, @new_weed_control, @new_fiscal_begin_date, @new_fiscal_end_date, @new_fiscal_year, @new_county_taxing_unit_ind, @new_collector_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_entity_insert_ChangeLog
on entity
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
declare @entity_cd char(5)
declare @entity_type_cd char(5)
declare @entity_disb_bal numeric(14,2)
declare @taxing_unit_num varchar(50)
declare @mbl_hm_submission char(1)
declare @freeports_allowed char(1)
declare @ptd_multi_unit char(1)
declare @appr_company_entity_cd char(5)
declare @refund_default_flag char(1)
declare @weed_control char(1)
declare @fiscal_begin_date datetime
declare @fiscal_end_date datetime
declare @fiscal_year varchar(10)
declare @county_taxing_unit_ind varchar(1)
declare @collector_id int
 
declare curRows cursor
for
     select entity_id, entity_cd, entity_type_cd, entity_disb_bal, taxing_unit_num, mbl_hm_submission, freeports_allowed, ptd_multi_unit, appr_company_entity_cd, refund_default_flag, weed_control, fiscal_begin_date, fiscal_end_date, fiscal_year, county_taxing_unit_ind, collector_id from inserted
for read only
 
open curRows
fetch next from curRows into @entity_id, @entity_cd, @entity_type_cd, @entity_disb_bal, @taxing_unit_num, @mbl_hm_submission, @freeports_allowed, @ptd_multi_unit, @appr_company_entity_cd, @refund_default_flag, @weed_control, @fiscal_begin_date, @fiscal_end_date, @fiscal_year, @county_taxing_unit_ind, @collector_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @entity_cd
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'entity_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 1757, null, convert(varchar(255), @entity_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'entity_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 1750, null, convert(varchar(255), @entity_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'entity_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 1766, null, convert(varchar(255), @entity_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'entity_disb_bal' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 1753, null, convert(varchar(255), @entity_disb_bal), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'taxing_unit_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 5174, null, convert(varchar(255), @taxing_unit_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'mbl_hm_submission' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 3035, null, convert(varchar(255), @mbl_hm_submission), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'freeports_allowed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 1967, null, convert(varchar(255), @freeports_allowed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'ptd_multi_unit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 4177, null, convert(varchar(255), @ptd_multi_unit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'appr_company_entity_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 229, null, convert(varchar(255), @appr_company_entity_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'refund_default_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 4341, null, convert(varchar(255), @refund_default_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'weed_control' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 5529, null, convert(varchar(255), @weed_control), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'fiscal_begin_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 1922, null, convert(varchar(255), @fiscal_begin_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)

     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'fiscal_end_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 1924, null, convert(varchar(255), @fiscal_end_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'fiscal_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 1928, null, convert(varchar(255), @fiscal_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'county_taxing_unit_ind' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 915, null, convert(varchar(255), @county_taxing_unit_ind), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'entity' and
               chg_log_columns = 'collector_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 244, 810, null, convert(varchar(255), @collector_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1757, convert(varchar(24), @entity_id), @entity_id)
     end
 
     fetch next from curRows into @entity_id, @entity_cd, @entity_type_cd, @entity_disb_bal, @taxing_unit_num, @mbl_hm_submission, @freeports_allowed, @ptd_multi_unit, @appr_company_entity_cd, @refund_default_flag, @weed_control, @fiscal_begin_date, @fiscal_end_date, @fiscal_year, @county_taxing_unit_ind, @collector_id
end
 
close curRows
deallocate curRows

GO

