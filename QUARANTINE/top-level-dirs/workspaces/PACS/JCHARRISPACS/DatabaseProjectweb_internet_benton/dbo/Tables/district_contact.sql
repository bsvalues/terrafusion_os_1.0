CREATE TABLE [dbo].[district_contact] (
    [district_contact_id]          INT          NOT NULL,
    [district_contact_description] VARCHAR (50) NULL,
    CONSTRAINT [CPK_district_contact] PRIMARY KEY CLUSTERED ([district_contact_id] ASC) WITH (FILLFACTOR = 100)
);


GO

