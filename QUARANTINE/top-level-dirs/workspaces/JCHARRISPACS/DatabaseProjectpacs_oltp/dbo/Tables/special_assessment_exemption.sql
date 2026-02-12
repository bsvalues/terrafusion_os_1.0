CREATE TABLE [dbo].[special_assessment_exemption] (
    [year]                       NUMERIC (4)     NOT NULL,
    [agency_id]                  INT             NOT NULL,
    [exmpt_type_cd]              VARCHAR (10)    NOT NULL,
    [exemption_amount_selection] CHAR (1)        NULL,
    [amount]                     NUMERIC (15, 2) NULL,
    [pct]                        NUMERIC (8, 5)  NULL,
    [has_minimum_amount]         BIT             NOT NULL,
    [minimum_amount]             NUMERIC (15, 2) NULL,
    [exempt_qualify_cd]          VARCHAR (10)    CONSTRAINT [CDF_special_assessment_exemption_exempt_qualify_cd] DEFAULT ('*') NOT NULL,
    CONSTRAINT [CPK_special_assessment_exemption] PRIMARY KEY CLUSTERED ([year] ASC, [agency_id] ASC, [exmpt_type_cd] ASC, [exempt_qualify_cd] ASC),
    CONSTRAINT [CFK_special_assessment_exemption_exmpt_type_cd] FOREIGN KEY ([exmpt_type_cd]) REFERENCES [dbo].[exmpt_type] ([exmpt_type_cd]),
    CONSTRAINT [CFK_special_assessment_exemption_year_agency_id] FOREIGN KEY ([year], [agency_id]) REFERENCES [dbo].[special_assessment] ([year], [agency_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption Qualify code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'special_assessment_exemption', @level2type = N'COLUMN', @level2name = N'exempt_qualify_cd';


GO

