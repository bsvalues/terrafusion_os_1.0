CREATE TABLE [dbo].[wash_ag_rollback] (
    [ag_rollbk_id]         INT             NOT NULL,
    [classification]       VARCHAR (20)    NULL,
    [num_records_removed]  VARCHAR (23)    NULL,
    [num_years_removed]    INT             NULL,
    [num_acres_removed]    NUMERIC (10, 5) NULL,
    [taxes]                NUMERIC (14, 2) NULL,
    [penalty]              NUMERIC (14, 2) NULL,
    [recording_fee]        NUMERIC (14, 2) NULL,
    [total_due]            NUMERIC (14, 2) NULL,
    [total_prior_due]      NUMERIC (14, 2) NULL,
    [removal_intent_dt]    DATETIME        NULL,
    [ext_granted_dt]       DATETIME        NULL,
    [ext_granted_override] BIT             NULL,
    [tax_area_id]          INT             NULL,
    [tax_year]             INT             NULL,
    [penalty_percent]      NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_wash_ag_rollback] PRIMARY KEY CLUSTERED ([ag_rollbk_id] ASC)
);


GO

