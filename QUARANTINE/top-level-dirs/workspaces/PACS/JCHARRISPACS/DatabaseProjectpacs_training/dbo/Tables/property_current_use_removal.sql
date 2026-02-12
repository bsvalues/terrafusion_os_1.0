CREATE TABLE [dbo].[property_current_use_removal] (
    [prop_id]                INT             NOT NULL,
    [year]                   NUMERIC (4)     NOT NULL,
    [removal_id]             INT             NOT NULL,
    [application_number]     VARCHAR (16)    NOT NULL,
    [size_acres]             NUMERIC (14, 2) NOT NULL,
    [removal_date]           DATETIME        NOT NULL,
    [sup_num]                INT             NOT NULL,
    [manual_select]          BIT             NOT NULL,
    [auto_select]            BIT             NOT NULL,
    [status_code]            VARCHAR (15)    NULL,
    [status_date]            DATETIME        NULL,
    [review_date]            DATETIME        NULL,
    [next_inspection_date]   DATETIME        NULL,
    [next_inspection_reason] DATETIME        NULL,
    CONSTRAINT [CPK_property_current_use_removal] PRIMARY KEY CLUSTERED ([prop_id] ASC, [year] ASC, [sup_num] ASC, [removal_id] ASC),
    CONSTRAINT [CFK_property_current_use_removal_property_val] FOREIGN KEY ([year], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id]),
    CONSTRAINT [ck_property_current_use_removal_property_val] FOREIGN KEY ([year], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

