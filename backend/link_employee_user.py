from app.database import users_collection


employee_id = "EMP-0002"


result = users_collection.update_one(
    {"username": "employee"},
    {
        "$set": {
            "employee_id": employee_id
        }
    }
)


if result.matched_count == 0:
    print("Employee user was not found.")
elif result.modified_count == 0:
    print("Employee user already has this employee ID.")
else:
    print(
        "Employee user linked successfully:",
        employee_id
    )