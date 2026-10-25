import html

from django.core.exceptions import ValidationError
from django.http.multipartparser import MultiPartParser as DjangoMultiPartParser
from django.http.multipartparser import MultiPartParserError
from rest_framework.exceptions import ParseError
from rest_framework.parsers import (
    DataAndFiles,
    FormParser,
    JSONParser,
    MultiPartParser,
    get_encoding,
)

from .models import _contains_path_traversal


class _OriginalFilenameMultiPartParser(DjangoMultiPartParser):
    def sanitize_file_name(self, file_name):
        if _contains_path_traversal(html.unescape(file_name)):
            raise ValidationError('Path traversal is not allowed in file names.')
        return super().sanitize_file_name(file_name)


class DocumentUploadMultiPartParser(MultiPartParser):
    def parse(self, stream, media_type=None, parser_context=None):
        parser_context = parser_context or {}
        request = parser_context['request']
        encoding = get_encoding(parser_context)
        meta = request.META.copy()
        meta['CONTENT_TYPE'] = media_type

        try:
            parser = _OriginalFilenameMultiPartParser(
                meta, stream, request.upload_handlers, encoding
            )
            data, files = parser.parse()
            return DataAndFiles(data, files)
        except MultiPartParserError as exc:
            raise ParseError('Multipart form parse error - %s' % str(exc))


document_upload_parsers = [DocumentUploadMultiPartParser, FormParser, JSONParser]
