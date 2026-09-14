from app.database import users_collection


manager_employee_id = "EMP-0003"


result = users_collection.update_one(
    {"username": "manager"},
    {
        "$set": {
            "employee_id": manager_employee_id
        }
    }
)


if result.matched_count == 0:
    print("Manager user was not found.")
elif result.modified_count == 0:
    print("Manager user already has this employee ID.")
else:
    print(
        "Manager user linked successfully:",
        manager_employee_id
    )