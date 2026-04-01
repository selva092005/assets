import "../../styles/Dashboard.css";
const Dashboard = () => {
  return (
    <div className="dashboard">

      {/* Top Header */}
      <div className="dashboard-header d-flex justify-content-between align-items-center">
        <h4>Dashboard</h4>
      </div>

      {/* Cards */}
      <div className="row mt-3">
        <div className="col-md-3">
          <div className="card stat-card">
            <h6>Total Asset Value</h6>
            <h3>₹7,59,500</h3>
            <p>10 total assets</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stat-card green">
            <h6>Active Assets</h6>
            <h3>8</h3>
            <p>80% of total</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stat-card yellow">
            <h6>In Maintenance</h6>
            <h3>1</h3>
            <p>Needs attention</p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card stat-card red">
            <h6>Retired</h6>
            <h3>1</h3>
            <p>Decommissioned</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="row mt-4">
        
        {/* Recent Assets */}
        <div className="col-md-8">
          <div className="card p-3">
            <h6>Recent Assets</h6>

            {[
              { name: "MacBook Pro 16", price: "₹2,20,000", status: "Active" },
              { name: "Dell Monitor 27", price: "₹32,000", status: "Active" },
              { name: "Standing Desk", price: "₹45,000", status: "Maintenance" }
            ].map((item, i) => (
              <div key={i} className="asset-item d-flex justify-content-between">
                <span>{item.name}</span>
                <div>
                  <span className="me-3">{item.price}</span>
                  <span className={`badge ${item.status === "Active" ? "bg-success" : "bg-warning"}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}

            <button className="btn btn-dark mt-3">View All Assets →</button>
          </div>
        </div>

        {/* Right Side */}
        <div className="col-md-4">
          <div className="card p-3 mb-3">
            <h6>Category Breakdown</h6>
            <p>IT Equipment</p>
            <div className="progress mb-2">
              <div className="progress-bar bg-dark" style={{ width: "70%" }}></div>
            </div>

            <p>Office Furniture</p>
            <div className="progress">
              <div className="progress-bar bg-warning" style={{ width: "50%" }}></div>
            </div>
          </div>

          <div className="card p-3">
            <h6>Status Overview</h6>

            <p>Active</p>
            <div className="progress mb-2">
              <div className="progress-bar bg-success" style={{ width: "80%" }}></div>
            </div>

            <p>Maintenance</p>
            <div className="progress mb-2">
              <div className="progress-bar bg-warning" style={{ width: "20%" }}></div>
            </div>

            <p>Retired</p>
            <div className="progress">
              <div className="progress-bar bg-danger" style={{ width: "10%" }}></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;