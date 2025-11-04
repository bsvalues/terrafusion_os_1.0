CREATE TABLE [dbo].[exemption_applicant_income_code] (
    [code]        VARCHAR (10) NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_exemption_applicant_income_code] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 90)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption Applicant Income code table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'exemption_applicant_income_code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption Applicant Income code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'exemption_applicant_income_code', @level2type = N'COLUMN', @level2name = N'code';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Exemption Applicant Income code description', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'exemption_applicant_income_code', @level2type = N'COLUMN', @level2name = N'description';


GO

