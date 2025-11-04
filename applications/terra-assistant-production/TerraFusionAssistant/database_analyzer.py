import os
import re
import ast
import logging
import json
from collections import defaultdict
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseModelExtractor(ast.NodeVisitor):
    """AST visitor for extracting database models from Python code"""
    
    def __init__(self):
        self.models = {}
        self.orm_type = None
        self.current_class = None
        self.current_fields = {}
    
    def visit_ClassDef(self, node):
        """Process class definitions to find database models"""
        # Detect if this might be a database model
        base_classes = [base.id if isinstance(base, ast.Name) else getattr(base, 'attr', '') 
                        for base in node.bases if hasattr(base, 'id') or hasattr(base, 'attr')]
        
        # Check for Django models
        if 'Model' in base_classes:
            self.orm_type = 'django'
            self.current_class = node.name
            self.current_fields = {}
            self._process_django_model(node)
            
            # Save the model
            self.models[self.current_class] = {
                'orm': 'django',
                'fields': self.current_fields,
                'meta': {}
            }
            
        # Check for SQLAlchemy models
        elif 'Base' in base_classes or any(b in base_classes for b in ['DeclarativeBase', 'declarative_base']):
            self.orm_type = 'sqlalchemy'
            self.current_class = node.name
            self.current_fields = {}
            self._process_sqlalchemy_model(node)
            
            # Get table name from __tablename__ attribute
            tablename = None
            for item in node.body:
                if isinstance(item, ast.Assign) and len(item.targets) == 1:
                    if isinstance(item.targets[0], ast.Name) and item.targets[0].id == '__tablename__':
                        if isinstance(item.value, ast.Str) or isinstance(item.value, ast.Constant):
                            tablename = getattr(item.value, 's', None) or getattr(item.value, 'value', None)
            
            # Save the model
            self.models[self.current_class] = {
                'orm': 'sqlalchemy',
                'tablename': tablename or self.current_class.lower(),
                'fields': self.current_fields,
                'relationships': {}
            }
            
        # Check for Peewee models
        elif 'Model' in base_classes or any(b in base_classes for b in ['BaseModel', 'PeeweeModel']):
            self.orm_type = 'peewee'
            self.current_class = node.name
            self.current_fields = {}
            self._process_peewee_model(node)
            
            # Save the model
            self.models[self.current_class] = {
                'orm': 'peewee',
                'fields': self.current_fields,
                'meta': {}
            }
        
        # Continue visiting child nodes
        self.generic_visit(node)
        
        # Reset current class after processing
        self.current_class = None
    
    def _process_django_model(self, node):
        """Extract fields from a Django model"""
        for item in node.body:
            # Field assignments as class variables
            if isinstance(item, ast.Assign) and len(item.targets) == 1:
                if isinstance(item.targets[0], ast.Name):
                    field_name = item.targets[0].id
                    
                    # Check if this is a field definition
                    field_type = None
                    field_args = {}
                    
                    if isinstance(item.value, ast.Call):
                        if hasattr(item.value.func, 'id'):
                            field_type = item.value.func.id
                        elif hasattr(item.value.func, 'attr'):
                            field_type = item.value.func.attr
                        
                        # Extract field arguments
                        for kw in item.value.keywords:
                            if isinstance(kw.value, ast.Constant) or isinstance(kw.value, ast.Num) or isinstance(kw.value, ast.Str):
                                field_args[kw.arg] = getattr(kw.value, 'value', getattr(kw.value, 'n', getattr(kw.value, 's', None)))
                    
                    if field_type:
                        self.current_fields[field_name] = {
                            'type': field_type,
                            'args': field_args
                        }
            
            # Process Meta inner class
            elif isinstance(item, ast.ClassDef) and item.name == 'Meta':
                for meta_item in item.body:
                    if isinstance(meta_item, ast.Assign) and len(meta_item.targets) == 1:
                        if isinstance(meta_item.targets[0], ast.Name):
                            meta_name = meta_item.targets[0].id
                            meta_value = None
                            
                            if isinstance(meta_item.value, ast.Constant) or isinstance(meta_item.value, ast.Str):
                                meta_value = getattr(meta_item.value, 'value', getattr(meta_item.value, 's', None))
                            elif isinstance(meta_item.value, ast.List):
                                meta_value = []
                                for elt in meta_item.value.elts:
                                    if isinstance(elt, ast.Constant) or isinstance(elt, ast.Str):
                                        meta_value.append(getattr(elt, 'value', getattr(elt, 's', None)))
                            
                            if meta_value is not None:
                                self.models[self.current_class]['meta'][meta_name] = meta_value
    
    def _process_sqlalchemy_model(self, node):
        """Extract fields from a SQLAlchemy model"""
        for item in node.body:
            # Field assignments as class variables
            if isinstance(item, ast.Assign) and len(item.targets) == 1:
                if isinstance(item.targets[0], ast.Name):
                    field_name = item.targets[0].id
                    
                    # Skip __tablename__ as it's processed separately
                    if field_name == '__tablename__':
                        continue
                    
                    # Check if this is a Column definition
                    field_type = None
                    field_args = {}
                    
                    if isinstance(item.value, ast.Call):
                        if hasattr(item.value.func, 'id') and item.value.func.id == 'Column':
                            # Direct Column definition
                            if item.value.args:
                                # Get the type from the first argument
                                first_arg = item.value.args[0]
                                if isinstance(first_arg, ast.Call) and hasattr(first_arg.func, 'id'):
                                    field_type = first_arg.func.id
                                elif isinstance(first_arg, ast.Name):
                                    field_type = first_arg.id
                                
                                # Process column arguments
                                for kw in item.value.keywords:
                                    if isinstance(kw.value, ast.Constant) or isinstance(kw.value, ast.Num) or isinstance(kw.value, ast.Str):
                                        field_args[kw.arg] = getattr(kw.value, 'value', getattr(kw.value, 'n', getattr(kw.value, 's', None)))
                                    elif isinstance(kw.value, ast.Name) and kw.arg == 'nullable':
                                        field_args[kw.arg] = kw.value.id == 'True'
                                    elif isinstance(kw.value, ast.Call) and kw.arg == 'default':
                                        field_args[kw.arg] = "function_call"
                        
                        elif hasattr(item.value.func, 'attr') and item.value.func.attr == 'Column':
                            # Column as an attribute (e.g., db.Column)
                            if item.value.args:
                                # Get the type from the first argument
                                first_arg = item.value.args[0]
                                if isinstance(first_arg, ast.Call):
                                    if hasattr(first_arg.func, 'id'):
                                        field_type = first_arg.func.id
                                    elif hasattr(first_arg.func, 'attr'):
                                        field_type = first_arg.func.attr
                                elif isinstance(first_arg, ast.Attribute):
                                    field_type = first_arg.attr
                                elif isinstance(first_arg, ast.Name):
                                    field_type = first_arg.id
                                
                                # Process column arguments
                                for kw in item.value.keywords:
                                    if isinstance(kw.value, ast.Constant) or isinstance(kw.value, ast.Num) or isinstance(kw.value, ast.Str):
                                        field_args[kw.arg] = getattr(kw.value, 'value', getattr(kw.value, 'n', getattr(kw.value, 's', None)))
                    
                    if field_type:
                        self.current_fields[field_name] = {
                            'type': field_type,
                            'args': field_args
                        }
            
            # Relationship definitions
            elif isinstance(item, ast.Assign) and len(item.targets) == 1:
                if isinstance(item.targets[0], ast.Name):
                    rel_name = item.targets[0].id
                    
                    if isinstance(item.value, ast.Call):
                        if hasattr(item.value.func, 'id') and item.value.func.id == 'relationship':
                            rel_target = None
                            rel_args = {}
                            
                            # Get the related model
                            if item.value.args:
                                first_arg = item.value.args[0]
                                if isinstance(first_arg, ast.Str) or isinstance(first_arg, ast.Constant):
                                    rel_target = getattr(first_arg, 's', getattr(first_arg, 'value', None))
                            
                            # Get relationship arguments
                            for kw in item.value.keywords:
                                if isinstance(kw.value, ast.Str) or isinstance(kw.value, ast.Constant):
                                    rel_args[kw.arg] = getattr(kw.value, 's', getattr(kw.value, 'value', None))
                            
                            if rel_target:
                                if 'relationships' not in self.models[self.current_class]:
                                    self.models[self.current_class]['relationships'] = {}
                                
                                self.models[self.current_class]['relationships'][rel_name] = {
                                    'target': rel_target,
                                    'args': rel_args
                                }
    
    def _process_peewee_model(self, node):
        """Extract fields from a Peewee model"""
        for item in node.body:
            # Field assignments as class variables
            if isinstance(item, ast.Assign) and len(item.targets) == 1:
                if isinstance(item.targets[0], ast.Name):
                    field_name = item.targets[0].id
                    
                    # Check if this is a field definition
                    field_type = None
                    field_args = {}
                    
                    if isinstance(item.value, ast.Call):
                        if hasattr(item.value.func, 'id'):
                            field_type = item.value.func.id
                        elif hasattr(item.value.func, 'attr'):
                            field_type = item.value.func.attr
                        
                        # Extract field arguments
                        for kw in item.value.keywords:
                            if isinstance(kw.value, ast.Constant) or isinstance(kw.value, ast.Num) or isinstance(kw.value, ast.Str):
                                field_args[kw.arg] = getattr(kw.value, 'value', getattr(kw.value, 'n', getattr(kw.value, 's', None)))
                    
                    if field_type:
                        self.current_fields[field_name] = {
                            'type': field_type,
                            'args': field_args
                        }
            
            # Process Meta inner class
            elif isinstance(item, ast.ClassDef) and item.name == 'Meta':
                for meta_item in item.body:
                    if isinstance(meta_item, ast.Assign) and len(meta_item.targets) == 1:
                        if isinstance(meta_item.targets[0], ast.Name):
                            meta_name = meta_item.targets[0].id
                            meta_value = None
                            
                            if isinstance(meta_item.value, ast.Constant) or isinstance(meta_item.value, ast.Str):
                                meta_value = getattr(meta_item.value, 'value', getattr(meta_item.value, 's', None))
                            
                            if meta_value is not None:
                                self.models[self.current_class]['meta'][meta_name] = meta_value

