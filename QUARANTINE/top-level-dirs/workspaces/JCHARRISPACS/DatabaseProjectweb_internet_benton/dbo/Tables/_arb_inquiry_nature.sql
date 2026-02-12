CREATE TABLE [dbo].[_arb_inquiry_nature] (
    [inquiry_nature_cd]   VARCHAR (10) NOT NULL,
    [inquiry_nature_desc] VARCHAR (50) NULL,
    [sys_flag]            CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_inquiry_nature] PRIMARY KEY CLUSTERED ([inquiry_nature_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

