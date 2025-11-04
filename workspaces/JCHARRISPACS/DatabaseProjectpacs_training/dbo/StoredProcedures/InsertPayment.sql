

CREATE PROCEDURE InsertPayment

@input_sql		varchar(2058)

as

set nocount on

exec (@input_sql)

select 1 as DumbID,
          payment_id = @@IDENTITY

GO

