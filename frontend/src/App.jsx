import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("asc");

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  const [dashboard, setDashboard] = useState({
  total_employees: 0,
  total_departments: 0,
});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
  });
  const [editingId, setEditingId] = useState(null);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard`);
    setDashboard(response.data);
  } catch (error) {
    console.error("Error fetching dashboard:", error);
  }
};

  useEffect(() => {
    fetchEmployees();
    fetchDashboard();
  }, []);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  try {
    if (editingId) {
      await axios.put(
        `${API_URL}/employees/${editingId}`,
        formData
      );
    } else {
      await axios.post(`${API_URL}/employees`, formData);
    }

    setFormData({
      name: "",
      email: "",
      department: "",
      designation: "",
    });

    setEditingId(null);
    fetchEmployees();
    fetchDashboard();
  } catch (error) {
    console.error("Error saving employee:", error);
  }
};

const handleEdit = (employee) => {
  setEditingId(employee._id);

  setFormData({
    name: employee.name,
    email: employee.email,
    department: employee.department,
    designation: employee.designation,
  });
};

const handleDelete = async (employeeId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this employee?"
  );

  if (!confirmed) {
    return;
  }

  try {
    await axios.delete(`${API_URL}/employees/${employeeId}`);
    fetchEmployees();
    fetchDashboard();
  } catch (error) {
    console.error("Error deleting employee:", error);
  }
};

const filteredEmployees = employees.filter((employee) => {
  const matchesSearch =
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesDepartment =
    departmentFilter === "" ||
    employee.department === departmentFilter;

  return matchesSearch && matchesDepartment;
});

const sortedEmployees = [...filteredEmployees].sort((a, b) => {
  const comparison = a.name.localeCompare(b.name);

  return sortOrder === "asc" ? comparison : -comparison;
});

  return (
  <div className="app">
    <header className="header">
      <h1>Employee Management System</h1>
      <p>Manage your organization's employees</p>
    </header>

    <main className="container">
      <section className="dashboard">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p>{dashboard.total_employees}</p>
        </div>

        <div className="stat-card">
          <h3>Total Departments</h3>
          <p>{dashboard.total_departments}</p>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{editingId ? "Edit Employee" : "Add Employee"}</h2>
        </div>

        <form className="employee-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />

          <input
            type="text"
            name="department"
            placeholder="Department"
            value={formData.department}
            onChange={handleChange}
          />

          <input
            type="text"
            name="designation"
            placeholder="Designation"
            value={formData.designation}
            onChange={handleChange}
          />

          <button className="primary-button" type="submit">
            {editingId ? "Update Employee" : "Add Employee"}
          </button>
        </form>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Employee Management</h2>
        </div>

        <div className="search-controls">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="">All Departments</option>

            {[
              ...new Set(
                employees.map((employee) => employee.department)
              ),
            ].map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="asc">Name: A → Z</option>
            <option value="desc">Name: Z → A</option>
          </select>
        </div>

        {loading ? (
          <p>Loading employees...</p>
        ) : sortedEmployees.length === 0 ? (
          <p>No employees found.</p>
        ) : (
          <div className="table-container">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {sortedEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.name}</td>
                    <td>{employee.email}</td>
                    <td>{employee.department}</td>
                    <td>{employee.designation}</td>

                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(employee)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(employee._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  </div>
);
}

export default App;