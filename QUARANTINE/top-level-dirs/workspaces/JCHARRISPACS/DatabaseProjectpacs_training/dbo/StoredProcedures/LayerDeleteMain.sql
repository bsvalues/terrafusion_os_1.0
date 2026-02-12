
create procedure LayerDeleteMain
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	
	@bSplitMerge bit
as

set nocount on

	exec dbo.LayerDeleteTablePPReview @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeletePropertyAssoc @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteTablePropCharacteristicAssoc @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteTablePropertySpecialAssessment @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteTablePropertyTaxArea @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteTablePropertyDestroyed @lYear, @lSupNum, @lPropID
	
	exec dbo.LayerDeleteTableEntityPropAssoc @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteTableOwner @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeletePropertyCurrentUse @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteRemodelExemption @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteTIF @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteProration @lYear, @lSupNum, @lPropID

	exec dbo.LayerDeleteTablePropertyVal @lYear, @lSupNum, @lPropID

	declare @bNoLongerExistsInYear bit
	exec dbo.LayerSetPropSuppAssoc @lYear, @lPropID, null, 'DEL', @bNoLongerExistsInYear output

	if ( @bNoLongerExistsInYear = 1 )
	begin
		exec dbo.LayerDeleteTableAgentAssoc @lYear, @lPropID, null
	end

	if ( @bSplitMerge = 0 )
	begin
		if not exists
		(
			select top 1 owner_tax_yr
			from dbo.prop_supp_assoc with(nolock)
			where prop_id = @lPropID
		)
		begin
			exec dbo.DeleteProperty @lPropID
		end
	end

GO

