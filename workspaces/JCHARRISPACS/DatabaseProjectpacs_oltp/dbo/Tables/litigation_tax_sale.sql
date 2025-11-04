CREATE TABLE [dbo].[litigation_tax_sale] (
    [litigation_id]         INT             NOT NULL,
    [prop_id]               INT             NOT NULL,
    [pacs_user_id]          INT             NOT NULL,
    [bidder_id]             INT             NOT NULL,
    [bidder_auction_date]   DATETIME        NULL,
    [auction_date]          DATETIME        NOT NULL,
    [auction_status]        VARCHAR (10)    NOT NULL,
    [delinquent_taxes_fees] NUMERIC (14, 2) NOT NULL,
    [current_taxes_fees]    NUMERIC (14, 2) NOT NULL,
    [minimum_bid_type]      BIT             DEFAULT ((0)) NOT NULL,
    [minimum_bid]           NUMERIC (14, 2) NOT NULL,
    [winning_bid]           NUMERIC (14, 2) NOT NULL,
    [payment_posted]        BIT             DEFAULT ((0)) NOT NULL,
    [sold]                  BIT             DEFAULT ((0)) NOT NULL,
    [sale_description]      VARCHAR (500)   NULL,
    CONSTRAINT [CPK_litigation_tax_sale] PRIMARY KEY CLUSTERED ([litigation_id] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_litigation_tax_sale_litigation] FOREIGN KEY ([litigation_id]) REFERENCES [dbo].[litigation] ([litigation_id]),
    CONSTRAINT [CFK_litigation_tax_sale_tax_auction_status] FOREIGN KEY ([auction_status]) REFERENCES [dbo].[tax_auction_status] ([tax_auction_status_code])
);


GO

