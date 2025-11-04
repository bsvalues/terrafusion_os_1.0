CREATE TABLE [dbo].[arb_protest_cd] (
    [arb_protest_cd]   VARCHAR (10) NOT NULL,
    [arb_protest_desc] VARCHAR (50) NULL,
    [sys_flag]         CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_protest_cd] PRIMARY KEY NONCLUSTERED ([arb_protest_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

