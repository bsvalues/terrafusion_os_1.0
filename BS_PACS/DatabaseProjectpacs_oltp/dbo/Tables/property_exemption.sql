CREATE TABLE [dbo].[property_exemption] (
    [prop_id]                     INT            NOT NULL,
    [owner_id]                    INT            NOT NULL,
    [exmpt_tax_yr]                NUMERIC (4)    NOT NULL,
    [owner_tax_yr]                NUMERIC (4)    NOT NULL,
    [prop_type_cd]                CHAR (5)       NOT NULL,
    [exmpt_type_cd]               VARCHAR (10)   NOT NULL,
    [applicant_nm]                VARCHAR (70)   NULL,
    [birth_dt]                    DATETIME       NULL,
    [spouse_birth_dt]             DATETIME       NULL,
    [prop_exmpt_dl_num]           VARCHAR (20)   NULL,
    [prop_exmpt_ss_num]           VARCHAR (11)   NULL,
    [effective_dt]                DATETIME       NULL,
    [termination_dt]              DATETIME       NULL,
    [apply_pct_owner]             NUMERIC (5, 2) NULL,
    [sup_num]                     INT            NOT NULL,
    [effective_tax_yr]            NUMERIC (4)    NULL,
    [qualify_yr]                  NUMERIC (4)    NULL,
    [sp_date_approved]            DATETIME       NULL,
    [sp_expiration_date]          DATETIME       NULL,
    [sp_comment]                  VARCHAR (5000) NULL,
    [sp_value_type]               CHAR (1)       NULL,
    [sp_value_option]             CHAR (1)       NULL,
    [absent_flag]                 BIT            CONSTRAINT [CDF_property_exemption_absent_flag] DEFAULT (0) NULL,
    [absent_expiration_date]      DATETIME       NULL,
    [absent_comment]              VARCHAR (255)  NULL,
    [deferral_date]               DATETIME       NULL,
    [apply_local_option_pct_only] CHAR (1)       CONSTRAINT [CDF_property_exemption_apply_local_option_pct_only] DEFAULT ('F') NULL,
    [apply_no_exemption_amount]   BIT            NULL,
    [exmpt_subtype_cd]            VARCHAR (10)   NULL,
    [exemption_pct]               NUMERIC (5, 2) NULL,
    [combined_disp_income]        NUMERIC (14)   NULL,
    [exempt_qualify_cd]           VARCHAR (10)   NULL,
    [review_request_date]         DATETIME       NULL,
    [review_status_cd]            VARCHAR (10)   NULL,
    [review_last_year]            NUMERIC (4)    NULL,
    [dor_value_type]              CHAR (1)       NULL,
    [dor_exmpt_amount]            NUMERIC (12)   NULL,
    [dor_exmpt_percent]           NUMERIC (9, 6) NULL,
    CONSTRAINT [CPK_property_exemption] PRIMARY KEY CLUSTERED ([exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [sup_num] ASC, [prop_id] ASC, [owner_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_exemption_exmpt_subtype_cd] FOREIGN KEY ([exmpt_subtype_cd]) REFERENCES [dbo].[exmpt_sub_type] ([exmpt_sub_type_cd]),
    CONSTRAINT [CFK_property_exemption_exmpt_type_cd] FOREIGN KEY ([exmpt_type_cd]) REFERENCES [dbo].[exmpt_type] ([exmpt_type_cd]),
    CONSTRAINT [CFK_property_exemption_prop_type_cd] FOREIGN KEY ([prop_type_cd]) REFERENCES [dbo].[property_type] ([prop_type_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_type_cd]
    ON [dbo].[property_exemption]([prop_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_exmpt_type_cd]
    ON [dbo].[property_exemption]([exmpt_type_cd] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[property_exemption]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

 
create trigger tr_property_exemption_insert_ChangeLog
on property_exemption
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
declare @prop_type_cd char(5)
declare @exmpt_type_cd varchar(10)
declare @applicant_nm varchar(70)
declare @birth_dt datetime
declare @spouse_birth_dt datetime
declare @prop_exmpt_dl_num varchar(20)
declare @prop_exmpt_ss_num varchar(11)
declare @effective_dt datetime
declare @termination_dt datetime
declare @apply_pct_owner numeric(5,2)
declare @sup_num int
declare @effective_tax_yr numeric(4,0)
declare @qualify_yr numeric(4,0)
declare @sp_date_approved datetime
declare @sp_expiration_date datetime
declare @sp_comment varchar(5000)
declare @sp_value_type char(1)
declare @sp_value_option char(1)
declare @absent_flag bit
declare @absent_expiration_date datetime
declare @absent_comment varchar(255)
declare @deferral_date datetime
declare @apply_local_option_pct_only char(1)
declare @apply_no_exemption_amount bit
declare @exmpt_subtype_cd varchar(10)
declare @exemption_pct numeric(5,2)
declare @combined_disp_income numeric(14,0)
declare @exempt_qualify_cd varchar(10)
declare @review_request_date datetime
declare @review_status_cd varchar(10)
declare @review_last_year numeric(4,0)
declare @dor_value_type char(1)
declare @dor_exmpt_amount numeric(12,0)
declare @dor_exmpt_percent numeric(9,6)
 
declare curRows cursor
for
     select prop_id, owner_id, case exmpt_tax_yr when 0 then @tvar_lFutureYear else exmpt_tax_yr end, case owner_tax_yr when 0 then @tvar_lFutureYear else owner_tax_yr end, prop_type_cd, exmpt_type_cd, applicant_nm, birth_dt, spouse_birth_dt, prop_exmpt_dl_num, prop_exmpt_ss_num, effective_dt, termination_dt, apply_pct_owner, sup_num, effective_tax_yr, qualify_yr, sp_date_approved, sp_expiration_date, sp_comment, sp_value_type, sp_value_option, absent_flag, absent_expiration_date, absent_comment, deferral_date, apply_local_option_pct_only, apply_no_exemption_amount, exmpt_subtype_cd, exemption_pct, combined_disp_income, exempt_qualify_cd, review_request_date, review_status_cd, review_last_year, dor_value_type, dor_exmpt_amount, dor_exmpt_percent from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @owner_id, @exmpt_tax_yr, @owner_tax_yr, @prop_type_cd, @exmpt_type_cd, @applicant_nm, @birth_dt, @spouse_birth_dt, @prop_exmpt_dl_num, @prop_exmpt_ss_num, @effective_dt, @termination_dt, @apply_pct_owner, @sup_num, @effective_tax_yr, @qualify_yr, @sp_date_approved, @sp_expiration_date, @sp_comment, @sp_value_type, @sp_value_option, @absent_flag, @absent_expiration_date, @absent_comment, @deferral_date, @apply_local_option_pct_only, @apply_no_exemption_amount, @exmpt_subtype_cd, @exemption_pct, @combined_disp_income, @exempt_qualify_cd, @review_request_date, @review_status_cd, @review_last_year, @dor_value_type, @dor_exmpt_amount, @dor_exmpt_percent
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = @exmpt_type_cd + ' - Owner: ' + a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @owner_id
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'owner_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 3493, null, convert(varchar(255), @owner_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'exmpt_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 1829, null, convert(varchar(255), @exmpt_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'owner_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 3505, null, convert(varchar(255), @owner_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'prop_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4079, null, convert(varchar(255), @prop_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'exmpt_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 1830, null, convert(varchar(255), @exmpt_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'applicant_nm' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 220, null, convert(varchar(255), @applicant_nm), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'birth_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 518, null, convert(varchar(255), @birth_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'spouse_birth_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4916, null, convert(varchar(255), @spouse_birth_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'prop_exmpt_dl_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4019, null, convert(varchar(255), @prop_exmpt_dl_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'prop_exmpt_ss_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4020, null, convert(varchar(255), @prop_exmpt_ss_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'effective_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 1427, null, convert(varchar(255), @effective_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'termination_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 5208, null, convert(varchar(255), @termination_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'apply_pct_owner' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 224, null, convert(varchar(255), @apply_pct_owner), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'effective_tax_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 1431, null, convert(varchar(255), @effective_tax_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'qualify_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4238, null, convert(varchar(255), @qualify_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'sp_date_approved' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4896, null, convert(varchar(255), @sp_date_approved), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'sp_expiration_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4897, null, convert(varchar(255), @sp_expiration_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'sp_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4895, null, convert(varchar(255), @sp_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'sp_value_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4901, null, convert(varchar(255), @sp_value_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'sp_value_option' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 4900, null, convert(varchar(255), @sp_value_option), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'absent_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 30, null, convert(varchar(255), @absent_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'absent_expiration_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 29, null, convert(varchar(255), @absent_expiration_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'absent_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 28, null, convert(varchar(255), @absent_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'deferral_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 5923, null, convert(varchar(255), @deferral_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'apply_local_option_pct_only' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 5922, null, convert(varchar(255), @apply_local_option_pct_only), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'apply_no_exemption_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9346, null, convert(varchar(255), @apply_no_exemption_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'exmpt_subtype_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9985, null, convert(varchar(255), @exmpt_subtype_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'exemption_pct' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9986, null, convert(varchar(255), @exemption_pct), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'combined_disp_income' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9987, null, convert(varchar(255), @combined_disp_income), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'exempt_qualify_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9988, null, convert(varchar(255), @exempt_qualify_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'review_request_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9989, null, convert(varchar(255), @review_request_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'review_status_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9990, null, convert(varchar(255), @review_status_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'review_last_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9991, null, convert(varchar(255), @review_last_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'dor_value_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9978, null, convert(varchar(255), @dor_value_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'dor_exmpt_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9979, null, convert(varchar(255), @dor_exmpt_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'property_exemption' and
               chg_log_columns = 'dor_exmpt_percent' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 648, 9980, null, convert(varchar(255), @dor_exmpt_percent), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
     end
 
     fetch next from curRows into @prop_id, @owner_id, @exmpt_tax_yr, @owner_tax_yr, @prop_type_cd, @exmpt_type_cd, @applicant_nm, @birth_dt, @spouse_birth_dt, @prop_exmpt_dl_num, @prop_exmpt_ss_num, @effective_dt, @termination_dt, @apply_pct_owner, @sup_num, @effective_tax_yr, @qualify_yr, @sp_date_approved, @sp_expiration_date, @sp_comment, @sp_value_type, @sp_value_option, @absent_flag, @absent_expiration_date, @absent_comment, @deferral_date, @apply_local_option_pct_only, @apply_no_exemption_amount, @exmpt_subtype_cd, @exemption_pct, @combined_disp_income, @exempt_qualify_cd, @review_request_date, @review_status_cd, @review_last_year, @dor_value_type, @dor_exmpt_amount, @dor_exmpt_percent
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_property_exemption_update_ChangeLog
on property_exemption
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
declare @old_prop_type_cd char(5)
declare @new_prop_type_cd char(5)
declare @old_exmpt_type_cd varchar(10)
declare @new_exmpt_type_cd varchar(10)
declare @old_applicant_nm varchar(70)
declare @new_applicant_nm varchar(70)
declare @old_birth_dt datetime
declare @new_birth_dt datetime
declare @old_spouse_birth_dt datetime
declare @new_spouse_birth_dt datetime
declare @old_prop_exmpt_dl_num varchar(20)
declare @new_prop_exmpt_dl_num varchar(20)
declare @old_prop_exmpt_ss_num varchar(11)
declare @new_prop_exmpt_ss_num varchar(11)
declare @old_effective_dt datetime
declare @new_effective_dt datetime
declare @old_termination_dt datetime
declare @new_termination_dt datetime
declare @old_apply_pct_owner numeric(5,2)
declare @new_apply_pct_owner numeric(5,2)
declare @old_sup_num int
declare @new_sup_num int
declare @old_effective_tax_yr numeric(4,0)
declare @new_effective_tax_yr numeric(4,0)
declare @old_qualify_yr numeric(4,0)
declare @new_qualify_yr numeric(4,0)
declare @old_sp_date_approved datetime
declare @new_sp_date_approved datetime
declare @old_sp_expiration_date datetime
declare @new_sp_expiration_date datetime
declare @old_sp_comment varchar(5000)
declare @new_sp_comment varchar(5000)
declare @old_sp_value_type char(1)
declare @new_sp_value_type char(1)
declare @old_sp_value_option char(1)
declare @new_sp_value_option char(1)
declare @old_absent_flag bit
declare @new_absent_flag bit
declare @old_absent_expiration_date datetime
declare @new_absent_expiration_date datetime
declare @old_absent_comment varchar(255)
declare @new_absent_comment varchar(255)
declare @old_deferral_date datetime
declare @new_deferral_date datetime
declare @old_apply_local_option_pct_only char(1)
declare @new_apply_local_option_pct_only char(1)
declare @old_apply_no_exemption_amount bit
declare @new_apply_no_exemption_amount bit
declare @old_exmpt_subtype_cd varchar(10)
declare @new_exmpt_subtype_cd varchar(10)
declare @old_exemption_pct numeric(5,2)
declare @new_exemption_pct numeric(5,2)
declare @old_combined_disp_income numeric(14,0)
declare @new_combined_disp_income numeric(14,0)
declare @old_exempt_qualify_cd varchar(10)
declare @new_exempt_qualify_cd varchar(10)
declare @old_review_request_date datetime
declare @new_review_request_date datetime
declare @old_review_status_cd varchar(10)
declare @new_review_status_cd varchar(10)
declare @old_review_last_year numeric(4,0)
declare @new_review_last_year numeric(4,0)
declare @old_dor_value_type char(1)
declare @new_dor_value_type char(1)
declare @old_dor_exmpt_amount numeric(12,0)
declare @new_dor_exmpt_amount numeric(12,0)
declare @old_dor_exmpt_percent numeric(9,6)
declare @new_dor_exmpt_percent numeric(9,6)
 
declare curRows cursor
for
     select d.prop_id, d.owner_id, case d.exmpt_tax_yr when 0 then @tvar_lFutureYear else d.exmpt_tax_yr end, case d.owner_tax_yr when 0 then @tvar_lFutureYear else d.owner_tax_yr end, d.prop_type_cd, d.exmpt_type_cd, d.applicant_nm, d.birth_dt, d.spouse_birth_dt, d.prop_exmpt_dl_num, d.prop_exmpt_ss_num, d.effective_dt, d.termination_dt, d.apply_pct_owner, d.sup_num, d.effective_tax_yr, d.qualify_yr, d.sp_date_approved, d.sp_expiration_date, d.sp_comment, d.sp_value_type, d.sp_value_option, d.absent_flag, d.absent_expiration_date, d.absent_comment, d.deferral_date, d.apply_local_option_pct_only, d.apply_no_exemption_amount, d.exmpt_subtype_cd, d.exemption_pct, d.combined_disp_income, d.exempt_qualify_cd, d.review_request_date, d.review_status_cd, d.review_last_year, d.dor_value_type, d.dor_exmpt_amount, d.dor_exmpt_percent, 
            i.prop_id, i.owner_id, case i.exmpt_tax_yr when 0 then @tvar_lFutureYear else i.exmpt_tax_yr end, case i.owner_tax_yr when 0 then @tvar_lFutureYear else i.owner_tax_yr end, i.prop_type_cd, i.exmpt_type_cd, i.applicant_nm, i.birth_dt, i.spouse_birth_dt, i.prop_exmpt_dl_num, i.prop_exmpt_ss_num, i.effective_dt, i.termination_dt, i.apply_pct_owner, i.sup_num, i.effective_tax_yr, i.qualify_yr, i.sp_date_approved, i.sp_expiration_date, i.sp_comment, i.sp_value_type, i.sp_value_option, i.absent_flag, i.absent_expiration_date, i.absent_comment, i.deferral_date, i.apply_local_option_pct_only, i.apply_no_exemption_amount, i.exmpt_subtype_cd, i.exemption_pct, i.combined_disp_income, i.exempt_qualify_cd, i.review_request_date, i.review_status_cd, i.review_last_year, i.dor_value_type, i.dor_exmpt_amount, i.dor_exmpt_percent
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.owner_id = i.owner_id and
     d.exmpt_tax_yr = i.exmpt_tax_yr and
     d.owner_tax_yr = i.owner_tax_yr and
     d.exmpt_type_cd = i.exmpt_type_cd and
     d.sup_num = i.sup_num
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_owner_id, @old_exmpt_tax_yr, @old_owner_tax_yr, @old_prop_type_cd, @old_exmpt_type_cd, @old_applicant_nm, @old_birth_dt, @old_spouse_birth_dt, @old_prop_exmpt_dl_num, @old_prop_exmpt_ss_num, @old_effective_dt, @old_termination_dt, @old_apply_pct_owner, @old_sup_num, @old_effective_tax_yr, @old_qualify_yr, @old_sp_date_approved, @old_sp_expiration_date, @old_sp_comment, @old_sp_value_type, @old_sp_value_option, @old_absent_flag, @old_absent_expiration_date, @old_absent_comment, @old_deferral_date, @old_apply_local_option_pct_only, @old_apply_no_exemption_amount, @old_exmpt_subtype_cd, @old_exemption_pct, @old_combined_disp_income, @old_exempt_qualify_cd, @old_review_request_date, @old_review_status_cd, @old_review_last_year, @old_dor_value_type, @old_dor_exmpt_amount, @old_dor_exmpt_percent, 
                             @new_prop_id, @new_owner_id, @new_exmpt_tax_yr, @new_owner_tax_yr, @new_prop_type_cd, @new_exmpt_type_cd, @new_applicant_nm, @new_birth_dt, @new_spouse_birth_dt, @new_prop_exmpt_dl_num, @new_prop_exmpt_ss_num, @new_effective_dt, @new_termination_dt, @new_apply_pct_owner, @new_sup_num, @new_effective_tax_yr, @new_qualify_yr, @new_sp_date_approved, @new_sp_expiration_date, @new_sp_comment, @new_sp_value_type, @new_sp_value_option, @new_absent_flag, @new_absent_expiration_date, @new_absent_comment, @new_deferral_date, @new_apply_local_option_pct_only, @new_apply_no_exemption_amount, @new_exmpt_subtype_cd, @new_exemption_pct, @new_combined_disp_income, @new_exempt_qualify_cd, @new_review_request_date, @new_review_status_cd, @new_review_last_year, @new_dor_value_type, @new_dor_exmpt_amount, @new_dor_exmpt_percent
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = @new_exmpt_type_cd + ' - Owner: ' + a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @new_owner_id
 
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
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'owner_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 3493, convert(varchar(255), @old_owner_id), convert(varchar(255), @new_owner_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'exmpt_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 1829, convert(varchar(255), @old_exmpt_tax_yr), convert(varchar(255), @new_exmpt_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'owner_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 3505, convert(varchar(255), @old_owner_tax_yr), convert(varchar(255), @new_owner_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'prop_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4079, convert(varchar(255), @old_prop_type_cd), convert(varchar(255), @new_prop_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'exmpt_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 1830, convert(varchar(255), @old_exmpt_type_cd), convert(varchar(255), @new_exmpt_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_applicant_nm <> @new_applicant_nm
          or
          ( @old_applicant_nm is null and @new_applicant_nm is not null ) 
          or
          ( @old_applicant_nm is not null and @new_applicant_nm is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'applicant_nm' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 220, convert(varchar(255), @old_applicant_nm), convert(varchar(255), @new_applicant_nm), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_birth_dt <> @new_birth_dt
          or
          ( @old_birth_dt is null and @new_birth_dt is not null ) 
          or
          ( @old_birth_dt is not null and @new_birth_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'birth_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 518, convert(varchar(255), @old_birth_dt), convert(varchar(255), @new_birth_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_spouse_birth_dt <> @new_spouse_birth_dt
          or
          ( @old_spouse_birth_dt is null and @new_spouse_birth_dt is not null ) 
          or
          ( @old_spouse_birth_dt is not null and @new_spouse_birth_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'spouse_birth_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4916, convert(varchar(255), @old_spouse_birth_dt), convert(varchar(255), @new_spouse_birth_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_prop_exmpt_dl_num <> @new_prop_exmpt_dl_num
          or
          ( @old_prop_exmpt_dl_num is null and @new_prop_exmpt_dl_num is not null ) 
          or
          ( @old_prop_exmpt_dl_num is not null and @new_prop_exmpt_dl_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'prop_exmpt_dl_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4019, convert(varchar(255), @old_prop_exmpt_dl_num), convert(varchar(255), @new_prop_exmpt_dl_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_prop_exmpt_ss_num <> @new_prop_exmpt_ss_num
          or
          ( @old_prop_exmpt_ss_num is null and @new_prop_exmpt_ss_num is not null ) 
          or
          ( @old_prop_exmpt_ss_num is not null and @new_prop_exmpt_ss_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'prop_exmpt_ss_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4020, convert(varchar(255), @old_prop_exmpt_ss_num), convert(varchar(255), @new_prop_exmpt_ss_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_effective_dt <> @new_effective_dt
          or
          ( @old_effective_dt is null and @new_effective_dt is not null ) 
          or
          ( @old_effective_dt is not null and @new_effective_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'effective_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 1427, convert(varchar(255), @old_effective_dt), convert(varchar(255), @new_effective_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_termination_dt <> @new_termination_dt
          or
          ( @old_termination_dt is null and @new_termination_dt is not null ) 
          or
          ( @old_termination_dt is not null and @new_termination_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'termination_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 5208, convert(varchar(255), @old_termination_dt), convert(varchar(255), @new_termination_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_apply_pct_owner <> @new_apply_pct_owner
          or
          ( @old_apply_pct_owner is null and @new_apply_pct_owner is not null ) 
          or
          ( @old_apply_pct_owner is not null and @new_apply_pct_owner is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'apply_pct_owner' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 224, convert(varchar(255), @old_apply_pct_owner), convert(varchar(255), @new_apply_pct_owner), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
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
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_effective_tax_yr <> @new_effective_tax_yr
          or
          ( @old_effective_tax_yr is null and @new_effective_tax_yr is not null ) 
          or
          ( @old_effective_tax_yr is not null and @new_effective_tax_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'effective_tax_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 1431, convert(varchar(255), @old_effective_tax_yr), convert(varchar(255), @new_effective_tax_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_qualify_yr <> @new_qualify_yr
          or
          ( @old_qualify_yr is null and @new_qualify_yr is not null ) 
          or
          ( @old_qualify_yr is not null and @new_qualify_yr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'qualify_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4238, convert(varchar(255), @old_qualify_yr), convert(varchar(255), @new_qualify_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_sp_date_approved <> @new_sp_date_approved
          or
          ( @old_sp_date_approved is null and @new_sp_date_approved is not null ) 
          or
          ( @old_sp_date_approved is not null and @new_sp_date_approved is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'sp_date_approved' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4896, convert(varchar(255), @old_sp_date_approved), convert(varchar(255), @new_sp_date_approved), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_sp_expiration_date <> @new_sp_expiration_date
          or
          ( @old_sp_expiration_date is null and @new_sp_expiration_date is not null ) 
          or
          ( @old_sp_expiration_date is not null and @new_sp_expiration_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'sp_expiration_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4897, convert(varchar(255), @old_sp_expiration_date), convert(varchar(255), @new_sp_expiration_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_sp_comment <> @new_sp_comment
          or
          ( @old_sp_comment is null and @new_sp_comment is not null ) 
          or
          ( @old_sp_comment is not null and @new_sp_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'sp_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4895, convert(varchar(255), @old_sp_comment), convert(varchar(255), @new_sp_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_sp_value_type <> @new_sp_value_type
          or
          ( @old_sp_value_type is null and @new_sp_value_type is not null ) 
          or
          ( @old_sp_value_type is not null and @new_sp_value_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'sp_value_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4901, convert(varchar(255), @old_sp_value_type), convert(varchar(255), @new_sp_value_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_sp_value_option <> @new_sp_value_option
          or
          ( @old_sp_value_option is null and @new_sp_value_option is not null ) 
          or
          ( @old_sp_value_option is not null and @new_sp_value_option is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'sp_value_option' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 4900, convert(varchar(255), @old_sp_value_option), convert(varchar(255), @new_sp_value_option), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_absent_flag <> @new_absent_flag
          or
          ( @old_absent_flag is null and @new_absent_flag is not null ) 
          or
          ( @old_absent_flag is not null and @new_absent_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'absent_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 30, convert(varchar(255), @old_absent_flag), convert(varchar(255), @new_absent_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_absent_expiration_date <> @new_absent_expiration_date
          or
          ( @old_absent_expiration_date is null and @new_absent_expiration_date is not null ) 
          or
          ( @old_absent_expiration_date is not null and @new_absent_expiration_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'absent_expiration_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 29, convert(varchar(255), @old_absent_expiration_date), convert(varchar(255), @new_absent_expiration_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_absent_comment <> @new_absent_comment
          or
          ( @old_absent_comment is null and @new_absent_comment is not null ) 
          or
          ( @old_absent_comment is not null and @new_absent_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'absent_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 28, convert(varchar(255), @old_absent_comment), convert(varchar(255), @new_absent_comment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_deferral_date <> @new_deferral_date
          or
          ( @old_deferral_date is null and @new_deferral_date is not null ) 
          or
          ( @old_deferral_date is not null and @new_deferral_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'deferral_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 5923, convert(varchar(255), @old_deferral_date), convert(varchar(255), @new_deferral_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_apply_local_option_pct_only <> @new_apply_local_option_pct_only
          or
          ( @old_apply_local_option_pct_only is null and @new_apply_local_option_pct_only is not null ) 
          or
          ( @old_apply_local_option_pct_only is not null and @new_apply_local_option_pct_only is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'apply_local_option_pct_only' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 5922, convert(varchar(255), @old_apply_local_option_pct_only), convert(varchar(255), @new_apply_local_option_pct_only), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_apply_no_exemption_amount <> @new_apply_no_exemption_amount
          or
          ( @old_apply_no_exemption_amount is null and @new_apply_no_exemption_amount is not null ) 
          or
          ( @old_apply_no_exemption_amount is not null and @new_apply_no_exemption_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'apply_no_exemption_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9346, convert(varchar(255), @old_apply_no_exemption_amount), convert(varchar(255), @new_apply_no_exemption_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_exmpt_subtype_cd <> @new_exmpt_subtype_cd
          or
          ( @old_exmpt_subtype_cd is null and @new_exmpt_subtype_cd is not null ) 
          or
          ( @old_exmpt_subtype_cd is not null and @new_exmpt_subtype_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'exmpt_subtype_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9985, convert(varchar(255), @old_exmpt_subtype_cd), convert(varchar(255), @new_exmpt_subtype_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_exemption_pct <> @new_exemption_pct
          or
          ( @old_exemption_pct is null and @new_exemption_pct is not null ) 
          or
          ( @old_exemption_pct is not null and @new_exemption_pct is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'exemption_pct' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9986, convert(varchar(255), @old_exemption_pct), convert(varchar(255), @new_exemption_pct), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_combined_disp_income <> @new_combined_disp_income
          or
          ( @old_combined_disp_income is null and @new_combined_disp_income is not null ) 
          or
          ( @old_combined_disp_income is not null and @new_combined_disp_income is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'combined_disp_income' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9987, convert(varchar(255), @old_combined_disp_income), convert(varchar(255), @new_combined_disp_income), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_exempt_qualify_cd <> @new_exempt_qualify_cd
          or
          ( @old_exempt_qualify_cd is null and @new_exempt_qualify_cd is not null ) 
          or
          ( @old_exempt_qualify_cd is not null and @new_exempt_qualify_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'exempt_qualify_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9988, convert(varchar(255), @old_exempt_qualify_cd), convert(varchar(255), @new_exempt_qualify_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_review_request_date <> @new_review_request_date
          or
          ( @old_review_request_date is null and @new_review_request_date is not null ) 
          or
          ( @old_review_request_date is not null and @new_review_request_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'review_request_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9989, convert(varchar(255), @old_review_request_date), convert(varchar(255), @new_review_request_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_review_status_cd <> @new_review_status_cd
          or
          ( @old_review_status_cd is null and @new_review_status_cd is not null ) 
          or
          ( @old_review_status_cd is not null and @new_review_status_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'review_status_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9990, convert(varchar(255), @old_review_status_cd), convert(varchar(255), @new_review_status_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_review_last_year <> @new_review_last_year
          or
          ( @old_review_last_year is null and @new_review_last_year is not null ) 
          or
          ( @old_review_last_year is not null and @new_review_last_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'review_last_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9991, convert(varchar(255), @old_review_last_year), convert(varchar(255), @new_review_last_year), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_dor_value_type <> @new_dor_value_type
          or
          ( @old_dor_value_type is null and @new_dor_value_type is not null ) 
          or
          ( @old_dor_value_type is not null and @new_dor_value_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'dor_value_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9978, convert(varchar(255), @old_dor_value_type), convert(varchar(255), @new_dor_value_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_dor_exmpt_amount <> @new_dor_exmpt_amount
          or
          ( @old_dor_exmpt_amount is null and @new_dor_exmpt_amount is not null ) 
          or
          ( @old_dor_exmpt_amount is not null and @new_dor_exmpt_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'dor_exmpt_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9979, convert(varchar(255), @old_dor_exmpt_amount), convert(varchar(255), @new_dor_exmpt_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     if (
          @old_dor_exmpt_percent <> @new_dor_exmpt_percent
          or
          ( @old_dor_exmpt_percent is null and @new_dor_exmpt_percent is not null ) 
          or
          ( @old_dor_exmpt_percent is not null and @new_dor_exmpt_percent is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'property_exemption' and
                    chg_log_columns = 'dor_exmpt_percent' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 648, 9980, convert(varchar(255), @old_dor_exmpt_percent), convert(varchar(255), @new_dor_exmpt_percent), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @new_owner_id), @new_owner_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @new_exmpt_tax_yr), case when @new_exmpt_tax_yr > @tvar_intMin and @new_exmpt_tax_yr < @tvar_intMax then convert(int, round(@new_exmpt_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @new_owner_tax_yr), case when @new_owner_tax_yr > @tvar_intMin and @new_owner_tax_yr < @tvar_intMax then convert(int, round(@new_owner_tax_yr, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @new_exmpt_type_cd), 0)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @new_sup_num), @new_sup_num)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_owner_id, @old_exmpt_tax_yr, @old_owner_tax_yr, @old_prop_type_cd, @old_exmpt_type_cd, @old_applicant_nm, @old_birth_dt, @old_spouse_birth_dt, @old_prop_exmpt_dl_num, @old_prop_exmpt_ss_num, @old_effective_dt, @old_termination_dt, @old_apply_pct_owner, @old_sup_num, @old_effective_tax_yr, @old_qualify_yr, @old_sp_date_approved, @old_sp_expiration_date, @old_sp_comment, @old_sp_value_type, @old_sp_value_option, @old_absent_flag, @old_absent_expiration_date, @old_absent_comment, @old_deferral_date, @old_apply_local_option_pct_only, @old_apply_no_exemption_amount, @old_exmpt_subtype_cd, @old_exemption_pct, @old_combined_disp_income, @old_exempt_qualify_cd, @old_review_request_date, @old_review_status_cd, @old_review_last_year, @old_dor_value_type, @old_dor_exmpt_amount, @old_dor_exmpt_percent, 
                                  @new_prop_id, @new_owner_id, @new_exmpt_tax_yr, @new_owner_tax_yr, @new_prop_type_cd, @new_exmpt_type_cd, @new_applicant_nm, @new_birth_dt, @new_spouse_birth_dt, @new_prop_exmpt_dl_num, @new_prop_exmpt_ss_num, @new_effective_dt, @new_termination_dt, @new_apply_pct_owner, @new_sup_num, @new_effective_tax_yr, @new_qualify_yr, @new_sp_date_approved, @new_sp_expiration_date, @new_sp_comment, @new_sp_value_type, @new_sp_value_option, @new_absent_flag, @new_absent_expiration_date, @new_absent_comment, @new_deferral_date, @new_apply_local_option_pct_only, @new_apply_no_exemption_amount, @new_exmpt_subtype_cd, @new_exemption_pct, @new_combined_disp_income, @new_exempt_qualify_cd, @new_review_request_date, @new_review_status_cd, @new_review_last_year, @new_dor_value_type, @new_dor_exmpt_amount, @new_dor_exmpt_percent
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_property_exemption_delete_ChangeLog
on property_exemption
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
          chg_log_tables = 'property_exemption' and
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
 
declare @prop_id int
declare @owner_id int
declare @exmpt_tax_yr numeric(4,0)
declare @owner_tax_yr numeric(4,0)
declare @exmpt_type_cd varchar(10)
declare @sup_num int
 
declare curRows cursor
for
     select prop_id, owner_id, case exmpt_tax_yr when 0 then @tvar_lFutureYear else exmpt_tax_yr end, case owner_tax_yr when 0 then @tvar_lFutureYear else owner_tax_yr end, exmpt_type_cd, sup_num from deleted
for read only
 
open curRows
fetch next from curRows into @prop_id, @owner_id, @exmpt_tax_yr, @owner_tax_yr, @exmpt_type_cd, @sup_num
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = @exmpt_type_cd + ' - Owner: ' + a.file_as_name
     from account as a with(nolock)
     where a.acct_id = @owner_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 648, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3493, convert(varchar(24), @owner_id), @owner_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1829, convert(varchar(24), @exmpt_tax_yr), case when @exmpt_tax_yr > @tvar_intMin and @exmpt_tax_yr < @tvar_intMax then convert(int, round(@exmpt_tax_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 3505, convert(varchar(24), @owner_tax_yr), case when @owner_tax_yr > @tvar_intMin and @owner_tax_yr < @tvar_intMax then convert(int, round(@owner_tax_yr, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 1830, convert(varchar(24), @exmpt_type_cd), 0)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 5002, convert(varchar(24), @sup_num), @sup_num)
 
     fetch next from curRows into @prop_id, @owner_id, @exmpt_tax_yr, @owner_tax_yr, @exmpt_type_cd, @sup_num
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'A=Amount, P=Percent, R=Partial', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_exemption', @level2type = N'COLUMN', @level2name = N'dor_value_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'SNR/DSBL Exemption Review Request Date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_exemption', @level2type = N'COLUMN', @level2name = N'review_request_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exempt an amount from the whole property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_exemption', @level2type = N'COLUMN', @level2name = N'dor_exmpt_amount';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exempt a percentage of the whole property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_exemption', @level2type = N'COLUMN', @level2name = N'dor_exmpt_percent';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'SNR/DSBL Exemption Review Status Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_exemption', @level2type = N'COLUMN', @level2name = N'review_status_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'SNR/DSBL Exemption Review Last Year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_exemption', @level2type = N'COLUMN', @level2name = N'review_last_year';


GO

