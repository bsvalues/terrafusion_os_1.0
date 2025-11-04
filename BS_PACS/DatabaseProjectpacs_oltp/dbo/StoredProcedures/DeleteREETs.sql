
Create Procedure DeleteREETs
	@ReetIDList xml
As 
Begin
	Set Nocount ON;

	Declare @ReetIDs2Delete Table(
		reet_id int not null primary key clustered
	);

	insert into @ReetIDs2Delete(reet_id)
	select 
		reet_id = Cast(code as int)
	from dbo.ConvertCodeList2Table(@ReetIDList) as IDTable;
	
	if(0 = (select 
						count(*) 
					from @ReetIDs2Delete
					)
		)
		return;

	Begin Tran;

	Begin Try 
		
		--Dependency Level 2
		delete victim
		from						property_reet_exemption as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);		

		delete victim
		from						property_reet_mobile_home_imprv as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);
	
		delete victim
		from						reet_mobile_home_imprv as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);		

		--Dependency Level 1
		delete victim
		from						buyer_reet_assoc as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);		

		delete victim
		from						property_reet_assoc as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);		

		delete victim
		from						reet_event_assoc as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);		

		delete victim
		from						reet_fee_assoc as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);		

		delete victim
		from						reet_import_account as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);		

		delete victim
		from						reet_import_property as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);

		delete victim
		from						reet_tax_district_transaction as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);		

		delete victim
		from						seller_reet_assoc as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);

		--Dependency Level 0
		delete victim
		from						reet as victim
				inner join	@ReetIDs2Delete as filter on (victim.reet_id = filter.reet_id);

		Commit Tran;
	End Try
	Begin Catch
		IF (@@trancount > 0)
			Rollback tran;
		
		exec sp_RethrowError
			@Explanation = N'''DeleteREETs'' procedure failed.';
	End Catch
	
	Set Nocount OFF;
end

GO

