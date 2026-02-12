using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Activities;
using SimpleWorkflow.Activities.ETL;
using SimpleWorkflow.Activities.XML;
using SimpleWorkflow.Activities.Database;
using SimpleWorkflow.Activities.FileProcessing;
using SimpleWorkflow.Activities.Common;
using SimpleWorkflow.Engine;
using SimpleWorkflow.Monitoring;

namespace SimpleWorkflow.Examples
{
    public class ETLWorkflowExample
    {
        public static async Task RunExample()
        {
            // Setup logging and monitoring
            var loggerFactory = LoggerFactory.Create(builder =>
            {
                builder.AddConsole();
            });

            var metrics = new WorkflowMetrics();
            var engine = new WorkflowEngine(loggerFactory.CreateLogger<WorkflowEngine>());

            // Create ETL workflow
            var task = await engine.StartNewWorkflowAsync(
                "Customer Data ETL",
                "Extract customer data from XML, transform, and load to database"
            );

            // 1. Validate source XML file with retry logic
            var xmlValidation = new XMLValidationActivity
            {
                Name = "Validate Source XML",
                XmlFilePath = "data/sample/customers.xml",
                XsdSchemaPath = "data/sample/customers.xsd",
                SaveValidationErrors = true,
                MaxRetries = 3,
                RetryDelay = TimeSpan.FromSeconds(2),
                ExponentialBackoff = true
            };
            
            metrics.RecordActivityStart(xmlValidation);
            task.Activities.Add(xmlValidation);

            // 2. Extract data from XML to DataTable with advanced error handling
            var xmlExtract = new XMLToDataTableActivity
            {
                Name = "Extract XML Data",
                XmlFilePath = "data/sample/customers.xml",
                RowElementPath = "//Customer",
                ColumnMappings = new Dictionary<string, string>
                {
                    { "CustomerID", "CustomerID" },
                    { "FirstName", "FirstName" },
                    { "LastName", "LastName" },
                    { "Email", "EmailAddress" },
                    { "JoinDate", "RegistrationDate" },
                    { "Status", "AccountStatus" }
                },
                OutputVariableName = "RawCustomerData"
            };
            
            metrics.RecordActivityStart(xmlExtract);
            task.Activities.Add(xmlExtract);

            // 3. Advanced data transformations
            var transform = new AdvancedTransformActivity
            {
                Name = "Transform Customer Data",
                InputVariableName = "RawCustomerData",
                OutputVariableName = "TransformedCustomerData",
                Transformations = new List<IDataTransformation>
                {
                    // Clean up names
                    new RegexReplaceTransformation
                    {
                        ColumnName = "FirstName",
                        Pattern = @"\s+",
                        Replacement = " "
                    },
                    new CaseTransformation
                    {
                        ColumnName = "FirstName",
                        CaseType = CaseType.Title
                    },
                    new CaseTransformation
                    {
                        ColumnName = "LastName",
                        CaseType = CaseType.Upper
                    },
                    
                    // Add full name column
                    new CalculatedColumnTransformation
                    {
                        NewColumnName = "FullName",
                        DataType = typeof(string),
                        CalculationExpression = row => 
                            $"{row["FirstName"]} {row["LastName"]}"
                    },
                    
                    // Map status values
                    new LookupTransformation
                    {
                        SourceColumn = "AccountStatus",
                        TargetColumn = "StatusCode",
                        LookupValues = new Dictionary<string, string>
                        {
                            { "Active", "A" },
                            { "Inactive", "I" },
                            { "Suspended", "S" }
                        },
                        DefaultValue = "U"
                    }
                }
            };
            
            metrics.RecordActivityStart(transform);
            task.Activities.Add(transform);

            // 4. Data validation with detailed error reporting
            var dataValidation = new DataValidationActivity
            {
                Name = "Validate Customer Data",
                InputVariableName = "TransformedCustomerData",
                StopOnFirstError = false,
                ErrorLogVariableName = "CustomerDataErrors"
            };

            dataValidation.ValidationRules.Add("CustomerID", value => 
                value != null && Regex.IsMatch(value.ToString(), @"^C\d{3}$"));
            dataValidation.ValidationRules.Add("EmailAddress", value => 
                value != null && Regex.IsMatch(value.ToString(), @"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$"));
            dataValidation.ValidationRules.Add("RegistrationDate", value => 
                DateTime.TryParse(value?.ToString(), out _));

            metrics.RecordActivityStart(dataValidation);
            task.Activities.Add(dataValidation);

            // 5. Database operations with retry logic
            var dbOperation = new DatabaseQueryActivity
            {
                Name = "Create Database Schema",
                ConnectionString = "Server=.;Database=CustomerDB;Trusted_Connection=True;",
                Query = @"
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
                    CREATE TABLE Customers (
                        CustomerID nvarchar(50) PRIMARY KEY,
                        FirstName nvarchar(100),
                        LastName nvarchar(100),
                        FullName nvarchar(200),
                        EmailAddress nvarchar(255),
                        RegistrationDate date,
                        StatusCode char(1),
                        ImportDate datetime DEFAULT GETDATE()
                    )",
                MaxRetries = 3,
                RetryDelay = TimeSpan.FromSeconds(5)
            };
            
            metrics.RecordActivityStart(dbOperation);
            task.Activities.Add(dbOperation);

            // Execute the workflow
            var result = await engine.ExecuteTaskAsync(task.Id);

            // Generate and display workflow report
            var report = metrics.GenerateReport();
            Console.WriteLine($"\nWorkflow Report:");
            Console.WriteLine($"Total Duration: {report.TotalDuration}");
            Console.WriteLine($"Successful Activities: {report.SuccessfulActivities}");
            Console.WriteLine($"Failed Activities: {report.FailedActivities}");
            Console.WriteLine("\nActivity Durations:");
            foreach (var duration in report.AverageDurationByType)
            {
                Console.WriteLine($"{duration.Key}: {duration.Value}");
            }

            Console.WriteLine("\nErrors:");
            foreach (var activity in report.Activities.Where(a => a.Errors.Any()))
            {
                Console.WriteLine($"\n{activity.ActivityName}:");
                foreach (var error in activity.Errors)
                {
                    Console.WriteLine($"- {error.ErrorMessage}");
                }
            }
        }
    }
}
