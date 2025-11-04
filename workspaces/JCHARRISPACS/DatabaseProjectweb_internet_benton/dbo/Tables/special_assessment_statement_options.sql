CREATE TABLE [dbo].[special_assessment_statement_options] (
    [year]                     NUMERIC (4) NOT NULL,
    [agency_id]                INT         NOT NULL,
    [combine_assessment_fee]   BIT         NOT NULL,
    [eligible_for_half_pay]    BIT         NOT NULL,
    [eligible_for_partial_pay] BIT         NOT NULL,
    [full_pay_only]            BIT         NOT NULL,
    CONSTRAINT [PK_special_assessment_statement_options] PRIMARY KEY CLUSTERED ([year] ASC, [agency_id] ASC)
);


GO

