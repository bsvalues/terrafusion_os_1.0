


CREATE PROCEDURE PopulateSalesReport
AS

declare @chg_of_owner_id	int

--Now loop through all the chg_of_owner records and create records in the sales_ratio_report table
DECLARE SALE SCROLL CURSOR
	FOR select chg_of_owner_id
	from sale
OPEN SALE
FETCH NEXT FROM SALE into @chg_of_owner_id

while (@@FETCH_STATUS = 0)
begin
	exec ImportSalesInformation @chg_of_owner_id

	FETCH NEXT FROM SALE into @chg_of_owner_id
end

CLOSE SALE
DEALLOCATE SALE

GO

