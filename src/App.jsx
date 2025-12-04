import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import './App.css'


function App() {
    const [currentView, setCurrentView] = useState('dayGridMonth')

    return (
        <div className="min-h-screen bg-neutral-50 p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Calendar Container */}
                <div className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-4 md:p-6 lg:p-8 shadow-sm">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView={currentView}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        buttonText={{
                            today: 'Today',
                            month: 'Month',
                            week: 'Week',
                            day: 'Day'
                        }}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        weekends={true}
                        height="auto"
                        eventDisplay="block"
                        eventClassNames="rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                        nowIndicator={true}
                        aspectRatio={1.8}
                        handleWindowResize={true}
                        windowResizeDelay={100}
                        views={{
                            dayGridMonth: {
                                dayMaxEventRows: 3
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    )
}

export default App
