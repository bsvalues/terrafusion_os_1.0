CREATE TABLE [dbo].[user_land_detail] (
    [prop_id]              INT             NOT NULL,
    [prop_val_yr]          NUMERIC (4)     NOT NULL,
    [sup_num]              INT             NOT NULL,
    [land_seg_id]          INT             NOT NULL,
    [original_file]        VARCHAR (10)    NULL,
    [acres_in_application] DECIMAL (18, 4) NULL,
    CONSTRAINT [CPK_user_land_detail] PRIMARY KEY CLUSTERED ([prop_val_yr] ASC, [sup_num] ASC, [prop_id] ASC, [land_seg_id] ASC) WITH (FILLFACTOR = 90)
);


GO

