import { buildTasksQuery } from './api.js'

console.log(JSON.stringify(buildTasksQuery()))
console.log(JSON.stringify(buildTasksQuery({ page: 0, size: 10 })))
console.log(JSON.stringify(buildTasksQuery({ sort: { field: 'title', direction: 'asc' } })))
console.log(JSON.stringify(buildTasksQuery({ status: 'DONE', title: 'report' })))
console.log(JSON.stringify(buildTasksQuery({ status: 'DONE', title: '  ' })))
console.log(JSON.stringify(buildTasksQuery({ page: 0, extra: null, obj: { a: 1 }, arr: [1, 2] })))
