
CREATE PROCEDURE CalculatePoesForAllSups
@input_tax_year 	numeric(4)

as

--Declare variable
declare @sup_num	int

if (@input_tax_year <> 0)
begin
	
	delete from property_owner_entity_state_cd where year = @input_tax_year

	DECLARE SUPP CURSOR FAST_FORWARD
		FOR select distinct sup_num from prop_supp_assoc where owner_tax_yr = @input_tax_year order by sup_num

	OPEN SUPP
	FETCH NEXT FROM SUPP into @sup_num

	while (@@FETCH_STATUS = 0)
	begin
		exec CalculatePOES '', @sup_num, @input_tax_year
		FETCH NEXT FROM SUPP into @sup_num
	end

	CLOSE SUPP
	DEALLOCATE SUPP
end

GO

