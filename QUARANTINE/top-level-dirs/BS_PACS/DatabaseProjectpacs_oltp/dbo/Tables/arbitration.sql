CREATE TABLE [dbo].[arbitration] (
    [arbitration_id]                         INT            NOT NULL,
    [prop_val_yr]                            NUMERIC (4)    NOT NULL,
    [cad_id]                                 VARCHAR (3)    NULL,
    [ref_id]                                 VARCHAR (20)   NULL,
    [cad_arbitration_number]                 VARCHAR (50)   NOT NULL,
    [arbitration_status]                     VARCHAR (10)   NULL,
    [arbitration_status_dt]                  DATETIME       NULL,
    [arbitration_status_changed_user_id]     INT            NULL,
    [create_dt]                              DATETIME       NULL,
    [created_by]                             INT            NULL,
    [arbitrated_by_type]                     VARCHAR (10)   NULL,
    [arbitrated_by_id]                       INT            NULL,
    [arbitrated_by_id_type]                  INT            NULL,
    [authorization_received_dt]              DATETIME       NULL,
    [order_determining_protest_sent_dt]      DATETIME       NULL,
    [order_determining_protest_received_dt]  DATETIME       NULL,
    [arbitration_received_dt]                DATETIME       NULL,
    [payment_amount]                         NUMERIC (7, 2) NULL,
    [check_money_order_number]               VARCHAR (20)   NULL,
    [filed_timely_flag]                      BIT            NULL,
    [taxes_not_delinquent_flag]              BIT            NULL,
    [taxes_verified_dt]                      DATETIME       NULL,
    [taxes_verified_by_id]                   INT            NULL,
    [owner_opinion_of_value]                 NUMERIC (14)   NULL,
    [reject_dt]                              DATETIME       NULL,
    [reject_reason]                          VARCHAR (10)   NULL,
    [reject_letter_print_dt]                 DATETIME       NULL,
    [request_sent_dt]                        DATETIME       NULL,
    [request_letter_printed_dt]              DATETIME       NULL,
    [certified_mailer_printed_dt]            DATETIME       NULL,
    [state_approval_dt]                      DATETIME       NULL,
    [arbitrator_selection_dt]                DATETIME       NULL,
    [arbitrator_selection_letter_printed_dt] DATETIME       NULL,
    [arbitrator_selection_due_dt]            DATETIME       NULL,
    [plaintiff_arbitrator_id]                INT            NULL,
    [cad_arbitrator_id]                      INT            NULL,
    [arbitrator_assigned_id]                 INT            NULL,
    [arbitrator_assigned_dt]                 DATETIME       NULL,
    [recording_start_dt]                     DATETIME       NULL,
    [recording_end_dt]                       DATETIME       NULL,
    [estimated_completion_dt]                DATETIME       NULL,
    [arbitration_dt]                         DATETIME       NULL,
    [arbitration_place]                      VARCHAR (128)  NULL,
    [arbitration_method]                     VARCHAR (10)   NULL,
    [arbitration_completion_dt]              DATETIME       NULL,
    [appraiser_id]                           INT            NULL,
    [comments]                               VARCHAR (1024) NULL,
    [evidence_prepared_dt]                   DATETIME       NULL,
    [evidence_prepared_staff]                INT            NULL,
    [evidence_letter_printed_dt]             DATETIME       NULL,
    [additional_evidence_requested_dt]       DATETIME       NULL,
    [additional_evidence_type]               VARCHAR (10)   NULL,
    [additional_evidence_letter_printed_dt]  DATETIME       NULL,
    [additional_evidence_prepared_dt]        DATETIME       NULL,
    [additional_evidence_prepared_staff]     INT            NULL,
    [additional_evidence_delivery_dt]        DATETIME       NULL,
    [arbitrators_assigned_value]             NUMERIC (14)   NULL,
    [arbitrators_opinion_of_value]           NUMERIC (14)   NULL,
    [arbitrators_opinion_of_value_override]  BIT            NULL,
    [arbitrators_arb_value]                  NUMERIC (14)   NULL,
    [arbitrators_arb_value_override]         BIT            NULL,
    [arbitrators_diff_arb_value]             NUMERIC (14)   NULL,
    [arbitrators_diff_opinion_of_value]      NUMERIC (14)   NULL,
    [arbitration_decision]                   INT            NOT NULL,
    [cad_arbitrator_fee_dt]                  DATETIME       NULL,
    [cad_arbitrator_check_number]            VARCHAR (20)   NULL,
    [cad_arbitrator_fee_amt]                 NUMERIC (7, 2) NULL,
    [closed_pacs_user_id]                    INT            NULL,
    CONSTRAINT [CPK_arbitration] PRIMARY KEY CLUSTERED ([arbitration_id] ASC, [prop_val_yr] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_arbitration_additional_evidence_type] FOREIGN KEY ([additional_evidence_type]) REFERENCES [dbo].[arbitration_additional_evidence] ([evidence_cd]),
    CONSTRAINT [CFK_arbitration_arbitration_method] FOREIGN KEY ([arbitration_method]) REFERENCES [dbo].[arbitration_method] ([method_cd]),
    CONSTRAINT [CFK_arbitration_arbitration_status] FOREIGN KEY ([arbitration_status]) REFERENCES [dbo].[arbitration_status] ([status_cd]),
    CONSTRAINT [CFK_arbitration_reject_reason] FOREIGN KEY ([reject_reason]) REFERENCES [dbo].[arbitration_reject] ([reject_cd])
);


GO


create trigger tr_arbitration_update_ChangeLog
on arbitration
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
 
