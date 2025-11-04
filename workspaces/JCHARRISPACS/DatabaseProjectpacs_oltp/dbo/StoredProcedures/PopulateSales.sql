



CREATE PROCEDURE PopulateSales

as

--Declare variables
declare @chg_of_owner_id	int


--Now loop through all the chg_of_owner records and create records in the sales_ratio_report table
DECLARE SALES SCROLL CURSOR
	FOR select chg_of_owner_id
	from sale

OPEN SALES
FETCH NEXT FROM SALES into @chg_of_owner_id

while (@@FETCH_STATUS = 0)
begin
	exec ImportSalesInformation @chg_of_owner_id

	FETCH NEXT FROM SALES into @chg_of_owner_id
end

CLOSE SALES
DEALLOCATE SALES

GO

