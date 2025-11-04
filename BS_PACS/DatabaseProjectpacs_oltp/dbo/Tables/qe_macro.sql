CREATE TABLE [dbo].[qe_macro] (
    [user_id]     INT          NOT NULL,
    [macro_id]    INT          IDENTITY (1, 1) NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_qe_macro] PRIMARY KEY CLUSTERED ([user_id] ASC, [macro_id] ASC) WITH (FILLFACTOR = 90)
);


GO

