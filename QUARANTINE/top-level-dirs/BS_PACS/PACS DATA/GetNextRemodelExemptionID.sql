CREATE PROCEDURE [dbo].[GetNextRemodelExemptionID] 
	-- Add the parameters for the stored procedure here
	@prop_id int = 0, 
	@year numeric(4,0) = 1900,
	@imprv_or_imprv_detail_id varchar(50) = 0,
	--@imprv_or_imprv_det bit = 0,
	@current_assessment_yr  int = 1900
AS
BEGIN
	-- SET NOCOUNT ON added to prevent extra result sets from
	-- interfering with SELECT statements.
	SET NOCOUNT ON;

DECLARE @next_id int

SELECT @next_id = 
MAX(next_id)
FROM remodel_exemption_unique_app_id
WITH (nolock)
WHERE	[year] = @year

IF @next_id is NULL
SET @next_id = 1
ELSE
set @next_id = @next_id + 1

select @next_id as 'next_id', @current_assessment_yr as 'current_assessment_yr'

INSERT INTO remodel_exemption_unique_app_id
VALUES
(
@prop_id,
@year,
@next_id,
@current_assessment_yr
)

DELETE FROM remodel_exemption_unique_app_id
WHERE [year] = @year 
AND next_id = @next_id - 1

END

GO

