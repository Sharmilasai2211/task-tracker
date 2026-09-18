import { useEffect, useState } from 'react'
import { createTask, deleteTask, getTasks, updateTask } from './api'
import TaskForm from './components/TaskForm'
import TaskTable from './components/TaskTable'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [fieldErrors, setFieldErrors] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    try {
      const data = await getTasks()
      setTasks(data)
    } catch (err) {
      setErrorMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(taskData) {
    setFieldErrors(null)
    setErrorMessage(null)
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData)
      } else {
        await createTask(taskData)
      }
      setEditingTask(null)
      await loadTasks()
    } catch (err) {
      setErrorMessage(err.message)
      setFieldErrors(err.fieldErrors ?? null)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this task?')) {
      return
    }
    setErrorMessage(null)
    try {
      await deleteTask(id)
      await loadTasks()
    } catch (err) {
      setErrorMessage(err.message)
    }
  }

  function handleEdit(task) {
    setEditingTask(task)
    setFieldErrors(null)
    setErrorMessage(null)
  }

  function handleCancelEdit() {
    setEditingTask(null)
    setFieldErrors(null)
  }

  return (
    <div className="app">
      <h1>Task Tracker</h1>

      {errorMessage && <div className="error-banner">{errorMessage}</div>}

      <TaskForm
        key={editingTask?.id ?? 'new'}
        initialTask={editingTask}
        fieldErrors={fieldErrors}
        onSubmit={handleSubmit}
        onCancel={handleCancelEdit}
      />

      <h2>Tasks</h2>
      {loading ? (
        <p className="empty">Loading…</p>
      ) : (
        <TaskTable tasks={tasks} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  )
}

export default App
