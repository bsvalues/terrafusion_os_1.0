CREATE TABLE [dbo].[tax_summary_report] (
    [pacs_user_id]     INT             NOT NULL,
    [report_id]        INT             IDENTITY (1, 1) NOT NULL,
    [owner_id]         INT             NULL,
    [file_as_name]     VARCHAR (70)    NULL,
    [effective_due_dt] DATETIME        NULL,
    [prop_id]          INT             NULL,
    [legal_desc]       VARCHAR (255)   NULL,
    [bill_id]          INT             NULL,
    [entity_cd]        VARCHAR (5)     NULL,
    [bill_year]        NUMERIC (4)     NULL,
    [bill_base_tax]    NUMERIC (14, 2) NULL,
    [bill_p_and_i]     NUMERIC (14, 2) NULL,
    [bill_atty_fees]   NUMERIC (14, 2) NULL,
    [bill_total]       NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_tax_summary_report] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [report_id] ASC) WITH (FILLFACTOR = 90)
);


GO

