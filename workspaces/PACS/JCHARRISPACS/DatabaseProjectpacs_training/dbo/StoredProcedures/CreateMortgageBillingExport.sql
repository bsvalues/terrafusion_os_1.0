


CREATE PROCEDURE CreateMortgageBillingExport

@input_year			numeric(4,0),
@input_effective_dt		varchar(50),
@input_table_name 		varchar(255),
@input_mortgage_co_id 	int,
@input_taxserver_id 		int

AS

set nocount on

--Stored procedure variables
declare @drop_table_name 	varchar(255)
declare @drop_table 		varchar(255)
declare @create_table 	varchar(512)
declare @create_pk 		varchar(512)
declare @insert_sql		varchar(512)

declare @output_current_tax_due		numeric(18,2)
declare @output_delinquent_tax_due	numeric(18,2)
declare @output_attorney_fee_due		numeric(18,2)
declare @output_fees_due			numeric(18,2)
declare @total_due				numeric(18)
declare @prop_id				int
declare @geo_id				varchar(50)
declare @lender_num				varchar(50)
declare @loan_num				varchar(50)
declare @base_date				varchar(50)
declare @october_date			varchar(50)
declare @november_date			varchar(50)
declare @december_date			varchar(50)
declare @base_tax_due			numeric(18)
declare @october_tax_due			numeric(18)
declare @november_tax_due			numeric(18)
declare @december_tax_due			numeric(18)

--Initialize the variables
set @drop_table_name = '[dbo].[' + @input_table_name + ']'
set @drop_table = 'drop table ' + @drop_table_name
set @create_table = 'CREATE TABLE ' + @drop_table_name + ' ([prop_id] [char] (10) NOT NULL ,[geo_id] [char] (25) NULL ,	[mortgage_lender_num] [char] (10) NULL ,'
set @create_table = @create_table + '[loan_identification_num] [char] (25) NULL ,[year] [char] (4) NULL ,[base_tax] [char] (8) NULL ,[october_due] [char] (8) NULL ,'
set @create_table = @create_table + '[november_due] [char] (8) NULL ,[december_due] [char] (8) NULL ,[filler] [char] (8) NULL ) ON [PRIMARY] '
set @create_pk = 'ALTER TABLE ' + @drop_table_name + ' ADD CONSTRAINT PK_' + @input_table_name + ' PRIMARY KEY NONCLUSTERED (prop_id) ON [PRIMARY]'
set @base_date = '01/01/' + cast((@input_year + 1) as varchar(4))
set @october_date = '10/01/' + cast(@input_year as varchar(4))
set @november_date = '11/01/' + cast(@input_year as varchar(4))
set @december_date = '12/01/' + cast(@input_year as varchar(4))

--Drop the table with the @input_table_name if it exists...
if exists (select * from sysobjects where name = @input_table_name and OBJECTPROPERTY(id, N'IsUserTable') = 1)
exec(@drop_table)

--Create a table with the @input_table_name
exec(@create_table)

--Create a primary key on the table that was just created
exec(@create_pk)

--Now loop through all the properties and get the tax due...
if ((@input_mortgage_co_id > 0) and (@input_taxserver_id = 0))
begin
	DECLARE MORTGAGE_BILLING CURSOR FAST_FORWARD
	FOR SELECT DISTINCT mortgage_assoc.prop_id, 
	    property.geo_id,
	    MORTGAGE_CO_VW.lender_num, 
	    mortgage_assoc.mortgage_acct_id
	FROM mortgage_assoc INNER JOIN
	    MORTGAGE_CO_VW ON 
	    mortgage_assoc.mortgage_co_id = MORTGAGE_CO_VW.mortgage_co_id
	     INNER JOIN
	    property ON mortgage_assoc.prop_id = property.prop_id
	WHERE MORTGAGE_CO_VW.mortgage_co_id = @input_mortgage_co_id
		and property.prop_type_cd in ('R', 'MH')
	ORDER by mortgage_assoc.prop_id
end
else if ((@input_taxserver_id > 0) and (@input_mortgage_co_id = 0))
begin
	DECLARE MORTGAGE_BILLING CURSOR FAST_FORWARD
	FOR SELECT DISTINCT mortgage_assoc.prop_id, 
	    property.geo_id,
	    MORTGAGE_CO_VW.lender_num, 
	    mortgage_assoc.mortgage_acct_id
	FROM mortgage_assoc INNER JOIN
	    MORTGAGE_CO_VW ON 
	    mortgage_assoc.mortgage_co_id = MORTGAGE_CO_VW.mortgage_co_id
	     INNER JOIN
	    property ON mortgage_assoc.prop_id = property.prop_id
	WHERE MORTGAGE_CO_VW.taxserver_id = @input_taxserver_id
		and property.prop_type_cd in ('R', 'MH')
	ORDER by mortgage_assoc.prop_id
