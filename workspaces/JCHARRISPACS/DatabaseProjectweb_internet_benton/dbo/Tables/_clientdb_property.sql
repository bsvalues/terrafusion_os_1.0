CREATE TABLE [dbo].[_clientdb_property] (
    [prop_id]                 INT              NOT NULL,
    [prop_val_yr]             NUMERIC (4)      NOT NULL,
    [geo_id]                  VARCHAR (50)     NULL,
    [prop_type_cd]            VARCHAR (5)      NULL,
    [prop_type_desc]          VARCHAR (50)     NULL,
    [dba_name]                VARCHAR (50)     NULL,
    [legal_desc]              VARCHAR (255)    NULL,
    [appraised_val]           NUMERIC (14)     NULL,
    [abs_subdv_cd]            VARCHAR (50)     NULL,
    [mapsco]                  VARCHAR (20)     NULL,
    [map_id]                  VARCHAR (20)     NULL,
    [udi_parent_prop_id]      INT              NULL,
    [agent_cd]                VARCHAR (10)     NULL,
    [situs_display]           VARCHAR (255)    NULL,
    [situs_num]               VARCHAR (15)     NULL,
    [situs_street]            VARCHAR (50)     NULL,
    [street_name]             VARCHAR (75)     NULL,
    [situs_city]              VARCHAR (30)     NULL,
    [hood_cd]                 VARCHAR (10)     NULL,
    [hood_name]               VARCHAR (100)    NULL,
    [owner_name]              VARCHAR (70)     NULL,
    [addr_line1]              VARCHAR (60)     NULL,
    [addr_line2]              VARCHAR (60)     NULL,
    [addr_line3]              VARCHAR (60)     NULL,
    [addr_city]               VARCHAR (50)     NULL,
    [addr_state]              VARCHAR (50)     NULL,
    [addr_zip]                VARCHAR (10)     NULL,
    [country_cd]              VARCHAR (5)      NULL,
    [owner_id]                INT              NULL,
    [pct_ownership]           NUMERIC (13, 10) NULL,
    [udi_child_prop_id]       INT              NULL,
    [percent_type]            VARCHAR (5)      NULL,
    [exemptions]              VARCHAR (100)    NULL,
    [state_cd]                VARCHAR (10)     NULL,
    [jurisdictions]           VARCHAR (100)    NULL,
    [image_path]              VARCHAR (255)    NULL,
    [show_values]             VARCHAR (1)      NULL,
    [tax_area_id]             INT              NULL,
    [tax_area]                VARCHAR (300)    NULL,
    [dor_use_code]            VARCHAR (10)     NULL,
    [open_space]              VARCHAR (1)      NULL,
    [dfl]                     VARCHAR (1)      NULL,
    [historic]                VARCHAR (1)      NULL,
    [remodel]                 VARCHAR (1)      NULL,
    [multi_fam]               VARCHAR (1)      NULL,
    [township_code]           VARCHAR (20)     NULL,
    [range_code]              VARCHAR (20)     NULL,
    [township_section]        VARCHAR (50)     NULL,
    [legal_acreage]           NUMERIC (14, 4)  NULL,
    [non_taxed_mkt_val]       NUMERIC (14)     NULL,
    [is_leased_land_property] BIT              NOT NULL,
    [property_use_cd]         VARCHAR (10)     NULL,
    [secondary_use_cd]        VARCHAR (10)     NULL
);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_owner_name_prop_val_yr]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [owner_name] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_abs_subdv_cd]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [abs_subdv_cd] ASC);


GO

CREATE CLUSTERED INDEX [IX__clientdb_property_prop_id_prop_val_yr]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [prop_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_geo_id]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [geo_id] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_dba_name]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [dba_name] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_hood_cd]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [hood_cd] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_situs_street]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [situs_street] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_street_name]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [street_name] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_situs_city]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [situs_city] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_mapsco]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [mapsco] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_state_cd]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [state_cd] ASC);


GO

CREATE NONCLUSTERED INDEX [IX__clientdb_property_prop_val_yr_situs_num]
    ON [dbo].[_clientdb_property]([prop_val_yr] ASC, [situs_num] ASC);


GO

