


CREATE VIEW dbo.arb_protest_report_vw
AS
SELECT appr_year, case_id, prop_id, sup_num, prop_val_yr, 
    status, inquiry_by_type, inquiry_by_id, inquiry_source_cd, 
    inquiry_appraiser_id, protest_appraiser_id, 
    inquiry_taxpayer_comment, inquiry_operator_comment, 
    inquiry_user_id, inquiry_type_cd, am_meeting_id, 
    am_meeting_date, am_attendee, taxpayer_comment, 
    appraiser_comment, arb_board, arb_meeting_id, 
    arb_hearing_date, arb_taxpayer_comment, 
    arb_taxpayer_arg_cd, arb_cad_comment, arb_cad_arg_cd, 
    date_created, begin_imprv_hstd, begin_imprv_non_hstd, 
    begin_land_hstd, begin_land_non_hstd, begin_ag_mkt, 
    begin_ag_use, begin_timb_mkt, begin_timb_use, 
    begin_appraised, begin_ten_percent_cap, begin_assessed, 
    end_imprv_hstd, end_imprv_non_hstd, end_land_hstd, 
    end_land_non_hstd, end_ag_mkt, end_ag_use, end_timb_mkt, 
    end_timb_use, end_appraised, end_ten_percent_cap, 
    end_assessed, resolution_cd, resolution_comment, 
    resolved_by_id, letter_protest_hearing_date, 
    letter_protest_hearing_user_id, letter_order_protest_date, 
    letter_order_protest_user_id, letter_settlement_waiver_date, 
    letter_settlement_waiver_user_id, 
    letter_waive_notice_protest_date, 
    letter_waive_notice_protest_user_id, letter_final_order_date, 
    letter_final_order_user_id, letter_affidavit_hearing_date, 
    letter_affidavit_user_id, letter_settlement_informal_date, 
    letter_settlement_informal_user_id, 
    letter_taxpayer_inquiry_date, letter_taxpayer_inquiry_user_id, 
    letter_notice_protest_date, letter_notice_protest_user_id, 
    arb_motion, arb_second, arb_unanimous, arb_vote_info, 
    protest_record, close_date, close_by_id, 
    CONVERT(varchar(50), am_meeting_date) 
    AS am_meeting_date_str, CONVERT(varchar(50), 
    arb_hearing_date) AS arb_hearing_date_str
FROM arb_protest

GO

