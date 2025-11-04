CREATE TABLE [dbo].[TableConfigurations] (
    [Name]                             NVARCHAR (128) NOT NULL,
    [JoinTable]                        NVARCHAR (MAX) NULL,
    [JoinSQL]                          NVARCHAR (MAX) NULL,
    [Order]                            INT            NOT NULL,
    [TotalPages]                       BIGINT         NOT NULL,
    [CurrentPage]                      BIGINT         NOT NULL,
    [TotalPagesForChangeSchema]        BIGINT         NOT NULL,
    [CurrentPageForChangeSchema]       BIGINT         NOT NULL,
    [TotalPagesForAssignGroupRefresh]  BIGINT         NOT NULL,
    [CurrentPageForAssignGroupRefresh] BIGINT         NOT NULL,
    [IsFlat]                           BIT            NOT NULL,
    [IsLookup]                         BIT            NOT NULL,
    [IsController]                     BIT            NOT NULL,
    [SubSelect]                        NVARCHAR (MAX) NULL,
    [OrderBySQL]                       NVARCHAR (MAX) NULL,
    CONSTRAINT [PK_dbo.TableConfigurations] PRIMARY KEY CLUSTERED ([Name] ASC)
);


GO

