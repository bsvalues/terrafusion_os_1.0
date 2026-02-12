
CREATE PROCEDURE [dbo].[LayerDeleteRemodelExemption]	
	@year			numeric(4,0),
	@sup_num		int,
	@prop_id		int
AS

DELETE FROM imprv_remodel
WHERE prop_id = @prop_id AND
		[year] = @year AND
		sup_num = @sup_num

GO

