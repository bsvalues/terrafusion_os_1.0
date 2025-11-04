CREATE TABLE [dbo].[building_permit_worksheet_config] (
    [bp_worksheet_component_id]      INT            IDENTITY (100000, 1) NOT NULL,
    [bp_worksheet_component_name]    VARCHAR (255)  NOT NULL,
    [bp_worksheet_component_percent] NUMERIC (5, 2) NOT NULL,
    [type_cd]                        VARCHAR (10)   NULL,
    CONSTRAINT [CPK_building_permit_worksheet_config] PRIMARY KEY CLUSTERED ([bp_worksheet_component_id] ASC) WITH (FILLFACTOR = 90)
);


GO

