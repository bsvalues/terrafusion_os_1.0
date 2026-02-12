

CREATE PROCEDURE OpenARBPropertySupplement_ShiftToSupplementLayer

@from_sup_group_id int,
@to_sup_group_id int

AS 
	
	if object_id ('tempdb..#tempTOSuppGrpWithSuppLayer') is not null
	begin
	 	drop table #tempTOSuppGrpWithSuppLayer
	end
	
	-- Load Temp Table with sup num / year for the TO Supplement group
	
	SELECT DISTINCT s.sup_num, s.sup_tax_yr
	INTO #tempTOSuppGrpWithSuppLayer 
	FROM supplement as s WITH (NOLOCK)
	INNER JOIN sup_group sg WITH (NOLOCK)
	ON s.sup_group_id = sg.sup_group_id
	WHERE sg.status_cd='C' AND
	s.sup_group_id = @to_sup_group_id						
	
	DECLARE @prop_id int
        DECLARE @old_sup_num int
	DECLARE @new_sup_num int
	DECLARE @sup_tax_yr int
	
	-- Open Cursor
	DECLARE SHIFT_PROP_W_PROTEST CURSOR FAST_FORWARD
	
	FOR SELECT prop_id, sup_num, sup_tax_yr 
	FROM sup_gr_prop_arb_protest_vw WITH (NOLOCK)
	WHERE sup_group_id = @from_sup_group_id
		
	OPEN SHIFT_PROP_W_PROTEST
	FETCH NEXT FROM SHIFT_PROP_W_PROTEST INTO @prop_id, @old_sup_num, @sup_tax_yr

	-- This procedure will store each moved property in a temp table
	-- for the callee to display them as results
	--if object_id ('tempdb..#tempPROPSSHIFTED') is not null
	--begin
	-- 	drop table #tempPROPSSHIFTED
	--end	

	--CREATE TABLE #tempPROPSSHIFTED(prop_id int)

	WHILE @@FETCH_STATUS = 0
	BEGIN
	    SELECT @new_sup_num=sup_num FROM #tempTOSuppGrpWithSuppLayer
	    WHERE sup_tax_yr = @sup_tax_yr	
	
	    -- Shift this Property
	    EXEC dbo.PropertySupplement_MoveToSupplementLayer	@prop_id, @old_sup_num,
								@sup_tax_yr, @new_sup_num	    	
	    -- Insert moved property in temp table
	    if object_id ('tempdb..#tempPROPSSHIFTED') is not null
	      INSERT INTO #tempPROPSSHIFTED (prop_id) VALUES (@prop_id)
		   	
	    FETCH NEXT FROM SHIFT_PROP_W_PROTEST INTO @prop_id, @old_sup_num, @sup_tax_yr
	END

	CLOSE SHIFT_PROP_W_PROTEST
	DEALLOCATE SHIFT_PROP_W_PROTEST

GO

