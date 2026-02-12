CREATE TABLE [dbo].[arb_status] (
    [arb_status_cd]   CHAR (5)     NOT NULL,
    [arb_status_desc] VARCHAR (50) NULL,
    [generate_letter] CHAR (1)     NULL,
    [letter_type]     VARCHAR (50) NULL,
    [close_case]      CHAR (1)     NULL,
    [sys_flag]        CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_status] PRIMARY KEY NONCLUSTERED ([arb_status_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

