
CREATE PROCEDURE GetPacsConfig
	@input_group	varchar(23),
	@input_name	varchar(63),
	@output_value	varchar(511) OUTPUT
AS

set nocount on

SELECT @output_value = szConfigValue FROM pacs_config
WHERE szGroup = @input_group
AND szConfigName = @input_name

GO

