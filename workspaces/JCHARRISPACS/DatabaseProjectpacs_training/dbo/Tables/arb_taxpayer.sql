CREATE TABLE [dbo].[arb_taxpayer] (
    [taxpayer_arg_cd]   CHAR (5)     NOT NULL,
    [taxpayer_arg_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_taxpayer] PRIMARY KEY CLUSTERED ([taxpayer_arg_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

