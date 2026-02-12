CREATE TABLE [dbo].[fin_account_configuration] (
    [use_segment]     BIT          NOT NULL,
    [character_count] INT          NOT NULL,
    [description]     VARCHAR (25) NOT NULL,
    [segment_id]      INT          NOT NULL,
    CONSTRAINT [CPK_fin_account_configuration] PRIMARY KEY CLUSTERED ([segment_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'segment id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_account_configuration', @level2type = N'COLUMN', @level2name = N'segment_id';


GO

