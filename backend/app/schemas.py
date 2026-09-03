from typing import Literal

from pydantic import BaseModel, EmailStr


EmployeeStatus = Literal[
    "Active",
    "On Leave",
    "Medical Leave",
    "Resigned",
    "Terminated",
    "Inactive",
]


class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str
    status: EmployeeStatus = "Active"


class EmployeeUpdate(BaseModel):
    name: str
    email: EmailStr
    department: str
    designation: str
    status: EmployeeStatus = "Active"