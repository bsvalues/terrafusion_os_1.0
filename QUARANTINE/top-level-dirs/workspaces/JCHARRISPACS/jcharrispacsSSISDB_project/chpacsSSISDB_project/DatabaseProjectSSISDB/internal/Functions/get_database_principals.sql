
CREATE FUNCTION [internal].[get_database_principals]()
RETURNS @ret TABLE
(
    [name] sysname NOT NULL,
    [principal_id] int NOT NULL,
    [type] char(1) NOT NULL,
    [type_desc] nvarchar(60) NULL,
    [default_schema_name] sysname NULL,
    [create_date] datetime NOT NULL,
    [modify_date] datetime NOT NULL,
    [owning_principal_id] int NULL,
    [sid] varbinary(85) NULL,
    [is_fixed_role] bit NOT NULL
)
AS
BEGIN
    INSERT INTO @ret
    SELECT
        [name],
        [principal_id],
        [type],
        [type_desc],
        [default_schema_name],
        [create_date],
        [modify_date],
        [owning_principal_id],
        [sid],
        [is_fixed_role]
     FROM [sys].[database_principals]
     RETURN
END

GO

ADD SIGNATURE TO OBJECT::[internal].[get_database_principals]
    BY CERTIFICATE [MS_SQLISSigningCertificate] WITH SIGNATURE = 0xEFF4B46E720F11211CF29E1396C136A727D18E032243AFF91C0433464EEEF978DE96C11DE46440E7E560C87F0AE620A27AE1478187C3A6C1586506F59E1A3F43028280EC579CF9EB09B18BED366064E092194F13F0C5C93B221E9AFFBD9C063264BB9C80560C7B6CF6931B9F50FA913BD47D5302CBC1D1BC44D63757C152CB89;


GO

GRANT SELECT
    ON OBJECT::[internal].[get_database_principals] TO PUBLIC
    AS [dbo];


GO

