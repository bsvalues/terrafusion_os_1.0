CREATE TABLE [dbo].[gis_user_map] (
    [map_id]             INT           NOT NULL,
    [map_name]           VARCHAR (30)  NOT NULL,
    [map_description]    VARCHAR (MAX) NULL,
    [map_data]           VARCHAR (MAX) NULL,
    [pacs_user_id]       INT           NOT NULL,
    [updated_at]         DATETIME      CONSTRAINT [CDF_gis_user_map_updated_at] DEFAULT (getdate()) NOT NULL,
    [is_published]       BIT           CONSTRAINT [CDF_gis_user_map_is_published] DEFAULT ((0)) NOT NULL,
    [transfer_to_penpad] BIT           CONSTRAINT [CDF_gis_user_map_transfer_to_penpad] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_gis_user_map] PRIMARY KEY CLUSTERED ([map_id] ASC)
);


GO

