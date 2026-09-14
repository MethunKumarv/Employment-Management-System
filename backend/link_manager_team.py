from app.database import employees_collection


manager_employee_id = "EMP-0003"

team_employee_ids = [
    "EMP-0004",
    "EMP-0005",
]


result = employees_collection.update_many(
    {
        "employee_id": {
            "$in": team_employee_ids
        }
    },
    {
        "$set": {
            "manager_employee_id": manager_employee_id
        }
    }
)


print(
    "Employees linked:",
    result.modified_count
)