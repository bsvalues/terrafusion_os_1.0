

CREATE PROCEDURE [dbo].[GetNextPacsDataEntryTemplateID] 
	-- Add the parameters for the stored procedure here
	@template_id int = 0 
	
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

DECLARE @next_id int

SELECT @next_id = 
MAX(next_id)
FROM pacs_data_entry_template_unique_app_id
WITH (nolock)
WHERE	template_id = @template_id

IF @next_id is NULL
SET @next_id = 1
ELSE
set @next_id = @next_id + 1

select @next_id as 'next_id', @template_id as 'template_id'

INSERT INTO pacs_data_entry_template_unique_app_id
VALUES
(
@next_id,
@template_id
)

DELETE FROM pacs_data_entry_template_unique_app_id
WHERE template_id = @template_id
AND next_id = @next_id - 1

END

GO

