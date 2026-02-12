CREATE TABLE [dbo].[arb_roll] (
    [arb_roll_id]      INT          NOT NULL,
    [arb_roll_id_desc] VARCHAR (50) NULL,
    [sys_flag]         CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_roll] PRIMARY KEY CLUSTERED ([arb_roll_id] ASC) WITH (FILLFACTOR = 90)
);


GO

