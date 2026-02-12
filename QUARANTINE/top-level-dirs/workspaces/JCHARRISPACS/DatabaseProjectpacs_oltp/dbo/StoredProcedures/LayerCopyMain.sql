
create procedure LayerCopyMain
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int

as

set nocount on


	if (@lPropID_From <> @lPropID_To)
	begin
		exec dbo.LayerCopyTableProperty @lPropID_From, @lPropID_To
	end


	-- Comment from CreatePropertySupplementLayer
	/*
		we needed to do this check because we could actually get to this section and have a record in property_val.  When the user merges
		properties the following logic takes place:

		PID1 & PID2 are merged into temp property PID3
		PID2 is deleted
		Temp Property PID3 is then copied into PID2
		PID3 is Deleted

		the problem is the delete for PID2 did not fully complete because PID2 had sale records (imprv with sale_id <> 0) tied to it, thus
		the deleted process deleted everything but property_val because property_val had to stay intact to support the sale records. 
		This scenario then caused the copy from PID3 to PID2 to fail because the procedure thought PID2 already existed because the
		property_val record was still there. 

		To get around this, we will simply check for existsence on the property_val copy instead of the whole process 

		pv row existence is checked in LayerCopyTablePropertyVal
		03/28/2005 by Jcoco
	*/
	declare @szMethod varchar(23)
	set @szMethod = case when @lYear_To = 0 then 'CFYPL' else 'SUPPLEMENT' end
	exec dbo.LayerCopyTablePropertyVal
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		@szMethod


	--There are triggers that other tables use that reference this table, so it needs to be generated early.
	exec dbo.LayerSetPropSuppAssoc @lYear_To, @lPropID_To, @lSupNum_To, 'ADD'

	exec dbo.LayerCopyPropertyCurrentUse
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To

	exec dbo.LayerCopyTableEntityPropAssoc
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To


	exec dbo.LayerCopyTableOwner
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To


	exec dbo.LayerCopyTablePropertyDestroyed
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To


	exec dbo.LayerCopyTablePropertyTaxArea
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To


	exec dbo.LayerCopyTablePropertySpecialAssessment
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To


	exec dbo.LayerCopyPropertyAssoc
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To

	
	exec dbo.LayerCopyTablePropCharacteristicAssoc
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To

exec dbo.LayerCopyRemodelExemption
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To

exec dbo.LayerCopyTablePPReview
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To

	if ( @lPropID_To = @lPropID_From and @lYear_To <> @lYear_From )
	begin
		exec dbo.LayerCopyTableAgentAssoc @lYear_From, @lPropID_From, @lYear_To, @lPropID_To, null
	end

	exec dbo.LayerCopyProration
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To

	exec dbo.LayerCopyTIF
		-- From
		@lYear_From,
		@lSupNum_From,
		@lPropID_From,
		-- To
		@lYear_To,
		@lSupNum_To,
		@lPropID_To

	return(0)

GO

