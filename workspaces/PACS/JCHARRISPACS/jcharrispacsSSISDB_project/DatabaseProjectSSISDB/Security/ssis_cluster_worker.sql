CREATE ROLE [ssis_cluster_worker]
    AUTHORIZATION [dbo];


GO

ALTER ROLE [ssis_cluster_worker] ADD MEMBER [CO\qlue];


GO

