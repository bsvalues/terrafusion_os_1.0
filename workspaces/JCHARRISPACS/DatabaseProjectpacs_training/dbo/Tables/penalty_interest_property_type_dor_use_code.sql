CREATE TABLE [dbo].[penalty_interest_property_type_dor_use_code] (
    [penalty_interest_property_type_cd] VARCHAR (10) NOT NULL,
    [sub_cd]                            VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_penalty_interest_property_type_dor_use_code] PRIMARY KEY CLUSTERED ([penalty_interest_property_type_cd] ASC, [sub_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [FK_penalty_interest_property_type_DOR_codes] FOREIGN KEY ([penalty_interest_property_type_cd]) REFERENCES [dbo].[penalty_interest_property_type] ([penalty_interest_property_type_cd]) ON DELETE CASCADE
);


GO

