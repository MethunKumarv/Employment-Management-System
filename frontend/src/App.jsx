import "./App.css";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const SortArrow = ({ column, sortConfig }) => {
  if (sortConfig.key !== column) {
    return (
      <span className="sort-arrow sort-arrow-neutral">
        ↕
      </span>
    );
  }

  return (
    <span className="sort-arrow">
      {sortConfig.direction === "asc" ? "↑" : "↓"}
    </span>
  );
};

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortConfig, setSortConfig] = useState({
  key: "name",
  direction: "asc",
});
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dashboard, setDashboard] = useState({
    total_employees: 0,
    total_departments: 0,
  });

  const [formData, setFormData] = useState({
  name: "",
  email: "",
  department: "",
  designation: "",
  status: "Active",
});

  const [editingId, setEditingId] = useState(null);

  const [editingEmployeeName, setEditingEmployeeName] =
    useState("");

  const [createdEmployeeId, setCreatedEmployeeId] = useState(null);
  const [createdEmployee, setCreatedEmployee] = useState(null);

  /*
    Reference to the Employee Details section.

    React will give us the actual HTML element
    through employeeFormSectionRef.current.
  */
  const employeeFormSectionRef = useRef(null);
  const employeeDirectoryRef = useRef(null);

  /*
    Toast state
  */
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  /*
    Show toast notification
  */
  const showToast = (
    message,
    type = "success"
  ) => {
    setToast({
      visible: true,
      message,
      type,
    });

    setTimeout(() => {
      setToast({
        visible: false,
        message: "",
        type: "success",
      });
    }, 3000);
  };

  /*
    Close toast manually
  */
  const closeToast = () => {
    setToast({
      visible: false,
      message: "",
      type: "success",
    });
  };

  /*
    Get employees
  */
  const fetchEmployees = async () => {
  try {
    const response = await axios.get(`${API_URL}/employees`);
    setEmployees(response.data);
  } catch (error) {
    console.error("Error fetching employees:", error);

    setEmployees([]);
  } finally {
    setLoading(false);
  }
};

  /*
    Get dashboard data
  */
  const fetchDashboard = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard`);
    setDashboard(response.data);
  } catch (error) {
    console.error("Error fetching dashboard:", error);

    setDashboard({
      total_employees: 0,
      total_departments: 0,
    });
  }
};

  /*
    Initial data loading
  */
  useEffect(() => {
    fetchEmployees();
    fetchDashboard();
  }, []);

  /*
    IMPORTANT:

    Whenever editingId changes, React has already
    rendered the Employee Details section.

    Then we scroll directly to that section.
  */
  useEffect(() => {
    if (!editingId) {
      return;
    }

    /*
      Wait for the browser to finish the render
      before scrolling.
    */
    requestAnimationFrame(() => {
      if (employeeFormSectionRef.current) {
        employeeFormSectionRef.current.scrollIntoView(
          {
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          }
        );
      }
    });
  }, [editingId]);

  /*
    Handle form input changes
  */
  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]:
        event.target.value,
    });
  };

  /*
    Reset the employee form
  */
  const resetForm = () => {
  setFormData({
    name: "",
    email: "",
    department: "",
    designation: "",
    status: "Active",
  });

  setEditingId(null);
  setEditingEmployeeName("");
};

  /*
    Add OR update employee
  */
  const scrollToEmployeeDirectory = () => {
  if (employeeDirectoryRef.current) {
    employeeDirectoryRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }
};

  const handleSubmit = async (event) => {
  event.preventDefault();

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(formData.email.trim())) {
    showToast(
      "Please enter a valid email address, such as name@example.com.",
      "error"
    );
    return;
  }

  const isEditing = Boolean(editingId);

  try {
    /*
      UPDATE
    */
    if (isEditing) {
      await axios.put(
        `${API_URL}/employees/${editingId}`,
        formData
      );

      showToast(
        "Employee updated successfully!",
        "success"
      );
    }

    /*
      CREATE
    */
    else {
      const response = await axios.post(
        `${API_URL}/employees`,
        formData
      );

      setCreatedEmployeeId(
        response.data.employee_id
      );

      setCreatedEmployee({
        ...formData,
        employee_id: response.data.employee_id,
      });

      showToast(
        "Employee added successfully!",
        "success"
      );
    }

    resetForm();

    await fetchEmployees();
    await fetchDashboard();

    if (isEditing) {
      requestAnimationFrame(() => {
        scrollToEmployeeDirectory();
      });
    }
  } catch (error) {
    console.error(
      "Error saving employee:",
      error
    );

    let message;

    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message =
        detail[0]?.msg ||
        (isEditing
          ? "Failed to update employee."
          : "Failed to add employee.");
    } else {
      message = isEditing
        ? "Failed to update employee."
        : "Failed to add employee.";
    }

    showToast(message, "error");
  }
};

  /*
    Enter edit mode
  */
  const handleEdit = (employee) => {
  setCreatedEmployeeId(null);

  setEditingId(employee._id);
  setEditingEmployeeName(employee.name);

  setFormData({
    name: employee.name,
    email: employee.email,
    department: employee.department,
    designation: employee.designation,
    status: employee.status || "Active",
  });
};

  /*
    Delete employee
  */
  const handleDelete = async (employeeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_URL}/employees/${employeeId}`
      );

      showToast(
        response.data.message,
        "success"
      );

      await fetchEmployees();
      await fetchDashboard();
    } catch (error) {
      console.error(
        "Error deleting employee:",
        error
      );

      showToast(
        "Failed to delete employee.",
        "error"
      );
    }
  };

  /*
    Search + department filter
  */

