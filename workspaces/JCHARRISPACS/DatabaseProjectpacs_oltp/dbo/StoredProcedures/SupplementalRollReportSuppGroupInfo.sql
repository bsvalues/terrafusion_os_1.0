


CREATE PROCEDURE SupplementalRollReportSuppGroupInfo

	@input_sup_group_id int

AS

SELECT * 
FROM sup_group 

INNER JOIN supplement
ON sup_group.sup_group_id = supplement.sup_group_id

WHERE sup_group.sup_group_id = @input_sup_group_id

ORDER BY supplement.sup_tax_yr, supplement.sup_num

GO

