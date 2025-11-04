CREATE TABLE [dbo].[arb_protest] (
    [appr_year]                           NUMERIC (4)    NOT NULL,
    [case_id]                             INT            NOT NULL,
    [prop_id]                             INT            NULL,
    [sup_num]                             INT            NULL,
    [prop_val_yr]                         NUMERIC (4)    NULL,
    [status]                              CHAR (10)      NULL,
    [inquiry_by_type]                     CHAR (10)      NULL,
    [inquiry_by_id]                       INT            NULL,
    [inquiry_source_cd]                   CHAR (10)      NULL,
    [inquiry_appraiser_id]                INT            NULL,
    [protest_appraiser_id]                INT            NULL,
    [inquiry_taxpayer_comment]            VARCHAR (1024) NULL,
    [inquiry_operator_comment]            VARCHAR (1024) NULL,
    [inquiry_user_id]                     INT            NULL,
    [inquiry_type_cd]                     CHAR (10)      NULL,
    [am_meeting_id]                       INT            NULL,
    [am_meeting_date]                     DATETIME       NULL,
    [am_attendee]                         CHAR (1)       NULL,
    [taxpayer_comment]                    VARCHAR (1024) NULL,
    [appraiser_comment]                   VARCHAR (1024) NULL,
    [arb_board]                           CHAR (10)      NULL,
    [arb_meeting_id]                      INT            NULL,
    [arb_hearing_date]                    DATETIME       NULL,
    [arb_taxpayer_comment]                VARCHAR (1024) NULL,
    [arb_taxpayer_arg_cd]                 VARCHAR (10)   NULL,
    [arb_cad_comment]                     VARCHAR (1024) NULL,
    [arb_cad_arg_cd]                      VARCHAR (10)   NULL,
    [date_created]                        DATETIME       NULL,
    [begin_imprv_hstd]                    NUMERIC (14)   NULL,
    [begin_imprv_non_hstd]                NUMERIC (14)   NULL,
    [begin_land_hstd]                     NUMERIC (14)   NULL,
    [begin_land_non_hstd]                 NUMERIC (14)   NULL,
    [begin_ag_mkt]                        NUMERIC (14)   NULL,
    [begin_ag_use]                        NUMERIC (14)   NULL,
    [begin_timb_mkt]                      NUMERIC (14)   NULL,
    [begin_timb_use]                      NUMERIC (14)   NULL,
    [begin_appraised]                     NUMERIC (14)   NULL,
    [begin_ten_percent_cap]               NUMERIC (14)   NULL,
    [begin_assessed]                      NUMERIC (14)   NULL,
    [end_imprv_hstd]                      NUMERIC (14)   NULL,
    [end_imprv_non_hstd]                  NUMERIC (14)   NULL,
    [end_land_hstd]                       NUMERIC (14)   NULL,
    [end_land_non_hstd]                   NUMERIC (14)   NULL,
    [end_ag_mkt]                          NUMERIC (14)   NULL,
    [end_ag_use]                          NUMERIC (14)   NULL,
    [end_timb_mkt]                        NUMERIC (14)   NULL,
    [end_timb_use]                        NUMERIC (14)   NULL,
    [end_appraised]                       NUMERIC (14)   NULL,
    [end_ten_percent_cap]                 NUMERIC (14)   NULL,
    [end_assessed]                        NUMERIC (14)   NULL,
    [resolution_cd]                       VARCHAR (5)    NULL,
    [resolution_comment]                  VARCHAR (512)  NULL,
    [resolved_by_id]                      INT            NULL,
    [letter_protest_hearing_date]         DATETIME       NULL,
    [letter_protest_hearing_user_id]      INT            NULL,
    [letter_order_protest_date]           DATETIME       NULL,
    [letter_order_protest_user_id]        INT            NULL,
    [letter_settlement_waiver_date]       DATETIME       NULL,
    [letter_settlement_waiver_user_id]    INT            NULL,
    [letter_waive_notice_protest_date]    DATETIME       NULL,
    [letter_waive_notice_protest_user_id] INT            NULL,
    [letter_final_order_date]             DATETIME       NULL,
    [letter_final_order_user_id]          INT            NULL,
    [letter_affidavit_hearing_date]       DATETIME       NULL,
    [letter_affidavit_user_id]            INT            NULL,
    [letter_settlement_informal_date]     DATETIME       NULL,
    [letter_settlement_informal_user_id]  INT            NULL,
    [letter_taxpayer_inquiry_date]        DATETIME       NULL,
    [letter_taxpayer_inquiry_user_id]     INT            NULL,
    [letter_notice_protest_date]          DATETIME       NULL,
    [letter_notice_protest_user_id]       INT            NULL,
    [arb_motion]                          VARCHAR (20)   NULL,
    [arb_second]                          VARCHAR (20)   NULL,
    [arb_unanimous]                       CHAR (1)       NULL,
    [arb_vote_info]                       VARCHAR (256)  NULL,
    [protest_record]                      CHAR (1)       NULL,
    [close_date]                          DATETIME       NULL,
    [close_by_id]                         INT            NULL,
    [sign_in_time]                        DATETIME       NULL,
    [hearing_start_time]                  DATETIME       NULL,
    [hearing_end_time]                    DATETIME       NULL,
    [prot_appr_meeting_arrived_dt]        DATETIME       NULL,
    [prot_appr_docket_id]                 INT            NULL,
    CONSTRAINT [CPK_arb_protest] PRIMARY KEY CLUSTERED ([appr_year] ASC, [case_id] ASC) WITH (FILLFACTOR = 90)
);


GO



create trigger tr_arb_protest_delete_ChangeLog
on arb_protest
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
          chg_log_tables = 'arb_protest' and
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
 
declare @appr_year numeric(4,0)
declare @case_id int
 
declare curRows cursor
for
     select appr_year, case_id from deleted
for read only
 
open curRows
fetch next from curRows into @appr_year, @case_id
 
while ( @@fetch_status = 0 )
begin
     select @tvar_key_prop_id = prop_id
     from deleted
     where
     appr_year = @appr_year and
     case_id = @case_id
 
     select @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @case_id) + '-' + convert(varchar(4), prop_val_yr)
     from arb_protest with(nolock)
     where case_id = @case_id and
     appr_year = @appr_year
 
     insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
     values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'D', 114, 0, 'DELETED', 'DELETED', @tvar_szRefID )
     set @tvar_lChangeID = @@identity

     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
     insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
 
     fetch next from curRows into @appr_year, @case_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_arb_protest_update_ChangeLog
on arb_protest
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
 
