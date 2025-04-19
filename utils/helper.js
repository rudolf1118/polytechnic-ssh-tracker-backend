export const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

export function parseLastStringToEndDate(str) {
    const regex = /([A-Za-z]{3}) ([A-Za-z]{3}) (\d{1,2}) (\d{2}:\d{2}) - (\d{2}:\d{2})/;
    const match = str.match(regex);

    if (!match) return null;

    const [, , month, day, , endTime] = match;

    const year = new Date().getFullYear();
    const endDateString = `${month} ${day} ${year} ${endTime}`;

    const endDate = new Date(endDateString);

    return endDate;
}

export function getLastDateOfOnline(activities) {
    const lastDate = activities.reduce((latest, activity) => {
        const activityDate = new Date(activity.date);
        return activityDate > latest ? activityDate : latest;
    }, new Date(0));

    return lastDate;
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