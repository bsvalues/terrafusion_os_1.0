CREATE TABLE [dbo].[escrow_plat_letter_print_history] (
    [history_id]     INT             NOT NULL,
    [escrow_id]      INT             NOT NULL,
    [prop_id]        INT             NOT NULL,
    [year]           NUMERIC (4)     NOT NULL,
    [amount_due]     NUMERIC (14, 2) NOT NULL,
    [legal_desc]     VARCHAR (255)   NULL,
    [comment]        VARCHAR (80)    NULL,
    [owner_name]     VARCHAR (70)    NULL,
    [owner_address]  VARCHAR (MAX)   NULL,
    [preparer_name]  VARCHAR (30)    NULL,
    [receipt_number] INT             NULL,
    CONSTRAINT [CPK_escrow_plat_letter_print_history] PRIMARY KEY CLUSTERED ([history_id] ASC)
);


GO

