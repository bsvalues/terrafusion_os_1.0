

create procedure PPSuppGroupCalculateRenditionPenalty
   @input_sup_group int
AS

declare @sup_tax_yr	numeric(4)
declare @prop_id	int
declare @owner_id	int
declare @tax_year	numeric(4)
declare @sup_num	int

SELECT @tax_year = tax_yr FROM pacs_system


DECLARE SUPP_GROUP_RENDITION_PENALTY_VW CURSOR FAST_FORWARD FOR 
	SELECT 
		pp_rendition_prop_penalty_changes_vw.prop_id, 
		pp_rendition_prop_penalty_changes_vw.owner_id,
		supplement_vw.sup_tax_yr,
	   	supplement_vw.sup_num 
    FROM   
		supplement_vw WITH (NOLOCK)
	INNER JOIN 
		pp_rendition_prop_penalty_changes_vw WITH (NOLOCK)
	ON
			pp_rendition_prop_penalty_changes_vw.rendition_year = supplement_vw.sup_tax_yr
		AND pp_rendition_prop_penalty_changes_vw.sup_num = supplement_vw.sup_num
    WHERE  
		supplement_vw.sup_group_id = @input_sup_group

OPEN SUPP_GROUP_RENDITION_PENALTY_VW
FETCH NEXT FROM SUPP_GROUP_RENDITION_PENALTY_VW INTO @prop_id, @owner_id, @sup_tax_yr, @sup_num

WHILE (@@FETCH_STATUS = 0)
BEGIN
	IF (@sup_tax_yr <= @tax_year)
	BEGIN
		EXEC PPCalculateRenditionPenalty @prop_id, @owner_id, @sup_tax_yr, @sup_num
	END

 	FETCH NEXT FROM SUPP_GROUP_RENDITION_PENALTY_VW INTO @prop_id, @owner_id, @sup_tax_yr, @sup_num
END

CLOSE SUPP_GROUP_RENDITION_PENALTY_VW
DEALLOCATE SUPP_GROUP_RENDITION_PENALTY_VW

GO

