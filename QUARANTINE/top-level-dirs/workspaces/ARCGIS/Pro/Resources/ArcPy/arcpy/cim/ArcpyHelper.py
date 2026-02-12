def GetPythonClass(main_module, class_name):
    if class_name == 'datetime':
        import datetime
        return datetime.datetime.now()

    import importlib
    module = importlib.import_module(main_module)
    if hasattr(module, class_name):
        return getattr(module, class_name)
    else:
        return None