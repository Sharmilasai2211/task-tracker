const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
]

function TaskFilters({ status, searchText, canClear, onStatusChange, onSearchTextChange, onSearch, onClear }) {
  function handleSubmit(event) {
    event.preventDefault()
    onSearch()
  }

  return (
    <form className="task-filters" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field field-grow">
        <label htmlFor="filter-q">Search</label>
        <input
          id="filter-q"
          type="search"
          placeholder="Title or description"
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
        />
      </div>

      <div className="form-actions">
        <button type="submit">Search</button>
        <button type="button" className="secondary" onClick={onClear} disabled={!canClear}>
          Clear
        </button>
      </div>
    </form>
  )
}

export default TaskFilters
