CREATE TABLE [dbo].[special_assessment_statement_options] (
    [year]                     NUMERIC (4) NOT NULL,
    [agency_id]                INT         NOT NULL,
    [combine_assessment_fee]   BIT         NOT NULL,
    [eligible_for_half_pay]    BIT         NOT NULL,
    [eligible_for_partial_pay] BIT         CONSTRAINT [CDF_special_assessment_statement_options_eligible_for_partial_pay] DEFAULT ((0)) NOT NULL,
    [full_pay_only]            BIT         CONSTRAINT [CDF_special_assessment_statement_options_full_pay_only] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [PK_special_assessment_statement_options] PRIMARY KEY CLUSTERED ([year] ASC, [agency_id] ASC),
    CONSTRAINT [CFK_special_assessment_statement_options_year_agency_id] FOREIGN KEY ([year], [agency_id]) REFERENCES [dbo].[special_assessment] ([year], [agency_id]) ON DELETE CASCADE
);


GO

