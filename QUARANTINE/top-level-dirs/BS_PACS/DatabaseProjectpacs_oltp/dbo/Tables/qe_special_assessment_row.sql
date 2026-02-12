CREATE TABLE [dbo].[qe_special_assessment_row] (
    [report_id]       INT             NOT NULL,
    [prop_id]         INT             NOT NULL,
    [owner]           VARCHAR (70)    NULL,
    [amount]          NUMERIC (14, 2) NULL,
    [column1_old]     VARCHAR (30)    NULL,
    [column1_new]     VARCHAR (30)    NULL,
    [column2_old]     VARCHAR (30)    NULL,
    [column2_new]     VARCHAR (30)    NULL,
    [column3_old]     VARCHAR (30)    NULL,
    [column3_new]     VARCHAR (30)    NULL,
    [column4_old]     VARCHAR (30)    NULL,
    [column4_new]     VARCHAR (30)    NULL,
    [error_flag]      BIT             NULL,
    [error_reason]    VARCHAR (128)   NULL,
    [entered_prop_id] VARCHAR (50)    NOT NULL,
    CONSTRAINT [CPK_qe_special_assessment_row] PRIMARY KEY CLUSTERED ([report_id] ASC, [entered_prop_id] ASC) WITH (FILLFACTOR = 100)
);


GO

