CREATE TABLE [dbo].[mm_config] (
    [mm_id]                            INT             NOT NULL,
    [type]                             VARCHAR (2)     NOT NULL,
    [criteria_type]                    CHAR (1)        NOT NULL,
    [year]                             NUMERIC (4)     NOT NULL,
    [reason_code]                      VARCHAR (10)    NOT NULL,
    [description]                      VARCHAR (200)   NOT NULL,
    [supplement_flag]                  BIT             CONSTRAINT [CDF_mm_config_supplement_flag] DEFAULT ((0)) NOT NULL,
    [include_deleted_properties]       BIT             CONSTRAINT [CDF_mm_config_include_deleted_properties] DEFAULT ((0)) NOT NULL,
    [gross_living_area_begin]          NUMERIC (18, 1) NULL,
    [gross_living_area_end]            NUMERIC (18, 1) NULL,
    [site_size_begin]                  NUMERIC (18, 4) NULL,
    [site_size_end]                    NUMERIC (18, 4) NULL,
    [effective_age_begin]              NUMERIC (4)     NULL,
    [effective_age_end]                NUMERIC (4)     NULL,
    [actual_age_begin]                 NUMERIC (4)     NULL,
    [actual_age_end]                   NUMERIC (4)     NULL,
    [map_id]                           VARCHAR (255)   NULL,
    [mapsco]                           VARCHAR (255)   NULL,
    [update_udi_child_prop_group_flag] BIT             CONSTRAINT [CDF_mm_config_update_udi_child_prop_group_flag] DEFAULT ((0)) NOT NULL,
    [sql_query]                        VARCHAR (4000)  NULL,
    [run_date]                         DATETIME        NOT NULL,
    [run_user_id]                      INT             NOT NULL,
    [undo_date]                        DATETIME        NULL,
    [undo_user_id]                     INT             NULL,
    [item_count]                       INT             NULL,
    [update_properties_in_future_year] BIT             CONSTRAINT [CDF_mm_config_update_properties_in_future_year] DEFAULT ((0)) NOT NULL,
    [daily_batch_id]                   INT             NULL,
    CONSTRAINT [CPK_mm_config] PRIMARY KEY CLUSTERED ([mm_id] ASC),
    CONSTRAINT [CFK_mm_config_reason_code] FOREIGN KEY ([reason_code]) REFERENCES [dbo].[mass_update_reason] ([reason_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The daily batch that was used for a mass maintenance run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mm_config', @level2type = N'COLUMN', @level2name = N'daily_batch_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Mass Update indicator to apply changes to the Future Year Layer', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'mm_config', @level2type = N'COLUMN', @level2name = N'update_properties_in_future_year';


GO