const handleSort = (key) => {
  setSortConfig((current) => {
    if (current.key === key) {
      return {
        key,
        direction:
          current.direction === "asc"
            ? "desc"
            : "asc",
      };
    }

    return {
      key,
      direction: "asc",
    };
  });
};

  const filteredEmployees =
    employees.filter((employee) => {
      const search =
        searchTerm.toLowerCase();

      const matchesSearch =
        employee.name
          .toLowerCase()
          .includes(search) ||
        employee.email
          .toLowerCase()
          .includes(search);

      const matchesDepartment =
        departmentFilter === "" ||
        employee.department ===
          departmentFilter;

      return (
        matchesSearch &&
        matchesDepartment
      );
    });

  /*
    Sort employees
  */
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
  const { key, direction } = sortConfig;

  const valueA = a[key] || "";
  const valueB = b[key] || "";

  const comparison = String(valueA).localeCompare(
    String(valueB),
    undefined,
    {
      numeric: key === "employee_id",
      sensitivity: "base",
    }
  );

  return direction === "asc"
    ? comparison
    : -comparison;
});

const totalPages = Math.ceil(
  sortedEmployees.length / pageSize
);
useEffect(() => {
  if (
    totalPages > 0 &&
    currentPage > totalPages
  ) {
    setCurrentPage(totalPages);
  }
}, [currentPage, totalPages]);

const startIndex =
  (currentPage - 1) * pageSize;

const endIndex =
  startIndex + pageSize;

