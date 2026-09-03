from fastapi import FastAPI, HTTPException
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from pymongo import ReturnDocument
from app.database import employees_collection, counters_collection
from app.schemas import EmployeeCreate, EmployeeUpdate

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_employee_id():
    counter = counters_collection.find_one_and_update(
        {"_id": "employee_id"},
        {"$inc": {"last_number": 1}},
        upsert=True,
        return_document=True,
    )

    return f"EMP-{counter['last_number']:04d}"

@app.get("/")
def root():
    return {"message": "Employee Management System API"}


@app.post("/employees")
def create_employee(employee: EmployeeCreate):
    employee_data = employee.model_dump()

    employee_data["email"] = employee_data["email"].lower()

    existing_employee = employees_collection.find_one(
        {"email": employee_data["email"]}
    )

    if existing_employee:
        raise HTTPException(
            status_code=409,
            detail="An employee with this email already exists.",
        )

    employee_data["employee_id"] = generate_employee_id()

    try:
        result = employees_collection.insert_one(employee_data)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="An employee with this email already exists.",
        )

    return {
        "message": "Employee created successfully",
        "employee_id": employee_data["employee_id"],
        "mongo_id": str(result.inserted_id),
    }


@app.get("/employees")
def get_employees():
    employees = list(employees_collection.find())

    for employee in employees:
        employee["_id"] = str(employee["_id"])

    return employees


@app.get("/employees/{employee_id}")
def get_employee(employee_id: str):
    employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee["_id"] = str(employee["_id"])

    return employee

@app.put("/employees/{employee_id}")
def update_employee(employee_id: str, employee: EmployeeUpdate):
    existing_employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    if existing_employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employee_data = employee.model_dump()

    employees_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": employee_data}
    )

    updated_employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    updated_employee["_id"] = str(updated_employee["_id"])

    return updated_employee

@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: str):
    existing_employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    if existing_employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    employees_collection.delete_one(
        {"_id": ObjectId(employee_id)}
    )

    return {
        "message": "Employee deleted successfully"
    }

@app.get("/dashboard")
def get_dashboard():
    total_employees = employees_collection.count_documents({})

    departments = employees_collection.distinct("department")

    return {
        "total_employees": total_employees,
        "total_departments": len(departments)
    }