def find_database_files(repo_path):
    """
    Find files that are likely related to database operations
    
    Parameters:
    - repo_path: Path to the cloned repository
    
    Returns:
    - list: Database-related files
    """
    db_files = []
    
    # Patterns to identify database-related files
    db_file_patterns = [
        r'.*models\.py$',
        r'.*schema\.py$',
        r'.*database\.py$',
        r'.*db\.py$',
        r'.*repository\.py$',
        r'.*dao\.py$',
        r'.*entity\.py$',
        r'.*migrations/.*\.py$'
    ]
    
    # Database-related libraries to detect
    db_libraries = [
        'django.db', 'sqlalchemy', 'peewee', 'psycopg2', 'pymysql', 'pymongo',
        'sqlite3', 'mysql', 'postgresql', 'models.Model', 'db.Model', 'Base',
        'declarative_base', 'Column', 'Field', 'create_engine', 'session'
    ]
    
    for root, _, files in os.walk(repo_path):
        for file in files:
            # Skip hidden files
            if file.startswith('.'):
                continue
                
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, repo_path)
            
            # Skip hidden directories
            if any(part.startswith('.') for part in Path(rel_path).parts):
                continue
            
            # Check if the file matches database patterns
            if any(re.match(pattern, rel_path) for pattern in db_file_patterns):
                db_files.append(rel_path)
            elif file.endswith('.py'):
                # For Python files, check the content for database-related code
                try:
                    with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read().lower()
                        # Check for database library imports
                        if any(lib.lower() in content for lib in db_libraries):
                            db_files.append(rel_path)
                        # Check for SQL queries
                        elif 'select ' in content and ' from ' in content:
                            db_files.append(rel_path)
                        elif 'insert into' in content or 'update ' in content or 'delete from' in content:
                            db_files.append(rel_path)
                except Exception:
                    pass
    
    return db_files

