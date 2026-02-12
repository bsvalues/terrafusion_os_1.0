CREATE TABLE [dbo].[wash_appraisal_notice_personal_segment_info] (
    [notice_year]       NUMERIC (4)   NOT NULL,
    [notice_run_id]     INT           NOT NULL,
    [prop_id]           INT           NOT NULL,
    [owner_id]          INT           NOT NULL,
    [sup_yr]            NUMERIC (4)   NOT NULL,
    [sup_num]           INT           NOT NULL,
    [notice_acct_id]    INT           NOT NULL,
    [pp_seg_id]         INT           NOT NULL,
    [pp_sub_seg_id]     INT           NOT NULL,
    [pp_sched_cd]       VARCHAR (10)  NULL,
    [pp_description]    VARCHAR (255) NULL,
    [pp_year_acquired]  NUMERIC (4)   NULL,
    [pp_orig_cost]      NUMERIC (14)  NULL,
    [pp_assessed_value] NUMERIC (14)  NULL,
    CONSTRAINT [CPK_wash_appraisal_notice_personal_segment_info] PRIMARY KEY CLUSTERED ([notice_year] ASC, [notice_run_id] ASC, [prop_id] ASC, [owner_id] ASC, [sup_yr] ASC, [sup_num] ASC, [notice_acct_id] ASC, [pp_seg_id] ASC, [pp_sub_seg_id] ASC)
);


GO

