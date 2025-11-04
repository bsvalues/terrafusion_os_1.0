CREATE ROLE [ssis_cluster_executor]
    AUTHORIZATION [dbo];


GO

ALTER ROLE [ssis_cluster_executor] ADD MEMBER [CO\qlue];


GO

