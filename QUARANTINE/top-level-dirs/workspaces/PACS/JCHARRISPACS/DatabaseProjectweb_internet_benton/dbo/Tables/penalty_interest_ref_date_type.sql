CREATE TABLE [dbo].[penalty_interest_ref_date_type] (
    [penalty_interest_ref_date_type_cd]   VARCHAR (5)  NOT NULL,
    [penalty_interest_ref_date_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_penalty_interest_ref_date_type] PRIMARY KEY CLUSTERED ([penalty_interest_ref_date_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO

