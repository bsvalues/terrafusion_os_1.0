
create procedure LitigationGetStatementTax
	@lLitigationID int,
	@lStatementID int,
	@szEffectiveDate varchar(24)
as

set nocount on

	declare @lBillID int

	declare
		@szBaseTax varchar(100),
		@szPenaltyMNO varchar(100),
		@szPenaltyINS varchar(100),
		@szInterestMNO varchar(100),
		@szInterestINS varchar(100),
		@szAttorneyFee varchar(100),
		@szTotalTax  varchar(100)

	declare curBills cursor
	for
		select b.bill_id
		from litigation_statement_assoc as lba with(nolock)
		join bill as b with(nolock) on
			lba.statement_id = b.statement_id and lba.year = b.year
		where
			lba.litigation_id = @lLitigationID and
			b.statement_id = @lStatementID
	for read only

	open curBills
	fetch next from curBills into @lBillID

	declare
		@fBaseTax numeric(14,2),
		@fTotalTax numeric(14,2)

	set @fBaseTax = 0.00
	set @fTotalTax = 0.00
	/* For each bill in the specified statement that is under litigation */
	while ( @@fetch_status = 0 )
	begin
		exec GetBillTaxDue
			@lBillID, 0, 'F', @szEffectiveDate,
			@szBaseTax output,
			@szPenaltyMNO output,
			@szPenaltyINS output,
			@szInterestMNO output,
			@szInterestINS output,
			@szAttorneyFee output,
			@szTotalTax output

		set @fBaseTax = @fBaseTax + convert(numeric(14,2), @szBaseTax);
		set @fTotalTax = @fTotalTax + convert(numeric(14,2), @szTotalTax);

		fetch next from curBills into @lBillID
	end

	close curBills
	deallocate curBills

set nocount off

	select
		base_tax = @fBaseTax,
		total_tax = @fTotalTax

GO

