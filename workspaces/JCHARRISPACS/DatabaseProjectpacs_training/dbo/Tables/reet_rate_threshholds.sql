CREATE TABLE [dbo].[reet_rate_threshholds] (
    [tax_district_id] INT            NULL,
    [reet_rate_id]    INT            NULL,
    [min_sale_price]  NUMERIC (14)   NULL,
    [max_sale_price]  NUMERIC (14)   NULL,
    [reet_rate]       NUMERIC (5, 2) NULL,
    [description]     VARCHAR (50)   NULL,
    [ID]              INT            IDENTITY (1, 1) NOT NULL
);


GO

