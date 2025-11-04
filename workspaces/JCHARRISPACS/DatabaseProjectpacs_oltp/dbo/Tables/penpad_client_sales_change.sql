CREATE TABLE [dbo].[penpad_client_sales_change] (
    [change_id]       INT          NOT NULL,
    [chg_of_owner_id] INT          NOT NULL,
    [prop_id]         INT          NOT NULL,
    [seller_id]       INT          NULL,
    [seller_name]     VARCHAR (70) NULL,
    [buyer_id]        INT          NULL,
    [buyer_name]      VARCHAR (70) NULL,
    CONSTRAINT [CPK_penpad_client_sales_change] PRIMARY KEY CLUSTERED ([change_id] ASC, [chg_of_owner_id] ASC, [prop_id] ASC)
);


GO

