CREATE TABLE [dbo].[import_user_assessment_data] (
    [import_id]                 INT           NOT NULL,
    [import_data_id]            INT           IDENTITY (1, 1) NOT NULL,
    [match]                     CHAR (1)      NULL,
    [error]                     VARCHAR (255) NULL,
    [complete]                  BIT           NULL,
    [pacs_property_id]          INT           NULL,
    [pacs_geo_id]               CHAR (25)     NULL,
    [prop_id]                   INT           NULL,
    [geo_id]                    CHAR (25)     NULL,
    [nwa_forestparcel_count]    INT           NULL,
    [nwa_nonforestparcel_count] INT           NULL,
    [nwa_forestacres_sum]       INT           NULL,
    [nwa_nonforestacres_sum]    INT           NULL,
    PRIMARY KEY CLUSTERED ([import_id] ASC, [import_data_id] ASC)
);


GO

