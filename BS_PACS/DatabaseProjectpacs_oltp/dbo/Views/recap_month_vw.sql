
create view recap_month_vw

as

select 
tax_month,
tax_yr,
begin_date,
end_date,
case 	when tax_month = 1 then 'January ' 
     	when tax_month = 2 then 'February ' 
	when tax_month = 3 then 'March ' 
	when tax_month = 4 then 'April ' 
	when tax_month = 5 then 'May ' 
	when tax_month = 6 then 'June ' 
	when tax_month = 7 then 'July ' 
	when tax_month = 8 then 'August ' 
	when tax_month = 9 then 'September ' 
	when tax_month = 10 then 'October ' 
	when tax_month = 11 then 'November ' 
	when tax_month = 12 then 'December ' end
 + convert(varchar(4), tax_yr) + 
' (' + convert(varchar(20), begin_date, 101) + ' - ' + 
       convert(varchar(20), end_date, 101) + ')' as report_heading

From recap_month

GO

