CREATE TABLE [dbo].[autopay_account_type] (
    [account_type_cd] INT          NOT NULL,
    [description]     VARCHAR (32) NULL,
    CONSTRAINT [CPK_autopay_account_type] PRIMARY KEY CLUSTERED ([account_type_cd] ASC)
);


GO

