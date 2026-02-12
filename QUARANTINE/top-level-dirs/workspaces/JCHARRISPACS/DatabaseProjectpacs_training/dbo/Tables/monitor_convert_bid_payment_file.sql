CREATE TABLE [dbo].[monitor_convert_bid_payment_file] (
    [record_type] VARCHAR (4)   NOT NULL,
    [vendor]      VARCHAR (4)   NOT NULL,
    [geo_id]      VARCHAR (50)  NOT NULL,
    [amount_paid] NVARCHAR (17) NOT NULL,
    [unknown]     VARCHAR (1)   NULL,
    [receipt]     VARCHAR (9)   NULL
);


GO

