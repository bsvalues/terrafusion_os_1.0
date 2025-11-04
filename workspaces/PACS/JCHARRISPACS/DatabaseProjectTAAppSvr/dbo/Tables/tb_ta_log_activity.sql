CREATE TABLE [dbo].[tb_ta_log_activity] (
    [ID]            BIGINT         IDENTITY (1, 1) NOT NULL,
    [szMachine]     VARCHAR (23)   NOT NULL,
    [dtActivity]    DATETIME       NOT NULL,
    [szDescription] VARCHAR (2047) NOT NULL,
    CONSTRAINT [CPK_tb_ta_log_activity] PRIMARY KEY CLUSTERED ([ID] ASC) WITH (FILLFACTOR = 100)
);


GO

