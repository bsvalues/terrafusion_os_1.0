CREATE TABLE [dbo].[account] (
    [acct_id]                   INT            NOT NULL,
    [first_name]                VARCHAR (30)   NULL,
    [last_name]                 VARCHAR (30)   NULL,
    [file_as_name]              VARCHAR (70)   NULL,
    [dl_num]                    VARCHAR (10)   NULL,
    [dl_state]                  CHAR (2)       NULL,
    [dl_expir_dt]               DATETIME       NULL,
    [merged_acct_id]            CHAR (5)       NULL,
    [acct_create_dt]            DATETIME       NULL,
    [opening_balance]           MONEY          NULL,
    [comment]                   VARCHAR (2048) NULL,
    [misc_code]                 VARCHAR (50)   NULL,
    [ref_id1]                   VARCHAR (50)   NULL,
    [source]                    VARCHAR (30)   NULL,
    [ref_acct_id]               INT            NULL,
    [confidential_flag]         CHAR (1)       NULL,
    [confidential_file_as_name] VARCHAR (70)   NULL,
    [confidential_first_name]   VARCHAR (30)   NULL,
    [confidential_last_name]    VARCHAR (30)   NULL,
    [dist_m_n_o]                INT            NULL,
    [dist_i_n_s]                INT            NULL,
    [dist_pi]                   INT            NULL,
    [dist_atty_fees]            INT            NULL,
    [dist_overages]             INT            NULL,
    [dist_tax_cert_fees]        INT            NULL,
    [dist_misc_fees]            INT            NULL,
    [dist_vit]                  INT            NULL,
    [email_addr]                VARCHAR (50)   NULL,
    [web_addr]                  VARCHAR (50)   NULL,
    [ftp_addr]                  VARCHAR (50)   NULL,
    [update_dt]                 DATETIME       NULL,
    [web_suppression]           CHAR (1)       NULL,
    [appr_company_id]           INT            NULL,
    CONSTRAINT [CPK_account] PRIMARY KEY CLUSTERED ([acct_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_account_appr_company_id] FOREIGN KEY ([appr_company_id]) REFERENCES [dbo].[appr_company] ([appr_company_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_file_as_name_acct_id_confidential_file_as_name]
    ON [dbo].[account]([file_as_name] ASC, [acct_id] ASC, [confidential_file_as_name] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_confidential_file_as_name]
    ON [dbo].[account]([confidential_file_as_name] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_ref_id1]
    ON [dbo].[account]([ref_id1] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_file_as_name]
    ON [dbo].[account]([file_as_name] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_file_as_name_ref_id1]
    ON [dbo].[account]([file_as_name] ASC, [ref_id1] ASC);


GO



create trigger tr_account_update
on account
for update
not for replication

as

set nocount on

	IF UPDATE(file_as_name) or UPDATE(confidential_flag)
	BEGIN
		update account set update_dt = GetDate()
		from inserted
		where inserted.acct_id = account.acct_id
	END

set nocount off

GO



create trigger tr_account_insert_ChangeLog
on account
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
 
declare @acct_id int
declare @first_name varchar(30)
declare @last_name varchar(30)
declare @file_as_name varchar(70)
declare @dl_num varchar(10)
declare @dl_state char(2)
declare @dl_expir_dt datetime
declare @merged_acct_id char(5)
declare @acct_create_dt datetime
declare @opening_balance money
declare @comment varchar(1000)
declare @misc_code varchar(50)
declare @ref_id1 varchar(50)
declare @source varchar(30)
declare @ref_acct_id int
declare @confidential_flag char(1)
declare @confidential_file_as_name varchar(70)
declare @confidential_first_name varchar(30)
declare @confidential_last_name varchar(30)
declare @dist_m_n_o int
declare @dist_i_n_s int
declare @dist_pi int
declare @dist_atty_fees int
declare @dist_overages int
declare @dist_tax_cert_fees int
declare @dist_misc_fees int
declare @dist_vit int
declare @email_addr varchar(50)
declare @web_addr varchar(50)
declare @ftp_addr varchar(50)
declare @update_dt datetime
declare @web_suppression char(1)
 
declare curRows cursor
for
     select acct_id, first_name, last_name, file_as_name, dl_num, dl_state, dl_expir_dt, merged_acct_id, acct_create_dt, opening_balance, comment, misc_code, ref_id1, source, ref_acct_id, confidential_flag, confidential_file_as_name, confidential_first_name, confidential_last_name, dist_m_n_o, dist_i_n_s, dist_pi, dist_atty_fees, dist_overages, dist_tax_cert_fees, dist_misc_fees, dist_vit, email_addr, web_addr, ftp_addr, update_dt, web_suppression from inserted
for read only
 
open curRows
fetch next from curRows into @acct_id, @first_name, @last_name, @file_as_name, @dl_num, @dl_state, @dl_expir_dt, @merged_acct_id, @acct_create_dt, @opening_balance, @comment, @misc_code, @ref_id1, @source, @ref_acct_id, @confidential_flag, @confidential_file_as_name, @confidential_first_name, @confidential_last_name, @dist_m_n_o, @dist_i_n_s, @dist_pi, @dist_atty_fees, @dist_overages, @dist_tax_cert_fees, @dist_misc_fees, @dist_vit, @email_addr, @web_addr, @ftp_addr, @update_dt, @web_suppression
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @file_as_name
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 42, null, convert(varchar(255), @acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'first_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1920, null, convert(varchar(255), @first_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'last_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 2714, null, convert(varchar(255), @last_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'file_as_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1885, null, convert(varchar(255), @file_as_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dl_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1365, null, convert(varchar(255), @dl_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dl_state' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1367, null, convert(varchar(255), @dl_state), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dl_expir_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1364, null, convert(varchar(255), @dl_expir_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'merged_acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 3049, null, convert(varchar(255), @merged_acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'acct_create_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 39, null, convert(varchar(255), @acct_create_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'opening_balance' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 3408, null, convert(varchar(255), @opening_balance), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 827, null, convert(varchar(255), @comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'misc_code' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 3088, null, convert(varchar(255), @misc_code), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'ref_id1' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 4327, null, convert(varchar(255), @ref_id1), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'source' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 4892, null, convert(varchar(255), @source), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'ref_acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 4324, null, convert(varchar(255), @ref_acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'confidential_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 849, null, convert(varchar(255), @confidential_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'confidential_file_as_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 847, null, convert(varchar(255), @confidential_file_as_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'confidential_first_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 848, null, convert(varchar(255), @confidential_first_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'confidential_last_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 850, null, convert(varchar(255), @confidential_last_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dist_m_n_o' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1355, null, convert(varchar(255), @dist_m_n_o), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dist_i_n_s' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1354, null, convert(varchar(255), @dist_i_n_s), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dist_pi' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1358, null, convert(varchar(255), @dist_pi), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dist_atty_fees' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1353, null, convert(varchar(255), @dist_atty_fees), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dist_overages' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1357, null, convert(varchar(255), @dist_overages), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dist_tax_cert_fees' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1359, null, convert(varchar(255), @dist_tax_cert_fees), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dist_misc_fees' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1356, null, convert(varchar(255), @dist_misc_fees), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'dist_vit' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1360, null, convert(varchar(255), @dist_vit), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'email_addr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1434, null, convert(varchar(255), @email_addr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'web_addr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 5528, null, convert(varchar(255), @web_addr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'ftp_addr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 1982, null, convert(varchar(255), @ftp_addr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'update_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 5417, null, convert(varchar(255), @update_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'account' and
               chg_log_columns = 'web_suppression' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 61, 5949, null, convert(varchar(255), @web_suppression), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     fetch next from curRows into @acct_id, @first_name, @last_name, @file_as_name, @dl_num, @dl_state, @dl_expir_dt, @merged_acct_id, @acct_create_dt, @opening_balance, @comment, @misc_code, @ref_id1, @source, @ref_acct_id, @confidential_flag, @confidential_file_as_name, @confidential_first_name, @confidential_last_name, @dist_m_n_o, @dist_i_n_s, @dist_pi, @dist_atty_fees, @dist_overages, @dist_tax_cert_fees, @dist_misc_fees, @dist_vit, @email_addr, @web_addr, @ftp_addr, @update_dt, @web_suppression
end
 
close curRows
deallocate curRows

GO



create trigger tr_account_update_ChangeLog
on account
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
 
declare @old_acct_id int
declare @new_acct_id int
declare @old_first_name varchar(30)
declare @new_first_name varchar(30)
declare @old_last_name varchar(30)
declare @new_last_name varchar(30)
declare @old_file_as_name varchar(70)
declare @new_file_as_name varchar(70)
declare @old_dl_num varchar(10)
declare @new_dl_num varchar(10)
declare @old_dl_state char(2)
declare @new_dl_state char(2)
declare @old_dl_expir_dt datetime
declare @new_dl_expir_dt datetime
declare @old_merged_acct_id char(5)
declare @new_merged_acct_id char(5)
declare @old_acct_create_dt datetime
declare @new_acct_create_dt datetime
declare @old_opening_balance money
declare @new_opening_balance money
declare @old_comment varchar(1000)
declare @new_comment varchar(1000)
declare @old_misc_code varchar(50)
declare @new_misc_code varchar(50)
declare @old_ref_id1 varchar(50)
declare @new_ref_id1 varchar(50)
declare @old_source varchar(30)
declare @new_source varchar(30)
declare @old_ref_acct_id int
declare @new_ref_acct_id int
declare @old_confidential_flag char(1)
declare @new_confidential_flag char(1)
declare @old_confidential_file_as_name varchar(70)
declare @new_confidential_file_as_name varchar(70)
declare @old_confidential_first_name varchar(30)
declare @new_confidential_first_name varchar(30)
declare @old_confidential_last_name varchar(30)
declare @new_confidential_last_name varchar(30)
declare @old_dist_m_n_o int
declare @new_dist_m_n_o int
declare @old_dist_i_n_s int
declare @new_dist_i_n_s int
declare @old_dist_pi int
declare @new_dist_pi int
declare @old_dist_atty_fees int
declare @new_dist_atty_fees int
declare @old_dist_overages int
declare @new_dist_overages int
declare @old_dist_tax_cert_fees int
declare @new_dist_tax_cert_fees int
declare @old_dist_misc_fees int
declare @new_dist_misc_fees int
declare @old_dist_vit int
declare @new_dist_vit int
declare @old_email_addr varchar(50)
declare @new_email_addr varchar(50)
declare @old_web_addr varchar(50)
declare @new_web_addr varchar(50)
declare @old_ftp_addr varchar(50)
declare @new_ftp_addr varchar(50)
declare @old_update_dt datetime
declare @new_update_dt datetime
declare @old_web_suppression char(1)
declare @new_web_suppression char(1)
 
declare curRows cursor
for
     select d.acct_id, d.first_name, d.last_name, d.file_as_name, d.dl_num, d.dl_state, d.dl_expir_dt, d.merged_acct_id, d.acct_create_dt, d.opening_balance, d.comment, d.misc_code, d.ref_id1, d.source, d.ref_acct_id, d.confidential_flag, d.confidential_file_as_name, d.confidential_first_name, d.confidential_last_name, d.dist_m_n_o, d.dist_i_n_s, d.dist_pi, d.dist_atty_fees, d.dist_overages, d.dist_tax_cert_fees, d.dist_misc_fees, d.dist_vit, d.email_addr, d.web_addr, d.ftp_addr, d.update_dt, d.web_suppression, i.acct_id, i.first_name, i.last_name, i.file_as_name, i.dl_num, i.dl_state, i.dl_expir_dt, i.merged_acct_id, i.acct_create_dt, i.opening_balance, i.comment, i.misc_code, i.ref_id1, i.source, i.ref_acct_id, i.confidential_flag, i.confidential_file_as_name, i.confidential_first_name, i.confidential_last_name, i.dist_m_n_o, i.dist_i_n_s, i.dist_pi, i.dist_atty_fees, i.dist_overages, i.dist_tax_cert_fees, i.dist_misc_fees, i.dist_vit, i.email_addr, i.web_addr, i.ftp_addr, i.update_dt, i.web_suppression
from deleted as d
join inserted as i on 
     d.acct_id = i.acct_id
for read only
 
open curRows
fetch next from curRows into @old_acct_id, @old_first_name, @old_last_name, @old_file_as_name, @old_dl_num, @old_dl_state, @old_dl_expir_dt, @old_merged_acct_id, @old_acct_create_dt, @old_opening_balance, @old_comment, @old_misc_code, @old_ref_id1, @old_source, @old_ref_acct_id, @old_confidential_flag, @old_confidential_file_as_name, @old_confidential_first_name, @old_confidential_last_name, @old_dist_m_n_o, @old_dist_i_n_s, @old_dist_pi, @old_dist_atty_fees, @old_dist_overages, @old_dist_tax_cert_fees, @old_dist_misc_fees, @old_dist_vit, @old_email_addr, @old_web_addr, @old_ftp_addr, @old_update_dt, @old_web_suppression, @new_acct_id, @new_first_name, @new_last_name, @new_file_as_name, @new_dl_num, @new_dl_state, @new_dl_expir_dt, @new_merged_acct_id, @new_acct_create_dt, @new_opening_balance, @new_comment, @new_misc_code, @new_ref_id1, @new_source, @new_ref_acct_id, @new_confidential_flag, @new_confidential_file_as_name, @new_confidential_first_name, @new_confidential_last_name, @new_dist_m_n_o, @new_dist_i_n_s, @new_dist_pi, @new_dist_atty_fees, @new_dist_overages, @new_dist_tax_cert_fees, @new_dist_misc_fees, @new_dist_vit, @new_email_addr, @new_web_addr, @new_ftp_addr, @new_update_dt, @new_web_suppression
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = @new_file_as_name
 
     if (
          @old_acct_id <> @new_acct_id
          or
          ( @old_acct_id is null and @new_acct_id is not null ) 
          or
          ( @old_acct_id is not null and @new_acct_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 42, convert(varchar(255), @old_acct_id), convert(varchar(255), @new_acct_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_first_name <> @new_first_name
          or
          ( @old_first_name is null and @new_first_name is not null ) 
          or
          ( @old_first_name is not null and @new_first_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'first_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1920, convert(varchar(255), @old_first_name), convert(varchar(255), @new_first_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_last_name <> @new_last_name
          or
          ( @old_last_name is null and @new_last_name is not null ) 
          or
          ( @old_last_name is not null and @new_last_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'last_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 2714, convert(varchar(255), @old_last_name), convert(varchar(255), @new_last_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_file_as_name <> @new_file_as_name
          or
          ( @old_file_as_name is null and @new_file_as_name is not null ) 
          or
          ( @old_file_as_name is not null and @new_file_as_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'file_as_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1885, convert(varchar(255), @old_file_as_name), convert(varchar(255), @new_file_as_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dl_num <> @new_dl_num
          or
          ( @old_dl_num is null and @new_dl_num is not null ) 
          or
          ( @old_dl_num is not null and @new_dl_num is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dl_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1365, convert(varchar(255), @old_dl_num), convert(varchar(255), @new_dl_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dl_state <> @new_dl_state
          or
          ( @old_dl_state is null and @new_dl_state is not null ) 
          or
          ( @old_dl_state is not null and @new_dl_state is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dl_state' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1367, convert(varchar(255), @old_dl_state), convert(varchar(255), @new_dl_state) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dl_expir_dt <> @new_dl_expir_dt
          or
          ( @old_dl_expir_dt is null and @new_dl_expir_dt is not null ) 
          or
          ( @old_dl_expir_dt is not null and @new_dl_expir_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dl_expir_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1364, convert(varchar(255), @old_dl_expir_dt), convert(varchar(255), @new_dl_expir_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_merged_acct_id <> @new_merged_acct_id
          or
          ( @old_merged_acct_id is null and @new_merged_acct_id is not null ) 
          or
          ( @old_merged_acct_id is not null and @new_merged_acct_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'merged_acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 3049, convert(varchar(255), @old_merged_acct_id), convert(varchar(255), @new_merged_acct_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_acct_create_dt <> @new_acct_create_dt
          or
          ( @old_acct_create_dt is null and @new_acct_create_dt is not null ) 
          or
          ( @old_acct_create_dt is not null and @new_acct_create_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'acct_create_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 39, convert(varchar(255), @old_acct_create_dt), convert(varchar(255), @new_acct_create_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_opening_balance <> @new_opening_balance
          or
          ( @old_opening_balance is null and @new_opening_balance is not null ) 
          or
          ( @old_opening_balance is not null and @new_opening_balance is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'opening_balance' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 3408, convert(varchar(255), @old_opening_balance), convert(varchar(255), @new_opening_balance) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_comment <> @new_comment
          or
          ( @old_comment is null and @new_comment is not null ) 
          or
          ( @old_comment is not null and @new_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 827, convert(varchar(255), @old_comment), convert(varchar(255), @new_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_misc_code <> @new_misc_code
          or
          ( @old_misc_code is null and @new_misc_code is not null ) 
          or
          ( @old_misc_code is not null and @new_misc_code is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'misc_code' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 3088, convert(varchar(255), @old_misc_code), convert(varchar(255), @new_misc_code) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_ref_id1 <> @new_ref_id1
          or
          ( @old_ref_id1 is null and @new_ref_id1 is not null ) 
          or
          ( @old_ref_id1 is not null and @new_ref_id1 is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'ref_id1' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 4327, convert(varchar(255), @old_ref_id1), convert(varchar(255), @new_ref_id1) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_source <> @new_source
          or
          ( @old_source is null and @new_source is not null ) 
          or
          ( @old_source is not null and @new_source is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'source' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 4892, convert(varchar(255), @old_source), convert(varchar(255), @new_source) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_ref_acct_id <> @new_ref_acct_id
          or
          ( @old_ref_acct_id is null and @new_ref_acct_id is not null ) 
          or
          ( @old_ref_acct_id is not null and @new_ref_acct_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'ref_acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 4324, convert(varchar(255), @old_ref_acct_id), convert(varchar(255), @new_ref_acct_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_confidential_flag <> @new_confidential_flag
          or
          ( @old_confidential_flag is null and @new_confidential_flag is not null ) 
          or
          ( @old_confidential_flag is not null and @new_confidential_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'confidential_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 849, convert(varchar(255), @old_confidential_flag), convert(varchar(255), @new_confidential_flag) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_confidential_file_as_name <> @new_confidential_file_as_name
          or
          ( @old_confidential_file_as_name is null and @new_confidential_file_as_name is not null ) 
          or
          ( @old_confidential_file_as_name is not null and @new_confidential_file_as_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'confidential_file_as_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 847, convert(varchar(255), @old_confidential_file_as_name), convert(varchar(255), @new_confidential_file_as_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_confidential_first_name <> @new_confidential_first_name
          or
          ( @old_confidential_first_name is null and @new_confidential_first_name is not null ) 
          or
          ( @old_confidential_first_name is not null and @new_confidential_first_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'confidential_first_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 848, convert(varchar(255), @old_confidential_first_name), convert(varchar(255), @new_confidential_first_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_confidential_last_name <> @new_confidential_last_name
          or
          ( @old_confidential_last_name is null and @new_confidential_last_name is not null ) 
          or
          ( @old_confidential_last_name is not null and @new_confidential_last_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'confidential_last_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 850, convert(varchar(255), @old_confidential_last_name), convert(varchar(255), @new_confidential_last_name) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dist_m_n_o <> @new_dist_m_n_o
          or
          ( @old_dist_m_n_o is null and @new_dist_m_n_o is not null ) 
          or
          ( @old_dist_m_n_o is not null and @new_dist_m_n_o is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dist_m_n_o' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1355, convert(varchar(255), @old_dist_m_n_o), convert(varchar(255), @new_dist_m_n_o) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dist_i_n_s <> @new_dist_i_n_s
          or
          ( @old_dist_i_n_s is null and @new_dist_i_n_s is not null ) 
          or
          ( @old_dist_i_n_s is not null and @new_dist_i_n_s is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dist_i_n_s' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1354, convert(varchar(255), @old_dist_i_n_s), convert(varchar(255), @new_dist_i_n_s) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dist_pi <> @new_dist_pi
          or
          ( @old_dist_pi is null and @new_dist_pi is not null ) 
          or
          ( @old_dist_pi is not null and @new_dist_pi is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dist_pi' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1358, convert(varchar(255), @old_dist_pi), convert(varchar(255), @new_dist_pi) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dist_atty_fees <> @new_dist_atty_fees
          or
          ( @old_dist_atty_fees is null and @new_dist_atty_fees is not null ) 
          or
          ( @old_dist_atty_fees is not null and @new_dist_atty_fees is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dist_atty_fees' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1353, convert(varchar(255), @old_dist_atty_fees), convert(varchar(255), @new_dist_atty_fees) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dist_overages <> @new_dist_overages
          or
          ( @old_dist_overages is null and @new_dist_overages is not null ) 
          or
          ( @old_dist_overages is not null and @new_dist_overages is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dist_overages' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1357, convert(varchar(255), @old_dist_overages), convert(varchar(255), @new_dist_overages) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dist_tax_cert_fees <> @new_dist_tax_cert_fees
          or
          ( @old_dist_tax_cert_fees is null and @new_dist_tax_cert_fees is not null ) 
          or
          ( @old_dist_tax_cert_fees is not null and @new_dist_tax_cert_fees is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dist_tax_cert_fees' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1359, convert(varchar(255), @old_dist_tax_cert_fees), convert(varchar(255), @new_dist_tax_cert_fees) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dist_misc_fees <> @new_dist_misc_fees
          or
          ( @old_dist_misc_fees is null and @new_dist_misc_fees is not null ) 
          or
          ( @old_dist_misc_fees is not null and @new_dist_misc_fees is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dist_misc_fees' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1356, convert(varchar(255), @old_dist_misc_fees), convert(varchar(255), @new_dist_misc_fees) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_dist_vit <> @new_dist_vit
          or
          ( @old_dist_vit is null and @new_dist_vit is not null ) 
          or
          ( @old_dist_vit is not null and @new_dist_vit is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'dist_vit' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1360, convert(varchar(255), @old_dist_vit), convert(varchar(255), @new_dist_vit) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_email_addr <> @new_email_addr
          or
          ( @old_email_addr is null and @new_email_addr is not null ) 
          or
          ( @old_email_addr is not null and @new_email_addr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'email_addr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1434, convert(varchar(255), @old_email_addr), convert(varchar(255), @new_email_addr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_web_addr <> @new_web_addr
          or
          ( @old_web_addr is null and @new_web_addr is not null ) 
          or
          ( @old_web_addr is not null and @new_web_addr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'web_addr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 5528, convert(varchar(255), @old_web_addr), convert(varchar(255), @new_web_addr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_ftp_addr <> @new_ftp_addr
          or
          ( @old_ftp_addr is null and @new_ftp_addr is not null ) 
          or
          ( @old_ftp_addr is not null and @new_ftp_addr is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'ftp_addr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 1982, convert(varchar(255), @old_ftp_addr), convert(varchar(255), @new_ftp_addr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_update_dt <> @new_update_dt
          or
          ( @old_update_dt is null and @new_update_dt is not null ) 
          or
          ( @old_update_dt is not null and @new_update_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'update_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 5417, convert(varchar(255), @old_update_dt), convert(varchar(255), @new_update_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_web_suppression <> @new_web_suppression
          or
          ( @old_web_suppression is null and @new_web_suppression is not null ) 
          or
          ( @old_web_suppression is not null and @new_web_suppression is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'account' and
                    chg_log_columns = 'web_suppression' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 61, 5949, convert(varchar(255), @old_web_suppression), convert(varchar(255), @new_web_suppression) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     fetch next from curRows into @old_acct_id, @old_first_name, @old_last_name, @old_file_as_name, @old_dl_num, @old_dl_state, @old_dl_expir_dt, @old_merged_acct_id, @old_acct_create_dt, @old_opening_balance, @old_comment, @old_misc_code, @old_ref_id1, @old_source, @old_ref_acct_id, @old_confidential_flag, @old_confidential_file_as_name, @old_confidential_first_name, @old_confidential_last_name, @old_dist_m_n_o, @old_dist_i_n_s, @old_dist_pi, @old_dist_atty_fees, @old_dist_overages, @old_dist_tax_cert_fees, @old_dist_misc_fees, @old_dist_vit, @old_email_addr, @old_web_addr, @old_ftp_addr, @old_update_dt, @old_web_suppression, @new_acct_id, @new_first_name, @new_last_name, @new_file_as_name, @new_dl_num, @new_dl_state, @new_dl_expir_dt, @new_merged_acct_id, @new_acct_create_dt, @new_opening_balance, @new_comment, @new_misc_code, @new_ref_id1, @new_source, @new_ref_acct_id, @new_confidential_flag, @new_confidential_file_as_name, @new_confidential_first_name, @new_confidential_last_name, @new_dist_m_n_o, @new_dist_i_n_s, @new_dist_pi, @new_dist_atty_fees, @new_dist_overages, @new_dist_tax_cert_fees, @new_dist_misc_fees, @new_dist_vit, @new_email_addr, @new_web_addr, @new_ftp_addr, @new_update_dt, @new_web_suppression
end
 
close curRows
deallocate curRows

GO



create trigger tr_account_delete_ChangeLog
on account
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
          chg_log_tables = 'account' and
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
 
declare @acct_id int
 
declare curRows cursor
for
     select acct_id from deleted
for read only
 
open curRows
fetch next from curRows into @acct_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_szRefID = file_as_name
     from deleted
     where acct_id = @acct_id
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 61, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
 
     fetch next from curRows into @acct_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_account_insert
on account
for insert
not for replication

as

set nocount on

	IF UPDATE(file_as_name) or UPDATE(confidential_flag)
	BEGIN
		update account set update_dt = GetDate()
		from inserted
		where inserted.acct_id = account.acct_id
	END

set nocount off

GO

