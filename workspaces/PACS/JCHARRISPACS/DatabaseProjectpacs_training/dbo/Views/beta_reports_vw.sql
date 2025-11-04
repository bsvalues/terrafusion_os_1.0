

create view beta_reports_vw
as
select * from report where location like '%BETA%'

GO