declare @old_appr_year numeric(4,0)
declare @new_appr_year numeric(4,0)
declare @old_case_id int
declare @new_case_id int
declare @old_prop_id int
declare @new_prop_id int
declare @old_sup_num int
declare @new_sup_num int
declare @old_prop_val_yr numeric(4,0)
declare @new_prop_val_yr numeric(4,0)
declare @old_status char(10)
declare @new_status char(10)
declare @old_inquiry_by_type char(10)
declare @new_inquiry_by_type char(10)
declare @old_inquiry_by_id int
declare @new_inquiry_by_id int
declare @old_inquiry_source_cd char(10)
declare @new_inquiry_source_cd char(10)
declare @old_inquiry_appraiser_id int
declare @new_inquiry_appraiser_id int
declare @old_protest_appraiser_id int
declare @new_protest_appraiser_id int
declare @old_inquiry_taxpayer_comment varchar(1024)
declare @new_inquiry_taxpayer_comment varchar(1024)
declare @old_inquiry_operator_comment varchar(1024)
declare @new_inquiry_operator_comment varchar(1024)
declare @old_inquiry_user_id int
declare @new_inquiry_user_id int
declare @old_inquiry_type_cd char(10)
declare @new_inquiry_type_cd char(10)
declare @old_am_meeting_id int
declare @new_am_meeting_id int
declare @old_am_meeting_date datetime
declare @new_am_meeting_date datetime
declare @old_am_attendee char(1)
declare @new_am_attendee char(1)
declare @old_taxpayer_comment varchar(1024)
declare @new_taxpayer_comment varchar(1024)
declare @old_appraiser_comment varchar(1024)
declare @new_appraiser_comment varchar(1024)
declare @old_arb_board char(10)
declare @new_arb_board char(10)
declare @old_arb_meeting_id int
declare @new_arb_meeting_id int
declare @old_arb_hearing_date datetime
declare @new_arb_hearing_date datetime
declare @old_arb_taxpayer_comment varchar(1024)
declare @new_arb_taxpayer_comment varchar(1024)
declare @old_arb_taxpayer_arg_cd varchar(10)
declare @new_arb_taxpayer_arg_cd varchar(10)
declare @old_arb_cad_comment varchar(1024)
declare @new_arb_cad_comment varchar(1024)
declare @old_arb_cad_arg_cd varchar(10)
declare @new_arb_cad_arg_cd varchar(10)
declare @old_date_created datetime
declare @new_date_created datetime
declare @old_begin_imprv_hstd numeric(14,0)
declare @new_begin_imprv_hstd numeric(14,0)
declare @old_begin_imprv_non_hstd numeric(14,0)
declare @new_begin_imprv_non_hstd numeric(14,0)
declare @old_begin_land_hstd numeric(14,0)
declare @new_begin_land_hstd numeric(14,0)
declare @old_begin_land_non_hstd numeric(14,0)
declare @new_begin_land_non_hstd numeric(14,0)
declare @old_begin_ag_mkt numeric(14,0)
declare @new_begin_ag_mkt numeric(14,0)
declare @old_begin_ag_use numeric(14,0)
declare @new_begin_ag_use numeric(14,0)
declare @old_begin_timb_mkt numeric(14,0)
declare @new_begin_timb_mkt numeric(14,0)
declare @old_begin_timb_use numeric(14,0)
declare @new_begin_timb_use numeric(14,0)
declare @old_begin_appraised numeric(14,0)
declare @new_begin_appraised numeric(14,0)
declare @old_begin_ten_percent_cap numeric(14,0)
declare @new_begin_ten_percent_cap numeric(14,0)
declare @old_begin_assessed numeric(14,0)
declare @new_begin_assessed numeric(14,0)
declare @old_end_imprv_hstd numeric(14,0)
declare @new_end_imprv_hstd numeric(14,0)
declare @old_end_imprv_non_hstd numeric(14,0)
declare @new_end_imprv_non_hstd numeric(14,0)
declare @old_end_land_hstd numeric(14,0)
declare @new_end_land_hstd numeric(14,0)
declare @old_end_land_non_hstd numeric(14,0)
declare @new_end_land_non_hstd numeric(14,0)
declare @old_end_ag_mkt numeric(14,0)
declare @new_end_ag_mkt numeric(14,0)
declare @old_end_ag_use numeric(14,0)
declare @new_end_ag_use numeric(14,0)
declare @old_end_timb_mkt numeric(14,0)
declare @new_end_timb_mkt numeric(14,0)
declare @old_end_timb_use numeric(14,0)
declare @new_end_timb_use numeric(14,0)
declare @old_end_appraised numeric(14,0)
declare @new_end_appraised numeric(14,0)
declare @old_end_ten_percent_cap numeric(14,0)
declare @new_end_ten_percent_cap numeric(14,0)
declare @old_end_assessed numeric(14,0)
declare @new_end_assessed numeric(14,0)
declare @old_resolution_cd varchar(5)
declare @new_resolution_cd varchar(5)
declare @old_resolution_comment varchar(512)
declare @new_resolution_comment varchar(512)
declare @old_resolved_by_id int
declare @new_resolved_by_id int
declare @old_letter_protest_hearing_date datetime
declare @new_letter_protest_hearing_date datetime
declare @old_letter_protest_hearing_user_id int
declare @new_letter_protest_hearing_user_id int
declare @old_letter_order_protest_date datetime
declare @new_letter_order_protest_date datetime
declare @old_letter_order_protest_user_id int
declare @new_letter_order_protest_user_id int
declare @old_letter_settlement_waiver_date datetime
declare @new_letter_settlement_waiver_date datetime
declare @old_letter_settlement_waiver_user_id int
declare @new_letter_settlement_waiver_user_id int
declare @old_letter_waive_notice_protest_date datetime
declare @new_letter_waive_notice_protest_date datetime
declare @old_letter_waive_notice_protest_user_id int
declare @new_letter_waive_notice_protest_user_id int
declare @old_letter_final_order_date datetime
declare @new_letter_final_order_date datetime
declare @old_letter_final_order_user_id int
declare @new_letter_final_order_user_id int
declare @old_letter_affidavit_hearing_date datetime
declare @new_letter_affidavit_hearing_date datetime
declare @old_letter_affidavit_user_id int
declare @new_letter_affidavit_user_id int
declare @old_letter_settlement_informal_date datetime
declare @new_letter_settlement_informal_date datetime
declare @old_letter_settlement_informal_user_id int
declare @new_letter_settlement_informal_user_id int
declare @old_letter_taxpayer_inquiry_date datetime
declare @new_letter_taxpayer_inquiry_date datetime
declare @old_letter_taxpayer_inquiry_user_id int
declare @new_letter_taxpayer_inquiry_user_id int
declare @old_letter_notice_protest_date datetime
declare @new_letter_notice_protest_date datetime
declare @old_letter_notice_protest_user_id int
declare @new_letter_notice_protest_user_id int
declare @old_arb_motion varchar(20)
declare @new_arb_motion varchar(20)
declare @old_arb_second varchar(20)
declare @new_arb_second varchar(20)
declare @old_arb_unanimous char(1)
declare @new_arb_unanimous char(1)
declare @old_arb_vote_info varchar(256)
declare @new_arb_vote_info varchar(256)
declare @old_protest_record char(1)
declare @new_protest_record char(1)
declare @old_close_date datetime
declare @new_close_date datetime
declare @old_close_by_id int
declare @new_close_by_id int
declare @old_sign_in_time datetime
declare @new_sign_in_time datetime
declare @old_hearing_start_time datetime
declare @new_hearing_start_time datetime
declare @old_hearing_end_time datetime
declare @new_hearing_end_time datetime
declare @old_prot_appr_meeting_arrived_dt datetime
declare @new_prot_appr_meeting_arrived_dt datetime
declare @old_prot_appr_docket_id int
declare @new_prot_appr_docket_id int
 
declare curRows cursor
for
     select d.appr_year, d.case_id, d.prop_id, d.sup_num, d.prop_val_yr, d.status, d.inquiry_by_type, d.inquiry_by_id, d.inquiry_source_cd, d.inquiry_appraiser_id, d.protest_appraiser_id, d.inquiry_taxpayer_comment, d.inquiry_operator_comment, d.inquiry_user_id, d.inquiry_type_cd, d.am_meeting_id, d.am_meeting_date, d.am_attendee, d.taxpayer_comment, d.appraiser_comment, d.arb_board, d.arb_meeting_id, d.arb_hearing_date, d.arb_taxpayer_comment, d.arb_taxpayer_arg_cd, d.arb_cad_comment, d.arb_cad_arg_cd, d.date_created, d.begin_imprv_hstd, d.begin_imprv_non_hstd, d.begin_land_hstd, d.begin_land_non_hstd, d.begin_ag_mkt, d.begin_ag_use, d.begin_timb_mkt, d.begin_timb_use, d.begin_appraised, d.begin_ten_percent_cap, d.begin_assessed, d.end_imprv_hstd, d.end_imprv_non_hstd, d.end_land_hstd, d.end_land_non_hstd, d.end_ag_mkt, d.end_ag_use, d.end_timb_mkt, d.end_timb_use, d.end_appraised, d.end_ten_percent_cap, d.end_assessed, d.resolution_cd, d.resolution_comment, d.resolved_by_id, d.letter_protest_hearing_date, d.letter_protest_hearing_user_id, d.letter_order_protest_date, d.letter_order_protest_user_id, d.letter_settlement_waiver_date, d.letter_settlement_waiver_user_id, d.letter_waive_notice_protest_date, d.letter_waive_notice_protest_user_id, d.letter_final_order_date, d.letter_final_order_user_id, d.letter_affidavit_hearing_date, d.letter_affidavit_user_id, d.letter_settlement_informal_date, d.letter_settlement_informal_user_id, d.letter_taxpayer_inquiry_date, d.letter_taxpayer_inquiry_user_id, d.letter_notice_protest_date, d.letter_notice_protest_user_id, d.arb_motion, d.arb_second, d.arb_unanimous, d.arb_vote_info, d.protest_record, d.close_date, d.close_by_id, d.sign_in_time, d.hearing_start_time, d.hearing_end_time, d.prot_appr_meeting_arrived_dt, d.prot_appr_docket_id, i.appr_year, i.case_id, i.prop_id, i.sup_num, i.prop_val_yr, i.status, i.inquiry_by_type, i.inquiry_by_id, i.inquiry_source_cd, i.inquiry_appraiser_id, i.protest_appraiser_id, i.inquiry_taxpayer_comment, i.inquiry_operator_comment, i.inquiry_user_id, i.inquiry_type_cd, i.am_meeting_id, i.am_meeting_date, i.am_attendee, i.taxpayer_comment, i.appraiser_comment, i.arb_board, i.arb_meeting_id, i.arb_hearing_date, i.arb_taxpayer_comment, i.arb_taxpayer_arg_cd, i.arb_cad_comment, i.arb_cad_arg_cd, i.date_created, i.begin_imprv_hstd, i.begin_imprv_non_hstd, i.begin_land_hstd, i.begin_land_non_hstd, i.begin_ag_mkt, i.begin_ag_use, i.begin_timb_mkt, i.begin_timb_use, i.begin_appraised, i.begin_ten_percent_cap, i.begin_assessed, i.end_imprv_hstd, i.end_imprv_non_hstd, i.end_land_hstd, i.end_land_non_hstd, i.end_ag_mkt, i.end_ag_use, i.end_timb_mkt, i.end_timb_use, i.end_appraised, i.end_ten_percent_cap, i.end_assessed, i.resolution_cd, i.resolution_comment, i.resolved_by_id, i.letter_protest_hearing_date, i.letter_protest_hearing_user_id, i.letter_order_protest_date, i.letter_order_protest_user_id, i.letter_settlement_waiver_date, i.letter_settlement_waiver_user_id, i.letter_waive_notice_protest_date, i.letter_waive_notice_protest_user_id, i.letter_final_order_date, i.letter_final_order_user_id, i.letter_affidavit_hearing_date, i.letter_affidavit_user_id, i.letter_settlement_informal_date, i.letter_settlement_informal_user_id, i.letter_taxpayer_inquiry_date, i.letter_taxpayer_inquiry_user_id, i.letter_notice_protest_date, i.letter_notice_protest_user_id, i.arb_motion, i.arb_second, i.arb_unanimous, i.arb_vote_info, i.protest_record, i.close_date, i.close_by_id, i.sign_in_time, i.hearing_start_time, i.hearing_end_time, i.prot_appr_meeting_arrived_dt, i.prot_appr_docket_id
from deleted as d
join inserted as i on 
     d.appr_year = i.appr_year and
     d.case_id = i.case_id
for read only
 
