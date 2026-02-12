CREATE TABLE [dbo].[tax_auction_status] (
    [tax_auction_status_code]        VARCHAR (10) NOT NULL,
    [tax_auction_status_description] VARCHAR (50) NOT NULL,
    [enable_sold]                    BIT          CONSTRAINT [CDF_tax_auction_status_enable_sold] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_tax_auction_status] PRIMARY KEY CLUSTERED ([tax_auction_status_code] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This flag will allow the automatically set the sale bit on Tax Sale items when the tax sale status is changed to a code with this flag set.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_auction_status', @level2type = N'COLUMN', @level2name = N'enable_sold';


GO

