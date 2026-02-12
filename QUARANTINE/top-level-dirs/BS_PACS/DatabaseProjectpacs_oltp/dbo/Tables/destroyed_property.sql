CREATE TABLE [dbo].[destroyed_property] (
    [prop_val_yr]                   NUMERIC (4)    NOT NULL,
    [sup_num]                       INT            NOT NULL,
    [prop_id]                       INT            NOT NULL,
    [date_destroyed]                DATETIME       NOT NULL,
    [january_one_value]             NUMERIC (14)   NOT NULL,
    [january_one_land_value]        NUMERIC (14)   NOT NULL,
    [january_one_imprv_value]       NUMERIC (14)   NOT NULL,
    [jan1_taxable_classified]       NUMERIC (14)   NOT NULL,
    [jan1_taxable_non_classified]   NUMERIC (14)   NOT NULL,
    [after_destruction_value]       NUMERIC (14)   NOT NULL,
    [after_destruction_land_value]  NUMERIC (14)   NOT NULL,
    [after_destruction_imprv_value] NUMERIC (14)   NOT NULL,
    [reduction_value]               NUMERIC (14)   NOT NULL,
    [reduction_land_value]          NUMERIC (14)   NOT NULL,
    [reduction_imprv_value]         NUMERIC (14)   NOT NULL,
    [percent_destroyed]             NUMERIC (5, 2) NOT NULL,
    [days_prior]                    INT            NULL,
    [days_after]                    INT            NULL,
    [cause]                         VARCHAR (255)  NULL,
    [date_approved]                 DATETIME       NULL,
    [appraiser]                     VARCHAR (50)   NULL,
    CONSTRAINT [CPK_destroyed_property] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_destroyed_property_prop_val_yr_sup_num_prop_id] FOREIGN KEY ([prop_val_yr], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

