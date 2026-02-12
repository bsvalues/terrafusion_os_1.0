CREATE TABLE [dbo].[income_sm_worksheet_values] (
    [event_id]    INT             NOT NULL,
    [seq_num]     INT             NOT NULL,
    [operator]    VARCHAR (3)     NULL,
    [description] VARCHAR (50)    NULL,
    [value]       NUMERIC (14, 2) NULL,
    [rate]        NUMERIC (14, 2) NULL,
    [percent]     NUMERIC (5, 2)  NULL,
    [units]       VARCHAR (20)    NULL,
    CONSTRAINT [CPK_income_sm_worksheet_values] PRIMARY KEY CLUSTERED ([event_id] ASC, [seq_num] ASC),
    CONSTRAINT [CFK_income_sm_worksheet_values_event] FOREIGN KEY ([event_id]) REFERENCES [dbo].[event] ([event_id])
);


GO

