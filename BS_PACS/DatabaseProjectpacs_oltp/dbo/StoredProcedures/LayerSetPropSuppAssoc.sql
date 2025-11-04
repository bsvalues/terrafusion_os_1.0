
create procedure LayerSetPropSuppAssoc
	@lYear numeric(4,0),
	@lPropID int,

	@lSupNum int,

	@szMethod varchar(3),
	/*
	Meaning:
		ADD		Setting psa with CreatePropertySupplementLayer semantics
		DEL		Setting psa with DeletePropertySupplementLayer semantics
	*/

	@bNoLongerExistsInYear bit = 0 output
as

set nocount on

	set @bNoLongerExistsInYear = 0
	
	if ( @lSupNum < 0)
	begin
		return(0)
	end

	if ( @szMethod = 'ADD' )
	begin
		update dbo.prop_supp_assoc with(rowlock)
		set sup_num = @lSupNum
		where
			owner_tax_yr = @lYear and
			prop_id = @lPropID

		if ( @@rowcount = 0 )
		begin
			insert dbo.prop_supp_assoc with(rowlock) (owner_tax_yr, prop_id, sup_num)
			values (@lYear, @lPropID, @lSupNum)
		end
	end
	else if ( @szMethod = 'DEL' )
	begin
		declare @lNewSupNum int

		select @lNewSupNum = max(sup_num)
		from dbo.property_val with(nolock)
		where prop_id = @lPropID and
		prop_val_yr = @lYear

		if (@lNewSupNum is not null)
		begin
			update dbo.prop_supp_assoc with(rowlock)
			set sup_num = @lNewSupNum
 			where owner_tax_yr = @lYear
			and prop_id = @lPropID
		end
		else
		begin
			delete dbo.prop_supp_assoc with(rowlock)
			where owner_tax_yr = @lYear
			and prop_id = @lPropID

			set @bNoLongerExistsInYear = 1
		end
	end

	return(0)

GO

