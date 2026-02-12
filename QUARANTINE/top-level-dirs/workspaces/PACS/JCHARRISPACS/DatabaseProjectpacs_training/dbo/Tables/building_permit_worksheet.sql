CREATE TABLE [dbo].[building_permit_worksheet] (
    [bldg_permit_id]                       INT            NOT NULL,
    [bp_worksheet_component_id]            INT            NOT NULL,
    [bp_worksheet_component_percent]       NUMERIC (5, 2) NOT NULL,
    [bp_worksheet_component_input_percent] NUMERIC (5, 2) NOT NULL,
    [bp_worksheet_inspection_date]         DATETIME       NULL,
    CONSTRAINT [CPK_building_permit_worksheet] PRIMARY KEY CLUSTERED ([bldg_permit_id] ASC, [bp_worksheet_component_id] ASC) WITH (FILLFACTOR = 90)
);


GO

