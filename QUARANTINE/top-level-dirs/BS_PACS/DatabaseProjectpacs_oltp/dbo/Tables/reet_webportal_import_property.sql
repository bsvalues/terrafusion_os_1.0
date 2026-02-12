CREATE TABLE [dbo].[reet_webportal_import_property] (
    [webportal_id]      VARCHAR (10)  NOT NULL,
    [prop_id]           VARCHAR (50)  NOT NULL,
    [land_use_cd]       VARCHAR (10)  NOT NULL,
    [location_cd]       VARCHAR (4)   NOT NULL,
    [parcel_segregated] BIT           NOT NULL,
    [error]             VARCHAR (255) NULL,
    CONSTRAINT [CPK_reet_webportal_import_property] PRIMARY KEY CLUSTERED ([webportal_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_reet_webportal_import_property_webportal_id] FOREIGN KEY ([webportal_id]) REFERENCES [dbo].[reet_webportal_import] ([webportal_id])
);


GO

GRANT INSERT
    ON OBJECT::[dbo].[reet_webportal_import_property] TO PUBLIC
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[reet_webportal_import_property] TO [simplifile]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[reet_webportal_import_property] TO [simplifile]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[reet_webportal_import_property] TO PUBLIC
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[reet_webportal_import_property] TO PUBLIC
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[reet_webportal_import_property] TO [simplifile]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[reet_webportal_import_property] TO PUBLIC
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[reet_webportal_import_property] TO [simplifile]
    AS [dbo];


GO

