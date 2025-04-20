export const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

export const parseDuration = (formattedDuration) => {
    const [hours, minutes, seconds] = formattedDuration.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
};

export function parseLastStringToEndDate(str) {
    const regex = /([A-Za-z]{3}) ([A-Za-z]{3}) (\d{1,2}) (\d{2}:\d{2}) - (\d{2}:\d{2})/;
    const match = str.match(regex);

    if (!match) return null;

    const [, , month, day, , endTime] = match;

    const [hours, minutes] = endTime.split(':').map(Number);
    const year = new Date().getFullYear();
    const monthIndex = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(month);

    if (monthIndex === -1) return null;

    return new Date(year, monthIndex, parseInt(day), hours, minutes);
}

export function addDurationToExisted(new_, old) {
    const [newHours, newMinutes, newSeconds] = new_.split(':').map(Number);
    const [oldHours, oldMinutes, oldSeconds] = old.split(':').map(Number);

    const totalSeconds = newSeconds + oldSeconds;
    const totalMinutes = newMinutes + oldMinutes + Math.floor(totalSeconds / 60);
    const totalHours = newHours + oldHours + Math.floor(totalMinutes / 60);

    const resultHours = totalHours.toString().padStart(2, '0');
    const resultMinutes = (totalMinutes % 60).toString().padStart(2, '0');
    const resultSeconds = (totalSeconds % 60).toString().padStart(2, '0');

    return `${resultHours}:${resultMinutes}:${resultSeconds}`;
}

export function getLastDateOfOnline(activities) {
    return activities.reduce((latest, activity) => {
        const activityDate = parseLastStringToEndDate(activity.date);
        return activityDate && activityDate > latest ? activityDate : latest;
    }, new Date(0));
}

export function addDurations(a, b) {
    const [h1, m1, s1] = a.split(':').map(Number);
    const [h2, m2, s2] = b.split(':').map(Number);

    const totalSeconds = s1 + s2;
    const totalMinutes = m1 + m2 + Math.floor(totalSeconds / 60);
    const totalHours = h1 + h2 + Math.floor(totalMinutes / 60);

    return `${String(totalHours).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function parseDurationFromString(dateString) {
    if (typeof dateString !== 'string') return 0;
    const match = dateString.match(/\((\d+):(\d+)\)/);
    if (!match) return 0;
    const [, minutes, seconds] = match.map(Number);
    return minutes * 60 + seconds;
}

/**
 * 
 * @param {*} data Activity Schema
 * @returns  score = durationInMinutes + (totalSessions × 3) + (uniqueIPs × 9)
 **/
export function calculateTopParticipants(users, limit = 0) {
    const result = [];

    for (const user of users) {
        const ipSet = new Set();
        let duration_student_seconds = parseDuration(user?.durationOfActivity || "00:00:00");
        for (const session of user.activities || []) {
            ipSet.add(session.ip);
        }

        const durationMinutes = duration_student_seconds / 60;
        const sessionCount = user.activities?.length || 0;
        const uniqueIPs = ipSet.size;

        const score = Math.round(durationMinutes + sessionCount * 3 + uniqueIPs * 9);
        result.push({
            username: user.username,
            fullName: `${user.firstName} ${user.lastName}`,
            totalSessions: sessionCount,
            totalDuration: formatDuration(duration_student_seconds),
            uniqueIPs,
            score
        });
    }

    return !limit ? result.sort((a, b) => b.score - a.score) : result.sort((a, b) => b.score - a.score).slice(0, limit);
}