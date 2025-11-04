CREATE TABLE [dbo].[prelim_property] (
    [prop_id]           INT            NOT NULL,
    [prop_type_cd]      CHAR (5)       NOT NULL,
    [prop_create_dt]    DATETIME       NULL,
    [ref_id1]           VARCHAR (50)   NULL,
    [ref_id2]           VARCHAR (50)   NULL,
    [geo_id]            VARCHAR (50)   NULL,
    [ams_load_dt]       DATETIME       NULL,
    [prop_cmnt]         VARCHAR (3000) NULL,
    [prop_sic_cd]       CHAR (5)       NULL,
    [dba_name]          VARCHAR (50)   NULL,
    [alt_dba_name]      VARCHAR (50)   NULL,
    [exmpt_reset]       CHAR (1)       NULL,
    [gpm_irrig]         INT            NULL,
    [utilities]         VARCHAR (50)   NULL,
    [topography]        VARCHAR (50)   NULL,
    [road_access]       VARCHAR (50)   NULL,
    [other]             VARCHAR (50)   NULL,
    [zoning]            VARCHAR (50)   NULL,
    [remarks]           VARCHAR (3000) NULL,
    [state_cd]          CHAR (5)       NULL,
    [mass_created_from] INT            NULL,
    CONSTRAINT [CPK_prelim_property] PRIMARY KEY CLUSTERED ([prop_id] ASC) WITH (FILLFACTOR = 90)
);


GO

