


















CREATE procedure [dbo].[Monitor_ConvertPaymentFile_vanco_new]















@info_file varchar(255),







 @year		int















as  























 SET NOCOUNT ON















SET ANSI_WARNINGS OFF







































 /*







 --drop table monitor_convert_payment_file_new















 create table monitor_convert_payment_file_new







 (







 client_id					varchar(18),







 client_name				varchar(47),







 account_number				varchar(66),







 amount_paid				varchar(14),







 process_date				varchar(12),







 settlement_date			varchar(12),







 group_id					varchar(18),







 group_desc					varchar(257),







 transaction_id				varchar(13),







 customer_first_name		varchar(52),







 customer_middle_initial	varchar(3),







 customer_last_name			varchar(52),







 customer_address1			varchar(37),







 customer_address2			varchar(37),







 customer_city				varchar(32),







 customer_state				varchar(4),







 customer_zip				varchar(12)







 )







 















 */















delete monitor_convert_payment_file_new































declare @szFormatFile varchar(2048)  







select  







 @szFormatFile = '\\jcharrispacs\oltp\pacs_oltp\ReportPath\vanco_format_file_new.txt'  







--from  







-- pacs_system with (nolock)  























declare @szSQL varchar(255)  







set @szSQL = 'bulk insert monitor_convert_payment_file_new '  







set @szSQL = @szSQL + 'from ''' + @info_file + ''' '  







set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''', firstrow = 1)'  











  



 exec (@szSQL)  











update monitor_convert_payment_file_new



set client_id = REPLACE(client_id, '"', ''), client_name = REPLACE(client_name, '"', ''), 

	

	amount_paid = REPLACE(amount_paid, '"', ''),



	account_number = REPLACE(account_number, '"', ''), process_date = REPLACE(process_date, '"', ''),



	settlement_date = REPLACE(settlement_date, '"', ''), group_id = REPLACE(group_id, '"', ''),



	group_desc = REPLACE(group_desc, '"', ''), transaction_id = REPLACE(transaction_id, '"', ''),



	customer_first_name = REPLACE(customer_first_name, '"', ''), customer_middle_initial = REPLACE(customer_middle_initial, '"', ''),



	customer_last_name = REPLACE(customer_last_name, '"', ''), customer_address1 = REPLACE(customer_address1, '"', ''),



	customer_address2 = REPLACE(customer_address2, '"', ''), customer_city  = REPLACE(customer_city, '"', ''),



	customer_state = REPLACE(customer_state, '"', ''), customer_zip = REPLACE(customer_zip, '"', '')







	







	



begin







if exists (select * from monitor_convert_payment_file_new t



			where not exists (select * from property where geo_id = t.account_number))



	begin 



		select account_number as nonexistent_geo_id



		from monitor_convert_payment_file_new t



			where not exists (select * from property where geo_id = t.account_number)



	end











else 







	begin







			select  '          ' + t.account_number + '          ' + right(space(10) + cast(min(b.statement_id) as varchar), 10) 







			+ cast(b.display_year as varchar(4)) +







					'          ' + '                         ' + '        ' + right(space(12) + replace(t.amount_paid, '.', ''), 12) + 







					' ' + 'R' +  right(t.transaction_id + SPACE(10), 10) + left(t.process_date + space(20), 20) + 







					left(t.settlement_date + space(20), 20) + left('VANCO' + space(30), 30)







						as record







			from monitor_convert_payment_file_new t







			left join property p with(nolock)







				on p.geo_id = t.account_number 







			left join bill b with(Nolock)







				on b.prop_id = p.prop_id







			and b.display_year = (select MAX(display_year) from bill with(nolock) where prop_id = p.prop_id and is_active = 1) 







			group by t.account_number, b.display_year, t.transaction_id, t.process_date, t.settlement_date,






				t.amount_paid, (t.customer_first_name + ' ' + t.customer_last_name)







	end







end

GO