const paginatedEmployees =
  sortedEmployees.slice(startIndex, endIndex);

  /*
    Get unique departments
  */
  const departments = [
  ...new Map(
    employees.map((employee) => {
      const department = employee.department.trim();

      return [department.toLowerCase(), department];
    })
  ).values(),
].sort((a, b) => a.localeCompare(b));

  return (
    <div className="app">

      {/* =========================
          TOAST
          ========================= */}

      {toast.visible && (
        <div
          className={`toast toast-${toast.type}`}
          role="status"
          aria-live="polite"
        >
          <div className="toast-icon">
            {toast.type === "success"
              ? "✓"
              : "!"}
          </div>

          <span>
            {toast.message}
          </span>

          <button
            className="toast-close"
            type="button"
            onClick={closeToast}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* =========================
          HEADER
          ========================= */}

      <header className="header">
        <div className="brand">

          <div className="brand-icon">
            H
          </div>

          <div>
            <h1>HexaEMS</h1>

            <p>
              Employee Management Platform
            </p>
          </div>

        </div>
      </header>

      {/* =========================
          MAIN
          ========================= */}

      <main className="container">

        {/* =========================
            PAGE HEADING
            ========================= */}

        <section className="page-heading">

          <p className="eyebrow">
            OVERVIEW
          </p>

          <h2>
            Employee Management
          </h2>

          <p className="page-description">
            View, add, update and manage
            employees in your organization.
          </p>

        </section>

        {/* =========================
            DASHBOARD
            ========================= */}

        <section className="dashboard">

          <div className="stat-card">

            <div className="stat-icon">
              👥
            </div>

            <div>

              <span>
                Total Employees
              </span>

              <strong>
                {dashboard.total_employees}
              </strong>

              <small>
                Employees in organization
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon">
              ▦
            </div>

            <div>

              <span>
                Total Departments
              </span>

              <strong>
                {dashboard.total_departments}
              </strong>

              <small>
                Departments in organization
              </small>

            </div>

          </div>

        </section>

        {/* =========================
            EMPLOYEE FORM
            ========================= */}

        <section
          ref={employeeFormSectionRef}
          id="employee-form-section"
          className={`section ${
            editingId
              ? "editing-section"
              : ""
          }`}
        >

          <div className="section-heading">

            <div>

              <p className="eyebrow">
                EMPLOYEE DETAILS
              </p>

              <h3>
                {editingId
                  ? "Edit Employee"
                  : "Add New Employee"}
              </h3>

              {editingId && (
                <div className="edit-mode-banner">

                  <div className="edit-mode-icon">
                    ✎
                  </div>

                  <div>

                    <strong>
                      Editing employee:{" "}
                      {editingEmployeeName}
                    </strong>

                    <p>
                      Update the details below
                      and click "Update Employee"
                      to save your changes.
                    </p>

                  </div>

                </div>
              )}

            </div>

            {editingId && (
              <button
                className="cancel-button"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}

          </div>
          {createdEmployee && !editingId && (
  <div className="employee-id-confirmation">
    <div className="employee-id-confirmation-icon">
      ✓
    </div>

    <div className="employee-id-confirmation-content">
      <button
        type="button"
        className="employee-id-confirmation-close"
        onClick={() => {
          setCreatedEmployee(null);
          setCreatedEmployeeId(null);
        }}
        aria-label="Close confirmation"
      >
        ×
      </button>

      <strong>Employee added successfully!</strong>

      <p>
        This is the employee's permanent ID. Please provide it to the employee.
      </p>

      <div className="employee-id-display">
        <span>Employee ID</span>
        <strong>{createdEmployee.employee_id}</strong>
      </div>

      <div className="employee-id-details">
        <div className="employee-id-detail">
          <span>Name</span>
          <strong>{createdEmployee.name}</strong>
        </div>

        <div className="employee-id-detail">
          <span>Email</span>
          <strong>{createdEmployee.email}</strong>
        </div>

        <div className="employee-id-detail">
          <span>Department</span>
          <strong>{createdEmployee.department}</strong>
        </div>

        <div className="employee-id-detail">
          <span>Designation</span>
          <strong>{createdEmployee.designation}</strong>
        </div>

        <div className="employee-id-detail">
          <span>Status</span>
          <strong>{createdEmployee.status}</strong>
        </div>
      </div>
    </div>
  </div>
)}
          <form
            className="employee-form"
            onSubmit={handleSubmit}
          >

            <div className="form-field">

              <label htmlFor="name">
                Full Name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter employee name"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-field">

              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="employee@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-field">

              <label htmlFor="department">
                Department
              </label>

              <input
                id="department"
                type="text"
                name="department"
                placeholder="e.g. Engineering"
                value={formData.department}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-field">

              <label htmlFor="designation">
                Designation
              </label>

              <input
                id="designation"
                type="text"
                name="designation"
                placeholder="e.g. Software Developer"
                value={formData.designation}
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-field">
              <label htmlFor="status">
                Employment Status
              </label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                disabled={!editingId}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Medical Leave">Medical Leave</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="form-actions">

              <button
                className="primary-button"
                type="submit"
              >
                {editingId
                  ? "Update Employee"
                  : "Add Employee"}
              </button>

            </div>

          </form>

        </section>

        {/* =========================
            EMPLOYEE DIRECTORY
            ========================= */}

        <section
          ref={employeeDirectoryRef}
          className="section"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                DIRECTORY
              </p>

              <h3>
                Employees
              </h3>

            </div>

            <span className="employee-count">

              {sortedEmployees.length} employee
              {sortedEmployees.length !== 1
                ? "s"
                : ""}

            </span>

          </div>

          {/* SEARCH + FILTER */}

          <div className="search-controls">

            <div className="search-box">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />

            </div>

            <select
              value={departmentFilter}
              onChange={(event) => {
              setDepartmentFilter(event.target.value);
              setCurrentPage(1);
            }}
            >

              <option value="">
                All Departments
              </option>

              {departments.map(
                (department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                )
              )}

            </select>

          </div>

          <div className="pagination-top">
            <div className="page-size-control">
              <span>Show</span>

              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Employees per page"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <span>entries</span>
            </div>
          </div>

          {/* LOADING */}

          {loading ? (

            <div className="empty-state">

              <div className="loading-spinner"></div>

              <p>
                Loading employees...
              </p>

            </div>

          ) : sortedEmployees.length === 0 ? (

            /* EMPTY */

            <div className="empty-state">

              <div className="empty-icon">
                ◎
              </div>

              <h4>
                No employees found
              </h4>

              <p>
                Try changing your search
                or filter.
              </p>

            </div>

          ) : (

  <>
    {/* TABLE */}

    <div className="table-container">

              <table className="employee-table">

                <thead>
                  <tr>
                    <th
                      aria-sort={
                        sortConfig.key === "employee_id"
                          ? sortConfig.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("employee_id")}
                        aria-label="Sort by employee ID"
                      >
                        ID
                        <SortArrow
                          column="employee_id"
                          sortConfig={sortConfig}
                        />
                      </button>
                    </th>

                    <th
                      aria-sort={
                        sortConfig.key === "name"
                          ? sortConfig.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("name")}
                        aria-label="Sort by employee name"
                      >
                        EMPLOYEE
                        <SortArrow
                          column="name"
                          sortConfig={sortConfig}
                        />
                      </button>
                    </th>

                    <th
                      aria-sort={
                        sortConfig.key === "email"
                          ? sortConfig.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("email")}
                        aria-label="Sort by email"
                      >
                        EMAIL
                        <SortArrow
                          column="email"
                          sortConfig={sortConfig}
                        />
                      </button>
                    </th>

                    <th
                      aria-sort={
                        sortConfig.key === "department"
                          ? sortConfig.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("department")}
                        aria-label="Sort by department"
                      >
                        DEPARTMENT
                        <SortArrow
                          column="department"
                          sortConfig={sortConfig}
                        />
                      </button>
                    </th>

                    <th
                      aria-sort={
                        sortConfig.key === "designation"
                          ? sortConfig.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("designation")}
                        aria-label="Sort by designation"
                      >
                        DESIGNATION
                        <SortArrow
                          column="designation"
                          sortConfig={sortConfig}
                        />
                      </button>
                    </th>

                    <th
                      aria-sort={
                        sortConfig.key === "status"
                          ? sortConfig.direction === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() => handleSort("status")}
                        aria-label="Sort by employment status"
                      >
                        STATUS
                        <SortArrow
                          column="status"
                          sortConfig={sortConfig}
                        />
                      </button>
                    </th>

                    <th>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>

                  {paginatedEmployees.map(
                    (employee) => (

                      <tr
                        key={employee._id}
                      >
                      <td>
                        <span className="employee-id">
                          {employee.employee_id}
                        </span>
                      </td>

                        <td>

                          <div className="employee-name">

                            <div className="employee-avatar">

                              {employee.name
                                .charAt(0)
                                .toUpperCase()}

                            </div>

                            <strong>
                              {employee.name}
                            </strong>

                          </div>

                        </td>

                        <td className="email-cell">
                          {employee.email}
                        </td>

                        <td>

                          <span className="department-badge">
                            {employee.department}
                          </span>

                        </td>

                        <td>{employee.designation}</td>

                        <td>
                          <span
                            className={`status-badge status-${employee.status
                              ?.toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {employee.status || "Active"}
                          </span>
                        </td>

                        <td>
                          <div className="action-buttons">

                            <button
                              className="edit-button"
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  employee
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={
                                employee.status === "Inactive"
                                  ? "activate-button"
                                  : "delete-button"
                              }
                              onClick={() => handleDelete(employee._id)}
                            >
                              {employee.status === "Inactive"
                                ? "Activate"
                                : "Deactivate"}
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>
            <div className="pagination">
              <button
                type="button"
                className="pagination-button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => page - 1)
                }
              >
                Previous
              </button>

              <div className="pagination-pages">
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`pagination-page ${
                      currentPage === page
                        ? "pagination-page-active"
                        : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                    aria-current={
                      currentPage === page
                        ? "page"
                        : undefined
                    }
                  >
                    {page}
                  </button>
                ))}
              </div>

  <button
    type="button"
    className="pagination-button"
    disabled={currentPage === totalPages}
    onClick={() =>
      setCurrentPage((page) => page + 1)
    }
  >
    Next
  </button>
    </div>
  </>
)}

        </section>

      </main>

    </div>
  );
}

export default App;