end
else if ((@input_taxserver_id = 0) and (@input_mortgage_co_id = 0))
begin
	DECLARE MORTGAGE_BILLING CURSOR FAST_FORWARD
	FOR SELECT DISTINCT property.prop_id,
		property.geo_id,
		MORTGAGE_CO_VW.lender_num,
		mortgage_assoc.mortgage_acct_id

		FROM bill INNER JOIN
		    property ON 
		    bill.prop_id = property.prop_id LEFT OUTER JOIN
		    mortgage_assoc INNER JOIN
		    MORTGAGE_CO_VW ON 
		    mortgage_assoc.mortgage_co_id = MORTGAGE_CO_VW.mortgage_co_id
		    ON property.prop_id = mortgage_assoc.prop_id
		WHERE bill.sup_tax_yr = @input_year
		and property.prop_type_cd in ('R', 'MH')
		and bill.active_bill = 'T'
		ORDER BY property.prop_id
end

OPEN MORTGAGE_BILLING
FETCH NEXT FROM MORTGAGE_BILLING into @prop_id, @geo_id, @lender_num, @loan_num

while (@@FETCH_STATUS = 0)
begin
	exec GetPropertyTaxDueOutput @prop_id, @base_date, @input_year, @output_current_tax_due output, @output_delinquent_tax_due output, @output_attorney_fee_due output, @output_fees_due output
	set @base_tax_due = ((isnull(@output_current_tax_due, 0) + isnull(@output_delinquent_tax_due, 0) + isnull(@output_attorney_fee_due, 0) + isnull(@output_fees_due, 0)) * 100)

	exec GetPropertyTaxDueOutput @prop_id, @october_date, @input_year, @output_current_tax_due output, @output_delinquent_tax_due output, @output_attorney_fee_due output, @output_fees_due output
	set @october_tax_due = ((isnull(@output_current_tax_due, 0) + isnull(@output_delinquent_tax_due, 0) + isnull(@output_attorney_fee_due, 0) + isnull(@output_fees_due, 0)) * 100)

	exec GetPropertyTaxDueOutput @prop_id, @november_date, @input_year, @output_current_tax_due output, @output_delinquent_tax_due output, @output_attorney_fee_due output, @output_fees_due output
	set @november_tax_due = ((isnull(@output_current_tax_due, 0) + isnull(@output_delinquent_tax_due, 0) + isnull(@output_attorney_fee_due, 0) + isnull(@output_fees_due, 0)) * 100)

	exec GetPropertyTaxDueOutput @prop_id, @december_date, @input_year, @output_current_tax_due output, @output_delinquent_tax_due output, @output_attorney_fee_due output, @output_fees_due output
	set @december_tax_due = ((isnull(@output_current_tax_due, 0) + isnull(@output_delinquent_tax_due, 0) + isnull(@output_attorney_fee_due, 0) + isnull(@output_fees_due, 0)) * 100)

	if ((@base_tax_due < 100000000) and (@base_tax_due > 0))
	begin
		--Format the insert statement
		set @insert_sql = 'insert into ' + @drop_table_name + ' values (' + 
			'''' + cast(@prop_id as char(10)) + ''',' +
			'''' + isnull(cast(@geo_id as char(25)), space(25)) + ''',' +
			'''' + isnull(cast(@lender_num as char(10)), space(10)) + ''',' +
			'''' + isnull(cast(@loan_num as char(25)), space(25)) + ''',' +
			'''' + isnull(cast(@input_year as char(4)), space(4)) + ''',' +
			'''' + right('00000000' + isnull(cast(@base_tax_due as varchar(8)), space(8)), 8) + ''',' +
			'''' + right('00000000' + isnull(cast(@october_tax_due as varchar(8)), space(8)), 8) + ''',' +
			'''' + right('00000000' + isnull(cast(@november_tax_due as varchar(8)), space(8)), 8) + ''',' +
			'''' + right('00000000' + isnull(cast(@december_tax_due as varchar(8)), space(8)), 8) + ''',' +
			'''' + space(8) + '''' + ')'

		--Insert the record
		exec(@insert_sql)
	end

	--Now get the next record
	FETCH NEXT FROM MORTGAGE_BILLING into @prop_id, @geo_id, @lender_num, @loan_num
end

CLOSE MORTGAGE_BILLING
DEALLOCATE MORTGAGE_BILLING

GO

