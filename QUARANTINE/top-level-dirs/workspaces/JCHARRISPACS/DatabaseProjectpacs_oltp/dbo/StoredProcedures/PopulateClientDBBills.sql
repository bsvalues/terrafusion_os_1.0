



CREATE PROCEDURE PopulateClientDBBills
@input_prop_id      		int,
@input_effective_date        	varchar(10),
@input_year			int = 0

AS

--EricZ
--07/17/2003
--PopulateClientDBBills
--For use with ClientDB ASP 

SET NOCOUNT ON

declare @str_penalty_mno     	varchar(100)
declare @str_penalty_ins     	varchar(100)
declare @str_interest_ins    	varchar(100)
declare @str_interest_mno    	varchar(100)
declare @str_attorney_fee    	varchar(100)
declare @str_total		varchar(100)
declare @str_base_tax		varchar(100)
declare @penalty_mno      	numeric(14,2)
declare @penalty_ins      	numeric(14,2)
declare @interest_mno      	numeric(14,2)
declare @interest_ins      	numeric(14,2)
declare @attorney_fee        	numeric(14,2)
declare @total			numeric(14,2)
declare @base_tax		numeric(14,2)
declare @base_tax_pd		numeric(14,2)
declare @base_tax_due		numeric(14,2)
declare @bill_id    		int
declare @prev_sup_tax_yr	numeric(4,0)
declare @sup_tax_yr		numeric(4,0)
declare @entity_cd		varchar(15)
declare @entity_file_as_name	varchar(70)
declare @owner_id		int
declare @prev_owner_id		int
declare @owner_name		varchar(70)
declare @prev_owner_name	varchar(70)
declare @taxable_val		numeric(14,0)
declare @num_owners		int
declare @num_years		int

set @num_owners = 0
set @num_years  = 0

--Check to see if _web_property_general object exists
--If it doesn't, create a _web_property_general view so GetPenaltyInterest doesn't fail with ClientDB calls
if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_web_property_general]'))
	and not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[_clientdb_property]'))
