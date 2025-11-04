CREATE TABLE [dbo].[_arb_protest_decision] (
    [decision_cd]   VARCHAR (10) NOT NULL,
    [decision_desc] VARCHAR (50) NULL,
    [sys_flag]      CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_protest_decision] PRIMARY KEY CLUSTERED ([decision_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

