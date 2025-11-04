CREATE TABLE [dbo].[remodel_exemption_submitted_by] (
    [code]        VARCHAR (15) NOT NULL,
    [description] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_remodel_exemption_submitted_by] PRIMARY KEY CLUSTERED ([code] ASC)
);


GO