open curRows
fetch next from curRows into @old_appr_year, @old_case_id, @old_prop_id, @old_sup_num, @old_prop_val_yr, @old_status, @old_inquiry_by_type, @old_inquiry_by_id, @old_inquiry_source_cd, @old_inquiry_appraiser_id, @old_protest_appraiser_id, @old_inquiry_taxpayer_comment, @old_inquiry_operator_comment, @old_inquiry_user_id, @old_inquiry_type_cd, @old_am_meeting_id, @old_am_meeting_date, @old_am_attendee, @old_taxpayer_comment, @old_appraiser_comment, @old_arb_board, @old_arb_meeting_id, @old_arb_hearing_date, @old_arb_taxpayer_comment, @old_arb_taxpayer_arg_cd, @old_arb_cad_comment, @old_arb_cad_arg_cd, @old_date_created, @old_begin_imprv_hstd, @old_begin_imprv_non_hstd, @old_begin_land_hstd, @old_begin_land_non_hstd, @old_begin_ag_mkt, @old_begin_ag_use, @old_begin_timb_mkt, @old_begin_timb_use, @old_begin_appraised, @old_begin_ten_percent_cap, @old_begin_assessed, @old_end_imprv_hstd, @old_end_imprv_non_hstd, @old_end_land_hstd, @old_end_land_non_hstd, @old_end_ag_mkt, @old_end_ag_use, @old_end_timb_mkt, @old_end_timb_use, @old_end_appraised, @old_end_ten_percent_cap, @old_end_assessed, @old_resolution_cd, @old_resolution_comment, @old_resolved_by_id, @old_letter_protest_hearing_date, @old_letter_protest_hearing_user_id, @old_letter_order_protest_date, @old_letter_order_protest_user_id, @old_letter_settlement_waiver_date, @old_letter_settlement_waiver_user_id, @old_letter_waive_notice_protest_date, @old_letter_waive_notice_protest_user_id, @old_letter_final_order_date, @old_letter_final_order_user_id, @old_letter_affidavit_hearing_date, @old_letter_affidavit_user_id, @old_letter_settlement_informal_date, @old_letter_settlement_informal_user_id, @old_letter_taxpayer_inquiry_date, @old_letter_taxpayer_inquiry_user_id, @old_letter_notice_protest_date, @old_letter_notice_protest_user_id, @old_arb_motion, @old_arb_second, @old_arb_unanimous, @old_arb_vote_info, @old_protest_record, @old_close_date, @old_close_by_id, @old_sign_in_time, @old_hearing_start_time, @old_hearing_end_time, @old_prot_appr_meeting_arrived_dt, @old_prot_appr_docket_id, @new_appr_year, @new_case_id, @new_prop_id, @new_sup_num, @new_prop_val_yr, @new_status, @new_inquiry_by_type, @new_inquiry_by_id, @new_inquiry_source_cd, @new_inquiry_appraiser_id, @new_protest_appraiser_id, @new_inquiry_taxpayer_comment, @new_inquiry_operator_comment, @new_inquiry_user_id, @new_inquiry_type_cd, @new_am_meeting_id, @new_am_meeting_date, @new_am_attendee, @new_taxpayer_comment, @new_appraiser_comment, @new_arb_board, @new_arb_meeting_id, @new_arb_hearing_date, @new_arb_taxpayer_comment, @new_arb_taxpayer_arg_cd, @new_arb_cad_comment, @new_arb_cad_arg_cd, @new_date_created, @new_begin_imprv_hstd, @new_begin_imprv_non_hstd, @new_begin_land_hstd, @new_begin_land_non_hstd, @new_begin_ag_mkt, @new_begin_ag_use, @new_begin_timb_mkt, @new_begin_timb_use, @new_begin_appraised, @new_begin_ten_percent_cap, @new_begin_assessed, @new_end_imprv_hstd, @new_end_imprv_non_hstd, @new_end_land_hstd, @new_end_land_non_hstd, @new_end_ag_mkt, @new_end_ag_use, @new_end_timb_mkt, @new_end_timb_use, @new_end_appraised, @new_end_ten_percent_cap, @new_end_assessed, @new_resolution_cd, @new_resolution_comment, @new_resolved_by_id, @new_letter_protest_hearing_date, @new_letter_protest_hearing_user_id, @new_letter_order_protest_date, @new_letter_order_protest_user_id, @new_letter_settlement_waiver_date, @new_letter_settlement_waiver_user_id, @new_letter_waive_notice_protest_date, @new_letter_waive_notice_protest_user_id, @new_letter_final_order_date, @new_letter_final_order_user_id, @new_letter_affidavit_hearing_date, @new_letter_affidavit_user_id, @new_letter_settlement_informal_date, @new_letter_settlement_informal_user_id, @new_letter_taxpayer_inquiry_date, @new_letter_taxpayer_inquiry_user_id, @new_letter_notice_protest_date, @new_letter_notice_protest_user_id, @new_arb_motion, @new_arb_second, @new_arb_unanimous, @new_arb_vote_info, @new_protest_record, @new_close_date, @new_close_by_id, @new_sign_in_time, @new_hearing_start_time, @new_hearing_end_time, @new_prot_appr_meeting_arrived_dt, @new_prot_appr_docket_id
 
