function formatStatus(status) {
  return status.replace('_', ' ')
}

function TaskTable({ tasks, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty">No tasks yet. Add one above.</p>
  }

  return (
    <table className="task-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Description</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id}>
            <td>{task.title}</td>
            <td>{task.description}</td>
            <td>
              <span className={`status-badge status-${task.status.toLowerCase()}`}>
                {formatStatus(task.status)}
              </span>
            </td>
            <td className="actions">
              <button type="button" onClick={() => onEdit(task)}>
                Edit
              </button>
              <button type="button" className="danger" onClick={() => onDelete(task.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TaskTable
