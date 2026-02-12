CREATE TABLE [dbo].[meta_regionalization] (
    [regionalization_id] INT            IDENTITY (1, 1) NOT NULL,
    [default_text]       NVARCHAR (510) NOT NULL,
    [regionalized_text]  NVARCHAR (510) NOT NULL,
    [system]             BIT            NOT NULL,
    CONSTRAINT [CPK_meta_regionalization] PRIMARY KEY CLUSTERED ([regionalization_id] ASC, [default_text] ASC)
);


GO

