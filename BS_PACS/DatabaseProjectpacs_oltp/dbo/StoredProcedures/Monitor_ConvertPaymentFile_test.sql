






  

  

CREATE procedure [dbo].[Monitor_ConvertPaymentFile_test]





  

 @info_file varchar(255),

 @year		int





as  

  

 SET NOCOUNT ON



SET ANSI_WARNINGS OFF

 

 /*



 --drop table monitor_convert_payment_file_test



 create table monitor_convert_payment_file_test

 (

  record_type	char(4),

  vendor		varchar(4),

 geo_id			varchar(15),

 amount_paid	nvarchar(17)

 )



 */



delete  

 monitor_convert_payment_file_test





  

  

declare @szFormatFile varchar(255)  

select  

 @szFormatFile = '\\jcharrispacs\oltp\pacs_oltp\ReportPath\vanco_format_file.txt'  

from  

 pacs_system with (nolock)  

  

  

declare @szSQL varchar(2048)  

set @szSQL = 'bulk insert monitor_convert_payment_file_test '  

set @szSQL = @szSQL + 'from ''' + @info_file + ''' '  

set @szSQL = @szSQL + 'with (formatfile = ''' + @szFormatFile + ''', firstrow = 1)'  

  

exec (@szSQL)  




begin

if exists (select * from monitor_convert_payment_file_test t
			where record_type = 'D' 
			and not exists (select * from property where geo_id = t.geo_id))
	begin 
		select geo_id as nonexistent_geo_id
		from monitor_convert_payment_file_test t
			where record_type = 'D'
			and not exists (select * from property where geo_id = t.geo_id)
	end


else 

	begin
			select distinct '          ' + t.geo_id + '          ' + right(space(10) + cast(min(b.statement_id) as varchar), 10) + cast(b.display_year as varchar(4)) +
					'          ' + '                         ' + '        ' + right(space(12) + replace(t.amount_paid, '.', ''), 12) + 
					' ' + 'R' +  '                                    ' + case when t.vendor = '1423' then right(space(30) + 'Fiserv', 30)
						else right(space(30) + 'Vanco', 30) end
						as record
			from monitor_convert_payment_file_test t
			left join property p with(nolock)
				on p.geo_id = t.geo_id 
			left join bill b with(Nolock)
				on b.prop_id = p.prop_id
				and b.display_year = 2022
			where t.record_type = 'D'
			group by t.geo_id, b.display_year, t.amount_paid, t.vendor
	end

end

GO

