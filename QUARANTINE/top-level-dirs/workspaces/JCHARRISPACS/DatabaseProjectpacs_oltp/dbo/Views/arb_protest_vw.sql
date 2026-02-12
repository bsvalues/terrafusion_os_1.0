


CREATE VIEW dbo.arb_protest_vw
AS
SELECT arb_protest.appr_year, arb_protest.case_id, 
    arb_protest.prop_id, arb_protest.sup_num, 
    arb_protest.prop_val_yr, arb_protest.status, 
    arb_status.arb_status_desc, arb_protest.inquiry_by_type, 
    arb_protest.inquiry_by_id, arb_protest.inquiry_appraiser_id, 
    arb_protest.inquiry_taxpayer_comment, account.file_as_name, 
    arb_protest.inquiry_operator_comment, 
    arb_protest.inquiry_user_id, arb_protest.inquiry_source_cd, 
    arb_protest.inquiry_type_cd, arb_protest.am_meeting_id, 
    arb_protest.am_meeting_date, arb_protest.am_attendee, 
    arb_protest.taxpayer_comment, 
    arb_protest.appraiser_comment, arb_protest.arb_board, 
    arb_protest.arb_hearing_date, 
    arb_protest.arb_taxpayer_comment, 
    arb_protest.arb_cad_comment, arb_protest.date_created, 
    arb_protest.begin_imprv_hstd, 
    arb_protest.begin_imprv_non_hstd, 
    arb_protest.begin_land_hstd, 
    arb_protest.begin_land_non_hstd, arb_protest.begin_ag_mkt, 
    arb_protest.begin_ag_use, arb_protest.begin_timb_mkt, 
    arb_protest.begin_timb_use, arb_protest.begin_appraised, 
    arb_protest.begin_ten_percent_cap, 
    arb_protest.begin_assessed, arb_protest.end_imprv_hstd, 
    arb_protest.end_imprv_non_hstd, arb_protest.end_land_hstd, 
    arb_protest.end_land_non_hstd, arb_protest.end_ag_mkt, 
    arb_protest.end_ag_use, arb_protest.end_timb_mkt, 
    arb_protest.end_timb_use, arb_protest.end_appraised, 
    arb_protest.end_ten_percent_cap, arb_protest.end_assessed, 
    arb_protest.resolution_cd, arb_protest.resolution_comment, 
    arb_protest.resolved_by_id, 
    arb_protest_cd.arb_protest_desc AS inquiry_type_desc, 
    appraiser.appraiser_nm, arb_board.arb_board_desc, 
    arb_protest.protest_record, arb_protest.protest_appraiser_id, 
    arb_protest.close_date, arb_protest.close_by_id
FROM arb_protest LEFT OUTER JOIN
    arb_board ON 
    arb_protest.arb_board = arb_board.arb_board_cd LEFT OUTER JOIN
    arb_protest_cd ON 
    arb_protest.inquiry_type_cd = arb_protest_cd.arb_protest_cd LEFT
     OUTER JOIN
    appraiser ON 
    arb_protest.inquiry_appraiser_id = appraiser.appraiser_id LEFT OUTER
     JOIN
    account ON 
    arb_protest.inquiry_by_id = account.acct_id LEFT OUTER JOIN
    arb_status ON arb_protest.status = arb_status.arb_status_cd

GO

