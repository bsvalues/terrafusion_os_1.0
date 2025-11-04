CREATE TABLE [dbo].[abs_subdv_worksheet] (
    [abs_subdv_cd]            VARCHAR (10)   NOT NULL,
    [cad_acct_no]             VARCHAR (50)   NULL,
    [cad_slide_no]            VARCHAR (20)   NULL,
    [tax_year]                VARCHAR (4)    NULL,
    [map_records_cabinet]     VARCHAR (10)   NULL,
    [date_approved]           DATETIME       NULL,
    [slide]                   VARCHAR (10)   NULL,
    [file_date]               DATETIME       NULL,
    [current_owner]           VARCHAR (100)  NULL,
    [current_cc_vol_page]     VARCHAR (50)   NULL,
    [current_deed_type]       VARCHAR (10)   NULL,
    [current_exc_date]        DATETIME       NULL,
    [city_entity]             VARCHAR (50)   NULL,
    [county_entity]           VARCHAR (50)   NULL,
    [school_entity]           VARCHAR (50)   NULL,
    [mapsco_no]               VARCHAR (20)   NULL,
    [access_code]             VARCHAR (20)   NULL,
    [res_com_ex]              VARCHAR (20)   NULL,
    [impts]                   VARCHAR (20)   NULL,
    [lots]                    VARCHAR (20)   NULL,
    [tracts]                  VARCHAR (20)   NULL,
    [plat_acreage]            VARCHAR (20)   NULL,
    [rollback]                VARCHAR (20)   NULL,
    [sq_footage]              VARCHAR (20)   NULL,
    [previous_owner]          VARCHAR (100)  NULL,
    [previous_cc_vol_page]    VARCHAR (50)   NULL,
    [previous_deed_type]      VARCHAR (10)   NULL,
    [previous_exc_date]       DATETIME       NULL,
    [abstract_map_changed]    BIT            NULL,
    [subdivision_map_changed] BIT            NULL,
    [remarks]                 VARCHAR (2000) NULL,
    CONSTRAINT [CPK_abs_subdv_worksheet] PRIMARY KEY CLUSTERED ([abs_subdv_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

