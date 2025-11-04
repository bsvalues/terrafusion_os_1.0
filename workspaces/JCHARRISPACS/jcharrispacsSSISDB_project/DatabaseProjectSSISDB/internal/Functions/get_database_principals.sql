
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
    BY CERTIFICATE [MS_SQLISSigningCertificate] WITH SIGNATURE = 0x01000502040000009F401BD7EFC856DE5E392C89F226FD6ABCAF5F96DE6E309001995875A9FC8995DEB4BAC1235BAFEF3E286AC836919615911C010B5684BE47D15163A0DAD580301E15322A6B9040572C9F0ED1FCD7DE24B954B880AD0E417881CEF80ABDC29AEDB4D78E8EC1A33F9A34B5BF8B95898028CD321D16C8E2ECD35E329A6B54F1B6790306736C1FC758564DCE09BC64C756E393959CFB0C39DD15D605E8B03F7474B33ED9D6ABCAC6EA242E27942F251489A24050C572B2FF4F6A456B3A442E827C76F4C4A3997C6F62D0FB78BC134DD79BB9125F10161974192AC84EF118D9F4F68858506A0E84420755C555004CCF22258441EF05D0F9B3B80257D027C9F511D57D;


GO

GRANT SELECT
    ON OBJECT::[internal].[get_database_principals] TO PUBLIC
    AS [dbo];


GO

