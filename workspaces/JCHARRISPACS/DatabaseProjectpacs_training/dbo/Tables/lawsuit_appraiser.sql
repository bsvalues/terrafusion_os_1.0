CREATE TABLE [dbo].[lawsuit_appraiser] (
    [lawsuit_id]   INT NOT NULL,
    [appraiser_id] INT NOT NULL,
    PRIMARY KEY CLUSTERED ([lawsuit_id] ASC, [appraiser_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Table that associates lawsuits with appraisers', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'lawsuit_appraiser';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The appraiser ID from the appraiser table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'lawsuit_appraiser', @level2type = N'COLUMN', @level2name = N'appraiser_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The lawsuit ID from the lawsuit table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'lawsuit_appraiser', @level2type = N'COLUMN', @level2name = N'lawsuit_id';


GO

