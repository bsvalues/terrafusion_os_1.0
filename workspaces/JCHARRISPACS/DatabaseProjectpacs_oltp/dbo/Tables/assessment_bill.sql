CREATE TABLE [dbo].[assessment_bill] (
    [year]      NUMERIC (4) NOT NULL,
    [agency_id] INT         NOT NULL,
    [bill_id]   INT         NOT NULL,
    CONSTRAINT [CPK_assessment_bill] PRIMARY KEY CLUSTERED ([bill_id] ASC),
    CONSTRAINT [CFK_assessment_bill_bill_id] FOREIGN KEY ([bill_id]) REFERENCES [dbo].[bill] ([bill_id]),
    CONSTRAINT [CFK_assessment_bill_year_agency_id] FOREIGN KEY ([year], [agency_id]) REFERENCES [dbo].[special_assessment] ([year], [agency_id])
);


GO

