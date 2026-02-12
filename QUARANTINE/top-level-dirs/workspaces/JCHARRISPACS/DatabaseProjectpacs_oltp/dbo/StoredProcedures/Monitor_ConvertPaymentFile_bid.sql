





























  







  



CREATE procedure [dbo].[Monitor_ConvertPaymentFile_bid]























  







 @info_file varchar(255),







 @year		int























as  







  







 SET NOCOUNT ON















SET ANSI_WARNINGS OFF







 







 /*















 --drop table monitor_convert_bid_payment_file











 

CREATE TABLE [dbo].[monitor_convert_bid_payment_file]

(

	[record_type] [varchar](4) NOT NULL,

	[vendor] [varchar](4) NOT NULL,

	[geo_id] [varchar](50) NOT NULL,

	[amount_paid] [nvarchar](17) NOT NULL,

	[unknown] [varchar](1) NULL,

	[receipt] [varchar](9) NULL

) ON [PRIMARY]



GO



SET ANSI_PADDING ON

GO





























 */















delete  







 monitor_convert_bid_payment_file  



















 



  



declare @szFormatFile varchar(255)  



select  



 @szFormatFile = '\\Chpacs\oltp\pacs_oltp\ReportPath\bid_format_file.txt'  



from  



 pacs_system with (nolock)  



  



  



declare @szSQL varchar(2048)  



set @szSQL = 'bulk insert monitor_convert_bid_payment_file '  



set @szSQL = @szSQL + 'from ''' + @info_file + ''' '  



set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''', firstrow = 1)'  



  



exec (@szSQL)  



  











  







begin







if exists (select * from monitor_convert_bid_payment_file t



			where record_type = 'D' 



			and not exists (select * from property where geo_id = t.geo_id))



	begin 



		select geo_id as nonexistent_geo_id



		from monitor_convert_bid_payment_file t



			where record_type = 'D'



			and not exists (select * from property where geo_id = t.geo_id)



	end











else 







	begin



	



		select  '          ' + t.geo_id + '          ' + right(space(10) + cast(min(b.statement_id) as varchar), 10) + cast(b.display_year as varchar(4)) +







				'          ' + '                         ' + '        ' + right(space(12) + replace(t.amount_paid, '.', ''), 12) + 







				' ' + 'R' +  '                                    ' + right(space(30) + a.file_as_name, 30)





		from monitor_convert_bid_payment_file t







		join property p with(nolock)







			on p.geo_id = t.geo_id 



		join account a with(nolock)

		



			on a.acct_id = p.col_owner_id







		join bill b with(Nolock)







			on b.prop_id = p.prop_id







			and b.display_year = (select MAX(display_year) from bill with(nolock) where prop_id = p.prop_id)





		join assessment_bill ab with(nolock)

			on ab.bill_id = b.bill_id

			and ab.agency_id = 521







		where t.record_type = 'D'







		group by t.geo_id, b.display_year, t.amount_paid, a.file_as_name







	end







end

GO

