CREATE TABLE [dbo].[neighborhood] (
    [hood_cd]            VARCHAR (10)   NOT NULL,
    [hood_yr]            NUMERIC (4)    NOT NULL,
    [hood_name]          VARCHAR (100)  NULL,
    [hood_land_pct]      NUMERIC (5, 2) NOT NULL,
    [hood_imprv_pct]     NUMERIC (5, 2) NOT NULL,
    [sys_flag]           CHAR (1)       NULL,
    [changed_flag]       CHAR (1)       NULL,
    [reappraisal_status] VARCHAR (20)   NULL,
    [life_cycle]         VARCHAR (20)   NULL,
    [phys_comment]       VARCHAR (500)  NULL,
    [eco_comment]        VARCHAR (500)  NULL,
    [gov_comment]        VARCHAR (500)  NULL,
    [soc_comment]        VARCHAR (500)  NULL,
    [inactive]           BIT            NOT NULL,
    [inactive_date]      DATETIME       NULL,
    [created_date]       DATETIME       NULL,
    [cycle]              INT            NULL,
    [nbhd_descr]         VARCHAR (5000) NULL,
    [nbhd_comment]       VARCHAR (5000) NULL,
    [ls_id]              INT            NULL,
    [appraiser_id]       INT            NOT NULL,
    [comments]           VARCHAR (500)  NULL,
    CONSTRAINT [CPK_neighborhood] PRIMARY KEY CLUSTERED ([hood_cd] ASC, [hood_yr] ASC) WITH (FILLFACTOR = 90)
);


GO

