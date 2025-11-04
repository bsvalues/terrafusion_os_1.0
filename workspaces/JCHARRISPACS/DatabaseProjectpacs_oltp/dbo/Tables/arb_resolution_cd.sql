CREATE TABLE [dbo].[arb_resolution_cd] (
    [resolution_cd]   VARCHAR (10) NOT NULL,
    [resolution_desc] VARCHAR (50) NULL,
    [generate_letter] CHAR (1)     NULL,
    [letter_type]     VARCHAR (10) NULL,
    [close_case]      CHAR (1)     NULL,
    [approved_flag]   CHAR (1)     NULL,
    CONSTRAINT [CPK_arb_resolution_cd] PRIMARY KEY NONCLUSTERED ([resolution_cd] ASC) WITH (FILLFACTOR = 90)
);


GO