declare @old_arbitration_id int
declare @new_arbitration_id int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_cad_id varchar(3)
declare @new_cad_id varchar(3)
declare @old_ref_id varchar(20)
declare @new_ref_id varchar(20)
declare @old_cad_arbitration_number varchar(50)
declare @new_cad_arbitration_number varchar(50)
declare @old_arbitration_status varchar(10)
declare @new_arbitration_status varchar(10)
declare @old_arbitration_status_dt datetime
declare @new_arbitration_status_dt datetime
declare @old_arbitration_status_changed_user_id int
declare @new_arbitration_status_changed_user_id int
declare @old_create_dt datetime
declare @new_create_dt datetime
declare @old_created_by int
declare @new_created_by int
declare @old_arbitrated_by_type varchar(10)
declare @new_arbitrated_by_type varchar(10)
declare @old_arbitrated_by_id int
declare @new_arbitrated_by_id int
declare @old_arbitrated_by_id_type int
declare @new_arbitrated_by_id_type int
declare @old_authorization_received_dt datetime
declare @new_authorization_received_dt datetime
declare @old_order_determining_protest_sent_dt datetime
declare @new_order_determining_protest_sent_dt datetime
declare @old_order_determining_protest_received_dt datetime
declare @new_order_determining_protest_received_dt datetime
declare @old_arbitration_received_dt datetime
declare @new_arbitration_received_dt datetime
declare @old_payment_amount numeric(7,2)
declare @new_payment_amount numeric(7,2)
declare @old_check_money_order_number varchar(20)
declare @new_check_money_order_number varchar(20)
declare @old_filed_timely_flag bit
declare @new_filed_timely_flag bit
declare @old_taxes_not_delinquent_flag bit
declare @new_taxes_not_delinquent_flag bit
declare @old_taxes_verified_dt datetime
declare @new_taxes_verified_dt datetime
declare @old_taxes_verified_by_id int
declare @new_taxes_verified_by_id int
declare @old_owner_opinion_of_value numeric(14,0)
declare @new_owner_opinion_of_value numeric(14,0)
declare @old_reject_dt datetime
declare @new_reject_dt datetime
declare @old_reject_reason varchar(10)
declare @new_reject_reason varchar(10)
declare @old_reject_letter_print_dt datetime
declare @new_reject_letter_print_dt datetime
declare @old_request_sent_dt datetime
declare @new_request_sent_dt datetime
declare @old_request_letter_printed_dt datetime
declare @new_request_letter_printed_dt datetime
declare @old_certified_mailer_printed_dt datetime
declare @new_certified_mailer_printed_dt datetime
declare @old_state_approval_dt datetime
declare @new_state_approval_dt datetime
declare @old_arbitrator_selection_dt datetime
declare @new_arbitrator_selection_dt datetime
declare @old_arbitrator_selection_letter_printed_dt datetime
declare @new_arbitrator_selection_letter_printed_dt datetime
declare @old_arbitrator_selection_due_dt datetime
declare @new_arbitrator_selection_due_dt datetime
declare @old_plaintiff_arbitrator_id int
declare @new_plaintiff_arbitrator_id int
declare @old_cad_arbitrator_id int
declare @new_cad_arbitrator_id int
declare @old_arbitrator_assigned_id int
declare @new_arbitrator_assigned_id int
declare @old_arbitrator_assigned_dt datetime
declare @new_arbitrator_assigned_dt datetime
declare @old_recording_start_dt datetime
declare @new_recording_start_dt datetime
declare @old_recording_end_dt datetime
declare @new_recording_end_dt datetime
declare @old_estimated_completion_dt datetime
declare @new_estimated_completion_dt datetime
declare @old_arbitration_dt datetime
declare @new_arbitration_dt datetime
declare @old_arbitration_place varchar(128)
declare @new_arbitration_place varchar(128)
declare @old_arbitration_method varchar(10)
declare @new_arbitration_method varchar(10)
declare @old_arbitration_completion_dt datetime
declare @new_arbitration_completion_dt datetime
declare @old_appraiser_id int
declare @new_appraiser_id int
declare @old_comments varchar(1024)
declare @new_comments varchar(1024)
declare @old_evidence_prepared_dt datetime
declare @new_evidence_prepared_dt datetime
declare @old_evidence_prepared_staff int
declare @new_evidence_prepared_staff int
declare @old_evidence_letter_printed_dt datetime
declare @new_evidence_letter_printed_dt datetime
declare @old_additional_evidence_requested_dt datetime
declare @new_additional_evidence_requested_dt datetime
declare @old_additional_evidence_type varchar(10)
declare @new_additional_evidence_type varchar(10)
declare @old_additional_evidence_letter_printed_dt datetime
declare @new_additional_evidence_letter_printed_dt datetime
declare @old_additional_evidence_prepared_dt datetime
declare @new_additional_evidence_prepared_dt datetime
declare @old_additional_evidence_prepared_staff int
declare @new_additional_evidence_prepared_staff int
declare @old_additional_evidence_delivery_dt datetime
declare @new_additional_evidence_delivery_dt datetime
declare @old_arbitrators_assigned_value numeric(14,0)
declare @new_arbitrators_assigned_value numeric(14,0)
declare @old_arbitrators_opinion_of_value numeric(14,0)
declare @new_arbitrators_opinion_of_value numeric(14,0)
declare @old_arbitrators_opinion_of_value_override bit
declare @new_arbitrators_opinion_of_value_override bit
declare @old_arbitrators_arb_value numeric(14,0)
declare @new_arbitrators_arb_value numeric(14,0)
declare @old_arbitrators_arb_value_override bit
declare @new_arbitrators_arb_value_override bit
declare @old_arbitrators_diff_arb_value numeric(14,0)
declare @new_arbitrators_diff_arb_value numeric(14,0)
declare @old_arbitrators_diff_opinion_of_value numeric(14,0)
declare @new_arbitrators_diff_opinion_of_value numeric(14,0)
declare @old_arbitration_decision bit
declare @new_arbitration_decision bit
declare @old_cad_arbitrator_fee_dt datetime
declare @new_cad_arbitrator_fee_dt datetime
declare @old_cad_arbitrator_check_number varchar(20)
declare @new_cad_arbitrator_check_number varchar(20)
declare @old_cad_arbitrator_fee_amt numeric(7,2)
declare @new_cad_arbitrator_fee_amt numeric(7,2)
declare @old_closed_pacs_user_id int
declare @new_closed_pacs_user_id int
 
declare curRows cursor
for
     select d.arbitration_id, d.prop_val_yr, d.cad_id, d.ref_id, d.cad_arbitration_number, d.arbitration_status, d.arbitration_status_dt, d.arbitration_status_changed_user_id, d.create_dt, d.created_by, d.arbitrated_by_type, d.arbitrated_by_id, d.arbitrated_by_id_type, d.authorization_received_dt, d.order_determining_protest_sent_dt, d.order_determining_protest_received_dt, d.arbitration_received_dt, d.payment_amount, d.check_money_order_number, d.filed_timely_flag, d.taxes_not_delinquent_flag, d.taxes_verified_dt, d.taxes_verified_by_id, d.owner_opinion_of_value, d.reject_dt, d.reject_reason, d.reject_letter_print_dt, d.request_sent_dt, d.request_letter_printed_dt, d.certified_mailer_printed_dt, d.state_approval_dt, d.arbitrator_selection_dt, d.arbitrator_selection_letter_printed_dt, d.arbitrator_selection_due_dt, d.plaintiff_arbitrator_id, d.cad_arbitrator_id, d.arbitrator_assigned_id, d.arbitrator_assigned_dt, d.recording_start_dt, d.recording_end_dt, d.estimated_completion_dt, d.arbitration_dt, d.arbitration_place, d.arbitration_method, d.arbitration_completion_dt, d.appraiser_id, d.comments, d.evidence_prepared_dt, d.evidence_prepared_staff, d.evidence_letter_printed_dt, d.additional_evidence_requested_dt, d.additional_evidence_type, d.additional_evidence_letter_printed_dt, d.additional_evidence_prepared_dt, d.additional_evidence_prepared_staff, d.additional_evidence_delivery_dt, d.arbitrators_assigned_value, d.arbitrators_opinion_of_value, d.arbitrators_opinion_of_value_override, d.arbitrators_arb_value, d.arbitrators_arb_value_override, d.arbitrators_diff_arb_value, d.arbitrators_diff_opinion_of_value, d.arbitration_decision, d.cad_arbitrator_fee_dt, d.cad_arbitrator_check_number, d.cad_arbitrator_fee_amt, d.closed_pacs_user_id, i.arbitration_id, i.prop_val_yr, i.cad_id, i.ref_id, i.cad_arbitration_number, i.arbitration_status, i.arbitration_status_dt, i.arbitration_status_changed_user_id, i.create_dt, i.created_by, i.arbitrated_by_type, i.arbitrated_by_id, i.arbitrated_by_id_type, i.authorization_received_dt, i.order_determining_protest_sent_dt, i.order_determining_protest_received_dt, i.arbitration_received_dt, i.payment_amount, i.check_money_order_number, i.filed_timely_flag, i.taxes_not_delinquent_flag, i.taxes_verified_dt, i.taxes_verified_by_id, i.owner_opinion_of_value, i.reject_dt, i.reject_reason, i.reject_letter_print_dt, i.request_sent_dt, i.request_letter_printed_dt, i.certified_mailer_printed_dt, i.state_approval_dt, i.arbitrator_selection_dt, i.arbitrator_selection_letter_printed_dt, i.arbitrator_selection_due_dt, i.plaintiff_arbitrator_id, i.cad_arbitrator_id, i.arbitrator_assigned_id, i.arbitrator_assigned_dt, i.recording_start_dt, i.recording_end_dt, i.estimated_completion_dt, i.arbitration_dt, i.arbitration_place, i.arbitration_method, i.arbitration_completion_dt, i.appraiser_id, i.comments, i.evidence_prepared_dt, i.evidence_prepared_staff, i.evidence_letter_printed_dt, i.additional_evidence_requested_dt, i.additional_evidence_type, i.additional_evidence_letter_printed_dt, i.additional_evidence_prepared_dt, i.additional_evidence_prepared_staff, i.additional_evidence_delivery_dt, i.arbitrators_assigned_value, i.arbitrators_opinion_of_value, i.arbitrators_opinion_of_value_override, i.arbitrators_arb_value, i.arbitrators_arb_value_override, i.arbitrators_diff_arb_value, i.arbitrators_diff_opinion_of_value, i.arbitration_decision, i.cad_arbitrator_fee_dt, i.cad_arbitrator_check_number, i.cad_arbitrator_fee_amt, i.closed_pacs_user_id
from deleted as d
join inserted as i on 
     d.arbitration_id = i.arbitration_id and
     d.prop_val_yr = i.prop_val_yr
for read only
 
