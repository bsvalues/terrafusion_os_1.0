CREATE TABLE [dbo].[_arb_inquiry_taxpayer_doc_type] (
    [taxpayer_doc_type_cd]   VARCHAR (10) NOT NULL,
    [taxpayer_doc_type_desc] VARCHAR (50) NULL,
    [sys_flag]               CHAR (1)     NULL,
    CONSTRAINT [CPK__arb_inquiry_taxpayer_doc_type] PRIMARY KEY CLUSTERED ([taxpayer_doc_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

