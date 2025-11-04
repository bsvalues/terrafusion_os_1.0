CREATE TABLE [dbo].[autopay_enrollment] (
    [prop_id]                       INT             NOT NULL,
    [acct_id]                       INT             NOT NULL,
    [bank_name]                     VARCHAR (50)    NOT NULL,
    [authorization_name]            VARCHAR (50)    NOT NULL,
    [account_type_cd]               INT             NULL,
    [enrolled_date]                 DATETIME        NULL,
    [enrolled_status]               BIT             NULL,
    [canceled_date]                 DATETIME        NULL,
    [payment_cd]                    INT             NULL,
    [pending_payment]               NUMERIC (14, 3) NULL,
    [account_number]                VARBINARY (48)  NULL,
    [bank_routing_number]           VARBINARY (32)  NULL,
    [completed]                     BIT             NULL,
    [ownership_transfer_incomplete] BIT             CONSTRAINT [CDF_autopay_enrollment_ownership_transfer_incomplete] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_autopay_enrollment] PRIMARY KEY CLUSTERED ([prop_id] ASC, [acct_id] ASC),
    CONSTRAINT [CFK_account_type_cd_autopay_account_type] FOREIGN KEY ([account_type_cd]) REFERENCES [dbo].[autopay_account_type] ([account_type_cd]),
    CONSTRAINT [CFK_payment_cd_autopay_payment_code] FOREIGN KEY ([payment_cd]) REFERENCES [dbo].[autopay_payment_code] ([payment_cd])
);


GO

 
create trigger tr_autopay_enrollment_update_ChangeLog
on autopay_enrollment
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
declare @old_acct_id int
declare @new_acct_id int
declare @old_bank_name varchar(50)
declare @new_bank_name varchar(50)
declare @old_authorization_name varchar(50)
declare @new_authorization_name varchar(50)
declare @old_account_type_cd int
declare @new_account_type_cd int
declare @old_enrolled_date datetime
declare @new_enrolled_date datetime
declare @old_enrolled_status bit
declare @new_enrolled_status bit
declare @old_canceled_date datetime
declare @new_canceled_date datetime
declare @old_payment_cd int
declare @new_payment_cd int
declare @old_pending_payment numeric(14,3)
declare @new_pending_payment numeric(14,3)
declare @old_account_number varbinary(48)
declare @new_account_number varbinary(48)
declare @old_bank_routing_number varbinary(32)
declare @new_bank_routing_number varbinary(32)
 
declare curRows cursor
for
     select d.prop_id, d.acct_id, d.bank_name, d.authorization_name, d.account_type_cd, d.enrolled_date, d.enrolled_status, d.canceled_date, d.payment_cd, d.pending_payment, d.account_number, d.bank_routing_number, 
            i.prop_id, i.acct_id, i.bank_name, i.authorization_name, i.account_type_cd, i.enrolled_date, i.enrolled_status, i.canceled_date, i.payment_cd, i.pending_payment, i.account_number, i.bank_routing_number
from deleted as d
join inserted as i on 
     d.prop_id = i.prop_id and
     d.acct_id = i.acct_id
for read only
 
