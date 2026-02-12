CREATE TABLE [dbo].[Type] (
    [TypeId]           INT            IDENTITY (1, 1) NOT NULL,
    [TypeFullName]     NVARCHAR (128) NOT NULL,
    [AssemblyFullName] NVARCHAR (256) NOT NULL,
    [IsInstanceType]   BIT            NOT NULL,
    CONSTRAINT [CPK_Type] PRIMARY KEY CLUSTERED ([TypeId] ASC)
);


GO

CREATE UNIQUE NONCLUSTERED INDEX [idx_TypeFullName_AssemblyFullName]
    ON [dbo].[Type]([TypeFullName] ASC, [AssemblyFullName] ASC) WITH (IGNORE_DUP_KEY = ON);


GO

