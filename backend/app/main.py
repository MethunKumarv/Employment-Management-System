from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from app.database import (
    employees_collection,
    counters_collection,
    users_collection,
)
from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    require_admin,
    require_employee_directory_access,
    require_hr_or_admin,
    require_manager,
    require_manager_or_hr_or_admin,
    verify_password,
)
from app.schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    UserCreate,
)
from fastapi.responses import Response

app = FastAPI()

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://hexaemsplatform.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user = users_collection.find_one(
        {"username": form_data.username}
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
        )

    if not verify_password(
        form_data.password,
        user["hashed_password"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
        )

    if user.get("status") != "Active":
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )

    access_token = create_access_token(
        username=user["username"],
        role=user["role"],
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
    }

@app.get("/auth/me")
def get_my_account(
    current_user=Depends(get_current_user),
):
    return {
        "username": current_user["username"],
        "role": current_user["role"],
        "status": current_user["status"],
        "employee_id": current_user.get("employee_id"),
    }

@app.post("/users")
def create_user(
    user: UserCreate,
    current_user=Depends(require_admin),
):
    existing_user = users_collection.find_one(
        {"username": user.username}
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="A user with this username already exists.",
        )

    if user.role in {"Manager", "Employee"}:
        if not user.employee_id:
            raise HTTPException(
                status_code=400,
                detail="Manager and Employee users must have an employee_id.",
            )

        employee = employees_collection.find_one(
            {"employee_id": user.employee_id}
        )

        if employee is None:
            raise HTTPException(
                status_code=404,
                detail="Employee record not found.",
            )

    if user.role in {"Admin", "HR Manager"}:
        if user.employee_id:
            raise HTTPException(
                status_code=400,
                detail="Admin and HR Manager users should not have an employee_id.",
            )

    new_user = {
        "username": user.username,
        "hashed_password": hash_password(
            user.password
        ),
        "role": user.role,
        "status": "Active",
        "employee_id": user.employee_id,
    }

    try:
        users_collection.insert_one(new_user)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="A user with this username already exists.",
        )

    return {
        "message": "User created successfully",
        "username": user.username,
        "role": user.role,
        "employee_id": user.employee_id,
        "status": "Active",
    }

@app.get("/users")
def get_users(
    current_user=Depends(require_admin),
):
    users = list(
        users_collection.find(
            {},
            {
                "hashed_password": 0,
            },
        )
    )

    for user in users:
        user["_id"] = str(user["_id"])

    return users

@app.delete("/users/{user_id}")
def toggle_user_status(
    user_id: str,
    current_user=Depends(require_admin),
):
    try:
        object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID",
        )

    user = users_collection.find_one(
        {"_id": object_id}
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Prevent Admin from accidentally disabling
    # their own account.
    if user["username"] == current_user["username"]:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own account",
        )

    new_status = (
        "Inactive"
        if user.get("status") == "Active"
        else "Active"
    )

    users_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "status": new_status
            }
        },
    )

    return {
        "message": (
            "User deactivated successfully"
            if new_status == "Inactive"
            else "User activated successfully"
        ),
        "username": user["username"],
        "status": new_status,
    }

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
def create_employee(
    employee: EmployeeCreate,
    current_user=Depends(require_hr_or_admin),
):
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
        "status": employee_data["status"],
    }


@app.get("/employees")
def get_employees(
    current_user=Depends(require_employee_directory_access),
):
    employees = list(employees_collection.find())

    for employee in employees:
        employee["_id"] = str(employee["_id"])

    return employees

@app.get("/employees/me")
def get_my_employee_profile(
    current_user=Depends(get_current_user),
):
    employee_id = current_user.get("employee_id")

    if not employee_id:
        raise HTTPException(
            status_code=404,
            detail="No employee profile is linked to this account",
        )

    employee = employees_collection.find_one(
        {"employee_id": employee_id}
    )

    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee profile not found",
        )

    employee["_id"] = str(employee["_id"])

    return employee

@app.get("/employees/my-team")
def get_my_team(
    current_user=Depends(require_manager),
):
    manager_employee_id = current_user.get(
        "employee_id"
    )

    if not manager_employee_id:
        raise HTTPException(
            status_code=404,
            detail="Manager profile is not linked to an employee",
        )

    team = list(
        employees_collection.find(
            {
                "manager_employee_id":
                    manager_employee_id
            }
        )
    )

    for employee in team:
        employee["_id"] = str(
            employee["_id"]
        )

    return team

@app.get("/employees/{employee_id}")
def get_employee(
    employee_id: str,
    current_user=Depends(get_current_user),
):
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
def update_employee(
    employee_id: str,
    employee: EmployeeUpdate,
    current_user=Depends(require_manager_or_hr_or_admin),
):
    existing_employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    if existing_employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found",
        )

    current_role = current_user.get("role")

    if current_role == "Manager":
        manager_employee_id = current_user.get(
            "employee_id"
        )

        if (
            existing_employee.get(
                "manager_employee_id"
            )
            != manager_employee_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You can only edit employees in your team",
            )

    employee_data = employee.model_dump()

    employee_data["email"] = (
        employee_data["email"].lower()
    )

    duplicate_email = employees_collection.find_one(
        {
            "email": employee_data["email"],
            "_id": {
                "$ne": ObjectId(employee_id)
            },
        }
    )

    if duplicate_email:
        raise HTTPException(
            status_code=409,
            detail="An employee with this email already exists.",
        )

    try:
        employees_collection.update_one(
            {"_id": ObjectId(employee_id)},
            {"$set": employee_data},
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="An employee with this email already exists.",
        )

    updated_employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    updated_employee["_id"] = str(
        updated_employee["_id"]
    )

    return updated_employee

@app.delete("/employees/{employee_id}")
def delete_employee(
    employee_id: str,
    current_user=Depends(require_admin),
):
    existing_employee = employees_collection.find_one(
        {"_id": ObjectId(employee_id)}
    )

    if existing_employee is None:
        raise HTTPException(
            status_code=404,
            detail="Employee not found"
        )

    new_status = (
        "Active"
        if existing_employee.get("status") == "Inactive"
        else "Inactive"
    )

    employees_collection.update_one(
        {"_id": ObjectId(employee_id)},
        {"$set": {"status": new_status}}
    )

    return {
        "message": (
            "Employee activated successfully"
            if new_status == "Active"
            else "Employee deactivated successfully"
        ),
        "status": new_status,
    }

@app.get("/dashboard")
def get_dashboard(
    current_user=Depends(get_current_user),
):
    total_employees = employees_collection.count_documents({})

    departments = employees_collection.distinct("department")

    return {
        "total_employees": total_employees,
        "total_departments": len(departments)
    }