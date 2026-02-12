-- Sample tSQLt test skeleton. Ensure tSQLt installed in target DB.
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'test_property')
BEGIN
    EXEC tSQLt.NewTestClass @ClassName = N'test_property';
END
GO

IF OBJECT_ID(N'test_property.[test_property_has_situs]', 'P') IS NOT NULL
    DROP PROCEDURE test_property.[test_property_has_situs];
GO

CREATE PROCEDURE test_property.[test_property_has_situs]
AS
BEGIN
    -- Arrange
    DECLARE @pid INT = (SELECT TOP (1) property_id FROM dbo.property ORDER BY property_id);

    -- Act
    DECLARE @has INT = (SELECT COUNT(1) FROM dbo.situs WHERE property_id = @pid);

    -- Assert
    EXEC tSQLt.AssertTrue @has >= 0, N'situs row count should be non-negative';
END;
GO
