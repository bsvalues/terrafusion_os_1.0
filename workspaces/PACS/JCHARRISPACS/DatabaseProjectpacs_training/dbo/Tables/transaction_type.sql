CREATE TABLE [dbo].[transaction_type] (
    [transaction_type]      VARCHAR (25)  NOT NULL,
    [core_transaction_type] INT           NOT NULL,
    [transaction_desc]      VARCHAR (255) NULL,
    [is_distributed]        BIT           CONSTRAINT [CDF_transaction_type_is_distributed] DEFAULT ((1)) NOT NULL,
    CONSTRAINT [CPK_transaction_type] PRIMARY KEY CLUSTERED ([transaction_type] ASC)
);


GO

