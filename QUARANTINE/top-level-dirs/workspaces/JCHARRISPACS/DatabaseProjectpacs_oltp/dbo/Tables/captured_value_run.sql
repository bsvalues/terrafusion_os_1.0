CREATE TABLE [dbo].[captured_value_run] (
    [captured_value_run_id] INT          NOT NULL,
    [year]                  NUMERIC (4)  NOT NULL,
    [description]           VARCHAR (50) NULL,
    [as_of_sup_num]         INT          NOT NULL,
    [created_date]          DATETIME     NOT NULL,
    [created_by_id]         INT          NOT NULL,
    [is_certified_value]    BIT          DEFAULT ((0)) NOT NULL,
    [status]                CHAR (10)    NULL,
    CONSTRAINT [CPK_captured_value_run] PRIMARY KEY CLUSTERED ([captured_value_run_id] ASC, [year] ASC)
);


GO