begin
	exec('
	create view _web_property_general
	as
	select psa.prop_id,
		psa.owner_tax_yr,
		pt.prop_type_desc
	from prop_supp_assoc psa with (nolock),
		property p with (nolock),
		property_type pt with (nolock)
	where psa.prop_id = p.prop_id
		and p.prop_type_cd = pt.prop_type_cd
	')
end

--Build the temp table
CREATE TABLE #CLIENTDB_BILLS
(
	owner_id int NULL,
	owner_name varchar(70) NULL,
	owner_tax_yr numeric(4, 0) NULL,
	entity_cd varchar(85) NULL,
	entity_file_as_name varchar(70) NULL,
	taxable_val numeric(14,2) NULL,
	base_tax numeric(14,2) NULL,
	base_tax_pd numeric(14, 2) NULL,
	base_tax_due numeric(14, 2) NULL,
	discount_penalty_interest numeric(14,2) NULL,
	atty_fees numeric(14, 2) NULL,
	total_tax_due numeric(14, 2) NULL
)

--Construct loop of bills to process
if (@input_year > 0)
begin
	DECLARE PROPERTY_BILL CURSOR FAST_FORWARD
	FOR select bill.bill_id, bill.sup_tax_yr, entity.entity_cd, entity_account.file_as_name, bill.owner_id, account.file_as_name, bill.bill_taxable_val
      	    from   bill with (nolock), entity with (nolock), account with (nolock), account as entity_account with (nolock)
	    where  bill.prop_id = @input_prop_id
	    and    bill.sup_tax_yr = @input_year
    	    and   (bill.active_bill = 'T' or bill.active_bill is null)
	    and    bill.coll_status_cd <> 'RS'
	    and    bill.entity_id = entity.entity_id
	    and    bill.owner_id = account.acct_id
	    and    bill.entity_id = entity_account.acct_id
	ORDER BY bill.owner_id, bill.sup_tax_yr desc
end
else
begin
	DECLARE PROPERTY_BILL CURSOR FAST_FORWARD
	FOR select bill.bill_id, bill.sup_tax_yr, entity.entity_cd, entity_account.file_as_name, bill.owner_id, account.file_as_name, bill.bill_taxable_val
      	    from   bill with (nolock), entity with (nolock), account with (nolock), account as entity_account with (nolock)
	    where  bill.prop_id = @input_prop_id
    	    and   (bill.active_bill = 'T' or bill.active_bill is null)
	    and    bill.coll_status_cd <> 'RS'
	    and    bill.entity_id = entity.entity_id
	    and    bill.owner_id = account.acct_id
	    and    bill.entity_id = entity_account.acct_id
	ORDER BY bill.owner_id, bill.sup_tax_yr desc
end

OPEN PROPERTY_BILL
FETCH NEXT FROM PROPERTY_BILL into @bill_id, @sup_tax_yr, @entity_cd, @entity_file_as_name, @owner_id, @owner_name, @taxable_val

WHILE (@@FETCH_STATUS = 0)
BEGIN
	SET @prev_owner_id   = @owner_id
	SET @prev_owner_name = @owner_name
	SET @prev_sup_tax_yr = @sup_tax_yr
	
	exec GetBillTaxDue @bill_id, 0, 'W', @input_effective_date, @str_base_tax OUTPUT,
       		@str_penalty_mno OUTPUT,  @str_penalty_ins OUTPUT,
              	@str_interest_mno OUTPUT, @str_interest_ins OUTPUT,
       		@str_attorney_fee OUTPUT, @str_total OUTPUT
 
	select @penalty_mno  = convert(numeric(14,2), @str_penalty_mno)
 	select @penalty_ins  = convert(numeric(14,2), @str_penalty_ins)
 	select @interest_ins = convert(numeric(14,2), @str_interest_mno)
 	select @interest_mno = convert(numeric(14,2), @str_interest_ins)
    select @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
	select @base_tax_due = convert(numeric(14,2), @str_base_tax)
	select @total        = convert(numeric(14,2), @str_total)

	select @base_tax_pd = (isnull(bill_m_n_o_pd, 0) + isnull(bill_i_n_s_pd, 0)),
			@base_tax   = (isnull(bill_adj_m_n_o, 0) + isnull(bill_adj_i_n_s, 0))
	from bill with (nolock)
	where bill_id = @bill_id

	--Insert tax due information for each bill
	INSERT INTO #CLIENTDB_BILLS
	(
		owner_id,
		owner_name,
		owner_tax_yr,
		entity_cd,
		entity_file_as_name,
		taxable_val,
		base_tax,
		base_tax_pd,
		base_tax_due,
		discount_penalty_interest,
		atty_fees,
		total_tax_due
	)
	VALUES
	(
		@owner_id,
		@owner_name,
		@sup_tax_yr,
		@entity_cd,
		@entity_file_as_name,
		@taxable_val,
		@base_tax,
		@base_tax_pd,
		@base_tax_due,
		(@penalty_mno + @penalty_ins + @interest_mno + @interest_ins),
		@attorney_fee,
		@total		
	)
 
	FETCH NEXT FROM PROPERTY_BILL into @bill_id, @sup_tax_yr, @entity_cd, @entity_file_as_name, @owner_id, @owner_name, @taxable_val

	--Since the bills are sorted by year, when the year changes from the previous year or the loop is finished,
	--write out a summary record for the year
	IF ((@prev_sup_tax_yr <> @sup_tax_yr) OR (@@FETCH_STATUS <> 0))
	BEGIN
		INSERT INTO #CLIENTDB_BILLS
		(
			owner_id,
			owner_name,
			owner_tax_yr,
			entity_cd,
			base_tax,
			base_tax_pd,
			base_tax_due,
			discount_penalty_interest,
			atty_fees,
			total_tax_due
		)
		SELECT
			@prev_owner_id,
			@prev_owner_name,
			@prev_sup_tax_yr,
			char(255) + convert(varchar(4), owner_tax_yr) + ' TOTAL:',
			sum(base_tax),
			sum(base_tax_pd),
			sum(base_tax_due),
			sum(discount_penalty_interest),
			sum(atty_fees),
			sum(total_tax_due)
		FROM #CLIENTDB_BILLS
		WHERE owner_tax_yr = @prev_sup_tax_yr
		AND entity_cd not like char(255) + '%'
		GROUP BY owner_id, owner_name, owner_tax_yr
	END
END

CLOSE PROPERTY_BILL
DEALLOCATE PROPERTY_BILL

SELECT @num_owners = COUNT(DISTINCT owner_id)
	FROM #CLIENTDB_BILLS

IF (@num_owners = 1)
BEGIN
	SELECT @num_years = COUNT(DISTINCT owner_tax_yr)
		FROM #CLIENTDB_BILLS
		WHERE entity_cd not like char(255) + '%'
		AND total_tax_due > 0

	IF (@num_years > 1)
	BEGIN
		--Write out a summary record for the owner (excluding the year summary records)
		--ONLY IF there are more than 1 distinct year owed; i.e. if an owner only has 2002 taxes due,
		--don't print out a grand total record in addition to the '2002 total' line item, kinda redundant
		INSERT INTO #CLIENTDB_BILLS
		(
			owner_id,
			owner_name,
			owner_tax_yr,
			entity_cd,
			base_tax,
			base_tax_pd,
			base_tax_due,
			discount_penalty_interest,
			atty_fees,
			total_tax_due
		)
		SELECT
			owner_id,
			NULL,
			0,
			char(255) + 'GRAND TOTAL:',
			sum(base_tax),
			sum(base_tax_pd),
			sum(base_tax_due),
			sum(discount_penalty_interest),
			sum(atty_fees),
			sum(total_tax_due)
		FROM #CLIENTDB_BILLS
		WHERE entity_cd not like char(255) + '%'
		GROUP BY owner_id, owner_name
	END
END
ELSE IF (@num_owners > 1)
BEGIN
	--Write out a summary record for each owner for all their respective bills (excluding the year summary records)
	INSERT INTO #CLIENTDB_BILLS
	(
		owner_id,
		owner_name,
		owner_tax_yr,
		entity_cd,
		base_tax,
		base_tax_pd,
		base_tax_due,
		discount_penalty_interest,
		atty_fees,
		total_tax_due
	)
	SELECT
		owner_id,
		NULL,
		0,
		char(255) + rtrim(owner_name) + ' TOTAL:',
		sum(base_tax),
		sum(base_tax_pd),
		sum(base_tax_due),
		sum(discount_penalty_interest),
		sum(atty_fees),
		sum(total_tax_due)
	FROM #CLIENTDB_BILLS
	WHERE entity_cd not like char(255) + '%'
	GROUP BY owner_id, owner_name

	--Write out a summary record for all the owners (excluding the year summary records)
	INSERT INTO #CLIENTDB_BILLS
	(
		owner_id,
		owner_name,
		owner_tax_yr,
		entity_cd,
		base_tax,
		base_tax_pd,
		base_tax_due,
		discount_penalty_interest,
		atty_fees,
		total_tax_due
	)
	SELECT
		2147483647, --largest value for an int field, this ensures the 'Grand Total' line is absolutely last
		NULL,
		0,
		char(255) + 'GRAND TOTAL (ALL OWNERS):',
		sum(base_tax),
		sum(base_tax_pd),
		sum(base_tax_due),
		sum(discount_penalty_interest),
		sum(atty_fees),
		sum(total_tax_due)
	FROM #CLIENTDB_BILLS
	WHERE entity_cd not like char(255) + '%'
END

--Output the results so the ASP page recordset can read it in, write it out, etc.
SELECT
	#CLIENTDB_BILLS.owner_id,
	#CLIENTDB_BILLS.owner_name,
	case when (#CLIENTDB_BILLS.entity_cd like char(255) + '%') then 0 else owner_tax_yr end as bill_year,
	case when (#CLIENTDB_BILLS.entity_cd like char(255) + '%') then replace(#CLIENTDB_BILLS.entity_cd, char(255), '') else rtrim(#CLIENTDB_BILLS.entity_file_as_name) end as entity,
	#CLIENTDB_BILLS.taxable_val,
	#CLIENTDB_BILLS.base_tax,
	#CLIENTDB_BILLS.base_tax_pd,
	#CLIENTDB_BILLS.base_tax_due,
	#CLIENTDB_BILLS.discount_penalty_interest,
	#CLIENTDB_BILLS.atty_fees,
	#CLIENTDB_BILLS.total_tax_due
FROM #CLIENTDB_BILLS
--WHERE #CLIENTDB_BILLS.total_tax_due > 0
ORDER BY #CLIENTDB_BILLS.owner_id,
	#CLIENTDB_BILLS.owner_tax_yr DESC,
	#CLIENTDB_BILLS.entity_cd ASC

DROP TABLE #CLIENTDB_BILLS

GO

