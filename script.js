// State management
let currentMode = 'view';
let dayData = {};
let currentYear = new Date().getFullYear();

// Initialize the app
function init() {
    loadData();
    updateTracker();
    setupEventListeners();
    setupMidnightUpdate();
}

// Load data from memory
function loadData() {
    const stored = localStorage.getItem('yearProgress_' + currentYear);
    if (stored) {
        try {
            dayData = JSON.parse(stored);
        } catch (e) {
            dayData = {};
        }
    }
}

// Save data to memory
function saveData() {
    localStorage.setItem('yearProgress_' + currentYear, JSON.stringify(dayData));
}

// Helper functions
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
}

function getDateFromDayNumber(dayNum, year) {
    const date = new Date(year, 0);
    date.setDate(dayNum);
    return date;
}

// Update the tracker display
function updateTracker() {
    const now = new Date();
    currentYear = now.getFullYear();
    const daysInYear = isLeapYear(currentYear) ? 366 : 365;
    const currentDayOfYear = getDayOfYear(now);
    const daysRemaining = daysInYear - currentDayOfYear;
    const progress = ((currentDayOfYear / daysInYear) * 100).toFixed(1);
    
    // Count productive and leisure days
    let productiveCount = 0;
    let leisureCount = 0;
    
    for (let i = 1; i <= currentDayOfYear; i++) {
        if (dayData[i] === 'productive') productiveCount++;
        if (dayData[i] === 'leisure') leisureCount++;
    }
    
    // Update date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    
    // Update stats
    document.getElementById('daysLived').textContent = currentDayOfYear;
    document.getElementById('daysRemaining').textContent = daysRemaining;
    document.getElementById('yearProgress').textContent = progress + '%';
    document.getElementById('progressBar').style.width = progress + '%';
    document.getElementById('yearLabel').textContent = currentYear;
    document.getElementById('productiveDays').textContent = productiveCount;
    document.getElementById('leisureDays').textContent = leisureCount;
    
    // Create circles
    renderCircles(daysInYear, currentDayOfYear);
}

// Render the day circles
function renderCircles(daysInYear, currentDayOfYear) {
    const grid = document.getElementById('circlesGrid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= daysInYear; i++) {
        const circle = document.createElement('div');
        circle.className = 'circle';
        circle.dataset.day = i;
        
        // Determine circle state
        if (i > currentDayOfYear) {
            circle.classList.add('future');
        } else {
            if (dayData[i] === 'productive') {
                circle.classList.add('productive');
            } else if (dayData[i] === 'leisure') {
                circle.classList.add('leisure');
            }
            
            if (i === currentDayOfYear) {
                circle.classList.add('today');
            }
        }
        
        // Tooltip
        const date = getDateFromDayNumber(i, currentYear);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        let status = dayData[i] ? dayData[i].charAt(0).toUpperCase() + dayData[i].slice(1) : 'Unmarked';
        if (i === currentDayOfYear) status = 'Today';
        if (i > currentDayOfYear) status = 'Future';
        
        circle.title = `Day ${i} - ${dateStr} (${status})`;
        
        // Click handler
        if (i <= currentDayOfYear) {
            circle.addEventListener('click', () => handleCircleClick(i));
        }
        
        grid.appendChild(circle);
    }
}

// Handle circle click based on mode
function handleCircleClick(dayNum) {
    if (currentMode === 'view') {
        showModal(dayNum);
    } else if (currentMode === 'productive') {
        markDay(dayNum, 'productive');
    } else if (currentMode === 'leisure') {
        markDay(dayNum, 'leisure');
    }
}

// Mark a day
function markDay(dayNum, type) {
    if (dayData[dayNum] === type) {
        delete dayData[dayNum];
    } else {
        dayData[dayNum] = type;
    }
    saveData();
    updateTracker();
}

// Show day detail modal
function showModal(dayNum) {
    const modal = document.getElementById('dayModal');
    const date = getDateFromDayNumber(dayNum, currentYear);
    const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const now = new Date();
    const currentDayOfYear = getDayOfYear(now);
    
    document.getElementById('modalTitle').textContent = `Day ${dayNum} of ${currentYear}`;
    document.getElementById('modalDate').textContent = dateStr;
    
    modal.classList.add('active');
    
    // Store current day in modal
    modal.dataset.currentDay = dayNum;
}

// Setup event listeners
function setupEventListeners() {
    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;
            
            // Update cursor style
            const grid = document.getElementById('circlesGrid');
            if (currentMode === 'view') {
                grid.style.cursor = 'default';
            } else {
                grid.style.cursor = 'pointer';
            }
        });
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all day markings? This cannot be undone.')) {
            dayData = {};
            saveData();
            updateTracker();
        }
    });
    
    // Modal buttons
    document.getElementById('modalClose').addEventListener('click', closeModal);
    
    document.getElementById('markProductiveBtn').addEventListener('click', () => {
        const dayNum = parseInt(document.getElementById('dayModal').dataset.currentDay);
        markDay(dayNum, 'productive');
        closeModal();
    });
    
    document.getElementById('markLeisureBtn').addEventListener('click', () => {
        const dayNum = parseInt(document.getElementById('dayModal').dataset.currentDay);
        markDay(dayNum, 'leisure');
        closeModal();
    });
    
    document.getElementById('clearMarkBtn').addEventListener('click', () => {
        const dayNum = parseInt(document.getElementById('dayModal').dataset.currentDay);
        delete dayData[dayNum];
        saveData();
        updateTracker();
        closeModal();
    });
    
    // Close modal on background click
    document.getElementById('dayModal').addEventListener('click', (e) => {
        if (e.target.id === 'dayModal') {
            closeModal();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Close modal
function closeModal() {
    document.getElementById('dayModal').classList.remove('active');
}

// Setup midnight update
function setupMidnightUpdate() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
        updateTracker();
        // Then update every 24 hours
        setInterval(updateTracker, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}