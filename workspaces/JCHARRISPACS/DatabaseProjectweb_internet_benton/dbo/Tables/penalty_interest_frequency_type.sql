CREATE TABLE [dbo].[penalty_interest_frequency_type] (
    [penalty_interest_frequency_type_cd]   VARCHAR (5)  NOT NULL,
    [penalty_interest_frequency_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_penalty_interest_frequency_type] PRIMARY KEY CLUSTERED ([penalty_interest_frequency_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

