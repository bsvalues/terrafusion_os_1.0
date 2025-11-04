CREATE TABLE [dbo].[penalty_interest_property_type_imprv_det_type_cd] (
    [penalty_interest_property_type_cd] VARCHAR (10) NOT NULL,
    [imprv_det_type_cd]                 CHAR (10)    NOT NULL,
    CONSTRAINT [CPK_penalty_interest_property_type_imprv_det_type_cd] PRIMARY KEY CLUSTERED ([penalty_interest_property_type_cd] ASC, [imprv_det_type_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [FK_penalty_interest_property_type_IMPRVDET_codes] FOREIGN KEY ([penalty_interest_property_type_cd]) REFERENCES [dbo].[penalty_interest_property_type] ([penalty_interest_property_type_cd]) ON DELETE CASCADE
);


GO

