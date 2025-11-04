
CREATE PROCEDURE SimpleCopySingleRow
	@table VARCHAR(128), -- the name of the table with the row to copy
	@primaryKey VARCHAR(128), -- the name of the column that contains the primary key on @table
	@sourceId INT, -- the ID (contained in the @primaryKey column) to copy,
	@destinationId INT, -- the ID to assign to the destination row,
	@customCriteria VARCHAR(MAX), -- extra criteria for the final WHERE clause (for example: 'value1 > value2 AND value3 < value4')
	@result INT OUTPUT -- the ID of the destination row

AS

SET NOCOUNT ON

-- create a temporary table to hold column names
DECLARE @columnNames TABLE
(
	id INT PRIMARY KEY IDENTITY,
	[name] VARCHAR(128)
)

-- create a temporary table to hold the result of a query that discovers the next ID to use
DECLARE @destinationIdTable TABLE
(
	id INT
)

-- declare variables
DECLARE @max BIGINT, -- number of iterations that should be performed
	@count BIGINT, -- the current iteration (starting at 0)
	@currentColumn VARCHAR(128), -- the name of the column being addressed in the current interation
	@query VARCHAR(MAX) -- space reserved for query text

-- if the user passed in 0, we get to determine the destination ID dynamically
IF @destinationId = 0
BEGIN
	-- dynamically generate a query to grab the next key for @table
	SET @query = 'SELECT MAX(' + @primaryKey + ') + 1' + CHAR(10) +
		'FROM ' + @table

	-- record the result of that dynamic query
	INSERT @destinationIdTable
	EXEC(@query)

	-- hold on to that value
	SET @destinationId =
	(
		SELECT *
		FROM @destinationIdTable
	)
END

-- collect all the column names from @table (except for the primary key column)
INSERT @columnNames
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = @table
	AND COLUMN_NAME <> @primaryKey
ORDER BY ORDINAL_POSITION

-- prepare for the loop
SET @query = ''
SET @count = 0
SET @max =
(
	SELECT COUNT(*)
	FROM @columnNames
)

-- perform the loop, which just adds all the columns together into a string
WHILE @count < @max
BEGIN
	SET @count = @count + 1

	SET @currentColumn =
	(
		SELECT [name]
		FROM @columnNames
		WHERE id = @count
	)

	SET @query = @query + ',' + CHAR(10) +
		'	[' + @currentColumn + ']'
END

-- put the copy query together
SET @query = 'INSERT ' + @table + CHAR(10) +
	'(' + CHAR(10) +
	'	' + @primaryKey +
	@query + CHAR(10) +
	')' + CHAR(10) +
	'SELECT ' + CONVERT(VARCHAR(128), @destinationId) +
	@query + CHAR(10) +
	'FROM ' + @table + CHAR(10) +
	'WHERE ' + @primaryKey + ' = ' + CONVERT(VARCHAR(128), @sourceId)

-- add custom criteria, if there are any
IF @customCriteria IS NOT NULL
	AND @customCriteria <> ''
	SET @query = @query + CHAR(10) +
		'	AND ' + @customCriteria

-- execute the query
EXEC(@query)

-- set the result
SET @result = @destinationId

SET NOCOUNT OFF

GO

