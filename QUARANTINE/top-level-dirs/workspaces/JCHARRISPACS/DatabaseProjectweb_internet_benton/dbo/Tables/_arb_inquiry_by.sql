CREATE TABLE [dbo].[_arb_inquiry_by] (
    [inquiry_by_cd]   VARCHAR (10) NOT NULL,
    [inquiry_by_desc] VARCHAR (50) NULL,
    [sys_flag]        CHAR (1)     NULL,
    [manual_entry]    BIT          NOT NULL,
    CONSTRAINT [CPK__arb_inquiry_by] PRIMARY KEY CLUSTERED ([inquiry_by_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

