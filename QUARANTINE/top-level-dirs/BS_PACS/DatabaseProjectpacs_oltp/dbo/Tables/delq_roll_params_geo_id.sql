CREATE TABLE [dbo].[delq_roll_params_geo_id] (
    [pacs_user_id] INT           NOT NULL,
    [geo_id]       VARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_delq_roll_params_geo_id] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [geo_id] ASC) WITH (FILLFACTOR = 100)
);


GO

