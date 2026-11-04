import { useEffect, useState } from 'react'
import { createTask, deleteTask, getTasks, updateTask } from './api'
import TaskFilters from './components/TaskFilters'
import TaskForm from './components/TaskForm'
import TaskTable from './components/TaskTable'
import './App.css'

const PAGE_SIZE = 10

function App() {
  const [tasks, setTasks] = useState([])
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 })
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState(null)
  const [fieldErrors, setFieldErrors] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)

  const [status, setStatus] = useState('')
  const [searchText, setSearchText] = useState('')
  const [appliedQ, setAppliedQ] = useState('')
  const [page, setPage] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  const hasFilters = status !== '' || searchText !== '' || appliedQ !== ''
  const isFiltered = status !== '' || appliedQ !== ''

  useEffect(() => {
    let ignore = false

    async function loadTasks() {
      setLoading(true)
      try {
        const data = await getTasks({ status, q: appliedQ, page, size: PAGE_SIZE })
        if (ignore) return
        if (data.content.length === 0 && data.number > 0) {
          setPage(Math.max(data.totalPages - 1, 0))
          return
        }
        setTasks(data.content)
        setPageInfo({
          number: data.number,
          totalPages: data.totalPages,
          totalElements: data.totalElements,
        })
        setErrorMessage(null)
      } catch (err) {
        if (!ignore) setErrorMessage(err.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadTasks()
    return () => {
      ignore = true
    }
  }, [status, appliedQ, page, reloadKey])

  function reload() {
    setReloadKey((key) => key + 1)
  }

  function handleStatusChange(value) {
    setStatus(value)
    setPage(0)
  }

  function handleSearch() {
    setAppliedQ(searchText.trim())
    setPage(0)
  }

  function handleClearFilters() {
    setStatus('')
    setSearchText('')
    setAppliedQ('')
    setPage(0)
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
      reload()
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
      reload()
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

      <TaskFilters
        status={status}
        searchText={searchText}
        canClear={hasFilters}
        onStatusChange={handleStatusChange}
        onSearchTextChange={setSearchText}
        onSearch={handleSearch}
        onClear={handleClearFilters}
      />

      {loading ? (
        <p className="empty">Loading…</p>
      ) : (
        <>
          <TaskTable
            tasks={tasks}
            isFiltered={isFiltered}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {pageInfo.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="secondary"
                disabled={pageInfo.number === 0}
                onClick={() => setPage(pageInfo.number - 1)}
              >
                Previous
              </button>
              <span>
                Page {pageInfo.number + 1} of {pageInfo.totalPages} ({pageInfo.totalElements} tasks)
              </span>
              <button
                type="button"
                className="secondary"
                disabled={pageInfo.number + 1 >= pageInfo.totalPages}
                onClick={() => setPage(pageInfo.number + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
