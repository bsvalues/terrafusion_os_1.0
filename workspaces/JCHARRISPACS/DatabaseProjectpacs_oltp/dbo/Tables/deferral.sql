CREATE TABLE [dbo].[deferral] (
    [deferral_id]               INT             IDENTITY (1, 1) NOT NULL,
    [application_number]        VARCHAR (25)    NOT NULL,
    [year]                      NUMERIC (4)     NOT NULL,
    [prop_id]                   INT             NOT NULL,
    [owner_name]                VARCHAR (100)   NULL,
    [deferral_type]             VARCHAR (25)    NOT NULL,
    [application_dt]            DATETIME        DEFAULT (getdate()) NOT NULL,
    [status]                    VARCHAR (25)    NOT NULL,
    [deferral_amount]           NUMERIC (14, 2) DEFAULT ((0.0)) NOT NULL,
    [marked_as_deleted]         BIT             DEFAULT ((0)) NOT NULL,
    [date_of_death]             DATETIME        NULL,
    [previously_deferred]       NUMERIC (10, 2) NULL,
    [liens_obligations]         NUMERIC (10, 2) NULL,
    [market_value]              NUMERIC (14, 2) NULL,
    [effective_date]            DATETIME        NULL,
    [income_qualify]            INT             NULL,
    [income_qualify_override]   BIT             NULL,
    [snr_dsbl_qualify]          INT             NULL,
    [snr_dsbl_qualify_override] BIT             NULL,
    [residential_qualify]       BIT             NULL,
    [zoning_qualify]            BIT             NULL,
    [insurance_recieved]        BIT             NULL,
    [state_loss_payee]          BIT             NULL,
    [mortgage_verified]         BIT             NULL,
    [mortgage_req]              BIT             NULL,
    [application_deadline_met]  BIT             NULL,
    [income_requirement]        BIT             NULL,
    [age_disability]            BIT             NULL,
    [residential_req]           BIT             NULL,
    [insurance_req]             BIT             NULL,
    [equality_req]              BIT             NULL,
    [other_reason]              BIT             NULL,
    [other_text]                VARCHAR (255)   NULL,
    [incomplete_app]            BIT             NULL,
    [owner_letter_count]        INT             DEFAULT ((0)) NOT NULL,
    [owner_letter_last_print]   DATETIME        NULL,
    [tax_statement_count]       INT             DEFAULT ((0)) NOT NULL,
    [tax_statement_last_print]  DATETIME        NULL,
    [image_count]               INT             DEFAULT ((0)) NOT NULL,
    [image_last_print]          DATETIME        NULL,
    [bill_fee_code]             VARCHAR (25)    NULL,
    CONSTRAINT [CPK_deferral] PRIMARY KEY CLUSTERED ([deferral_id] ASC)
);


GO

 
create trigger tr_deferral_delete_ChangeLog
on deferral
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
          chg_log_tables = 'deferral' and
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
 
declare @deferral_id int
 
declare curRows cursor
for
     select deferral_id from deleted
for read only
 
open curRows
fetch next from curRows into @deferral_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1684, 0, @tvar_szOldValue, 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9845, convert(varchar(24), @deferral_id), @deferral_id)
 
     fetch next from curRows into @deferral_id
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_deferral_update_ChangeLog
on deferral
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
 
declare @old_deferral_id int
declare @new_deferral_id int
declare @old_date_of_death datetime
declare @new_date_of_death datetime
declare @prop_id int
 
declare curRows cursor
for
     select d.deferral_id, d.date_of_death, 
            i.deferral_id, i.date_of_death
from deleted as d
join inserted as i on 
     d.deferral_id = i.deferral_id
for read only
 
open curRows
fetch next from curRows into @old_deferral_id, @old_date_of_death,
                             @new_deferral_id, @new_date_of_death
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_date_of_death <> @new_date_of_death
          or
          ( @old_date_of_death is null and @new_date_of_death is not null ) 
          or
          ( @old_date_of_death is not null and @new_date_of_death is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'deferral' and
                    chg_log_columns = 'date_of_death' and
                    chg_log_audit = 1
          )
          begin
				select @prop_id = prop_id
				from deferral
				where deferral_id = @new_deferral_id

               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1684, 9833, convert(varchar(255), @old_date_of_death), convert(varchar(255), @new_date_of_death), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9845, convert(varchar(24), @new_deferral_id), @new_deferral_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @prop_id), @prop_id)
          end
     end
 

fetch next from curRows into @old_deferral_id, @old_date_of_death,
                             @new_deferral_id, @new_date_of_death
end
 
close curRows
deallocate curRows

GO

 
create trigger tr_deferral_insert_ChangeLog
on deferral
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

declare @deferral_id int
declare @date_of_death datetime
 
declare curRows cursor
for
     select deferral_id, date_of_death from inserted
for read only
 
open curRows
fetch next from curRows into @deferral_id, @date_of_death
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'deferral' and
               chg_log_columns = 'date_of_death' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1684, 9833, null, convert(varchar(255), @date_of_death), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9845, convert(varchar(24), @deferral_id), @deferral_id)
     end
 
 
     fetch next from curRows into @deferral_id, @date_of_death
end
 
close curRows
deallocate curRows

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Capture the selected bill fee code for approved deferrals.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'deferral', @level2type = N'COLUMN', @level2name = N'bill_fee_code';


GO

