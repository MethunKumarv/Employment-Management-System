import "./App.css";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("");

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

  const [editingEmployeeName, setEditingEmployeeName] =
    useState("");

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
      const response = await axios.get(
        `${API_URL}/employees`
      );

      setEmployees(response.data);
    } catch (error) {
      console.error(
        "Error fetching employees:",
        error
      );

      showToast(
        "Unable to load employees.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
    Get dashboard data
  */
  const fetchDashboard = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/dashboard`
      );

      setDashboard(response.data);
    } catch (error) {
      console.error(
        "Error fetching dashboard:",
        error
      );

      showToast(
        "Unable to load dashboard data.",
        "error"
      );
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

    /*
      Save whether this is edit mode before
      making the request.

      This makes the success message reliable.
    */
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
        await axios.post(
          `${API_URL}/employees`,
          formData
        );

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

      showToast(
        isEditing
          ? "Failed to update employee."
          : "Failed to add employee.",
        "error"
      );
    }
  };

  /*
    Enter edit mode
  */
  const handleEdit = (employee) => {
    /*
      Store which employee we are editing.
    */
    setEditingId(employee._id);

    /*
      Store the employee name for the
      edit-mode message.
    */
    setEditingEmployeeName(employee.name);

    /*
      Load existing employee information
      into the SAME form.
    */
    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
    });

    /*
      We intentionally DO NOT scroll here.

      The useEffect above watches editingId.
      After React renders the edit form,
      it will scroll to the correct section.
    */
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
      await axios.delete(
        `${API_URL}/employees/${employeeId}`
      );

      showToast(
        "Employee deleted successfully!",
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
  const sortedEmployees = [
    ...filteredEmployees,
  ].sort((a, b) => {
    const comparison =
      a.name.localeCompare(b.name);

    return sortOrder === "asc"
      ? comparison
      : -comparison;
  });

  /*
    Get unique departments
  */
  const departments = [
    ...new Set(
      employees.map(
        (employee) => employee.department
      )
    ),
  ];

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
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

            </div>

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(
                  event.target.value
                )
              }
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

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target.value
                )
              }
            >

              <option value="asc">
                Name: A → Z
              </option>

              <option value="desc">
                Name: Z → A
              </option>

            </select>

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

            /* TABLE */

            <div className="table-container">

              <table className="employee-table">

                <thead>

                  <tr>
                    <th>EMPLOYEE</th>
                    <th>EMAIL</th>
                    <th>DEPARTMENT</th>
                    <th>DESIGNATION</th>
                    <th>ACTIONS</th>
                  </tr>

                </thead>

                <tbody>

                  {sortedEmployees.map(
                    (employee) => (

                      <tr
                        key={employee._id}
                      >

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

                        <td>
                          {employee.designation}
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
                              className="delete-button"
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  employee._id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

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