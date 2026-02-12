CREATE TABLE [dbo].[condominium] (
    [abs_subdv_cd]        VARCHAR (10)    NOT NULL,
    [abs_subdv_yr]        NUMERIC (4)     NOT NULL,
    [condo_group_num]     VARCHAR (10)    NULL,
    [maint_level_cd]      VARCHAR (10)    NULL,
    [complex_name]        VARCHAR (40)    NULL,
    [plot_plan_cd]        VARCHAR (10)    NULL,
    [year_built]          NUMERIC (4)     NULL,
    [style_cd]            VARCHAR (10)    NULL,
    [quality_cd]          VARCHAR (10)    NULL,
    [material_cd]         VARCHAR (10)    NULL,
    [hoa_fee]             NUMERIC (10, 2) NULL,
    [interval_cd]         VARCHAR (2)     NULL,
    [building_count]      INT             NULL,
    [phase_unit_count]    INT             NULL,
    [complex_unit_count]  INT             NULL,
    [handicap_unit_count] INT             NULL,
    [stories]             VARCHAR (10)    NULL,
    [owner_occupied]      NUMERIC (5, 2)  NULL,
    [phased_unit_dev]     BIT             NULL,
    [converted_apts]      BIT             NULL,
    [comment]             VARCHAR (3000)  NULL,
    [hood_cd]             VARCHAR (10)    NULL,
    CONSTRAINT [CPK_condominium] PRIMARY KEY CLUSTERED ([abs_subdv_cd] ASC, [abs_subdv_yr] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_condominium_abs_subdv_cd_abs_subdv_yr] FOREIGN KEY ([abs_subdv_cd], [abs_subdv_yr]) REFERENCES [dbo].[abs_subdv] ([abs_subdv_cd], [abs_subdv_yr]),
    CONSTRAINT [CFK_condominium_condo_group_num] FOREIGN KEY ([condo_group_num]) REFERENCES [dbo].[condo_group_number] ([condo_group_cd]),
    CONSTRAINT [CFK_condominium_hood_cd_abs_subdv_yr] FOREIGN KEY ([hood_cd], [abs_subdv_yr]) REFERENCES [dbo].[neighborhood] ([hood_cd], [hood_yr]),
    CONSTRAINT [CFK_condominium_maint_level_cd] FOREIGN KEY ([maint_level_cd]) REFERENCES [dbo].[condo_maintenance] ([maintenance_cd]),
    CONSTRAINT [CFK_condominium_material_cd] FOREIGN KEY ([material_cd]) REFERENCES [dbo].[condo_material_code] ([material_cd]),
    CONSTRAINT [CFK_condominium_plot_plan_cd] FOREIGN KEY ([plot_plan_cd]) REFERENCES [dbo].[condo_plot_code] ([plot_cd]),
    CONSTRAINT [CFK_condominium_quality_cd] FOREIGN KEY ([quality_cd]) REFERENCES [dbo].[condo_quality_code] ([quality_cd]),
    CONSTRAINT [CFK_condominium_stories] FOREIGN KEY ([stories]) REFERENCES [dbo].[condo_stories_code] ([stories_cd]),
    CONSTRAINT [CFK_condominium_style_cd] FOREIGN KEY ([style_cd]) REFERENCES [dbo].[condo_style_code] ([style_cd])
);


GO

