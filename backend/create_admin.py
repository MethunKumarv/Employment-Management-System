from app.database import users_collection
from app.auth import hash_password


users = [
    {
        "username": "admin",
        "password": "ChangeMe123!",
        "role": "Admin",
    },
    {
        "username": "hr",
        "password": "ChangeMe123!",
        "role": "HR Manager",
    },
    {
        "username": "manager",
        "password": "ChangeMe123!",
        "role": "Manager",
    },
    {
        "username": "employee",
        "password": "ChangeMe123!",
        "role": "Employee",
    },
]


for user in users:

    existing_user = users_collection.find_one(
        {"username": user["username"]}
    )

    if existing_user:
        print(
            f'{user["username"]} already exists.'
        )
        continue

    users_collection.insert_one(
        {
            "username": user["username"],
            "hashed_password": hash_password(
                user["password"]
            ),
            "role": user["role"],
            "status": "Active",
            "employee_id": None,
        }
    )

    print(
        f'{user["role"]} created: '
        f'{user["username"]}'
    )