CREATE TABLE [dbo].[abs_subdv] (
    [abs_subdv_cd]   VARCHAR (10)   NOT NULL,
    [abs_subdv_yr]   NUMERIC (4)    NOT NULL,
    [abs_subdv_desc] VARCHAR (60)   NULL,
    [abs_land_pct]   NUMERIC (5, 2) NOT NULL,
    [abs_imprv_pct]  NUMERIC (5, 2) NOT NULL,
    [abs_subdv_ind]  CHAR (1)       NULL,
    [sys_flag]       CHAR (1)       NULL,
    [changed_flag]   CHAR (1)       NULL,
    [cInCounty]      CHAR (1)       NOT NULL,
    [bActive]        BIT            NULL,
    [ls_id]          INT            NULL,
    [active_year]    NUMERIC (4)    NULL,
    [create_date]    DATETIME       NULL,
    CONSTRAINT [CPK_abs_subdv] PRIMARY KEY CLUSTERED ([abs_subdv_cd] ASC, [abs_subdv_yr] ASC) WITH (FILLFACTOR = 90)
);


GO

CREATE NONCLUSTERED INDEX [idx_abs_subdv_desc_abs_subdv_yr]
    ON [dbo].[abs_subdv]([abs_subdv_desc] ASC, [abs_subdv_yr] ASC);


GO

