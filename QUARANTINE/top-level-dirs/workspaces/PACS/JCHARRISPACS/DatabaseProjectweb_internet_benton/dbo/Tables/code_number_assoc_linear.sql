CREATE TABLE [dbo].[code_number_assoc_linear] (
    [szType]    VARCHAR (15) NOT NULL,
    [szCode]    VARCHAR (23) NOT NULL,
    [l64Number] BIGINT       NOT NULL,
    CONSTRAINT [CPK_code_number_assoc_linear] PRIMARY KEY CLUSTERED ([szType] ASC, [szCode] ASC) WITH (FILLFACTOR = 100)
);


GO