open curRows
fetch next from curRows into @old_prop_id, @old_acct_id, @old_bank_name, @old_authorization_name, @old_account_type_cd, @old_enrolled_date, @old_enrolled_status, @old_canceled_date, @old_payment_cd, @old_pending_payment, @old_account_number, @old_bank_routing_number, 
                             @new_prop_id, @new_acct_id, @new_bank_name, @new_authorization_name, @new_account_type_cd, @new_enrolled_date, @new_enrolled_status, @new_canceled_date, @new_payment_cd, @new_pending_payment, @new_account_number, @new_bank_routing_number
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
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
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
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
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'acct_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 42, convert(varchar(255), @old_acct_id), convert(varchar(255), @new_acct_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_bank_name <> @new_bank_name
          or
          ( @old_bank_name is null and @new_bank_name is not null ) 
          or
          ( @old_bank_name is not null and @new_bank_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'bank_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 9595, convert(varchar(255), @old_bank_name), convert(varchar(255), @new_bank_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_authorization_name <> @new_authorization_name
          or
          ( @old_authorization_name is null and @new_authorization_name is not null ) 
          or
          ( @old_authorization_name is not null and @new_authorization_name is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'authorization_name' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 9596, convert(varchar(255), @old_authorization_name), convert(varchar(255), @new_authorization_name), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_account_type_cd <> @new_account_type_cd
          or
          ( @old_account_type_cd is null and @new_account_type_cd is not null ) 
          or
          ( @old_account_type_cd is not null and @new_account_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'account_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 9597, convert(varchar(255), @old_account_type_cd), convert(varchar(255), @new_account_type_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_enrolled_date <> @new_enrolled_date
          or
          ( @old_enrolled_date is null and @new_enrolled_date is not null ) 
          or
          ( @old_enrolled_date is not null and @new_enrolled_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'enrolled_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 9598, convert(varchar(255), @old_enrolled_date), convert(varchar(255), @new_enrolled_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_enrolled_status <> @new_enrolled_status
          or
          ( @old_enrolled_status is null and @new_enrolled_status is not null ) 
          or
          ( @old_enrolled_status is not null and @new_enrolled_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'enrolled_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 9599, convert(varchar(255), @old_enrolled_status), convert(varchar(255), @new_enrolled_status), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_canceled_date <> @new_canceled_date
          or
          ( @old_canceled_date is null and @new_canceled_date is not null ) 
          or
          ( @old_canceled_date is not null and @new_canceled_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'canceled_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 9600, convert(varchar(255), @old_canceled_date), convert(varchar(255), @new_canceled_date), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_payment_cd <> @new_payment_cd
          or
          ( @old_payment_cd is null and @new_payment_cd is not null ) 
          or
          ( @old_payment_cd is not null and @new_payment_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'payment_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 3582, convert(varchar(255), @old_payment_cd), convert(varchar(255), @new_payment_cd), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_pending_payment <> @new_pending_payment
          or
          ( @old_pending_payment is null and @new_pending_payment is not null ) 
          or
          ( @old_pending_payment is not null and @new_pending_payment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'pending_payment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 9602, convert(varchar(255), @old_pending_payment), convert(varchar(255), @new_pending_payment), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_account_number <> @new_account_number
          or
          ( @old_account_number is null and @new_account_number is not null ) 
          or
          ( @old_account_number is not null and @new_account_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'account_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 36, convert(varchar(255), @old_account_number), convert(varchar(255), @new_account_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     if (
          @old_bank_routing_number <> @new_bank_routing_number
          or
          ( @old_bank_routing_number is null and @new_bank_routing_number is not null ) 
          or
          ( @old_bank_routing_number is not null and @new_bank_routing_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'autopay_enrollment' and
                    chg_log_columns = 'bank_routing_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1679, 9601, convert(varchar(255), @old_bank_routing_number), convert(varchar(255), @new_bank_routing_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @new_prop_id), @new_prop_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @new_acct_id), @new_acct_id)
          end
     end
 
     fetch next from curRows into @old_prop_id, @old_acct_id, @old_bank_name, @old_authorization_name, @old_account_type_cd, @old_enrolled_date, @old_enrolled_status, @old_canceled_date, @old_payment_cd, @old_pending_payment, @old_account_number, @old_bank_routing_number, 
                                  @new_prop_id, @new_acct_id, @new_bank_name, @new_authorization_name, @new_account_type_cd, @new_enrolled_date, @new_enrolled_status, @new_canceled_date, @new_payment_cd, @new_pending_payment, @new_account_number, @new_bank_routing_number
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_autopay_enrollment_insert_ChangeLog
on autopay_enrollment
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
declare @acct_id int
declare @bank_name varchar(50)
declare @authorization_name varchar(50)
declare @account_type_cd int
declare @enrolled_date datetime
declare @enrolled_status bit
declare @canceled_date datetime
declare @payment_cd int
declare @pending_payment numeric(14,3)
declare @account_number varbinary(48)
declare @bank_routing_number varbinary(32)
 
declare curRows cursor
for
     select prop_id, acct_id, bank_name, authorization_name, account_type_cd, enrolled_date, enrolled_status, canceled_date, payment_cd, pending_payment, account_number, bank_routing_number from inserted
for read only
 
open curRows
fetch next from curRows into @prop_id, @acct_id, @bank_name, @authorization_name, @account_type_cd, @enrolled_date, @enrolled_status, @canceled_date, @payment_cd, @pending_payment, @account_number, @bank_routing_number
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'acct_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 42, null, convert(varchar(255), @acct_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'bank_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 9595, null, convert(varchar(255), @bank_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'authorization_name' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 9596, null, convert(varchar(255), @authorization_name), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'account_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 9597, null, convert(varchar(255), @account_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'enrolled_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 9598, null, convert(varchar(255), @enrolled_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'enrolled_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 9599, null, convert(varchar(255), @enrolled_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'canceled_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 9600, null, convert(varchar(255), @canceled_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'payment_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 3582, null, convert(varchar(255), @payment_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'pending_payment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 9602, null, convert(varchar(255), @pending_payment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'account_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 36, null, convert(varchar(255), @account_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'autopay_enrollment' and
               chg_log_columns = 'bank_routing_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1679, 9601, null, convert(varchar(255), @bank_routing_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 42, convert(varchar(24), @acct_id), @acct_id)
     end
 
     fetch next from curRows into @prop_id, @acct_id, @bank_name, @authorization_name, @account_type_cd, @enrolled_date, @enrolled_status, @canceled_date, @payment_cd, @pending_payment, @account_number, @bank_routing_number
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'AutoPayOwnerTransfer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'autopay_enrollment', @level2type = N'COLUMN', @level2name = N'ownership_transfer_incomplete';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Is set to true when Auto Pay account transfer or cancelled process is completed.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'autopay_enrollment', @level2type = N'COLUMN', @level2name = N'completed';


GO

