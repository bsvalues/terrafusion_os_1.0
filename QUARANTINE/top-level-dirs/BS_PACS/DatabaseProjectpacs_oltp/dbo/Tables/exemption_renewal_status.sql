CREATE TABLE [dbo].[exemption_renewal_status] (
    [code]        VARCHAR (10) NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    [completed]   BIT          DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_exemption_renewal_status] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 90)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption Renewal Status completed flag', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'exemption_renewal_status', @level2type = N'COLUMN', @level2name = N'completed';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption Rewnewal Status code table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'exemption_renewal_status';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption Renewal Status code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'exemption_renewal_status', @level2type = N'COLUMN', @level2name = N'code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption Renewal Status code description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'exemption_renewal_status', @level2type = N'COLUMN', @level2name = N'description';


GO