def extract_database_models(repo_path, db_files):
    """
    Extract database models from the identified files
    
    Parameters:
    - repo_path: Path to the cloned repository
    - db_files: List of database-related files
    
    Returns:
    - dict: Extracted database models
    """
    all_models = {}
    orm_types = set()
    
    for file_path in db_files:
        full_path = os.path.join(repo_path, file_path)
        
        try:
            with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            # Parse the AST
            tree = ast.parse(content, filename=file_path)
            
            # Visit nodes to extract models
            visitor = DatabaseModelExtractor()
            visitor.visit(tree)
            
            # Add extracted models
            all_models.update(visitor.models)
            
            # Track ORM types
            if visitor.orm_type:
                orm_types.add(visitor.orm_type)
                
        except Exception as e:
            logger.error(f"Error extracting database models from {file_path}: {str(e)}")
    
    return all_models, list(orm_types)

def extract_raw_sql_queries(repo_path, db_files):
    """
    Extract raw SQL queries from the codebase
    
    Parameters:
    - repo_path: Path to the cloned repository
    - db_files: List of database-related files
    
    Returns:
    - list: Extracted SQL queries
    """
    sql_queries = []
    
    # Patterns to identify SQL queries
    sql_patterns = [
        r'(\bSELECT\b.+\bFROM\b.+)',
        r'(\bINSERT\s+INTO\b.+)',
        r'(\bUPDATE\b.+\bSET\b.+)',
        r'(\bDELETE\s+FROM\b.+)',
        r'(\bCREATE\s+TABLE\b.+)',
        r'(\bALTER\s+TABLE\b.+)',
        r'(\bDROP\s+TABLE\b.+)'
    ]
    
    for file_path in db_files:
        full_path = os.path.join(repo_path, file_path)
        
        try:
            with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            
            # Look for SQL query patterns
            for pattern in sql_patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE | re.DOTALL)
                for match in matches:
                    # Clean up the query (remove extra whitespace and limit to a reasonable length)
                    query = match.group(0).strip()
                    query = re.sub(r'\s+', ' ', query)
                    query = query[:500] + '...' if len(query) > 500 else query
                    
                    sql_queries.append({
                        'file': file_path,
                        'query': query
                    })
        except Exception as e:
            logger.error(f"Error extracting SQL queries from {file_path}: {str(e)}")
    
    return sql_queries

