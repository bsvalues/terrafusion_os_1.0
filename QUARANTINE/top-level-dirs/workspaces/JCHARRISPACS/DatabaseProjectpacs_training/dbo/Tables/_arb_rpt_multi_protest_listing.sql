CREATE TABLE [dbo].[_arb_rpt_multi_protest_listing] (
    [pacs_user_id]          INT          NOT NULL,
    [prop_id]               INT          NOT NULL,
    [prop_val_yr]           NUMERIC (18) NOT NULL,
    [case_id]               INT          NOT NULL,
    [prot_status]           VARCHAR (10) NULL,
    [prot_type]             VARCHAR (10) NULL,
    [prot_by_type]          VARCHAR (10) NULL,
    [prot_hearing_start_dt] DATETIME     NULL
);


GO

