import os
from pathlib import PureWindowsPath, PurePosixPath, Path


def return_case_sensitive_swizzle_path(lnxpath, finddir):
  if finddir == '..':
    return ('..', True)

  try:
    # Call ahead for autofs mounts
    lnxpath.joinpath(finddir).stat()
    return (finddir, True)
  except:
    try:
      for folder in os.listdir(lnxpath):
        if folder.lower() == finddir.lower():
          return (folder, True)
  
      return (finddir, False)
    except:
      return (finddir, False)


def iterate_subdirs(lnxpath, parts):
  index = 0
  for finddir in parts:
    directory, found = return_case_sensitive_swizzle_path(lnxpath, finddir)
    if found:
      lnxpath = lnxpath.joinpath(directory)
    else:
      for remainingdirs in parts[index:]:
        lnxpath = lnxpath.joinpath(remainingdirs)
      break
    index+=1

  return lnxpath.as_posix()


def swizzle_path(path):
  if path == "":
    return path
  if path.startswith(('http://', 'https://')):
    return path
  if os.name == 'nt':
    return path
  else:
    path = path.replace('\\', '/')
    pwp = PureWindowsPath(path)
    ppp = PurePosixPath(path)
  
    if pwp.is_absolute() and not ppp.is_absolute():
      # Full Windows path
      if pwp.drive.lower() == 'c:':
        lnxpath = Path(os.getenv("WINEPREFIX")).joinpath("drive_c")
      elif pwp.drive.lower() == 'z:':
        lnxpath = Path('/')
      parts = pwp.parts[1:]
      lnxpath_posix = iterate_subdirs(lnxpath, parts)
      
    elif ppp.is_absolute() and not pwp.is_absolute():
      # Full Linux path
      lnxpath = Path('/')
      parts = ppp.parts[1:]
      lnxpath_posix = iterate_subdirs(lnxpath, parts)
  
    elif ppp.is_absolute() and pwp.is_absolute():
      # UNC path
      lnxpath = Path('/')
      parts = ppp.parts[1:]
      lnxpath_posix = iterate_subdirs(lnxpath, parts)
  
    else:
      # consider relative path
      lnxpath = Path.cwd()
      cwdlen = len(lnxpath.as_posix())+1
      parts = pwp.parts
      lnxpath_posix = iterate_subdirs(lnxpath, parts)[cwdlen:]
  
    return lnxpath_posix