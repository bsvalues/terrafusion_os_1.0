CREATE TABLE [dbo].[taxpayer_bidder_registration] (
    [account_id]   INT          NOT NULL,
    [auction_date] DATETIME     NOT NULL,
    [description]  VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_taxpayer_bidder_registration] PRIMARY KEY CLUSTERED ([account_id] ASC, [auction_date] ASC),
    CONSTRAINT [CFK_taxpayer_bidder_registration_account] FOREIGN KEY ([account_id]) REFERENCES [dbo].[account] ([acct_id])
);


GO

