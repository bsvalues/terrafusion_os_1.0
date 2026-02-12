CREATE TABLE [dbo].[wash_appraisal_notice_master_lease_info] (
    [notice_year]           NUMERIC (4)    NOT NULL,
    [notice_run_id]         INT            NOT NULL,
    [master_lease_group_id] INT            NOT NULL,
    [dba]                   VARCHAR (50)   NULL,
    [legal_desc]            VARCHAR (500)  NULL,
    [situs_address]         VARCHAR (MAX)  NULL,
    [owner_address]         VARCHAR (MAX)  NULL,
    [tax_area_number]       VARCHAR (23)   NULL,
    [postmarked]            VARCHAR (10)   NULL,
    [penalty_pct]           NUMERIC (5, 2) NULL,
    [last_appraiser]        VARCHAR (40)   NULL,
    [review_appraiser]      VARCHAR (40)   NULL,
    CONSTRAINT [CPK_wash_appraisal_notice_master_lease_info] PRIMARY KEY CLUSTERED ([notice_year] ASC, [notice_run_id] ASC, [master_lease_group_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The owner address of this master lease', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'owner_address';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Review appraiser of the highest valued property', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'review_appraiser';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The rendition penalty of the highest valued property in the master lease group', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'penalty_pct';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Appraisal notice run ID', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'notice_run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The rendition post date of the highest valued property in the master lease group', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'postmarked';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Appraisal notice year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'notice_year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The DBA of this master lease', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'dba';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The ID of a master lease in this appraisal notice run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'master_lease_group_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The situs address of this master lease', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'situs_address';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The last appraiser of the highest valued property in the master lease group', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'last_appraiser';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The legal description of this master lease', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'legal_desc';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The tax area number of the highest valued property in the master lease group', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info', @level2type = N'COLUMN', @level2name = N'tax_area_number';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Master lease information for master lease appraisal notice runs', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wash_appraisal_notice_master_lease_info';


GO

