import chalk from 'chalk';
import util from 'util';

const log = {
    info: (message) => {
        console.log(chalk.blue(`${formatMessage(message)}`));
    },
    success: (message) => {
        console.log(chalk.green(`[SUCCESS] ${formatMessage(message)}`));
    },
    warning: (message) => {
        console.log(chalk.yellow(`[WARNING] ${formatMessage(message)}`));
    },
    error: (message) => {
        console.log(chalk.red(`[ERROR] ${formatMessage(message)}`));
    },
};

function formatMessage(message) {
    if (typeof message === 'object') {
        return util.inspect(message, { colors: true, depth: null });
    }
    return message;
}

export default log;