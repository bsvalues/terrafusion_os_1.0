



CREATE PROCEDURE MassCreatePropertiesAutoBuildGeo

	@abs_subdv_cd	varchar(10),
	@block			varchar(50),
	@lot			varchar(50),
	@geo_format_id	int,
	@strGeo			varchar(50) OUTPUT

AS

--Revision History
--1.0 Created
--1.1 EricZ 01/28/2003; Collin CAD reported the GEO ID wasn't built right, found an older version and this is now corrected

declare @geo_format		varchar(100)
declare @strFormat		varchar(100)
declare @strSection		varchar(20)
declare @strItem		varchar(50)
declare @strStartPos	varchar(5)
declare @strEndPos		varchar(5)
declare @strSeparator	varchar(5)
declare @bDone			bit


set @strItem = ''
set @bDone = 0


SELECT @geo_format = geo_format_string
FROM geo_format
WHERE geo_format_id = @geo_format_id

set @strFormat = @geo_format
set @strSection = LEFT(@strFormat, CHARINDEX('|', @strFormat) -1)
set @strFormat = SUBSTRING(@strFormat, CHARINDEX('|', @strFormat) + 1, LEN(@strFormat))

set @strGeo = ''

set @block = right('000' + @block, 3)
set @lot = right('000' + @lot, 3)

IF LEFT(@strSection, 2) <> 'AS' AND LEFT(@strSection, 3) <> 'BLK' AND LEFT(@strSection, 3) <> 'LOT'
BEGIN
	set @strGeo = @strSection

	set @strSection = LEFT(@strFormat, CHARINDEX('|', @strFormat) -1)
	set @strFormat = SUBSTRING(@strFormat, CHARINDEX('|', @strFormat) + 1, LEN(@strFormat))
END

WHILE @bDone = 0
BEGIN

	IF LEFT(@strSection, 2) = 'AS' OR LEFT(@strSection, 3) = 'BLK' OR LEFT(@strSection, 3) = 'LOT'
	BEGIN
		set @strItem = SUBSTRING(@strSection, 1, CHARINDEX('(', @strSection) - 1)
	
		IF @strItem = 'AS'
		BEGIN
			set @strItem = @abs_subdv_cd
		END
		ELSE IF @strItem = 'BLK'
		BEGIN
			set @strItem = @block
		END
		ELSE IF @strItem = 'LOT'
		BEGIN
			set @strItem = @lot
		END
	
		IF CHARINDEX(',', @strSection) > CHARINDEX('(', @strSection) + 1
		BEGIN
			set @strStartPos = SUBSTRING(@strSection, CHARINDEX('(', @strSection) + 1, CHARINDEX(',', @strSection) - CHARINDEX('(', @strSection) - 1)
		END
		ELSE
		BEGIN
			set @strStartPos = 1
		END
	
		IF CHARINDEX(')', @strSection) > CHARINDEX(',', @strSection) + 1
		BEGIN
			set @strEndPos = SUBSTRING(@strSection, CHARINDEX(',', @strSection) + 1, CHARINDEX(')', @strSection) - CHARINDEX(',', @strSection) - 1)
			set @strEndPos = CAST(@strEndPos AS int) - CAST(@strStartPos AS int) + 1
		END
		ELSE
		BEGIN
			set @strEndPos = LEN(@strItem)
		END
	
		set @strItem = SUBSTRING(@strItem, CAST(@strStartPos AS int), CAST(@strEndPos AS int))
		set @strSeparator = RIGHT(@strSection, LEN(@strSection) - CHARINDEX(')', @strSection))
	
		set @strGeo = @strGeo + @strItem + @strSeparator
	END

	IF CHARINDEX('|', @strFormat) > 0
	BEGIN
		set @strSection = LEFT(@strFormat, CHARINDEX('|', @strFormat) -1)
		set @strFormat = SUBSTRING(@strFormat, CHARINDEX('|', @strFormat) + 1, LEN(@strFormat))
	END
	/* --1.1
	ELSE IF LEN(@strFormat) > 0
	BEGIN
		set @strSection = @strFormat
		set @strFormat = ''
	END
	*/
	ELSE
	BEGIN
		set @bDone = 1
	END
END

set @strSection = @strFormat

IF LEN(@strSection) > 0
BEGIN
	set @strGeo = @strGeo + @strSection
END

GO

