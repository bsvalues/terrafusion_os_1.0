CREATE TABLE [dbo].[tmp_fp] (
    [prop_val_yr]    NUMERIC (4)     NOT NULL,
    [prop_id]        INT             NOT NULL,
    [owner_id]       INT             NOT NULL,
    [is_primary]     BIT             NULL,
    [benefit_acres]  NUMERIC (18, 4) NOT NULL,
    [sumAcres]       NUMERIC (18, 4) NULL,
    [newPrimary]     BIT             NULL,
    [excludeFromSum] BIT             NULL
);


GO