def detect_database_redundancies(models):
    """
    Detect potential redundancies in database models
    
    Parameters:
    - models: Dict of database models
    
    Returns:
    - list: Potential redundancies
    """
    redundancies = []
    
    # Check for similar field sets
    model_fields = {}
    for model_name, model_info in models.items():
        field_set = frozenset(model_info.get('fields', {}).keys())
        if field_set:
            model_fields[model_name] = field_set
    
    # Check for models with similar fields (potential redundancy)
    for model1, fields1 in model_fields.items():
        for model2, fields2 in model_fields.items():
            if model1 != model2:
                # Calculate similarity (Jaccard index)
                intersection = len(fields1.intersection(fields2))
                union = len(fields1.union(fields2))
                
                if union > 0:
                    similarity = intersection / union
                    
                    # If models share more than 70% of their fields, flag it
                    if similarity > 0.7:
                        redundancies.append({
                            'type': 'similar_models',
                            'model1': model1,
                            'model2': model2,
                            'similarity': round(similarity, 2),
                            'common_fields': list(fields1.intersection(fields2))
                        })
    
    # Check for duplicate field names with different types (potential inconsistency)
    field_types = defaultdict(dict)
    for model_name, model_info in models.items():
        for field_name, field_info in model_info.get('fields', {}).items():
            field_type = field_info.get('type')
            if field_type:
                if field_name in field_types and field_type != field_types[field_name].get('type'):
                    redundancies.append({
                        'type': 'inconsistent_field_types',
                        'field': field_name,
                        'models': [model_name, field_types[field_name]['model']],
                        'types': [field_type, field_types[field_name]['type']]
                    })
                else:
                    field_types[field_name] = {'type': field_type, 'model': model_name}
    
    return redundancies

