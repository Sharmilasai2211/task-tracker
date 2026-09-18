import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
]

function TaskForm({ initialTask, fieldErrors, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initialTask?.title ?? '')
  const [description, setDescription] = useState(initialTask?.description ?? '')
  const [status, setStatus] = useState(initialTask?.status ?? 'TODO')

  const isEditing = Boolean(initialTask)

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ title, description, status })
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Edit Task' : 'Add Task'}</h2>

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        {fieldErrors?.title && <span className="field-error">{fieldErrors.title}</span>}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        {fieldErrors?.description && <span className="field-error">{fieldErrors.description}</span>}
      </div>

      <div className="field">
        <label htmlFor="status">Status</label>
        <select id="status" value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button type="submit">{isEditing ? 'Update Task' : 'Add Task'}</button>
        {isEditing && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default TaskForm
