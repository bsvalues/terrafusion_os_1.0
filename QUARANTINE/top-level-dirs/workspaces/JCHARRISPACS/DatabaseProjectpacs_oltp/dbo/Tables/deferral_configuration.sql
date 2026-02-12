CREATE TABLE [dbo].[deferral_configuration] (
    [year]                     NUMERIC (4)     NOT NULL,
    [deferral_type]            VARCHAR (25)    NOT NULL,
    [county_id]                VARCHAR (6)     NOT NULL,
    [first_date]               DATETIME        NOT NULL,
    [minimum_age]              INT             DEFAULT ((-1)) NOT NULL,
    [maximum_income]           NUMERIC (14, 2) DEFAULT ((0.0)) NOT NULL,
    [selected_approval_letter] VARCHAR (250)   NULL,
    [selected_denial_letter]   VARCHAR (250)   NULL,
    CONSTRAINT [CPK_deferral_configuration] PRIMARY KEY CLUSTERED ([year] ASC, [deferral_type] ASC)
);


GO

