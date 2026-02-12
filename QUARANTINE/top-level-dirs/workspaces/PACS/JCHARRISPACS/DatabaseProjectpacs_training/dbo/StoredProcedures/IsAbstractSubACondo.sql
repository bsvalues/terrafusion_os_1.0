
-----------------------------------------------------------------------------
-- Procedure: IsAbstractSubACondo
--
-- Purpose: Determine if the abstract or subdivision is a condo
-----------------------------------------------------------------------------
CREATE PROCEDURE IsAbstractSubACondo
(
	@in_abs_subdv_cd	char(10),
	@out_flag		int	output
)
AS
SET NOCOUNT ON
declare @var_abs_subdv_ind	char

	select @var_abs_subdv_ind=abs_subdv_ind from abs_subdv where abs_subdv_cd=@in_abs_subdv_cd
	if @var_abs_subdv_ind = 'C'
		select @out_flag = 1
	else
		select @out_flag = 0

GO