while ( @@fetch_status = 0 )
begin
set @tvar_key_prop_id = @new_prop_id
 
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @new_case_id) + '-' + convert(varchar(4), @new_prop_val_yr)
 
     if (
          @old_appr_year <> @new_appr_year
          or
          ( @old_appr_year is null and @new_appr_year is not null ) 
          or
          ( @old_appr_year is not null and @new_appr_year is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'appr_year' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 239, convert(varchar(255), @old_appr_year), convert(varchar(255), @new_appr_year) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_case_id <> @new_case_id
          or
          ( @old_case_id is null and @new_case_id is not null ) 
          or
          ( @old_case_id is not null and @new_case_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'case_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 612, convert(varchar(255), @old_case_id), convert(varchar(255), @new_case_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
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
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'prop_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4026, convert(varchar(255), @old_prop_id), convert(varchar(255), @new_prop_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
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
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'sup_num' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 5002, convert(varchar(255), @old_sup_num), convert(varchar(255), @new_sup_num) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
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
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'prop_val_yr' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4083, convert(varchar(255), @old_prop_val_yr), convert(varchar(255), @new_prop_val_yr) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_status <> @new_status
          or
          ( @old_status is null and @new_status is not null ) 
          or
          ( @old_status is not null and @new_status is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'status' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4947, convert(varchar(255), @old_status), convert(varchar(255), @new_status) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_inquiry_by_type <> @new_inquiry_by_type
          or
          ( @old_inquiry_by_type is null and @new_inquiry_by_type is not null ) 
          or
          ( @old_inquiry_by_type is not null and @new_inquiry_by_type is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'inquiry_by_type' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2413, convert(varchar(255), @old_inquiry_by_type), convert(varchar(255), @new_inquiry_by_type) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_inquiry_by_id <> @new_inquiry_by_id
          or
          ( @old_inquiry_by_id is null and @new_inquiry_by_id is not null ) 
          or
          ( @old_inquiry_by_id is not null and @new_inquiry_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'inquiry_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2412, convert(varchar(255), @old_inquiry_by_id), convert(varchar(255), @new_inquiry_by_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_inquiry_source_cd <> @new_inquiry_source_cd
          or
          ( @old_inquiry_source_cd is null and @new_inquiry_source_cd is not null ) 
          or
          ( @old_inquiry_source_cd is not null and @new_inquiry_source_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'inquiry_source_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2417, convert(varchar(255), @old_inquiry_source_cd), convert(varchar(255), @new_inquiry_source_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_inquiry_appraiser_id <> @new_inquiry_appraiser_id
          or
          ( @old_inquiry_appraiser_id is null and @new_inquiry_appraiser_id is not null ) 
          or
          ( @old_inquiry_appraiser_id is not null and @new_inquiry_appraiser_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'inquiry_appraiser_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2409, convert(varchar(255), @old_inquiry_appraiser_id), convert(varchar(255), @new_inquiry_appraiser_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_protest_appraiser_id <> @new_protest_appraiser_id
          or
          ( @old_protest_appraiser_id is null and @new_protest_appraiser_id is not null ) 
          or
          ( @old_protest_appraiser_id is not null and @new_protest_appraiser_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'protest_appraiser_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4152, convert(varchar(255), @old_protest_appraiser_id), convert(varchar(255), @new_protest_appraiser_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_inquiry_taxpayer_comment <> @new_inquiry_taxpayer_comment
          or
          ( @old_inquiry_taxpayer_comment is null and @new_inquiry_taxpayer_comment is not null ) 
          or
          ( @old_inquiry_taxpayer_comment is not null and @new_inquiry_taxpayer_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'inquiry_taxpayer_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2418, convert(varchar(255), @old_inquiry_taxpayer_comment), convert(varchar(255), @new_inquiry_taxpayer_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_inquiry_operator_comment <> @new_inquiry_operator_comment
          or
          ( @old_inquiry_operator_comment is null and @new_inquiry_operator_comment is not null ) 
          or
          ( @old_inquiry_operator_comment is not null and @new_inquiry_operator_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'inquiry_operator_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2416, convert(varchar(255), @old_inquiry_operator_comment), convert(varchar(255), @new_inquiry_operator_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_inquiry_user_id <> @new_inquiry_user_id
          or
          ( @old_inquiry_user_id is null and @new_inquiry_user_id is not null ) 
          or
          ( @old_inquiry_user_id is not null and @new_inquiry_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'inquiry_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2421, convert(varchar(255), @old_inquiry_user_id), convert(varchar(255), @new_inquiry_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_inquiry_type_cd <> @new_inquiry_type_cd
          or
          ( @old_inquiry_type_cd is null and @new_inquiry_type_cd is not null ) 
          or
          ( @old_inquiry_type_cd is not null and @new_inquiry_type_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'inquiry_type_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2419, convert(varchar(255), @old_inquiry_type_cd), convert(varchar(255), @new_inquiry_type_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_am_meeting_id <> @new_am_meeting_id
          or
          ( @old_am_meeting_id is null and @new_am_meeting_id is not null ) 
          or
          ( @old_am_meeting_id is not null and @new_am_meeting_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'am_meeting_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 177, convert(varchar(255), @old_am_meeting_id), convert(varchar(255), @new_am_meeting_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_am_meeting_date <> @new_am_meeting_date
          or
          ( @old_am_meeting_date is null and @new_am_meeting_date is not null ) 
          or
          ( @old_am_meeting_date is not null and @new_am_meeting_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'am_meeting_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 176, convert(varchar(255), @old_am_meeting_date), convert(varchar(255), @new_am_meeting_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_am_attendee <> @new_am_attendee
          or
          ( @old_am_attendee is null and @new_am_attendee is not null ) 
          or
          ( @old_am_attendee is not null and @new_am_attendee is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'am_attendee' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 175, convert(varchar(255), @old_am_attendee), convert(varchar(255), @new_am_attendee) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_taxpayer_comment <> @new_taxpayer_comment
          or
          ( @old_taxpayer_comment is null and @new_taxpayer_comment is not null ) 
          or
          ( @old_taxpayer_comment is not null and @new_taxpayer_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'taxpayer_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 5177, convert(varchar(255), @old_taxpayer_comment), convert(varchar(255), @new_taxpayer_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_appraiser_comment <> @new_appraiser_comment
          or
          ( @old_appraiser_comment is null and @new_appraiser_comment is not null ) 
          or
          ( @old_appraiser_comment is not null and @new_appraiser_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'appraiser_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 247, convert(varchar(255), @old_appraiser_comment), convert(varchar(255), @new_appraiser_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_board <> @new_arb_board
          or
          ( @old_arb_board is null and @new_arb_board is not null ) 
          or
          ( @old_arb_board is not null and @new_arb_board is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_board' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 275, convert(varchar(255), @old_arb_board), convert(varchar(255), @new_arb_board) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_meeting_id <> @new_arb_meeting_id
          or
          ( @old_arb_meeting_id is null and @new_arb_meeting_id is not null ) 
          or
          ( @old_arb_meeting_id is not null and @new_arb_meeting_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_meeting_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 306, convert(varchar(255), @old_arb_meeting_id), convert(varchar(255), @new_arb_meeting_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_hearing_date <> @new_arb_hearing_date
          or
          ( @old_arb_hearing_date is null and @new_arb_hearing_date is not null ) 
          or
          ( @old_arb_hearing_date is not null and @new_arb_hearing_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_hearing_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 298, convert(varchar(255), @old_arb_hearing_date), convert(varchar(255), @new_arb_hearing_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_taxpayer_comment <> @new_arb_taxpayer_comment
          or
          ( @old_arb_taxpayer_comment is null and @new_arb_taxpayer_comment is not null ) 
          or
          ( @old_arb_taxpayer_comment is not null and @new_arb_taxpayer_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_taxpayer_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 328, convert(varchar(255), @old_arb_taxpayer_comment), convert(varchar(255), @new_arb_taxpayer_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_taxpayer_arg_cd <> @new_arb_taxpayer_arg_cd
          or
          ( @old_arb_taxpayer_arg_cd is null and @new_arb_taxpayer_arg_cd is not null ) 
          or
          ( @old_arb_taxpayer_arg_cd is not null and @new_arb_taxpayer_arg_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_taxpayer_arg_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 327, convert(varchar(255), @old_arb_taxpayer_arg_cd), convert(varchar(255), @new_arb_taxpayer_arg_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_cad_comment <> @new_arb_cad_comment
          or
          ( @old_arb_cad_comment is null and @new_arb_cad_comment is not null ) 
          or
          ( @old_arb_cad_comment is not null and @new_arb_cad_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_cad_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 291, convert(varchar(255), @old_arb_cad_comment), convert(varchar(255), @new_arb_cad_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_cad_arg_cd <> @new_arb_cad_arg_cd
          or
          ( @old_arb_cad_arg_cd is null and @new_arb_cad_arg_cd is not null ) 
          or
          ( @old_arb_cad_arg_cd is not null and @new_arb_cad_arg_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_cad_arg_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 290, convert(varchar(255), @old_arb_cad_arg_cd), convert(varchar(255), @new_arb_cad_arg_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_date_created <> @new_date_created
          or
          ( @old_date_created is null and @new_date_created is not null ) 
          or
          ( @old_date_created is not null and @new_date_created is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'date_created' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1116, convert(varchar(255), @old_date_created), convert(varchar(255), @new_date_created) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_imprv_hstd <> @new_begin_imprv_hstd
          or
          ( @old_begin_imprv_hstd is null and @new_begin_imprv_hstd is not null ) 
          or
          ( @old_begin_imprv_hstd is not null and @new_begin_imprv_hstd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_imprv_hstd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 478, convert(varchar(255), @old_begin_imprv_hstd), convert(varchar(255), @new_begin_imprv_hstd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_imprv_non_hstd <> @new_begin_imprv_non_hstd
          or
          ( @old_begin_imprv_non_hstd is null and @new_begin_imprv_non_hstd is not null ) 
          or
          ( @old_begin_imprv_non_hstd is not null and @new_begin_imprv_non_hstd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_imprv_non_hstd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 480, convert(varchar(255), @old_begin_imprv_non_hstd), convert(varchar(255), @new_begin_imprv_non_hstd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_land_hstd <> @new_begin_land_hstd
          or
          ( @old_begin_land_hstd is null and @new_begin_land_hstd is not null ) 
          or
          ( @old_begin_land_hstd is not null and @new_begin_land_hstd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_land_hstd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 482, convert(varchar(255), @old_begin_land_hstd), convert(varchar(255), @new_begin_land_hstd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_land_non_hstd <> @new_begin_land_non_hstd
          or
          ( @old_begin_land_non_hstd is null and @new_begin_land_non_hstd is not null ) 
          or
          ( @old_begin_land_non_hstd is not null and @new_begin_land_non_hstd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_land_non_hstd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 484, convert(varchar(255), @old_begin_land_non_hstd), convert(varchar(255), @new_begin_land_non_hstd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_ag_mkt <> @new_begin_ag_mkt
          or
          ( @old_begin_ag_mkt is null and @new_begin_ag_mkt is not null ) 
          or
          ( @old_begin_ag_mkt is not null and @new_begin_ag_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_ag_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 465, convert(varchar(255), @old_begin_ag_mkt), convert(varchar(255), @new_begin_ag_mkt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_ag_use <> @new_begin_ag_use
          or
          ( @old_begin_ag_use is null and @new_begin_ag_use is not null ) 
          or
          ( @old_begin_ag_use is not null and @new_begin_ag_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_ag_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 466, convert(varchar(255), @old_begin_ag_use), convert(varchar(255), @new_begin_ag_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_timb_mkt <> @new_begin_timb_mkt
          or
          ( @old_begin_timb_mkt is null and @new_begin_timb_mkt is not null ) 
          or
          ( @old_begin_timb_mkt is not null and @new_begin_timb_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_timb_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 491, convert(varchar(255), @old_begin_timb_mkt), convert(varchar(255), @new_begin_timb_mkt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_timb_use <> @new_begin_timb_use
          or
          ( @old_begin_timb_use is null and @new_begin_timb_use is not null ) 
          or
          ( @old_begin_timb_use is not null and @new_begin_timb_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_timb_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 492, convert(varchar(255), @old_begin_timb_use), convert(varchar(255), @new_begin_timb_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_appraised <> @new_begin_appraised
          or
          ( @old_begin_appraised is null and @new_begin_appraised is not null ) 
          or
          ( @old_begin_appraised is not null and @new_begin_appraised is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_appraised' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 468, convert(varchar(255), @old_begin_appraised), convert(varchar(255), @new_begin_appraised) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_ten_percent_cap <> @new_begin_ten_percent_cap
          or
          ( @old_begin_ten_percent_cap is null and @new_begin_ten_percent_cap is not null ) 
          or
          ( @old_begin_ten_percent_cap is not null and @new_begin_ten_percent_cap is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_ten_percent_cap' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 490, convert(varchar(255), @old_begin_ten_percent_cap), convert(varchar(255), @new_begin_ten_percent_cap) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_begin_assessed <> @new_begin_assessed
          or
          ( @old_begin_assessed is null and @new_begin_assessed is not null ) 
          or
          ( @old_begin_assessed is not null and @new_begin_assessed is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'begin_assessed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 470, convert(varchar(255), @old_begin_assessed), convert(varchar(255), @new_begin_assessed) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_imprv_hstd <> @new_end_imprv_hstd
          or
          ( @old_end_imprv_hstd is null and @new_end_imprv_hstd is not null ) 
          or
          ( @old_end_imprv_hstd is not null and @new_end_imprv_hstd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_imprv_hstd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1444, convert(varchar(255), @old_end_imprv_hstd), convert(varchar(255), @new_end_imprv_hstd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_imprv_non_hstd <> @new_end_imprv_non_hstd
          or
          ( @old_end_imprv_non_hstd is null and @new_end_imprv_non_hstd is not null ) 
          or
          ( @old_end_imprv_non_hstd is not null and @new_end_imprv_non_hstd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_imprv_non_hstd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1445, convert(varchar(255), @old_end_imprv_non_hstd), convert(varchar(255), @new_end_imprv_non_hstd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_land_hstd <> @new_end_land_hstd
          or
          ( @old_end_land_hstd is null and @new_end_land_hstd is not null ) 
          or
          ( @old_end_land_hstd is not null and @new_end_land_hstd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_land_hstd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1446, convert(varchar(255), @old_end_land_hstd), convert(varchar(255), @new_end_land_hstd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_land_non_hstd <> @new_end_land_non_hstd
          or
          ( @old_end_land_non_hstd is null and @new_end_land_non_hstd is not null ) 
          or
          ( @old_end_land_non_hstd is not null and @new_end_land_non_hstd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_land_non_hstd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1447, convert(varchar(255), @old_end_land_non_hstd), convert(varchar(255), @new_end_land_non_hstd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_ag_mkt <> @new_end_ag_mkt
          or
          ( @old_end_ag_mkt is null and @new_end_ag_mkt is not null ) 
          or
          ( @old_end_ag_mkt is not null and @new_end_ag_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_ag_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1437, convert(varchar(255), @old_end_ag_mkt), convert(varchar(255), @new_end_ag_mkt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_ag_use <> @new_end_ag_use
          or
          ( @old_end_ag_use is null and @new_end_ag_use is not null ) 
          or
          ( @old_end_ag_use is not null and @new_end_ag_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_ag_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1438, convert(varchar(255), @old_end_ag_use), convert(varchar(255), @new_end_ag_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_timb_mkt <> @new_end_timb_mkt
          or
          ( @old_end_timb_mkt is null and @new_end_timb_mkt is not null ) 
          or
          ( @old_end_timb_mkt is not null and @new_end_timb_mkt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_timb_mkt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1450, convert(varchar(255), @old_end_timb_mkt), convert(varchar(255), @new_end_timb_mkt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_timb_use <> @new_end_timb_use
          or
          ( @old_end_timb_use is null and @new_end_timb_use is not null ) 
          or
          ( @old_end_timb_use is not null and @new_end_timb_use is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_timb_use' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1451, convert(varchar(255), @old_end_timb_use), convert(varchar(255), @new_end_timb_use) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_appraised <> @new_end_appraised
          or
          ( @old_end_appraised is null and @new_end_appraised is not null ) 
          or
          ( @old_end_appraised is not null and @new_end_appraised is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_appraised' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1439, convert(varchar(255), @old_end_appraised), convert(varchar(255), @new_end_appraised) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_ten_percent_cap <> @new_end_ten_percent_cap
          or
          ( @old_end_ten_percent_cap is null and @new_end_ten_percent_cap is not null ) 
          or
          ( @old_end_ten_percent_cap is not null and @new_end_ten_percent_cap is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_ten_percent_cap' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1449, convert(varchar(255), @old_end_ten_percent_cap), convert(varchar(255), @new_end_ten_percent_cap) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_end_assessed <> @new_end_assessed
          or
          ( @old_end_assessed is null and @new_end_assessed is not null ) 
          or
          ( @old_end_assessed is not null and @new_end_assessed is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'end_assessed' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 1440, convert(varchar(255), @old_end_assessed), convert(varchar(255), @new_end_assessed) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_resolution_cd <> @new_resolution_cd
          or
          ( @old_resolution_cd is null and @new_resolution_cd is not null ) 
          or
          ( @old_resolution_cd is not null and @new_resolution_cd is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'resolution_cd' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4408, convert(varchar(255), @old_resolution_cd), convert(varchar(255), @new_resolution_cd) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_resolution_comment <> @new_resolution_comment
          or
          ( @old_resolution_comment is null and @new_resolution_comment is not null ) 
          or
          ( @old_resolution_comment is not null and @new_resolution_comment is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'resolution_comment' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4409, convert(varchar(255), @old_resolution_comment), convert(varchar(255), @new_resolution_comment) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_resolved_by_id <> @new_resolved_by_id
          or
          ( @old_resolved_by_id is null and @new_resolved_by_id is not null ) 
          or
          ( @old_resolved_by_id is not null and @new_resolved_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'resolved_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4411, convert(varchar(255), @old_resolved_by_id), convert(varchar(255), @new_resolved_by_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_protest_hearing_date <> @new_letter_protest_hearing_date
          or
          ( @old_letter_protest_hearing_date is null and @new_letter_protest_hearing_date is not null ) 
          or
          ( @old_letter_protest_hearing_date is not null and @new_letter_protest_hearing_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_protest_hearing_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2800, convert(varchar(255), @old_letter_protest_hearing_date), convert(varchar(255), @new_letter_protest_hearing_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_protest_hearing_user_id <> @new_letter_protest_hearing_user_id
          or
          ( @old_letter_protest_hearing_user_id is null and @new_letter_protest_hearing_user_id is not null ) 
          or
          ( @old_letter_protest_hearing_user_id is not null and @new_letter_protest_hearing_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_protest_hearing_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2801, convert(varchar(255), @old_letter_protest_hearing_user_id), convert(varchar(255), @new_letter_protest_hearing_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_order_protest_date <> @new_letter_order_protest_date
          or
          ( @old_letter_order_protest_date is null and @new_letter_order_protest_date is not null ) 
          or
          ( @old_letter_order_protest_date is not null and @new_letter_order_protest_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_order_protest_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2797, convert(varchar(255), @old_letter_order_protest_date), convert(varchar(255), @new_letter_order_protest_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_order_protest_user_id <> @new_letter_order_protest_user_id
          or
          ( @old_letter_order_protest_user_id is null and @new_letter_order_protest_user_id is not null ) 
          or
          ( @old_letter_order_protest_user_id is not null and @new_letter_order_protest_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_order_protest_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2798, convert(varchar(255), @old_letter_order_protest_user_id), convert(varchar(255), @new_letter_order_protest_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_settlement_waiver_date <> @new_letter_settlement_waiver_date
          or
          ( @old_letter_settlement_waiver_date is null and @new_letter_settlement_waiver_date is not null ) 
          or
          ( @old_letter_settlement_waiver_date is not null and @new_letter_settlement_waiver_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_settlement_waiver_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2804, convert(varchar(255), @old_letter_settlement_waiver_date), convert(varchar(255), @new_letter_settlement_waiver_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_settlement_waiver_user_id <> @new_letter_settlement_waiver_user_id
          or
          ( @old_letter_settlement_waiver_user_id is null and @new_letter_settlement_waiver_user_id is not null ) 
          or
          ( @old_letter_settlement_waiver_user_id is not null and @new_letter_settlement_waiver_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_settlement_waiver_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2805, convert(varchar(255), @old_letter_settlement_waiver_user_id), convert(varchar(255), @new_letter_settlement_waiver_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_waive_notice_protest_date <> @new_letter_waive_notice_protest_date
          or
          ( @old_letter_waive_notice_protest_date is null and @new_letter_waive_notice_protest_date is not null ) 
          or
          ( @old_letter_waive_notice_protest_date is not null and @new_letter_waive_notice_protest_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_waive_notice_protest_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2809, convert(varchar(255), @old_letter_waive_notice_protest_date), convert(varchar(255), @new_letter_waive_notice_protest_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_waive_notice_protest_user_id <> @new_letter_waive_notice_protest_user_id
          or
          ( @old_letter_waive_notice_protest_user_id is null and @new_letter_waive_notice_protest_user_id is not null ) 
          or
          ( @old_letter_waive_notice_protest_user_id is not null and @new_letter_waive_notice_protest_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_waive_notice_protest_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2810, convert(varchar(255), @old_letter_waive_notice_protest_user_id), convert(varchar(255), @new_letter_waive_notice_protest_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_final_order_date <> @new_letter_final_order_date
          or
          ( @old_letter_final_order_date is null and @new_letter_final_order_date is not null ) 
          or
          ( @old_letter_final_order_date is not null and @new_letter_final_order_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_final_order_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2791, convert(varchar(255), @old_letter_final_order_date), convert(varchar(255), @new_letter_final_order_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_final_order_user_id <> @new_letter_final_order_user_id
          or
          ( @old_letter_final_order_user_id is null and @new_letter_final_order_user_id is not null ) 
          or
          ( @old_letter_final_order_user_id is not null and @new_letter_final_order_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_final_order_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2792, convert(varchar(255), @old_letter_final_order_user_id), convert(varchar(255), @new_letter_final_order_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_affidavit_hearing_date <> @new_letter_affidavit_hearing_date
          or
          ( @old_letter_affidavit_hearing_date is null and @new_letter_affidavit_hearing_date is not null ) 
          or
          ( @old_letter_affidavit_hearing_date is not null and @new_letter_affidavit_hearing_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_affidavit_hearing_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2786, convert(varchar(255), @old_letter_affidavit_hearing_date), convert(varchar(255), @new_letter_affidavit_hearing_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_affidavit_user_id <> @new_letter_affidavit_user_id
          or
          ( @old_letter_affidavit_user_id is null and @new_letter_affidavit_user_id is not null ) 
          or
          ( @old_letter_affidavit_user_id is not null and @new_letter_affidavit_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_affidavit_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2787, convert(varchar(255), @old_letter_affidavit_user_id), convert(varchar(255), @new_letter_affidavit_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_settlement_informal_date <> @new_letter_settlement_informal_date
          or
          ( @old_letter_settlement_informal_date is null and @new_letter_settlement_informal_date is not null ) 
          or
          ( @old_letter_settlement_informal_date is not null and @new_letter_settlement_informal_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_settlement_informal_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2802, convert(varchar(255), @old_letter_settlement_informal_date), convert(varchar(255), @new_letter_settlement_informal_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_settlement_informal_user_id <> @new_letter_settlement_informal_user_id
          or
          ( @old_letter_settlement_informal_user_id is null and @new_letter_settlement_informal_user_id is not null ) 
          or
          ( @old_letter_settlement_informal_user_id is not null and @new_letter_settlement_informal_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_settlement_informal_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2803, convert(varchar(255), @old_letter_settlement_informal_user_id), convert(varchar(255), @new_letter_settlement_informal_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_taxpayer_inquiry_date <> @new_letter_taxpayer_inquiry_date
          or
          ( @old_letter_taxpayer_inquiry_date is null and @new_letter_taxpayer_inquiry_date is not null ) 
          or
          ( @old_letter_taxpayer_inquiry_date is not null and @new_letter_taxpayer_inquiry_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_taxpayer_inquiry_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2806, convert(varchar(255), @old_letter_taxpayer_inquiry_date), convert(varchar(255), @new_letter_taxpayer_inquiry_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_taxpayer_inquiry_user_id <> @new_letter_taxpayer_inquiry_user_id
          or
          ( @old_letter_taxpayer_inquiry_user_id is null and @new_letter_taxpayer_inquiry_user_id is not null ) 
          or
          ( @old_letter_taxpayer_inquiry_user_id is not null and @new_letter_taxpayer_inquiry_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_taxpayer_inquiry_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2807, convert(varchar(255), @old_letter_taxpayer_inquiry_user_id), convert(varchar(255), @new_letter_taxpayer_inquiry_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_notice_protest_date <> @new_letter_notice_protest_date
          or
          ( @old_letter_notice_protest_date is null and @new_letter_notice_protest_date is not null ) 
          or
          ( @old_letter_notice_protest_date is not null and @new_letter_notice_protest_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_notice_protest_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2795, convert(varchar(255), @old_letter_notice_protest_date), convert(varchar(255), @new_letter_notice_protest_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_letter_notice_protest_user_id <> @new_letter_notice_protest_user_id
          or
          ( @old_letter_notice_protest_user_id is null and @new_letter_notice_protest_user_id is not null ) 
          or
          ( @old_letter_notice_protest_user_id is not null and @new_letter_notice_protest_user_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'letter_notice_protest_user_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2796, convert(varchar(255), @old_letter_notice_protest_user_id), convert(varchar(255), @new_letter_notice_protest_user_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_motion <> @new_arb_motion
          or
          ( @old_arb_motion is null and @new_arb_motion is not null ) 
          or
          ( @old_arb_motion is not null and @new_arb_motion is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_motion' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 307, convert(varchar(255), @old_arb_motion), convert(varchar(255), @new_arb_motion) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_second <> @new_arb_second
          or
          ( @old_arb_second is null and @new_arb_second is not null ) 
          or
          ( @old_arb_second is not null and @new_arb_second is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_second' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 322, convert(varchar(255), @old_arb_second), convert(varchar(255), @new_arb_second) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_unanimous <> @new_arb_unanimous
          or
          ( @old_arb_unanimous is null and @new_arb_unanimous is not null ) 
          or
          ( @old_arb_unanimous is not null and @new_arb_unanimous is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_unanimous' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 329, convert(varchar(255), @old_arb_unanimous), convert(varchar(255), @new_arb_unanimous) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_arb_vote_info <> @new_arb_vote_info
          or
          ( @old_arb_vote_info is null and @new_arb_vote_info is not null ) 
          or
          ( @old_arb_vote_info is not null and @new_arb_vote_info is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'arb_vote_info' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 330, convert(varchar(255), @old_arb_vote_info), convert(varchar(255), @new_arb_vote_info) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_protest_record <> @new_protest_record
          or
          ( @old_protest_record is null and @new_protest_record is not null ) 
          or
          ( @old_protest_record is not null and @new_protest_record is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'protest_record' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4155, convert(varchar(255), @old_protest_record), convert(varchar(255), @new_protest_record) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_close_date <> @new_close_date
          or
          ( @old_close_date is null and @new_close_date is not null ) 
          or
          ( @old_close_date is not null and @new_close_date is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'close_date' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 767, convert(varchar(255), @old_close_date), convert(varchar(255), @new_close_date) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_close_by_id <> @new_close_by_id
          or
          ( @old_close_by_id is null and @new_close_by_id is not null ) 
          or
          ( @old_close_by_id is not null and @new_close_by_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'close_by_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 765, convert(varchar(255), @old_close_by_id), convert(varchar(255), @new_close_by_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_sign_in_time <> @new_sign_in_time
          or
          ( @old_sign_in_time is null and @new_sign_in_time is not null ) 
          or
          ( @old_sign_in_time is not null and @new_sign_in_time is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'sign_in_time' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 4735, convert(varchar(255), @old_sign_in_time), convert(varchar(255), @new_sign_in_time) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_hearing_start_time <> @new_hearing_start_time
          or
          ( @old_hearing_start_time is null and @new_hearing_start_time is not null ) 
          or
          ( @old_hearing_start_time is not null and @new_hearing_start_time is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'hearing_start_time' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2053, convert(varchar(255), @old_hearing_start_time), convert(varchar(255), @new_hearing_start_time) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_hearing_end_time <> @new_hearing_end_time
          or
          ( @old_hearing_end_time is null and @new_hearing_end_time is not null ) 
          or
          ( @old_hearing_end_time is not null and @new_hearing_end_time is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'hearing_end_time' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 2052, convert(varchar(255), @old_hearing_end_time), convert(varchar(255), @new_hearing_end_time) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_prot_appr_meeting_arrived_dt <> @new_prot_appr_meeting_arrived_dt
          or
          ( @old_prot_appr_meeting_arrived_dt is null and @new_prot_appr_meeting_arrived_dt is not null ) 
          or
          ( @old_prot_appr_meeting_arrived_dt is not null and @new_prot_appr_meeting_arrived_dt is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'prot_appr_meeting_arrived_dt' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 6111, convert(varchar(255), @old_prot_appr_meeting_arrived_dt), convert(varchar(255), @new_prot_appr_meeting_arrived_dt) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     if (
          @old_prot_appr_docket_id <> @new_prot_appr_docket_id
          or
          ( @old_prot_appr_docket_id is null and @new_prot_appr_docket_id is not null ) 
          or
          ( @old_prot_appr_docket_id is not null and @new_prot_appr_docket_id is null ) 
     )
     begin
          if exists (
               select chg_log_audit
               from chg_log_columns with(nolock)
               where
                    chg_log_tables = 'arb_protest' and
                    chg_log_columns = 'prot_appr_docket_id' and
                    chg_log_audit = 1
          )
          begin
               insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue )
               values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'U', 114, 6110, convert(varchar(255), @old_prot_appr_docket_id), convert(varchar(255), @new_prot_appr_docket_id) )
               set @tvar_lChangeID = @@identity

               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @new_appr_year), case when @new_appr_year > @tvar_intMin and @new_appr_year < @tvar_intMax then convert(int, round(@new_appr_year, 0, 1)) else 0 end)
               insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @new_case_id), @new_case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
          end
     end
 
     fetch next from curRows into @old_appr_year, @old_case_id, @old_prop_id, @old_sup_num, @old_prop_val_yr, @old_status, @old_inquiry_by_type, @old_inquiry_by_id, @old_inquiry_source_cd, @old_inquiry_appraiser_id, @old_protest_appraiser_id, @old_inquiry_taxpayer_comment, @old_inquiry_operator_comment, @old_inquiry_user_id, @old_inquiry_type_cd, @old_am_meeting_id, @old_am_meeting_date, @old_am_attendee, @old_taxpayer_comment, @old_appraiser_comment, @old_arb_board, @old_arb_meeting_id, @old_arb_hearing_date, @old_arb_taxpayer_comment, @old_arb_taxpayer_arg_cd, @old_arb_cad_comment, @old_arb_cad_arg_cd, @old_date_created, @old_begin_imprv_hstd, @old_begin_imprv_non_hstd, @old_begin_land_hstd, @old_begin_land_non_hstd, @old_begin_ag_mkt, @old_begin_ag_use, @old_begin_timb_mkt, @old_begin_timb_use, @old_begin_appraised, @old_begin_ten_percent_cap, @old_begin_assessed, @old_end_imprv_hstd, @old_end_imprv_non_hstd, @old_end_land_hstd, @old_end_land_non_hstd, @old_end_ag_mkt, @old_end_ag_use, @old_end_timb_mkt, @old_end_timb_use, @old_end_appraised, @old_end_ten_percent_cap, @old_end_assessed, @old_resolution_cd, @old_resolution_comment, @old_resolved_by_id, @old_letter_protest_hearing_date, @old_letter_protest_hearing_user_id, @old_letter_order_protest_date, @old_letter_order_protest_user_id, @old_letter_settlement_waiver_date, @old_letter_settlement_waiver_user_id, @old_letter_waive_notice_protest_date, @old_letter_waive_notice_protest_user_id, @old_letter_final_order_date, @old_letter_final_order_user_id, @old_letter_affidavit_hearing_date, @old_letter_affidavit_user_id, @old_letter_settlement_informal_date, @old_letter_settlement_informal_user_id, @old_letter_taxpayer_inquiry_date, @old_letter_taxpayer_inquiry_user_id, @old_letter_notice_protest_date, @old_letter_notice_protest_user_id, @old_arb_motion, @old_arb_second, @old_arb_unanimous, @old_arb_vote_info, @old_protest_record, @old_close_date, @old_close_by_id, @old_sign_in_time, @old_hearing_start_time, @old_hearing_end_time, @old_prot_appr_meeting_arrived_dt, @old_prot_appr_docket_id, @new_appr_year, @new_case_id, @new_prop_id, @new_sup_num, @new_prop_val_yr, @new_status, @new_inquiry_by_type, @new_inquiry_by_id, @new_inquiry_source_cd, @new_inquiry_appraiser_id, @new_protest_appraiser_id, @new_inquiry_taxpayer_comment, @new_inquiry_operator_comment, @new_inquiry_user_id, @new_inquiry_type_cd, @new_am_meeting_id, @new_am_meeting_date, @new_am_attendee, @new_taxpayer_comment, @new_appraiser_comment, @new_arb_board, @new_arb_meeting_id, @new_arb_hearing_date, @new_arb_taxpayer_comment, @new_arb_taxpayer_arg_cd, @new_arb_cad_comment, @new_arb_cad_arg_cd, @new_date_created, @new_begin_imprv_hstd, @new_begin_imprv_non_hstd, @new_begin_land_hstd, @new_begin_land_non_hstd, @new_begin_ag_mkt, @new_begin_ag_use, @new_begin_timb_mkt, @new_begin_timb_use, @new_begin_appraised, @new_begin_ten_percent_cap, @new_begin_assessed, @new_end_imprv_hstd, @new_end_imprv_non_hstd, @new_end_land_hstd, @new_end_land_non_hstd, @new_end_ag_mkt, @new_end_ag_use, @new_end_timb_mkt, @new_end_timb_use, @new_end_appraised, @new_end_ten_percent_cap, @new_end_assessed, @new_resolution_cd, @new_resolution_comment, @new_resolved_by_id, @new_letter_protest_hearing_date, @new_letter_protest_hearing_user_id, @new_letter_order_protest_date, @new_letter_order_protest_user_id, @new_letter_settlement_waiver_date, @new_letter_settlement_waiver_user_id, @new_letter_waive_notice_protest_date, @new_letter_waive_notice_protest_user_id, @new_letter_final_order_date, @new_letter_final_order_user_id, @new_letter_affidavit_hearing_date, @new_letter_affidavit_user_id, @new_letter_settlement_informal_date, @new_letter_settlement_informal_user_id, @new_letter_taxpayer_inquiry_date, @new_letter_taxpayer_inquiry_user_id, @new_letter_notice_protest_date, @new_letter_notice_protest_user_id, @new_arb_motion, @new_arb_second, @new_arb_unanimous, @new_arb_vote_info, @new_protest_record, @new_close_date, @new_close_by_id, @new_sign_in_time, @new_hearing_start_time, @new_hearing_end_time, @new_prot_appr_meeting_arrived_dt, @new_prot_appr_docket_id
end
 
close curRows
deallocate curRows

GO



create trigger tr_arb_protest_insert_ChangeLog
on arb_protest
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
 
declare @appr_year numeric(4,0)
declare @case_id int
declare @prop_id int
declare @sup_num int
declare @prop_val_yr numeric(4,0)
declare @status char(10)
declare @inquiry_by_type char(10)
declare @inquiry_by_id int
declare @inquiry_source_cd char(10)
declare @inquiry_appraiser_id int
declare @protest_appraiser_id int
declare @inquiry_taxpayer_comment varchar(1024)
declare @inquiry_operator_comment varchar(1024)
declare @inquiry_user_id int
declare @inquiry_type_cd char(10)
declare @am_meeting_id int
declare @am_meeting_date datetime
declare @am_attendee char(1)
declare @taxpayer_comment varchar(1024)
declare @appraiser_comment varchar(1024)
declare @arb_board char(10)
declare @arb_meeting_id int
declare @arb_hearing_date datetime
declare @arb_taxpayer_comment varchar(1024)
declare @arb_taxpayer_arg_cd varchar(10)
declare @arb_cad_comment varchar(1024)
declare @arb_cad_arg_cd varchar(10)
declare @date_created datetime
declare @begin_imprv_hstd numeric(14,0)
declare @begin_imprv_non_hstd numeric(14,0)
declare @begin_land_hstd numeric(14,0)
declare @begin_land_non_hstd numeric(14,0)
declare @begin_ag_mkt numeric(14,0)
declare @begin_ag_use numeric(14,0)
declare @begin_timb_mkt numeric(14,0)
declare @begin_timb_use numeric(14,0)
declare @begin_appraised numeric(14,0)
declare @begin_ten_percent_cap numeric(14,0)
declare @begin_assessed numeric(14,0)
declare @end_imprv_hstd numeric(14,0)
declare @end_imprv_non_hstd numeric(14,0)
declare @end_land_hstd numeric(14,0)
declare @end_land_non_hstd numeric(14,0)
declare @end_ag_mkt numeric(14,0)
declare @end_ag_use numeric(14,0)
declare @end_timb_mkt numeric(14,0)
declare @end_timb_use numeric(14,0)
declare @end_appraised numeric(14,0)
declare @end_ten_percent_cap numeric(14,0)
declare @end_assessed numeric(14,0)
declare @resolution_cd varchar(5)
declare @resolution_comment varchar(512)
declare @resolved_by_id int
declare @letter_protest_hearing_date datetime
declare @letter_protest_hearing_user_id int
declare @letter_order_protest_date datetime
declare @letter_order_protest_user_id int
declare @letter_settlement_waiver_date datetime
declare @letter_settlement_waiver_user_id int
declare @letter_waive_notice_protest_date datetime
declare @letter_waive_notice_protest_user_id int
declare @letter_final_order_date datetime
declare @letter_final_order_user_id int
declare @letter_affidavit_hearing_date datetime
declare @letter_affidavit_user_id int
declare @letter_settlement_informal_date datetime
declare @letter_settlement_informal_user_id int
declare @letter_taxpayer_inquiry_date datetime
declare @letter_taxpayer_inquiry_user_id int
declare @letter_notice_protest_date datetime
declare @letter_notice_protest_user_id int
declare @arb_motion varchar(20)
declare @arb_second varchar(20)
declare @arb_unanimous char(1)
declare @arb_vote_info varchar(256)
declare @protest_record char(1)
declare @close_date datetime
declare @close_by_id int
declare @sign_in_time datetime
declare @hearing_start_time datetime
declare @hearing_end_time datetime
declare @prot_appr_meeting_arrived_dt datetime
declare @prot_appr_docket_id int
 
declare curRows cursor
for
     select appr_year, case_id, prop_id, sup_num, prop_val_yr, status, inquiry_by_type, inquiry_by_id, inquiry_source_cd, inquiry_appraiser_id, protest_appraiser_id, inquiry_taxpayer_comment, inquiry_operator_comment, inquiry_user_id, inquiry_type_cd, am_meeting_id, am_meeting_date, am_attendee, taxpayer_comment, appraiser_comment, arb_board, arb_meeting_id, arb_hearing_date, arb_taxpayer_comment, arb_taxpayer_arg_cd, arb_cad_comment, arb_cad_arg_cd, date_created, begin_imprv_hstd, begin_imprv_non_hstd, begin_land_hstd, begin_land_non_hstd, begin_ag_mkt, begin_ag_use, begin_timb_mkt, begin_timb_use, begin_appraised, begin_ten_percent_cap, begin_assessed, end_imprv_hstd, end_imprv_non_hstd, end_land_hstd, end_land_non_hstd, end_ag_mkt, end_ag_use, end_timb_mkt, end_timb_use, end_appraised, end_ten_percent_cap, end_assessed, resolution_cd, resolution_comment, resolved_by_id, letter_protest_hearing_date, letter_protest_hearing_user_id, letter_order_protest_date, letter_order_protest_user_id, letter_settlement_waiver_date, letter_settlement_waiver_user_id, letter_waive_notice_protest_date, letter_waive_notice_protest_user_id, letter_final_order_date, letter_final_order_user_id, letter_affidavit_hearing_date, letter_affidavit_user_id, letter_settlement_informal_date, letter_settlement_informal_user_id, letter_taxpayer_inquiry_date, letter_taxpayer_inquiry_user_id, letter_notice_protest_date, letter_notice_protest_user_id, arb_motion, arb_second, arb_unanimous, arb_vote_info, protest_record, close_date, close_by_id, sign_in_time, hearing_start_time, hearing_end_time, prot_appr_meeting_arrived_dt, prot_appr_docket_id from inserted
for read only
 
open curRows
fetch next from curRows into @appr_year, @case_id, @prop_id, @sup_num, @prop_val_yr, @status, @inquiry_by_type, @inquiry_by_id, @inquiry_source_cd, @inquiry_appraiser_id, @protest_appraiser_id, @inquiry_taxpayer_comment, @inquiry_operator_comment, @inquiry_user_id, @inquiry_type_cd, @am_meeting_id, @am_meeting_date, @am_attendee, @taxpayer_comment, @appraiser_comment, @arb_board, @arb_meeting_id, @arb_hearing_date, @arb_taxpayer_comment, @arb_taxpayer_arg_cd, @arb_cad_comment, @arb_cad_arg_cd, @date_created, @begin_imprv_hstd, @begin_imprv_non_hstd, @begin_land_hstd, @begin_land_non_hstd, @begin_ag_mkt, @begin_ag_use, @begin_timb_mkt, @begin_timb_use, @begin_appraised, @begin_ten_percent_cap, @begin_assessed, @end_imprv_hstd, @end_imprv_non_hstd, @end_land_hstd, @end_land_non_hstd, @end_ag_mkt, @end_ag_use, @end_timb_mkt, @end_timb_use, @end_appraised, @end_ten_percent_cap, @end_assessed, @resolution_cd, @resolution_comment, @resolved_by_id, @letter_protest_hearing_date, @letter_protest_hearing_user_id, @letter_order_protest_date, @letter_order_protest_user_id, @letter_settlement_waiver_date, @letter_settlement_waiver_user_id, @letter_waive_notice_protest_date, @letter_waive_notice_protest_user_id, @letter_final_order_date, @letter_final_order_user_id, @letter_affidavit_hearing_date, @letter_affidavit_user_id, @letter_settlement_informal_date, @letter_settlement_informal_user_id, @letter_taxpayer_inquiry_date, @letter_taxpayer_inquiry_user_id, @letter_notice_protest_date, @letter_notice_protest_user_id, @arb_motion, @arb_second, @arb_unanimous, @arb_vote_info, @protest_record, @close_date, @close_by_id, @sign_in_time, @hearing_start_time, @hearing_end_time, @prot_appr_meeting_arrived_dt, @prot_appr_docket_id
 
while ( @@fetch_status = 0 )
begin
set @tvar_key_prop_id = @prop_id
 
     set @tvar_szRefID = 'Case ID: ' + convert(varchar(12), @case_id) + '-' + convert(varchar(4), @prop_val_yr)
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'appr_year' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 239, null, convert(varchar(255), @appr_year), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'case_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 612, null, convert(varchar(255), @case_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'prop_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4026, null, convert(varchar(255), @prop_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'sup_num' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 5002, null, convert(varchar(255), @sup_num), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'prop_val_yr' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4083, null, convert(varchar(255), @prop_val_yr), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'status' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4947, null, convert(varchar(255), @status), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'inquiry_by_type' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2413, null, convert(varchar(255), @inquiry_by_type), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'inquiry_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2412, null, convert(varchar(255), @inquiry_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'inquiry_source_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2417, null, convert(varchar(255), @inquiry_source_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'inquiry_appraiser_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2409, null, convert(varchar(255), @inquiry_appraiser_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'protest_appraiser_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4152, null, convert(varchar(255), @protest_appraiser_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'inquiry_taxpayer_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2418, null, convert(varchar(255), @inquiry_taxpayer_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'inquiry_operator_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2416, null, convert(varchar(255), @inquiry_operator_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'inquiry_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2421, null, convert(varchar(255), @inquiry_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'inquiry_type_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2419, null, convert(varchar(255), @inquiry_type_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'am_meeting_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 177, null, convert(varchar(255), @am_meeting_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'am_meeting_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 176, null, convert(varchar(255), @am_meeting_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'am_attendee' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 175, null, convert(varchar(255), @am_attendee), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'taxpayer_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 5177, null, convert(varchar(255), @taxpayer_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'appraiser_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 247, null, convert(varchar(255), @appraiser_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_board' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 275, null, convert(varchar(255), @arb_board), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_meeting_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 306, null, convert(varchar(255), @arb_meeting_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_hearing_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 298, null, convert(varchar(255), @arb_hearing_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_taxpayer_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 328, null, convert(varchar(255), @arb_taxpayer_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_taxpayer_arg_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 327, null, convert(varchar(255), @arb_taxpayer_arg_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_cad_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 291, null, convert(varchar(255), @arb_cad_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_cad_arg_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 290, null, convert(varchar(255), @arb_cad_arg_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'date_created' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1116, null, convert(varchar(255), @date_created), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_imprv_hstd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 478, null, convert(varchar(255), @begin_imprv_hstd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_imprv_non_hstd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 480, null, convert(varchar(255), @begin_imprv_non_hstd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_land_hstd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 482, null, convert(varchar(255), @begin_land_hstd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_land_non_hstd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 484, null, convert(varchar(255), @begin_land_non_hstd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_ag_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 465, null, convert(varchar(255), @begin_ag_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_ag_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 466, null, convert(varchar(255), @begin_ag_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_timb_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 491, null, convert(varchar(255), @begin_timb_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_timb_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 492, null, convert(varchar(255), @begin_timb_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_appraised' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 468, null, convert(varchar(255), @begin_appraised), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_ten_percent_cap' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 490, null, convert(varchar(255), @begin_ten_percent_cap), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'begin_assessed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 470, null, convert(varchar(255), @begin_assessed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_imprv_hstd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1444, null, convert(varchar(255), @end_imprv_hstd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_imprv_non_hstd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1445, null, convert(varchar(255), @end_imprv_non_hstd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_land_hstd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1446, null, convert(varchar(255), @end_land_hstd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_land_non_hstd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1447, null, convert(varchar(255), @end_land_non_hstd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_ag_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1437, null, convert(varchar(255), @end_ag_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_ag_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1438, null, convert(varchar(255), @end_ag_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_timb_mkt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1450, null, convert(varchar(255), @end_timb_mkt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_timb_use' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1451, null, convert(varchar(255), @end_timb_use), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_appraised' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1439, null, convert(varchar(255), @end_appraised), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_ten_percent_cap' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1449, null, convert(varchar(255), @end_ten_percent_cap), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'end_assessed' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 1440, null, convert(varchar(255), @end_assessed), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'resolution_cd' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4408, null, convert(varchar(255), @resolution_cd), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'resolution_comment' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4409, null, convert(varchar(255), @resolution_comment), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'resolved_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4411, null, convert(varchar(255), @resolved_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_protest_hearing_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2800, null, convert(varchar(255), @letter_protest_hearing_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_protest_hearing_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2801, null, convert(varchar(255), @letter_protest_hearing_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_order_protest_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2797, null, convert(varchar(255), @letter_order_protest_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_order_protest_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2798, null, convert(varchar(255), @letter_order_protest_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_settlement_waiver_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2804, null, convert(varchar(255), @letter_settlement_waiver_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_settlement_waiver_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2805, null, convert(varchar(255), @letter_settlement_waiver_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_waive_notice_protest_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2809, null, convert(varchar(255), @letter_waive_notice_protest_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_waive_notice_protest_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2810, null, convert(varchar(255), @letter_waive_notice_protest_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_final_order_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2791, null, convert(varchar(255), @letter_final_order_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_final_order_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2792, null, convert(varchar(255), @letter_final_order_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_affidavit_hearing_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2786, null, convert(varchar(255), @letter_affidavit_hearing_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_affidavit_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2787, null, convert(varchar(255), @letter_affidavit_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_settlement_informal_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2802, null, convert(varchar(255), @letter_settlement_informal_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_settlement_informal_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2803, null, convert(varchar(255), @letter_settlement_informal_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_taxpayer_inquiry_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2806, null, convert(varchar(255), @letter_taxpayer_inquiry_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_taxpayer_inquiry_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2807, null, convert(varchar(255), @letter_taxpayer_inquiry_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_notice_protest_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2795, null, convert(varchar(255), @letter_notice_protest_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'letter_notice_protest_user_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2796, null, convert(varchar(255), @letter_notice_protest_user_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_motion' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 307, null, convert(varchar(255), @arb_motion), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_second' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 322, null, convert(varchar(255), @arb_second), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_unanimous' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 329, null, convert(varchar(255), @arb_unanimous), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'arb_vote_info' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 330, null, convert(varchar(255), @arb_vote_info), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'protest_record' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4155, null, convert(varchar(255), @protest_record), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'close_date' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 767, null, convert(varchar(255), @close_date), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'close_by_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 765, null, convert(varchar(255), @close_by_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'sign_in_time' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 4735, null, convert(varchar(255), @sign_in_time), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'hearing_start_time' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2053, null, convert(varchar(255), @hearing_start_time), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'hearing_end_time' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 2052, null, convert(varchar(255), @hearing_end_time), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'prot_appr_meeting_arrived_dt' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 6111, null, convert(varchar(255), @prot_appr_meeting_arrived_dt), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     if exists (
          select chg_log_audit
          from chg_log_columns with(nolock)
          where
               chg_log_tables = 'arb_protest' and
               chg_log_columns = 'prot_appr_docket_id' and
               chg_log_audit = 1
     )
     begin
          insert change_log with(rowlock) ( lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
          values ( @tvar_lPacsUserID, system_user, host_name(), @tvar_dtNow, 'I', 114, 6110, null, convert(varchar(255), @prot_appr_docket_id), @tvar_szRefID )
          set @tvar_lChangeID = @@identity

          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 239, convert(varchar(24), @appr_year), case when @appr_year > @tvar_intMin and @appr_year < @tvar_intMax then convert(int, round(@appr_year, 0, 1)) else 0 end)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 612, convert(varchar(24), @case_id), @case_id)
          insert change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @tvar_key_prop_id), @tvar_key_prop_id)
     end
 
     fetch next from curRows into @appr_year, @case_id, @prop_id, @sup_num, @prop_val_yr, @status, @inquiry_by_type, @inquiry_by_id, @inquiry_source_cd, @inquiry_appraiser_id, @protest_appraiser_id, @inquiry_taxpayer_comment, @inquiry_operator_comment, @inquiry_user_id, @inquiry_type_cd, @am_meeting_id, @am_meeting_date, @am_attendee, @taxpayer_comment, @appraiser_comment, @arb_board, @arb_meeting_id, @arb_hearing_date, @arb_taxpayer_comment, @arb_taxpayer_arg_cd, @arb_cad_comment, @arb_cad_arg_cd, @date_created, @begin_imprv_hstd, @begin_imprv_non_hstd, @begin_land_hstd, @begin_land_non_hstd, @begin_ag_mkt, @begin_ag_use, @begin_timb_mkt, @begin_timb_use, @begin_appraised, @begin_ten_percent_cap, @begin_assessed, @end_imprv_hstd, @end_imprv_non_hstd, @end_land_hstd, @end_land_non_hstd, @end_ag_mkt, @end_ag_use, @end_timb_mkt, @end_timb_use, @end_appraised, @end_ten_percent_cap, @end_assessed, @resolution_cd, @resolution_comment, @resolved_by_id, @letter_protest_hearing_date, @letter_protest_hearing_user_id, @letter_order_protest_date, @letter_order_protest_user_id, @letter_settlement_waiver_date, @letter_settlement_waiver_user_id, @letter_waive_notice_protest_date, @letter_waive_notice_protest_user_id, @letter_final_order_date, @letter_final_order_user_id, @letter_affidavit_hearing_date, @letter_affidavit_user_id, @letter_settlement_informal_date, @letter_settlement_informal_user_id, @letter_taxpayer_inquiry_date, @letter_taxpayer_inquiry_user_id, @letter_notice_protest_date, @letter_notice_protest_user_id, @arb_motion, @arb_second, @arb_unanimous, @arb_vote_info, @protest_record, @close_date, @close_by_id, @sign_in_time, @hearing_start_time, @hearing_end_time, @prot_appr_meeting_arrived_dt, @prot_appr_docket_id
end
 
close curRows
deallocate curRows

GO

