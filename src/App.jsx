import {useState, useEffect, useRef} from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import {LunarCalendar} from '@dqcai/vn-lunar'
import {Calendar, CalendarDays, Clock, Menu, X} from 'lucide-react'
import './App.css'


function App() {
    const [currentView, setCurrentView] = useState('dayGridMonth')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isActivityDetailOpen, setIsActivityDetailOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [selectedActivity, setSelectedActivity] = useState(null)
    const [lunarInfo, setLunarInfo] = useState(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [heightLevel, setHeightLevel] = useState(1)
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [activities, setActivities] = useState(() => {
        const saved = localStorage.getItem('activities')
        return saved ? JSON.parse(saved) : {}
    })
    const [newActivityTitle, setNewActivityTitle] = useState('')
    const [newActivityTime, setNewActivityTime] = useState('')
    const [newActivityDescription, setNewActivityDescription] = useState('')
    const calendarRef = useRef(null)
    const touchStartRef = useRef({x: 0, y: 0, time: 0})
    const touchEndRef = useRef({x: 0, y: 0})

    const heightLevels = [350, 450, 600]

    useEffect(() => {
        localStorage.setItem('activities', JSON.stringify(activities))
    }, [activities])

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleTouchStart = (e) => {
        // Không xử lý nếu touch vào các button hoặc input
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
            return
        }

        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        }
        touchEndRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        }
    }

    const handleTouchMove = (e) => {
        // Không xử lý nếu touch vào các button hoặc input
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
            return
        }

        touchEndRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        }
    }

    const handleTouchEnd = (e) => {
        // Không xử lý nếu touch vào các button hoặc input
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) {
            return
        }

        const diffX = touchStartRef.current.x - touchEndRef.current.x
        const diffY = touchStartRef.current.y - touchEndRef.current.y
        const touchDuration = Date.now() - (touchStartRef.current.time || 0)
        const minSwipeDistance = 80
        const maxTapDuration = 300 // ms
        const maxTapMovement = 15 // px

        // Kiểm tra xem có phải là tap/click không
        const totalMovement = Math.sqrt(diffX * diffX + diffY * diffY)
        const isTap = totalMovement < maxTapMovement && touchDuration < maxTapDuration

        // Nếu là tap, không làm gì (để handleDateClick xử lý)
        if (isTap) {
            touchStartRef.current = {x: 0, y: 0, time: 0}
            touchEndRef.current = {x: 0, y: 0}
            return
        }

        // Chỉ xử lý swipe nếu KHÔNG phải tap và di chuyển đủ xa
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
            e.preventDefault()
            const calendarApi = calendarRef.current?.getApi()
            if (calendarApi && !isTransitioning) {
                setIsTransitioning(true)
                
                const calendarEl = calendarRef.current?.elRef?.current
                
                // Xác định hướng: diffX > 0 = vuốt trái (đi tới), diffX < 0 = vuốt phải (lùi lại)
                const swipeLeft = diffX > 0
                
                if (calendarEl) {
                    // Tháng cũ đi ra theo hướng vuốt
                    calendarEl.classList.add(swipeLeft ? 'calendar-transitioning-out-left' : 'calendar-transitioning-out-right')
                }
                
                setTimeout(() => {
                    // Chuyển tháng
                    if (swipeLeft) {
                        calendarApi.next()
                    } else {
                        calendarApi.prev()
                    }
                    
                    if (calendarEl) {
                        // Xóa class out
                        calendarEl.classList.remove('calendar-transitioning-out-left', 'calendar-transitioning-out-right')
                        // Tháng mới vào từ hướng ngược lại
                        calendarEl.classList.add(swipeLeft ? 'calendar-transitioning-in-right' : 'calendar-transitioning-in-left')
                    }
                    
                    setTimeout(() => {
                        if (calendarEl) {
                            calendarEl.classList.remove('calendar-transitioning-in-left', 'calendar-transitioning-in-right')
                        }
                        setIsTransitioning(false)
                    }, 200)
                }, 100)
            }
        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipeDistance) {
            e.preventDefault()
            if (diffY > 0) {
                setHeightLevel(prev => Math.max(0, prev - 1))
            } else {
                setHeightLevel(prev => Math.min(2, prev + 1))
            }
        }

        // Reset touch positions
        touchStartRef.current = {x: 0, y: 0, time: 0}
        touchEndRef.current = {x: 0, y: 0}
    }

    const dayCellContent = (arg) => {
        const date = arg.date
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        const lunar = LunarCalendar.fromSolar(day, month, year)
        const lunarDay = lunar.lunarDate.day
        const lunarMonth = lunar.lunarDate.month

        const dateKey = date.toISOString().split('T')[0]
        const dayActivities = activities[dateKey] || []
        const activityCount = dayActivities.length

        // Kiểm tra ngày 1 hoặc 15 âm lịch
        const isLunarSpecialDay = lunarDay === 1 || lunarDay === 15

        return (
            <div className="flex flex-col items-center justify-center h-full relative">
                <div className="text-sm font-medium">{day}</div>
                <div className={`text-xs ${isLunarSpecialDay ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    {lunarDay}/{lunarMonth}
                </div>
                {activityCount > 0 && (
                    <div className="absolute -bottom-2 w-4 h-1 bg-blue-500 rounded-full"></div>
                )}
            </div>
        )
    }

    const handleDateClick = (arg) => {
        const date = arg.date
        const calendarApi = calendarRef.current?.getApi()
        const currentMonth = calendarApi?.getDate().getMonth()
        const clickedMonth = date.getMonth()

        // Ngăn chặn chuyển tháng khi click vào ngày thuộc tháng khác
        if (currentMonth !== clickedMonth) {
            arg.jsEvent.preventDefault()
            arg.jsEvent.stopPropagation()
            return false
        }

        // Chọn ngày
        setSelectedDate(date)
    }

    const openAddActivityModal = () => {
        if (!selectedDate) {
            const today = new Date()
            setSelectedDate(today)
            const day = today.getDate()
            const month = today.getMonth() + 1
            const year = today.getFullYear()
            const lunar = LunarCalendar.fromSolar(day, month, year)
            setLunarInfo(lunar)
        } else {
            const day = selectedDate.getDate()
            const month = selectedDate.getMonth() + 1
            const year = selectedDate.getFullYear()
            const lunar = LunarCalendar.fromSolar(day, month, year)
            setLunarInfo(lunar)
        }
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedDate(null)
        setLunarInfo(null)
        setNewActivityTitle('')
        setNewActivityTime('')
        setNewActivityDescription('')
    }

    const addActivity = () => {
        if (!newActivityTitle.trim() || !selectedDate) return

        const dateKey = selectedDate.toISOString().split('T')[0]
        const newActivity = {
            id: Date.now(),
            title: newActivityTitle,
            time: newActivityTime,
            description: newActivityDescription,
            date: dateKey
        }

        setActivities(prev => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] || []), newActivity]
        }))

        setNewActivityTitle('')
        setNewActivityTime('')
        setNewActivityDescription('')
        closeModal()
    }

    const deleteActivity = (dateKey, activityId) => {
        setActivities(prev => ({
            ...prev,
            [dateKey]: prev[dateKey].filter(a => a.id !== activityId)
        }))
        setIsActivityDetailOpen(false)
    }

    const openActivityDetail = (activity) => {
        setSelectedActivity(activity)
        setIsActivityDetailOpen(true)
    }

    const closeActivityDetail = () => {
        setIsActivityDetailOpen(false)
        setSelectedActivity(null)
    }

    const getTodayActivities = () => {
        if (selectedDate) {
            const dateKey = selectedDate.toISOString().split('T')[0]
            return activities[dateKey] || []
        }
        return []
    }

    const changeView = (view) => {
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
            calendarApi.changeView(view)
            setCurrentView(view)
            setIsViewMenuOpen(false)
        }
    }

    const goToToday = () => {
        const calendarApi = calendarRef.current?.getApi()
        if (calendarApi) {
            calendarApi.today()
            setIsViewMenuOpen(false)
        }
    }

    return (
        <div className="h-screen bg-neutral-50 p-2 sm:p-4 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden max-w-7xl mx-auto w-full">
                {/* Calendar Container */}
                <div
                    className="bg-white p-3 sm:p-4 shadow-sm transition-all duration-300 relative calendar-container"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{height: `${heightLevels[heightLevel]}px`}}
                >
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView={currentView}
                        locale={viLocale}
                        headerToolbar={
                            isMobile
                                ? {
                                    left: '',
                                    center: 'prev,title,next',
                                    right: ''
                                }
                                : {
                                    left: 'prev,next,today',
                                    center: 'title',
                                    right: 'dayGridMonth,dayGridWeek,timeGridDay'
                                }
                        }
                        buttonText={{
                            today: 'Hôm nay',
                            month: 'Tháng',
                            week: 'Tuần',
                            day: 'Ngày'
                        }}
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        weekends={true}
                        height="100%"
                        eventDisplay="block"
                        eventClassNames="shadow-sm hover:shadow-md transition-all cursor-pointer"
                        nowIndicator={true}
                        handleWindowResize={true}
                        windowResizeDelay={100}
                        navLinks={false}
                        fixedWeekCount={false}
                        showNonCurrentDates={true}
                        views={{
                            dayGridMonth: {
                                dayMaxEventRows: 3
                            }
                        }}
                        dayCellContent={dayCellContent}
                        dateClick={handleDateClick}
                        dayCellClassNames={(arg) => {
                            const calendarApi = calendarRef.current?.getApi()
                            const currentMonth = calendarApi?.getDate().getMonth()
                            const cellMonth = arg.date.getMonth()

                            const classes = []

                            // Thêm class để vô hiệu hóa pointer events cho ngày ngoài tháng
                            if (currentMonth !== cellMonth) {
                                classes.push('pointer-events-none', 'cursor-default')
                            }

                            // Thêm border cho ngày đang được chọn
                            if (selectedDate) {
                                const selectedDateStr = selectedDate.toISOString().split('T')[0]
                                const cellDateStr = arg.date.toISOString().split('T')[0]
                                if (selectedDateStr === cellDateStr) {
                                    classes.push('selected-date')
                                }
                            }

                            return classes
                        }}
                    />



                </div>

                {/* Today Activities Section */}
                <div className="flex-1 bg-white mt-2 sm:mt-4 p-3 sm:p-4 shadow-sm overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800">
                            {selectedDate ? 'Hoạt động trong ngày' : 'Hoạt động hôm nay'}
                        </h3>
                        <span className="text-xs sm:text-sm text-gray-500">
                            {selectedDate
                                ? selectedDate.toLocaleDateString('vi-VN', {day: 'numeric', month: 'long'})
                                : new Date().toLocaleDateString('vi-VN', {day: 'numeric', month: 'long'})
                            }
                        </span>
                    </div>

                    {getTodayActivities().length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-400 mb-4">Chưa có hoạt động nào</p>
                            <button
                                onClick={openAddActivityModal}
                                className="bg-blue-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Thêm hoạt động
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 mb-4">
                                {getTodayActivities().map(activity => (
                                    <div
                                        key={activity.id}
                                        onClick={() => openActivityDetail(activity)}
                                        className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                                                    {activity.title}
                                                </h4>
                                                {activity.time && (
                                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                                        🕐 {activity.time}
                                                    </p>
                                                )}
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={openAddActivityModal}
                                className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Thêm hoạt động
                            </button>
                        </>
                    )}
                </div>

                {/* Floating Action Button for Mobile */}
                {isMobile && (
                    <div className="fixed bottom-10 right-4 z-10">
                        {/* Menu Items */}
                        {isViewMenuOpen && (
                            <div className="mb-3 flex flex-col gap-2 items-end animate-fade-in">
                                <button
                                    onClick={() => changeView('dayGridMonth')}
                                    className={`${
                                        currentView === 'dayGridMonth'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-700'
                                    } shadow-lg !rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-all`}
                                >
                                    <Calendar className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => changeView('dayGridWeek')}
                                    className={`${
                                        currentView === 'dayGridWeek'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-700'
                                    } shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-all`}
                                >
                                    <CalendarDays className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={() => changeView('timeGridDay')}
                                    className={`${
                                        currentView === 'timeGridDay'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-700'
                                    } shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-all`}
                                >
                                    <Clock className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={goToToday}
                                    className="bg-white text-gray-700 shadow-lg rounded-full w-12 h-12 flex items-center justify-center hover:scale-110 transition-all"
                                >
                                    <span className="text-sm font-bold">{new Date().getDate()}</span>
                                </button>
                            </div>
                        )}

                        {/* Main FAB */}
                        <button
                            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
                            className={`${
                                isViewMenuOpen ? 'bg-gray-700' : 'bg-blue-500'
                            } text-white shadow-lg rounded-full w-14 h-14 flex items-center justify-center hover:scale-110 transition-all`}
                        >
                            {isViewMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                )}

                {/* Add Activity Modal */}
                {isModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-end"
                        onClick={closeModal}
                    >
                        <div
                            className="bg-white w-full rounded-t-3xl p-4 sm:p-6 animate-slide-up max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-center mb-4 sm:mb-6">
                                <div className="inline-block bg-gray-100 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 mb-2 sm:mb-3">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                                        {selectedDate?.toLocaleDateString('vi-VN', {weekday: 'long'})}
                                    </p>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 px-4">
                                    {selectedDate?.toLocaleDateString('vi-VN', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </h2>
                            </div>

                            {lunarInfo && (
                                <div className="space-y-3 sm:space-y-4 mb-6">
                                    <div className="flex bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                                        <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-800">Âm lịch</h3>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-semibold text-gray-900 ml-11 sm:ml-13">
                                            {lunarInfo.lunarDate.day}/{lunarInfo.lunarDate.month}/{lunarInfo.lunarDate.year}
                                            {lunarInfo.lunarDate.isLeapMonth && <span className="text-sm sm:text-base text-gray-600 ml-2">(Nhuận)</span>}
                                        </p>
                                    </div>

                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                                        <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-800">Can Chi</h3>
                                        </div>
                                        <div className="ml-11 sm:ml-13 space-y-1.5 sm:space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs sm:text-sm text-gray-500 w-14 sm:w-16">Năm:</span>
                                                <span className="text-base sm:text-lg font-semibold text-gray-900">{lunarInfo.yearCanChi}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs sm:text-sm text-gray-500 w-14 sm:w-16">Tháng:</span>
                                                <span className="text-base sm:text-lg font-semibold text-gray-900">{lunarInfo.monthCanChi}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-xs sm:text-sm text-gray-500 w-14 sm:w-16">Ngày:</span>
                                                <span className="text-base sm:text-lg font-semibold text-gray-900">{lunarInfo.dayCanChi}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Add Activity Form */}
                            <div className="border-t pt-4">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Thêm hoạt động</h3>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Tên hoạt động"
                                        value={newActivityTitle}
                                        onChange={(e) => setNewActivityTitle(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />

                                    <input
                                        type="time"
                                        value={newActivityTime}
                                        onChange={(e) => setNewActivityTime(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />

                                    <textarea
                                        placeholder="Mô tả (tùy chọn)"
                                        value={newActivityDescription}
                                        onChange={(e) => setNewActivityDescription(e.target.value)}
                                        rows="3"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                    />

                                    <button
                                        onClick={addActivity}
                                        disabled={!newActivityTitle.trim()}
                                        className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                    >
                                        Thêm hoạt động
                                    </button>
                                </div>
                            </div>

                            {/* Activities List */}
                            {selectedDate && activities[selectedDate.toISOString().split('T')[0]]?.length > 0 && (
                                <div className="border-t mt-6 pt-4">
                                    <h3 className="text-lg font-bold text-gray-800 mb-3">Các hoạt động</h3>
                                    <div className="space-y-2">
                                        {activities[selectedDate.toISOString().split('T')[0]].map(activity => (
                                            <div
                                                key={activity.id}
                                                onClick={() => openActivityDetail(activity)}
                                                className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                                                        {activity.time && (
                                                            <p className="text-sm text-gray-500 mt-1">🕐 {activity.time}</p>
                                                        )}
                                                    </div>
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Activity Detail Modal */}
                {isActivityDetailOpen && selectedActivity && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[60] flex items-end"
                        onClick={closeActivityDetail}
                    >
                        <div
                            className="bg-white w-full rounded-t-3xl p-4 sm:p-6 animate-slide-up max-h-[75vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedActivity.title}</h2>
                                <button
                                    onClick={closeActivityDetail}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                {selectedActivity.time && (
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{selectedActivity.time}</span>
                                    </div>
                                )}

                                {selectedActivity.description && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-gray-700 whitespace-pre-wrap">{selectedActivity.description}</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => deleteActivity(selectedActivity.date, selectedActivity.id)}
                                    className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
                                >
                                    Xóa hoạt động
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default App
