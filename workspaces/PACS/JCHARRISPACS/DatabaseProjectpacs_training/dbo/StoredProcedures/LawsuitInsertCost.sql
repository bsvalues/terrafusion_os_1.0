

create procedure LawsuitInsertCost
	@lawsuit_id int,
	@cost_cd char(5) = null,
	@cost_amt numeric(14,2) = null

as

set nocount on

	declare @cost_id int

	insert lawsuit_cost (
		lawsuit_id, cost_cd, cost_amt
	) values (
		@lawsuit_id, @cost_cd, @cost_amt
	)
	set @cost_id = @@identity

set nocount off

	select cost_id = @cost_id

GO

