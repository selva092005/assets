import ViewModal from "../common/ViewModal";

const USER_FIELDS = [
  ["ID",       "userId"],
  ["Username", "userName"],
  ["Email",    "userEmail"],
  ["Role",     "userRole"],
];

export default function UserView({ open, data, onClose }) {
  return (
    <ViewModal
      open={open}
      title="User Details"
      data={data}
      fields={USER_FIELDS}
      onClose={onClose}
    />
  );
}