open curRows
fetch next from curRows into @old_arbitration_id, @old_prop_val_yr, @old_cad_id, @old_ref_id, @old_cad_arbitration_number, @old_arbitration_status, @old_arbitration_status_dt, @old_arbitration_status_changed_user_id, @old_create_dt, @old_created_by, @old_arbitrated_by_type, @old_arbitrated_by_id, @old_arbitrated_by_id_type, @old_authorization_received_dt, @old_order_determining_protest_sent_dt, @old_order_determining_protest_received_dt, @old_arbitration_received_dt, @old_payment_amount, @old_check_money_order_number, @old_filed_timely_flag, @old_taxes_not_delinquent_flag, @old_taxes_verified_dt, @old_taxes_verified_by_id, @old_owner_opinion_of_value, @old_reject_dt, @old_reject_reason, @old_reject_letter_print_dt, @old_request_sent_dt, @old_request_letter_printed_dt, @old_certified_mailer_printed_dt, @old_state_approval_dt, @old_arbitrator_selection_dt, @old_arbitrator_selection_letter_printed_dt, @old_arbitrator_selection_due_dt, @old_plaintiff_arbitrator_id, @old_cad_arbitrator_id, @old_arbitrator_assigned_id, @old_arbitrator_assigned_dt, @old_recording_start_dt, @old_recording_end_dt, @old_estimated_completion_dt, @old_arbitration_dt, @old_arbitration_place, @old_arbitration_method, @old_arbitration_completion_dt, @old_appraiser_id, @old_comments, @old_evidence_prepared_dt, @old_evidence_prepared_staff, @old_evidence_letter_printed_dt, @old_additional_evidence_requested_dt, @old_additional_evidence_type, @old_additional_evidence_letter_printed_dt, @old_additional_evidence_prepared_dt, @old_additional_evidence_prepared_staff, @old_additional_evidence_delivery_dt, @old_arbitrators_assigned_value, @old_arbitrators_opinion_of_value, @old_arbitrators_opinion_of_value_override, @old_arbitrators_arb_value, @old_arbitrators_arb_value_override, @old_arbitrators_diff_arb_value, @old_arbitrators_diff_opinion_of_value, @old_arbitration_decision, @old_cad_arbitrator_fee_dt, @old_cad_arbitrator_check_number, @old_cad_arbitrator_fee_amt, @old_closed_pacs_user_id, @new_arbitration_id, @new_prop_val_yr, @new_cad_id, @new_ref_id, @new_cad_arbitration_number, @new_arbitration_status, @new_arbitration_status_dt, @new_arbitration_status_changed_user_id, @new_create_dt, @new_created_by, @new_arbitrated_by_type, @new_arbitrated_by_id, @new_arbitrated_by_id_type, @new_authorization_received_dt, @new_order_determining_protest_sent_dt, @new_order_determining_protest_received_dt, @new_arbitration_received_dt, @new_payment_amount, @new_check_money_order_number, @new_filed_timely_flag, @new_taxes_not_delinquent_flag, @new_taxes_verified_dt, @new_taxes_verified_by_id, @new_owner_opinion_of_value, @new_reject_dt, @new_reject_reason, @new_reject_letter_print_dt, @new_request_sent_dt, @new_request_letter_printed_dt, @new_certified_mailer_printed_dt, @new_state_approval_dt, @new_arbitrator_selection_dt, @new_arbitrator_selection_letter_printed_dt, @new_arbitrator_selection_due_dt, @new_plaintiff_arbitrator_id, @new_cad_arbitrator_id, @new_arbitrator_assigned_id, @new_arbitrator_assigned_dt, @new_recording_start_dt, @new_recording_end_dt, @new_estimated_completion_dt, @new_arbitration_dt, @new_arbitration_place, @new_arbitration_method, @new_arbitration_completion_dt, @new_appraiser_id, @new_comments, @new_evidence_prepared_dt, @new_evidence_prepared_staff, @new_evidence_letter_printed_dt, @new_additional_evidence_requested_dt, @new_additional_evidence_type, @new_additional_evidence_letter_printed_dt, @new_additional_evidence_prepared_dt, @new_additional_evidence_prepared_staff, @new_additional_evidence_delivery_dt, @new_arbitrators_assigned_value, @new_arbitrators_opinion_of_value, @new_arbitrators_opinion_of_value_override, @new_arbitrators_arb_value, @new_arbitrators_arb_value_override, @new_arbitrators_diff_arb_value, @new_arbitrators_diff_opinion_of_value, @new_arbitration_decision, @new_cad_arbitrator_fee_dt, @new_cad_arbitrator_check_number, @new_cad_arbitrator_fee_amt, @new_closed_pacs_user_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if (
          @old_arbitration_id <> @new_arbitration_id
          or
          ( @old_arbitration_id is null and @new_arbitration_id is not null ) 
          or
          ( @old_arbitration_id is not null and @new_arbitration_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9304, convert(varchar(255), @old_arbitration_id), convert(varchar(255), @new_arbitration_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
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
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cad_id <> @new_cad_id
          or
          ( @old_cad_id is null and @new_cad_id is not null ) 
          or
          ( @old_cad_id is not null and @new_cad_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'cad_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9335, convert(varchar(255), @old_cad_id), convert(varchar(255), @new_cad_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_ref_id <> @new_ref_id
          or
          ( @old_ref_id is null and @new_ref_id is not null ) 
          or
          ( @old_ref_id is not null and @new_ref_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'ref_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 4326, convert(varchar(255), @old_ref_id), convert(varchar(255), @new_ref_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cad_arbitration_number <> @new_cad_arbitration_number
          or
          ( @old_cad_arbitration_number is null and @new_cad_arbitration_number is not null ) 
          or
          ( @old_cad_arbitration_number is not null and @new_cad_arbitration_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'cad_arbitration_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9293, convert(varchar(255), @old_cad_arbitration_number), convert(varchar(255), @new_cad_arbitration_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_status <> @new_arbitration_status
          or
          ( @old_arbitration_status is null and @new_arbitration_status is not null ) 
          or
          ( @old_arbitration_status is not null and @new_arbitration_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9291, convert(varchar(255), @old_arbitration_status), convert(varchar(255), @new_arbitration_status), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_status_dt <> @new_arbitration_status_dt
          or
          ( @old_arbitration_status_dt is null and @new_arbitration_status_dt is not null ) 
          or
          ( @old_arbitration_status_dt is not null and @new_arbitration_status_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_status_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9322, convert(varchar(255), @old_arbitration_status_dt), convert(varchar(255), @new_arbitration_status_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_status_changed_user_id <> @new_arbitration_status_changed_user_id
          or
          ( @old_arbitration_status_changed_user_id is null and @new_arbitration_status_changed_user_id is not null ) 
          or
          ( @old_arbitration_status_changed_user_id is not null and @new_arbitration_status_changed_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_status_changed_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9286, convert(varchar(255), @old_arbitration_status_changed_user_id), convert(varchar(255), @new_arbitration_status_changed_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_create_dt <> @new_create_dt
          or
          ( @old_create_dt is null and @new_create_dt is not null ) 
          or
          ( @old_create_dt is not null and @new_create_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'create_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 917, convert(varchar(255), @old_create_dt), convert(varchar(255), @new_create_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_created_by <> @new_created_by
          or
          ( @old_created_by is null and @new_created_by is not null ) 
          or
          ( @old_created_by is not null and @new_created_by is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'created_by' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 918, convert(varchar(255), @old_created_by), convert(varchar(255), @new_created_by), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrated_by_type <> @new_arbitrated_by_type
          or
          ( @old_arbitrated_by_type is null and @new_arbitrated_by_type is not null ) 
          or
          ( @old_arbitrated_by_type is not null and @new_arbitrated_by_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrated_by_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9301, convert(varchar(255), @old_arbitrated_by_type), convert(varchar(255), @new_arbitrated_by_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrated_by_id <> @new_arbitrated_by_id
          or
          ( @old_arbitrated_by_id is null and @new_arbitrated_by_id is not null ) 
          or
          ( @old_arbitrated_by_id is not null and @new_arbitrated_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrated_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9342, convert(varchar(255), @old_arbitrated_by_id), convert(varchar(255), @new_arbitrated_by_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrated_by_id_type <> @new_arbitrated_by_id_type
          or
          ( @old_arbitrated_by_id_type is null and @new_arbitrated_by_id_type is not null ) 
          or
          ( @old_arbitrated_by_id_type is not null and @new_arbitrated_by_id_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrated_by_id_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9329, convert(varchar(255), @old_arbitrated_by_id_type), convert(varchar(255), @new_arbitrated_by_id_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_authorization_received_dt <> @new_authorization_received_dt
          or
          ( @old_authorization_received_dt is null and @new_authorization_received_dt is not null ) 
          or
          ( @old_authorization_received_dt is not null and @new_authorization_received_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'authorization_received_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9331, convert(varchar(255), @old_authorization_received_dt), convert(varchar(255), @new_authorization_received_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_order_determining_protest_sent_dt <> @new_order_determining_protest_sent_dt
          or
          ( @old_order_determining_protest_sent_dt is null and @new_order_determining_protest_sent_dt is not null ) 
          or
          ( @old_order_determining_protest_sent_dt is not null and @new_order_determining_protest_sent_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'order_determining_protest_sent_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9343, convert(varchar(255), @old_order_determining_protest_sent_dt), convert(varchar(255), @new_order_determining_protest_sent_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_order_determining_protest_received_dt <> @new_order_determining_protest_received_dt
          or
          ( @old_order_determining_protest_received_dt is null and @new_order_determining_protest_received_dt is not null ) 
          or
          ( @old_order_determining_protest_received_dt is not null and @new_order_determining_protest_received_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'order_determining_protest_received_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9294, convert(varchar(255), @old_order_determining_protest_received_dt), convert(varchar(255), @new_order_determining_protest_received_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_received_dt <> @new_arbitration_received_dt
          or
          ( @old_arbitration_received_dt is null and @new_arbitration_received_dt is not null ) 
          or
          ( @old_arbitration_received_dt is not null and @new_arbitration_received_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_received_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9284, convert(varchar(255), @old_arbitration_received_dt), convert(varchar(255), @new_arbitration_received_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_payment_amount <> @new_payment_amount
          or
          ( @old_payment_amount is null and @new_payment_amount is not null ) 
          or
          ( @old_payment_amount is not null and @new_payment_amount is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'payment_amount' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9290, convert(varchar(255), @old_payment_amount), convert(varchar(255), @new_payment_amount), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_check_money_order_number <> @new_check_money_order_number
          or
          ( @old_check_money_order_number is null and @new_check_money_order_number is not null ) 
          or
          ( @old_check_money_order_number is not null and @new_check_money_order_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'check_money_order_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9302, convert(varchar(255), @old_check_money_order_number), convert(varchar(255), @new_check_money_order_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_filed_timely_flag <> @new_filed_timely_flag
          or
          ( @old_filed_timely_flag is null and @new_filed_timely_flag is not null ) 
          or
          ( @old_filed_timely_flag is not null and @new_filed_timely_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'filed_timely_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9328, convert(varchar(255), @old_filed_timely_flag), convert(varchar(255), @new_filed_timely_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_taxes_not_delinquent_flag <> @new_taxes_not_delinquent_flag
          or
          ( @old_taxes_not_delinquent_flag is null and @new_taxes_not_delinquent_flag is not null ) 
          or
          ( @old_taxes_not_delinquent_flag is not null and @new_taxes_not_delinquent_flag is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'taxes_not_delinquent_flag' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9345, convert(varchar(255), @old_taxes_not_delinquent_flag), convert(varchar(255), @new_taxes_not_delinquent_flag), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_taxes_verified_dt <> @new_taxes_verified_dt
          or
          ( @old_taxes_verified_dt is null and @new_taxes_verified_dt is not null ) 
          or
          ( @old_taxes_verified_dt is not null and @new_taxes_verified_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'taxes_verified_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9315, convert(varchar(255), @old_taxes_verified_dt), convert(varchar(255), @new_taxes_verified_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_taxes_verified_by_id <> @new_taxes_verified_by_id
          or
          ( @old_taxes_verified_by_id is null and @new_taxes_verified_by_id is not null ) 
          or
          ( @old_taxes_verified_by_id is not null and @new_taxes_verified_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'taxes_verified_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9319, convert(varchar(255), @old_taxes_verified_by_id), convert(varchar(255), @new_taxes_verified_by_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_owner_opinion_of_value <> @new_owner_opinion_of_value
          or
          ( @old_owner_opinion_of_value is null and @new_owner_opinion_of_value is not null ) 
          or
          ( @old_owner_opinion_of_value is not null and @new_owner_opinion_of_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'owner_opinion_of_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9341, convert(varchar(255), @old_owner_opinion_of_value), convert(varchar(255), @new_owner_opinion_of_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_reject_dt <> @new_reject_dt
          or
          ( @old_reject_dt is null and @new_reject_dt is not null ) 
          or
          ( @old_reject_dt is not null and @new_reject_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'reject_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9325, convert(varchar(255), @old_reject_dt), convert(varchar(255), @new_reject_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_reject_reason <> @new_reject_reason
          or
          ( @old_reject_reason is null and @new_reject_reason is not null ) 
          or
          ( @old_reject_reason is not null and @new_reject_reason is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'reject_reason' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9298, convert(varchar(255), @old_reject_reason), convert(varchar(255), @new_reject_reason), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_reject_letter_print_dt <> @new_reject_letter_print_dt
          or
          ( @old_reject_letter_print_dt is null and @new_reject_letter_print_dt is not null ) 
          or
          ( @old_reject_letter_print_dt is not null and @new_reject_letter_print_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'reject_letter_print_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9297, convert(varchar(255), @old_reject_letter_print_dt), convert(varchar(255), @new_reject_letter_print_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_request_sent_dt <> @new_request_sent_dt
          or
          ( @old_request_sent_dt is null and @new_request_sent_dt is not null ) 
          or
          ( @old_request_sent_dt is not null and @new_request_sent_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'request_sent_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9305, convert(varchar(255), @old_request_sent_dt), convert(varchar(255), @new_request_sent_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_request_letter_printed_dt <> @new_request_letter_printed_dt
          or
          ( @old_request_letter_printed_dt is null and @new_request_letter_printed_dt is not null ) 
          or
          ( @old_request_letter_printed_dt is not null and @new_request_letter_printed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'request_letter_printed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9287, convert(varchar(255), @old_request_letter_printed_dt), convert(varchar(255), @new_request_letter_printed_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_certified_mailer_printed_dt <> @new_certified_mailer_printed_dt
          or
          ( @old_certified_mailer_printed_dt is null and @new_certified_mailer_printed_dt is not null ) 
          or
          ( @old_certified_mailer_printed_dt is not null and @new_certified_mailer_printed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'certified_mailer_printed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9310, convert(varchar(255), @old_certified_mailer_printed_dt), convert(varchar(255), @new_certified_mailer_printed_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_state_approval_dt <> @new_state_approval_dt
          or
          ( @old_state_approval_dt is null and @new_state_approval_dt is not null ) 
          or
          ( @old_state_approval_dt is not null and @new_state_approval_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'state_approval_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9323, convert(varchar(255), @old_state_approval_dt), convert(varchar(255), @new_state_approval_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrator_selection_dt <> @new_arbitrator_selection_dt
          or
          ( @old_arbitrator_selection_dt is null and @new_arbitrator_selection_dt is not null ) 
          or
          ( @old_arbitrator_selection_dt is not null and @new_arbitrator_selection_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrator_selection_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9307, convert(varchar(255), @old_arbitrator_selection_dt), convert(varchar(255), @new_arbitrator_selection_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrator_selection_letter_printed_dt <> @new_arbitrator_selection_letter_printed_dt
          or
          ( @old_arbitrator_selection_letter_printed_dt is null and @new_arbitrator_selection_letter_printed_dt is not null ) 
          or
          ( @old_arbitrator_selection_letter_printed_dt is not null and @new_arbitrator_selection_letter_printed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrator_selection_letter_printed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9317, convert(varchar(255), @old_arbitrator_selection_letter_printed_dt), convert(varchar(255), @new_arbitrator_selection_letter_printed_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrator_selection_due_dt <> @new_arbitrator_selection_due_dt
          or
          ( @old_arbitrator_selection_due_dt is null and @new_arbitrator_selection_due_dt is not null ) 
          or
          ( @old_arbitrator_selection_due_dt is not null and @new_arbitrator_selection_due_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrator_selection_due_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9283, convert(varchar(255), @old_arbitrator_selection_due_dt), convert(varchar(255), @new_arbitrator_selection_due_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_plaintiff_arbitrator_id <> @new_plaintiff_arbitrator_id
          or
          ( @old_plaintiff_arbitrator_id is null and @new_plaintiff_arbitrator_id is not null ) 
          or
          ( @old_plaintiff_arbitrator_id is not null and @new_plaintiff_arbitrator_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'plaintiff_arbitrator_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9285, convert(varchar(255), @old_plaintiff_arbitrator_id), convert(varchar(255), @new_plaintiff_arbitrator_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cad_arbitrator_id <> @new_cad_arbitrator_id
          or
          ( @old_cad_arbitrator_id is null and @new_cad_arbitrator_id is not null ) 
          or
          ( @old_cad_arbitrator_id is not null and @new_cad_arbitrator_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'cad_arbitrator_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9288, convert(varchar(255), @old_cad_arbitrator_id), convert(varchar(255), @new_cad_arbitrator_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrator_assigned_id <> @new_arbitrator_assigned_id
          or
          ( @old_arbitrator_assigned_id is null and @new_arbitrator_assigned_id is not null ) 
          or
          ( @old_arbitrator_assigned_id is not null and @new_arbitrator_assigned_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrator_assigned_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9306, convert(varchar(255), @old_arbitrator_assigned_id), convert(varchar(255), @new_arbitrator_assigned_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrator_assigned_dt <> @new_arbitrator_assigned_dt
          or
          ( @old_arbitrator_assigned_dt is null and @new_arbitrator_assigned_dt is not null ) 
          or
          ( @old_arbitrator_assigned_dt is not null and @new_arbitrator_assigned_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrator_assigned_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9334, convert(varchar(255), @old_arbitrator_assigned_dt), convert(varchar(255), @new_arbitrator_assigned_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_recording_start_dt <> @new_recording_start_dt
          or
          ( @old_recording_start_dt is null and @new_recording_start_dt is not null ) 
          or
          ( @old_recording_start_dt is not null and @new_recording_start_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'recording_start_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9308, convert(varchar(255), @old_recording_start_dt), convert(varchar(255), @new_recording_start_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_recording_end_dt <> @new_recording_end_dt
          or
          ( @old_recording_end_dt is null and @new_recording_end_dt is not null ) 
          or
          ( @old_recording_end_dt is not null and @new_recording_end_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'recording_end_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9296, convert(varchar(255), @old_recording_end_dt), convert(varchar(255), @new_recording_end_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_estimated_completion_dt <> @new_estimated_completion_dt
          or
          ( @old_estimated_completion_dt is null and @new_estimated_completion_dt is not null ) 
          or
          ( @old_estimated_completion_dt is not null and @new_estimated_completion_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'estimated_completion_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9330, convert(varchar(255), @old_estimated_completion_dt), convert(varchar(255), @new_estimated_completion_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_dt <> @new_arbitration_dt
          or
          ( @old_arbitration_dt is null and @new_arbitration_dt is not null ) 
          or
          ( @old_arbitration_dt is not null and @new_arbitration_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9320, convert(varchar(255), @old_arbitration_dt), convert(varchar(255), @new_arbitration_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_place <> @new_arbitration_place
          or
          ( @old_arbitration_place is null and @new_arbitration_place is not null ) 
          or
          ( @old_arbitration_place is not null and @new_arbitration_place is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_place' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9337, convert(varchar(255), @old_arbitration_place), convert(varchar(255), @new_arbitration_place), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_method <> @new_arbitration_method
          or
          ( @old_arbitration_method is null and @new_arbitration_method is not null ) 
          or
          ( @old_arbitration_method is not null and @new_arbitration_method is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_method' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9326, convert(varchar(255), @old_arbitration_method), convert(varchar(255), @new_arbitration_method), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_completion_dt <> @new_arbitration_completion_dt
          or
          ( @old_arbitration_completion_dt is null and @new_arbitration_completion_dt is not null ) 
          or
          ( @old_arbitration_completion_dt is not null and @new_arbitration_completion_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_completion_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9316, convert(varchar(255), @old_arbitration_completion_dt), convert(varchar(255), @new_arbitration_completion_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_appraiser_id <> @new_appraiser_id
          or
          ( @old_appraiser_id is null and @new_appraiser_id is not null ) 
          or
          ( @old_appraiser_id is not null and @new_appraiser_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'appraiser_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 249, convert(varchar(255), @old_appraiser_id), convert(varchar(255), @new_appraiser_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_comments <> @new_comments
          or
          ( @old_comments is null and @new_comments is not null ) 
          or
          ( @old_comments is not null and @new_comments is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'comments' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 828, convert(varchar(255), @old_comments), convert(varchar(255), @new_comments), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_evidence_prepared_dt <> @new_evidence_prepared_dt
          or
          ( @old_evidence_prepared_dt is null and @new_evidence_prepared_dt is not null ) 
          or
          ( @old_evidence_prepared_dt is not null and @new_evidence_prepared_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'evidence_prepared_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9300, convert(varchar(255), @old_evidence_prepared_dt), convert(varchar(255), @new_evidence_prepared_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_evidence_prepared_staff <> @new_evidence_prepared_staff
          or
          ( @old_evidence_prepared_staff is null and @new_evidence_prepared_staff is not null ) 
          or
          ( @old_evidence_prepared_staff is not null and @new_evidence_prepared_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'evidence_prepared_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9338, convert(varchar(255), @old_evidence_prepared_staff), convert(varchar(255), @new_evidence_prepared_staff), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_evidence_letter_printed_dt <> @new_evidence_letter_printed_dt
          or
          ( @old_evidence_letter_printed_dt is null and @new_evidence_letter_printed_dt is not null ) 
          or
          ( @old_evidence_letter_printed_dt is not null and @new_evidence_letter_printed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'evidence_letter_printed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9292, convert(varchar(255), @old_evidence_letter_printed_dt), convert(varchar(255), @new_evidence_letter_printed_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_additional_evidence_requested_dt <> @new_additional_evidence_requested_dt
          or
          ( @old_additional_evidence_requested_dt is null and @new_additional_evidence_requested_dt is not null ) 
          or
          ( @old_additional_evidence_requested_dt is not null and @new_additional_evidence_requested_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'additional_evidence_requested_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9333, convert(varchar(255), @old_additional_evidence_requested_dt), convert(varchar(255), @new_additional_evidence_requested_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_additional_evidence_type <> @new_additional_evidence_type
          or
          ( @old_additional_evidence_type is null and @new_additional_evidence_type is not null ) 
          or
          ( @old_additional_evidence_type is not null and @new_additional_evidence_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'additional_evidence_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9314, convert(varchar(255), @old_additional_evidence_type), convert(varchar(255), @new_additional_evidence_type), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_additional_evidence_letter_printed_dt <> @new_additional_evidence_letter_printed_dt
          or
          ( @old_additional_evidence_letter_printed_dt is null and @new_additional_evidence_letter_printed_dt is not null ) 
          or
          ( @old_additional_evidence_letter_printed_dt is not null and @new_additional_evidence_letter_printed_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'additional_evidence_letter_printed_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9332, convert(varchar(255), @old_additional_evidence_letter_printed_dt), convert(varchar(255), @new_additional_evidence_letter_printed_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_additional_evidence_prepared_dt <> @new_additional_evidence_prepared_dt
          or
          ( @old_additional_evidence_prepared_dt is null and @new_additional_evidence_prepared_dt is not null ) 
          or
          ( @old_additional_evidence_prepared_dt is not null and @new_additional_evidence_prepared_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'additional_evidence_prepared_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9289, convert(varchar(255), @old_additional_evidence_prepared_dt), convert(varchar(255), @new_additional_evidence_prepared_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_additional_evidence_prepared_staff <> @new_additional_evidence_prepared_staff
          or
          ( @old_additional_evidence_prepared_staff is null and @new_additional_evidence_prepared_staff is not null ) 
          or
          ( @old_additional_evidence_prepared_staff is not null and @new_additional_evidence_prepared_staff is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'additional_evidence_prepared_staff' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9336, convert(varchar(255), @old_additional_evidence_prepared_staff), convert(varchar(255), @new_additional_evidence_prepared_staff), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_additional_evidence_delivery_dt <> @new_additional_evidence_delivery_dt
          or
          ( @old_additional_evidence_delivery_dt is null and @new_additional_evidence_delivery_dt is not null ) 
          or
          ( @old_additional_evidence_delivery_dt is not null and @new_additional_evidence_delivery_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'additional_evidence_delivery_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9303, convert(varchar(255), @old_additional_evidence_delivery_dt), convert(varchar(255), @new_additional_evidence_delivery_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrators_assigned_value <> @new_arbitrators_assigned_value
          or
          ( @old_arbitrators_assigned_value is null and @new_arbitrators_assigned_value is not null ) 
          or
          ( @old_arbitrators_assigned_value is not null and @new_arbitrators_assigned_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrators_assigned_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9321, convert(varchar(255), @old_arbitrators_assigned_value), convert(varchar(255), @new_arbitrators_assigned_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrators_opinion_of_value <> @new_arbitrators_opinion_of_value
          or
          ( @old_arbitrators_opinion_of_value is null and @new_arbitrators_opinion_of_value is not null ) 
          or
          ( @old_arbitrators_opinion_of_value is not null and @new_arbitrators_opinion_of_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrators_opinion_of_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9324, convert(varchar(255), @old_arbitrators_opinion_of_value), convert(varchar(255), @new_arbitrators_opinion_of_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrators_opinion_of_value_override <> @new_arbitrators_opinion_of_value_override
          or
          ( @old_arbitrators_opinion_of_value_override is null and @new_arbitrators_opinion_of_value_override is not null ) 
          or
          ( @old_arbitrators_opinion_of_value_override is not null and @new_arbitrators_opinion_of_value_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrators_opinion_of_value_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9312, convert(varchar(255), @old_arbitrators_opinion_of_value_override), convert(varchar(255), @new_arbitrators_opinion_of_value_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrators_arb_value <> @new_arbitrators_arb_value
          or
          ( @old_arbitrators_arb_value is null and @new_arbitrators_arb_value is not null ) 
          or
          ( @old_arbitrators_arb_value is not null and @new_arbitrators_arb_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrators_arb_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9340, convert(varchar(255), @old_arbitrators_arb_value), convert(varchar(255), @new_arbitrators_arb_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrators_arb_value_override <> @new_arbitrators_arb_value_override
          or
          ( @old_arbitrators_arb_value_override is null and @new_arbitrators_arb_value_override is not null ) 
          or
          ( @old_arbitrators_arb_value_override is not null and @new_arbitrators_arb_value_override is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrators_arb_value_override' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9299, convert(varchar(255), @old_arbitrators_arb_value_override), convert(varchar(255), @new_arbitrators_arb_value_override), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrators_diff_arb_value <> @new_arbitrators_diff_arb_value
          or
          ( @old_arbitrators_diff_arb_value is null and @new_arbitrators_diff_arb_value is not null ) 
          or
          ( @old_arbitrators_diff_arb_value is not null and @new_arbitrators_diff_arb_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrators_diff_arb_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9339, convert(varchar(255), @old_arbitrators_diff_arb_value), convert(varchar(255), @new_arbitrators_diff_arb_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitrators_diff_opinion_of_value <> @new_arbitrators_diff_opinion_of_value
          or
          ( @old_arbitrators_diff_opinion_of_value is null and @new_arbitrators_diff_opinion_of_value is not null ) 
          or
          ( @old_arbitrators_diff_opinion_of_value is not null and @new_arbitrators_diff_opinion_of_value is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitrators_diff_opinion_of_value' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9318, convert(varchar(255), @old_arbitrators_diff_opinion_of_value), convert(varchar(255), @new_arbitrators_diff_opinion_of_value), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_arbitration_decision <> @new_arbitration_decision
          or
          ( @old_arbitration_decision is null and @new_arbitration_decision is not null ) 
          or
          ( @old_arbitration_decision is not null and @new_arbitration_decision is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'arbitration_decision' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9313, convert(varchar(255), @old_arbitration_decision), convert(varchar(255), @new_arbitration_decision), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cad_arbitrator_fee_dt <> @new_cad_arbitrator_fee_dt
          or
          ( @old_cad_arbitrator_fee_dt is null and @new_cad_arbitrator_fee_dt is not null ) 
          or
          ( @old_cad_arbitrator_fee_dt is not null and @new_cad_arbitrator_fee_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'cad_arbitrator_fee_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9344, convert(varchar(255), @old_cad_arbitrator_fee_dt), convert(varchar(255), @new_cad_arbitrator_fee_dt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cad_arbitrator_check_number <> @new_cad_arbitrator_check_number
          or
          ( @old_cad_arbitrator_check_number is null and @new_cad_arbitrator_check_number is not null ) 
          or
          ( @old_cad_arbitrator_check_number is not null and @new_cad_arbitrator_check_number is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'cad_arbitrator_check_number' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9295, convert(varchar(255), @old_cad_arbitrator_check_number), convert(varchar(255), @new_cad_arbitrator_check_number), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_cad_arbitrator_fee_amt <> @new_cad_arbitrator_fee_amt
          or
          ( @old_cad_arbitrator_fee_amt is null and @new_cad_arbitrator_fee_amt is not null ) 
          or
          ( @old_cad_arbitrator_fee_amt is not null and @new_cad_arbitrator_fee_amt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'cad_arbitrator_fee_amt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 9311, convert(varchar(255), @old_cad_arbitrator_fee_amt), convert(varchar(255), @new_cad_arbitrator_fee_amt), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     if (
          @old_closed_pacs_user_id <> @new_closed_pacs_user_id
          or
          ( @old_closed_pacs_user_id is null and @new_closed_pacs_user_id is not null ) 
          or
          ( @old_closed_pacs_user_id is not null and @new_closed_pacs_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arbitration' and
                    chg_log_columns = 'closed_pacs_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 1087, 771, convert(varchar(255), @old_closed_pacs_user_id), convert(varchar(255), @new_closed_pacs_user_id), @tvar_szRefID )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @new_arbitration_id), @new_arbitration_id)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @new_prop_val_yr), case when @new_prop_val_yr > @tvar_intMin and @new_prop_val_yr < @tvar_intMax then convert(int, round(@new_prop_val_yr, 0, 1)) else 0 end)
          end
     end
 
     fetch next from curRows into @old_arbitration_id, @old_prop_val_yr, @old_cad_id, @old_ref_id, @old_cad_arbitration_number, @old_arbitration_status, @old_arbitration_status_dt, @old_arbitration_status_changed_user_id, @old_create_dt, @old_created_by, @old_arbitrated_by_type, @old_arbitrated_by_id, @old_arbitrated_by_id_type, @old_authorization_received_dt, @old_order_determining_protest_sent_dt, @old_order_determining_protest_received_dt, @old_arbitration_received_dt, @old_payment_amount, @old_check_money_order_number, @old_filed_timely_flag, @old_taxes_not_delinquent_flag, @old_taxes_verified_dt, @old_taxes_verified_by_id, @old_owner_opinion_of_value, @old_reject_dt, @old_reject_reason, @old_reject_letter_print_dt, @old_request_sent_dt, @old_request_letter_printed_dt, @old_certified_mailer_printed_dt, @old_state_approval_dt, @old_arbitrator_selection_dt, @old_arbitrator_selection_letter_printed_dt, @old_arbitrator_selection_due_dt, @old_plaintiff_arbitrator_id, @old_cad_arbitrator_id, @old_arbitrator_assigned_id, @old_arbitrator_assigned_dt, @old_recording_start_dt, @old_recording_end_dt, @old_estimated_completion_dt, @old_arbitration_dt, @old_arbitration_place, @old_arbitration_method, @old_arbitration_completion_dt, @old_appraiser_id, @old_comments, @old_evidence_prepared_dt, @old_evidence_prepared_staff, @old_evidence_letter_printed_dt, @old_additional_evidence_requested_dt, @old_additional_evidence_type, @old_additional_evidence_letter_printed_dt, @old_additional_evidence_prepared_dt, @old_additional_evidence_prepared_staff, @old_additional_evidence_delivery_dt, @old_arbitrators_assigned_value, @old_arbitrators_opinion_of_value, @old_arbitrators_opinion_of_value_override, @old_arbitrators_arb_value, @old_arbitrators_arb_value_override, @old_arbitrators_diff_arb_value, @old_arbitrators_diff_opinion_of_value, @old_arbitration_decision, @old_cad_arbitrator_fee_dt, @old_cad_arbitrator_check_number, @old_cad_arbitrator_fee_amt, @old_closed_pacs_user_id, @new_arbitration_id, @new_prop_val_yr, @new_cad_id, @new_ref_id, @new_cad_arbitration_number, @new_arbitration_status, @new_arbitration_status_dt, @new_arbitration_status_changed_user_id, @new_create_dt, @new_created_by, @new_arbitrated_by_type, @new_arbitrated_by_id, @new_arbitrated_by_id_type, @new_authorization_received_dt, @new_order_determining_protest_sent_dt, @new_order_determining_protest_received_dt, @new_arbitration_received_dt, @new_payment_amount, @new_check_money_order_number, @new_filed_timely_flag, @new_taxes_not_delinquent_flag, @new_taxes_verified_dt, @new_taxes_verified_by_id, @new_owner_opinion_of_value, @new_reject_dt, @new_reject_reason, @new_reject_letter_print_dt, @new_request_sent_dt, @new_request_letter_printed_dt, @new_certified_mailer_printed_dt, @new_state_approval_dt, @new_arbitrator_selection_dt, @new_arbitrator_selection_letter_printed_dt, @new_arbitrator_selection_due_dt, @new_plaintiff_arbitrator_id, @new_cad_arbitrator_id, @new_arbitrator_assigned_id, @new_arbitrator_assigned_dt, @new_recording_start_dt, @new_recording_end_dt, @new_estimated_completion_dt, @new_arbitration_dt, @new_arbitration_place, @new_arbitration_method, @new_arbitration_completion_dt, @new_appraiser_id, @new_comments, @new_evidence_prepared_dt, @new_evidence_prepared_staff, @new_evidence_letter_printed_dt, @new_additional_evidence_requested_dt, @new_additional_evidence_type, @new_additional_evidence_letter_printed_dt, @new_additional_evidence_prepared_dt, @new_additional_evidence_prepared_staff, @new_additional_evidence_delivery_dt, @new_arbitrators_assigned_value, @new_arbitrators_opinion_of_value, @new_arbitrators_opinion_of_value_override, @new_arbitrators_arb_value, @new_arbitrators_arb_value_override, @new_arbitrators_diff_arb_value, @new_arbitrators_diff_opinion_of_value, @new_arbitration_decision, @new_cad_arbitrator_fee_dt, @new_cad_arbitrator_check_number, @new_cad_arbitrator_fee_amt, @new_closed_pacs_user_id
end
 
close curRows
deallocate curRows

GO


create trigger tr_arbitration_insert_ChangeLog
on arbitration
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
 
declare @arbitration_id int
declare @prop_val_yr numeric(4,0)
declare @cad_id varchar(3)
declare @ref_id varchar(20)
declare @cad_arbitration_number varchar(50)
declare @arbitration_status varchar(10)
declare @arbitration_status_dt datetime
declare @arbitration_status_changed_user_id int
declare @create_dt datetime
declare @created_by int
declare @arbitrated_by_type varchar(10)
declare @arbitrated_by_id int
declare @arbitrated_by_id_type int
declare @authorization_received_dt datetime
declare @order_determining_protest_sent_dt datetime
declare @order_determining_protest_received_dt datetime
declare @arbitration_received_dt datetime
declare @payment_amount numeric(7,2)
declare @check_money_order_number varchar(20)
declare @filed_timely_flag bit
declare @taxes_not_delinquent_flag bit
declare @taxes_verified_dt datetime
declare @taxes_verified_by_id int
declare @owner_opinion_of_value numeric(14,0)
declare @reject_dt datetime
declare @reject_reason varchar(10)
declare @reject_letter_print_dt datetime
declare @request_sent_dt datetime
declare @request_letter_printed_dt datetime
declare @certified_mailer_printed_dt datetime
declare @state_approval_dt datetime
declare @arbitrator_selection_dt datetime
declare @arbitrator_selection_letter_printed_dt datetime
declare @arbitrator_selection_due_dt datetime
declare @plaintiff_arbitrator_id int
declare @cad_arbitrator_id int
declare @arbitrator_assigned_id int
declare @arbitrator_assigned_dt datetime
declare @recording_start_dt datetime
declare @recording_end_dt datetime
declare @estimated_completion_dt datetime
declare @arbitration_dt datetime
declare @arbitration_place varchar(128)
declare @arbitration_method varchar(10)
declare @arbitration_completion_dt datetime
declare @appraiser_id int
declare @comments varchar(1024)
declare @evidence_prepared_dt datetime
declare @evidence_prepared_staff int
declare @evidence_letter_printed_dt datetime
declare @additional_evidence_requested_dt datetime
declare @additional_evidence_type varchar(10)
declare @additional_evidence_letter_printed_dt datetime
declare @additional_evidence_prepared_dt datetime
declare @additional_evidence_prepared_staff int
declare @additional_evidence_delivery_dt datetime
declare @arbitrators_assigned_value numeric(14,0)
declare @arbitrators_opinion_of_value numeric(14,0)
declare @arbitrators_opinion_of_value_override bit
declare @arbitrators_arb_value numeric(14,0)
declare @arbitrators_arb_value_override bit
declare @arbitrators_diff_arb_value numeric(14,0)
declare @arbitrators_diff_opinion_of_value numeric(14,0)
declare @arbitration_decision bit
declare @cad_arbitrator_fee_dt datetime
declare @cad_arbitrator_check_number varchar(20)
declare @cad_arbitrator_fee_amt numeric(7,2)
declare @closed_pacs_user_id int
 
declare curRows cursor
for
     select arbitration_id, prop_val_yr, cad_id, ref_id, cad_arbitration_number, arbitration_status, arbitration_status_dt, arbitration_status_changed_user_id, create_dt, created_by, arbitrated_by_type, arbitrated_by_id, arbitrated_by_id_type, authorization_received_dt, order_determining_protest_sent_dt, order_determining_protest_received_dt, arbitration_received_dt, payment_amount, check_money_order_number, filed_timely_flag, taxes_not_delinquent_flag, taxes_verified_dt, taxes_verified_by_id, owner_opinion_of_value, reject_dt, reject_reason, reject_letter_print_dt, request_sent_dt, request_letter_printed_dt, certified_mailer_printed_dt, state_approval_dt, arbitrator_selection_dt, arbitrator_selection_letter_printed_dt, arbitrator_selection_due_dt, plaintiff_arbitrator_id, cad_arbitrator_id, arbitrator_assigned_id, arbitrator_assigned_dt, recording_start_dt, recording_end_dt, estimated_completion_dt, arbitration_dt, arbitration_place, arbitration_method, arbitration_completion_dt, appraiser_id, comments, evidence_prepared_dt, evidence_prepared_staff, evidence_letter_printed_dt, additional_evidence_requested_dt, additional_evidence_type, additional_evidence_letter_printed_dt, additional_evidence_prepared_dt, additional_evidence_prepared_staff, additional_evidence_delivery_dt, arbitrators_assigned_value, arbitrators_opinion_of_value, arbitrators_opinion_of_value_override, arbitrators_arb_value, arbitrators_arb_value_override, arbitrators_diff_arb_value, arbitrators_diff_opinion_of_value, arbitration_decision, cad_arbitrator_fee_dt, cad_arbitrator_check_number, cad_arbitrator_fee_amt, closed_pacs_user_id from inserted
for read only
 
open curRows
fetch next from curRows into @arbitration_id, @prop_val_yr, @cad_id, @ref_id, @cad_arbitration_number, @arbitration_status, @arbitration_status_dt, @arbitration_status_changed_user_id, @create_dt, @created_by, @arbitrated_by_type, @arbitrated_by_id, @arbitrated_by_id_type, @authorization_received_dt, @order_determining_protest_sent_dt, @order_determining_protest_received_dt, @arbitration_received_dt, @payment_amount, @check_money_order_number, @filed_timely_flag, @taxes_not_delinquent_flag, @taxes_verified_dt, @taxes_verified_by_id, @owner_opinion_of_value, @reject_dt, @reject_reason, @reject_letter_print_dt, @request_sent_dt, @request_letter_printed_dt, @certified_mailer_printed_dt, @state_approval_dt, @arbitrator_selection_dt, @arbitrator_selection_letter_printed_dt, @arbitrator_selection_due_dt, @plaintiff_arbitrator_id, @cad_arbitrator_id, @arbitrator_assigned_id, @arbitrator_assigned_dt, @recording_start_dt, @recording_end_dt, @estimated_completion_dt, @arbitration_dt, @arbitration_place, @arbitration_method, @arbitration_completion_dt, @appraiser_id, @comments, @evidence_prepared_dt, @evidence_prepared_staff, @evidence_letter_printed_dt, @additional_evidence_requested_dt, @additional_evidence_type, @additional_evidence_letter_printed_dt, @additional_evidence_prepared_dt, @additional_evidence_prepared_staff, @additional_evidence_delivery_dt, @arbitrators_assigned_value, @arbitrators_opinion_of_value, @arbitrators_opinion_of_value_override, @arbitrators_arb_value, @arbitrators_arb_value_override, @arbitrators_diff_arb_value, @arbitrators_diff_opinion_of_value, @arbitration_decision, @cad_arbitrator_fee_dt, @cad_arbitrator_check_number, @cad_arbitrator_fee_amt, @closed_pacs_user_id
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9304, null, convert(varchar(255), @arbitration_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'cad_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9335, null, convert(varchar(255), @cad_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'ref_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 4326, null, convert(varchar(255), @ref_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'cad_arbitration_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9293, null, convert(varchar(255), @cad_arbitration_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9291, null, convert(varchar(255), @arbitration_status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_status_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9322, null, convert(varchar(255), @arbitration_status_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_status_changed_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9286, null, convert(varchar(255), @arbitration_status_changed_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'create_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 917, null, convert(varchar(255), @create_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'created_by' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 918, null, convert(varchar(255), @created_by), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrated_by_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9301, null, convert(varchar(255), @arbitrated_by_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrated_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9342, null, convert(varchar(255), @arbitrated_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrated_by_id_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9329, null, convert(varchar(255), @arbitrated_by_id_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'authorization_received_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9331, null, convert(varchar(255), @authorization_received_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'order_determining_protest_sent_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9343, null, convert(varchar(255), @order_determining_protest_sent_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'order_determining_protest_received_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9294, null, convert(varchar(255), @order_determining_protest_received_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_received_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9284, null, convert(varchar(255), @arbitration_received_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'payment_amount' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9290, null, convert(varchar(255), @payment_amount), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'check_money_order_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9302, null, convert(varchar(255), @check_money_order_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'filed_timely_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9328, null, convert(varchar(255), @filed_timely_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'taxes_not_delinquent_flag' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9345, null, convert(varchar(255), @taxes_not_delinquent_flag), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'taxes_verified_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9315, null, convert(varchar(255), @taxes_verified_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'taxes_verified_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9319, null, convert(varchar(255), @taxes_verified_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'owner_opinion_of_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9341, null, convert(varchar(255), @owner_opinion_of_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'reject_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9325, null, convert(varchar(255), @reject_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'reject_reason' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9298, null, convert(varchar(255), @reject_reason), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'reject_letter_print_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9297, null, convert(varchar(255), @reject_letter_print_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'request_sent_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9305, null, convert(varchar(255), @request_sent_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'request_letter_printed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9287, null, convert(varchar(255), @request_letter_printed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'certified_mailer_printed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9310, null, convert(varchar(255), @certified_mailer_printed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'state_approval_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9323, null, convert(varchar(255), @state_approval_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrator_selection_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9307, null, convert(varchar(255), @arbitrator_selection_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrator_selection_letter_printed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9317, null, convert(varchar(255), @arbitrator_selection_letter_printed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrator_selection_due_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9283, null, convert(varchar(255), @arbitrator_selection_due_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'plaintiff_arbitrator_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9285, null, convert(varchar(255), @plaintiff_arbitrator_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'cad_arbitrator_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9288, null, convert(varchar(255), @cad_arbitrator_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrator_assigned_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9306, null, convert(varchar(255), @arbitrator_assigned_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrator_assigned_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9334, null, convert(varchar(255), @arbitrator_assigned_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'recording_start_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9308, null, convert(varchar(255), @recording_start_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'recording_end_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9296, null, convert(varchar(255), @recording_end_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'estimated_completion_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9330, null, convert(varchar(255), @estimated_completion_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9320, null, convert(varchar(255), @arbitration_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_place' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9337, null, convert(varchar(255), @arbitration_place), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_method' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9326, null, convert(varchar(255), @arbitration_method), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_completion_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9316, null, convert(varchar(255), @arbitration_completion_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'appraiser_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 249, null, convert(varchar(255), @appraiser_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'comments' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 828, null, convert(varchar(255), @comments), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'evidence_prepared_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9300, null, convert(varchar(255), @evidence_prepared_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'evidence_prepared_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9338, null, convert(varchar(255), @evidence_prepared_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'evidence_letter_printed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9292, null, convert(varchar(255), @evidence_letter_printed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'additional_evidence_requested_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9333, null, convert(varchar(255), @additional_evidence_requested_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'additional_evidence_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9314, null, convert(varchar(255), @additional_evidence_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'additional_evidence_letter_printed_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9332, null, convert(varchar(255), @additional_evidence_letter_printed_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'additional_evidence_prepared_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9289, null, convert(varchar(255), @additional_evidence_prepared_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'additional_evidence_prepared_staff' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9336, null, convert(varchar(255), @additional_evidence_prepared_staff), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'additional_evidence_delivery_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9303, null, convert(varchar(255), @additional_evidence_delivery_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrators_assigned_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9321, null, convert(varchar(255), @arbitrators_assigned_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrators_opinion_of_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9324, null, convert(varchar(255), @arbitrators_opinion_of_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrators_opinion_of_value_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9312, null, convert(varchar(255), @arbitrators_opinion_of_value_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrators_arb_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9340, null, convert(varchar(255), @arbitrators_arb_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrators_arb_value_override' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9299, null, convert(varchar(255), @arbitrators_arb_value_override), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrators_diff_arb_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9339, null, convert(varchar(255), @arbitrators_diff_arb_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitrators_diff_opinion_of_value' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9318, null, convert(varchar(255), @arbitrators_diff_opinion_of_value), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'arbitration_decision' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9313, null, convert(varchar(255), @arbitration_decision), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'cad_arbitrator_fee_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9344, null, convert(varchar(255), @cad_arbitrator_fee_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'cad_arbitrator_check_number' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9295, null, convert(varchar(255), @cad_arbitrator_check_number), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'cad_arbitrator_fee_amt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 9311, null, convert(varchar(255), @cad_arbitrator_fee_amt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arbitration' and
               chg_log_columns = 'closed_pacs_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 1087, 771, null, convert(varchar(255), @closed_pacs_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
     end
 
     fetch next from curRows into @arbitration_id, @prop_val_yr, @cad_id, @ref_id, @cad_arbitration_number, @arbitration_status, @arbitration_status_dt, @arbitration_status_changed_user_id, @create_dt, @created_by, @arbitrated_by_type, @arbitrated_by_id, @arbitrated_by_id_type, @authorization_received_dt, @order_determining_protest_sent_dt, @order_determining_protest_received_dt, @arbitration_received_dt, @payment_amount, @check_money_order_number, @filed_timely_flag, @taxes_not_delinquent_flag, @taxes_verified_dt, @taxes_verified_by_id, @owner_opinion_of_value, @reject_dt, @reject_reason, @reject_letter_print_dt, @request_sent_dt, @request_letter_printed_dt, @certified_mailer_printed_dt, @state_approval_dt, @arbitrator_selection_dt, @arbitrator_selection_letter_printed_dt, @arbitrator_selection_due_dt, @plaintiff_arbitrator_id, @cad_arbitrator_id, @arbitrator_assigned_id, @arbitrator_assigned_dt, @recording_start_dt, @recording_end_dt, @estimated_completion_dt, @arbitration_dt, @arbitration_place, @arbitration_method, @arbitration_completion_dt, @appraiser_id, @comments, @evidence_prepared_dt, @evidence_prepared_staff, @evidence_letter_printed_dt, @additional_evidence_requested_dt, @additional_evidence_type, @additional_evidence_letter_printed_dt, @additional_evidence_prepared_dt, @additional_evidence_prepared_staff, @additional_evidence_delivery_dt, @arbitrators_assigned_value, @arbitrators_opinion_of_value, @arbitrators_opinion_of_value_override, @arbitrators_arb_value, @arbitrators_arb_value_override, @arbitrators_diff_arb_value, @arbitrators_diff_opinion_of_value, @arbitration_decision, @cad_arbitrator_fee_dt, @cad_arbitrator_check_number, @cad_arbitrator_fee_amt, @closed_pacs_user_id
end
 
close curRows
deallocate curRows

GO


create trigger tr_arbitration_delete_ChangeLog
on arbitration
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
          chg_log_tables = 'arbitration' and
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
 
declare @arbitration_id int
declare @prop_val_yr numeric(4,0)
 
declare curRows cursor
for
     select arbitration_id, prop_val_yr from deleted
for read only
 
open curRows
fetch next from curRows into @arbitration_id, @prop_val_yr
 
while ( @@fetch_status = 0 )
begin
     set @tvar_szRefID = null
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 1087, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 9304, convert(varchar(24), @arbitration_id), @arbitration_id)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4083, convert(varchar(24), @prop_val_yr), case when @prop_val_yr > @tvar_intMin and @prop_val_yr < @tvar_intMax then convert(int, round(@prop_val_yr, 0, 1)) else 0 end)
 
     fetch next from curRows into @arbitration_id, @prop_val_yr
end
 
close curRows
deallocate curRows

GO

