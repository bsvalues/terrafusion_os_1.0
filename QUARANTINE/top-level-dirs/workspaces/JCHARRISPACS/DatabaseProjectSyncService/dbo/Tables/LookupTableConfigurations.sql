CREATE TABLE [dbo].[LookupTableConfigurations] (
    [Name]            NVARCHAR (128) NOT NULL,
    [CodeColumnName]  NVARCHAR (MAX) NULL,
    [DescColumnName]  NVARCHAR (MAX) NULL,
    [WhereCondition]  NVARCHAR (MAX) NULL,
    [JoinCondition]   NVARCHAR (MAX) NULL,
    [OrderBySQL]      NVARCHAR (MAX) NULL,
    [IsTransferred]   BIT            NOT NULL,
    [HasNone]         BIT            NOT NULL,
    [NullCode]        NVARCHAR (MAX) NULL,
    [NullDescription] NVARCHAR (MAX) NULL,
    CONSTRAINT [PK_dbo.LookupTableConfigurations] PRIMARY KEY CLUSTERED ([Name] ASC)
);


GO

