from pydantic import BaseModel, EmailStr

class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str

class EmployeeUpdate(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str