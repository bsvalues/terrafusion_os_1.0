CREATE TABLE [dbo].[appr_card_type] (
    [appr_card_type] VARCHAR (15) NOT NULL,
    [appr_card_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_appr_card_type] PRIMARY KEY CLUSTERED ([appr_card_type] ASC) WITH (FILLFACTOR = 90)
);


GO

