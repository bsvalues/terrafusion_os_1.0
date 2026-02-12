CREATE TABLE [dbo].[arb_decision] (
    [arb_decision_cd]   CHAR (5)     NOT NULL,
    [arb_decision_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_decision] PRIMARY KEY CLUSTERED ([arb_decision_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

