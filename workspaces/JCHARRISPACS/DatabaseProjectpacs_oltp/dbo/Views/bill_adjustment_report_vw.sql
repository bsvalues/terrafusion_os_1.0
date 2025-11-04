create view [dbo].[bill_adjustment_report_vw]

as

select bill.prop_id, IsNull(bill.code, '') as code, bill_type, a.file_as_name, bill.year, (td.tax_district_cd + ' - ' + lb.levy_cd) as description, bill.statement_id
From levy_bill lb, tax_district td, bill, account a
where lb.bill_id = bill.bill_id
and   lb.tax_district_id = td.tax_district_id
and   bill.owner_id = a.acct_id
and   IsNull(is_active, 0) = 1

union

select bill.prop_id, IsNull(bill.code, '') as code, bill_type, a.file_as_name, bill.year, (saa.assessment_cd + ' - ' + saa.assessment_description) as description, bill.statement_id
From assessment_bill ab, special_assessment_agency saa, bill, account a
where ab.bill_id = bill.bill_id
and   ab.agency_id = saa.agency_id
and   bill.owner_id = a.acct_id
and   IsNull(is_active, 0) = 1

GO