def generate_consolidation_recommendations(models, redundancies, orm_types):
    """
    Generate recommendations for database consolidation
    
    Parameters:
    - models: Dict of database models
    - redundancies: List of detected redundancies
    - orm_types: List of detected ORM frameworks
    
    Returns:
    - list: Consolidation recommendations
    """
    recommendations = []
    
    # Recommend based on ORM types
    if len(orm_types) > 1:
        recommendations.append(
            f"Multiple ORM frameworks detected ({', '.join(orm_types)}). Consider standardizing on a single framework."
        )
    
    # Recommend based on redundancies
    similar_models = [r for r in redundancies if r['type'] == 'similar_models']
    if similar_models:
        # Group by similarity to avoid duplicate recommendations
        model_pairs_seen = set()
        
        for redundancy in similar_models:
            model_pair = tuple(sorted([redundancy['model1'], redundancy['model2']]))
            
            if model_pair not in model_pairs_seen:
                model_pairs_seen.add(model_pair)
                
                recommendations.append(
                    f"Models '{redundancy['model1']}' and '{redundancy['model2']}' have {redundancy['similarity'] * 100:.0f}% "
                    f"field similarity. Consider consolidating into a single model."
                )
    
    # Recommend based on inconsistent field types
    inconsistent_fields = [r for r in redundancies if r['type'] == 'inconsistent_field_types']
    if inconsistent_fields:
        # Group by field name
        field_inconsistencies = defaultdict(list)
        
        for redundancy in inconsistent_fields:
            field_inconsistencies[redundancy['field']].append(redundancy)
        
        for field, inconsistencies in field_inconsistencies.items():
            affected_models = []
            for inc in inconsistencies:
                affected_models.extend(inc['models'])
            
            affected_models = sorted(set(affected_models))
            
            recommendations.append(
                f"Field '{field}' has inconsistent types across models: {', '.join(affected_models)}. "
                f"Standardize field types for better data consistency."
            )
    
    # General recommendations
    if models:
        recommendations.append(
            "Consider using database migrations for schema changes to ensure consistency across environments."
        )
        
        recommendations.append(
            "Implement proper foreign key constraints for all relationships to maintain data integrity."
        )
        
        recommendations.append(
            "Add indexes for frequently queried fields to improve query performance."
        )
    
    return recommendations

def analyze_database_structures(repo_path):
    """
    Analyze database structures in the repository
    
    Parameters:
    - repo_path: Path to the cloned repository
    
    Returns:
    - dict: Database analysis results
    """
    logger.info(f"Analyzing database structures for repository at {repo_path}...")
    
    # Initialize results
    results = {
        'database_files': [],
        'database_models': {},
        'raw_sql_queries': [],
        'orm_types': [],
        'redundancies': [],
        'consolidation_recommendations': []
    }
    
    # Find database-related files
    db_files = find_database_files(repo_path)
    if not db_files:
        logger.info("No database-related files found.")
        results['consolidation_recommendations'] = [
            "No database models detected. Consider using an ORM for structured data persistence.",
            "When adding database models, follow a consistent naming convention and structure.",
            "Implement proper relationships and constraints for data integrity."
        ]
        return results
    
    # Format file paths for better display
    results['database_files'] = [{'path': path} for path in db_files]
    
    # Extract database models
    models, orm_types = extract_database_models(repo_path, db_files)
    if models:
        results['database_models'] = models
        results['orm_types'] = orm_types
    
    # Extract raw SQL queries
    sql_queries = extract_raw_sql_queries(repo_path, db_files)
    if sql_queries:
        results['raw_sql_queries'] = sql_queries
    
    # Detect redundancies
    if models:
        redundancies = detect_database_redundancies(models)
        if redundancies:
            results['redundancies'] = redundancies
    
    # Generate consolidation recommendations
    recommendations = generate_consolidation_recommendations(models, results['redundancies'], orm_types)
    if recommendations:
        results['consolidation_recommendations'] = recommendations
    
    logger.info(f"Database analysis complete. Found {len(db_files)} database-related files and {len(models)} models.")
    return results