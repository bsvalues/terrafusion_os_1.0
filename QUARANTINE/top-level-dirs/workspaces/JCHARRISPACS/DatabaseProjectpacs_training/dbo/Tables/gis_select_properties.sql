CREATE TABLE [dbo].[gis_select_properties] (
    [computer_id] VARCHAR (50) NOT NULL,
    [user_id]     VARCHAR (50) NOT NULL,
    [prop_id]     INT          NOT NULL,
    CONSTRAINT [CPK_gis_select_properties] PRIMARY KEY CLUSTERED ([computer_id] ASC, [user_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

