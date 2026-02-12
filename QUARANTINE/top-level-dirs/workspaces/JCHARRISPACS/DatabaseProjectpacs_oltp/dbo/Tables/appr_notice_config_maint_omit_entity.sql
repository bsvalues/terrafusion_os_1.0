CREATE TABLE [dbo].[appr_notice_config_maint_omit_entity] (
    [notice_yr] NUMERIC (4) NOT NULL,
    [entity_id] INT         NOT NULL,
    CONSTRAINT [CPK_appr_notice_config_maint_omit_entity] PRIMARY KEY CLUSTERED ([notice_yr] ASC, [entity_id] ASC)
);


GO

