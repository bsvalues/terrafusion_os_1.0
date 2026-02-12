CREATE TABLE [dbo].[mh_lien] (
    [lien_id]                   INT            IDENTITY (1, 1) NOT NULL,
    [prop_id]                   INT            NOT NULL,
    [tax_yr]                    NUMERIC (4)    NOT NULL,
    [entity_id]                 INT            NOT NULL,
    [mbl_hm_hud_num]            VARCHAR (10)   NOT NULL,
    [mbl_hm_sn]                 VARCHAR (26)   NOT NULL,
    [lien_date]                 DATETIME       NOT NULL,
    [lien_pacs_user_id]         INT            NOT NULL,
    [lien_export_run_id]        INT            NULL,
    [mbl_hm_model]              VARCHAR (20)   NULL,
    [tax_amount]                NUMERIC (8, 2) NULL,
    [lien_release_date]         DATETIME       NULL,
    [lien_release_pacs_user_id] INT            NULL,
    [lien_release_run_id]       INT            NULL,
    CONSTRAINT [CPK_mh_lien] PRIMARY KEY CLUSTERED ([lien_id] ASC, [prop_id] ASC, [tax_yr] ASC, [entity_id] ASC, [mbl_hm_hud_num] ASC, [mbl_hm_sn] ASC) WITH (FILLFACTOR = 100)
);


GO

