"""
Unit tests for the Data Sanitization Framework
"""
import unittest
import datetime
from unittest.mock import patch, MagicMock

from app import db, app
from sync_service.data_sanitization import (
    DataSanitizer, SanitizationRule, SanitizationLog, create_data_sanitizer
)
from sync_service.models import FieldConfiguration, TableConfiguration


class TestDataSanitization(unittest.TestCase):
    """Test suite for data sanitization framework"""
    
    def setUp(self):
        """Set up test environment"""
        self.app_context = app.app_context()
        self.app_context.push()
        
        # Create a test job ID
        self.test_job_id = "test-job-123"
        
        # Initialize sanitizer
        self.sanitizer = DataSanitizer(self.test_job_id)
        
        # Mock the database operations
        self.patcher = patch('sync_service.data_sanitization.db')
        self.mock_db = self.patcher.start()
        
        # Patch FieldConfiguration.query
        self.field_config_patcher = patch('sync_service.data_sanitization.FieldConfiguration')
        self.mock_field_config = self.field_config_patcher.start()
        
        # Mock query result for field config
        self.mock_field_config_instance = MagicMock()
        self.mock_field_config.query.filter_by.return_value.first.return_value = self.mock_field_config_instance
        self.mock_field_config_instance.data_type = 'personal_data'
        
        # Patch TableConfiguration.query
        self.table_config_patcher = patch('sync_service.data_sanitization.TableConfiguration')
        self.mock_table_config = self.table_config_patcher.start()
        
        # Mock query result for table config
        self.mock_table_config_instance = MagicMock()
        self.mock_table_config.query.filter_by.return_value.first.return_value = self.mock_table_config_instance
    
    def tearDown(self):
        """Clean up after tests"""
        self.patcher.stop()
        self.field_config_patcher.stop()
        self.table_config_patcher.stop()
        self.app_context.pop()
    
    def test_sanitizer_initialization(self):
        """Test that sanitizer initializes with default rules"""
        # Verify rules were registered
        self.assertGreater(len(self.sanitizer.rules), 0)
        self.assertGreater(len(self.sanitizer.field_type_rules), 0)
        self.assertTrue('mask_text' in self.sanitizer.rules)
        self.assertTrue('personal_data' in self.sanitizer.field_type_rules)
    
    def test_factory_function(self):
        """Test the sanitizer factory function"""
        sanitizer = create_data_sanitizer(self.test_job_id)
        self.assertIsInstance(sanitizer, DataSanitizer)
        self.assertEqual(sanitizer.job_id, self.test_job_id)
    
    def test_register_custom_rule(self):
        """Test registering a custom sanitization rule"""
        # Define a custom rule
        custom_rule = SanitizationRule(
            name="custom_rule",
            field_types=["custom_type"],
            strategy="custom",
            sanitizer_func=lambda v, c: f"CUSTOM_{v}",
            description="Custom test rule"
        )
        
        # Register the rule
        self.sanitizer.register_rule(custom_rule)
        
        # Verify it was registered
        self.assertIn("custom_rule", self.sanitizer.rules)
        self.assertIn("custom_type", self.sanitizer.field_type_rules)
        self.assertIn("custom_rule", self.sanitizer.field_type_rules["custom_type"])
    
    def test_mask_text_sanitizer(self):
        """Test the mask text sanitization function"""
        # Test with valid input
        result = self.sanitizer._mask_text_sanitizer("John Doe", {})
        self.assertEqual(result[0], "J")  # First letter
        self.assertEqual(result[-1], "e")  # Last letter
        self.assertEqual(len(result), len("John Doe"))  # Same length
        self.assertTrue(all(c == 'X' for c in result[1:-1]))  # Middle is masked
        
        # Test with short input
        self.assertEqual(self.sanitizer._mask_text_sanitizer("AB", {}), "AB")
        
        # Test with None
        self.assertIsNone(self.sanitizer._mask_text_sanitizer(None, {}))
        
        # Test with non-string
        self.assertEqual(self.sanitizer._mask_text_sanitizer(123, {}), 123)
    
    def test_hash_email_sanitizer(self):
        """Test the email hash sanitization function"""
        # Test with valid email
        result = self.sanitizer._hash_email_sanitizer("user@example.com", {})
        self.assertIn("@example.com", result)  # Domain preserved
        self.assertNotIn("user", result)  # Local part hashed
        
        # Test with non-email string
        self.assertEqual(self.sanitizer._hash_email_sanitizer("not-an-email", {}), "not-an-email")
        
        # Test with None
        self.assertIsNone(self.sanitizer._hash_email_sanitizer(None, {}))
    
    def test_credential_sanitizer(self):
        """Test the credential sanitization function"""
        # Test with string
        self.assertEqual(self.sanitizer._credential_sanitizer("secret123", {}), "**********")
        
        # Test with None
        self.assertIsNone(self.sanitizer._credential_sanitizer(None, {}))
    
    def test_phone_sanitizer(self):
        """Test the phone number sanitization function"""
        # Test with phone number
        original = "123-456-7890"
        result = self.sanitizer._phone_sanitizer(original, {})
        
        self.assertEqual(len(result), len(original))  # Same length
        self.assertNotEqual(result, original)  # Different value
        
        # Character pattern should be preserved (digits and non-digits in same positions)
        for i in range(len(original)):
            self.assertEqual(original[i].isdigit(), result[i].isdigit())
        
        # Test with None
        self.assertIsNone(self.sanitizer._phone_sanitizer(None, {}))
    
    def test_nullify_sanitizer(self):
        """Test the nullify sanitization function"""
        self.assertIsNone(self.sanitizer._nullify_sanitizer("any value", {}))
        self.assertIsNone(self.sanitizer._nullify_sanitizer(None, {}))
    
    def test_date_sanitizer(self):
        """Test the date sanitization function"""
        # Test with datetime object
        dt = datetime.datetime(2023, 5, 15, 12, 0, 0)
        result = self.sanitizer._date_sanitizer(dt, {})
        self.assertEqual(result.year, dt.year)
        self.assertEqual(result.month, dt.month)
        self.assertEqual(result.day, 1)  # Day should be 1
        
        # Test with date object
        date = datetime.date(2023, 5, 15)
        result = self.sanitizer._date_sanitizer(date, {})
        self.assertEqual(result.year, date.year)
        self.assertEqual(result.month, date.month)
        self.assertEqual(result.day, 1)  # Day should be 1
        
        # Test with ISO format string
        result = self.sanitizer._date_sanitizer("2023-05-15", {})
        self.assertEqual(result, "2023-05-01")
        
        # Test with US format string
        result = self.sanitizer._date_sanitizer("05/15/2023", {})
        self.assertEqual(result, "05/01/2023")
        
        # Test with None
        self.assertIsNone(self.sanitizer._date_sanitizer(None, {}))
    
    def test_address_sanitizer(self):
        """Test the address sanitization function"""
        # Test with address
        result = self.sanitizer._address_sanitizer("123 Main St, Anytown, USA", {})
        self.assertIsInstance(result, str)
        self.assertNotEqual(result, "123 Main St, Anytown, USA")
        
        # Test with None
        self.assertIsNone(self.sanitizer._address_sanitizer(None, {}))
    
    def test_infer_field_type(self):
        """Test field type inference"""
        # Test name fields
        self.assertEqual(self.sanitizer._infer_field_type("first_name"), "personal_data")
        self.assertEqual(self.sanitizer._infer_field_type("lastName"), "personal_data")
        
        # Test email fields
        self.assertEqual(self.sanitizer._infer_field_type("email"), "email")
        self.assertEqual(self.sanitizer._infer_field_type("user_email"), "email")
        
        # Test phone fields
        self.assertEqual(self.sanitizer._infer_field_type("phone"), "phone_number")
        self.assertEqual(self.sanitizer._infer_field_type("mobile_number"), "phone_number")
        
        # Test address fields
        self.assertEqual(self.sanitizer._infer_field_type("address"), "address")
        self.assertEqual(self.sanitizer._infer_field_type("zip_code"), "address")
        
        # Test financial fields
        self.assertEqual(self.sanitizer._infer_field_type("ssn"), "financial")
        self.assertEqual(self.sanitizer._infer_field_type("credit_card"), "financial")
        
        # Test credential fields
        self.assertEqual(self.sanitizer._infer_field_type("password"), "credential")
        self.assertEqual(self.sanitizer._infer_field_type("api_key"), "credential")
        
        # Test date of birth fields
        self.assertEqual(self.sanitizer._infer_field_type("date_of_birth"), "date_of_birth")
        self.assertEqual(self.sanitizer._infer_field_type("dob"), "date_of_birth")
        
        # Test unknown fields
        self.assertEqual(self.sanitizer._infer_field_type("unknown_field"), "unknown")
    
    def test_sanitize_field(self):
        """Test sanitizing a single field"""
        with patch.object(self.sanitizer, '_log_sanitization'):
            # Test with personal data
            value, was_modified = self.sanitizer.sanitize_field(
                table_name="users",
                field_name="full_name",
                value="John Doe",
                record_id=1,
                field_type="personal_data"
            )
            
            self.assertTrue(was_modified)
            self.assertNotEqual(value, "John Doe")
            self.assertEqual(value[0], "J")  # First letter preserved
            self.assertEqual(value[-1], "e")  # Last letter preserved
            
            # Test with a field that should be skipped (not sanitized)
            value, was_modified = self.sanitizer.sanitize_field(
                table_name="users",
                field_name="id",
                value=123,
                record_id=1,
                field_type="id"
            )
            
            self.assertFalse(was_modified)
            self.assertEqual(value, 123)
    
    def test_sanitize_record(self):
        """Test sanitizing an entire record"""
        # Mock FieldConfiguration query
        field_configs = [
            MagicMock(field_name="id", data_type="id"),
            MagicMock(field_name="name", data_type="personal_data"),
            MagicMock(field_name="email", data_type="email"),
            MagicMock(field_name="ssn", data_type="financial")
        ]
        
        self.mock_field_config.query.filter_by.return_value.all.return_value = field_configs
        
        # Create mock field config dictionary
        field_config_dict = {fc.field_name: fc for fc in field_configs}
        
        # Patch the sanitize_field method
        with patch.object(self.sanitizer, 'sanitize_field') as mock_sanitize_field:
            # Set up mock return values for sanitize_field
            def mock_sanitize_side_effect(table_name, field_name, value, record_id, field_type=None):
                # Don't modify id
                if field_name == "id":
                    return value, False
                # Modify everything else
                return f"SANITIZED_{value}", True
            
            mock_sanitize_field.side_effect = mock_sanitize_side_effect
            
            # Test sanitizing a record
            record = {
                "id": 1,
                "name": "John Doe",
                "email": "john@example.com",
                "ssn": "123-45-6789"
            }
            
            result = self.sanitizer.sanitize_record("users", record)
            
            # Verify id wasn't modified
            self.assertEqual(result["id"], 1)
            
            # Verify other fields were sanitized
            self.assertEqual(result["name"], "SANITIZED_John Doe")
            self.assertEqual(result["email"], "SANITIZED_john@example.com")
            self.assertEqual(result["ssn"], "SANITIZED_123-45-6789")
    
    def test_log_sanitization(self):
        """Test logging sanitization actions"""
        # Call the logging method
        self.sanitizer._log_sanitization(
            table_name="users",
            field_name="full_name",
            record_id=1,
            sanitization_type="mask",
            was_modified=True,
            context={"field_type": "personal_data"}
        )
        
        # Verify log entry was created and saved
        self.mock_db.session.add.assert_called()
        self.mock_db.session.commit.assert_called()


if __name__ == '__main__':
    unittest.main()