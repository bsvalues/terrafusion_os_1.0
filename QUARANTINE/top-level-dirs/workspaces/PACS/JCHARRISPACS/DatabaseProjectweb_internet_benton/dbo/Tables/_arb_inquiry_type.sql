CREATE TABLE [dbo].[_arb_inquiry_type] (
    [inquiry_type_cd]   VARCHAR (10) NOT NULL,
    [inquiry_type_desc] VARCHAR (50) NULL,
    [sys_flag]          CHAR (1)     NULL,
    [priority]          INT          NOT NULL,
    CONSTRAINT [CPK__arb_inquiry_type] PRIMARY KEY CLUSTERED ([inquiry_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

