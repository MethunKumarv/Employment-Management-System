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


UserRole = Literal[
    "Admin",
    "HR Manager",
    "Manager",
    "Employee",
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


class UserCreate(BaseModel):
    username: str
    password: str
    role: UserRole = "Employee"
    employee_id: str | None = None


class UserResponse(BaseModel):
    username: str
    role: UserRole
    status: str