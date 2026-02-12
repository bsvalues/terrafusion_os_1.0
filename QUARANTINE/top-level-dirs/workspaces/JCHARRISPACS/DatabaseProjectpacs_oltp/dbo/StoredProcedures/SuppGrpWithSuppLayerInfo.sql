
CREATE PROCEDURE SuppGrpWithSuppLayerInfo

@input_group_id int

AS 

	SELECT DISTINCT prot.sup_tax_yr, s.sup_group_id FROM 
		(SELECT * FROM sup_gr_prop_arb_protest_vw
		 WHERE sup_group_id = @input_group_id)
		 as prot 
		INNER JOIN supplement AS s 
		INNER JOIN sup_group AS sg 
		ON s.sup_group_id = sg.sup_group_id 
		ON prot.sup_tax_yr <> s.sup_tax_yr
		WHERE sg.status_cd='C' 
		AND NOT EXISTS
		(
		  SELECT * FROM supplement su
		  INNER JOIN sup_group sgu
		  ON su.sup_group_id = sgu.sup_group_id
		  WHERE sgu.status_cd='C' 
		  AND su.sup_group_id = sg.sup_group_id
		  AND su.sup_tax_yr = prot.sup_tax_yr
		)

GO

