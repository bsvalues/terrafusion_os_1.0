CREATE TABLE [dbo].[postal_fees] (
    [type]                INT          NOT NULL,
    [postage_fee]         MONEY        NULL,
    [certified_fee]       MONEY        NULL,
    [receipt_fee]         MONEY        NULL,
    [restricted_delivery] MONEY        NULL,
    [total_postage_fees]  MONEY        NULL,
    [description]         VARCHAR (50) NULL,
    CONSTRAINT [CPK_postal_fees] PRIMARY KEY CLUSTERED ([type] ASC)
);


GO

