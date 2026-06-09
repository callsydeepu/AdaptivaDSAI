class ADSAException(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message

class NotFoundException(ADSAException):
    pass

class BadRequestException(ADSAException):
    pass

class DatabaseException(ADSAException):
    pass
