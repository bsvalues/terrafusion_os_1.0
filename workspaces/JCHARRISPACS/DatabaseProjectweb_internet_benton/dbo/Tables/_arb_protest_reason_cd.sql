CREATE TABLE [dbo].[_arb_protest_reason_cd] (
    [reason_cd]   VARCHAR (10)  NOT NULL,
    [reason_desc] VARCHAR (100) NULL,
    [sys_flag]    CHAR (1)      NULL,
    [equity_flag] BIT           NOT NULL,
    CONSTRAINT [CPK__arb_protest_reason_cd] PRIMARY KEY CLUSTERED ([reason_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

