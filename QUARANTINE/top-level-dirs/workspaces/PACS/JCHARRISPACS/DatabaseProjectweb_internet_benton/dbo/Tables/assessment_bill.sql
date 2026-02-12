CREATE TABLE [dbo].[assessment_bill] (
    [year]      NUMERIC (4) NOT NULL,
    [agency_id] INT         NOT NULL,
    [bill_id]   INT         NOT NULL,
    CONSTRAINT [CPK_assessment_bill] PRIMARY KEY CLUSTERED ([bill_id] ASC)
);


GO

