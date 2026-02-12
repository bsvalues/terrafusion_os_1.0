CREATE TABLE [dbo].[ptd_mt_state_report_tvb] (
    [entity_id]        INT             NOT NULL,
    [year]             NUMERIC (4)     NOT NULL,
    [as_of_sup_num]    INT             NOT NULL,
    [date]             DATETIME        NULL,
    [category_cd]      VARCHAR (10)    NOT NULL,
    [category_count]   INT             NULL,
    [category_acres]   NUMERIC (11, 3) NULL,
    [category_amt]     NUMERIC (14)    NULL,
    [dataset_id]       BIGINT          NOT NULL,
    [category_d_count] INT             NULL,
    CONSTRAINT [CPK_ptd_mt_state_report_tvb] PRIMARY KEY CLUSTERED ([dataset_id] ASC, [entity_id] ASC, [year] ASC, [as_of_sup_num] ASC, [category_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

