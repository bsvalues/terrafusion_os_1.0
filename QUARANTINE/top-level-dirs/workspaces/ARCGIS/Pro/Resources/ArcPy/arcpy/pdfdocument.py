import io
import os
import re
from arcpy.utils import ArgAdaptor

__all__ = ['PDFDocument', 'PDFDocumentOpen', 'PDFDocumentCreate']

RANGE_RE = re.compile(r"(\d+)(?:\s*-\s*(\d+))?")

class constants(ArgAdaptor):
    """Represents the constants that can be passed into PDFDocument functions"""
    __args__ = {
        # For encryption algorithm
        'encryption': {
            'AES-128': 'AES-128',
            'AES-256': 'AES-256',
            'AES-256-R5': 'AES-256-R5',
            'RC4': 'RC4'
        },
        # For permissions
        'permissions': {
            'ALL': 'ALL',
            'PRINT': 'PRINT',
            'EDIT': 'EDIT',
            'COPY': 'COPY',
            'EDIT_NOTES': 'EDIT_NOTES',
            'FILL_AND_SIGN': 'FILL_AND_SIGN',
            'DOC_ASSEMBLY': 'DOC_ASSEMBLY',
            'HIGH_PRINT': 'HIGH_PRINT',
            'ALL_MASTER': 'ALL_MASTER'
        }
    }

def page_range_list(range_string):
    pages = []
    for page_start, page_end in RANGE_RE.findall(range_string):
        page1 = int(page_start)
        if page_end:
            page2 = int(page_end)
            pages.extend(list(range(page1, page2 + 1)))
        else:
            pages.append(page1)
    return pages

