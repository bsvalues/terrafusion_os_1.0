CREATE TABLE [dbo].[_arb_event_type] (
    [szARBType] VARCHAR (2)  NOT NULL,
    [szCode]    VARCHAR (10) NOT NULL,
    [szDesc]    VARCHAR (50) NULL,
    [sys_flag]  CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_event_type] PRIMARY KEY CLUSTERED ([szARBType] ASC, [szCode] ASC) WITH (FILLFACTOR = 90)
);


GO

