CREATE TABLE [dbo].[wa_tax_statement_assessment_fee] (
    [group_id]              INT             NOT NULL,
    [year]                  NUMERIC (4)     NOT NULL,
    [run_id]                INT             NOT NULL,
    [statement_id]          INT             NOT NULL,
    [assessment_fee_id]     INT             NOT NULL,
    [assessment_fee_amount] NUMERIC (14, 2) NOT NULL,
    [fee_cd]                VARCHAR (10)    NULL,
    [agency_id]             INT             NOT NULL,
    [order_num]             INT             NULL,
    CONSTRAINT [CPK_wa_tax_statement_assessment_fee] PRIMARY KEY CLUSTERED ([group_id] ASC, [year] ASC, [run_id] ASC, [statement_id] ASC, [assessment_fee_id] ASC) WITH (FILLFACTOR = 90)
);


GO

