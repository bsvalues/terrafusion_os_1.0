CREATE TABLE [dbo].[tax_district_election_information] (
    [tax_district_id]         INT              NOT NULL,
    [election_information_id] INT              NOT NULL,
    [year]                    NUMERIC (4)      NOT NULL,
    [description]             VARCHAR (40)     NULL,
    [voted_amount]            NUMERIC (14)     NULL,
    [voted_rate]              NUMERIC (13, 10) NULL,
    [election_date]           DATETIME         NOT NULL,
    [term]                    NUMERIC (3)      NULL,
    [end_year]                NUMERIC (4)      NULL,
    [pass]                    BIT              CONSTRAINT [CDF_tax_district_election_information_pass] DEFAULT ((0)) NOT NULL,
    [factor]                  NUMERIC (13, 9)  NULL,
    [is_senior_exempt]        BIT              CONSTRAINT [CDF_tax_district_election_information_is_senior_exempt] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [PK_tax_district_election_information] PRIMARY KEY CLUSTERED ([election_information_id] ASC),
    CONSTRAINT [FK_tax_district_election_information_tax_district] FOREIGN KEY ([tax_district_id]) REFERENCES [dbo].[tax_district] ([tax_district_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'levy factor', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_district_election_information', @level2type = N'COLUMN', @level2name = N'factor';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Tracks Election Information for a Tax District (generally to be copied to a Levy)', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_district_election_information';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Are senior properties exempt from this voted levy increase?', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'tax_district_election_information', @level2type = N'COLUMN', @level2name = N'is_senior_exempt';


GO

