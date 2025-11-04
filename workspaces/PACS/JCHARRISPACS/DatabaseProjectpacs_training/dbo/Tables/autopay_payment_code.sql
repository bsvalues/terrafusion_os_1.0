CREATE TABLE [dbo].[autopay_payment_code] (
    [payment_cd]  INT          NOT NULL,
    [description] VARCHAR (32) NULL,
    CONSTRAINT [CPK_autopay_payment_code] PRIMARY KEY CLUSTERED ([payment_cd] ASC)
);


GO

