CREATE TABLE [dbo].[property_current_use_review] (
    [prop_id]                INT          NOT NULL,
    [year]                   NUMERIC (4)  NOT NULL,
    [sup_num]                INT          NOT NULL,
    [manual_select]          BIT          NOT NULL,
    [auto_select]            BIT          NOT NULL,
    [status_code]            VARCHAR (15) NULL,
    [status_date]            DATETIME     NULL,
    [review_date]            DATETIME     NULL,
    [next_inspection_date]   DATETIME     NULL,
    [next_inspection_reason] VARCHAR (50) NULL,
    CONSTRAINT [CPK_property_current_use_review] PRIMARY KEY CLUSTERED ([prop_id] ASC, [year] ASC, [sup_num] ASC),
    CONSTRAINT [CFK_property_current_use_review_current_use_review_status] FOREIGN KEY ([status_code]) REFERENCES [dbo].[current_use_review_status] ([cur_use_cd]),
    CONSTRAINT [CFK_property_current_use_review_property_val] FOREIGN KEY ([year], [sup_num], [prop_id]) REFERENCES [dbo].[property_val] ([prop_val_yr], [sup_num], [prop_id])
);


GO