class PDFDocument:
    """Allows for the management of PDF documents, including facilities for
       merging and deleting pages, setting document open behavior, and creating
       or changing document security settings."""
    _open = False
    _e_cls = None
    _e_entry = None
    _e_ID = None
    _user_password = None
    _owner_password = None
    _encryption_algorithm = "AES-256"
    _update_security = False
    _permissions = 0

    def __init__(self, pdf_path, input_pdf_password=None, open_new=False):
        """PDFDocument(pdf_path)

           Creates an empty PDFDocument object in memory.

             pdf_path(String):
           A string that specifies the  path and file name for the resulting PDF
           file when the saveAndClose method is called."""
        import pypdf
        import arcpy

        self._PDFPath = pdf_path
        if not open_new:
            (self._info,
             self._layout,
             self._mode,
             self._e_cls,
             self._e_entry,
             self._e_ID,
             self._user_type,
             self._open,
             self._pages) = self._pagesAndInfoForPath(pdf_path,
                                                      input_pdf_password)
            self._128bit = True
        else:
            if arcpy.env.overwriteOutput == False and os.path.exists(pdf_path):
                raise IOError("{} already exists".format(pdf_path))
            self._info = pypdf.DocumentInformation()
            self._layout = pypdf.generic.TextStringObject('/SinglePage')
            self._mode = pypdf.generic.TextStringObject('/UseNone')
            self._pages = []
            self._128bit = True
            self._open = True
            self._user_type = 'NONE'

        if self._user_type == "USER_PASSWORD":
            self._user_password = input_pdf_password
        elif self._user_type == "OWNER_PASSWORD":
            self._owner_password = input_pdf_password

        # save the encryption algorithm
        if self._e_entry and self._e_entry['/V'] >= 4:
            if self._e_entry['/Length'] == 128:
                self._encryption_algorithm = 'AES-128'
            elif self._e_entry['/R'] == 5:
                self._encryption_algorithm = 'AES-256-R5'

    @classmethod
    def _pagesAndInfoForPath(cls, pdf_path, input_pdf_password=None):
        import pypdf

        if isinstance(pdf_path, cls):
            return (pdf_path._info,
                    pdf_path._layout,
                    pdf_path._mode,
                    pdf_path._decrypt,
                    pdf_path._ID,
                    0,
                    pdf_path._pages)
        elif not os.path.isfile(pdf_path):
            raise IOError("{} not found".format(pdf_path))

        with open(pdf_path, 'rb') as in_stream:
            in_io = io.BytesIO(in_stream.read())

        reader = pypdf.PdfReader(in_io)
        pw_type = 0
        if reader.is_encrypted and input_pdf_password:
            pw_type = reader.decrypt(input_pdf_password)
            if pw_type == 0:
                raise Exception("Incorrect password. File has not been decrypted.")

        open_for_editing = True
        if reader.is_encrypted and not input_pdf_password:
            open_for_editing = False

        try:
            info = reader.metadata
        except Exception as e:
            raise Exception("This document requires a password.")

        encrypt_string = pypdf.generic.TextStringObject("/Encrypt")
        id_string = pypdf.generic.TextStringObject("/ID")

        encryption_cls = None
        encrypt_entry = None
        encrypt_id = None

        if encrypt_string in reader.trailer:
            encryption_cls = reader._encryption
            encrypt_entry = reader.trailer[encrypt_string].get_object()
            encrypt_id = reader.trailer[id_string].get_object()

        return (info,
                reader.page_layout or '/NoLayout',
                reader.page_mode or '/UseNone',
                encryption_cls, encrypt_entry, encrypt_id,
                pw_type.name if pw_type else 'NONE',
                open_for_editing,
                [reader.pages[page_number]
                 for page_number in range(len(reader.pages))])

    @classmethod
    def _pagesForPath(cls, pdf_path, input_pdf_password=None):
        return cls._pagesAndInfoForPath(pdf_path, input_pdf_password)[-1]

    def appendPages(self, pdf_path, input_pdf_password=None):
        """PDFDocument.appendPages(pdf_path, {input_pdf_password})

           Appends one PDF document to the end of another.

             pdf_path(String):
           A string that includes the location and name of the input PDF
           document to be appended.

             input_pdf_password{String}:
           A string that defines the master password to a protected file.  It
           must be a master password; a user password will not work."""
        if not self._open:
            raise Exception("File is closed for editing")
        self._pages += self._pagesForPath(pdf_path, input_pdf_password)

    def deletePages(self, page_range):
        """PDFDocument.deletePages(page_range)

           Provides the ability to delete one or multiple pages within an
           existing PDF document.

             page_range(String):
           A string that defines the page or pages to be deleted.  Delete a
           single page by passing in a single value as a string (for example,
           "3" ). Multiple pages can be deleted using a comma between each value
           (for example, "3, 5, 7" ).  Ranges can also be applied (for example,
           "1, 3, 5-12" )."""
        if not self._open:
            raise Exception("File is closed for editing")
        for page in reversed(sorted(set(page_range_list(page_range)))):
            if page > len(self._pages):
                raise IndexError("Page {} out of range".format(page))
            self._pages.pop(page - 1)

    def insertPages(self, pdf_path, before_page_number=1,
                    input_pdf_password=None):
        """PDFDocument.insertPages(pdf_path, {before_page_number},
           {input_pdf_password})

           Allows inserting the contents of one PDF document at the beginning or
           in between the pages of another  PDFDocument.

             pdf_path(String):
           A string that includes the location and name of the input PDF
           document to be inserted.

             before_page_number{Integer}:
           An integer that defines a page number in the currently referenced
           PDFDocument before which the new pages will be inserted.  For
           example, if the before_page_value is 1, the inserted page will be
           inserted before all pages.

             input_pdf_password{String}:
           A string that defines the master password to a protected file.   It
           must be a master password; a user password will not work."""
        if not self._open:
            raise Exception("File is closed for editing")
        if 0 >= before_page_number > len(self._pages):
            raise IndexError("Page {} out of range".format(before_page_number))
        pages_to_insert = self._pagesForPath(pdf_path, input_pdf_password)
        self._pages = (self._pages[:before_page_number - 1] +
                       pages_to_insert +
                       self._pages[before_page_number - 1:])

    def _writeToFile(self, pdf_path):
        from pypdf import PdfWriter

        writer = PdfWriter()
        writer.add_metadata(self._info)
        writer.page_layout = self._layout
        writer.page_mode = self._mode
        if not self._pages:
            raise RuntimeError("PDF Document is empty")
        for page in self._pages:
            writer.add_page(page)

        # encrypt or re-encrypt if security was set
        if self._user_password or self._owner_password:
            if self._update_security:
                writer.encrypt(self._user_password if self._user_password is not None else '',
                           self._owner_password,
                           self._128bit, self._permissions, algorithm=self._encryption_algorithm)
            elif self._e_cls is not None:
                writer._encryption = self._e_cls
                writer._encrypt_entry = self._e_entry
                # add object to make reference correct
                writer._add_object(self._e_entry)
                writer._ID = self._e_ID

        with open(pdf_path, 'wb') as stream:
            writer.write(stream)

    def saveAndClose(self):
        """PDFDocument.saveAndClose()

           Saves any changes made to the currently referenced PDFDocument ."""
        if not self._open:
            raise Exception("File is closed for editing")
        self._open = False
        self._writeToFile(self._PDFPath)

    def updateDocProperties(self, pdf_title=None, pdf_author=None,
                            pdf_subject=None, pdf_keywords=None,
                            pdf_open_view=None, pdf_layout=None):
        """PDFDocument.updateDocProperties({pdf_title}, {pdf_author},
           {pdf_subject}, {pdf_keywords}, {pdf_open_view}, {pdf_layout})

           Allows updating of the PDF document metadata and can also set the
           certain behaviors that will trigger when the document is opened in
           Adobe Reader or Adobe Acrobat, such as the initial view mode and the
           page thumbnails view.

             pdf_title{String}:
           A string defining the document title, a PDF metadata property.

             pdf_author{String}:
           A string defining the document author, a PDF metadata property.

             pdf_subject{String}:
           A string defining the document subject, a PDF metadata property.

             pdf_keywords{String}:
           A string defining the document keywords, a PDF metadata property.

             pdf_open_view{String}:
           A string or number that will define the behavior to trigger when the
           PDF file is viewed. The default value is USETHUMBS, which will show
           the Adobe Reader Pages panel automatically when the PDF is opened.

            * VIEWER_DEFAULT:   Uses the application user preference when
            opening the file

            * USE_NONE:   Displays the document only; does not show other panels

            * USE_THUMBS:   Displays the document plus the Pages panel

            * USE_BOOKMARKS:   Displays the document plus the Bookmarks panel

            * FULL_SCREEN:   Displays the document  in full-screen viewing mode

            * LAYERS:   Displays the document plus the layers panel

            * ATTACHMENT:   Displays the document plus the attachment panel

             pdf_layout{String}:
           A string or number that will define the initial view mode to trigger
           when the PDF file is viewed.

            * VIEWER_DEFAULT:   Uses the application user preference when opening the
            file

            * SINGLE_PAGE:   Uses single-page mode

            * ONE_COLUMN:   Uses one-column continuous mode

            * TWO_COLUMN_LEFT:   Uses two-column continuous mode with first page
            on left

            * TWO_COLUMN_RIGHT:   Uses two-column continuous mode with first
            page on right

            * TWO_PAGE_LEFT:   Uses two-page mode left

            * TWO_PAGE_RIGHT:   Uses two-page mode right"""
        import pypdf

        if not self._open:
            raise Exception("File is closed for editing")
        if pdf_title is not None:
            self._info[pypdf.generic.TextStringObject('/Title')] = \
                    pypdf.generic.TextStringObject(pdf_title)
        if pdf_author is not None:
            self._info[pypdf.generic.TextStringObject('/Author')] = \
                    pypdf.generic.TextStringObject(pdf_author)
        if pdf_subject is not None:
            self._info[pypdf.generic.TextStringObject('/Subject')] = \
                    pypdf.generic.TextStringObject(pdf_subject)
        if pdf_keywords is not None:
            self._info[pypdf.generic.TextStringObject('/Keywords')] = \
                    pypdf.generic.TextStringObject(pdf_keywords)
        open_view_map = {
                            'DONT_CARE': '/UseNone',
                            'VIEWER_DEFAULT': '/UseNone',
                            'USE_NONE': '/UseNone',
                            'USE_THUMBS': '/UseThumbs',
                            'USE_BOOKMARKS': '/UseOutlines',
                            'FULL_SCREEN': '/FullScreen',
                            'LAYERS': '/UseOC',
                            'ATTACHMENT': '/UseAttachments'
                        }
        if pdf_open_view is not None:
            try:
                self._mode = open_view_map[pdf_open_view.upper()]
                if self._mode == '/FullScreen' and pdf_layout is None:
                    pdf_layout = 'SINGLE_PAGE'
            except KeyError:
                raise ValueError(pdf_open_view)
        layout_view_map = {
                                'DONT_CARE': '/NoLayout',
                                'VIEWER_DEFAULT': '/NoLayout',
                                'SINGLE_PAGE': '/SinglePage',
                                'ONE_COLUMN': '/OneColumn',
                                'TWO_COLUMN_LEFT': '/TwoColumnLeft',
                                'TWO_COLUMN_RIGHT': '/TwoColumnRight',
                                'TWO_PAGE_LEFT': '/TwoPageLeft',
                                'TWO_PAGE_RIGHT': '/TwoPageRight'
                          }
        if pdf_layout is not None:
            try:
                self._layout = layout_view_map[pdf_layout.upper()]
            except KeyError:
                raise ValueError(pdf_layout)

    @constants.maskargs
    def updateDocSecurity(self, new_master_password=None, new_user_password=None,
                          encryption='AES-256', permissions='ALL'):
        """PDFDocument.updateDocSecurity({new_master_password},
           {new_user_password}, {encryption})

           Provides the mechanism that sets password, encryption, and security
           restrictions on PDF files.

             new_master_password{String}:
           A string that defines the master document password. This password is
           required for appending and inserting pages into a secured PDF.

             new_user_password{String}:
           A string that defines the user password needed to open the PDF
           document for viewing.

             encryption{String}:
           A string  that defines the encryption technique used on the PDF.

            * "AES-128": Uses 128-bit AES encryption.

            * "AES-256-R5" : Uses 256-bit AES encryption with R5 encoding.

            * "AES-256": Uses 256-bit AES encryption.

             permissions{String}:
           A string that defines the capabilities restricted by the document security settings.

            * "ALL": Grants all permissions.

            * "ALL_MASTER": Grants permissions for COPY, EDIT, EDIT_NOTES, and HIGH_PRINT.

            * "COPY": Grants permission to copy information from the document to the clipboard.

            * "DOC_ASSEMBLY": Grants permission to perform page insert, delete, and rotate, and allows creation of bookmarks and thumbnails.

            * "EDIT": Grants permission to edit the document in ways other than adding or modifying text notes.

            * "EDIT_NOTES": Grants permission to add, modify, and delete text notes.

            * "FILL_AND_SIGN": Grants permission to fill in or sign existing form or signature fields.

            * "HIGH_PRINT": Grants permission for high-quality printing.

            * "PRINT": Grants permission to print the document."""

        if not self._open:
            raise Exception("File is closed for editing")
        if self._user_type == "USER_PASSWORD":
            raise Exception("MASTER access required to updateDocSecurity")
        if not self._user_password and not self._owner_password:
            self._e_cls = None
            self._e_entry = None # clear password
            self._ID = None
        self._user_password = new_user_password
        self._owner_password = new_master_password

        # check encryption algorithm
        if encryption not in ['AES-128', 'AES-256', 'AES-256-R5', 'RC4']:
            raise Exception("Incorrect encryption algorithm type.")
        if encryption == 'RC4':
            encryption = 'RC4-128'
        self._encryption_algorithm = encryption
        self._update_security = True

        permissions = permissions.split(",")
        import pypdf.constants
        UserAccessPermissions = pypdf.constants.UserAccessPermissions
        for p in permissions:
            if p == 'ALL':
                self._permissions = -1
            elif p == 'ALL_MASTER':
                self._permissions |= (UserAccessPermissions.EXTRACT | UserAccessPermissions.MODIFY | UserAccessPermissions.ADD_OR_MODIFY
                | UserAccessPermissions.PRINT | UserAccessPermissions.PRINT_TO_REPRESENTATION)
            elif p == 'COPY':
                self._permissions |= UserAccessPermissions.EXTRACT
            elif p == 'DOC_ASSEMBLY':
                self._permissions |= UserAccessPermissions.ASSEMBLE_DOC
            elif p == 'EDIT':
                self._permissions |= UserAccessPermissions.MODIFY
            elif p == 'EDIT_NOTES':
                self._permissions |= UserAccessPermissions.ADD_OR_MODIFY
            elif p == 'FILL_AND_SIGN':
                self._permissions |= UserAccessPermissions.FILL_FORM_FIELDS
            elif p == 'HIGH_PRINT':
                self._permissions |= (UserAccessPermissions.PRINT | UserAccessPermissions.PRINT_TO_REPRESENTATION)
            elif p == 'PRINT':
                self._permissions |= UserAccessPermissions.PRINT


    @property
    def pageCount(self):
        return len(self._pages)

def PDFDocumentOpen(pdf_path, user_password=None, master_password=None):
    """PDFDocumentOpen(pdf_path, {user_password}, {master_password})

       Returns a reference to  an existing PDFDocument file on disk.

         pdf_path(String):
       A string that specifies the path and file name of the PDF file to open.

         user_password{String}:
       A string that specifies the user password. The user password, if set, is
       what you need to provide in order to open a PDF.

         master_password{String}:
       A string that specifies the master password. The master password, if set,
       controls permissions, such as printing, editing, extracting, commenting,
       and so on."""
    return PDFDocument(pdf_path, user_password
                                 if master_password is None
                                 else master_password, False)

def PDFDocumentCreate(pdf_path):
    """PDFDocumentCreate(pdf_path)

       Creates a new PDFDocument object in memory.

         pdf_path(String):
       A string that specifies the  path and file name for the resulting PDF
       file when the saveAndClose method is called."""
    return PDFDocument(pdf_path, open_new=True)
