CREATE TABLE [dbo].[vit_sales] (
    [vit_sales_id]               INT              NOT NULL,
    [prop_id]                    INT              NOT NULL,
    [year]                       NUMERIC (4)      NOT NULL,
    [month]                      NUMERIC (2)      NOT NULL,
    [post_sales_date]            DATETIME         NULL,
    [filing_date]                DATETIME         NULL,
    [total_sales]                NUMERIC (18, 2)  NULL,
    [uptvf]                      NUMERIC (13, 10) NULL,
    [uptv]                       NUMERIC (18, 2)  NULL,
    [penalty]                    NUMERIC (18, 2)  NULL,
    [fines]                      NUMERIC (18, 2)  NULL,
    [amount_due]                 NUMERIC (18, 2)  NULL,
    [override_penalty]           CHAR (1)         NULL,
    [override_amount_due]        CHAR (1)         NULL,
    [comment]                    VARCHAR (2048)   NULL,
    [user_id]                    INT              NULL,
    [num_units_sold]             NUMERIC (18)     NULL,
    [fleet_sales_amount]         NUMERIC (18, 2)  NULL,
    [dealer_sales_amount]        NUMERIC (18, 2)  NULL,
    [subsequent_sales_amount]    NUMERIC (18, 2)  NULL,
    [num_fleet_units]            NUMERIC (18)     NULL,
    [num_dealer_units]           NUMERIC (18)     NULL,
    [num_subsequent_units]       NUMERIC (18)     NULL,
    [recalc_date]                DATETIME         NULL,
    [net_inventory_sales_amount] NUMERIC (18, 2)  NULL,
    [num_net_inventory_units]    NUMERIC (18)     NULL,
    CONSTRAINT [CPK_vit_sales] PRIMARY KEY CLUSTERED ([year] ASC, [prop_id] ASC, [month] ASC, [vit_sales_id] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[vit_sales]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

