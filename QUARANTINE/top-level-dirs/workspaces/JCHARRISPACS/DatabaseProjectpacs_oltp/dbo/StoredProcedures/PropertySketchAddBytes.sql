
CREATE PROCEDURE PropertySketchAddBytes
	@prop_id INT,
	@prop_val_yr NUMERIC(4,0),
	@sup_num INT,
	@binData VARBINARY(MAX),
	@startIndex BIGINT,
	@dataLength BIGINT
AS

SET NOCOUNT ON

UPDATE property_sketch
SET sketch.WRITE(@binData, @startIndex, @dataLength)
WHERE prop_id = @prop_id
	AND prop_val_yr = @prop_val_yr
	AND sup_num = @sup_num

GO

