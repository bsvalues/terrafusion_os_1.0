


CREATE procedure CertifyAppraisalYear

@input_yr	numeric(4)

as

exec CalculateTaxable '', 0, @input_yr
exec SetRollExemption @input_yr, 0
exec SetRollStateCode @input_yr, 0

GO

