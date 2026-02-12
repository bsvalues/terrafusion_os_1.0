CREATE TABLE [dbo].[remodel_application_status] (
    [code]        VARCHAR (15) NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    [complete]    BIT          NOT NULL,
    CONSTRAINT [PK_remodel_application_status] PRIMARY KEY CLUSTERED ([code] ASC)
);


GO

