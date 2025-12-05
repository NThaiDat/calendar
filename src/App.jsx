import {useState, useEffect, useRef} from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import {LunarCalendar} from '@dqcai/vn-lunar'
import './App.css'


function App() {
    const [currentView, setCurrentView] = useState('dayGridMonth')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [lunarInfo, setLunarInfo] = useState(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [heightLevel, setHeightLevel] = useState(1) // 0: nhỏ, 1: trung bình, 2: lớn
    const calendarRef = useRef(null)
    const touchStartRef = useRef({x: 0, y: 0})
    const touchEndRef = useRef({x: 0, y: 0})

    const heightLevels = [450, 550, 750] // 3 mức chiều cao

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleTouchStart = (e) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        }
    }

    const handleTouchMove = (e) => {
        touchEndRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        }
    }

    const handleTouchEnd = () => {
        const diffX = touchStartRef.current.x - touchEndRef.current.x
        const diffY = touchStartRef.current.y - touchEndRef.current.y
        const minSwipeDistance = 50

        // Vuốt ngang (trái/phải) - chuyển tháng/tuần/ngày
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
            const calendarApi = calendarRef.current?.getApi()
            if (calendarApi) {
                if (diffX > 0) {
                    // Vuốt sang trái - tháng/tuần/ngày tiếp theo
                    calendarApi.next()
                } else {
                    // Vuốt sang phải - tháng/tuần/ngày trước
                    calendarApi.prev()
                }
            }
        }
        // Vuốt dọc (lên/xuống) - thay đổi chiều cao theo 3 nấc
        else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipeDistance) {
            if (diffY > 0) {
                // Vuốt lên - giảm chiều cao
                setHeightLevel(prev => Math.max(0, prev - 1))
            } else {
                // Vuốt xuống - tăng chiều cao
                setHeightLevel(prev => Math.min(2, prev + 1))
            }
        }
    }

    const dayCellContent = (arg) => {
        const date = arg.date
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        const lunar = LunarCalendar.fromSolar(day, month, year)
        const lunarDay = lunar.lunarDate.day
        const lunarMonth = lunar.lunarDate.month

        return (
            <div className="flex flex-col items-center justify-center h-full">
                <div className="text-sm font-medium">{day}</div>
                <div className="text-xs text-gray-500">{lunarDay}/{lunarMonth}</div>
            </div>
        )
    }

    const handleDateClick = (arg) => {
        const date = arg.date
        const day = date.getDate()
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        const lunar = LunarCalendar.fromSolar(day, month, year)
        setSelectedDate(date)
        setLunarInfo(lunar)
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedDate(null)
        setLunarInfo(null)
    }

    return (
        <div className="min-h-screen bg-neutral-50 p-2 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Calendar Container */}
                <div
                    className="bg-white p-3 sm:p-4 md:p-6 lg:p-8 shadow-sm transition-all duration-300"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
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
                                    right: 'dayGridMonth,dayGridWeek,timeGridDay,today'
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
                        height={heightLevels[heightLevel]}
                        eventDisplay="block"
                        eventClassNames=" shadow-sm hover:shadow-md transition-all cursor-pointer"
                        nowIndicator={true}
                        aspectRatio={1.8}
                        handleWindowResize={true}
                        windowResizeDelay={100}
                        views={{
                            dayGridMonth: {
                                dayMaxEventRows: 3
                            }
                        }}
                        dayCellContent={dayCellContent}
                        dateClick={handleDateClick}
                    />
                </div>

                {/* Modal Bottom Sheet */}
                {isModalOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-end"
                        onClick={closeModal}
                    >
                        <div
                            className="bg-white w-full rounded-t-3xl p-4 sm:p-6 animate-slide-up max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drag indicator */}
                            {/*<div className="flex justify-center mb-3">*/}
                            {/*    <div className="w-12 h-1 bg-gray-300 rounded-full"></div>*/}
                            {/*</div>*/}

                            <div className="text-center mb-4 sm:mb-6">
                                <div
                                    className="inline-block bg-gray-100 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 mb-2 sm:mb-3">
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
                                <div className="space-y-3 sm:space-y-4">
                                    <div
                                        className="flex bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                                        <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-800">Âm lịch</h3>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-semibold text-gray-900 ml-11 sm:ml-13">
                                            {lunarInfo.lunarDate.day}/{lunarInfo.lunarDate.month}/{lunarInfo.lunarDate.year}
                                            {lunarInfo.lunarDate.isLeapMonth && <span
                                                className="text-sm sm:text-base text-gray-600 ml-2">(Nhuận)</span>}
                                        </p>
                                    </div>

                                    {/*<div*/}
                                    {/*    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5">*/}
                                    {/*    <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">*/}
                                    {/*        <h3 className="text-base sm:text-lg font-bold text-gray-800">Dương lịch</h3>*/}
                                    {/*    </div>*/}
                                    {/*    <p className="text-lg sm:text-xl font-semibold text-gray-900 ml-11 sm:ml-13">*/}
                                    {/*        {lunarInfo.dayOfWeek}*/}
                                    {/*    </p>*/}
                                    {/*    <p className="text-sm sm:text-base text-gray-600 ml-11 sm:ml-13 mt-1">*/}
                                    {/*        {lunarInfo.solarDate.day}/{lunarInfo.solarDate.month}/{lunarInfo.solarDate.year}*/}
                                    {/*    </p>*/}
                                    {/*</div>*/}

                                    <div
                                        className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5">
                                        <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
                                            <h3 className="text-base sm:text-lg font-bold text-gray-800">Can Chi</h3>
                                        </div>
                                        <div className="ml-11 sm:ml-13 space-y-1.5 sm:space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span
                                                    className="text-xs sm:text-sm text-gray-500 w-14 sm:w-16">Năm:</span>
                                                <span
                                                    className="text-base sm:text-lg font-semibold text-gray-900">{lunarInfo.yearCanChi}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span
                                                    className="text-xs sm:text-sm text-gray-500 w-14 sm:w-16">Tháng:</span>
                                                <span
                                                    className="text-base sm:text-lg font-semibold text-gray-900">{lunarInfo.monthCanChi}</span>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span
                                                    className="text-xs sm:text-sm text-gray-500 w-14 sm:w-16">Ngày:</span>
                                                <span
                                                    className="text-base sm:text-lg font-semibold text-gray-900">{lunarInfo.dayCanChi}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default App
