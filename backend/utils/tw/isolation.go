package tw

import "sync"

// taskwarriorMu serializes all Taskwarrior CLI use so GET /tasks cannot
// overlap mutation jobs (and so concurrent HTTP fetches do not share a home).
var taskwarriorMu sync.Mutex
